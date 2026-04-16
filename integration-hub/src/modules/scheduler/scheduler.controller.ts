import { Controller, Get, Post, Query } from '@nestjs/common';

import { SchedulerService } from 'src/modules/scheduler/scheduler.service';

@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Get('status')
  getStatus() {
    return this.schedulerService.getStatus();
  }

  @Post('retry-sweep')
  async runRetrySweep(@Query('force') force?: string) {
    return this.schedulerService.runRetrySweepOnce({
      force: force === 'true',
    });
  }

  @Post('health-check')
  async runHealthCheck() {
    return this.schedulerService.runSyncHealthCheckOnce();
  }
}
