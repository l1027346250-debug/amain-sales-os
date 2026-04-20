import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';

import { Response } from 'express';

import { DevelopmentEmailService } from 'src/engine/core-modules/development-email/services/development-email.service';
import { verifyDevelopmentEmailTrackingSignature } from 'src/engine/core-modules/development-email/utils/development-email-tracking-signature.util';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

const TRACKING_PIXEL_BUFFER = Buffer.from(
  'R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
  'base64',
);

@Controller('development-email/track')
export class DevelopmentEmailTrackingController {
  constructor(
    private readonly developmentEmailService: DevelopmentEmailService,
  ) {}

  @Get('open')
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  async trackOpen(
    @Query('workspaceId') workspaceId: string,
    @Query('email') email: string,
    @Query('campaignId') campaignId: string | undefined,
    @Query('sendJobId') sendJobId: string | undefined,
    @Query('sendTaskId') sendTaskId: string | undefined,
    @Query('provider') provider: string | undefined,
    @Query('expiresAt') expiresAt: string | undefined,
    @Query('sig') signature: string | undefined,
    @Res() res: Response,
  ) {
    const isSignatureValid =
      workspaceId &&
      email &&
      expiresAt &&
      signature &&
      new Date(expiresAt).getTime() > Date.now() &&
      verifyDevelopmentEmailTrackingSignature(
        {
          workspaceId,
          email,
          eventType: 'opened',
          campaignId,
          sendJobId,
          sendTaskId,
          provider,
          expiresAt,
        },
        signature,
      );

    if (isSignatureValid) {
      await this.developmentEmailService.recordPublicTrackingEvent({
        workspaceId,
        email,
        eventType: 'opened',
        campaignId,
        sendJobId,
        sendTaskId,
        provider,
      });
    }

    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.send(TRACKING_PIXEL_BUFFER);
  }

  @Get('click')
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  async trackClick(
    @Query('workspaceId') workspaceId: string,
    @Query('email') email: string,
    @Query('targetUrl') targetUrl: string,
    @Query('campaignId') campaignId: string | undefined,
    @Query('sendJobId') sendJobId: string | undefined,
    @Query('sendTaskId') sendTaskId: string | undefined,
    @Query('provider') provider: string | undefined,
    @Query('expiresAt') expiresAt: string | undefined,
    @Query('sig') signature: string | undefined,
    @Res() res: Response,
  ) {
    const isSignatureValid =
      workspaceId &&
      email &&
      expiresAt &&
      signature &&
      new Date(expiresAt).getTime() > Date.now() &&
      verifyDevelopmentEmailTrackingSignature(
        {
          workspaceId,
          email,
          eventType: 'clicked',
          campaignId,
          sendJobId,
          sendTaskId,
          provider,
          targetUrl,
          expiresAt,
        },
        signature,
      );

    if (isSignatureValid) {
      await this.developmentEmailService.recordPublicTrackingEvent({
        workspaceId,
        email,
        eventType: 'clicked',
        campaignId,
        sendJobId,
        sendTaskId,
        provider,
        metadata: {
          targetUrl,
        },
      });
    }

    const safeTargetUrl =
      isSignatureValid &&
      (targetUrl?.startsWith('http://') || targetUrl?.startsWith('https://'))
        ? targetUrl
        : 'about:blank';

    return res.redirect(safeTargetUrl);
  }
}
