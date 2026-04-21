import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { In, Repository } from 'typeorm';

import { EnterpriseConfigAuditService } from 'src/modules/enterprise/audit/services/enterprise-config-audit.service';
import { CreateEnterpriseSalesPlaybookDto } from 'src/modules/enterprise/sales-playbook/dtos/create-enterprise-sales-playbook.dto';
import { ReplaceEnterpriseSalesPlaybookItemsDto } from 'src/modules/enterprise/sales-playbook/dtos/replace-enterprise-sales-playbook-items.dto';
import { ReplaceEnterpriseSalesPlaybookStagesDto } from 'src/modules/enterprise/sales-playbook/dtos/replace-enterprise-sales-playbook-stages.dto';
import { UpdateEnterpriseSalesPlaybookDto } from 'src/modules/enterprise/sales-playbook/dtos/update-enterprise-sales-playbook.dto';
import { EnterpriseSalesPlaybookItemEntity } from 'src/modules/enterprise/sales-playbook/enterprise-sales-playbook-item.entity';
import { EnterpriseSalesPlaybookStageEntity } from 'src/modules/enterprise/sales-playbook/enterprise-sales-playbook-stage.entity';
import { EnterpriseSalesPlaybookEntity } from 'src/modules/enterprise/sales-playbook/enterprise-sales-playbook.entity';

const DEFAULT_STAGE_NAMES = [
  '线索到达',
  '商机',
  '询盘首回',
  '建立链接',
  '需求画像',
  '报价和确认报价',
  '样品环节',
  '大货单确认',
  '备货中',
  '发货后',
  '好评邀请',
  '售后问题',
  '输单',
];

@Injectable()
export class EnterpriseSalesPlaybookService {
  constructor(
    @InjectRepository(EnterpriseSalesPlaybookEntity)
    private readonly enterpriseSalesPlaybookRepository: Repository<EnterpriseSalesPlaybookEntity>,
    @InjectRepository(EnterpriseSalesPlaybookStageEntity)
    private readonly enterpriseSalesPlaybookStageRepository: Repository<EnterpriseSalesPlaybookStageEntity>,
    @InjectRepository(EnterpriseSalesPlaybookItemEntity)
    private readonly enterpriseSalesPlaybookItemRepository: Repository<EnterpriseSalesPlaybookItemEntity>,
    private readonly enterpriseConfigAuditService: EnterpriseConfigAuditService,
  ) {}

  async findPlaybooks(workspaceId: string) {
    await this.ensureDefaultPlaybook(workspaceId);

    return this.enterpriseSalesPlaybookRepository.find({
      where: { workspaceId },
      order: { enabled: 'DESC', updatedAt: 'DESC' },
    });
  }

