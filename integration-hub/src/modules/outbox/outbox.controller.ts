import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { OutboxService } from 'src/modules/outbox/outbox.service';
import { OutboxEvent } from 'src/modules/outbox/types/outbox-event.type';

@Controller('outbox')
export class OutboxController {
  constructor(private readonly outboxService: OutboxService) {}

  @Post('ack')
  async acknowledgeBatch(
    @Body()
    body: {
      ids?: string[];
      consumerName?: string;
      ackedBy?: string;
    },
  ) {
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((value) => typeof value === 'string')
      : [];

    return this.outboxService.markProcessedBatch(ids, {
      consumerName:
        typeof body?.consumerName === 'string' ? body.consumerName : null,
      ackedBy: typeof body?.ackedBy === 'string' ? body.ackedBy : null,
    });
  }

  @Get('consume')
  consumeEvents(
    @Query('limit') limit?: string,
    @Query('aggregateType') aggregateType?: OutboxEvent['aggregateType'],
    @Query('eventType') eventType?: string,
    @Query('consumerName') consumerName?: string,
    @Query('since') since?: string,
  ) {
    const parsedLimit = Number.isNaN(Number(limit)) ? undefined : Number(limit);

    return this.outboxService.getConsumerBatch({
      limit: parsedLimit,
      aggregateType,
      eventType,
      consumerName,
      since,
    });
  }

  @Get('events')
  getEvents(
    @Query('limit') limit?: string,
    @Query('aggregateType') aggregateType?: OutboxEvent['aggregateType'],
    @Query('eventType') eventType?: string,
    @Query('status') status?: OutboxEvent['status'],
    @Query('consumerName') consumerName?: string,
    @Query('since') since?: string,
  ) {
    const parsedLimit = Number.isNaN(Number(limit)) ? undefined : Number(limit);
    const events = this.outboxService.getEvents({
      limit: parsedLimit,
      aggregateType,
      eventType,
      status,
      consumerName,
      since,
    });

    return {
      total: events.length,
      events,
    };
  }

  @Get('events/:id')
  getEvent(@Param('id') id: string) {
    const event = this.outboxService.getEventById(id);

    if (!event) {
      throw new NotFoundException(`Outbox event ${id} was not found`);
    }

    return event;
  }

  @Post('events/:id/ack')
  async acknowledgeEvent(
    @Param('id') id: string,
    @Body()
    body?: {
      consumerName?: string;
      ackedBy?: string;
    },
  ) {
    const event = await this.outboxService.markProcessed(id, {
      consumerName:
        typeof body?.consumerName === 'string' ? body.consumerName : null,
      ackedBy: typeof body?.ackedBy === 'string' ? body.ackedBy : null,
    });

    if (!event) {
      throw new NotFoundException(`Outbox event ${id} was not found`);
    }

    return event;
  }
}
