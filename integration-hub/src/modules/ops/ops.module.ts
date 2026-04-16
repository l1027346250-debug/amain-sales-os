import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LeadMonitoringModule } from 'src/modules/lead-monitoring/lead-monitoring.module';
import { OpportunityMonitoringModule } from 'src/modules/opportunity-monitoring/opportunity-monitoring.module';
import { OutboxModule } from 'src/modules/outbox/outbox.module';
import { OpsController } from 'src/modules/ops/ops.controller';
import { OpsRuntimeService } from 'src/modules/ops/ops-runtime.service';
import { SchedulerModule } from 'src/modules/scheduler/scheduler.module';
import { SyncJobsModule } from 'src/modules/sync-jobs/sync-jobs.module';
import { TwentyClientModule } from 'src/modules/twenty-client/twenty-client.module';
import { TwentyWebhookModule } from 'src/modules/webhooks/twenty/twenty-webhook.module';

@Module({
  imports: [
    ConfigModule,
    LeadMonitoringModule,
    OpportunityMonitoringModule,
    OutboxModule,
    SchedulerModule,
    SyncJobsModule,
    TwentyClientModule,
    TwentyWebhookModule,
  ],
  controllers: [OpsController],
  providers: [OpsRuntimeService],
})
export class OpsModule {}
