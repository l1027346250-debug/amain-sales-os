import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'node:path';
import { Pool } from 'pg';

import { JsonFileStateRepository } from 'src/common/state/json-file-state.repository';
import { PostgresStateRepository } from 'src/common/state/postgres-state.repository';
import { StateRepository } from 'src/common/state/state.repository';
import { IntegrationHubEnv } from 'src/config/env';
import { OpportunityMonitoringState } from 'src/modules/opportunity-monitoring/types/opportunity-monitoring-state.type';
import { OverdueQuotationFollowUpOpportunity } from 'src/modules/opportunity-monitoring/types/overdue-quotation-follow-up-opportunity.type';
import { QuotationFollowUpTaskApplyRecord } from 'src/modules/opportunity-monitoring/types/quotation-follow-up-task-apply-record.type';
import { QuotationFollowUpTaskCandidate } from 'src/modules/opportunity-monitoring/types/quotation-follow-up-task-candidate.type';
import { QuotationFollowUpTaskRequest } from 'src/modules/opportunity-monitoring/types/quotation-follow-up-task-request.type';
import { StalledOpportunity } from 'src/modules/opportunity-monitoring/types/stalled-opportunity.type';
import { StalledTaskApplyRecord } from 'src/modules/opportunity-monitoring/types/stalled-task-apply-record.type';
import { StalledTaskCandidate } from 'src/modules/opportunity-monitoring/types/stalled-task-candidate.type';
import { StalledTaskRequest } from 'src/modules/opportunity-monitoring/types/stalled-task-request.type';
import { TwentyClientService } from 'src/modules/twenty-client/twenty-client.service';

const MAX_OVERDUE_QUOTATION_OPPORTUNITIES = 50;
const MAX_STALLED_OPPORTUNITIES = 50;
type QuoteFollowUpReminderAssigneeState = 'assigned' | 'unassigned';
type StalledReminderAssigneeState = 'assigned' | 'unassigned';

type LegacyOpportunityMonitoringState = {
  id: 'opportunity-monitoring';
  lastSweepAt: string | null;
  duplicateApplyBlockedCount: number;
  appliedQuotationFollowUpTaskRecords: QuotationFollowUpTaskApplyRecord[];
};

@Injectable()
export class OpportunityMonitoringService implements OnModuleInit {
  private readonly logger = new Logger(OpportunityMonitoringService.name);
  private overdueQuotationFollowUpOpportunities: OverdueQuotationFollowUpOpportunity[] = [];
  private quotationFollowUpTaskCandidates: QuotationFollowUpTaskCandidate[] = [];
  private preparedQuotationFollowUpTaskRequests: QuotationFollowUpTaskRequest[] = [];
  private appliedQuotationFollowUpTaskRecords: QuotationFollowUpTaskApplyRecord[] = [];
  private stalledOpportunities: StalledOpportunity[] = [];
  private stalledTaskCandidates: StalledTaskCandidate[] = [];
  private preparedStalledTaskRequests: StalledTaskRequest[] = [];
  private appliedStalledTaskRecords: StalledTaskApplyRecord[] = [];
  private quoteFollowUpDuplicateApplyBlockedCount = 0;
  private stalledDuplicateApplyBlockedCount = 0;
  private lastSweepAt: string | null = null;
  private quoteFollowUpLastSweepAt: string | null = null;
  private stalledLastSweepAt: string | null = null;
  private stateRepository: StateRepository<OpportunityMonitoringState>;
  private persistPromise = Promise.resolve();

