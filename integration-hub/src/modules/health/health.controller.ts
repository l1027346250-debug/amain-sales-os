import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LeadMonitoringService } from 'src/modules/lead-monitoring/lead-monitoring.service';
import { OpportunityMonitoringService } from 'src/modules/opportunity-monitoring/opportunity-monitoring.service';
import { OutboxService } from 'src/modules/outbox/outbox.service';
import { SyncJobsService } from 'src/modules/sync-jobs/sync-jobs.service';
import { TwentyClientService } from 'src/modules/twenty-client/twenty-client.service';
import { TwentyWebhookEventsService } from 'src/modules/webhooks/twenty/twenty-webhook-events.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly leadMonitoringService: LeadMonitoringService,
    private readonly opportunityMonitoringService: OpportunityMonitoringService,
    private readonly outboxService: OutboxService,
    private readonly syncJobsService: SyncJobsService,
    private readonly twentyClientService: TwentyClientService,
    private readonly twentyWebhookEventsService: TwentyWebhookEventsService,
  ) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'trade-crm-integration-hub',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('integration')
  getIntegrationHealth() {
    const stateBackend =
      this.configService.get<'file' | 'postgres'>(
        'INTEGRATION_HUB_STATE_BACKEND',
      ) ?? 'file';

    return {
      status: 'ok',
      service: 'trade-crm-integration-hub',
      timestamp: new Date().toISOString(),
      stateBackend,
      twentyClient: this.twentyClientService.getConfigurationStatus(),
      leadMonitoring: this.leadMonitoringService.getSummary(),
      opportunityMonitoring: this.opportunityMonitoringService.getSummary(),
      outbox: this.outboxService.getSummary(),
      syncJobs: this.syncJobsService.getSummary(),
      webhookEvents: this.twentyWebhookEventsService.getSummary(),
    };
  }
}
