import { Controller, Get, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'node:path';

import { LeadMonitoringService } from 'src/modules/lead-monitoring/lead-monitoring.service';
import { OpportunityMonitoringService } from 'src/modules/opportunity-monitoring/opportunity-monitoring.service';
import { OpsRuntimeService } from 'src/modules/ops/ops-runtime.service';
import { OutboxService } from 'src/modules/outbox/outbox.service';
import { SyncJobsService } from 'src/modules/sync-jobs/sync-jobs.service';
import { TwentyClientService } from 'src/modules/twenty-client/twenty-client.service';
import { TwentyWebhookEventsService } from 'src/modules/webhooks/twenty/twenty-webhook-events.service';

@Controller('ops')
export class OpsController {
  constructor(
    private readonly configService: ConfigService,
    private readonly leadMonitoringService: LeadMonitoringService,
    private readonly opsRuntimeService: OpsRuntimeService,
    private readonly opportunityMonitoringService: OpportunityMonitoringService,
    private readonly outboxService: OutboxService,
    private readonly syncJobsService: SyncJobsService,
    private readonly twentyClientService: TwentyClientService,
    private readonly twentyWebhookEventsService: TwentyWebhookEventsService,
  ) {}

  @Get('runtime-overview')
  getRuntimeOverview() {
    return {
      status: 'ok',
      service: 'trade-crm-integration-hub',
      timestamp: new Date().toISOString(),
      runtime: this.opsRuntimeService.getRuntimeOverview(),
    };
  }

  @Get('state')
  getState(@Query('recent') recent?: string) {
    const recentLimit = Number.isNaN(Number(recent)) ? 5 : Number(recent);
    const stateDir =
      this.configService.get<string>('INTEGRATION_HUB_STATE_DIR') ??
      path.join(process.cwd(), 'tmp', 'integration-hub-state');
    const stateBackend =
      this.configService.get<'file' | 'postgres'>(
        'INTEGRATION_HUB_STATE_BACKEND',
      ) ?? 'file';
    const statePgUrl =
      stateBackend === 'postgres'
        ? this.configService.get<string>('INTEGRATION_HUB_STATE_PG_URL') ??
          process.env.PG_DATABASE_URL ??
          null
        : null;

    return {
      status: 'ok',
      service: 'trade-crm-integration-hub',
      timestamp: new Date().toISOString(),
      stateBackend,
      stateDir,
      statePgUrl,
      twentyClient: this.twentyClientService.getConfigurationStatus(),
      leadMonitoring: {
        summary: this.leadMonitoringService.getSummary(),
        recentAppliedTaskRecords: this.leadMonitoringService
          .getAppliedTaskRecords()
          .slice(0, recentLimit),
      },
      opportunityMonitoring: {
        summary: this.opportunityMonitoringService.getSummary(),
        recentAppliedTaskRecords: {
          quoteFollowUp: this.opportunityMonitoringService
            .getAppliedQuoteFollowUpTaskRecords()
            .slice(0, recentLimit),
          stalled: this.opportunityMonitoringService
            .getAppliedStalledTaskRecords()
            .slice(0, recentLimit),
        },
      },
      outbox: {
        summary: this.outboxService.getSummary(),
        recentEvents: this.outboxService.getEvents({
          limit: recentLimit,
        }),
      },
      syncJobs: {
        summary: this.syncJobsService.getSummary(),
        recentJobs: this.syncJobsService.getJobs({
          limit: recentLimit,
        }),
      },
      webhookEvents: {
        summary: this.twentyWebhookEventsService.getSummary(),
        recentEvents: this.twentyWebhookEventsService.getLogs({
          limit: recentLimit,
        }),
      },
    };
  }

  @Get('exceptions')
  getExceptions(@Query('recent') recent?: string) {
    const recentLimit = Number.isNaN(Number(recent)) ? 5 : Number(recent);
    const stateBackend =
      this.configService.get<'file' | 'postgres'>(
        'INTEGRATION_HUB_STATE_BACKEND',
      ) ?? 'file';
    const outboxSummary = this.outboxService.getSummary();
    const syncSummary = this.syncJobsService.getSummary();
    const webhookSummary = this.twentyWebhookEventsService.getSummary();
    const leadMonitoringSummary = this.leadMonitoringService.getSummary();
    const opportunityMonitoringSummary =
      this.opportunityMonitoringService.getSummary();
    const pendingJobs = this.syncJobsService.getJobs({
      limit: recentLimit,
      status: 'pending',
    });
    const failedJobs = this.syncJobsService.getJobs({
      limit: recentLimit,
      status: 'failed',
    });
    const recentSyncErrors = this.syncJobsService
      .getJobs({
        limit: recentLimit * 2,
      })
      .filter((job) => job.lastErrorMessage !== null)
      .slice(0, recentLimit)
      .map((job) => ({
        jobId: job.id,
        status: job.status,
        category: job.lastErrorCategory,
        statusCode: job.lastStatusCode,
        message: job.lastErrorMessage,
        updatedAt: job.updatedAt,
      }));

    return {
      status: 'ok',
      service: 'trade-crm-integration-hub',
      timestamp: new Date().toISOString(),
      stateBackend,
      twentyClient: this.twentyClientService.getConfigurationStatus(),
      leadMonitoring: {
        duplicateApplyBlockedCount:
          leadMonitoringSummary.duplicateApplyBlockedCount,
        preparedTaskWithoutAssigneeCount:
          leadMonitoringSummary.preparedTaskWithoutAssigneeCount,
      },
      opportunityMonitoring: {
        quoteFollowUp: {
          duplicateApplyBlockedCount:
            opportunityMonitoringSummary.quoteFollowUp
              .duplicateApplyBlockedCount,
          preparedTaskWithoutAssigneeCount:
            opportunityMonitoringSummary.quoteFollowUp
              .preparedTaskWithoutAssigneeCount,
        },
        stalled: {
          duplicateApplyBlockedCount:
            opportunityMonitoringSummary.stalled.duplicateApplyBlockedCount,
          preparedTaskWithoutAssigneeCount:
            opportunityMonitoringSummary.stalled
              .preparedTaskWithoutAssigneeCount,
        },
      },
      outbox: {
        readyCount: outboxSummary.ready,
        totalCount: outboxSummary.total,
        processedCount: outboxSummary.processed,
        recentReadyEvents: this.outboxService.getEvents({
          limit: recentLimit,
          status: 'ready',
        }),
      },
      syncJobs: {
        pendingCount: syncSummary.pending,
        failedCount: syncSummary.failed,
        pendingJobs,
        failedJobs,
        recentSyncErrors,
      },
      webhookEvents: {
        failedCount: webhookSummary.failed,
        ignoredCount: webhookSummary.ignored,
        recentIgnoredEvents: this.twentyWebhookEventsService.getLogs({
          limit: recentLimit,
          status: 'ignored',
        }),
      },
    };
  }
}