  constructor(
    private readonly twentyClientService: TwentyClientService,
    private readonly configService: ConfigService<IntegrationHubEnv, true>,
  ) {
    const stateDirectory =
      this.configService.get('INTEGRATION_HUB_STATE_DIR', { infer: true }) ??
      path.join(process.cwd(), 'tmp', 'integration-hub-state');
    const stateBackend =
      this.configService.get('INTEGRATION_HUB_STATE_BACKEND', {
        infer: true,
      }) ?? 'file';

    if (stateBackend === 'postgres') {
      const connectionString =
        this.configService.get('INTEGRATION_HUB_STATE_PG_URL', {
          infer: true,
        }) ?? process.env.PG_DATABASE_URL;

      if (!connectionString) {
        throw new Error(
          'INTEGRATION_HUB_STATE_BACKEND=postgres requires INTEGRATION_HUB_STATE_PG_URL or PG_DATABASE_URL',
        );
      }

      this.stateRepository = new PostgresStateRepository<OpportunityMonitoringState>(
        new Pool({ connectionString }),
        'integration_hub_opportunity_monitoring_state',
      );
      return;
    }

    this.stateRepository = new JsonFileStateRepository<OpportunityMonitoringState>(
      path.join(stateDirectory, 'opportunity-monitoring-state.json'),
    );
  }

  async onModuleInit() {
    const [savedState] = await this.stateRepository.load();

    if (!savedState) {
      return;
    }

    const state = savedState as
      | OpportunityMonitoringState
      | LegacyOpportunityMonitoringState;

    this.lastSweepAt = state.lastSweepAt ?? null;
    this.quoteFollowUpLastSweepAt =
      'quoteFollowUpLastSweepAt' in state
        ? state.quoteFollowUpLastSweepAt
        : state.lastSweepAt;
    this.stalledLastSweepAt =
      'stalledLastSweepAt' in state ? state.stalledLastSweepAt : null;
    this.quoteFollowUpDuplicateApplyBlockedCount =
      'quoteFollowUpDuplicateApplyBlockedCount' in state
        ? state.quoteFollowUpDuplicateApplyBlockedCount
        : state.duplicateApplyBlockedCount;
    this.stalledDuplicateApplyBlockedCount =
      'stalledDuplicateApplyBlockedCount' in state
        ? state.stalledDuplicateApplyBlockedCount
        : 0;
    this.appliedQuotationFollowUpTaskRecords =
      state.appliedQuotationFollowUpTaskRecords ?? [];
    this.appliedStalledTaskRecords =
      'appliedStalledTaskRecords' in state
        ? state.appliedStalledTaskRecords
        : [];
  }

  async sweepQuotationFollowUpOpportunities() {
    const result =
      await this.twentyClientService.findOpportunitiesNeedingQuoteFollowUp({
        followUpAfterDays: this.getQuoteFollowUpAfterDays(),
        limit: MAX_OVERDUE_QUOTATION_OPPORTUNITIES,
      });

    this.quoteFollowUpLastSweepAt = new Date().toISOString();
    this.lastSweepAt = this.quoteFollowUpLastSweepAt;

    if (result.mode === 'prepared') {
      await this.persistState();

      return {
        ...result,
        opportunities: this.overdueQuotationFollowUpOpportunities,
        taskCandidates: this.quotationFollowUpTaskCandidates,
        preparedTaskRequests: this.preparedQuotationFollowUpTaskRequests,
      };
    }

    this.overdueQuotationFollowUpOpportunities = result.records;
    this.quotationFollowUpTaskCandidates = result.records.map(
      (opportunity: OverdueQuotationFollowUpOpportunity) =>
        this.buildQuotationFollowUpTaskCandidate(opportunity),
    );
    this.preparedQuotationFollowUpTaskRequests =
      this.quotationFollowUpTaskCandidates.map((candidate) =>
        this.twentyClientService.prepareQuotationFollowUpTask(candidate),
      );

    if (this.getQuoteFollowUpTaskAutoApply()) {
      for (const request of this.preparedQuotationFollowUpTaskRequests) {
        if (request.payload.assigneeId === null) {
          continue;
        }

        const existingRecord = this.appliedQuotationFollowUpTaskRecords.find(
          (record) => record.opportunityId === request.opportunityId,
        );

        if (existingRecord) {
          this.quoteFollowUpDuplicateApplyBlockedCount += 1;
          continue;
        }

        const taskResult =
          await this.twentyClientService.createQuotationFollowUpTask(request, {
            apply: true,
          });

        if (taskResult.mode === 'remote' && taskResult.applyRequested === true) {
          this.appliedQuotationFollowUpTaskRecords = [
            ...this.appliedQuotationFollowUpTaskRecords,
            {
              id: request.opportunityId,
              opportunityId: request.opportunityId,
              endpoint: taskResult.endpoint,
              mode: 'remote',
              recordId: taskResult.recordId,
              applyRequested: true,
              appliedAt: new Date().toISOString(),
              relationGap: taskResult.relationGap,
            },
          ];
        }
      }
    }

    await this.persistState();

    this.logger.log(
      `Quotation follow-up sweep found ${result.records.length} overdue opportunity(ies)`,
    );

    return {
      ...result,
      opportunities: this.overdueQuotationFollowUpOpportunities,
      taskCandidates: this.quotationFollowUpTaskCandidates,
      preparedTaskRequests: this.preparedQuotationFollowUpTaskRequests,
    };
  }

