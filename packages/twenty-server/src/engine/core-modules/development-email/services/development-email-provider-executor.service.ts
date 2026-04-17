import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { randomUUID } from 'crypto';
import { ConnectedAccountProvider } from 'twenty-shared/types';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { DevelopmentEmailAudienceEntity } from 'src/engine/core-modules/development-email/entities/development-email-audience.entity';
import { DevelopmentEmailCampaignEntity } from 'src/engine/core-modules/development-email/entities/development-email-campaign.entity';
import { DevelopmentEmailSendTaskEntity } from 'src/engine/core-modules/development-email/entities/development-email-send-task.entity';
import { DevelopmentEmailTemplateEntity } from 'src/engine/core-modules/development-email/entities/development-email-template.entity';
import { ConnectedAccountEntity } from 'src/engine/metadata-modules/connected-account/entities/connected-account.entity';
import { type ConnectedAccountWorkspaceEntity } from 'src/modules/connected-account/standard-objects/connected-account.workspace-entity';
import { SmtpClientProvider } from 'src/modules/messaging/message-import-manager/drivers/smtp/providers/smtp-client.provider';
import { MessagingMessageOutboundService } from 'src/modules/messaging/message-outbound-manager/services/messaging-message-outbound.service';

export class DevelopmentEmailExecutionFallbackError extends Error {}

@Injectable()
export class DevelopmentEmailProviderExecutorService {
  constructor(
    @InjectRepository(ConnectedAccountEntity)
    private readonly connectedAccountRepository: Repository<ConnectedAccountEntity>,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly smtpClientProvider: SmtpClientProvider,
    private readonly messagingMessageOutboundService: MessagingMessageOutboundService,
  ) {}

  private buildTrackingHeaders({
    workspaceId,
    campaign,
    preparedTask,
  }: {
    workspaceId: string;
    campaign: DevelopmentEmailCampaignEntity | null;
    preparedTask: DevelopmentEmailSendTaskEntity;
  }): Record<string, string> {
    return {
      'X-Workspace-Id': workspaceId,
      'X-Campaign-Id': campaign?.id ?? '',
      'X-Send-Job-Id': preparedTask.sendJobId ?? '',
      'X-Send-Task-Id': preparedTask.id,
    };
  }

  private buildPlainTextBody(template: DevelopmentEmailTemplateEntity): string {
    return (
      template.bodyText ??
      template.bodyHtml
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  private canExecuteLiveDelivery(
    connectedAccount: ConnectedAccountEntity,
  ): boolean {
    switch (connectedAccount.provider) {
      case ConnectedAccountProvider.GOOGLE:
        return Boolean(connectedAccount.refreshToken);
      case ConnectedAccountProvider.MICROSOFT:
        return Boolean(connectedAccount.accessToken);
      case ConnectedAccountProvider.IMAP_SMTP_CALDAV: {
        const smtpSettings = connectedAccount.connectionParameters?.SMTP;

        return Boolean(
          smtpSettings &&
            typeof smtpSettings === 'object' &&
            'host' in smtpSettings &&
            'port' in smtpSettings &&
            'password' in smtpSettings &&
            smtpSettings.host &&
            smtpSettings.port &&
            smtpSettings.password,
        );
      }
      default:
        return false;
    }
  }

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
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async (): Promise<{
        executionMode: string;
        provider: string;
        providerMessageId: string;
        senderHandle: string;
      }> => {
        if (!preparedTask.connectedAccountId) {
          throw new Error('Sender account assignment is missing.');
        }

        const connectedAccount = await this.connectedAccountRepository.findOne({
          where: {
            id: preparedTask.connectedAccountId,
            workspaceId,
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

        if (!this.canExecuteLiveDelivery(connectedAccount)) {
          throw new DevelopmentEmailExecutionFallbackError(
            `Connected account ${connectedAccount.id} is not ready for live development email delivery.`,
          );
        }

        const outboundConnectedAccount = {
          provider: connectedAccount.provider,
          handle: connectedAccount.handle,
          accessToken: connectedAccount.accessToken,
          refreshToken: connectedAccount.refreshToken,
          connectionParameters: connectedAccount.connectionParameters,
        } as Pick<
          ConnectedAccountWorkspaceEntity,
          | 'provider'
          | 'handle'
          | 'accessToken'
          | 'refreshToken'
          | 'connectionParameters'
        > as ConnectedAccountWorkspaceEntity;
        const senderHandle = connectedAccount.handle;
        const plainTextBody = this.buildPlainTextBody(template);
        const trackingHeaders = this.buildTrackingHeaders({
          workspaceId,
          campaign,
          preparedTask,
        });
        const sendMessageInput = {
          body: plainTextBody,
          subject: template.subject,
          to: audience.email,
          html: template.bodyHtml,
          headers: trackingHeaders,
        };

        if (
          connectedAccount.provider ===
          ConnectedAccountProvider.IMAP_SMTP_CALDAV
        ) {
          const smtpClient =
            await this.smtpClientProvider.getSmtpClient(outboundConnectedAccount);
          const sendResult = (await smtpClient.sendMail({
            from: senderHandle,
            to: audience.displayName
              ? `"${audience.displayName}" <${audience.email}>`
              : audience.email,
            subject: template.subject,
            html: template.bodyHtml,
            text: plainTextBody,
            headers: trackingHeaders,
          })) as {
            messageId?: string | null;
          };

          return {
            executionMode: 'smtp-live',
            provider: connectedAccount.provider,
            providerMessageId:
              sendResult.messageId ?? `dev-email-live-${randomUUID()}`,
            senderHandle,
          };
        }

        if (
          connectedAccount.provider === ConnectedAccountProvider.GOOGLE ||
          connectedAccount.provider === ConnectedAccountProvider.MICROSOFT
        ) {
          const sendResult =
            await this.messagingMessageOutboundService.sendMessage(
              sendMessageInput,
              outboundConnectedAccount,
            );

          return {
            executionMode:
              connectedAccount.provider === ConnectedAccountProvider.GOOGLE
                ? 'gmail-live'
                : 'microsoft-live',
            provider: connectedAccount.provider,
            providerMessageId:
              sendResult.providerMessageId ?? `dev-email-live-${randomUUID()}`,
            senderHandle,
          };
        }

        throw new DevelopmentEmailExecutionFallbackError(
          `Live development email execution is not yet supported for provider ${connectedAccount.provider}.`,
        );
      },
      authContext,
    );
  }
}
