import {
  Injectable,
  Logger,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { verifyHmacSha256Signature } from 'src/common/security/signature-verifier.util';
import { TwentyWebhookDto } from 'src/modules/webhooks/twenty/dto/twenty-webhook.dto';
import { TwentyClientService } from 'src/modules/twenty-client/twenty-client.service';
import { TwentyWebhookEventsService } from 'src/modules/webhooks/twenty/twenty-webhook-events.service';
import { TwentyWebhookRoutingService } from 'src/modules/webhooks/twenty/twenty-webhook-routing.service';

@Injectable()
export class TwentyWebhookService {
  private readonly logger = new Logger(TwentyWebhookService.name);

  constructor(
    private readonly twentyClientService: TwentyClientService,
    private readonly twentyWebhookRoutingService: TwentyWebhookRoutingService,
    private readonly twentyWebhookEventsService: TwentyWebhookEventsService,
    private readonly configService: ConfigService,
  ) {}

  async handleWebhook(payload: TwentyWebhookDto, signature?: string) {
    let signatureValidation;

    try {
      signatureValidation = verifyHmacSha256Signature({
        payload,
        providedSignature: signature,
        secret:
          this.configService.get<string>('TWENTY_WEBHOOK_SECRET') ?? 'replace-me',
      });
    } catch (error) {
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'Invalid signature',
      );
    }

    const accepted = await this.twentyClientService.acknowledgeWebhook({
      event: payload.event,
      objectName: payload.objectName ?? null,
      data: payload.data,
      signature: signature ?? null,
    });

    try {
      const routing = await this.twentyWebhookRoutingService.routeEvent(payload);

      return {
        status: 'accepted',
        signatureValidation,
        routing,
        accepted,
      };
    } catch (error) {
      const failedLog =
        await this.twentyWebhookEventsService.recordFailedEvent(
          payload,
          this.twentyWebhookRoutingService.resolveHandlerName(payload.event),
          error instanceof Error
            ? error.message
            : 'Unhandled webhook routing failure',
        );

      this.logger.error(
        `Failed to route Twenty webhook ${payload.event}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );

      if (
        error instanceof UnauthorizedException ||
        error instanceof UnprocessableEntityException
      ) {
        throw error;
      }

      throw new UnprocessableEntityException({
        message:
          error instanceof Error
            ? error.message
            : 'Unhandled webhook routing failure',
        eventLogId: failedLog.id,
      });
    }
  }
}
