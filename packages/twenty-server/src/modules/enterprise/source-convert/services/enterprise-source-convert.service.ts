import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { In, Repository } from 'typeorm';

import { EnterpriseConfigAuditService } from 'src/modules/enterprise/audit/services/enterprise-config-audit.service';
import { CreateEnterpriseSourceBlacklistRuleDto } from 'src/modules/enterprise/source-convert/dtos/create-enterprise-source-blacklist-rule.dto';
import { ExecuteEnterpriseSourceConvertDto } from 'src/modules/enterprise/source-convert/dtos/execute-enterprise-source-convert.dto';
import { UpdateEnterpriseSourceConvertRuleDto } from 'src/modules/enterprise/source-convert/dtos/update-enterprise-source-convert-rule.dto';
import { EnterpriseSourceBlacklistRuleEntity } from 'src/modules/enterprise/source-convert/enterprise-source-blacklist-rule.entity';
import { EnterpriseSourceChannelEntity } from 'src/modules/enterprise/source-convert/enterprise-source-channel.entity';
import { EnterpriseSourceConvertRuleEntity } from 'src/modules/enterprise/source-convert/enterprise-source-convert-rule.entity';

const DEFAULT_SOURCE_CATEGORIES = [
  { code: 'okki', label: 'OKKI获客' },
  { code: 'alibaba', label: '阿里巴巴' },
  { code: 'business-email', label: '业务邮件' },
  { code: 'b2b-platform', label: 'B2B平台' },
  { code: 'social-media', label: '社媒' },
  { code: 'okki-card', label: 'OKKI名片夹' },
  { code: 'exhibition', label: '展会' },
  { code: 'internet', label: '互联网' },
];

const DEFAULT_SOURCE_CHANNELS = [
  {
    categoryCode: 'okki',
    sourceCode: 'okki-leads',
    sourceName: 'OKKI获客',
    secondSourceName: '系统获客',
  },
  {
    categoryCode: 'alibaba',
    sourceCode: 'alibaba-inquiry',
    sourceName: '阿里巴巴询盘',
    secondSourceName: '国际站',
  },
  {
    categoryCode: 'business-email',
    sourceCode: 'mail-inbound',
    sourceName: '业务邮件',
    secondSourceName: '收件箱',
  },
  {
    categoryCode: 'b2b-platform',
    sourceCode: 'b2b-form',
    sourceName: 'B2B平台表单',
    secondSourceName: '外部表单',
  },
  {
    categoryCode: 'social-media',
    sourceCode: 'social-message',
    sourceName: '社媒留言',
    secondSourceName: '社交媒体',
  },
  {
    categoryCode: 'okki-card',
    sourceCode: 'okki-card-scan',
    sourceName: 'OKKI名片夹',
    secondSourceName: '名片扫描',
  },
  {
    categoryCode: 'exhibition',
    sourceCode: 'exhibition-scan',
    sourceName: '展会名片',
    secondSourceName: '线下展会',
  },
  {
    categoryCode: 'internet',
    sourceCode: 'website-visitor',
    sourceName: '互联网访客',
    secondSourceName: '网站访客',
  },
];

type SourceConvertRuleWithChannel = EnterpriseSourceConvertRuleEntity & {
  sourceChannel: EnterpriseSourceChannelEntity | null;
};

@Injectable()
export class EnterpriseSourceConvertService {
  constructor(
    @InjectRepository(EnterpriseSourceChannelEntity)
    private readonly enterpriseSourceChannelRepository: Repository<EnterpriseSourceChannelEntity>,
    @InjectRepository(EnterpriseSourceConvertRuleEntity)
    private readonly enterpriseSourceConvertRuleRepository: Repository<EnterpriseSourceConvertRuleEntity>,
    @InjectRepository(EnterpriseSourceBlacklistRuleEntity)
    private readonly enterpriseSourceBlacklistRuleRepository: Repository<EnterpriseSourceBlacklistRuleEntity>,
    private readonly enterpriseConfigAuditService: EnterpriseConfigAuditService,
  ) {}

