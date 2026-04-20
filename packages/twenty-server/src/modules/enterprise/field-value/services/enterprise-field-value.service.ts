import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { EnterpriseConfigAuditService } from 'src/modules/enterprise/audit/services/enterprise-config-audit.service';
import { EnterpriseEntityBindingService } from 'src/modules/enterprise/entity-binding/services/enterprise-entity-binding.service';
import { EnterpriseFieldDefinitionService } from 'src/modules/enterprise/field-definition/services/enterprise-field-definition.service';
import { EnterpriseFieldValueEntity } from 'src/modules/enterprise/field-value/enterprise-field-value.entity';
import { UpdateEnterpriseRecordFieldValuesDto } from 'src/modules/enterprise/field-value/dtos/update-enterprise-record-field-values.dto';
import { EnterpriseFieldType } from 'src/modules/enterprise/shared/types/enterprise-field-type';

@Injectable()
export class EnterpriseFieldValueService {
  constructor(
    @InjectRepository(EnterpriseFieldValueEntity)
    private readonly enterpriseFieldValueRepository: Repository<EnterpriseFieldValueEntity>,
    private readonly enterpriseEntityBindingService: EnterpriseEntityBindingService,
    private readonly enterpriseFieldDefinitionService: EnterpriseFieldDefinitionService,
    private readonly enterpriseConfigAuditService: EnterpriseConfigAuditService,
  ) {}

  async findManyForRecord(
    workspaceId: string,
    entityType: string,
    recordId: string,
  ) {
    const binding = await this.enterpriseEntityBindingService.resolveBindingOrFail(
      workspaceId,
      entityType as never,
    );

    return this.enterpriseFieldValueRepository.find({
      where: {
        workspaceId,
        entityBindingId: binding.id,
        recordId,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async updateManyForRecord(
    workspaceId: string,
    entityType: string,
    recordId: string,
    dto: UpdateEnterpriseRecordFieldValuesDto,
    actorWorkspaceMemberId?: string | null,
  ) {
    const binding = await this.enterpriseEntityBindingService.resolveBindingOrFail(
      workspaceId,
      entityType as never,
    );

    const savedValues: EnterpriseFieldValueEntity[] = [];

    for (const item of dto.values) {
      const fieldDefinition =
        await this.enterpriseFieldDefinitionService.findOneOrFail(
          workspaceId,
          item.fieldDefinitionId,
        );

      const existingValue = await this.enterpriseFieldValueRepository.findOne({
        where: {
          workspaceId,
          entityBindingId: binding.id,
          recordId,
          fieldDefinitionId: item.fieldDefinitionId,
        },
      });

      const typedValuePayload = this.mapValueByFieldType(
        fieldDefinition.fieldType,
        item.value,
      );

      const savedValue = await this.enterpriseFieldValueRepository.save(
        this.enterpriseFieldValueRepository.create({
          ...(existingValue ?? {}),
          workspaceId,
          entityBindingId: binding.id,
          recordId,
          fieldDefinitionId: item.fieldDefinitionId,
          ...typedValuePayload,
        }),
      );

      savedValues.push(savedValue);
    }

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.fieldValue.update',
      resourceType: 'enterpriseFieldValue',
      resourceId: recordId,
      actorWorkspaceMemberId,
      afterJson: {
        entityType,
        count: dto.values.length,
      },
    });

    return savedValues;
  }

  private mapValueByFieldType(fieldType: string, value: unknown) {
    switch (fieldType) {
      case EnterpriseFieldType.TEXT:
      case EnterpriseFieldType.TEXTAREA:
      case EnterpriseFieldType.SELECT:
        return {
          valueJson: value,
          valueString: value === null || value === undefined ? null : String(value),
          valueNumber: null,
          valueBoolean: null,
          valueDate: null,
          valueStringArray: null,
        };
      case EnterpriseFieldType.MULTI_SELECT:
        return {
          valueJson: value,
          valueString: null,
          valueNumber: null,
          valueBoolean: null,
          valueDate: null,
          valueStringArray: Array.isArray(value)
            ? value.map((entry) => String(entry))
            : null,
        };
      case EnterpriseFieldType.NUMBER:
        return {
          valueJson: value,
          valueString: null,
          valueNumber:
            value === null || value === undefined ? null : String(Number(value)),
          valueBoolean: null,
          valueDate: null,
          valueStringArray: null,
        };
      case EnterpriseFieldType.BOOLEAN:
        return {
          valueJson: value,
          valueString: null,
          valueNumber: null,
          valueBoolean:
            value === null || value === undefined ? null : Boolean(value),
          valueDate: null,
          valueStringArray: null,
        };
      case EnterpriseFieldType.DATE:
        return {
          valueJson: value,
          valueString: null,
          valueNumber: null,
          valueBoolean: null,
          valueDate:
            value === null || value === undefined ? null : new Date(String(value)),
          valueStringArray: null,
        };
      default:
        return {
          valueJson: value,
          valueString: value === null || value === undefined ? null : String(value),
          valueNumber: null,
          valueBoolean: null,
          valueDate: null,
          valueStringArray: null,
        };
    }
  }
}
