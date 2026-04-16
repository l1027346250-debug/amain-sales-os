import { Injectable } from '@nestjs/common';

import { OutboxService } from 'src/modules/outbox/outbox.service';
import { SchedulerService } from 'src/modules/scheduler/scheduler.service';
import { SyncJobsService } from 'src/modules/sync-jobs/sync-jobs.service';
import { TwentyWebhookEventsService } from 'src/modules/webhooks/twenty/twenty-webhook-events.service';

@Injectable()
export class OpsRuntimeService {
  constructor(
    private readonly outboxService: OutboxService,
    private readonly schedulerService: SchedulerService,
    private readonly syncJobsService: SyncJobsService,
    private readonly twentyWebhookEventsService: TwentyWebhookEventsService,
  ) {}

  getRuntimeOverview() {
    const schedulerStatus = this.schedulerService.getStatus();
    const syncJobsSummary = this.syncJobsService.getSummary();
    const outboxSummary = this.outboxService.getSummary();
    const webhookSummary = this.twentyWebhookEventsService.getSummary();

    return {
      scheduler: schedulerStatus,
      retryQueue: {
        pendingJobs: syncJobsSummary.pending,
        failedJobs: syncJobsSummary.failed,
        totalJobs: syncJobsSummary.total,
      },
      outbox: {
        readyEvents: outboxSummary.ready,
        processedEvents: outboxSummary.processed,
        totalEvents: outboxSummary.total,
      },
      webhooks: {
        failedEvents: webhookSummary.failed,
        ignoredEvents: webhookSummary.ignored,
        processedEvents: webhookSummary.processed,
      },
      attentionRequired: {
        retryPendingCount: syncJobsSummary.pending,
        retryFailedCount: syncJobsSummary.failed,
        outboxReadyCount: outboxSummary.ready,
        webhookFailedCount: webhookSummary.failed,
      },
    };
  }
}