  async sweepStalledOpportunities() {
    const result = await this.twentyClientService.findStalledOpportunities({
      stalledAfterDays: this.getStalledAfterDays(),
      limit: MAX_STALLED_OPPORTUNITIES,
    });

    this.stalledLastSweepAt = new Date().toISOString();
    this.lastSweepAt = this.stalledLastSweepAt;

    if (result.mode === 'prepared') {
      await this.persistState();

      return {
        ...result,
        opportunities: this.stalledOpportunities,
        taskCandidates: this.stalledTaskCandidates,
        preparedTaskRequests: this.preparedStalledTaskRequests,
      };
    }

    this.stalledOpportunities = result.records;
    this.stalledTaskCandidates = result.records.map(
      (opportunity: StalledOpportunity) =>
        this.buildStalledTaskCandidate(opportunity),
    );
    this.preparedStalledTaskRequests = this.stalledTaskCandidates.map(
      (candidate) =>
        this.twentyClientService.prepareStalledOpportunityTask(candidate),
    );

    if (this.getStalledTaskAutoApply()) {
      for (const request of this.preparedStalledTaskRequests) {
        if (request.payload.assigneeId === null) {
          continue;
        }

        const existingRecord = this.appliedStalledTaskRecords.find(
          (record) => record.opportunityId === request.opportunityId,
        );

        if (existingRecord) {
          this.stalledDuplicateApplyBlockedCount += 1;
          continue;
        }

        const taskResult =
          await this.twentyClientService.createStalledOpportunityTask(request, {
            apply: true,
          });

        if (taskResult.mode === 'remote' && taskResult.applyRequested === true) {
          this.appliedStalledTaskRecords = [
            ...this.appliedStalledTaskRecords,
            {
              id: request.opportunityId,
              opportunityId: request.opportunityId,
              endpoint: taskResult.endpoint,
              mode: 'remote',
              recordId: taskResult.recordId,
              applyRequested: true,
              appliedAt: new Date().toISOString(),
              relationGap: taskResult.relationGap,
            },
          ];
        }
      }
    }

    await this.persistState();

    this.logger.log(
      `Stalled opportunity sweep found ${result.records.length} stalled opportunity(ies)`,
    );

    return {
      ...result,
      opportunities: this.stalledOpportunities,
      taskCandidates: this.stalledTaskCandidates,
      preparedTaskRequests: this.preparedStalledTaskRequests,
    };
  }

  getSummary() {
    return {
      lastSweepAt: this.lastSweepAt,
      quoteFollowUp: this.getQuoteFollowUpSummary(),
      stalled: this.getStalledSummary(),
    };
  }

