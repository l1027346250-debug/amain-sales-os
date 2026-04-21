import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';

import { DeepPartial, Repository } from 'typeorm';
import {
  type FieldMetadataOptions,
  type FieldMetadataSettings,
  FieldMetadataType,
} from 'twenty-shared/types';

import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { EnterpriseFieldDefinitionEntity } from 'src/modules/enterprise/field-definition/enterprise-field-definition.entity';
import { EnterpriseFieldOptionEntity } from 'src/modules/enterprise/field-definition/enterprise-field-option.entity';
import { EnterpriseEntityBindingService } from 'src/modules/enterprise/entity-binding/services/enterprise-entity-binding.service';
import { EnterpriseConfigAuditService } from 'src/modules/enterprise/audit/services/enterprise-config-audit.service';
import { EnterpriseFieldType } from 'src/modules/enterprise/shared/types/enterprise-field-type';
import { EnterpriseSyncStatus } from 'src/modules/enterprise/shared/types/enterprise-sync-status';

@Injectable()
export class EnterpriseMetadataProjectionService {
  constructor(
    @InjectRepository(FieldMetadataEntity)
    private readonly fieldMetadataRepository: Repository<FieldMetadataEntity>,
    @InjectRepository(ObjectMetadataEntity)
    private readonly objectMetadataRepository: Repository<ObjectMetadataEntity>,
    @InjectRepository(EnterpriseFieldDefinitionEntity)
    private readonly enterpriseFieldDefinitionRepository: Repository<EnterpriseFieldDefinitionEntity>,
    @InjectRepository(EnterpriseFieldOptionEntity)
    private readonly enterpriseFieldOptionRepository: Repository<EnterpriseFieldOptionEntity>,
    private readonly enterpriseEntityBindingService: EnterpriseEntityBindingService,
    private readonly enterpriseConfigAuditService: EnterpriseConfigAuditService,
  ) {}

