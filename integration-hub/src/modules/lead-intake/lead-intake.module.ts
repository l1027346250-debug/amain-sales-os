import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';
import { ClassificationModule } from 'src/modules/classification/classification.module';
import { DeduplicationModule } from 'src/modules/deduplication/deduplication.module';
import { LeadIntakeController } from 'src/modules/lead-intake/lead-intake.controller';
import { LeadIntakeService } from 'src/modules/lead-intake/lead-intake.service';
import { LeadMonitoringModule } from 'src/modules/lead-monitoring/lead-monitoring.module';
import { RoutingModule } from 'src/modules/routing/routing.module';
import { SyncJobsModule } from 'src/modules/sync-jobs/sync-jobs.module';
import { TwentyClientModule } from 'src/modules/twenty-client/twenty-client.module';

@Module({
  imports: [
    AuditLogModule,
    ClassificationModule,
    ConfigModule,
    DeduplicationModule,
    LeadMonitoringModule,
    RoutingModule,
    TwentyClientModule,
    SyncJobsModule,
  ],
  controllers: [LeadIntakeController],
  providers: [LeadIntakeService],
  exports: [LeadIntakeService],
})
export class LeadIntakeModule {}