  getQuoteFollowUpSummary() {
    return {
      lastSweepAt: this.quoteFollowUpLastSweepAt,
      quoteFollowUpAfterDays: this.getQuoteFollowUpAfterDays(),
      overdueCount: this.overdueQuotationFollowUpOpportunities.length,
      oldestOverdueDays: this.overdueQuotationFollowUpOpportunities.reduce<
        number | null
      >((maxValue, opportunity) => {
        if (typeof opportunity.overdueDays !== 'number') {
          return maxValue;
        }

        if (maxValue === null || opportunity.overdueDays > maxValue) {
          return opportunity.overdueDays;
        }

        return maxValue;
      }, null),
      overdueOpportunityIds: this.overdueQuotationFollowUpOpportunities.map(
        (opportunity) => opportunity.opportunityId,
      ),
      assignedOverdueCount: this.overdueQuotationFollowUpOpportunities.filter(
        (opportunity) =>
          this.getQuoteFollowUpReminderAssigneeState(opportunity) === 'assigned',
      ).length,
      unassignedOverdueCount:
        this.overdueQuotationFollowUpOpportunities.filter(
          (opportunity) =>
            this.getQuoteFollowUpReminderAssigneeState(opportunity) ===
            'unassigned',
        ).length,
      taskCandidateCount: this.quotationFollowUpTaskCandidates.length,
      preparedTaskRequestCount: this.preparedQuotationFollowUpTaskRequests.length,
      preparedTaskWithoutAssigneeCount:
        this.preparedQuotationFollowUpTaskRequests.filter(
          (request) => request.payload.assigneeId === null,
        ).length,
      appliedTaskCount: this.appliedQuotationFollowUpTaskRecords.length,
      appliedTaskOpportunityIds: this.appliedQuotationFollowUpTaskRecords.map(
        (record) => record.opportunityId,
      ),
      duplicateApplyBlockedCount: this.quoteFollowUpDuplicateApplyBlockedCount,
    };
  }

  getQuoteFollowUpReminderQueue(options?: {
    assigneeState?: QuoteFollowUpReminderAssigneeState;
    limit?: number;
  }) {
    const limit = options?.limit ?? 20;
    const opportunities = this.overdueQuotationFollowUpOpportunities
      .map((opportunity) => this.decorateQuoteFollowUpOpportunity(opportunity))
      .filter((opportunity) =>
        options?.assigneeState
          ? opportunity.assigneeState === options.assigneeState
          : true,
      )
      .sort((left, right) => (right.overdueDays ?? 0) - (left.overdueDays ?? 0))
      .slice(0, limit);

    return {
      summary: {
        ...this.getQuoteFollowUpSummary(),
        queueAssigneeState: options?.assigneeState ?? 'all',
        queueCount: opportunities.length,
      },
      opportunities,
    };
  }

  getStalledSummary() {
    return {
      lastSweepAt: this.stalledLastSweepAt,
      stalledAfterDays: this.getStalledAfterDays(),
      stalledCount: this.stalledOpportunities.length,
      oldestStalledDays: this.stalledOpportunities.reduce<number | null>(
        (maxValue, opportunity) => {
          if (typeof opportunity.stalledDays !== 'number') {
            return maxValue;
          }

          if (maxValue === null || opportunity.stalledDays > maxValue) {
            return opportunity.stalledDays;
          }

          return maxValue;
        },
        null,
      ),
      stalledOpportunityIds: this.stalledOpportunities.map(
        (opportunity) => opportunity.opportunityId,
      ),
      assignedStalledCount: this.stalledOpportunities.filter(
        (opportunity) =>
          this.getStalledReminderAssigneeState(opportunity) === 'assigned',
      ).length,
      unassignedStalledCount: this.stalledOpportunities.filter(
        (opportunity) =>
          this.getStalledReminderAssigneeState(opportunity) === 'unassigned',
      ).length,
      taskCandidateCount: this.stalledTaskCandidates.length,
      preparedTaskRequestCount: this.preparedStalledTaskRequests.length,
      preparedTaskWithoutAssigneeCount: this.preparedStalledTaskRequests.filter(
        (request) => request.payload.assigneeId === null,
      ).length,
      appliedTaskCount: this.appliedStalledTaskRecords.length,
      appliedTaskOpportunityIds: this.appliedStalledTaskRecords.map(
        (record) => record.opportunityId,
      ),
      duplicateApplyBlockedCount: this.stalledDuplicateApplyBlockedCount,
    };
  }