  async findCategories(workspaceId: string) {
    await this.ensureDefaultRules(workspaceId);

    const rules = await this.findRules(workspaceId);

    return DEFAULT_SOURCE_CATEGORIES.map((category) => ({
      ...category,
      ruleCount: rules.filter(
        (rule) => rule.sourceChannel?.categoryCode === category.code,
      ).length,
      enabledCount: rules.filter(
        (rule) =>
          rule.sourceChannel?.categoryCode === category.code && rule.enabled,
      ).length,
    }));
  }

  async findRules(workspaceId: string, categoryCode?: string) {
    await this.ensureDefaultRules(workspaceId);

    const channels = await this.enterpriseSourceChannelRepository.find({
      where: {
        workspaceId,
        ...(categoryCode ? { categoryCode } : {}),
      },
      order: {
        categoryCode: 'ASC',
        sourceName: 'ASC',
      },
    });

    const channelIds = channels.map((channel) => channel.id);

    if (channelIds.length === 0) {
      return [];
    }

    const rules = await this.enterpriseSourceConvertRuleRepository.find({
      where: {
        workspaceId,
        sourceChannelId: In(channelIds),
      },
      order: {
        updatedAt: 'DESC',
      },
    });

    return rules.map((rule) =>
      this.attachChannel(
        rule,
        channels.find((channel) => channel.id === rule.sourceChannelId) ?? null,
      ),
    );
  }

  async findRuleOrFail(workspaceId: string, ruleId: string) {
    await this.ensureDefaultRules(workspaceId);

    const rule = await this.enterpriseSourceConvertRuleRepository.findOne({
      where: {
        id: ruleId,
        workspaceId,
      },
    });

    if (!rule) {
      throw new NotFoundException(
        `Enterprise source convert rule ${ruleId} was not found`,
      );
    }

    const channel = await this.enterpriseSourceChannelRepository.findOne({
      where: {
        id: rule.sourceChannelId,
        workspaceId,
      },
    });

    return this.attachChannel(rule, channel);
  }