  async projectFieldDefinition(fieldDefinitionId: string, workspaceId: string) {
    const fieldDefinition =
      await this.enterpriseFieldDefinitionRepository.findOne({
        where: {
          id: fieldDefinitionId,
          workspaceId,
        },
      });

    if (!fieldDefinition) {
      throw new NotFoundException(
        `Enterprise field definition ${fieldDefinitionId} was not found`,
      );
    }

    await this.enterpriseFieldDefinitionRepository.update(fieldDefinition.id, {
      syncStatus: EnterpriseSyncStatus.SYNCING,
      syncErrorMessage: null,
    });

    try {
      const binding =
        await this.enterpriseEntityBindingService.resolveBindingByIdOrFail(
          workspaceId,
          fieldDefinition.entityBindingId,
        );

      const objectMetadata = await this.objectMetadataRepository.findOne({
        where: {
          id: binding.objectMetadataId,
          workspaceId,
        },
      });

      if (!objectMetadata) {
        throw new NotFoundException(
          `Object metadata ${binding.objectMetadataId} was not found`,
        );
      }

      const fieldMetadataType = this.mapEnterpriseFieldTypeToMetadataFieldType(
        fieldDefinition.fieldType,
      );

      const options = await this.enterpriseFieldOptionRepository.find({
        where: {
          workspaceId,
          fieldDefinitionId: fieldDefinition.id,
        },
        order: {
          sortOrder: 'ASC',
          createdAt: 'ASC',
        },
      });

      const metadataField =
        fieldDefinition.metadataFieldId === null
          ? null
          : await this.fieldMetadataRepository.findOne({
              where: {
                id: fieldDefinition.metadataFieldId,
                workspaceId,
              },
            });

      const payload: DeepPartial<FieldMetadataEntity> = {
        workspaceId,
        applicationId: objectMetadata.applicationId,
        objectMetadataId: objectMetadata.id,
        type: fieldMetadataType,
        name: fieldDefinition.fieldCode,
        label: fieldDefinition.fieldName,
        description: null,
        icon: null,
        defaultValue:
          fieldDefinition.defaultValueJson as FieldMetadataEntity['defaultValue'],
        standardOverrides: null,
        options: this.mapOptions(fieldDefinition.fieldType, options),
        settings: this.mapSettings(fieldDefinition.fieldType),
        isCustom: true,
        isActive: fieldDefinition.enabled,
        isSystem: false,
        isUIReadOnly: false,
        isNullable: true,
        isUnique: false,
        isLabelSyncedWithName: false,
        relationTargetFieldMetadataId: null,
        relationTargetObjectMetadataId: null,
        morphId: null,
      };

      const savedFieldMetadata: FieldMetadataEntity = metadataField
        ? await this.fieldMetadataRepository.save({
            ...metadataField,
            ...payload,
          })
        : await this.fieldMetadataRepository.save(
            this.fieldMetadataRepository.create({
              universalIdentifier: randomUUID(),
              ...payload,
            }),
          );

      await this.enterpriseFieldDefinitionRepository.update(fieldDefinition.id, {
        metadataFieldId: savedFieldMetadata.id,
        syncStatus: EnterpriseSyncStatus.SYNCED,
        syncErrorMessage: null,
      });

      await this.enterpriseConfigAuditService.createLog({
        workspaceId,
        action: 'enterprise.field.project',
        resourceType: 'enterpriseFieldDefinition',
        resourceId: fieldDefinition.id,
        afterJson: {
          metadataFieldId: savedFieldMetadata.id,
          objectMetadataId: objectMetadata.id,
        },
        contextJson: {
          entityType: binding.entityType,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown projection failure';

      await this.enterpriseFieldDefinitionRepository.update(fieldDefinition.id, {
        syncStatus: EnterpriseSyncStatus.FAILED,
        syncErrorMessage: message,
      });

      await this.enterpriseConfigAuditService.createLog({
        workspaceId,
        action: 'enterprise.field.project.failed',
        resourceType: 'enterpriseFieldDefinition',
        resourceId: fieldDefinition.id,
        contextJson: {
          error: message,
        },
      });

      throw error;
    }
  }

  private mapEnterpriseFieldTypeToMetadataFieldType(fieldType: string) {
    switch (fieldType) {
      case EnterpriseFieldType.TEXT:
      case EnterpriseFieldType.TEXTAREA:
        return FieldMetadataType.TEXT;
      case EnterpriseFieldType.NUMBER:
        return FieldMetadataType.NUMBER;
      case EnterpriseFieldType.SELECT:
        return FieldMetadataType.SELECT;
      case EnterpriseFieldType.MULTI_SELECT:
        return FieldMetadataType.MULTI_SELECT;
      case EnterpriseFieldType.BOOLEAN:
        return FieldMetadataType.BOOLEAN;
      case EnterpriseFieldType.DATE:
        return FieldMetadataType.DATE;
      default:
        throw new BadRequestException(
          `Unsupported enterprise field type ${fieldType}`,
        );
    }
  }

  private mapOptions(
    fieldType: string,
    options: EnterpriseFieldOptionEntity[],
  ): FieldMetadataEntity['options'] {
    if (
      fieldType !== EnterpriseFieldType.SELECT &&
      fieldType !== EnterpriseFieldType.MULTI_SELECT
    ) {
      return null;
    }

    return options.map((option) => ({
      value: option.optionCode,
      label: option.optionLabel,
      color: option.color,
      position: option.sortOrder,
    })) as FieldMetadataOptions;
  }

  private mapSettings(fieldType: string): FieldMetadataEntity['settings'] {
    switch (fieldType) {
      case EnterpriseFieldType.TEXTAREA:
        return {
          displayedMaxRows: 6,
        } as FieldMetadataSettings;
      case EnterpriseFieldType.TEXT:
      case EnterpriseFieldType.NUMBER:
      case EnterpriseFieldType.SELECT:
      case EnterpriseFieldType.MULTI_SELECT:
      case EnterpriseFieldType.BOOLEAN:
      case EnterpriseFieldType.DATE:
        return null;
      default:
        throw new BadRequestException(
          `Unsupported enterprise field settings for ${fieldType}`,
        );
    }
  }
}