  getStalledReminderQueue(options?: {
    assigneeState?: StalledReminderAssigneeState;
    limit?: number;
  }) {
    const limit = options?.limit ?? 20;
    const opportunities = this.stalledOpportunities
      .map((opportunity) => this.decorateStalledOpportunity(opportunity))
      .filter((opportunity) =>
        options?.assigneeState
          ? opportunity.assigneeState === options.assigneeState
          : true,
      )
      .sort((left, right) => (right.stalledDays ?? 0) - (left.stalledDays ?? 0))
      .slice(0, limit);

    return {
      summary: {
        ...this.getStalledSummary(),
        queueAssigneeState: options?.assigneeState ?? 'all',
        queueCount: opportunities.length,
      },
      opportunities,
    };
  }

  getQuoteFollowUpOverview() {
    return {
      summary: this.getQuoteFollowUpSummary(),
      opportunities: this.overdueQuotationFollowUpOpportunities,
      taskCandidates: this.quotationFollowUpTaskCandidates,
      preparedTaskRequests: this.preparedQuotationFollowUpTaskRequests,
      appliedTaskRecords: this.appliedQuotationFollowUpTaskRecords,
    };
  }

  getStalledOverview() {
    return {
      summary: this.getStalledSummary(),
      opportunities: this.stalledOpportunities,
      taskCandidates: this.stalledTaskCandidates,
      preparedTaskRequests: this.preparedStalledTaskRequests,
      appliedTaskRecords: this.appliedStalledTaskRecords,
    };
  }

  getAppliedQuoteFollowUpTaskRecords() {
    return this.appliedQuotationFollowUpTaskRecords;
  }

  getAppliedQuoteFollowUpTaskRecordById(id: string) {
    return (
      this.appliedQuotationFollowUpTaskRecords.find(
        (record) => record.id === id,
      ) ?? null
    );
  }

  getAppliedStalledTaskRecords() {
    return this.appliedStalledTaskRecords;
  }

  getAppliedStalledTaskRecordById(id: string) {
    return this.appliedStalledTaskRecords.find((record) => record.id === id) ?? null;
  }

  getQuoteFollowUpOpportunityStatus(opportunityId: string) {
    const opportunity =
      this.overdueQuotationFollowUpOpportunities.find(
        (entry) => entry.opportunityId === opportunityId,
      ) ?? null;
    const candidate =
      this.quotationFollowUpTaskCandidates.find(
        (entry) => entry.opportunityId === opportunityId,
      ) ?? null;
    const preparedRequest =
      this.preparedQuotationFollowUpTaskRequests.find(
        (entry) => entry.opportunityId === opportunityId,
      ) ?? null;
    const appliedRecord =
      this.appliedQuotationFollowUpTaskRecords.find(
        (entry) => entry.opportunityId === opportunityId,
      ) ?? null;

    if (!opportunity && !candidate && !preparedRequest && !appliedRecord) {
      return null;
    }

    return {
      opportunityId,
      status: {
        overdueForQuoteFollowUp: opportunity !== null,
        preparedTaskAvailable: preparedRequest !== null,
        taskApplied: appliedRecord !== null,
      },
      opportunity,
      taskCandidate: candidate,
      preparedTaskRequest: preparedRequest,
      appliedTaskRecord: appliedRecord,
    };
  }