  async updateRule(
    workspaceId: string,
    ruleId: string,
    dto: UpdateEnterpriseSourceConvertRuleDto,
    actorWorkspaceMemberId?: string | null,
  ) {
    const rule = await this.findRuleOrFail(workspaceId, ruleId);
    const beforeJson = this.ruleToAuditJson(rule);

    if (
      dto.depositEntityType &&
      !['lead', 'customer'].includes(dto.depositEntityType)
    ) {
      throw new BadRequestException('depositEntityType must be lead or customer');
    }

    rule.depositEntityType =
      dto.depositEntityType?.trim() || rule.depositEntityType;
    rule.targetLeadStatus =
      dto.targetLeadStatus === undefined
        ? rule.targetLeadStatus
        : dto.targetLeadStatus?.trim() || null;
    rule.targetCustomerStage =
      dto.targetCustomerStage === undefined
        ? rule.targetCustomerStage
        : dto.targetCustomerStage?.trim() || null;
    rule.autoTagIds = this.normalizeStringList(dto.autoTagIds ?? rule.autoTagIds);
    rule.includeFunnelStats =
      dto.includeFunnelStats ?? rule.includeFunnelStats;
    rule.enabled = dto.enabled ?? rule.enabled;
    rule.ruleJson = dto.ruleJson ?? rule.ruleJson ?? {};
    rule.ruleEditedByWorkspaceMemberId = actorWorkspaceMemberId ?? null;
    rule.ruleEditedAt = new Date();

    const savedRule = await this.enterpriseSourceConvertRuleRepository.save(rule);
    const ruleWithChannel = await this.findRuleOrFail(workspaceId, savedRule.id);

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.sourceConvert.updateRule',
      resourceType: 'enterpriseSourceConvertRule',
      resourceId: savedRule.id,
      actorWorkspaceMemberId,
      beforeJson,
      afterJson: this.ruleToAuditJson(ruleWithChannel),
    });

    return ruleWithChannel;
  }

  async updateRuleEnabled(
    workspaceId: string,
    ruleId: string,
    enabled: boolean,
    actorWorkspaceMemberId?: string | null,
  ) {
    return this.updateRule(
      workspaceId,
      ruleId,
      { enabled },
      actorWorkspaceMemberId,
    );
  }

  async findBlacklist(workspaceId: string) {
    return this.enterpriseSourceBlacklistRuleRepository.find({
      where: { workspaceId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async createBlacklistRule(
    workspaceId: string,
    dto: CreateEnterpriseSourceBlacklistRuleDto,
    actorWorkspaceMemberId?: string | null,
  ) {
    const ruleType = dto.ruleType?.trim();
    const ruleValue = dto.ruleValue?.trim().toLowerCase();

    if (!ruleType || !ruleValue) {
      throw new BadRequestException('ruleType and ruleValue are required');
    }

    const blacklistRule =
      await this.enterpriseSourceBlacklistRuleRepository.save(
        this.enterpriseSourceBlacklistRuleRepository.create({
          workspaceId,
          ruleType,
          ruleValue,
          action: dto.action?.trim() || 'reject',
          enabled: dto.enabled ?? true,
          createdByWorkspaceMemberId: actorWorkspaceMemberId ?? null,
        }),
      );

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.sourceConvert.createBlacklistRule',
      resourceType: 'enterpriseSourceBlacklistRule',
      resourceId: blacklistRule.id,
      actorWorkspaceMemberId,
      afterJson: this.blacklistToAuditJson(blacklistRule),
    });

    return blacklistRule;
  }

  async deleteBlacklistRule(
    workspaceId: string,
    blacklistRuleId: string,
    actorWorkspaceMemberId?: string | null,
  ) {
    const blacklistRule =
      await this.enterpriseSourceBlacklistRuleRepository.findOne({
        where: {
          id: blacklistRuleId,
          workspaceId,
        },
      });

    if (!blacklistRule) {
      throw new NotFoundException(
        `Enterprise source blacklist rule ${blacklistRuleId} was not found`,
      );
    }

    await this.enterpriseSourceBlacklistRuleRepository.delete({
      id: blacklistRuleId,
      workspaceId,
    });

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.sourceConvert.deleteBlacklistRule',
      resourceType: 'enterpriseSourceBlacklistRule',
      resourceId: blacklistRule.id,
      actorWorkspaceMemberId,
      beforeJson: this.blacklistToAuditJson(blacklistRule),
    });

    return { deleted: true, id: blacklistRuleId };
  }

  async execute(workspaceId: string, dto: ExecuteEnterpriseSourceConvertDto) {
    await this.ensureDefaultRules(workspaceId);

    const blacklistHit = await this.findBlacklistHit(workspaceId, dto);

    if (blacklistHit) {
      return {
        action: blacklistHit.action,
        blocked: true,
        blacklistRule: blacklistHit,
        reason: 'blacklist',
      };
    }

    const channel = await this.enterpriseSourceChannelRepository.findOne({
      where: {
        workspaceId,
        categoryCode: dto.categoryCode,
        sourceCode: dto.sourceCode,
      },
    });

    if (!channel) {
      throw new NotFoundException('Source channel was not found');
    }

    const rule = await this.enterpriseSourceConvertRuleRepository.findOne({
      where: {
        workspaceId,
        sourceChannelId: channel.id,
      },
    });

    if (!rule || !rule.enabled) {
      throw new BadRequestException('Source convert rule is disabled');
    }

    rule.dataSyncedAt = new Date();
    await this.enterpriseSourceConvertRuleRepository.save(rule);

    return {
      action: 'convert',
      blocked: false,
      decision: {
        depositEntityType: rule.depositEntityType,
        targetLeadStatus: rule.targetLeadStatus,
        targetCustomerStage: rule.targetCustomerStage,
        autoTagIds: rule.autoTagIds,
        includeFunnelStats: rule.includeFunnelStats,
      },
      sourceChannel: channel,
    };
  }

  private async ensureDefaultRules(workspaceId: string) {
    const existingChannels = await this.enterpriseSourceChannelRepository.find({
      where: { workspaceId },
    });
    const existingKeys = new Set(
      existingChannels.map(
        (channel) => `${channel.categoryCode}:${channel.sourceCode}`,
      ),
    );
    const channelsToCreate = DEFAULT_SOURCE_CHANNELS.filter(
      (channel) =>
        !existingKeys.has(`${channel.categoryCode}:${channel.sourceCode}`),
    ).map((channel) =>
      this.enterpriseSourceChannelRepository.create({
        ...channel,
        workspaceId,
        enabled: true,
        systemSource: true,
      }),
    );

    if (channelsToCreate.length > 0) {
      await this.enterpriseSourceChannelRepository.save(channelsToCreate);
    }

    const channels = await this.enterpriseSourceChannelRepository.find({
      where: { workspaceId },
    });
    const existingRules = await this.enterpriseSourceConvertRuleRepository.find({
      where: { workspaceId },
    });
    const existingRuleChannelIds = new Set(
      existingRules.map((rule) => rule.sourceChannelId),
    );
    const rulesToCreate = channels
      .filter((channel) => !existingRuleChannelIds.has(channel.id))
      .map((channel) =>
        this.enterpriseSourceConvertRuleRepository.create({
          workspaceId,
          sourceChannelId: channel.id,
          depositEntityType: 'lead',
          targetLeadStatus: 'new',
          targetCustomerStage: null,
          autoTagIds: [channel.categoryCode],
          includeFunnelStats: true,
          enabled: false,
          ruleJson: {
            idempotencyKey: ['externalId', 'email'],
            duplicatePolicy: 'skip',
            workflowEnabled: false,
          },
          ruleEditedByWorkspaceMemberId: null,
          ruleEditedAt: null,
          dataSyncedAt: null,
        }),
      );

    if (rulesToCreate.length > 0) {
      await this.enterpriseSourceConvertRuleRepository.save(rulesToCreate);
    }
  }

  private async findBlacklistHit(
    workspaceId: string,
    dto: ExecuteEnterpriseSourceConvertDto,
  ) {
    const blacklistRules =
      await this.enterpriseSourceBlacklistRuleRepository.find({
        where: {
          workspaceId,
          enabled: true,
        },
      });

    return (
      blacklistRules.find((rule) => {
        const value = rule.ruleValue.toLowerCase();

        if (rule.ruleType === 'email') {
          return dto.email?.toLowerCase() === value;
        }

        if (rule.ruleType === 'domain') {
          return dto.domain?.toLowerCase() === value;
        }

        if (rule.ruleType === 'sourceCode') {
          return dto.sourceCode.toLowerCase() === value;
        }

        return false;
      }) ?? null
    );
  }

  private attachChannel(
    rule: EnterpriseSourceConvertRuleEntity,
    sourceChannel: EnterpriseSourceChannelEntity | null,
  ): SourceConvertRuleWithChannel {
    return Object.assign(rule, { sourceChannel });
  }

  private normalizeStringList(values: string[]) {
    return values
      .map((value) => value.trim())
      .filter((value, index, list) => value && list.indexOf(value) === index);
  }

  private ruleToAuditJson(rule: SourceConvertRuleWithChannel) {
    return {
      id: rule.id,
      sourceChannelId: rule.sourceChannelId,
      sourceName: rule.sourceChannel?.sourceName,
      depositEntityType: rule.depositEntityType,
      targetLeadStatus: rule.targetLeadStatus,
      targetCustomerStage: rule.targetCustomerStage,
      autoTagIds: rule.autoTagIds,
      includeFunnelStats: rule.includeFunnelStats,
      enabled: rule.enabled,
      ruleJson: rule.ruleJson,
    };
  }

  private blacklistToAuditJson(rule: EnterpriseSourceBlacklistRuleEntity) {
    return {
      id: rule.id,
      ruleType: rule.ruleType,
      ruleValue: rule.ruleValue,
      action: rule.action,
      enabled: rule.enabled,
    };
  }
}

