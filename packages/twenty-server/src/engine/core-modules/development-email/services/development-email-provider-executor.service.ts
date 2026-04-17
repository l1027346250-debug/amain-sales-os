import { Injectable } from '@nestjs/common';

import { randomUUID } from 'crypto';
import { ConnectedAccountProvider } from 'twenty-shared/types';

import { ConnectedAccountDataAccessService } from 'src/engine/metadata-modules/connected-account/data-access/services/connected-account-data-access.service';
import { DevelopmentEmailAudienceEntity } from 'src/engine/core-modules/development-email/entities/development-email-audience.entity';
import { DevelopmentEmailCampaignEntity } from 'src/engine/core-modules/development-email/entities/development-email-campaign.entity';
import { DevelopmentEmailSendTaskEntity } from 'src/engine/core-modules/development-email/entities/development-email-send-task.entity';
import { DevelopmentEmailTemplateEntity } from 'src/engine/core-modules/development-email/entities/development-email-template.entity';
import { SmtpClientProvider } from 'src/modules/messaging/message-import-manager/drivers/smtp/providers/smtp-client.provider';
import { MessagingMessageOutboundService } from 'src/modules/messaging/message-outbound-manager/services/messaging-message-outbound.service';

export class DevelopmentEmailExecutionFallbackError extends Error {}

@Injectable()
export class DevelopmentEmailProviderExecutorService {
  constructor(
    private readonly connectedAccountDataAccessService: ConnectedAccountDataAccessService,
    private readonly smtpClientProvider: SmtpClientProvider,
    private readonly messagingMessageOutboundService: MessagingMessageOutboundService,
  ) {}

  async executePreparedTask({
    workspaceId,
    preparedTask,
    audience,
    campaign,
    template,
  }: {
    workspaceId: string;
    preparedTask: DevelopmentEmailSendTaskEntity;
    audience: DevelopmentEmailAudienceEntity;
    campaign: DevelopmentEmailCampaignEntity | null;
    template: DevelopmentEmailTemplateEntity;
  }): Promise<{
    executionMode: string;
    provider: string;
    providerMessageId: string;
    senderHandle: string;
  }> {
    if (!preparedTask.connectedAccountId) {
      throw new Error('Sender account assignment is missing.');
    }

    const connectedAccount =
      await this.connectedAccountDataAccessService.findOne(workspaceId, {
        where: {
          id: preparedTask.connectedAccountId,
        },
      });

    if (!connectedAccount) {
      throw new Error(
        'Connected account for development email task was not found.',
      );
    }

    if (!connectedAccount.handle) {
      throw new Error('Connected account handle is missing.');
    }

    if (
      connectedAccount.provider === ConnectedAccountProvider.IMAP_SMTP_CALDAV
    ) {
      const smtpClient =
        await this.smtpClientProvider.getSmtpClient(connectedAccount);
      const sendResult = await smtpClient.sendMail({
        from: connectedAccount.handle,
        to: audience.displayName
          ? `"${audience.displayName}" <${audience.email}>`
          : audience.email,
        subject: template.subject,
        html: template.bodyHtml,
        text:
          template.bodyText ??
          template.bodyHtml
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim(),
        headers: {
          'X-Workspace-Id': workspaceId,
          'X-Campaign-Id': campaign?.id ?? '',
          'X-Send-Job-Id': preparedTask.sendJobId ?? '',
          'X-Send-Task-Id': preparedTask.id,
        },
      });

      return {
        executionMode: 'smtp-live',
        provider: connectedAccount.provider,
        providerMessageId:
          sendResult.messageId ?? `dev-email-live-${randomUUID()}`,
        senderHandle: connectedAccount.handle,
      };
    }

    if (
      connectedAccount.provider === ConnectedAccountProvider.GOOGLE ||
      connectedAccount.provider === ConnectedAccountProvider.MICROSOFT
    ) {
      const sendResult = await this.messagingMessageOutboundService.sendMessage(
        {
          body: template.bodyText ?? template.bodyHtml,
          subject: template.subject,
          to: audience.email,
          html: template.bodyHtml,
        },
        connectedAccount,
      );

      return {
        executionMode:
          connectedAccount.provider === ConnectedAccountProvider.GOOGLE
            ? 'gmail-live'
            : 'microsoft-live',
        provider: connectedAccount.provider,
        providerMessageId:
          sendResult.providerMessageId ?? `dev-email-live-${randomUUID()}`,
        senderHandle: connectedAccount.handle,
      };
    }

    throw new DevelopmentEmailExecutionFallbackError(
      `Live development email execution is not yet supported for provider ${connectedAccount.provider}.`,
    );
  }
}