  getStalledOpportunityStatus(opportunityId: string) {
    const opportunity =
      this.stalledOpportunities.find(
        (entry) => entry.opportunityId === opportunityId,
      ) ?? null;
    const candidate =
      this.stalledTaskCandidates.find(
        (entry) => entry.opportunityId === opportunityId,
      ) ?? null;
    const preparedRequest =
      this.preparedStalledTaskRequests.find(
        (entry) => entry.opportunityId === opportunityId,
      ) ?? null;
    const appliedRecord =
      this.appliedStalledTaskRecords.find(
        (entry) => entry.opportunityId === opportunityId,
      ) ?? null;

    if (!opportunity && !candidate && !preparedRequest && !appliedRecord) {
      return null;
    }

    return {
      opportunityId,
      status: {
        stalled: opportunity !== null,
        preparedTaskAvailable: preparedRequest !== null,
        taskApplied: appliedRecord !== null,
      },
      opportunity,
      taskCandidate: candidate,
      preparedTaskRequest: preparedRequest,
      appliedTaskRecord: appliedRecord,
    };
  }

  async applyPreparedQuoteFollowUpTaskRequest(
    opportunityId: string,
    options?: { apply?: boolean },
  ) {
    const request = this.preparedQuotationFollowUpTaskRequests.find(
      (candidate) => candidate.opportunityId === opportunityId,
    );

    if (!request) {
      return null;
    }

    if (options?.apply === true) {
      const existingRecord = this.appliedQuotationFollowUpTaskRecords.find(
        (record) => record.opportunityId === opportunityId,
      );

      if (existingRecord) {
        this.quoteFollowUpDuplicateApplyBlockedCount += 1;
        await this.persistState();

        return {
          ...existingRecord,
          duplicate: true as const,
        };
      }
    }

    const result = await this.twentyClientService.createQuotationFollowUpTask(
      request,
      options,
    );

    if (result.mode === 'remote' && result.applyRequested === true) {
      this.appliedQuotationFollowUpTaskRecords = [
        ...this.appliedQuotationFollowUpTaskRecords.filter(
          (record) => record.opportunityId !== opportunityId,
        ),
        {
          id: opportunityId,
          opportunityId,
          endpoint: result.endpoint,
          mode: 'remote',
          recordId: result.recordId,
          applyRequested: true,
          appliedAt: new Date().toISOString(),
          relationGap: result.relationGap,
        },
      ];
      await this.persistState();
    }

    return result;
  }

  async applyPreparedStalledTaskRequest(
    opportunityId: string,
    options?: { apply?: boolean },
  ) {
    const request = this.preparedStalledTaskRequests.find(
      (candidate) => candidate.opportunityId === opportunityId,
    );

    if (!request) {
      return null;
    }

    if (options?.apply === true) {
      const existingRecord = this.appliedStalledTaskRecords.find(
        (record) => record.opportunityId === opportunityId,
      );

      if (existingRecord) {
        this.stalledDuplicateApplyBlockedCount += 1;
        await this.persistState();

        return {
          ...existingRecord,
          duplicate: true as const,
        };
      }
    }

    const result = await this.twentyClientService.createStalledOpportunityTask(
      request,
      options,
    );

    if (result.mode === 'remote' && result.applyRequested === true) {
      this.appliedStalledTaskRecords = [
        ...this.appliedStalledTaskRecords.filter(
          (record) => record.opportunityId !== opportunityId,
        ),
        {
          id: opportunityId,
          opportunityId,
          endpoint: result.endpoint,
          mode: 'remote',
          recordId: result.recordId,
          applyRequested: true,
          appliedAt: new Date().toISOString(),
          relationGap: result.relationGap,
        },
      ];
      await this.persistState();
    }

    return result;
  }

