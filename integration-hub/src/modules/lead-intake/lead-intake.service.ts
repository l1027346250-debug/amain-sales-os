import { Injectable } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { IntegrationHubEnv } from 'src/config/env';
import { AuditLogService } from 'src/modules/audit-log/audit-log.service';
import { ClassificationService } from 'src/modules/classification/classification.service';
import { DeduplicationService } from 'src/modules/deduplication/deduplication.service';
import { LeadIntakeDto } from 'src/modules/lead-intake/dto/lead-intake.dto';
import { LeadMonitoringService } from 'src/modules/lead-monitoring/lead-monitoring.service';
import { RoutingService } from 'src/modules/routing/routing.service';
import { TwentyClientRequestError } from 'src/modules/sync-jobs/errors/twenty-client-request.error';
import { SyncJobsService } from 'src/modules/sync-jobs/sync-jobs.service';
import { TwentyClientService } from 'src/modules/twenty-client/twenty-client.service';

@Injectable()
export class LeadIntakeService {
  constructor(
    private readonly configService: ConfigService<IntegrationHubEnv, true>,
    private readonly auditLogService: AuditLogService,
    private readonly classificationService: ClassificationService,
    private readonly deduplicationService: DeduplicationService,
    private readonly leadMonitoringService: LeadMonitoringService,
    private readonly routingService: RoutingService,
    private readonly syncJobsService: SyncJobsService,
    private readonly twentyClientService: TwentyClientService,
  ) {}

  async ingestLead(payload: LeadIntakeDto) {
    const classification = this.classificationService.classifyLead(payload);
    const deduplication = this.deduplicationService.evaluateLead(
      classification.normalizedPayload,
    );
    const assignment = this.routingService.resolveLeadAssignment(
      classification.normalizedPayload,
    );

    const mappedLead = {
      leadName: classification.normalizedPayload.leadName,
      contactName: classification.normalizedPayload.contactName ?? null,
      companyName: classification.normalizedPayload.companyName ?? null,
      email: classification.normalizedPayload.email ?? null,
      phone: classification.normalizedPayload.phone ?? null,
      whatsapp: classification.normalizedPayload.whatsapp ?? null,
      country: classification.normalizedCountry,
      source: classification.normalizedSource,
      productCategory: classification.normalizedProductCategory,
      assignedToId: assignment.assigneeId,
      notes: this.buildLeadNotes(classification.normalizedPayload),
    };

    try {
      const twentyRequest =
        await this.twentyClientService.createOrUpdateLead(mappedLead, {
          preserveAssignmentOnUpdate: true,
        });
      const firstResponseTask = await this.prepareInitialFirstResponseTask({
        payload: classification.normalizedPayload,
        assignmentAssigneeId: assignment.assigneeId,
        twentyRequest,
      });
      const firstResponseTaskStatus = firstResponseTask.status as
        | 'created'
        | 'prepared'
        | 'prepared_only'
        | 'skipped';
      const leadCreatedAutomationRecord =
        await this.leadMonitoringService.recordLeadCreatedAutomation({
          leadRecordId:
            typeof twentyRequest.recordId === 'string'
              ? twentyRequest.recordId
              : null,
          externalId: classification.normalizedPayload.externalId ?? null,
          leadName: classification.normalizedPayload.leadName,
          assignedToId: assignment.assigneeId,
          assignmentStatus: assignment.status,
          assignmentStrategy: assignment.strategy,
          firstResponseTaskStatus,
          firstResponseTaskMode:
            firstResponseTaskStatus === 'created'
              ? 'remote'
              : firstResponseTaskStatus === 'prepared'
                ? 'prepared'
                : 'none',
          firstResponseTaskRecordId:
            'taskResult' in firstResponseTask &&
            firstResponseTask.taskResult &&
            typeof firstResponseTask.taskResult === 'object' &&
            'recordId' in firstResponseTask.taskResult &&
            typeof firstResponseTask.taskResult.recordId === 'string'
              ? firstResponseTask.taskResult.recordId
              : null,
          reason: `${assignment.reason} ${firstResponseTask.reason ?? ''}`.trim(),
        });
      const auditLog = this.auditLogService.recordLeadIntake({
        source: classification.normalizedSource,
        externalId: classification.normalizedPayload.externalId ?? null,
        strategy: `${classification.strategy} -> ${assignment.strategy}`,
        summary:
          twentyRequest.mode === 'remote'
            ? `Lead intake reached Twenty in ${String(twentyRequest.operation)} mode.`
            : 'Lead intake stayed in prepared mode.',
      });

      return {
        status: 'accepted',
        source: classification.normalizedSource,
        externalId: classification.normalizedPayload.externalId ?? null,
        classification,
        deduplication,
        assignment,
        firstResponseTask,
        leadCreatedAutomationRecord,
        auditLog,
        twentyRequest,
      };
    } catch (error) {
      if (error instanceof TwentyClientRequestError && error.retryable) {
        const retryJob = await this.syncJobsService.enqueueLeadUpsertRetry(
          mappedLead,
          error,
        );
        const leadCreatedAutomationRecord =
          await this.leadMonitoringService.recordLeadCreatedAutomation({
            leadRecordId: null,
            externalId: classification.normalizedPayload.externalId ?? null,
            leadName: classification.normalizedPayload.leadName,
            assignedToId: assignment.assigneeId,
            assignmentStatus: assignment.status,
            assignmentStrategy: assignment.strategy,
            firstResponseTaskStatus: 'skipped',
            firstResponseTaskMode: 'none',
            firstResponseTaskRecordId: null,
            reason:
              'Lead write was queued for retry, so the initial first response task was not applied yet.',
          });
        const auditLog = this.auditLogService.recordLeadIntake({
          source: classification.normalizedSource,
          externalId: classification.normalizedPayload.externalId ?? null,
          strategy: `${classification.strategy} -> ${assignment.strategy}`,
          summary:
            'Lead write was queued for retry after a retryable Twenty request error.',
        });

        return {
          status: 'accepted',
          source: classification.normalizedSource,
          externalId: classification.normalizedPayload.externalId ?? null,
          classification,
          deduplication,
          assignment,
          firstResponseTask: {
            status: 'skipped',
            reason:
              'Lead write was queued for retry, so the initial first response task will be prepared after the lead write succeeds.',
          },
          leadCreatedAutomationRecord,
          auditLog,
          twentyRequest: {
            mode: 'queued_for_retry',
            operation: 'upsert',
            retryJobId: retryJob.id,
            retryCount: retryJob.retryCount,
            nextRetryAt: retryJob.nextRetryAt,
            errorCategory: retryJob.lastErrorCategory,
          },
        };
      }

      throw error;
    }
  }

