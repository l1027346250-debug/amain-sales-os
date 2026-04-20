import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { EnterpriseConfigAuditService } from 'src/modules/enterprise/audit/services/enterprise-config-audit.service';
import { UpsertEnterpriseFieldLayoutsDto } from 'src/modules/enterprise/field-layout/dtos/upsert-enterprise-field-layouts.dto';
import { EnterpriseFieldLayoutConfigEntity } from 'src/modules/enterprise/field-layout/enterprise-field-layout-config.entity';
import { EnterpriseEntityBindingService } from 'src/modules/enterprise/entity-binding/services/enterprise-entity-binding.service';

@Injectable()
export class EnterpriseFieldLayoutService {
  constructor(
    @InjectRepository(EnterpriseFieldLayoutConfigEntity)
    private readonly enterpriseFieldLayoutConfigRepository: Repository<EnterpriseFieldLayoutConfigEntity>,
    private readonly enterpriseEntityBindingService: EnterpriseEntityBindingService,
    private readonly enterpriseConfigAuditService: EnterpriseConfigAuditService,
  ) {}

  async findMany(
    workspaceId: string,
    entityType: string,
    pageScene: string,
    roleId?: string,
  ) {
    const binding = await this.enterpriseEntityBindingService.resolveBindingOrFail(
      workspaceId,
      entityType as never,
    );

    return this.enterpriseFieldLayoutConfigRepository.find({
      where: {
        workspaceId,
        entityBindingId: binding.id,
        pageScene,
        roleId: roleId ?? null,
      },
      order: {
        sortOrder: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  async upsertMany(
    workspaceId: string,
    dto: UpsertEnterpriseFieldLayoutsDto,
    actorWorkspaceMemberId?: string | null,
  ) {
    const binding = await this.enterpriseEntityBindingService.resolveBindingOrFail(
      workspaceId,
      dto.entityType,
    );

    const existingLayouts = await this.enterpriseFieldLayoutConfigRepository.find({
      where: {
        workspaceId,
        entityBindingId: binding.id,
        pageScene: dto.pageScene,
        roleId: dto.roleId ?? null,
      },
    });

    if (existingLayouts.length) {
      await this.enterpriseFieldLayoutConfigRepository.remove(existingLayouts);
    }

    const savedLayouts = await this.enterpriseFieldLayoutConfigRepository.save(
      dto.items.map((item) =>
        this.enterpriseFieldLayoutConfigRepository.create({
          workspaceId,
          entityBindingId: binding.id,
          pageScene: dto.pageScene,
          fieldDefinitionId: item.fieldDefinitionId,
          groupCode: item.groupCode ?? null,
          required: item.required,
          visible: item.visible,
          readonly: item.readonly,
          sortOrder: item.sortOrder,
          roleId: dto.roleId ?? null,
        }),
      ),
    );

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.fieldLayout.upsert',
      resourceType: 'enterpriseFieldLayout',
      actorWorkspaceMemberId,
      afterJson: {
        entityType: dto.entityType,
        pageScene: dto.pageScene,
        count: savedLayouts.length,
      },
    });

    return savedLayouts;
  }
}