  private buildQuotationFollowUpTaskCandidate(
    opportunity: OverdueQuotationFollowUpOpportunity,
  ): QuotationFollowUpTaskCandidate {
    const dueAt = new Date(
      Date.now() + this.getQuoteFollowUpTaskDueHours() * 60 * 60 * 1000,
    ).toISOString();
    const opportunityDisplayName =
      opportunity.opportunityName ??
      opportunity.companyName ??
      opportunity.opportunityId;
    const markdown = [
      `Opportunity ID: ${opportunity.opportunityId}`,
      `Opportunity Name: ${opportunity.opportunityName ?? 'N/A'}`,
      `Company: ${opportunity.companyName ?? 'N/A'}`,
      `Stage: ${opportunity.stage ?? 'N/A'}`,
      `Overdue Days: ${opportunity.overdueDays ?? 'N/A'}`,
      'Action: Follow up the quotation and update next_action / next_action_date.',
    ].join('\n');

    return {
      opportunityId: opportunity.opportunityId,
      assignedToId: opportunity.assignedToId,
      taskPayload: {
        title: `Quotation follow-up overdue: ${opportunityDisplayName}`,
        status: 'TODO',
        dueAt,
        assigneeId: opportunity.assignedToId,
        result: null,
        bodyV2: {
          blocknote: markdown,
          markdown,
        },
      },
    };
  }

  private getQuoteFollowUpReminderAssigneeState(
    opportunity: OverdueQuotationFollowUpOpportunity,
  ) {
    return opportunity.assignedToId
      ? ('assigned' as const satisfies QuoteFollowUpReminderAssigneeState)
      : ('unassigned' as const satisfies QuoteFollowUpReminderAssigneeState);
  }

  private getQuoteFollowUpReminderReason(
    opportunity: OverdueQuotationFollowUpOpportunity,
  ) {
    if (!opportunity.assignedToId) {
      return 'Opportunity is overdue for quotation follow-up and still has no owner, so assignment needs manual review before task execution.';
    }

    return `Opportunity is overdue for ${opportunity.overdueDays ?? 'unknown'} day(s) after quotation sent and should return to the owner follow-up queue.`;
  }

  private decorateQuoteFollowUpOpportunity(
    opportunity: OverdueQuotationFollowUpOpportunity,
  ) {
    return {
      ...opportunity,
      assigneeState: this.getQuoteFollowUpReminderAssigneeState(opportunity),
      reminderReason: this.getQuoteFollowUpReminderReason(opportunity),
      hasPreparedTaskRequest: this.preparedQuotationFollowUpTaskRequests.some(
        (request) => request.opportunityId === opportunity.opportunityId,
      ),
      taskAlreadyApplied: this.appliedQuotationFollowUpTaskRecords.some(
        (record) => record.opportunityId === opportunity.opportunityId,
      ),
    };
  }

  private buildStalledTaskCandidate(
    opportunity: StalledOpportunity,
  ): StalledTaskCandidate {
    const dueAt = new Date(
      Date.now() + this.getStalledTaskDueHours() * 60 * 60 * 1000,
    ).toISOString();
    const opportunityDisplayName =
      opportunity.opportunityName ??
      opportunity.companyName ??
      opportunity.opportunityId;
    const markdown = [
      `Opportunity ID: ${opportunity.opportunityId}`,
      `Opportunity Name: ${opportunity.opportunityName ?? 'N/A'}`,
      `Company: ${opportunity.companyName ?? 'N/A'}`,
      `Stage: ${opportunity.stage ?? 'N/A'}`,
      `Stalled Days: ${opportunity.stalledDays ?? 'N/A'}`,
      'Action: Re-engage this stalled opportunity and update next_action / next_action_date.',
    ].join('\n');

    return {
      opportunityId: opportunity.opportunityId,
      assignedToId: opportunity.assignedToId,
      taskPayload: {
        title: `Re-engage stalled opportunity: ${opportunityDisplayName}`,
        status: 'TODO',
        dueAt,
        assigneeId: opportunity.assignedToId,
        result: null,
        bodyV2: {
          blocknote: markdown,
          markdown,
        },
      },
    };
  }

