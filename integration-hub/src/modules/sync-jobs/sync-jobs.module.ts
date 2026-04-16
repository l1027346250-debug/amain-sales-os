import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SyncJobsController } from 'src/modules/sync-jobs/sync-jobs.controller';
import { SyncJobsService } from 'src/modules/sync-jobs/sync-jobs.service';

@Module({
  imports: [ConfigModule],
  controllers: [SyncJobsController],
  providers: [SyncJobsService],
  exports: [SyncJobsService],
})
export class SyncJobsModule {}
