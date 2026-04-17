import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  Post,
  Req,
  type RawBodyRequest,
  UseGuards,
} from '@nestjs/common';

import { DevelopmentEmailService } from 'src/engine/core-modules/development-email/services/development-email.service';
import { verifyDevelopmentEmailResendWebhookSignature } from 'src/engine/core-modules/development-email/utils/development-email-resend-webhook-signature.util';
import { normalizeDevelopmentEmailProviderCallback } from 'src/engine/core-modules/development-email/utils/normalize-development-email-provider-callback.util';
import { verifyDevelopmentEmailWebhookSignature } from 'src/engine/core-modules/development-email/utils/development-email-webhook-signature.util';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

const getDevelopmentEmailWebhookSecret = () =>
  process.env.DEVELOPMENT_EMAIL_WEBHOOK_SECRET ??
  process.env.DEVELOPMENT_EMAIL_TRACKING_SECRET ??
  process.env.APP_SECRET ??
  process.env.AUTH_SECRET ??
  'development-email-webhook-secret';

@Controller('development-email/webhook')
export class DevelopmentEmailProviderWebhookController {
  constructor(
    private readonly developmentEmailService: DevelopmentEmailService,
  ) {}

  @Post('provider')
  @HttpCode(202)
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  async recordProviderEvent(
    @Headers('x-development-email-webhook-secret') providedSecret: string,
    @Headers('x-development-email-provider-format') providerFormat: string,
    @Headers('x-development-email-webhook-timestamp')
    providedTimestamp: string,
    @Headers('x-development-email-webhook-signature')
    providedSignature: string,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() rawInput: Record<string, unknown>,
  ) {
    const input = normalizeDevelopmentEmailProviderCallback({
      providerFormat,
      payload: rawInput,
    });
    const normalizedProviderFormat = providerFormat?.toLowerCase() ?? 'unified';
    const rawPayload = req.rawBody?.toString('utf8') ?? '';
    const isSecretValid = providedSecret === getDevelopmentEmailWebhookSecret();
    const isTimestampFresh =
      Number.isFinite(new Date(providedTimestamp).getTime()) &&
      Math.abs(Date.now() - new Date(providedTimestamp).getTime()) <=
        6 * 60 * 60 * 1000;
    const isSignatureValid =
      !!providedTimestamp &&
      !!providedSignature &&
      isTimestampFresh &&
      verifyDevelopmentEmailWebhookSignature({
        input,
        timestamp: providedTimestamp,
        signature: providedSignature,
      });
    const isResendSignatureValid =
      normalizedProviderFormat === 'resend' &&
      rawPayload.length > 0 &&
      verifyDevelopmentEmailResendWebhookSignature({
        payload: rawPayload,
        svixId,
        svixTimestamp,
        svixSignature,
      });

    if (!isSecretValid && !isSignatureValid && !isResendSignatureValid) {
      throw new ForbiddenException(
        'Invalid development email webhook credentials or signature',
      );
    }

    if (!input.workspaceId || !input.email || !input.eventType) {
      throw new BadRequestException(
        'workspaceId, email, and eventType are required for provider callbacks',
      );
    }

    return this.developmentEmailService.recordProviderCallbackEvent(input);
  }
}
