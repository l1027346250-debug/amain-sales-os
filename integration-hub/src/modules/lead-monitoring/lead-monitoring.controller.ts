import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { LeadMonitoringService } from 'src/modules/lead-monitoring/lead-monitoring.service';

@Controller('lead-monitoring')
export class LeadMonitoringController {
  constructor(
    private readonly leadMonitoringService: LeadMonitoringService,
  ) {}

  @Get('first-response')
  async getFirstResponseOverview(@Query('refresh') refresh?: string) {
    if (refresh === 'true') {
      await this.leadMonitoringService.sweepOverdueFirstResponses();
    }

    return this.leadMonitoringService.getFirstResponseOverview();
  }

  @Get('first-response/reminders')
  async getFirstResponseReminderQueue(
    @Query('refresh') refresh?: string,
    @Query('level')
    level?: 'owner_reminder' | 'manager_escalation' | 'unassigned_overdue',
    @Query('limit') limit?: string,
  ) {
    if (refresh === 'true') {
      await this.leadMonitoringService.sweepOverdueFirstResponses();
    }

    const parsedLimit = Number.isNaN(Number(limit)) ? 20 : Number(limit);

    return this.leadMonitoringService.getFirstResponseReminderQueue({
      level,
      limit: parsedLimit,
    });
  }

  @Get('first-response/tasks/prepared')
  async getPreparedFirstResponseTasks(@Query('refresh') refresh?: string) {
    if (refresh === 'true') {
      await this.leadMonitoringService.sweepOverdueFirstResponses();
    }

    const overview = this.leadMonitoringService.getFirstResponseOverview();

    return {
      summary: overview.summary,
      preparedTaskRequests: overview.preparedTaskRequests,
    };
  }

  @Get('first-response/tasks/applied')
  async getAppliedFirstResponseTasks(@Query('refresh') refresh?: string) {
    if (refresh === 'true') {
      await this.leadMonitoringService.sweepOverdueFirstResponses();
    }

    return {
      summary: this.leadMonitoringService.getSummary(),
      appliedTaskRecords: this.leadMonitoringService.getAppliedTaskRecords(),
    };
  }

  @Get('lead-created-automation')
  getLeadCreatedAutomationRecords(@Query('limit') limit?: string) {
    const parsedLimit = Number.isNaN(Number(limit)) ? 20 : Number(limit);

    return {
      summary: this.leadMonitoringService.getSummary(),
      records: this.leadMonitoringService.getLeadCreatedAutomationRecords(
        parsedLimit,
      ),
    };
  }

  @Get('first-response/tasks/applied/:id')
  async getAppliedFirstResponseTaskRecord(@Param('id') id: string) {
    const record = this.leadMonitoringService.getAppliedTaskRecordById(id);

    if (!record) {
      throw new NotFoundException(
        `No applied first response task record found for ${id}`,
      );
    }

    return record;
  }

  @Get('first-response/leads/:leadId')
  async getFirstResponseLeadStatus(
    @Param('leadId') leadId: string,
    @Query('refresh') refresh?: string,
  ) {
    if (refresh === 'true') {
      await this.leadMonitoringService.sweepOverdueFirstResponses();
    }

    const result = this.leadMonitoringService.getFirstResponseLeadStatus(leadId);

    if (!result) {
      throw new NotFoundException(
        `No first response monitoring data found for lead ${leadId}`,
      );
    }

    return result;
  }

  @Post('first-response/tasks/:leadId/apply')
  async applyPreparedFirstResponseTask(
    @Param('leadId') leadId: string,
    @Query('apply') apply?: string,
  ) {
    const result =
      await this.leadMonitoringService.applyPreparedFirstResponseTaskRequest(
        leadId,
        {
          apply: apply === 'true',
        },
      );

    if (!result) {
      throw new NotFoundException(
        `No prepared first response task request found for lead ${leadId}`,
      );
    }

    return result;
  }
}