  async createPlaybook(
    workspaceId: string,
    dto: CreateEnterpriseSalesPlaybookDto,
    actorWorkspaceMemberId?: string | null,
  ) {
    const playbookName = dto.playbookName?.trim();

    if (!playbookName) {
      throw new BadRequestException('playbookName is required');
    }

    const playbook = await this.enterpriseSalesPlaybookRepository.save(
      this.enterpriseSalesPlaybookRepository.create({
        workspaceId,
        playbookName,
        description: dto.description?.trim() || null,
        enabled: dto.enabled ?? true,
        createdByWorkspaceMemberId: actorWorkspaceMemberId ?? null,
        updatedByWorkspaceMemberId: actorWorkspaceMemberId ?? null,
      }),
    );

    await this.createDefaultStages(workspaceId, playbook.id);
    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.salesPlaybook.createPlaybook',
      resourceType: 'enterpriseSalesPlaybook',
      resourceId: playbook.id,
      actorWorkspaceMemberId,
      afterJson: this.playbookToAuditJson(playbook),
    });

    return playbook;
  }

  async updatePlaybook(
    workspaceId: string,
    playbookId: string,
    dto: UpdateEnterpriseSalesPlaybookDto,
    actorWorkspaceMemberId?: string | null,
  ) {
    const playbook = await this.findPlaybookOrFail(workspaceId, playbookId);
    const beforeJson = this.playbookToAuditJson(playbook);

    if (dto.playbookName !== undefined) {
      const playbookName = dto.playbookName.trim();

      if (!playbookName) {
        throw new BadRequestException('playbookName cannot be empty');
      }

      playbook.playbookName = playbookName;
    }

    if (dto.description !== undefined) {
      playbook.description = dto.description?.trim() || null;
    }

    if (dto.enabled !== undefined) {
      playbook.enabled = dto.enabled;
    }

    playbook.updatedByWorkspaceMemberId = actorWorkspaceMemberId ?? null;

    const savedPlaybook = await this.enterpriseSalesPlaybookRepository.save(
      playbook,
    );

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.salesPlaybook.updatePlaybook',
      resourceType: 'enterpriseSalesPlaybook',
      resourceId: savedPlaybook.id,
      actorWorkspaceMemberId,
      beforeJson,
      afterJson: this.playbookToAuditJson(savedPlaybook),
    });

    return savedPlaybook;
  }

  async findStages(workspaceId: string, playbookId: string) {
    await this.findPlaybookOrFail(workspaceId, playbookId);
    await this.ensureDefaultStages(workspaceId, playbookId);

    return this.enterpriseSalesPlaybookStageRepository.find({
      where: { workspaceId, playbookId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async replaceStages(
    workspaceId: string,
    playbookId: string,
    dto: ReplaceEnterpriseSalesPlaybookStagesDto,
    actorWorkspaceMemberId?: string | null,
  ) {
    await this.findPlaybookOrFail(workspaceId, playbookId);

    const existingStages = await this.enterpriseSalesPlaybookStageRepository.find({
      where: {
        workspaceId,
        playbookId,
      },
    });
    const existingStageById = new Map(
      existingStages.map((stage) => [stage.id, stage]),
    );
    const submittedStageIds = new Set(
      (dto.stages ?? [])
        .map((stage) => stage.id)
        .filter((stageId): stageId is string => !!stageId),
    );
    const stagesToDelete = existingStages.filter(
      (stage) => !submittedStageIds.has(stage.id),
    );
    const stageIdsToDelete = stagesToDelete.map((stage) => stage.id);
    const stages = (dto.stages ?? []).map((stage, index) => {
      const stageName = stage.stageName?.trim();
      const stageCode = stage.stageCode?.trim() || this.toCode(stageName ?? '');

      if (!stageName || !stageCode) {
        throw new BadRequestException('stageName and stageCode are required');
      }

      const stagePatch = {
        workspaceId,
        playbookId,
        stageName,
        stageCode,
        sortOrder: stage.sortOrder ?? index + 1,
        enabled: stage.enabled ?? true,
      };
      const existingStage = stage.id
        ? existingStageById.get(stage.id)
        : undefined;

      return existingStage
        ? this.enterpriseSalesPlaybookStageRepository.merge(
            existingStage,
            stagePatch,
          )
        : this.enterpriseSalesPlaybookStageRepository.create(stagePatch);
    });

    if (stageIdsToDelete.length > 0) {
      await this.enterpriseSalesPlaybookItemRepository.delete({
        workspaceId,
        stageId: In(stageIdsToDelete),
      });
      await this.enterpriseSalesPlaybookStageRepository.delete({
        workspaceId,
        id: In(stageIdsToDelete),
      });
    }

    const savedStages =
      stages.length > 0
        ? await this.enterpriseSalesPlaybookStageRepository.save(stages)
        : [];

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.salesPlaybook.replaceStages',
      resourceType: 'enterpriseSalesPlaybookStage',
      resourceId: playbookId,
      actorWorkspaceMemberId,
      afterJson: { stages: savedStages },
    });

    return savedStages;
  }

  async findItems(workspaceId: string, stageId: string) {
    await this.findStageOrFail(workspaceId, stageId);
    await this.ensureDefaultItems(workspaceId, stageId);

    return this.enterpriseSalesPlaybookItemRepository.find({
      where: { workspaceId, stageId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async replaceItems(
    workspaceId: string,
    stageId: string,
    dto: ReplaceEnterpriseSalesPlaybookItemsDto,
    actorWorkspaceMemberId?: string | null,
  ) {
    await this.findStageOrFail(workspaceId, stageId);

    const existingItems = await this.enterpriseSalesPlaybookItemRepository.find({
      where: { workspaceId, stageId },
    });
    const existingItemById = new Map(existingItems.map((item) => [item.id, item]));
    const submittedItemIds = new Set(
      (dto.items ?? [])
        .map((item) => item.id)
        .filter((itemId): itemId is string => !!itemId),
    );
    const itemIdsToDelete = existingItems
      .filter((item) => !submittedItemIds.has(item.id))
      .map((item) => item.id);
    const items = (dto.items ?? []).map((item, index) => {
      const title = item.title?.trim();
      const itemType = item.itemType?.trim() || 'script';

      if (!title) {
        throw new BadRequestException('title is required');
      }

      const itemPatch = {
        workspaceId,
        stageId,
        itemType,
        title,
        content: item.content?.trim() || null,
        attachmentIds: this.normalizeStringList(item.attachmentIds ?? []),
        suggestionJson: item.suggestionJson ?? {},
        sortOrder: item.sortOrder ?? index + 1,
        enabled: item.enabled ?? true,
      };
      const existingItem = item.id ? existingItemById.get(item.id) : undefined;

      return existingItem
        ? this.enterpriseSalesPlaybookItemRepository.merge(
            existingItem,
            itemPatch,
          )
        : this.enterpriseSalesPlaybookItemRepository.create(itemPatch);
    });

    if (itemIdsToDelete.length > 0) {
      await this.enterpriseSalesPlaybookItemRepository.delete({
        workspaceId,
        id: In(itemIdsToDelete),
      });
    }

    const savedItems =
      items.length > 0
        ? await this.enterpriseSalesPlaybookItemRepository.save(items)
        : [];

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.salesPlaybook.replaceItems',
      resourceType: 'enterpriseSalesPlaybookItem',
      resourceId: stageId,
      actorWorkspaceMemberId,
      afterJson: { items: savedItems },
    });

    return savedItems;
  }

  async findContextualContent(
    workspaceId: string,
    stageCode?: string,
    objectType?: string,
  ) {
    await this.ensureDefaultPlaybook(workspaceId);

    const playbook = await this.enterpriseSalesPlaybookRepository.findOne({
      where: { workspaceId, enabled: true },
      order: { updatedAt: 'DESC' },
    });

    if (!playbook) {
      return { playbook: null, stage: null, items: [] };
    }

    const stage = await this.enterpriseSalesPlaybookStageRepository.findOne({
      where: {
        workspaceId,
        playbookId: playbook.id,
        enabled: true,
        ...(stageCode ? { stageCode } : {}),
      },
      order: { sortOrder: 'ASC' },
    });

    if (!stage) {
      return { playbook, stage: null, items: [] };
    }

    const items = await this.enterpriseSalesPlaybookItemRepository.find({
      where: { workspaceId, stageId: stage.id, enabled: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    return {
      playbook,
      stage,
      items: objectType
        ? items.filter((item) => this.matchesObjectType(item, objectType))
        : items,
    };
  }

  private async findPlaybookOrFail(workspaceId: string, playbookId: string) {
    const playbook = await this.enterpriseSalesPlaybookRepository.findOne({
      where: { id: playbookId, workspaceId },
    });

    if (!playbook) {
      throw new NotFoundException(
        `Enterprise sales playbook ${playbookId} was not found`,
      );
    }

    return playbook;
  }

  private async findStageOrFail(workspaceId: string, stageId: string) {
    const stage = await this.enterpriseSalesPlaybookStageRepository.findOne({
      where: { id: stageId, workspaceId },
    });

    if (!stage) {
      throw new NotFoundException(
        `Enterprise sales playbook stage ${stageId} was not found`,
      );
    }

    return stage;
  }

  private async ensureDefaultPlaybook(workspaceId: string) {
    const existingCount = await this.enterpriseSalesPlaybookRepository.count({
      where: { workspaceId },
    });

    if (existingCount > 0) {
      return;
    }

    const playbook = await this.enterpriseSalesPlaybookRepository.save(
      this.enterpriseSalesPlaybookRepository.create({
        workspaceId,
        playbookName: '默认谈单指南',
        description: '覆盖线索到达、询盘首回、报价、样品、大货和售后等外贸销售阶段。',
        enabled: true,
        createdByWorkspaceMemberId: null,
        updatedByWorkspaceMemberId: null,
      }),
    );

    await this.createDefaultStages(workspaceId, playbook.id);
  }

  private async ensureDefaultStages(workspaceId: string, playbookId: string) {
    const existingCount = await this.enterpriseSalesPlaybookStageRepository.count({
      where: { workspaceId, playbookId },
    });

    if (existingCount > 0) {
      return;
    }

    await this.createDefaultStages(workspaceId, playbookId);
  }

  private async ensureDefaultItems(workspaceId: string, stageId: string) {
    const existingCount = await this.enterpriseSalesPlaybookItemRepository.count({
      where: { workspaceId, stageId },
    });

    if (existingCount > 0) {
      return;
    }

    await this.enterpriseSalesPlaybookItemRepository.save([
      this.enterpriseSalesPlaybookItemRepository.create({
        workspaceId,
        stageId,
        itemType: 'script',
        title: '标准开场话术',
        content: '确认客户当前需求、采购时间、目标市场和关键决策人，避免直接进入报价。',
        attachmentIds: [],
        suggestionJson: { applicableObjects: ['lead', 'opportunity'] },
        sortOrder: 1,
        enabled: true,
      }),
      this.enterpriseSalesPlaybookItemRepository.create({
        workspaceId,
        stageId,
        itemType: 'suggestion',
        title: '下一步建议',
        content: '补齐公司、联系人、国家、产品兴趣和预算字段，并设置下一次跟进任务。',
        attachmentIds: [],
        suggestionJson: { nextAction: 'create_follow_up_task' },
        sortOrder: 2,
        enabled: true,
      }),
    ]);
  }

  private async createDefaultStages(workspaceId: string, playbookId: string) {
    await this.enterpriseSalesPlaybookStageRepository.save(
      DEFAULT_STAGE_NAMES.map((stageName, index) =>
        this.enterpriseSalesPlaybookStageRepository.create({
          workspaceId,
          playbookId,
          stageName,
          stageCode: this.toCode(stageName),
          sortOrder: index + 1,
          enabled: true,
        }),
      ),
    );
  }

  private matchesObjectType(
    item: EnterpriseSalesPlaybookItemEntity,
    objectType: string,
  ) {
    const applicableObjects = item.suggestionJson.applicableObjects;

    if (!Array.isArray(applicableObjects)) {
      return true;
    }

    return applicableObjects.includes(objectType);
  }

  private normalizeStringList(values: string[]) {
    return values
      .map((value) => value.trim())
      .filter((value, index, list) => value && list.indexOf(value) === index);
  }

  private toCode(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private playbookToAuditJson(playbook: EnterpriseSalesPlaybookEntity) {
    return {
      id: playbook.id,
      playbookName: playbook.playbookName,
      description: playbook.description,
      enabled: playbook.enabled,
    };
  }
}
