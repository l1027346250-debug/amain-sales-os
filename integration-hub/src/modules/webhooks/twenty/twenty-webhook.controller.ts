import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { TwentyWebhookDto } from 'src/modules/webhooks/twenty/dto/twenty-webhook.dto';
import { TwentyWebhookEventsService } from 'src/modules/webhooks/twenty/twenty-webhook-events.service';
import { TwentyWebhookService } from 'src/modules/webhooks/twenty/twenty-webhook.service';

@Controller('webhooks/twenty')
export class TwentyWebhookController {
  constructor(
    private readonly twentyWebhookService: TwentyWebhookService,
    private readonly twentyWebhookEventsService: TwentyWebhookEventsService,
  ) {}

  @Get('events')
  getEvents(
    @Query('limit') limit?: string,
    @Query('status') status?: 'processed' | 'ignored' | 'failed',
    @Query('event') event?: string,
  ) {
    const parsedLimit = Number.isNaN(Number(limit)) ? undefined : Number(limit);
    const events = this.twentyWebhookEventsService.getLogs({
      limit: parsedLimit,
      status,
      event,
    });

    return {
      total: events.length,
      events,
    };
  }

  @Get('events/:id')
  getEvent(@Param('id') id: string) {
    const eventLog = this.twentyWebhookEventsService.getLogById(id);

    if (!eventLog) {
      throw new NotFoundException(`Webhook event ${id} was not found`);
    }

    return eventLog;
  }

  @Post()
  async receive(
    @Body() payload: TwentyWebhookDto,
    @Headers('x-twenty-signature') signature?: string,
  ) {
    return this.twentyWebhookService.handleWebhook(payload, signature);
  }
}
