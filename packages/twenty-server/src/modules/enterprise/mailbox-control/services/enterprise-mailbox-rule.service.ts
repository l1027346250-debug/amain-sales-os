import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { In, Repository } from 'typeorm';

import { TradeCrmMailThreadStateEntity } from 'src/engine/core-modules/messaging/entities/trade-crm-mail-thread-state.entity';
import { TradeCrmMailThreadTagEntity } from 'src/engine/core-modules/messaging/entities/trade-crm-mail-thread-tag.entity';
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
import { EnterpriseMailboxRuleResultEntity } from 'src/modules/enterprise/mailbox-control/entities/enterprise-mailbox-rule-result.entity';
import { type MessageChannelMessageAssociationWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-channel-message-association.workspace-entity';
import { type MessageChannelMessageAssociationMessageFolderWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-channel-message-association-message-folder.workspace-entity';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { type TaskTargetWorkspaceEntity } from 'src/modules/task/standard-objects/task-target.workspace-entity';
import { type TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';

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

type MailboxRuleExecutionResultSnapshot = {
  id: string;
  mailboxRuleId: string;
  mailboxProfileId: string;
  executionType: string;
  outcome: string;
  threadId: string | null;
  summary: string;
  failureReason: string | null;
  matchedSignalsJson: string[] | null;
  plannedActionsJson: string[] | null;
  metadataJson: Record<string, unknown> | null;
  createdAt: Date;
  emailAddress: string | null;
  ruleName: string | null;
  ruleType: string | null;
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
    @InjectRepository(TradeCrmMailThreadTagEntity)
    private readonly tradeCrmMailThreadTagRepository: Repository<TradeCrmMailThreadTagEntity>,
    @InjectRepository(TradeCrmMailThreadTaskLinkEntity)
    private readonly tradeCrmMailThreadTaskLinkRepository: Repository<TradeCrmMailThreadTaskLinkEntity>,
    @InjectRepository(EnterpriseMailboxRuleResultEntity)
    private readonly enterpriseMailboxRuleResultRepository: Repository<EnterpriseMailboxRuleResultEntity>,
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

  private async createRuleResult(input: {
    workspaceId: string;
    mailboxRuleId: string;
    mailboxProfileId: string;
    executionType: string;
    outcome: string;
    threadId?: string | null;
    summary: string;
    failureReason?: string | null;
    matchedSignalsJson?: string[] | null;
    plannedActionsJson?: string[] | null;
    metadataJson?: Record<string, unknown> | null;
  }) {
    return this.enterpriseMailboxRuleResultRepository.save(
      this.enterpriseMailboxRuleResultRepository.create({
        workspaceId: input.workspaceId,
        mailboxRuleId: input.mailboxRuleId,
        mailboxProfileId: input.mailboxProfileId,
        executionType: input.executionType,
        outcome: input.outcome,
        threadId: input.threadId ?? null,
        summary: input.summary,
        failureReason: input.failureReason ?? null,
        matchedSignalsJson: input.matchedSignalsJson ?? null,
        plannedActionsJson: input.plannedActionsJson ?? null,
        metadataJson: input.metadataJson ?? null,
      }),
    );
  }

  private async upsertMailThreadState(input: {
    workspaceId: string;
    threadId: string;
    isPending: boolean;
    pendingReason: string | null;
    metadata: Record<string, unknown> | null;
  }) {
    const existingThreadState =
      await this.tradeCrmMailThreadStateRepository.findOneBy({
        workspaceId: input.workspaceId,
        threadId: input.threadId,
      });

    return this.tradeCrmMailThreadStateRepository.save({
      id: existingThreadState?.id,
      workspaceId: input.workspaceId,
      threadId: input.threadId,
      isPending: input.isPending,
      pendingReason: input.pendingReason,
      metadata: input.metadata,
    });
  }

  private async createFollowUpTaskForThread(input: {
    workspaceId: string;
    mailboxProfileId: string;
    threadId: string;
    subject: string;
    assigneeId: string | null;
    companyId?: string | null;
    personId?: string | null;
    opportunityId?: string | null;
  }) {
    const authContext = buildSystemAuthContext(input.workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const taskRepository =
          await this.globalWorkspaceOrmManager.getRepository<TaskWorkspaceEntity>(
            input.workspaceId,
            'task',
            { shouldBypassPermissionChecks: true },
          );
        const taskTargetRepository =
          await this.globalWorkspaceOrmManager.getRepository<TaskTargetWorkspaceEntity>(
            input.workspaceId,
            'taskTarget',
            { shouldBypassPermissionChecks: true },
          );

        const createdTask = await taskRepository.save(
          taskRepository.create({
            title: `Reply follow-up: ${input.subject}`,
            bodyV2: null,
            dueAt: new Date(),
            status: 'TODO',
            assigneeId: input.assigneeId,
          }),
        );

        if (input.companyId || input.personId || input.opportunityId) {
          await taskTargetRepository.save(
            taskTargetRepository.create({
              taskId: createdTask.id,
              targetCompanyId: input.companyId ?? null,
              targetPersonId: input.personId ?? null,
              targetOpportunityId: input.opportunityId ?? null,
            }),
          );
        }

        return createdTask;
      },
      authContext,
      { lite: true },
    );
  }

  private async updateFollowUpTaskAssignee(input: {
    workspaceId: string;
    taskId: string;
    assigneeId: string | null;
  }) {
    const authContext = buildSystemAuthContext(input.workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const taskRepository =
          await this.globalWorkspaceOrmManager.getRepository<TaskWorkspaceEntity>(
            input.workspaceId,
            'task',
            { shouldBypassPermissionChecks: true },
          );
        const existingTask = await taskRepository.findOne({
          where: {
            id: input.taskId,
          },
        });

        if (!existingTask) {
          return null;
        }

        existingTask.assigneeId = input.assigneeId;

        return taskRepository.save(existingTask);
      },
      authContext,
      { lite: true },
    );
  }

  private async findMessageChannelsWithFolders(workspaceId: string) {
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      () =>
        this.messageChannelDataAccessService.findMany(workspaceId, {
          relations: ['messageFolders'],
        }),
      authContext,
      { lite: true },
    );
  }

  private async executeFolderRoutingRule(input: {
    workspaceId: string;
    mailboxRule: EnterpriseMailboxRuleEntity;
    preview: MailboxRuleDryRunPreview;
  }) {
    const mailboxProfiles = await this.enterpriseMailboxProfileRepository.find({
      where: { workspaceId: input.workspaceId },
    });
    const mailboxProfile =
      mailboxProfiles.find(
        (candidateMailboxProfile) =>
          candidateMailboxProfile.id === input.mailboxRule.mailboxProfileId,
      ) ?? null;

    const messageChannels = await this.findMessageChannelsWithFolders(
      input.workspaceId,
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

    if (!mailboxProfile || !messageChannel) {
      await this.createRuleResult({
        workspaceId: input.workspaceId,
        mailboxRuleId: input.mailboxRule.id,
        mailboxProfileId: input.mailboxRule.mailboxProfileId,
        executionType: 'runtime',
        outcome: 'blocked',
        summary: 'Folder routing runtime is blocked because the mailbox channel is missing.',
        failureReason: 'message-channel-missing',
      });

      return {
        executedCount: 0,
        skippedCount: 1,
        unsupported: false,
      };
    }

    const targetFolderToken = this.normalizeMailboxToken(
      this.getTargetFolder(input.mailboxRule.actionsJson),
    );
    const sourceFolderToken = this.normalizeMailboxToken(
      this.getSourceFolder(input.mailboxRule.conditionsJson),
    );
    const targetFolder =
      messageChannel.messageFolders?.find(
        (messageFolder) =>
          this.normalizeMailboxToken(messageFolder.externalId) ===
            targetFolderToken ||
          this.normalizeMailboxToken(messageFolder.name) === targetFolderToken,
      ) ?? null;

    if (!targetFolder?.id) {
      await this.createRuleResult({
        workspaceId: input.workspaceId,
        mailboxRuleId: input.mailboxRule.id,
        mailboxProfileId: input.mailboxRule.mailboxProfileId,
        executionType: 'runtime',
        outcome: 'blocked',
        summary: 'Folder routing runtime is blocked because the target folder is unavailable.',
        failureReason: 'target-folder-missing',
        metadataJson: {
          targetFolder: this.getTargetFolder(input.mailboxRule.actionsJson),
        },
      });

      return {
        executedCount: 0,
        skippedCount: 1,
        unsupported: false,
      };
    }

    const sourceFolderIds = new Set(
      (messageChannel.messageFolders ?? [])
        .filter(
          (messageFolder) =>
            this.normalizeMailboxToken(messageFolder.externalId) ===
              sourceFolderToken ||
            this.normalizeMailboxToken(messageFolder.name) === sourceFolderToken,
        )
        .map((messageFolder) => messageFolder.id)
        .filter((messageFolderId): messageFolderId is string =>
          typeof messageFolderId === 'string' && messageFolderId.length > 0,
        ),
    );

    const authContext = buildSystemAuthContext(input.workspaceId);
    const threadIds = input.preview.candidates.map((candidate) => candidate.threadId);

    const routingResult = await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const associationRepository =
          await this.globalWorkspaceOrmManager.getRepository<MessageChannelMessageAssociationWorkspaceEntity>(
            input.workspaceId,
            'messageChannelMessageAssociation',
            { shouldBypassPermissionChecks: true },
          );
        const associationFolderRepository =
          await this.globalWorkspaceOrmManager.getRepository<MessageChannelMessageAssociationMessageFolderWorkspaceEntity>(
            input.workspaceId,
            'messageChannelMessageAssociationMessageFolder',
            { shouldBypassPermissionChecks: true },
          );

        const associations = await associationRepository.find({
          where: {
            messageChannelId: messageChannel.id,
            message: {
              messageThreadId: In(threadIds),
            },
          },
          relations: ['message'],
        });
        const associationIds = associations.map((association) => association.id);

        const existingFolderLinks =
          associationIds.length === 0
            ? []
            : await associationFolderRepository.find({
                where: {
                  messageChannelMessageAssociationId: In(associationIds),
                },
              });

        const linksByAssociationId = new Map<
          string,
          MessageChannelMessageAssociationMessageFolderWorkspaceEntity[]
        >();

        for (const existingFolderLink of existingFolderLinks) {
          const links = linksByAssociationId.get(
            existingFolderLink.messageChannelMessageAssociationId,
          );

          if (links) {
            links.push(existingFolderLink);
          } else {
            linksByAssociationId.set(
              existingFolderLink.messageChannelMessageAssociationId,
              [existingFolderLink],
            );
          }
        }

        const linksToDelete = existingFolderLinks.filter((existingFolderLink) =>
          sourceFolderIds.has(existingFolderLink.messageFolderId),
        );
        const targetFolderInsertRows = associations
          .filter((association) => {
            const links = linksByAssociationId.get(association.id) ?? [];

            return !links.some(
              (existingFolderLink) =>
                existingFolderLink.messageFolderId === targetFolder.id,
            );
          })
          .map((association) => ({
            messageChannelMessageAssociationId: association.id,
            messageFolderId: targetFolder.id,
          }));

        if (linksToDelete.length > 0) {
          await associationFolderRepository.delete(
            linksToDelete.map((linkToDelete) => linkToDelete.id),
          );
        }

        if (targetFolderInsertRows.length > 0) {
          await associationFolderRepository.insert(targetFolderInsertRows);
        }

        return {
          associations,
          linksByAssociationId,
          targetFolderName:
            targetFolder.name ??
            this.getTargetFolder(input.mailboxRule.actionsJson) ??
            'target folder',
          removedLinkCount: linksToDelete.length,
          insertedLinkCount: targetFolderInsertRows.length,
        };
      },
      authContext,
      { lite: true },
    );

    let executedCount = 0;

    for (const candidate of input.preview.candidates) {
      const candidateAssociation = routingResult.associations.find(
        (association) => association.message?.messageThreadId === candidate.threadId,
      );

      if (!candidateAssociation) {
        await this.createRuleResult({
          workspaceId: input.workspaceId,
          mailboxRuleId: input.mailboxRule.id,
          mailboxProfileId: input.mailboxRule.mailboxProfileId,
          executionType: 'runtime',
          outcome: 'failed',
          threadId: candidate.threadId,
          summary: `Folder routing skipped thread "${candidate.subject}" because no channel association was found.`,
          failureReason: 'thread-association-missing',
          matchedSignalsJson: candidate.matchedSignals,
          plannedActionsJson: candidate.plannedActions,
        });

        continue;
      }

      await this.createRuleResult({
        workspaceId: input.workspaceId,
        mailboxRuleId: input.mailboxRule.id,
        mailboxProfileId: input.mailboxRule.mailboxProfileId,
        executionType: 'runtime',
        outcome: 'acted',
        threadId: candidate.threadId,
        summary: `Folder routing moved thread "${candidate.subject}" to ${routingResult.targetFolderName}.`,
        matchedSignalsJson: candidate.matchedSignals,
        plannedActionsJson: candidate.plannedActions,
        metadataJson: {
          targetFolderId: targetFolder.id,
          targetFolderName: routingResult.targetFolderName,
          removedSourceLinks: routingResult.removedLinkCount,
          insertedTargetLinks: routingResult.insertedLinkCount,
          markAsReadApplied: false,
          unsupportedActions: input.mailboxRule.actionsJson?.markAsRead
            ? ['markAsRead']
            : [],
        },
      });

      executedCount += 1;
    }

    return {
      executedCount,
      skippedCount: input.preview.candidates.length - executedCount,
      unsupported: false,
    };
  }

  private async executeCustomerAutoLinkRule(input: {
    workspaceId: string;
    mailboxRule: EnterpriseMailboxRuleEntity;
    preview: MailboxRuleDryRunPreview;
  }) {
    if (input.preview.candidates.length === 0) {
      await this.createRuleResult({
        workspaceId: input.workspaceId,
        mailboxRuleId: input.mailboxRule.id,
        mailboxProfileId: input.mailboxRule.mailboxProfileId,
        executionType: 'runtime',
        outcome: 'no-match',
        summary: 'Customer auto-link runtime found no matching threads.',
        failureReason: null,
        metadataJson: {
          candidateCount: 0,
        },
      });

      return {
        executedCount: 0,
        skippedCount: 0,
        unsupported: false,
      };
    }

    const authContext = buildSystemAuthContext(input.workspaceId);
    const threadIds = input.preview.candidates.map((candidate) => candidate.threadId);
    const candidatePersonIds = input.preview.candidates
      .map((candidate) => {
        const personSignal = candidate.matchedSignals.find((signal) =>
          signal.startsWith('Matched person '),
        );

        return personSignal ? personSignal.replace('Matched person ', '') : null;
      })
      .filter((personId): personId is string => typeof personId === 'string');

    const existingLinks = await this.enterpriseMailThreadCrmLinkRepository.find({
      where: {
        workspaceId: input.workspaceId,
        threadId: In(threadIds),
      },
    });
    const existingLinkByThreadId = Object.fromEntries(
      existingLinks.map((existingLink) => [existingLink.threadId, existingLink]),
    );

    const personAndOpportunityData =
      candidatePersonIds.length === 0
        ? {
            personById: {} as Record<string, { id: string; companyId: string | null }>,
            latestOpportunityByCompanyId: {} as Record<
              string,
              { id: string; companyId: string | null }
            >,
          }
        : await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
            async () => {
              const personRepository =
                await this.globalWorkspaceOrmManager.getRepository<PersonWorkspaceEntity>(
                  input.workspaceId,
                  'person',
                  { shouldBypassPermissionChecks: true },
                );
              const opportunityRepository =
                await this.globalWorkspaceOrmManager.getRepository<OpportunityWorkspaceEntity>(
                  input.workspaceId,
                  'opportunity',
                  { shouldBypassPermissionChecks: true },
                );

              const people = await personRepository.find({
                where: {
                  id: In(candidatePersonIds),
                },
                select: {
                  id: true,
                  companyId: true,
                },
              });
              const companyIds = people
                .map((person) => person.companyId)
                .filter((companyId): companyId is string => typeof companyId === 'string');
              const opportunities =
                companyIds.length === 0
                  ? []
                  : await opportunityRepository.find({
                      where: {
                        companyId: In(companyIds),
                      },
                      select: {
                        id: true,
                        companyId: true,
                        updatedAt: true,
                      },
                      order: {
                        updatedAt: 'DESC',
                      },
                    });

              const latestOpportunityByCompanyId = Object.fromEntries(
                opportunities
                  .filter(
                    (opportunity) =>
                      typeof opportunity.companyId === 'string' &&
                      opportunity.companyId.length > 0,
                  )
                  .filter(
                    (opportunity, index, collection) =>
                      collection.findIndex(
                        (candidateOpportunity) =>
                          candidateOpportunity.companyId === opportunity.companyId,
                      ) === index,
                  )
                  .map((opportunity) => [
                    opportunity.companyId as string,
                    {
                      id: opportunity.id,
                      companyId: opportunity.companyId,
                    },
                  ]),
              );

              return {
                personById: Object.fromEntries(
                  people.map((person) => [
                    person.id,
                    {
                      id: person.id,
                      companyId: person.companyId,
                    },
                  ]),
                ),
                latestOpportunityByCompanyId,
              };
            },
            authContext,
            { lite: true },
          );

    let executedCount = 0;

    for (const candidate of input.preview.candidates) {
      const personSignal = candidate.matchedSignals.find((signal) =>
        signal.startsWith('Matched person '),
      );
      const personId = personSignal
        ? personSignal.replace('Matched person ', '')
        : null;
      const personRecord = personId
        ? personAndOpportunityData.personById[personId] ?? null
        : null;
      const companyId = personRecord?.companyId ?? null;
      const opportunityId =
        companyId && input.mailboxRule.actionsJson?.attachToLatestOpportunity
          ? personAndOpportunityData.latestOpportunityByCompanyId[companyId]?.id ?? null
          : null;
      const nextPersonId =
        input.mailboxRule.actionsJson?.linkToPerson && personRecord ? personRecord.id : null;
      const nextCompanyId =
        input.mailboxRule.actionsJson?.linkToCompany && companyId ? companyId : null;

      if (
        !nextPersonId &&
        !nextCompanyId &&
        !opportunityId &&
        input.mailboxRule.conditionsJson?.requireKnownContact
      ) {
        await this.createRuleResult({
          workspaceId: input.workspaceId,
          mailboxRuleId: input.mailboxRule.id,
          mailboxProfileId: input.mailboxRule.mailboxProfileId,
          executionType: 'runtime',
          outcome: 'failed',
          threadId: candidate.threadId,
          summary: `Customer auto-link skipped thread "${candidate.subject}" because no known contact could be resolved.`,
          failureReason: 'known-contact-missing',
          matchedSignalsJson: candidate.matchedSignals,
          plannedActionsJson: candidate.plannedActions,
        });

        continue;
      }

      if (!nextPersonId && !nextCompanyId && !opportunityId) {
        await this.createRuleResult({
          workspaceId: input.workspaceId,
          mailboxRuleId: input.mailboxRule.id,
          mailboxProfileId: input.mailboxRule.mailboxProfileId,
          executionType: 'runtime',
          outcome: 'skipped',
          threadId: candidate.threadId,
          summary: `Customer auto-link found no CRM target for thread "${candidate.subject}".`,
          failureReason: input.mailboxRule.actionsJson?.createLeadWhenUnmatched
            ? 'lead-creation-not-implemented'
            : 'crm-target-missing',
          matchedSignalsJson: candidate.matchedSignals,
          plannedActionsJson: candidate.plannedActions,
          metadataJson: {
            unsupportedActions: input.mailboxRule.actionsJson?.createLeadWhenUnmatched
              ? ['createLeadWhenUnmatched']
              : [],
          },
        });

        continue;
      }

      const existingLink = existingLinkByThreadId[candidate.threadId];
      const savedLink = await this.enterpriseMailThreadCrmLinkRepository.save({
        id: existingLink?.id,
        workspaceId: input.workspaceId,
        threadId: candidate.threadId,
        companyId: nextCompanyId ?? existingLink?.companyId ?? null,
        personId: nextPersonId ?? existingLink?.personId ?? null,
        opportunityId: opportunityId ?? existingLink?.opportunityId ?? null,
        taskId: existingLink?.taskId ?? null,
        source: 'rule:customer-auto-link',
        confidence: 0.9,
        linkedByWorkspaceMemberId: null,
      });

      existingLinkByThreadId[candidate.threadId] = savedLink;

      await this.createRuleResult({
        workspaceId: input.workspaceId,
        mailboxRuleId: input.mailboxRule.id,
        mailboxProfileId: input.mailboxRule.mailboxProfileId,
        executionType: 'runtime',
        outcome: 'acted',
        threadId: candidate.threadId,
        summary: `Customer auto-link linked thread "${candidate.subject}" to CRM context.`,
        matchedSignalsJson: candidate.matchedSignals,
        plannedActionsJson: candidate.plannedActions,
        metadataJson: {
          personId: savedLink.personId,
          companyId: savedLink.companyId,
          opportunityId: savedLink.opportunityId,
          unsupportedActions: input.mailboxRule.actionsJson?.createLeadWhenUnmatched
            ? ['createLeadWhenUnmatched']
            : [],
        },
      });

      executedCount += 1;
    }

    return {
      executedCount,
      skippedCount: input.preview.candidates.length - executedCount,
      unsupported: false,
    };
  }

  private async executeSubordinateEscalationRule(input: {
    workspaceId: string;
    mailboxRule: EnterpriseMailboxRuleEntity;
    preview: MailboxRuleDryRunPreview;
  }) {
    if (input.preview.candidates.length === 0) {
      await this.createRuleResult({
        workspaceId: input.workspaceId,
        mailboxRuleId: input.mailboxRule.id,
        mailboxProfileId: input.mailboxRule.mailboxProfileId,
        executionType: 'runtime',
        outcome: 'no-match',
        summary: 'Subordinate escalation runtime found no matching threads.',
        failureReason: null,
        metadataJson: {
          candidateCount: 0,
        },
      });

      return {
        executedCount: 0,
        skippedCount: 0,
        unsupported: false,
      };
    }

    const activeAssignments = await this.enterpriseMailboxAssignmentRepository.find({
      where: {
        workspaceId: input.workspaceId,
        mailboxProfileId: input.mailboxRule.mailboxProfileId,
        assignmentStatus: 'active',
      },
      order: {
        canHandleSubordinates: 'DESC',
        canViewSubordinates: 'DESC',
        isPrimaryMailbox: 'DESC',
        updatedAt: 'DESC',
      },
    });
    const primaryAssigneeId =
      activeAssignments.find((assignment) => assignment.isPrimaryMailbox)
        ?.workspaceMemberId ??
      activeAssignments[0]?.workspaceMemberId ??
      null;
    const managerAssigneeId =
      activeAssignments.find((assignment) => assignment.canHandleSubordinates)
        ?.workspaceMemberId ??
      activeAssignments.find((assignment) => assignment.canViewSubordinates)
        ?.workspaceMemberId ??
      null;
    const escalationAssigneeId = input.mailboxRule.actionsJson?.escalateToManager
      ? managerAssigneeId ?? primaryAssigneeId
      : input.mailboxRule.actionsJson?.reassignToPrimarySender
        ? primaryAssigneeId
        : primaryAssigneeId;

    const crmLinks = await this.enterpriseMailThreadCrmLinkRepository.find({
      where: {
        workspaceId: input.workspaceId,
        threadId: In(input.preview.candidates.map((candidate) => candidate.threadId)),
      },
    });
    const crmLinkByThreadId = Object.fromEntries(
      crmLinks.map((crmLink) => [crmLink.threadId, crmLink]),
    );
    const threadTaskLinks = await this.tradeCrmMailThreadTaskLinkRepository.find({
      where: {
        workspaceId: input.workspaceId,
        threadId: In(input.preview.candidates.map((candidate) => candidate.threadId)),
      },
    });
    const threadTaskLinkByThreadId = Object.fromEntries(
      threadTaskLinks.map((threadTaskLink) => [threadTaskLink.threadId, threadTaskLink]),
    );

    let executedCount = 0;

    for (const candidate of input.preview.candidates) {
      const maxReplyDelayHours =
        typeof input.mailboxRule.conditionsJson?.maxReplyDelayHours === 'number'
          ? input.mailboxRule.conditionsJson.maxReplyDelayHours
          : null;
      const receivedAt = candidate.receivedAt ? new Date(candidate.receivedAt) : null;
      const delaySatisfied =
        !receivedAt ||
        maxReplyDelayHours === null ||
        (Date.now() - receivedAt.getTime()) / (1000 * 60 * 60) >= maxReplyDelayHours;

      if (!delaySatisfied) {
        await this.createRuleResult({
          workspaceId: input.workspaceId,
          mailboxRuleId: input.mailboxRule.id,
          mailboxProfileId: input.mailboxRule.mailboxProfileId,
          executionType: 'runtime',
          outcome: 'skipped',
          threadId: candidate.threadId,
          summary: `Subordinate escalation skipped thread "${candidate.subject}" because the reply delay threshold has not been reached.`,
          failureReason: 'reply-delay-threshold-not-reached',
          matchedSignalsJson: candidate.matchedSignals,
          plannedActionsJson: candidate.plannedActions,
        });

        continue;
      }

      if (input.mailboxRule.conditionsJson?.onlyAssignedThreads && !candidate.taskLinked) {
        await this.createRuleResult({
          workspaceId: input.workspaceId,
          mailboxRuleId: input.mailboxRule.id,
          mailboxProfileId: input.mailboxRule.mailboxProfileId,
          executionType: 'runtime',
          outcome: 'skipped',
          threadId: candidate.threadId,
          summary: `Subordinate escalation skipped thread "${candidate.subject}" because no assigned follow-up task exists yet.`,
          failureReason: 'assigned-thread-missing',
          matchedSignalsJson: candidate.matchedSignals,
          plannedActionsJson: candidate.plannedActions,
        });

        continue;
      }

      await this.upsertMailThreadState({
        workspaceId: input.workspaceId,
        threadId: candidate.threadId,
        isPending: true,
        pendingReason: `Rule: ${input.mailboxRule.name}`,
        metadata: {
          ruleId: input.mailboxRule.id,
          ruleType: input.mailboxRule.ruleType,
          executionType: 'runtime',
        },
      });

      const existingTaskLink = threadTaskLinkByThreadId[candidate.threadId];
      let taskId = existingTaskLink?.taskId ?? null;

      if (input.mailboxRule.actionsJson?.createTask && !existingTaskLink?.taskId) {
        const crmLink = crmLinkByThreadId[candidate.threadId];
        const createdTask = await this.createFollowUpTaskForThread({
          workspaceId: input.workspaceId,
          mailboxProfileId: input.mailboxRule.mailboxProfileId,
          threadId: candidate.threadId,
          subject: candidate.subject,
          assigneeId: escalationAssigneeId,
          companyId: crmLink?.companyId ?? null,
          personId: crmLink?.personId ?? null,
          opportunityId: crmLink?.opportunityId ?? null,
        });

        taskId = createdTask.id;

        await this.tradeCrmMailThreadTaskLinkRepository.save({
          workspaceId: input.workspaceId,
          threadId: candidate.threadId,
          taskId: createdTask.id,
        });
      } else if (
        existingTaskLink?.taskId &&
        escalationAssigneeId &&
        (input.mailboxRule.actionsJson?.escalateToManager ||
          input.mailboxRule.actionsJson?.reassignToPrimarySender)
      ) {
        await this.updateFollowUpTaskAssignee({
          workspaceId: input.workspaceId,
          taskId: existingTaskLink.taskId,
          assigneeId: escalationAssigneeId,
        });
        taskId = existingTaskLink.taskId;
      }

      await this.createRuleResult({
        workspaceId: input.workspaceId,
        mailboxRuleId: input.mailboxRule.id,
        mailboxProfileId: input.mailboxRule.mailboxProfileId,
        executionType: 'runtime',
        outcome: 'acted',
        threadId: candidate.threadId,
        summary: `Subordinate escalation acted on thread "${candidate.subject}".`,
        matchedSignalsJson: candidate.matchedSignals,
        plannedActionsJson: candidate.plannedActions,
        metadataJson: {
          taskId,
          primaryAssigneeId,
          managerAssigneeId,
          escalationAssigneeId,
          unsupportedActions: input.mailboxRule.actionsJson?.notifyOwner
            ? ['notifyOwner']
            : [],
        },
      });

      executedCount += 1;
    }

    return {
      executedCount,
      skippedCount: input.preview.candidates.length - executedCount,
      unsupported: false,
    };
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

  async findRecentResults(workspaceId: string) {
    const [mailboxRuleResults, mailboxRules, mailboxProfiles] = await Promise.all([
      this.enterpriseMailboxRuleResultRepository.find({
        where: { workspaceId },
        order: { createdAt: 'DESC' },
        take: 20,
      }),
      this.enterpriseMailboxRuleRepository.find({
        where: { workspaceId },
      }),
      this.enterpriseMailboxProfileRepository.find({
        where: { workspaceId },
      }),
    ]);

    const mailboxRuleById = Object.fromEntries(
      mailboxRules.map((mailboxRule) => [mailboxRule.id, mailboxRule]),
    );
    const mailboxProfileById = Object.fromEntries(
      mailboxProfiles.map((mailboxProfile) => [mailboxProfile.id, mailboxProfile]),
    );

    return mailboxRuleResults.map(
      (mailboxRuleResult): MailboxRuleExecutionResultSnapshot => ({
        id: mailboxRuleResult.id,
        mailboxRuleId: mailboxRuleResult.mailboxRuleId,
        mailboxProfileId: mailboxRuleResult.mailboxProfileId,
        executionType: mailboxRuleResult.executionType,
        outcome: mailboxRuleResult.outcome,
        threadId: mailboxRuleResult.threadId,
        summary: mailboxRuleResult.summary,
        failureReason: mailboxRuleResult.failureReason,
        matchedSignalsJson: mailboxRuleResult.matchedSignalsJson,
        plannedActionsJson: mailboxRuleResult.plannedActionsJson,
        metadataJson: mailboxRuleResult.metadataJson,
        createdAt: mailboxRuleResult.createdAt,
        emailAddress:
          mailboxProfileById[mailboxRuleResult.mailboxProfileId]?.emailAddress ??
          null,
        ruleName: mailboxRuleById[mailboxRuleResult.mailboxRuleId]?.name ?? null,
        ruleType: mailboxRuleById[mailboxRuleResult.mailboxRuleId]?.ruleType ?? null,
      }),
    );
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
        this.findMessageChannelsWithFolders(workspaceId),
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
        this.findMessageChannelsWithFolders(workspaceId),
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
      await this.createRuleResult({
        workspaceId,
        mailboxRuleId: mailboxRule.id,
        mailboxProfileId: mailboxRule.mailboxProfileId,
        executionType: 'preview',
        outcome: 'blocked',
        summary: 'Preview blocked because no message channel is linked.',
        failureReason: readinessPreview.warnings[0] ?? readinessPreview.blockers[0] ?? null,
        metadataJson: {
          candidateCount: 0,
          status: readinessPreview.status,
        },
      });

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
          candidateRow.personId ? `Matched person ${candidateRow.personId}` : null,
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

    if (candidates.length === 0) {
      await this.createRuleResult({
        workspaceId,
        mailboxRuleId: mailboxRule.id,
        mailboxProfileId: mailboxRule.mailboxProfileId,
        executionType: 'preview',
        outcome: readinessPreview.status === 'blocked' ? 'blocked' : 'no-match',
        summary: 'Preview completed with no candidate threads.',
        failureReason:
          readinessPreview.status === 'blocked'
            ? readinessPreview.blockers[0] ?? null
            : null,
        metadataJson: {
          candidateCount: 0,
          status: readinessPreview.status,
        },
      });
    } else {
      await this.createRuleResult({
        workspaceId,
        mailboxRuleId: mailboxRule.id,
        mailboxProfileId: mailboxRule.mailboxProfileId,
        executionType: 'preview',
        outcome: 'matched',
        threadId: candidates[0]?.threadId ?? null,
        summary: `Preview matched ${candidates.length} candidate thread(s).`,
        matchedSignalsJson: candidates[0]?.matchedSignals ?? null,
        plannedActionsJson: candidates[0]?.plannedActions ?? null,
        metadataJson: {
          candidateCount: candidates.length,
          status: readinessPreview.status,
        },
      });
    }

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

  async runRuleNow(workspaceId: string, mailboxRuleId: string) {
    const preview = await this.findRuleDryRunPreview(workspaceId, mailboxRuleId, 10);

    const mailboxRule = await this.enterpriseMailboxRuleRepository.findOneByOrFail({
      id: mailboxRuleId,
      workspaceId,
    });

    if (mailboxRule.ruleType === 'folder-routing') {
      return this.executeFolderRoutingRule({
        workspaceId,
        mailboxRule,
        preview,
      });
    }

    if (mailboxRule.ruleType === 'customer-auto-link') {
      return this.executeCustomerAutoLinkRule({
        workspaceId,
        mailboxRule,
        preview,
      });
    }

    if (mailboxRule.ruleType === 'subordinate-escalation') {
      return this.executeSubordinateEscalationRule({
        workspaceId,
        mailboxRule,
        preview,
      });
    }

    if (mailboxRule.ruleType !== 'pending-reply') {
      await this.createRuleResult({
        workspaceId,
        mailboxRuleId: mailboxRule.id,
        mailboxProfileId: mailboxRule.mailboxProfileId,
        executionType: 'runtime',
        outcome: 'skipped',
        summary: `Runtime execution is not implemented for ${mailboxRule.ruleType}.`,
        failureReason: 'unsupported-rule-type',
        metadataJson: {
          ruleType: mailboxRule.ruleType,
        },
      });

      return {
        executedCount: 0,
        skippedCount: 1,
        unsupported: true,
      };
    }

    if (preview.candidates.length === 0) {
      await this.createRuleResult({
        workspaceId,
        mailboxRuleId: mailboxRule.id,
        mailboxProfileId: mailboxRule.mailboxProfileId,
        executionType: 'runtime',
        outcome: 'no-match',
        summary: 'Runtime execution found no matching threads.',
        failureReason: null,
        metadataJson: {
          candidateCount: 0,
        },
      });

      return {
        executedCount: 0,
        skippedCount: 0,
        unsupported: false,
      };
    }

    const activeAssignments = await this.enterpriseMailboxAssignmentRepository.find({
      where: {
        workspaceId,
        mailboxProfileId: mailboxRule.mailboxProfileId,
        assignmentStatus: 'active',
      },
      order: {
        isPrimaryMailbox: 'DESC',
        updatedAt: 'DESC',
      },
    });
    const primaryAssigneeId = activeAssignments[0]?.workspaceMemberId ?? null;
    const crmLinks = await this.enterpriseMailThreadCrmLinkRepository.find({
      where: {
        workspaceId,
        threadId: In(preview.candidates.map((candidate) => candidate.threadId)),
      },
    });
    const crmLinkByThreadId = Object.fromEntries(
      crmLinks.map((crmLink) => [crmLink.threadId, crmLink]),
    );

    let executedCount = 0;

    for (const candidate of preview.candidates) {
      await this.upsertMailThreadState({
        workspaceId,
        threadId: candidate.threadId,
        isPending: true,
        pendingReason: `Rule: ${mailboxRule.name}`,
        metadata: {
          ruleId: mailboxRule.id,
          ruleType: mailboxRule.ruleType,
          executionType: 'runtime',
        },
      });

      if (mailboxRule.actionsJson?.applyPendingTag) {
        const existingTag = await this.tradeCrmMailThreadTagRepository.findOneBy({
          workspaceId,
          threadId: candidate.threadId,
          tag: 'pending-reply',
        });

        if (!existingTag) {
          await this.tradeCrmMailThreadTagRepository.save({
            workspaceId,
            threadId: candidate.threadId,
            tag: 'pending-reply',
          });
        }
      }

      let createdTaskId: string | null = null;

      if (
        mailboxRule.actionsJson?.createTask &&
        !candidate.taskLinked
      ) {
        const crmLink = crmLinkByThreadId[candidate.threadId];
        const createdTask = await this.createFollowUpTaskForThread({
          workspaceId,
          mailboxProfileId: mailboxRule.mailboxProfileId,
          threadId: candidate.threadId,
          subject: candidate.subject,
          assigneeId: primaryAssigneeId,
          companyId: crmLink?.companyId ?? null,
          personId: crmLink?.personId ?? null,
          opportunityId: crmLink?.opportunityId ?? null,
        });

        createdTaskId = createdTask.id;

        await this.tradeCrmMailThreadTaskLinkRepository.save({
          workspaceId,
          threadId: candidate.threadId,
          taskId: createdTask.id,
        });
      }

      await this.createRuleResult({
        workspaceId,
        mailboxRuleId: mailboxRule.id,
        mailboxProfileId: mailboxRule.mailboxProfileId,
        executionType: 'runtime',
        outcome: 'acted',
        threadId: candidate.threadId,
        summary: `Runtime executed on thread "${candidate.subject}".`,
        matchedSignalsJson: candidate.matchedSignals,
        plannedActionsJson: candidate.plannedActions,
        metadataJson: {
          createdTaskId,
          pendingApplied: true,
          tagApplied: Boolean(mailboxRule.actionsJson?.applyPendingTag),
        },
      });

      executedCount += 1;
    }

    return {
      executedCount,
      skippedCount: 0,
      unsupported: false,
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
