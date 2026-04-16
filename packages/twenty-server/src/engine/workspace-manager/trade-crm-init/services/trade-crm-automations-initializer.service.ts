import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { v4 as uuidv4 } from 'uuid';
import { In, Repository } from 'typeorm';

import { RecordPositionService } from 'src/engine/core-modules/record-position/services/record-position.service';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import {
  TRADE_CRM_AUTOMATION_WORKFLOW_SEEDS,
  TRADE_CRM_LEAD_12H_FIRST_RESPONSE_REMINDER_WORKFLOW_NAME,
  TRADE_CRM_LEAD_AUTO_ASSIGNMENT_WORKFLOW_NAME,
  TRADE_CRM_OPPORTUNITY_7D_STALLED_MARKER_WORKFLOW_NAME,
  TRADE_CRM_OPPORTUNITY_QUOTATION_3D_FOLLOW_UP_WORKFLOW_NAME,
  buildTradeCrmLead12hFirstResponseReminderWorkflowSeed,
  buildTradeCrmLeadAutoAssignmentWorkflowSeed,
  buildTradeCrmOpportunity7dStalledMarkerWorkflowSeed,
  buildTradeCrmOpportunityQuotation3dFollowUpWorkflowSeed,
  type TradeCrmAutomationWorkflowSeed,
} from 'src/engine/workspace-manager/trade-crm-metadata/constants/trade-crm-automation-workflow-seeds.constant';
import {
  WorkflowVersionStatus,
  type WorkflowVersionWorkspaceEntity,
} from 'src/modules/workflow/common/standard-objects/workflow-version.workspace-entity';
import {
  WorkflowStatus,
  type WorkflowWorkspaceEntity,
} from 'src/modules/workflow/common/standard-objects/workflow.workspace-entity';
import { WorkflowTriggerWorkspaceService } from 'src/modules/workflow/workflow-trigger/workspace-services/workflow-trigger.workspace-service';
import { WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export type TradeCrmAutomationInitializationOptions = {
  defaultWorkspaceMemberId?: string;
  defaultUserEmail?: string;
  leadAssignmentRules?: TradeCrmLeadAssignmentRuleInput[];
};

export type TradeCrmLeadAssignmentRuleInput = {
  workspaceMemberId?: string;
  userEmail?: string;
  source?: string;
  country?: string;
  productCategory?: string;
  priority?: number;
};

type ResolvedTradeCrmLeadAssignmentRule = {
  workspaceMemberId: string;
  source?: string;
  country?: string;
  productCategory?: string;
  priority?: number;
  originalIndex: number;
};

@Injectable()
export class TradeCrmAutomationsInitializerService {
  private readonly logger = new Logger(
    TradeCrmAutomationsInitializerService.name,
  );

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly recordPositionService: RecordPositionService,
    private readonly workflowTriggerWorkspaceService: WorkflowTriggerWorkspaceService,
    @InjectRepository(ObjectMetadataEntity)
    private readonly objectMetadataRepository: Repository<ObjectMetadataEntity>,
    @InjectRepository(FieldMetadataEntity)
    private readonly fieldMetadataRepository: Repository<FieldMetadataEntity>,
  ) {}

  async initializeAutomations(
    workspaceId: string,
    options: TradeCrmAutomationInitializationOptions = {},
  ): Promise<void> {
    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const workflowRepository =
          await this.globalWorkspaceOrmManager.getRepository<WorkflowWorkspaceEntity>(
            workspaceId,
            'workflow',
            { shouldBypassPermissionChecks: true },
          );

        const workflowVersionRepository =
          await this.globalWorkspaceOrmManager.getRepository<WorkflowVersionWorkspaceEntity>(
            workspaceId,
            'workflowVersion',
            { shouldBypassPermissionChecks: true },
          );

        for (const seed of TRADE_CRM_AUTOMATION_WORKFLOW_SEEDS) {
          const resolvedSeed = await this.resolveSeed({
            workspaceId,
            seed,
            options,
          });
          const existingWorkflow = await this.findExistingWorkflow({
            workflowRepository,
            resolvedName: resolvedSeed.name,
            seedName: seed.name,
          });

          if (existingWorkflow) {
            const reconciled = await this.tryReconcileExistingWorkflow({
              workspaceId,
              workflowRepository,
              workflowVersionRepository,
              workflow: existingWorkflow,
              seed: resolvedSeed,
            });

            if (reconciled) {
              continue;
            }

            const upgraded = await this.tryUpgradeExistingWorkflow({
              workspaceId,
              workflowRepository,
              workflowVersionRepository,
              workflow: existingWorkflow,
              seed: resolvedSeed,
            });

            if (upgraded) {
              continue;
            }

            this.logger.log(
              `Trade CRM automation already exists: ${resolvedSeed.name} (${existingWorkflow.id})`,
            );
            continue;
          }

          const workflow = await this.createWorkflow({
            workspaceId,
            workflowRepository,
            seed: resolvedSeed,
          });

          const workflowVersion = await this.createWorkflowVersion({
            workspaceId,
            workflowVersionRepository,
            workflowId: workflow.id,
            seed: resolvedSeed,
          });

          if (resolvedSeed.status === WorkflowStatus.ACTIVE) {
            await this.workflowTriggerWorkspaceService.activateWorkflowVersion(
              workflowVersion.id,
              workspaceId,
            );

            await workflowRepository.update(workflow.id, {
              statuses: [WorkflowStatus.ACTIVE],
              lastPublishedVersionId: workflowVersion.id,
            });

            this.logger.log(
              `Created and activated Trade CRM automation ${resolvedSeed.name}`,
            );

            continue;
          }

          this.logger.log(
            `Created Trade CRM draft automation ${resolvedSeed.name}`,
          );
        }
      },
      authContext,
    );
  }

  private async resolveSeed({
    workspaceId,
    seed,
    options,
  }: {
    workspaceId: string;
    seed: TradeCrmAutomationWorkflowSeed;
    options: TradeCrmAutomationInitializationOptions;
  }): Promise<TradeCrmAutomationWorkflowSeed> {
    if (
      seed.name !== TRADE_CRM_LEAD_AUTO_ASSIGNMENT_WORKFLOW_NAME &&
      seed.name !== TRADE_CRM_LEAD_12H_FIRST_RESPONSE_REMINDER_WORKFLOW_NAME &&
      seed.name !== TRADE_CRM_OPPORTUNITY_QUOTATION_3D_FOLLOW_UP_WORKFLOW_NAME &&
      seed.name !== TRADE_CRM_OPPORTUNITY_7D_STALLED_MARKER_WORKFLOW_NAME
    ) {
      return seed;
    }

    if (
      seed.name === TRADE_CRM_OPPORTUNITY_QUOTATION_3D_FOLLOW_UP_WORKFLOW_NAME ||
      seed.name === TRADE_CRM_OPPORTUNITY_7D_STALLED_MARKER_WORKFLOW_NAME
    ) {
      const opportunityFields = await this.loadObjectFieldMetadata({
        workspaceId,
        objectNameSingular: 'opportunity',
        fieldNames: ['id', 'stage'],
      });

      const opportunityIdFieldMetadata = opportunityFields.find(
        (field) => field.name === 'id',
      );
      const opportunityStageFieldMetadata = opportunityFields.find(
        (field) => field.name === 'stage',
      );

      if (!opportunityIdFieldMetadata || !opportunityStageFieldMetadata) {
        this.logger.warn(
          `Keeping ${seed.name} as draft for workspace ${workspaceId}: opportunity id/stage field metadata is missing`,
        );

        return seed;
      }

      if (seed.name === TRADE_CRM_OPPORTUNITY_QUOTATION_3D_FOLLOW_UP_WORKFLOW_NAME) {
        return buildTradeCrmOpportunityQuotation3dFollowUpWorkflowSeed({
          opportunityIdFieldMetadataId: opportunityIdFieldMetadata.id,
          opportunityStageFieldMetadataId: opportunityStageFieldMetadata.id,
          quotationSentStageValue: 'QUOTATION_SENT',
        });
      }

      return buildTradeCrmOpportunity7dStalledMarkerWorkflowSeed({
        opportunityIdFieldMetadataId: opportunityIdFieldMetadata.id,
        stalledStageValue: 'STALLED',
      });
    }

    const workspaceMembers = await this.loadWorkspaceMembers(workspaceId);
    const resolvedLeadAssignmentRules = this.resolveLeadAssignmentRules({
      workspaceId,
      workspaceMembers,
      options,
    });

    if (seed.name === TRADE_CRM_LEAD_AUTO_ASSIGNMENT_WORKFLOW_NAME) {
      if (resolvedLeadAssignmentRules.length > 0) {
        return buildTradeCrmLeadAutoAssignmentWorkflowSeed({
          rules: resolvedLeadAssignmentRules,
        });
      }

      const resolvedWorkspaceMember =
        this.resolveWorkspaceMemberForLeadAutomation({
          seedName: seed.name,
          workspaceId,
          workspaceMembers,
          options,
        });

      if (!resolvedWorkspaceMember) {
        return seed;
      }

      return buildTradeCrmLeadAutoAssignmentWorkflowSeed({
        rules: [
          {
            workspaceMemberId: resolvedWorkspaceMember.id,
          },
        ],
      });
    }

    const resolvedWorkspaceMember = this.resolveWorkspaceMemberForLeadAutomation(
      {
        seedName: seed.name,
        workspaceId,
        workspaceMembers,
        options,
      },
    );

    if (!resolvedWorkspaceMember && resolvedLeadAssignmentRules.length === 0) {
      return seed;
    }

    const leadFields = await this.loadObjectFieldMetadata({
      workspaceId,
      objectNameSingular: 'lead',
      fieldNames: ['id', 'firstResponseTime'],
    });

    const leadIdFieldMetadata = leadFields.find((field) => field.name === 'id');
    const leadFirstResponseTimeFieldMetadata = leadFields.find(
      (field) => field.name === 'firstResponseTime',
    );

    if (!leadIdFieldMetadata || !leadFirstResponseTimeFieldMetadata) {
      this.logger.warn(
        `Keeping ${seed.name} as draft for workspace ${workspaceId}: lead id/firstResponseTime field metadata is missing`,
      );

      return seed;
    }

    return buildTradeCrmLead12hFirstResponseReminderWorkflowSeed({
      leadIdFieldMetadataId: leadIdFieldMetadata.id,
      leadFirstResponseTimeFieldMetadataId:
        leadFirstResponseTimeFieldMetadata.id,
    });
  }

  private async loadWorkspaceMembers(workspaceId: string) {
    return this.globalWorkspaceOrmManager.getRepository<WorkspaceMemberWorkspaceEntity>(
      workspaceId,
      'workspaceMember',
      { shouldBypassPermissionChecks: true },
    ).then((repository) => repository.find());
  }

  private resolveWorkspaceMemberForLeadAutomation({
    seedName,
    workspaceId,
    workspaceMembers,
    options,
  }: {
    seedName: string;
    workspaceId: string;
    workspaceMembers: WorkspaceMemberWorkspaceEntity[];
    options: TradeCrmAutomationInitializationOptions;
  }): WorkspaceMemberWorkspaceEntity | null {
    if (workspaceMembers.length === 1) {
      return workspaceMembers[0];
    }

    const configuredWorkspaceMemberId =
      options.defaultWorkspaceMemberId?.trim();

    if (configuredWorkspaceMemberId) {
      const matchingWorkspaceMember = workspaceMembers.find(
        (workspaceMember) => workspaceMember.id === configuredWorkspaceMemberId,
      );

      if (matchingWorkspaceMember) {
        return matchingWorkspaceMember;
      }

      this.logger.warn(
        `Keeping ${seedName} as draft for workspace ${workspaceId}: configured workspace member ${configuredWorkspaceMemberId} was not found among ${workspaceMembers.length} workspace members`,
      );

      return null;
    }

    const configuredUserEmail = options.defaultUserEmail?.trim().toLowerCase();

    if (configuredUserEmail) {
      const matchingWorkspaceMembers = workspaceMembers.filter(
        (workspaceMember) =>
          workspaceMember.userEmail?.trim().toLowerCase() === configuredUserEmail,
      );

      if (matchingWorkspaceMembers.length === 1) {
        return matchingWorkspaceMembers[0];
      }

      if (matchingWorkspaceMembers.length > 1) {
        this.logger.warn(
          `Keeping ${seedName} as draft for workspace ${workspaceId}: configured user email ${configuredUserEmail} matched multiple workspace members`,
        );

        return null;
      }

      this.logger.warn(
        `Keeping ${seedName} as draft for workspace ${workspaceId}: configured user email ${configuredUserEmail} was not found among ${workspaceMembers.length} workspace members`,
      );

      return null;
    }

    this.logger.log(
      `Keeping ${seedName} as draft for workspace ${workspaceId}: expected exactly 1 workspace member, found ${workspaceMembers.length}. Provide --default-workspace-member-id or --default-user-email to activate safely in a multi-member workspace.`,
    );

    return null;
  }

  private resolveLeadAssignmentRules({
    workspaceId,
    workspaceMembers,
    options,
  }: {
    workspaceId: string;
    workspaceMembers: WorkspaceMemberWorkspaceEntity[];
    options: TradeCrmAutomationInitializationOptions;
  }): ResolvedTradeCrmLeadAssignmentRule[] {
    const configuredRules = options.leadAssignmentRules ?? [];
    const resolvedRules: ResolvedTradeCrmLeadAssignmentRule[] = [];

    for (const [index, rule] of configuredRules.entries()) {
      const resolvedWorkspaceMember =
        this.resolveWorkspaceMemberForConfiguredRule({
          workspaceId,
          workspaceMembers,
          rule,
          ruleIndex: index,
        });

      if (!resolvedWorkspaceMember) {
        continue;
      }

      resolvedRules.push({
        workspaceMemberId: resolvedWorkspaceMember.id,
        source: rule.source?.trim() || undefined,
        country: rule.country?.trim() || undefined,
        productCategory: rule.productCategory?.trim() || undefined,
        priority:
          typeof rule.priority === 'number' && Number.isFinite(rule.priority)
            ? rule.priority
            : undefined,
        originalIndex: index,
      });
    }

    if (configuredRules.length > 0 && resolvedRules.length === 0) {
      this.logger.warn(
        `Keeping multi-member lead assignment workflows in draft for workspace ${workspaceId}: no valid lead assignment rules could be resolved`,
      );
    }

    const sortedRules = [...resolvedRules].sort((leftRule, rightRule) => {
      const leftPriority = leftRule.priority ?? Number.MAX_SAFE_INTEGER;
      const rightPriority = rightRule.priority ?? Number.MAX_SAFE_INTEGER;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      const specificityDifference =
        this.calculateLeadAssignmentRuleSpecificity(rightRule) -
        this.calculateLeadAssignmentRuleSpecificity(leftRule);

      if (specificityDifference !== 0) {
        return specificityDifference;
      }

      return leftRule.originalIndex - rightRule.originalIndex;
    });

    this.assertNoLeadAssignmentRuleConflicts({
      workspaceId,
      rules: sortedRules,
    });

    return sortedRules;
  }

  private calculateLeadAssignmentRuleSpecificity(
    rule: Pick<
      ResolvedTradeCrmLeadAssignmentRule,
      'source' | 'country' | 'productCategory'
    >,
  ): number {
    return [rule.source, rule.country, rule.productCategory].filter(Boolean)
      .length;
  }

  private assertNoLeadAssignmentRuleConflicts({
    workspaceId,
    rules,
  }: {
    workspaceId: string;
    rules: ResolvedTradeCrmLeadAssignmentRule[];
  }) {
    const seenRuleSignatures = new Map<string, ResolvedTradeCrmLeadAssignmentRule>();

    for (const rule of rules) {
      const ruleSignature = this.buildLeadAssignmentRuleSignature(rule);
      const matchingRule = seenRuleSignatures.get(ruleSignature);

      if (matchingRule) {
        throw new Error(
          `Conflicting lead assignment rules for workspace ${workspaceId}: rule #${matchingRule.originalIndex + 1} and rule #${rule.originalIndex + 1} target the same matcher combination (${ruleSignature})`,
        );
      }

      seenRuleSignatures.set(ruleSignature, rule);
    }

    for (let index = 0; index < rules.length; index += 1) {
      const currentRule = rules[index];

      for (
        let nextIndex = index + 1;
        nextIndex < rules.length;
        nextIndex += 1
      ) {
        const nextRule = rules[nextIndex];

        if (!this.doesLeadAssignmentRuleShadow(currentRule, nextRule)) {
          continue;
        }

        throw new Error(
          `Conflicting lead assignment rules for workspace ${workspaceId}: rule #${currentRule.originalIndex + 1} shadows rule #${nextRule.originalIndex + 1}. Reorder priorities or make the earlier rule more specific.`,
        );
      }
    }
  }

  private buildLeadAssignmentRuleSignature(
    rule: Pick<
      ResolvedTradeCrmLeadAssignmentRule,
      'source' | 'country' | 'productCategory'
    >,
  ): string {
    return JSON.stringify({
      source: rule.source ?? null,
      country: rule.country ?? null,
      productCategory: rule.productCategory ?? null,
    });
  }

  private doesLeadAssignmentRuleShadow(
    leftRule: Pick<
      ResolvedTradeCrmLeadAssignmentRule,
      'source' | 'country' | 'productCategory'
    >,
    rightRule: Pick<
      ResolvedTradeCrmLeadAssignmentRule,
      'source' | 'country' | 'productCategory'
    >,
  ): boolean {
    return (
      this.matchesLeadAssignmentCriterion(leftRule.source, rightRule.source) &&
      this.matchesLeadAssignmentCriterion(leftRule.country, rightRule.country) &&
      this.matchesLeadAssignmentCriterion(
        leftRule.productCategory,
        rightRule.productCategory,
      )
    );
  }

  private matchesLeadAssignmentCriterion(
    earlierValue?: string,
    laterValue?: string,
  ): boolean {
    if (!earlierValue) {
      return true;
    }

    return earlierValue === laterValue;
  }

  private resolveWorkspaceMemberForConfiguredRule({
    workspaceId,
    workspaceMembers,
    rule,
    ruleIndex,
  }: {
    workspaceId: string;
    workspaceMembers: WorkspaceMemberWorkspaceEntity[];
    rule: TradeCrmLeadAssignmentRuleInput;
    ruleIndex: number;
  }): WorkspaceMemberWorkspaceEntity | null {
    const configuredWorkspaceMemberId = rule.workspaceMemberId?.trim();

    if (configuredWorkspaceMemberId) {
      const matchingWorkspaceMember = workspaceMembers.find(
        (workspaceMember) => workspaceMember.id === configuredWorkspaceMemberId,
      );

      if (matchingWorkspaceMember) {
        return matchingWorkspaceMember;
      }

      this.logger.warn(
        `Skipping lead assignment rule #${ruleIndex + 1} for workspace ${workspaceId}: workspace member ${configuredWorkspaceMemberId} was not found`,
      );

      return null;
    }

    const configuredUserEmail = rule.userEmail?.trim().toLowerCase();

    if (!configuredUserEmail) {
      this.logger.warn(
        `Skipping lead assignment rule #${ruleIndex + 1} for workspace ${workspaceId}: workspaceMemberId or userEmail is required`,
      );

      return null;
    }

    const matchingWorkspaceMembers = workspaceMembers.filter(
      (workspaceMember) =>
        workspaceMember.userEmail?.trim().toLowerCase() === configuredUserEmail,
    );

    if (matchingWorkspaceMembers.length === 1) {
      return matchingWorkspaceMembers[0];
    }

    if (matchingWorkspaceMembers.length > 1) {
      this.logger.warn(
        `Skipping lead assignment rule #${ruleIndex + 1} for workspace ${workspaceId}: configured user email ${configuredUserEmail} matched multiple workspace members`,
      );

      return null;
    }

    this.logger.warn(
      `Skipping lead assignment rule #${ruleIndex + 1} for workspace ${workspaceId}: configured user email ${configuredUserEmail} was not found`,
    );

    return null;
  }

  private async loadObjectFieldMetadata({
    workspaceId,
    objectNameSingular,
    fieldNames,
  }: {
    workspaceId: string;
    objectNameSingular: string;
    fieldNames: string[];
  }) {
    const objectMetadata = await this.objectMetadataRepository.findOne({
      where: {
        workspaceId,
        nameSingular: objectNameSingular,
        isActive: true,
      },
    });

    if (!objectMetadata) {
      return [];
    }

    return this.fieldMetadataRepository.find({
      where: {
        workspaceId,
        objectMetadataId: objectMetadata.id,
        isActive: true,
        name: In(fieldNames),
      },
    });
  }

  private async tryUpgradeExistingWorkflow({
    workspaceId,
    workflowRepository,
    workflowVersionRepository,
    workflow,
    seed,
  }: {
    workspaceId: string;
    workflowRepository: Awaited<
      ReturnType<GlobalWorkspaceOrmManager['getRepository<WorkflowWorkspaceEntity>']>
    >;
    workflowVersionRepository: Awaited<
      ReturnType<
        GlobalWorkspaceOrmManager['getRepository<WorkflowVersionWorkspaceEntity>']
      >
    >;
    workflow: WorkflowWorkspaceEntity;
    seed: TradeCrmAutomationWorkflowSeed;
  }) {
    if (workflow.lastPublishedVersionId) {
      return false;
    }

    const upgradableWorkflowNames = new Set([
      'Trade CRM - Lead Auto Assignment',
      'Trade CRM - Lead 12h First Response Reminder',
      'Trade CRM - Opportunity Quotation 3d Follow-up',
      'Trade CRM - Opportunity 7d Stalled Marker',
    ]);

    if (!upgradableWorkflowNames.has(seed.name)) {
      return false;
    }

    const draftVersion = await workflowVersionRepository.findOne({
      where: {
        workflowId: workflow.id,
        status: WorkflowVersionStatus.DRAFT,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!draftVersion) {
      return false;
    }

    await workflowVersionRepository.update(draftVersion.id, {
      trigger: seed.trigger,
      steps: seed.steps,
    });

    await this.workflowTriggerWorkspaceService.activateWorkflowVersion(
      draftVersion.id,
      workspaceId,
    );

    await workflowRepository.update(workflow.id, {
      name: seed.name,
      statuses: [WorkflowStatus.ACTIVE],
      lastPublishedVersionId: draftVersion.id,
    });

    this.logger.log(
      `Upgraded Trade CRM automation ${seed.name} from draft to active`,
    );

    return true;
  }

  private async tryReconcileExistingWorkflow({
    workspaceId,
    workflowRepository,
    workflowVersionRepository,
    workflow,
    seed,
  }: {
    workspaceId: string;
    workflowRepository: Awaited<
      ReturnType<GlobalWorkspaceOrmManager['getRepository<WorkflowWorkspaceEntity>']>
    >;
    workflowVersionRepository: Awaited<
      ReturnType<
        GlobalWorkspaceOrmManager['getRepository<WorkflowVersionWorkspaceEntity>']
      >
    >;
    workflow: WorkflowWorkspaceEntity;
    seed: TradeCrmAutomationWorkflowSeed;
  }) {
    if (!workflow.lastPublishedVersionId) {
      return false;
    }

    const reconcilableWorkflowNames = new Set([
      'Trade CRM - Lead Auto Assignment',
      'Trade CRM - Lead 12h First Response Reminder',
      'Trade CRM - Opportunity Quotation 3d Follow-up',
      'Trade CRM - Opportunity 7d Stalled Marker',
    ]);

    if (!reconcilableWorkflowNames.has(seed.name)) {
      return false;
    }

    const publishedVersion = await workflowVersionRepository.findOne({
      where: {
        id: workflow.lastPublishedVersionId,
      },
    });

    if (
      publishedVersion &&
      workflow.name === seed.name &&
      JSON.stringify(publishedVersion.trigger) === JSON.stringify(seed.trigger) &&
      JSON.stringify(publishedVersion.steps) === JSON.stringify(seed.steps)
    ) {
      return false;
    }

    const existingVersions = await workflowVersionRepository.find({
      where: {
        workflowId: workflow.id,
      },
      order: {
        createdAt: 'ASC',
      },
    });
    const nextVersionName = `v${existingVersions.length + 1}`;
    const nextWorkflowVersion = await this.createWorkflowVersion({
      workspaceId,
      workflowVersionRepository,
      workflowId: workflow.id,
      seed,
      versionName: nextVersionName,
    });

    await this.workflowTriggerWorkspaceService.activateWorkflowVersion(
      nextWorkflowVersion.id,
      workspaceId,
    );

    await workflowRepository.update(workflow.id, {
      name: seed.name,
      statuses: [WorkflowStatus.ACTIVE],
      lastPublishedVersionId: nextWorkflowVersion.id,
    });

    this.logger.log(
      `Reconciled Trade CRM automation ${seed.name} with published version ${nextVersionName}`,
    );

    return true;
  }

  private async findExistingWorkflow({
    workflowRepository,
    resolvedName,
    seedName,
  }: {
    workflowRepository: Awaited<
      ReturnType<GlobalWorkspaceOrmManager['getRepository<WorkflowWorkspaceEntity>']>
    >;
    resolvedName: string;
    seedName: string;
  }) {
    const workflowNames = Array.from(new Set([resolvedName, seedName]));

    const existingWorkflows = await workflowRepository.find({
      where: workflowNames.map((name) => ({ name })),
      order: {
        createdAt: 'ASC',
      },
    });

    return (
      existingWorkflows.find((workflow) => workflow.name === resolvedName) ??
      existingWorkflows.find((workflow) => workflow.name === seedName) ??
      null
    );
  }

  private async createWorkflow({
    workspaceId,
    workflowRepository,
    seed,
  }: {
    workspaceId: string;
    workflowRepository: Awaited<
      ReturnType<GlobalWorkspaceOrmManager['getRepository<WorkflowWorkspaceEntity>']>
    >;
    seed: TradeCrmAutomationWorkflowSeed;
  }): Promise<WorkflowWorkspaceEntity> {
    const position = await this.recordPositionService.buildRecordPosition({
      value: 'first',
      objectMetadata: {
        isCustom: false,
        nameSingular: 'workflow',
      },
      workspaceId,
    });

    const workflow = workflowRepository.create({
      id: uuidv4(),
      name: seed.name,
      statuses: [WorkflowStatus.DRAFT],
      lastPublishedVersionId: null,
      position,
    });

    return workflowRepository.save(workflow);
  }

  private async createWorkflowVersion({
    workspaceId,
    workflowVersionRepository,
    workflowId,
    seed,
    versionName = 'v1',
  }: {
    workspaceId: string;
    workflowVersionRepository: Awaited<
      ReturnType<
        GlobalWorkspaceOrmManager['getRepository<WorkflowVersionWorkspaceEntity>']
      >
    >;
    workflowId: string;
    seed: TradeCrmAutomationWorkflowSeed;
    versionName?: string;
  }): Promise<WorkflowVersionWorkspaceEntity> {
    const position = await this.recordPositionService.buildRecordPosition({
      value: 'first',
      objectMetadata: {
        isCustom: false,
        nameSingular: 'workflowVersion',
      },
      workspaceId,
    });

    const workflowVersion = workflowVersionRepository.create({
      id: uuidv4(),
      workflowId,
      name: versionName,
      trigger: seed.trigger,
      steps: seed.steps,
      status: WorkflowVersionStatus.DRAFT,
      position,
    });

    return workflowVersionRepository.save(workflowVersion);
  }
}
