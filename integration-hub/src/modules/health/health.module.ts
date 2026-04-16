import { Module } from '@nestjs/common';

import { HealthController } from 'src/modules/health/health.controller';
import { LeadMonitoringModule } from 'src/modules/lead-monitoring/lead-monitoring.module';
import { OpportunityMonitoringModule } from 'src/modules/opportunity-monitoring/opportunity-monitoring.module';
import { OutboxModule } from 'src/modules/outbox/outbox.module';
import { SyncJobsModule } from 'src/modules/sync-jobs/sync-jobs.module';
import { TwentyClientModule } from 'src/modules/twenty-client/twenty-client.module';
import { TwentyWebhookModule } from 'src/modules/webhooks/twenty/twenty-webhook.module';

@Module({
  imports: [
    LeadMonitoringModule,
    OpportunityMonitoringModule,
    OutboxModule,
    SyncJobsModule,
    TwentyClientModule,
    TwentyWebhookModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}
