import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { OutboxModule } from 'src/modules/outbox/outbox.module';
import { TwentyClientModule } from 'src/modules/twenty-client/twenty-client.module';
import { TwentyWebhookEventsService } from 'src/modules/webhooks/twenty/twenty-webhook-events.service';
import { TwentyWebhookController } from 'src/modules/webhooks/twenty/twenty-webhook.controller';
import { TwentyWebhookRoutingService } from 'src/modules/webhooks/twenty/twenty-webhook-routing.service';
import { TwentyWebhookService } from 'src/modules/webhooks/twenty/twenty-webhook.service';

@Module({
  imports: [ConfigModule, TwentyClientModule, OutboxModule],
  controllers: [TwentyWebhookController],
  providers: [
    TwentyWebhookRoutingService,
    TwentyWebhookService,
    TwentyWebhookEventsService,
  ],
  exports: [TwentyWebhookEventsService],
})
export class TwentyWebhookModule {}