  private async prepareInitialFirstResponseTask({
    payload,
    assignmentAssigneeId,
    twentyRequest,
  }: {
    payload: LeadIntakeDto;
    assignmentAssigneeId: string | null;
    twentyRequest: Record<string, unknown>;
  }) {
    if (twentyRequest.mode !== 'remote') {
      return {
        status: 'prepared_only',
        reason:
          'Lead write stayed in prepared mode, so the first response task is not applied yet.',
      };
    }

    if (twentyRequest.operation !== 'created') {
      return {
        status: 'skipped',
        reason:
          'Lead matched an existing record, so the initial first response task is not created again.',
      };
    }

    const leadId =
      typeof twentyRequest.recordId === 'string' ? twentyRequest.recordId : null;

    if (!leadId) {
      return {
        status: 'skipped',
        reason:
          'Lead was created without a usable recordId in the response, so the initial first response task could not be prepared.',
      };
    }

    const preparedTaskRequest =
      this.leadMonitoringService.prepareLeadCreatedFirstResponseTask({
        leadId,
        leadName: payload.leadName,
        email: payload.email ?? null,
        assignedToId: assignmentAssigneeId,
        source: payload.source,
        productCategory: payload.productCategory ?? null,
      });

    if (!assignmentAssigneeId) {
      return {
        status: 'prepared',
        reason:
          'No assignee was resolved for the new lead, so the first response task stays prepared until real routing data is configured.',
        preparedTaskRequest,
      };
    }

    const shouldApply =
      this.getLeadFirstResponseTaskAutoApply();

    const taskResult =
      await this.twentyClientService.createFirstResponseReminderTask(
        preparedTaskRequest,
        {
          apply: shouldApply,
        },
      );

    return {
      status:
        taskResult.mode === 'remote' && taskResult.applyRequested === true
          ? 'created'
          : 'prepared',
      preparedTaskRequest,
      taskResult,
    };
  }

  private getLeadFirstResponseTaskAutoApply() {
    const rawValue = this.configService.get('LEAD_FIRST_RESPONSE_TASK_AUTO_APPLY', {
      infer: true,
    });

    if (typeof rawValue === 'boolean') {
      return rawValue;
    }

    if (rawValue !== undefined && rawValue !== null) {
      return String(rawValue).trim().toLowerCase() === 'true';
    }

    return true;
  }

  private buildLeadNotes(payload: LeadIntakeDto) {
    const notes = [
      payload.interestedProduct
        ? `Interested product: ${payload.interestedProduct}`
        : null,
      payload.message ? `Inbound message: ${payload.message}` : null,
      payload.notes ? `Notes: ${payload.notes}` : null,
    ].filter((item): item is string => Boolean(item));

    return notes.length > 0 ? notes.join('\n') : null;
  }
}
