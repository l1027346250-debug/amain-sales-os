import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import {
  ConnectedAccountProvider,
  MessageChannelSyncStatus,
} from 'twenty-shared/types';

import { DevelopmentEmailAudienceEntity } from 'src/engine/core-modules/development-email/entities/development-email-audience.entity';
import { DevelopmentEmailBounceEventEntity } from 'src/engine/core-modules/development-email/entities/development-email-bounce-event.entity';
import { DevelopmentEmailCampaignEntity } from 'src/engine/core-modules/development-email/entities/development-email-campaign.entity';
import { DevelopmentEmailTemplateEntity } from 'src/engine/core-modules/development-email/entities/development-email-template.entity';
import { DevelopmentEmailUnsubscribeEntity } from 'src/engine/core-modules/development-email/entities/development-email-unsubscribe.entity';
import { ConnectedAccountEntity } from 'src/engine/metadata-modules/connected-account/entities/connected-account.entity';
import { type DevelopmentEmailWorkspaceDTO } from 'src/engine/core-modules/messaging/dtos/development-email-workspace.dto';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type MessageChannelWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-channel.workspace-entity';

@Injectable()
export class DevelopmentEmailWorkspaceService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    @InjectRepository(DevelopmentEmailAudienceEntity)
    private readonly developmentEmailAudienceRepository: Repository<DevelopmentEmailAudienceEntity>,
    @InjectRepository(DevelopmentEmailTemplateEntity)
    private readonly developmentEmailTemplateRepository: Repository<DevelopmentEmailTemplateEntity>,
    @InjectRepository(DevelopmentEmailCampaignEntity)
    private readonly developmentEmailCampaignRepository: Repository<DevelopmentEmailCampaignEntity>,
    @InjectRepository(DevelopmentEmailBounceEventEntity)
    private readonly developmentEmailBounceEventRepository: Repository<DevelopmentEmailBounceEventEntity>,
    @InjectRepository(DevelopmentEmailUnsubscribeEntity)
    private readonly developmentEmailUnsubscribeRepository: Repository<DevelopmentEmailUnsubscribeEntity>,
    @InjectRepository(ConnectedAccountEntity)
    private readonly connectedAccountRepository: Repository<ConnectedAccountEntity>,
  ) {}

  private canExecuteDevelopmentEmailFromConnectedAccount(
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

  private getConnectedAccountReadinessReason(
    connectedAccount: ConnectedAccountEntity,
  ): { code: string; message: string } {
    switch (connectedAccount.provider) {
      case ConnectedAccountProvider.GOOGLE:
        return connectedAccount.refreshToken
          ? {
              code: 'ready_google_refresh_token',
              message: 'Refresh token present',
            }
          : {
              code: 'missing_google_refresh_token',
              message: 'Missing Google refresh token',
            };
      case ConnectedAccountProvider.MICROSOFT:
        return connectedAccount.accessToken
          ? {
              code: 'ready_microsoft_access_token',
              message: 'Access token present',
            }
          : {
              code: 'missing_microsoft_access_token',
              message: 'Missing Microsoft access token',
            };
      case ConnectedAccountProvider.IMAP_SMTP_CALDAV: {
        const smtpSettings = connectedAccount.connectionParameters?.SMTP;

        if (!smtpSettings || typeof smtpSettings !== 'object') {
          return {
            code: 'missing_smtp_settings',
            message: 'Missing SMTP settings',
          };
        }

        if (!('host' in smtpSettings) || !smtpSettings.host) {
          return {
            code: 'missing_smtp_host',
            message: 'Missing SMTP host',
          };
        }

        if (!('port' in smtpSettings) || !smtpSettings.port) {
          return {
            code: 'missing_smtp_port',
            message: 'Missing SMTP port',
          };
        }

        if (!('password' in smtpSettings) || !smtpSettings.password) {
          return {
            code: 'missing_smtp_password',
            message: 'Missing SMTP password',
          };
        }

        return {
          code: 'ready_smtp_credentials',
          message: 'SMTP settings present',
        };
      }
      default:
        return {
          code: 'unsupported_provider_live_delivery',
          message: `Provider ${connectedAccount.provider} is not supported for live delivery`,
        };
    }
  }

  async getWorkspace(
    workspaceId: string,
  ): Promise<DevelopmentEmailWorkspaceDTO> {
    const authContext = buildSystemAuthContext(workspaceId);

    const [
      audienceCount,
      templateCount,
      scheduledCampaignCount,
      bounceAndComplaintCount,
      unsubscribeCount,
      latestCampaigns,
    ] = await Promise.all([
      this.developmentEmailAudienceRepository.count({
        where: { workspaceId },
      }),
      this.developmentEmailTemplateRepository.count({
        where: { workspaceId },
      }),
      this.developmentEmailCampaignRepository.count({
        where: { workspaceId, status: 'scheduled' },
      }),
      this.developmentEmailBounceEventRepository.count({
        where: { workspaceId },
      }),
      this.developmentEmailUnsubscribeRepository.count({
        where: { workspaceId },
      }),
      this.developmentEmailCampaignRepository.find({
        where: { workspaceId },
        order: { createdAt: 'DESC' },
        take: 3,
      }),
    ]);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const messageChannelRepository =
          await this.globalWorkspaceOrmManager.getRepository<MessageChannelWorkspaceEntity>(
            workspaceId,
            'messageChannel',
          );

        const [connectedAccounts, messageChannels] = await Promise.all([
          this.connectedAccountRepository.find({
            where: { workspaceId },
            select: {
              id: true,
              handle: true,
              provider: true,
              accessToken: true,
              refreshToken: true,
              authFailedAt: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
          messageChannelRepository.find({
            select: {
              id: true,
              handle: true,
              syncStatus: true,
              throttleFailureCount: true,
            },
          }),
        ]);
        const connectedAccountCount = connectedAccounts.length;
        const executableConnectedAccountCount = connectedAccounts.filter(
          (connectedAccount) =>
            this.canExecuteDevelopmentEmailFromConnectedAccount(
              connectedAccount,
            ),
        ).length;
        const skippedConnectedAccountCount =
          connectedAccountCount - executableConnectedAccountCount;
        const senderPoolMode =
          executableConnectedAccountCount > 0 ? 'live-capable' : 'fallback-only';

        const healthyChannelCount = messageChannels.filter(
          (messageChannel) =>
            messageChannel.syncStatus === MessageChannelSyncStatus.ACTIVE,
        ).length;

        const blockedChannelCount = messageChannels.filter(
          (messageChannel) =>
            messageChannel.syncStatus !== null &&
            messageChannel.syncStatus !== MessageChannelSyncStatus.ACTIVE,
        ).length;

        const senderPoolHandles = messageChannels
          .map((messageChannel) => messageChannel.handle)
          .filter((handle): handle is string => !!handle)
          .slice(0, 3);
        const senderHealthListItems = connectedAccounts
          .slice()
          .sort((leftAccount, rightAccount) =>
            leftAccount.handle.localeCompare(rightAccount.handle),
          )
          .slice(0, 3)
          .map((connectedAccount) => {
            const isExecutable =
              this.canExecuteDevelopmentEmailFromConnectedAccount(
                connectedAccount,
              );
            const readinessReason =
              this.getConnectedAccountReadinessReason(connectedAccount);

            return {
              id: `sender-health-${connectedAccount.id}`,
              primary: connectedAccount.handle,
              secondary: `Provider ${connectedAccount.provider}`,
              tertiary: `${readinessReason.code} · ${readinessReason.message}`,
              meta: connectedAccount.authFailedAt
                ? `auth failed ${connectedAccount.authFailedAt.toISOString()}`
                : connectedAccount.updatedAt
                  ? `updated ${connectedAccount.updatedAt.toISOString()}`
                  : `created ${connectedAccount.createdAt.toISOString()}`,
              status: isExecutable ? 'live-ready' : 'needs-credentials',
            };
          });

        return {
          metrics: [
            {
              label: 'Audience records',
              value: `${audienceCount}`,
              description:
                'Persistent development-email audience records already created for this workspace.',
            },
            {
              label: 'Template library',
              value: `${templateCount}`,
              description:
                'Reusable development-email templates currently stored in core tables.',
            },
            {
              label: 'Scheduled campaigns',
              value: `${scheduledCampaignCount}`,
              description:
                'Campaigns already marked scheduled before send-job orchestration is wired in.',
            },
            {
              label: 'Sender pool',
              value: `${connectedAccountCount}`,
              description:
                'Connected inbox accounts currently available for development-email expansion.',
            },
            {
              label: 'Sender pool mode',
              value: senderPoolMode,
              description:
                'Whether the workspace currently has at least one connected mailbox that is ready for live delivery.',
            },
            {
              label: 'Executable senders',
              value: `${executableConnectedAccountCount}`,
              description:
                'Connected accounts with the credentials or SMTP settings required for live development-email delivery.',
            },
            {
              label: 'Skipped senders',
              value: `${skippedConnectedAccountCount}`,
              description:
                'Connected accounts excluded from live delivery because credentials or SMTP settings are incomplete.',
            },
            {
              label: 'Healthy sender channels',
              value: `${healthyChannelCount}/${messageChannels.length}`,
              description:
                'Message channels already in a healthy sync state and suitable for sender-pool governance.',
            },
            {
              label: 'Compliance events',
              value: `${bounceAndComplaintCount + unsubscribeCount}`,
              description:
                'Bounce, complaint, and unsubscribe events already captured in the feedback loop.',
            },
          ],
          listItems:
            latestCampaigns.length > 0
              ? [
                  ...latestCampaigns.map((campaign) => ({
                    id: campaign.id,
                    primary: campaign.name,
                    secondary: `Campaign · ${campaign.status}`,
                    tertiary:
                      campaign.templateId !== null
                        ? `Template linked: ${campaign.templateId}`
                        : 'No template linked yet.',
                    meta: campaign.scheduledAt
                      ? `scheduled · ${campaign.scheduledAt.toISOString()}`
                      : 'draft · waiting for scheduling',
                    status: campaign.status,
                  })),
                  ...senderHealthListItems,
                ]
              : [
                  {
                    id: randomUUID(),
                    primary: 'Sender pool bootstrap',
                    secondary: `Seed from ${connectedAccountCount} connected inbox account(s)`,
                    tertiary:
                      senderPoolHandles.length > 0
                        ? `Current candidate handles: ${senderPoolHandles.join(', ')}`
                        : 'No connected sender handles are available yet.',
                    meta: 'workspace-backed · mailbox core reuse',
                  status:
                      healthyChannelCount > 0 ? 'ready-to-model' : 'blocked',
                  },
                  {
                    id: randomUUID(),
                    primary: `Sender pool ${senderPoolMode}`,
                    secondary: `Executable ${executableConnectedAccountCount} · skipped ${skippedConnectedAccountCount}`,
                    tertiary:
                      senderPoolMode === 'fallback-only'
                        ? 'Current workspace can still run internal simulation, but no connected mailbox is ready for live delivery.'
                        : 'At least one connected mailbox is ready for live development-email routing.',
                    meta: `connected accounts ${connectedAccountCount} · healthy channels ${healthyChannelCount}`,
                    status:
                      senderPoolMode === 'fallback-only'
                        ? 'fallback-only'
                        : 'live-capable',
                  },
                  ...senderHealthListItems,
                  {
                    id: randomUUID(),
                    primary: 'Campaign blueprint skeleton',
                    secondary:
                      'Audience, template, campaign, send-job, and send-task model',
                    tertiary:
                      'The first backend slice formalizes audience, template, campaign, send-job, and send-task entities before queue execution is wired in.',
                    meta: 'service seed · next build target',
                    status: 'planned',
                  },
                  {
                    id: randomUUID(),
                    primary: 'Compliance watch',
                    secondary:
                      'Unsubscribe, suppression, bounce, and complaint loop',
                    tertiary:
                      'Outbound infrastructure must enforce unsubscribe and suppression from day one so later queue work does not need a risky retrofit.',
                    meta: 'guardrail · mandatory before send',
                    status:
                      blockedChannelCount > 0
                        ? 'attention-needed'
                        : 'in-design',
                  },
                ],
        };
      },
      authContext,
    );
  }
}
