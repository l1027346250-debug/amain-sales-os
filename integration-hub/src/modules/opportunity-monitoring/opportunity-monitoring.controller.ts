import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { OpportunityMonitoringService } from 'src/modules/opportunity-monitoring/opportunity-monitoring.service';

@Controller('opportunity-monitoring')
export class OpportunityMonitoringController {
  constructor(
    private readonly opportunityMonitoringService: OpportunityMonitoringService,
  ) {}

  @Get('quote-follow-up')
  async getQuoteFollowUpOverview(@Query('refresh') refresh?: string) {
    if (refresh === 'true') {
      await this.opportunityMonitoringService.sweepQuotationFollowUpOpportunities();
    }

    return this.opportunityMonitoringService.getQuoteFollowUpOverview();
  }

  @Get('quote-follow-up/reminders')
  async getQuoteFollowUpReminderQueue(
    @Query('refresh') refresh?: string,
    @Query('assigneeState') assigneeState?: 'assigned' | 'unassigned',
    @Query('limit') limit?: string,
  ) {
    if (refresh === 'true') {
      await this.opportunityMonitoringService.sweepQuotationFollowUpOpportunities();
    }

    const parsedLimit = Number.isNaN(Number(limit)) ? 20 : Number(limit);

    return this.opportunityMonitoringService.getQuoteFollowUpReminderQueue({
      assigneeState,
      limit: parsedLimit,
    });
  }

  @Get('quote-follow-up/tasks/prepared')
  async getPreparedTasks(@Query('refresh') refresh?: string) {
    if (refresh === 'true') {
      await this.opportunityMonitoringService.sweepQuotationFollowUpOpportunities();
    }

    const overview = this.opportunityMonitoringService.getQuoteFollowUpOverview();

    return {
      summary: overview.summary,
      preparedTaskRequests: overview.preparedTaskRequests,
    };
  }

  @Get('quote-follow-up/tasks/applied')
  getAppliedTasks() {
    return {
      summary: this.opportunityMonitoringService.getQuoteFollowUpSummary(),
      appliedTaskRecords:
        this.opportunityMonitoringService.getAppliedQuoteFollowUpTaskRecords(),
    };
  }

  @Get('quote-follow-up/tasks/applied/:id')
  getAppliedTaskRecord(@Param('id') id: string) {
    const record =
      this.opportunityMonitoringService.getAppliedQuoteFollowUpTaskRecordById(
        id,
      );

    if (!record) {
      throw new NotFoundException(
        `No applied quotation follow-up task record found for ${id}`,
      );
    }

    return record;
  }

  @Get('quote-follow-up/opportunities/:opportunityId')
  async getOpportunityStatus(
    @Param('opportunityId') opportunityId: string,
    @Query('refresh') refresh?: string,
  ) {
    if (refresh === 'true') {
      await this.opportunityMonitoringService.sweepQuotationFollowUpOpportunities();
    }

    const result =
      this.opportunityMonitoringService.getQuoteFollowUpOpportunityStatus(
        opportunityId,
      );

    if (!result) {
      throw new NotFoundException(
        `No quotation follow-up monitoring data found for opportunity ${opportunityId}`,
      );
    }

    return result;
  }

  @Get('stalled')
  async getStalledOverview(@Query('refresh') refresh?: string) {
    if (refresh === 'true') {
      await this.opportunityMonitoringService.sweepStalledOpportunities();
    }

    return this.opportunityMonitoringService.getStalledOverview();
  }

  @Get('stalled/reminders')
  async getStalledReminderQueue(
    @Query('refresh') refresh?: string,
    @Query('assigneeState') assigneeState?: 'assigned' | 'unassigned',
    @Query('limit') limit?: string,
  ) {
    if (refresh === 'true') {
      await this.opportunityMonitoringService.sweepStalledOpportunities();
    }

    const parsedLimit = Number.isNaN(Number(limit)) ? 20 : Number(limit);

    return this.opportunityMonitoringService.getStalledReminderQueue({
      assigneeState,
      limit: parsedLimit,
    });
  }

  @Get('stalled/tasks/prepared')
  async getPreparedStalledTasks(@Query('refresh') refresh?: string) {
    if (refresh === 'true') {
      await this.opportunityMonitoringService.sweepStalledOpportunities();
    }

    const overview = this.opportunityMonitoringService.getStalledOverview();

    return {
      summary: overview.summary,
      preparedTaskRequests: overview.preparedTaskRequests,
    };
  }

  @Get('stalled/tasks/applied')
  getAppliedStalledTasks() {
    return {
      summary: this.opportunityMonitoringService.getStalledSummary(),
      appliedTaskRecords:
        this.opportunityMonitoringService.getAppliedStalledTaskRecords(),
    };
  }

  @Get('stalled/tasks/applied/:id')
  getAppliedStalledTaskRecord(@Param('id') id: string) {
    const record =
      this.opportunityMonitoringService.getAppliedStalledTaskRecordById(id);

    if (!record) {
      throw new NotFoundException(
        `No applied stalled opportunity task record found for ${id}`,
      );
    }

    return record;
  }

  @Get('stalled/opportunities/:opportunityId')
  async getStalledOpportunityStatus(
    @Param('opportunityId') opportunityId: string,
    @Query('refresh') refresh?: string,
  ) {
    if (refresh === 'true') {
      await this.opportunityMonitoringService.sweepStalledOpportunities();
    }

    const result =
      this.opportunityMonitoringService.getStalledOpportunityStatus(
        opportunityId,
      );

    if (!result) {
      throw new NotFoundException(
        `No stalled opportunity monitoring data found for opportunity ${opportunityId}`,
      );
    }

    return result;
  }

  @Post('quote-follow-up/tasks/:opportunityId/apply')
  async applyPreparedTask(
    @Param('opportunityId') opportunityId: string,
    @Query('apply') apply?: string,
  ) {
    const result =
      await this.opportunityMonitoringService.applyPreparedQuoteFollowUpTaskRequest(
        opportunityId,
        {
          apply: apply === 'true',
        },
      );

    if (!result) {
      throw new NotFoundException(
        `No prepared quotation follow-up task request found for opportunity ${opportunityId}`,
      );
    }

    return result;
  }

  @Post('stalled/tasks/:opportunityId/apply')
  async applyPreparedStalledTask(
    @Param('opportunityId') opportunityId: string,
    @Query('apply') apply?: string,
  ) {
    const result =
      await this.opportunityMonitoringService.applyPreparedStalledTaskRequest(
        opportunityId,
        {
          apply: apply === 'true',
        },
      );

    if (!result) {
      throw new NotFoundException(
        `No prepared stalled task request found for opportunity ${opportunityId}`,
      );
    }

    return result;
  }
}
