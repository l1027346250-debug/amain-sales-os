import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'node:path';
import { Pool } from 'pg';

import { JsonFileStateRepository } from 'src/common/state/json-file-state.repository';
import { PostgresStateRepository } from 'src/common/state/postgres-state.repository';
import { StateRepository } from 'src/common/state/state.repository';
import { IntegrationHubEnv } from 'src/config/env';
import { FirstResponseTaskApplyRecord } from 'src/modules/lead-monitoring/types/first-response-task-apply-record.type';
import { FirstResponseTaskCandidate } from 'src/modules/lead-monitoring/types/first-response-task-candidate.type';
import { LeadMonitoringState } from 'src/modules/lead-monitoring/types/lead-monitoring-state.type';
import { FirstResponseTaskRequest } from 'src/modules/lead-monitoring/types/first-response-task-request.type';
import { LeadCreatedAutomationRecord } from 'src/modules/lead-monitoring/types/lead-created-automation-record.type';
import { OverdueLeadReminder } from 'src/modules/lead-monitoring/types/overdue-lead-reminder.type';
import { TwentyClientService } from 'src/modules/twenty-client/twenty-client.service';

const MAX_OVERDUE_LEADS_TO_TRACK = 50;
const MAX_LEAD_CREATED_AUTOMATION_RECORDS = 50;
type FirstResponseReminderLevel =
  | 'owner_reminder'
  | 'manager_escalation'
  | 'unassigned_overdue';

@Injectable()
export class LeadMonitoringService implements OnModuleInit {
  private readonly logger = new Logger(LeadMonitoringService.name);
  private overdueFirstResponseLeads: OverdueLeadReminder[] = [];
  private firstResponseTaskCandidates: FirstResponseTaskCandidate[] = [];
  private preparedFirstResponseTaskRequests: FirstResponseTaskRequest[] = [];
  private appliedFirstResponseTaskRecords: FirstResponseTaskApplyRecord[] = [];
  private recentLeadCreatedAutomationRecords: LeadCreatedAutomationRecord[] = [];
  private duplicateApplyBlockedCount = 0;
  private lastSweepAt: string | null = null;
  private stateRepository: StateRepository<LeadMonitoringState>;
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

