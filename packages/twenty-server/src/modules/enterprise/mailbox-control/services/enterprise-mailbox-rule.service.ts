import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { In, Repository } from 'typeorm';

import { TradeCrmMailThreadStateEntity } from 'src/engine/core-modules/messaging/entities/trade-crm-mail-thread-state.entity';
import { TradeCrmMailThreadTaskLinkEntity } from 'src/engine/core-modules/messaging/entities/trade-crm-mail-thread-task-link.entity';
import { MessageChannelDataAccessService } from 'src/engine/metadata-modules/message-channel/data-access/services/message-channel-data-access.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { EnterpriseConfigAuditService } from 'src/modules/enterprise/audit/services/enterprise-config-audit.service';
import { CreateEnterpriseMailboxRuleDto } from 'src/modules/enterprise/mailbox-control/dtos/create-enterprise-mailbox-rule.dto';
import { UpdateEnterpriseMailboxRuleDto } from 'src/modules/enterprise/mailbox-control/dtos/update-enterprise-mailbox-rule.dto';
import { EnterpriseMailThreadCrmLinkEntity } from 'src/modules/enterprise/mailbox-control/entities/enterprise-mail-thread-crm-link.entity';
import { EnterpriseMailboxAssignmentEntity } from 'src/modules/enterprise/mailbox-control/entities/enterprise-mailbox-assignment.entity';
import { EnterpriseMailboxProfileEntity } from 'src/modules/enterprise/mailbox-control/entities/enterprise-mailbox-profile.entity';
import { EnterpriseMailboxRuleEntity } from 'src/modules/enterprise/mailbox-control/entities/enterprise-mailbox-rule.entity';
import { type MessageChannelMessageAssociationWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-channel-message-association.workspace-entity';

type CreateEnterpriseMailboxRuleInput = CreateEnterpriseMailboxRuleDto & {
  workspaceId: string;
  createdByWorkspaceMemberId?: string | null;
};

type UpdateEnterpriseMailboxRuleInput = UpdateEnterpriseMailboxRuleDto & {
  id: string;
  workspaceId: string;
  updatedByWorkspaceMemberId?: string | null;
};

type MailboxRuleReadinessPreview = {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  emailAddress: string | null;
  mailboxStatus: string;
  validationStatus: string;
  activeAssignmentCount: number;
  primaryAssignmentCount: number;
  messageChannelDetected: boolean;
  sourceFolder: string | null;
  sourceFolderExists: boolean | null;
  targetFolder: string | null;
  targetFolderExists: boolean | null;
  warnings: string[];
  blockers: string[];
  status: 'ready' | 'warning' | 'blocked';
};

type MailboxRulePreviewCandidate = {
  threadId: string;
  messageId: string;
  subject: string;
  senderHandle: string | null;
  receivedAt: string | null;
  pending: boolean;
  taskLinked: boolean;
  crmLinked: boolean;
  matchedSignals: string[];
  plannedActions: string[];
};

type MailboxRuleDryRunPreview = {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  emailAddress: string | null;
  status: 'ready' | 'warning' | 'blocked';
  warnings: string[];
  blockers: string[];
  candidateCount: number;
  candidates: MailboxRulePreviewCandidate[];
};

@Injectable()
export class EnterpriseMailboxRuleService {
  constructor(
    @InjectRepository(EnterpriseMailboxRuleEntity)
    private readonly enterpriseMailboxRuleRepository: Repository<EnterpriseMailboxRuleEntity>,
    @InjectRepository(EnterpriseMailboxProfileEntity)
    private readonly enterpriseMailboxProfileRepository: Repository<EnterpriseMailboxProfileEntity>,
    @InjectRepository(EnterpriseMailboxAssignmentEntity)
    private readonly enterpriseMailboxAssignmentRepository: Repository<EnterpriseMailboxAssignmentEntity>,
    @InjectRepository(EnterpriseMailThreadCrmLinkEntity)
    private readonly enterpriseMailThreadCrmLinkRepository: Repository<EnterpriseMailThreadCrmLinkEntity>,
    @InjectRepository(TradeCrmMailThreadStateEntity)
    private readonly tradeCrmMailThreadStateRepository: Repository<TradeCrmMailThreadStateEntity>,
    @InjectRepository(TradeCrmMailThreadTaskLinkEntity)
    private readonly tradeCrmMailThreadTaskLinkRepository: Repository<TradeCrmMailThreadTaskLinkEntity>,
    private readonly messageChannelDataAccessService: MessageChannelDataAccessService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly enterpriseConfigAuditService: EnterpriseConfigAuditService,
  ) {}

  private normalizeMailboxToken(value: string | null | undefined) {
    return value?.trim().toLowerCase() ?? '';
  }

  private getReadinessStatus(warnings: string[], blockers: string[]) {
    if (blockers.length > 0) {
      return 'blocked';
    }

    if (warnings.length > 0) {
      return 'warning';
    }

    return 'ready';
  }

  private getSourceFolder(conditionsJson?: Record<string, unknown> | null) {
    return typeof conditionsJson?.folder === 'string'
      ? conditionsJson.folder
      : typeof conditionsJson?.sourceFolder === 'string'
        ? conditionsJson.sourceFolder
        : null;
  }

  private getTargetFolder(actionsJson?: Record<string, unknown> | null) {
    return typeof actionsJson?.targetFolder === 'string'
      ? actionsJson.targetFolder
      : null;
  }

  private buildReadinessEntry(
    mailboxRule: EnterpriseMailboxRuleEntity,
    mailboxProfiles: EnterpriseMailboxProfileEntity[],
    mailboxAssignments: EnterpriseMailboxAssignmentEntity[],
    messageChannels: Array<{
      id: string;
      handle: string | null;
      messageFolders?: Array<{
        name: string | null;
        externalId: string | null;
      }>;
    }>,
  ): MailboxRuleReadinessPreview {
    const mailboxProfile =
      mailboxProfiles.find(
        (candidateMailboxProfile) =>
          candidateMailboxProfile.id === mailboxRule.mailboxProfileId,
      ) ?? null;

    const activeAssignments = mailboxAssignments.filter(
      (mailboxAssignment) =>
        mailboxAssignment.mailboxProfileId === mailboxRule.mailboxProfileId &&
        mailboxAssignment.assignmentStatus === 'active',
    );

    const messageChannel =
      (mailboxProfile
        ? messageChannels.find(
            (candidateMessageChannel) =>
              candidateMessageChannel.id === mailboxProfile.messageChannelId,
          )
        : null) ??
      (mailboxProfile
        ? messageChannels.find(
            (candidateMessageChannel) =>
              this.normalizeMailboxToken(candidateMessageChannel.handle) ===
              this.normalizeMailboxToken(mailboxProfile.emailAddress),
          )
        : null) ??
      null;

    const availableFolderTokens = new Set(
      (messageChannel?.messageFolders ?? []).flatMap((messageFolder) => [
        this.normalizeMailboxToken(messageFolder.name),
        this.normalizeMailboxToken(messageFolder.externalId),
      ]),
    );

    const warnings: string[] = [];
    const blockers: string[] = [];

    if (!mailboxProfile) {
      blockers.push('Mailbox profile is missing.');
    }

    if (mailboxProfile && mailboxProfile.status !== 'active') {
      blockers.push('Mailbox profile is not active.');
    }

    if (mailboxProfile && mailboxProfile.validationStatus !== 'validated') {
      blockers.push('Mailbox profile has not passed validation.');
    }

    if (activeAssignments.length === 0) {
      warnings.push('No active mailbox assignee is currently bound to this mailbox.');
    }

    if (!messageChannel) {
      warnings.push('No synced message channel is linked to this mailbox yet.');
    }

    const sourceFolder = this.getSourceFolder(mailboxRule.conditionsJson);
    const targetFolder = this.getTargetFolder(mailboxRule.actionsJson);

    const sourceFolderExists =
      sourceFolder === null
        ? null
        : availableFolderTokens.has(this.normalizeMailboxToken(sourceFolder));
    const targetFolderExists =
      targetFolder === null
        ? null
        : availableFolderTokens.has(this.normalizeMailboxToken(targetFolder));

    if (sourceFolder && messageChannel && !sourceFolderExists) {
      blockers.push(`Source folder "${sourceFolder}" is not synced on this mailbox.`);
    }

    if (targetFolder && messageChannel && !targetFolderExists) {
      blockers.push(`Target folder "${targetFolder}" is not synced on this mailbox.`);
    }

    return {
      ruleId: mailboxRule.id,
      ruleName: mailboxRule.name,
      ruleType: mailboxRule.ruleType,
      emailAddress: mailboxProfile?.emailAddress ?? null,
      mailboxStatus: mailboxProfile?.status ?? 'missing',
      validationStatus: mailboxProfile?.validationStatus ?? 'missing',
      activeAssignmentCount: activeAssignments.length,
      primaryAssignmentCount: activeAssignments.filter(
        (activeAssignment) => activeAssignment.isPrimaryMailbox,
      ).length,
      messageChannelDetected: Boolean(messageChannel),
      sourceFolder,
      sourceFolderExists,
      targetFolder,
      targetFolderExists,
      warnings,
      blockers,
      status: this.getReadinessStatus(warnings, blockers),
    };
  }

  private getPreviewPlannedActions(mailboxRule: EnterpriseMailboxRuleEntity) {
    switch (mailboxRule.ruleType) {
      case 'pending-reply':
        return [
          mailboxRule.actionsJson?.createTask ? 'Create follow-up task' : null,
          mailboxRule.actionsJson?.applyPendingTag ? 'Apply pending tag' : null,
          mailboxRule.actionsJson?.escalateToManager
            ? 'Escalate to manager'
            : null,
        ].filter((value): value is string => value !== null);
      case 'folder-routing':
        return [
          this.getTargetFolder(mailboxRule.actionsJson)
            ? `Route to ${this.getTargetFolder(mailboxRule.actionsJson)}`
            : null,
          mailboxRule.actionsJson?.markAsRead ? 'Mark as read' : null,
          mailboxRule.actionsJson?.stopFurtherRules
            ? 'Stop further rules'
            : null,
        ].filter((value): value is string => value !== null);
      case 'customer-auto-link':
        return [
          mailboxRule.actionsJson?.linkToPerson ? 'Link to person' : null,
          mailboxRule.actionsJson?.linkToCompany ? 'Link to company' : null,
          mailboxRule.actionsJson?.attachToLatestOpportunity
            ? 'Attach to latest opportunity'
            : null,
          mailboxRule.actionsJson?.createLeadWhenUnmatched
            ? 'Create lead when unmatched'
            : null,
        ].filter((value): value is string => value !== null);
      case 'subordinate-escalation':
        return [
          mailboxRule.actionsJson?.createTask ? 'Create escalation task' : null,
          mailboxRule.actionsJson?.notifyOwner ? 'Notify current owner' : null,
          mailboxRule.actionsJson?.escalateToManager
            ? 'Escalate to manager'
            : null,
          mailboxRule.actionsJson?.reassignToPrimarySender
            ? 'Reassign to primary sender'
            : null,
        ].filter((value): value is string => value !== null);
      default:
        return [];
    }
  }

  async createRule(input: CreateEnterpriseMailboxRuleInput) {
    await this.enterpriseMailboxProfileRepository.findOneByOrFail({
      id: input.mailboxProfileId,
      workspaceId: input.workspaceId,
    });

    const mailboxRule = await this.enterpriseMailboxRuleRepository.save(
      this.enterpriseMailboxRuleRepository.create({
        workspaceId: input.workspaceId,
        mailboxProfileId: input.mailboxProfileId,
        name: input.name.trim(),
        ruleType: input.ruleType,
        conditionsJson: input.conditionsJson ?? null,
        actionsJson: input.actionsJson ?? null,
        enabled: input.enabled ?? true,
        priority: input.priority ?? 100,
        createdByWorkspaceMemberId: input.createdByWorkspaceMemberId ?? null,
      }),
    );

    await this.enterpriseConfigAuditService.createLog({
      workspaceId: input.workspaceId,
      action: 'enterprise_mailbox_rule.create',
      resourceType: 'enterpriseMailboxRule',
      resourceId: mailboxRule.id,
      actorWorkspaceMemberId: input.createdByWorkspaceMemberId ?? null,
      afterJson: {
        mailboxProfileId: mailboxRule.mailboxProfileId,
        name: mailboxRule.name,
        ruleType: mailboxRule.ruleType,
        enabled: mailboxRule.enabled,
        priority: mailboxRule.priority,
      },
      contextJson: {
        actionsJson: mailboxRule.actionsJson,
        conditionsJson: mailboxRule.conditionsJson,
      },
    });

    return mailboxRule;
  }

  async findMany(workspaceId: string) {
    const [mailboxRules, mailboxProfiles] = await Promise.all([
      this.enterpriseMailboxRuleRepository.find({
        where: { workspaceId },
        order: {
          priority: 'ASC',
          updatedAt: 'DESC',
        },
      }),
      this.enterpriseMailboxProfileRepository.find({
        where: { workspaceId },
      }),
    ]);

    const mailboxProfileById = Object.fromEntries(
      mailboxProfiles.map((mailboxProfile) => [
        mailboxProfile.id,
        mailboxProfile.emailAddress,
      ]),
    );

    return mailboxRules.map((mailboxRule) => ({
      ...mailboxRule,
      emailAddress: mailboxProfileById[mailboxRule.mailboxProfileId] ?? null,
    }));
  }

  async findRecentActivity(workspaceId: string) {
    const mailboxProfiles = await this.enterpriseMailboxProfileRepository.find({
      where: { workspaceId },
    });

    const mailboxProfileById = Object.fromEntries(
      mailboxProfiles.map((mailboxProfile) => [
        mailboxProfile.id,
        mailboxProfile.emailAddress,
      ]),
    );

    const activityLogs =
      await this.enterpriseConfigAuditService.findRecentLogsByResourceType({
        workspaceId,
        resourceType: 'enterpriseMailboxRule',
        limit: 10,
      });

    return activityLogs.map((activityLog) => ({
      id: activityLog.id,
      action: activityLog.action,
      resourceId: activityLog.resourceId,
      actorWorkspaceMemberId: activityLog.actorWorkspaceMemberId,
      createdAt: activityLog.createdAt,
      beforeJson: activityLog.beforeJson,
      afterJson: activityLog.afterJson,
      contextJson: activityLog.contextJson,
      emailAddress:
        typeof activityLog.afterJson?.mailboxProfileId === 'string'
          ? mailboxProfileById[String(activityLog.afterJson.mailboxProfileId)] ??
            null
          : null,
      ruleName:
        typeof activityLog.afterJson?.name === 'string'
          ? String(activityLog.afterJson.name)
          : null,
      ruleType:
        typeof activityLog.afterJson?.ruleType === 'string'
          ? String(activityLog.afterJson.ruleType)
          : null,
    }));
  }

  async findReadinessPreview(workspaceId: string) {
    const [mailboxRules, mailboxProfiles, mailboxAssignments, messageChannels] =
      await Promise.all([
        this.enterpriseMailboxRuleRepository.find({
          where: { workspaceId },
          order: {
            priority: 'ASC',
            updatedAt: 'DESC',
          },
        }),
        this.enterpriseMailboxProfileRepository.find({
          where: { workspaceId },
        }),
        this.enterpriseMailboxAssignmentRepository.find({
          where: { workspaceId },
        }),
        this.messageChannelDataAccessService.findMany(workspaceId, {
          relations: ['messageFolders'],
        }),
      ]);
    return mailboxRules.map((mailboxRule) =>
      this.buildReadinessEntry(
        mailboxRule,
        mailboxProfiles,
        mailboxAssignments,
        messageChannels,
      ),
    );
  }

  async findRuleDryRunPreview(
    workspaceId: string,
    mailboxRuleId: string,
    limit = 5,
  ): Promise<MailboxRuleDryRunPreview> {
    const [mailboxRule, mailboxProfiles, mailboxAssignments, messageChannels] =
      await Promise.all([
        this.enterpriseMailboxRuleRepository.findOneByOrFail({
          id: mailboxRuleId,
          workspaceId,
        }),
        this.enterpriseMailboxProfileRepository.find({
          where: { workspaceId },
        }),
        this.enterpriseMailboxAssignmentRepository.find({
          where: { workspaceId },
        }),
        this.messageChannelDataAccessService.findMany(workspaceId, {
          relations: ['messageFolders'],
        }),
      ]);

    const readinessPreview = this.buildReadinessEntry(
      mailboxRule,
      mailboxProfiles,
      mailboxAssignments,
      messageChannels,
    );
    const mailboxProfile =
      mailboxProfiles.find(
        (candidateMailboxProfile) =>
          candidateMailboxProfile.id === mailboxRule.mailboxProfileId,
      ) ?? null;
    const messageChannel =
      (mailboxProfile
        ? messageChannels.find(
            (candidateMessageChannel) =>
              candidateMessageChannel.id === mailboxProfile.messageChannelId,
          )
        : null) ??
      (mailboxProfile
        ? messageChannels.find(
            (candidateMessageChannel) =>
              this.normalizeMailboxToken(candidateMessageChannel.handle) ===
              this.normalizeMailboxToken(mailboxProfile.emailAddress),
          )
        : null) ??
      null;

    if (!messageChannel) {
      return {
        ruleId: mailboxRule.id,
        ruleName: mailboxRule.name,
        ruleType: mailboxRule.ruleType,
        emailAddress: mailboxProfile?.emailAddress ?? null,
        status: readinessPreview.status,
        warnings: readinessPreview.warnings,
        blockers: readinessPreview.blockers,
        candidateCount: 0,
        candidates: [],
      };
    }

    const sourceFolderToken = this.normalizeMailboxToken(
      this.getSourceFolder(mailboxRule.conditionsJson),
    );
    const senderDomain =
      typeof mailboxRule.conditionsJson?.senderDomain === 'string'
        ? mailboxRule.conditionsJson.senderDomain.trim().toLowerCase()
        : '';
    const subjectKeyword =
      typeof mailboxRule.conditionsJson?.subjectKeyword === 'string'
        ? mailboxRule.conditionsJson.subjectKeyword.trim().toLowerCase()
        : '';
    const onlyUnread = Boolean(mailboxRule.conditionsJson?.onlyUnread);
    const onlyUnlinkedThreads = Boolean(
      mailboxRule.conditionsJson?.onlyUnlinkedThreads,
    );

    const authContext = buildSystemAuthContext(workspaceId);

    const candidateRows = await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const associationRepository =
          await this.globalWorkspaceOrmManager.getRepository<MessageChannelMessageAssociationWorkspaceEntity>(
            workspaceId,
            'messageChannelMessageAssociation',
            { shouldBypassPermissionChecks: true },
          );

        const queryBuilder = associationRepository
          .createQueryBuilder('association')
          .distinctOn(['message.messageThreadId'])
          .innerJoin('association.message', 'message')
          .leftJoin('message.messageParticipants', 'participant')
          .leftJoin('association.messageFolders', 'associationMessageFolder')
          .leftJoin('associationMessageFolder.messageFolder', 'messageFolder')
          .select('message.messageThreadId', 'threadId')
          .addSelect('message.id', 'messageId')
          .addSelect('message.subject', 'subject')
          .addSelect('message.receivedAt', 'receivedAt')
          .addSelect('message.text', 'text')
          .addSelect('participant.handle', 'senderHandle')
          .addSelect('participant.personId', 'personId')
          .where('association.messageChannelId = :messageChannelId', {
            messageChannelId: messageChannel.id,
          })
          .orderBy('message.messageThreadId', 'ASC')
          .addOrderBy('message.receivedAt', 'DESC')
          .limit(Math.max(limit * 4, 12));

        if (sourceFolderToken.length > 0) {
          queryBuilder.andWhere(
            '(LOWER(COALESCE(messageFolder.name, \'\')) = :sourceFolderToken OR LOWER(COALESCE(messageFolder.externalId, \'\')) = :sourceFolderToken)',
            { sourceFolderToken },
          );
        }

        if (senderDomain.length > 0) {
          queryBuilder.andWhere(
            'LOWER(COALESCE(participant.handle, \'\')) LIKE :senderDomainPattern',
            {
              senderDomainPattern: `%@${senderDomain}`,
            },
          );
        }

        if (subjectKeyword.length > 0) {
          queryBuilder.andWhere(
            'LOWER(COALESCE(message.subject, \'\')) LIKE :subjectKeywordPattern',
            {
              subjectKeywordPattern: `%${subjectKeyword}%`,
            },
          );
        }

        return queryBuilder.getRawMany<{
          threadId: string;
          messageId: string;
          subject: string | null;
          receivedAt: string | null;
          text: string | null;
          senderHandle: string | null;
          personId: string | null;
        }>();
      },
      authContext,
      { lite: true },
    );

    const threadIds = candidateRows.map((candidateRow) => candidateRow.threadId);
    const [threadStates, threadTaskLinks, crmLinks] =
      threadIds.length === 0
        ? [[], [], []]
        : await Promise.all([
            this.tradeCrmMailThreadStateRepository.find({
              where: {
                workspaceId,
                threadId: In(threadIds),
              },
            }),
            this.tradeCrmMailThreadTaskLinkRepository.find({
              where: {
                workspaceId,
                threadId: In(threadIds),
              },
            }),
            this.enterpriseMailThreadCrmLinkRepository.find({
              where: {
                workspaceId,
                threadId: In(threadIds),
              },
            }),
          ]);
    const threadStateByThreadId = Object.fromEntries(
      threadStates.map((threadState) => [threadState.threadId, threadState]),
    );
    const threadTaskLinkByThreadId = Object.fromEntries(
      threadTaskLinks.map((threadTaskLink) => [
        threadTaskLink.threadId,
        threadTaskLink,
      ]),
    );
    const crmLinkByThreadId = Object.fromEntries(
      crmLinks.map((threadCrmLink) => [threadCrmLink.threadId, threadCrmLink]),
    );

    const candidates = candidateRows
      .filter((candidateRow) => {
        if (!onlyUnread) {
          return true;
        }

        return !threadStateByThreadId[candidateRow.threadId]?.isPending;
      })
      .filter((candidateRow) => {
        if (!onlyUnlinkedThreads) {
          return true;
        }

        const crmLink = crmLinkByThreadId[candidateRow.threadId];

        return !crmLink?.companyId && !crmLink?.personId && !crmLink?.opportunityId;
      })
      .slice(0, limit)
      .map((candidateRow) => {
        const threadState = threadStateByThreadId[candidateRow.threadId];
        const taskLink = threadTaskLinkByThreadId[candidateRow.threadId];
        const crmLink = crmLinkByThreadId[candidateRow.threadId];
        const matchedSignals = [
          sourceFolderToken.length > 0
            ? `Matched folder ${this.getSourceFolder(mailboxRule.conditionsJson)}`
            : null,
          senderDomain.length > 0
            ? `Matched sender domain ${senderDomain}`
            : null,
          subjectKeyword.length > 0
            ? `Matched subject keyword ${subjectKeyword}`
            : null,
          onlyUnread ? 'Unread-only gate enabled' : null,
          onlyUnlinkedThreads ? 'Unlinked-thread gate enabled' : null,
        ].filter((value): value is string => value !== null);

        return {
          threadId: candidateRow.threadId,
          messageId: candidateRow.messageId,
          subject: candidateRow.subject ?? '(no subject)',
          senderHandle: candidateRow.senderHandle,
          receivedAt: candidateRow.receivedAt,
          pending: Boolean(threadState?.isPending),
          taskLinked: Boolean(taskLink?.taskId),
          crmLinked: Boolean(
            crmLink?.companyId || crmLink?.personId || crmLink?.opportunityId,
          ),
          matchedSignals,
          plannedActions: this.getPreviewPlannedActions(mailboxRule),
        };
      });

    return {
      ruleId: mailboxRule.id,
      ruleName: mailboxRule.name,
      ruleType: mailboxRule.ruleType,
      emailAddress: mailboxProfile?.emailAddress ?? null,
      status: readinessPreview.status,
      warnings: readinessPreview.warnings,
      blockers: readinessPreview.blockers,
      candidateCount: candidates.length,
      candidates,
    };
  }

  async updateRule(input: UpdateEnterpriseMailboxRuleInput) {
    const mailboxRule = await this.enterpriseMailboxRuleRepository.findOneByOrFail({
      id: input.id,
      workspaceId: input.workspaceId,
    });

    const beforeSnapshot = {
      mailboxProfileId: mailboxRule.mailboxProfileId,
      name: mailboxRule.name,
      ruleType: mailboxRule.ruleType,
      enabled: mailboxRule.enabled,
      priority: mailboxRule.priority,
      actionsJson: mailboxRule.actionsJson,
      conditionsJson: mailboxRule.conditionsJson,
    };

    if (
      input.mailboxProfileId !== undefined &&
      input.mailboxProfileId !== mailboxRule.mailboxProfileId
    ) {
      await this.enterpriseMailboxProfileRepository.findOneByOrFail({
        id: input.mailboxProfileId,
        workspaceId: input.workspaceId,
      });
      mailboxRule.mailboxProfileId = input.mailboxProfileId;
    }

    if (input.name !== undefined) {
      mailboxRule.name = input.name.trim();
    }

    if (input.ruleType !== undefined) {
      mailboxRule.ruleType = input.ruleType;
    }

    if (input.conditionsJson !== undefined) {
      mailboxRule.conditionsJson = input.conditionsJson;
    }

    if (input.actionsJson !== undefined) {
      mailboxRule.actionsJson = input.actionsJson;
    }

    if (input.enabled !== undefined) {
      mailboxRule.enabled = input.enabled;
    }

    if (input.priority !== undefined) {
      mailboxRule.priority = input.priority;
    }

    const savedMailboxRule = await this.enterpriseMailboxRuleRepository.save(mailboxRule);

    await this.enterpriseConfigAuditService.createLog({
      workspaceId: input.workspaceId,
      action: 'enterprise_mailbox_rule.update',
      resourceType: 'enterpriseMailboxRule',
      resourceId: savedMailboxRule.id,
      actorWorkspaceMemberId: input.updatedByWorkspaceMemberId ?? null,
      beforeJson: beforeSnapshot,
      afterJson: {
        mailboxProfileId: savedMailboxRule.mailboxProfileId,
        name: savedMailboxRule.name,
        ruleType: savedMailboxRule.ruleType,
        enabled: savedMailboxRule.enabled,
        priority: savedMailboxRule.priority,
      },
      contextJson: {
        actionsJson: savedMailboxRule.actionsJson,
        conditionsJson: savedMailboxRule.conditionsJson,
      },
    });

    return savedMailboxRule;
  }
}
