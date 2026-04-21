import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { IsNull, type Repository } from 'typeorm';

import { EnterpriseConfigAuditService } from 'src/modules/enterprise/audit/services/enterprise-config-audit.service';
import { EnterpriseEntityBindingService } from 'src/modules/enterprise/entity-binding/services/enterprise-entity-binding.service';
import { CreateEnterpriseFieldDto } from 'src/modules/enterprise/field-definition/dtos/create-enterprise-field.dto';
import { UpdateEnterpriseFieldDto } from 'src/modules/enterprise/field-definition/dtos/update-enterprise-field.dto';
import { EnterpriseFieldDefinitionEntity } from 'src/modules/enterprise/field-definition/enterprise-field-definition.entity';
import { EnterpriseFieldOptionService } from 'src/modules/enterprise/field-definition/services/enterprise-field-option.service';
import { EnterpriseMetadataProjectionService } from 'src/modules/enterprise/projection/services/enterprise-metadata-projection.service';
import { EnterpriseFieldType } from 'src/modules/enterprise/shared/types/enterprise-field-type';
import { EnterpriseSyncStatus } from 'src/modules/enterprise/shared/types/enterprise-sync-status';

@Injectable()
export class EnterpriseFieldDefinitionService {
  constructor(
    @InjectRepository(EnterpriseFieldDefinitionEntity)
    private readonly enterpriseFieldDefinitionRepository: Repository<EnterpriseFieldDefinitionEntity>,
    private readonly enterpriseEntityBindingService: EnterpriseEntityBindingService,
    private readonly enterpriseFieldOptionService: EnterpriseFieldOptionService,
    private readonly enterpriseMetadataProjectionService: EnterpriseMetadataProjectionService,
    private readonly enterpriseConfigAuditService: EnterpriseConfigAuditService,
  ) {}

  async findMany(workspaceId: string, entityType?: string) {
    if (!entityType) {
      return this.enterpriseFieldDefinitionRepository.find({
        where: {
          workspaceId,
          deletedAt: IsNull(),
        },
        order: {
          sortOrder: 'ASC',
          createdAt: 'ASC',
        },
      });
    }

    const binding =
      await this.enterpriseEntityBindingService.resolveBindingOrFail(
        workspaceId,
        entityType as never,
      );

    return this.enterpriseFieldDefinitionRepository.find({
      where: {
        workspaceId,
        entityBindingId: binding.id,
        deletedAt: IsNull(),
      },
      order: {
        sortOrder: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  async findOneOrFail(workspaceId: string, fieldDefinitionId: string) {
    const fieldDefinition =
      await this.enterpriseFieldDefinitionRepository.findOne({
        where: {
          id: fieldDefinitionId,
          workspaceId,
        },
      });

    if (!fieldDefinition || fieldDefinition.deletedAt) {
      throw new NotFoundException(
        `Enterprise field definition ${fieldDefinitionId} was not found`,
      );
    }

    return fieldDefinition;
  }

  async create(
    workspaceId: string,
    dto: CreateEnterpriseFieldDto,
    actorWorkspaceMemberId?: string | null,
  ) {
    this.assertSupportedFieldType(dto.fieldType);

    const binding = await this.enterpriseEntityBindingService.resolveBindingOrFail(
      workspaceId,
      dto.entityType,
    );

    const existingField =
      await this.enterpriseFieldDefinitionRepository.findOne({
        where: {
          workspaceId,
          entityBindingId: binding.id,
          fieldCode: dto.fieldCode,
        },
      });

    if (existingField && !existingField.deletedAt) {
      throw new BadRequestException(
        `Field code ${dto.fieldCode} already exists for ${dto.entityType}`,
      );
    }

    const fieldDefinition = await this.enterpriseFieldDefinitionRepository.save(
      this.enterpriseFieldDefinitionRepository.create({
        workspaceId,
        entityBindingId: binding.id,
        fieldCode: dto.fieldCode,
        fieldName: dto.fieldName,
        fieldType: dto.fieldType,
        groupCode: dto.groupCode ?? null,
        visibleInModules: dto.visibleInModules ?? null,
        validationJson: dto.validation ?? null,
        defaultValueJson: dto.defaultValue ?? null,
        searchable: dto.searchable ?? false,
        exportable: dto.exportable ?? false,
        systemField: false,
        enabled: dto.enabled ?? true,
        sortOrder: dto.sortOrder ?? 0,
        storageStrategy: 'enterprise_eav',
        metadataFieldId: null,
        syncStatus: EnterpriseSyncStatus.PENDING,
        syncErrorMessage: null,
        createdByWorkspaceMemberId: actorWorkspaceMemberId ?? null,
        updatedByWorkspaceMemberId: actorWorkspaceMemberId ?? null,
        deletedAt: null,
      }),
    );

    if (dto.options?.length) {
      await this.enterpriseFieldOptionService.replaceOptions(
        workspaceId,
        fieldDefinition.id,
        dto.options,
      );
    }

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.field.create',
      resourceType: 'enterpriseFieldDefinition',
      resourceId: fieldDefinition.id,
      actorWorkspaceMemberId,
      afterJson: {
        entityType: dto.entityType,
        fieldCode: fieldDefinition.fieldCode,
        fieldType: fieldDefinition.fieldType,
      },
    });

    await this.enterpriseMetadataProjectionService.projectFieldDefinition(
      fieldDefinition.id,
      workspaceId,
    );

    return this.findOneOrFail(workspaceId, fieldDefinition.id);
  }

  async update(
    workspaceId: string,
    fieldDefinitionId: string,
    dto: UpdateEnterpriseFieldDto,
    actorWorkspaceMemberId?: string | null,
  ) {
    const fieldDefinition = await this.findOneOrFail(workspaceId, fieldDefinitionId);

    if (dto.fieldType && dto.fieldType !== fieldDefinition.fieldType) {
      this.assertCompatibleFieldTypeChange(fieldDefinition.fieldType, dto.fieldType);
    }

    const beforeJson = {
      fieldName: fieldDefinition.fieldName,
      fieldType: fieldDefinition.fieldType,
      groupCode: fieldDefinition.groupCode,
      enabled: fieldDefinition.enabled,
    };

    const updatedFieldDefinition =
      await this.enterpriseFieldDefinitionRepository.save({
        ...fieldDefinition,
        fieldName: dto.fieldName ?? fieldDefinition.fieldName,
        fieldType: dto.fieldType ?? fieldDefinition.fieldType,
        groupCode:
          dto.groupCode === undefined
            ? fieldDefinition.groupCode
            : dto.groupCode,
        visibleInModules:
          dto.visibleInModules === undefined
            ? fieldDefinition.visibleInModules
            : dto.visibleInModules,
        validationJson:
          dto.validation === undefined
            ? fieldDefinition.validationJson
            : (dto.validation as Record<string, unknown> | null),
        defaultValueJson:
          dto.defaultValue === undefined
            ? fieldDefinition.defaultValueJson
            : dto.defaultValue,
        searchable: dto.searchable ?? fieldDefinition.searchable,
        exportable: dto.exportable ?? fieldDefinition.exportable,
        enabled: dto.enabled ?? fieldDefinition.enabled,
        sortOrder: dto.sortOrder ?? fieldDefinition.sortOrder,
        syncStatus: EnterpriseSyncStatus.PENDING,
        syncErrorMessage: null,
        updatedByWorkspaceMemberId: actorWorkspaceMemberId ?? null,
      });

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.field.update',
      resourceType: 'enterpriseFieldDefinition',
      resourceId: fieldDefinition.id,
      actorWorkspaceMemberId,
      beforeJson,
      afterJson: {
        fieldName: updatedFieldDefinition.fieldName,
        fieldType: updatedFieldDefinition.fieldType,
        groupCode: updatedFieldDefinition.groupCode,
        enabled: updatedFieldDefinition.enabled,
      },
    });

    await this.enterpriseMetadataProjectionService.projectFieldDefinition(
      updatedFieldDefinition.id,
      workspaceId,
    );

    return updatedFieldDefinition;
  }