      this.stateRepository = new PostgresStateRepository<LeadMonitoringState>(
        new Pool({ connectionString }),
        'integration_hub_lead_monitoring_state',
      );
      return;
    }

    this.stateRepository = new JsonFileStateRepository<LeadMonitoringState>(
      path.join(stateDirectory, 'lead-monitoring-state.json'),
    );
  }

  async onModuleInit() {
    const [savedState] = await this.stateRepository.load();

    if (!savedState) {
      return;
    }

    this.lastSweepAt = savedState.lastSweepAt;
    this.duplicateApplyBlockedCount = savedState.duplicateApplyBlockedCount;
    this.appliedFirstResponseTaskRecords =
      savedState.appliedFirstResponseTaskRecords;
    this.recentLeadCreatedAutomationRecords =
      savedState.recentLeadCreatedAutomationRecords ?? [];
  }

  async sweepOverdueFirstResponses() {
    const result =
      await this.twentyClientService.findLeadsOverdueForFirstResponse({
        thresholdHours: this.getFirstResponseSlaHours(),
        limit: MAX_OVERDUE_LEADS_TO_TRACK,
      });

    if (result.mode === 'prepared') {
      this.lastSweepAt = new Date().toISOString();

      this.logger.log(
        'Lead first response SLA sweep stayed in prepared mode because Twenty API is not configured',
      );
      await this.persistState();

      return {
        ...result,
        reminders: this.overdueFirstResponseLeads,
        taskCandidates: this.firstResponseTaskCandidates,
        preparedTaskRequests: this.preparedFirstResponseTaskRequests,
      };
    }

    this.overdueFirstResponseLeads = result.records;
    this.firstResponseTaskCandidates = result.records.map(
      (lead: OverdueLeadReminder) => this.buildFirstResponseTaskCandidate(lead),
    );
    this.preparedFirstResponseTaskRequests =
      this.firstResponseTaskCandidates.map((candidate) =>
        this.twentyClientService.prepareFirstResponseReminderTask(candidate),
      );
    this.lastSweepAt = new Date().toISOString();
    await this.persistState();

    this.logger.log(
      `Lead first response SLA sweep found ${result.records.length} overdue lead(s)`,
    );

    return {
      ...result,
      reminders: result.records,
      taskCandidates: this.firstResponseTaskCandidates,
      preparedTaskRequests: this.preparedFirstResponseTaskRequests,
    };
  }

  getSummary() {
    return {
      lastSweepAt: this.lastSweepAt,
      firstResponseSlaHours: this.getFirstResponseSlaHours(),
      firstResponseManagerEscalationHours:
        this.getFirstResponseManagerEscalationHours(),
      overdueCount: this.overdueFirstResponseLeads.length,
      oldestOverdueHours: this.overdueFirstResponseLeads.reduce<number | null>(
        (maxValue, lead) => {
          if (typeof lead.overdueHours !== 'number') {
            return maxValue;
          }

          if (maxValue === null || lead.overdueHours > maxValue) {
            return lead.overdueHours;
          }

          return maxValue;
        },
        null,
      ),
      overdueLeadIds: this.overdueFirstResponseLeads.map((lead) => lead.leadId),
      ownerReminderCount: this.overdueFirstResponseLeads.filter(
        (lead) => this.getReminderLevel(lead) === 'owner_reminder',
      ).length,
      managerEscalationCount: this.overdueFirstResponseLeads.filter(
        (lead) => this.getReminderLevel(lead) === 'manager_escalation',
      ).length,
      unassignedOverdueCount: this.overdueFirstResponseLeads.filter(
        (lead) => this.getReminderLevel(lead) === 'unassigned_overdue',
      ).length,
      taskCandidateCount: this.firstResponseTaskCandidates.length,
      taskCandidateLeadIds: this.firstResponseTaskCandidates.map(
        (candidate) => candidate.leadId,
      ),
      preparedTaskRequestCount: this.preparedFirstResponseTaskRequests.length,
      preparedTaskRequestLeadIds: this.preparedFirstResponseTaskRequests.map(
        (request) => request.leadId,
      ),
      preparedTaskWithoutAssigneeCount:
        this.preparedFirstResponseTaskRequests.filter(
          (request) => request.payload.assigneeId === null,
        ).length,
      appliedTaskCount: this.appliedFirstResponseTaskRecords.length,
      appliedTaskLeadIds: this.appliedFirstResponseTaskRecords.map(
        (record) => record.leadId,
      ),
      leadCreatedAutomationRecordCount:
        this.recentLeadCreatedAutomationRecords.length,
      leadCreatedAutomationAssignedCount:
        this.recentLeadCreatedAutomationRecords.filter(
          (record) => record.assignmentStatus === 'assigned',
        ).length,
      leadCreatedAutomationTaskCreatedCount:
        this.recentLeadCreatedAutomationRecords.filter(
          (record) => record.firstResponseTaskStatus === 'created',
        ).length,
      leadCreatedAutomationTaskPreparedCount:
        this.recentLeadCreatedAutomationRecords.filter(
          (record) =>
            record.firstResponseTaskStatus === 'prepared' ||
            record.firstResponseTaskStatus === 'prepared_only',
        ).length,
      duplicateApplyBlockedCount: this.duplicateApplyBlockedCount,
    };
  }

  getFirstResponseReminderQueue(options?: {
    level?: FirstResponseReminderLevel;
    limit?: number;
  }) {
    const limit = options?.limit ?? 20;
    const reminders = this.overdueFirstResponseLeads
      .map((lead) => this.decorateReminder(lead))
      .filter((lead) =>
        options?.level ? lead.reminderLevel === options.level : true,
      )
      .sort((left, right) => (right.overdueHours ?? 0) - (left.overdueHours ?? 0))
      .slice(0, limit);

    return {
      summary: {
        ...this.getSummary(),
        queueLevel: options?.level ?? 'all',
        queueCount: reminders.length,
      },
      reminders,
    };
  }

  getFirstResponseOverview() {
    return {
      summary: this.getSummary(),
      reminders: this.overdueFirstResponseLeads.map((lead) =>
        this.decorateReminder(lead),
      ),
      taskCandidates: this.firstResponseTaskCandidates,
      preparedTaskRequests: this.preparedFirstResponseTaskRequests,
      appliedTaskRecords: this.appliedFirstResponseTaskRecords,
    };
  }

  getPreparedTaskRequests() {
    return this.preparedFirstResponseTaskRequests;
  }

  getAppliedTaskRecords() {
    return this.appliedFirstResponseTaskRecords;
  }

  getAppliedTaskRecordById(id: string) {
    return (
      this.appliedFirstResponseTaskRecords.find((record) => record.id === id) ??
      null
    );
  }

  getLeadCreatedAutomationRecords(limit = 20) {
    return this.recentLeadCreatedAutomationRecords.slice(0, limit);
  }

  async recordLeadCreatedAutomation(input: {
    leadRecordId: string | null;
    externalId: string | null;
    leadName: string | null;
    assignedToId: string | null;
    assignmentStatus: 'assigned' | 'unassigned';
    assignmentStrategy: string;
    firstResponseTaskStatus: 'created' | 'prepared' | 'prepared_only' | 'skipped';
    firstResponseTaskMode: 'remote' | 'prepared' | 'none';
    firstResponseTaskRecordId: string | null;
    reason: string;
  }) {
    const recordedAt = new Date().toISOString();
    const record: LeadCreatedAutomationRecord = {
      id: input.leadRecordId ?? input.externalId ?? recordedAt,
      leadRecordId: input.leadRecordId,
      externalId: input.externalId,
      leadName: input.leadName,
      assignedToId: input.assignedToId,
      assignmentStatus: input.assignmentStatus,
      assignmentStrategy: input.assignmentStrategy,
      firstResponseTaskStatus: input.firstResponseTaskStatus,
      firstResponseTaskMode: input.firstResponseTaskMode,
      firstResponseTaskRecordId: input.firstResponseTaskRecordId,
      recordedAt,
      reason: input.reason,
    };

    this.recentLeadCreatedAutomationRecords = [
      record,
      ...this.recentLeadCreatedAutomationRecords.filter(
        (existingRecord) => existingRecord.id !== record.id,
      ),
    ].slice(0, MAX_LEAD_CREATED_AUTOMATION_RECORDS);

    await this.persistState();

    return record;
  }

  getFirstResponseLeadStatus(leadId: string) {
    const reminder =
      this.overdueFirstResponseLeads.find((entry) => entry.leadId === leadId) ??
      null;
    const candidate =
      this.firstResponseTaskCandidates.find((entry) => entry.leadId === leadId) ??
      null;
    const preparedRequest =
      this.preparedFirstResponseTaskRequests.find(
        (entry) => entry.leadId === leadId,
      ) ?? null;
    const appliedRecord =
      this.appliedFirstResponseTaskRecords.find(
        (entry) => entry.leadId === leadId,
      ) ?? null;

    if (!reminder && !candidate && !preparedRequest && !appliedRecord) {
      return null;
    }

    return {
      leadId,
      status: {
        overdueForFirstResponse: reminder !== null,
        preparedTaskAvailable: preparedRequest !== null,
        taskApplied: appliedRecord !== null,
      },
      reminder: reminder ? this.decorateReminder(reminder) : null,
      reminderLevel: reminder ? this.getReminderLevel(reminder) : null,
      reminderReason: reminder ? this.getReminderReason(reminder) : null,
      taskCandidate: candidate,
      preparedTaskRequest: preparedRequest,
      appliedTaskRecord: appliedRecord,
    };
  }

  async applyPreparedFirstResponseTaskRequest(
    leadId: string,
    options?: { apply?: boolean },
  ) {
    const request = this.preparedFirstResponseTaskRequests.find(
      (candidate) => candidate.leadId === leadId,
    );

    if (!request) {
      return null;
    }

    if (options?.apply === true) {
      const existingRecord = this.appliedFirstResponseTaskRecords.find(
        (record) => record.leadId === leadId,
      );

      if (existingRecord) {
        this.duplicateApplyBlockedCount += 1;
        await this.persistState();

        return {
          ...existingRecord,
          duplicate: true as const,
        };
      }
    }

    const result = await this.twentyClientService.createFirstResponseReminderTask(
      request,
      options,
    );

    if (result.mode === 'remote' && result.applyRequested === true) {
      this.appliedFirstResponseTaskRecords = [
        ...this.appliedFirstResponseTaskRecords.filter(
          (record) => record.leadId !== leadId,
        ),
        {
          id: leadId,
          leadId,
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

  private buildFirstResponseTaskCandidate(
    lead: OverdueLeadReminder,
  ): FirstResponseTaskCandidate {
    const dueAt = new Date(
      Date.now() +
        this.getFirstResponseTaskDueHours() * 60 * 60 * 1000,
    ).toISOString();
    const leadDisplayName = lead.leadName ?? lead.email ?? lead.leadId;
    const reminderLevel = this.getReminderLevel(lead);
    const markdown = [
      `Lead ID: ${lead.leadId}`,
      `Lead Name: ${lead.leadName ?? 'N/A'}`,
      `Lead Email: ${lead.email ?? 'N/A'}`,
      `Overdue Hours: ${lead.overdueHours ?? 'N/A'}`,
      `Reminder Level: ${reminderLevel}`,
      `Reminder Reason: ${this.getReminderReason(lead)}`,
    ].join('\n');

    return {
      leadId: lead.leadId,
      assignedToId: lead.assignedToId,
      taskPayload: {
        title: this.getTaskTitleForReminderLevel(reminderLevel, leadDisplayName),
        status: 'TODO',
        dueAt,
        assigneeId: lead.assignedToId,
        result: null,
        bodyV2: {
          blocknote: markdown,
          markdown,
        },
      },
    };
  }

  prepareLeadCreatedFirstResponseTask(candidate: {
    leadId: string;
    leadName: string | null;
    email: string | null;
    assignedToId: string | null;
    source: string | null;
    productCategory: string | null;
  }) {
    const dueAt = new Date(
      Date.now() +
        this.getFirstResponseTaskDueHours() * 60 * 60 * 1000,
    ).toISOString();
    const leadDisplayName =
      candidate.leadName ?? candidate.email ?? candidate.leadId;
    const markdown = [
      `Lead ID: ${candidate.leadId}`,
      `Lead Name: ${candidate.leadName ?? 'N/A'}`,
      `Lead Email: ${candidate.email ?? 'N/A'}`,
      `Source: ${candidate.source ?? 'N/A'}`,
      `Product Category: ${candidate.productCategory ?? 'N/A'}`,
      'Action: Make the first response and set the next follow-up date.',
    ].join('\n');

    return this.twentyClientService.prepareFirstResponseReminderTask({
      leadId: candidate.leadId,
      assignedToId: candidate.assignedToId,
      taskPayload: {
        title: `First response: ${leadDisplayName}`,
        status: 'TODO',
        dueAt,
        assigneeId: candidate.assignedToId,
        result: null,
        bodyV2: {
          blocknote: markdown,
          markdown,
        },
      },
    });
  }

  private getFirstResponseTaskDueHours() {
    const rawValue = this.configService.get('LEAD_FIRST_RESPONSE_TASK_DUE_HOURS', {
      infer: true,
    });
    const parsedValue = Number(rawValue);

    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 2;
  }

  private getFirstResponseSlaHours() {
    const rawValue = this.configService.get('LEAD_FIRST_RESPONSE_SLA_HOURS', {
      infer: true,
    });
    const parsedValue = Number(rawValue);

    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 12;
  }

  private getFirstResponseManagerEscalationHours() {
    const rawValue = this.configService.get(
      'LEAD_FIRST_RESPONSE_MANAGER_ESCALATION_HOURS',
      {
        infer: true,
      },
    );
    const parsedValue = Number(rawValue);

    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 24;
  }

  private getReminderLevel(lead: OverdueLeadReminder) {
    if (!lead.assignedToId) {
      return 'unassigned_overdue' as const satisfies FirstResponseReminderLevel;
    }

    if (
      typeof lead.overdueHours === 'number' &&
      lead.overdueHours >= this.getFirstResponseManagerEscalationHours()
    ) {
      return 'manager_escalation' as const satisfies FirstResponseReminderLevel;
    }

    return 'owner_reminder' as const satisfies FirstResponseReminderLevel;
  }

  private getReminderReason(lead: OverdueLeadReminder) {
    const reminderLevel = this.getReminderLevel(lead);

    if (reminderLevel === 'unassigned_overdue') {
      return 'Lead is overdue for first response and still has no assignee, so routing needs manual intervention.';
    }

    if (reminderLevel === 'manager_escalation') {
      return `Lead is overdue for ${lead.overdueHours ?? 'unknown'} hours and should be escalated to the supervisor review queue.`;
    }

    return `Lead exceeded the ${this.getFirstResponseSlaHours()} hour first-response SLA and should be reminded to the current owner first.`;
  }

  private decorateReminder(lead: OverdueLeadReminder) {
    return {
      ...lead,
      reminderLevel: this.getReminderLevel(lead),
      reminderReason: this.getReminderReason(lead),
      shouldEscalateToManager:
        this.getReminderLevel(lead) === 'manager_escalation',
    };
  }

  private getTaskTitleForReminderLevel(
    reminderLevel: 'owner_reminder' | 'manager_escalation' | 'unassigned_overdue',
    leadDisplayName: string,
  ) {
    switch (reminderLevel) {
      case 'manager_escalation':
        return `First response escalation: ${leadDisplayName}`;
      case 'unassigned_overdue':
        return `First response routing gap: ${leadDisplayName}`;
      default:
        return `First response overdue: ${leadDisplayName}`;
    }
  }

  private persistState() {
    this.persistPromise = this.persistPromise.then(() =>
      this.stateRepository.save([
        {
          id: 'lead-monitoring',
          lastSweepAt: this.lastSweepAt,
          duplicateApplyBlockedCount: this.duplicateApplyBlockedCount,
          appliedFirstResponseTaskRecords: this.appliedFirstResponseTaskRecords,
          recentLeadCreatedAutomationRecords:
            this.recentLeadCreatedAutomationRecords,
        },
      ]),
    );

    return this.persistPromise;
  }
}