  private getStalledReminderAssigneeState(opportunity: StalledOpportunity) {
    return opportunity.assignedToId
      ? ('assigned' as const satisfies StalledReminderAssigneeState)
      : ('unassigned' as const satisfies StalledReminderAssigneeState);
  }

  private getStalledReminderReason(opportunity: StalledOpportunity) {
    if (!opportunity.assignedToId) {
      return 'Opportunity is stalled and still has no owner, so routing needs manual review before re-engagement.';
    }

    return `Opportunity has been stalled for ${opportunity.stalledDays ?? 'unknown'} day(s) and should return to the owner re-engagement queue.`;
  }

  private decorateStalledOpportunity(opportunity: StalledOpportunity) {
    return {
      ...opportunity,
      assigneeState: this.getStalledReminderAssigneeState(opportunity),
      reminderReason: this.getStalledReminderReason(opportunity),
      hasPreparedTaskRequest: this.preparedStalledTaskRequests.some(
        (request) => request.opportunityId === opportunity.opportunityId,
      ),
      taskAlreadyApplied: this.appliedStalledTaskRecords.some(
        (record) => record.opportunityId === opportunity.opportunityId,
      ),
    };
  }

  private getQuoteFollowUpAfterDays() {
    const rawValue = this.configService.get(
      'OPPORTUNITY_QUOTE_FOLLOWUP_AFTER_DAYS',
      {
        infer: true,
      },
    );
    const parsedValue = Number(rawValue);

    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 3;
  }

  private getQuoteFollowUpTaskDueHours() {
    const rawValue = this.configService.get(
      'OPPORTUNITY_QUOTE_FOLLOWUP_TASK_DUE_HOURS',
      {
        infer: true,
      },
    );
    const parsedValue = Number(rawValue);

    return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
  }

  private getQuoteFollowUpTaskAutoApply() {
    const rawValue = this.configService.get(
      'OPPORTUNITY_QUOTE_FOLLOWUP_TASK_AUTO_APPLY',
      {
        infer: true,
      },
    );

    return this.normalizeBoolean(rawValue, true);
  }

  private getStalledAfterDays() {
    const rawValue = this.configService.get('OPPORTUNITY_STALLED_AFTER_DAYS', {
      infer: true,
    });
    const parsedValue = Number(rawValue);

    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 7;
  }

  private getStalledTaskDueHours() {
    const rawValue = this.configService.get(
      'OPPORTUNITY_STALLED_TASK_DUE_HOURS',
      {
        infer: true,
      },
    );
    const parsedValue = Number(rawValue);

    return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
  }

  private getStalledTaskAutoApply() {
    const rawValue = this.configService.get(
      'OPPORTUNITY_STALLED_TASK_AUTO_APPLY',
      {
        infer: true,
      },
    );

    return this.normalizeBoolean(rawValue, true);
  }

  private normalizeBoolean(value: unknown, fallback: boolean) {
    if (typeof value === 'boolean') {
      return value;
    }

    if (value !== undefined && value !== null) {
      return String(value).trim().toLowerCase() === 'true';
    }

    return fallback;
  }

  private persistState() {
    this.persistPromise = this.persistPromise.then(() =>
      this.stateRepository.save([
        {
          id: 'opportunity-monitoring',
          lastSweepAt: this.lastSweepAt,
          quoteFollowUpLastSweepAt: this.quoteFollowUpLastSweepAt,
          stalledLastSweepAt: this.stalledLastSweepAt,
          quoteFollowUpDuplicateApplyBlockedCount:
            this.quoteFollowUpDuplicateApplyBlockedCount,
          stalledDuplicateApplyBlockedCount:
            this.stalledDuplicateApplyBlockedCount,
          appliedQuotationFollowUpTaskRecords:
            this.appliedQuotationFollowUpTaskRecords,
          appliedStalledTaskRecords: this.appliedStalledTaskRecords,
        },
      ]),
    );

    return this.persistPromise;
  }
}
