import { Module } from '@nestjs/common';

import { LeadMonitoringModule } from 'src/modules/lead-monitoring/lead-monitoring.module';
import { OpportunityMonitoringModule } from 'src/modules/opportunity-monitoring/opportunity-monitoring.module';
import { SchedulerController } from 'src/modules/scheduler/scheduler.controller';
import { SchedulerService } from 'src/modules/scheduler/scheduler.service';
import { SyncJobsModule } from 'src/modules/sync-jobs/sync-jobs.module';
import { TwentyClientModule } from 'src/modules/twenty-client/twenty-client.module';

@Module({
  imports: [
    LeadMonitoringModule,
    OpportunityMonitoringModule,
    SyncJobsModule,
    TwentyClientModule,
  ],
  controllers: [SchedulerController],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
