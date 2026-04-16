import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';

import { SyncJobsService } from 'src/modules/sync-jobs/sync-jobs.service';

@Controller('sync-jobs')
export class SyncJobsController {
  constructor(private readonly syncJobsService: SyncJobsService) {}

  @Get()
  getJobs(
    @Query('limit') limit?: string,
    @Query('status') status?: 'pending' | 'succeeded' | 'failed',
    @Query('target') target?: 'twenty.leads',
  ) {
    const parsedLimit = Number.isNaN(Number(limit)) ? undefined : Number(limit);
    const jobs = this.syncJobsService.getJobs({
      limit: parsedLimit,
      status,
      target,
    });

    return {
      total: jobs.length,
      jobs,
    };
  }

  @Get(':id')
  getJob(@Param('id') id: string) {
    const job = this.syncJobsService.getJobById(id);

    if (!job) {
      throw new NotFoundException(`Sync job ${id} was not found`);
    }

    return job;
  }
}