  async remove(
    workspaceId: string,
    fieldDefinitionId: string,
    actorWorkspaceMemberId?: string | null,
  ) {
    const fieldDefinition = await this.findOneOrFail(workspaceId, fieldDefinitionId);

    await this.enterpriseFieldDefinitionRepository.save({
      ...fieldDefinition,
      enabled: false,
      deletedAt: new Date(),
      syncStatus: EnterpriseSyncStatus.PENDING,
      syncErrorMessage: null,
      updatedByWorkspaceMemberId: actorWorkspaceMemberId ?? null,
    });

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.field.delete',
      resourceType: 'enterpriseFieldDefinition',
      resourceId: fieldDefinition.id,
      actorWorkspaceMemberId,
      beforeJson: {
        enabled: fieldDefinition.enabled,
        deletedAt: fieldDefinition.deletedAt,
      },
      afterJson: {
        enabled: false,
      },
    });

    await this.enterpriseMetadataProjectionService.projectFieldDefinition(
      fieldDefinition.id,
      workspaceId,
    );

    return { success: true };
  }

  private assertSupportedFieldType(fieldType: string) {
    if (!Object.values(EnterpriseFieldType).includes(fieldType as EnterpriseFieldType)) {
      throw new BadRequestException(
        `Unsupported enterprise field type ${fieldType}`,
      );
    }
  }

  private assertCompatibleFieldTypeChange(previous: string, next: string) {
    if (previous === next) {
      return;
    }

    const compatiblePairs = new Set([
      `${EnterpriseFieldType.TEXT}:${EnterpriseFieldType.TEXTAREA}`,
      `${EnterpriseFieldType.TEXTAREA}:${EnterpriseFieldType.TEXT}`,
    ]);

    if (!compatiblePairs.has(`${previous}:${next}`)) {
      throw new BadRequestException(
        `Incompatible field type change from ${previous} to ${next}`,
      );
    }
  }
}
