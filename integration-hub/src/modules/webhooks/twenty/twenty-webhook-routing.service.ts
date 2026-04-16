import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';

import { OutboxService } from 'src/modules/outbox/outbox.service';
import { TwentyWebhookDto } from 'src/modules/webhooks/twenty/dto/twenty-webhook.dto';
import { TwentyWebhookRoutingResult } from 'src/modules/webhooks/twenty/types/twenty-webhook-routing-result.type';
import { TwentyWebhookEventsService } from 'src/modules/webhooks/twenty/twenty-webhook-events.service';

@Injectable()
export class TwentyWebhookRoutingService {
  private readonly logger = new Logger(TwentyWebhookRoutingService.name);

  constructor(
    private readonly outboxService: OutboxService,
    private readonly twentyWebhookEventsService: TwentyWebhookEventsService,
  ) {}

  async routeEvent(payload: TwentyWebhookDto): Promise<TwentyWebhookRoutingResult> {
    switch (payload.event) {
      case 'lead.created':
        return this.handleLeadCreated(payload);
      case 'lead.updated':
        return this.handleLeadUpdated(payload);
      case 'opportunity.updated':
        return this.handleOpportunityUpdated(payload);
      default: {
        const log = await this.twentyWebhookEventsService.recordIgnoredEvent(
          payload,
          'Event is not handled in phase 1 integration-hub scope',
        );

        this.logger.log(`Ignored Twenty webhook event ${payload.event}`);

        return {
          status: 'ignored',
          handler: log.handler,
          summary: log.summary,
          eventLogId: log.id,
          outboxEventId: null,
          downstreamAction: null,
        };
      }
    }
  }

  resolveHandlerName(event: string) {
    switch (event) {
      case 'lead.created':
      case 'lead.updated':
      case 'opportunity.updated':
        return event;
      default:
        return 'routing_failed';
    }
  }

  private async handleLeadCreated(payload: TwentyWebhookDto) {
    const leadId = this.requireRecordId(payload.data, payload.event);
    const log = await this.twentyWebhookEventsService.recordProcessedEvent(
      payload,
      'lead.created',
      `Lead ${leadId} created in Twenty and ready for downstream enrichment`,
    );
    const outboxEvent = await this.outboxService.recordEvent({
      source: 'twenty-webhook',
      eventType: 'lead.created',
      aggregateType: 'lead',
      aggregateId: leadId,
      payload: {
        event: payload.event,
        objectName: payload.objectName ?? null,
        data: payload.data,
        eventLogId: log.id,
        downstreamAction: 'enrichment_pending',
      },
    });

    this.logger.log(`Processed lead.created for lead ${leadId}`);

    return {
      status: 'processed' as const,
      handler: log.handler,
      summary: log.summary,
      eventLogId: log.id,
      outboxEventId: outboxEvent.id,
      downstreamAction: 'enrichment_pending',
    };
  }

  private async handleLeadUpdated(payload: TwentyWebhookDto) {
    const leadId = this.requireRecordId(payload.data, payload.event);
    const log = await this.twentyWebhookEventsService.recordProcessedEvent(
      payload,
      'lead.updated',
      `Lead ${leadId} updated in Twenty and ready for sync diff evaluation`,
    );
    const outboxEvent = await this.outboxService.recordEvent({
      source: 'twenty-webhook',
      eventType: 'lead.updated',
      aggregateType: 'lead',
      aggregateId: leadId,
      payload: {
        event: payload.event,
        objectName: payload.objectName ?? null,
        data: payload.data,
        eventLogId: log.id,
        downstreamAction: 'sync_diff_pending',
      },
    });

    this.logger.log(`Processed lead.updated for lead ${leadId}`);

    return {
      status: 'processed' as const,
      handler: log.handler,
      summary: log.summary,
      eventLogId: log.id,
      outboxEventId: outboxEvent.id,
      downstreamAction: 'sync_diff_pending',
    };
  }

  private async handleOpportunityUpdated(payload: TwentyWebhookDto) {
    const opportunityId = this.requireRecordId(payload.data, payload.event);
    const log = await this.twentyWebhookEventsService.recordProcessedEvent(
      payload,
      'opportunity.updated',
      `Opportunity ${opportunityId} updated in Twenty and ready for ERP handoff evaluation`,
    );
    const outboxEvent = await this.outboxService.recordEvent({
      source: 'twenty-webhook',
      eventType: 'opportunity.updated',
      aggregateType: 'opportunity',
      aggregateId: opportunityId,
      payload: {
        event: payload.event,
        objectName: payload.objectName ?? null,
        data: payload.data,
        eventLogId: log.id,
        downstreamAction: 'erp_handoff_evaluation_pending',
      },
    });

    this.logger.log(`Processed opportunity.updated for opportunity ${opportunityId}`);

    return {
      status: 'processed' as const,
      handler: log.handler,
      summary: log.summary,
      eventLogId: log.id,
      outboxEventId: outboxEvent.id,
      downstreamAction: 'erp_handoff_evaluation_pending',
    };
  }

  private requireRecordId(data: Record<string, unknown>, event: string) {
    const recordId = typeof data.id === 'string' ? data.id : null;

    if (!recordId) {
      throw new UnprocessableEntityException(
        `Webhook event ${event} is missing a string data.id`,
      );
    }

    return recordId;
  }
}
