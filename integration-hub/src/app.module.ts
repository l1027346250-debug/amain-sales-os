import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AiAssistantModule } from 'src/modules/ai-assistant/ai-assistant.module';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';
import { ClassificationModule } from 'src/modules/classification/classification.module';
import { getEnv } from 'src/config/env';
import { DeduplicationModule } from 'src/modules/deduplication/deduplication.module';
import { HealthModule } from 'src/modules/health/health.module';
import { AlibabaModule } from 'src/modules/inbound/alibaba/alibaba.module';
import { LeadMonitoringModule } from 'src/modules/lead-monitoring/lead-monitoring.module';
import { LeadIntakeModule } from 'src/modules/lead-intake/lead-intake.module';
import { OpsModule } from 'src/modules/ops/ops.module';
import { OpportunityMonitoringModule } from 'src/modules/opportunity-monitoring/opportunity-monitoring.module';
import { OutboxModule } from 'src/modules/outbox/outbox.module';
import { RoutingModule } from 'src/modules/routing/routing.module';
import { SchedulerModule } from 'src/modules/scheduler/scheduler.module';
import { SyncJobsModule } from 'src/modules/sync-jobs/sync-jobs.module';
import { TwentyClientModule } from 'src/modules/twenty-client/twenty-client.module';
import { TwentyWebhookModule } from 'src/modules/webhooks/twenty/twenty-webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [getEnv],
    }),
    ScheduleModule.forRoot(),
    AiAssistantModule,
    AuditLogModule,
    ClassificationModule,
    HealthModule,
    AlibabaModule,
    TwentyWebhookModule,
    DeduplicationModule,
    TwentyClientModule,
    LeadMonitoringModule,
    OpportunityMonitoringModule,
    OutboxModule,
    OpsModule,
    RoutingModule,
    SyncJobsModule,
    LeadIntakeModule,
    SchedulerModule,
  ],
})
export class AppModule {}
