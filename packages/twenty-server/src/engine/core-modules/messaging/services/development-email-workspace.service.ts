import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { MessageChannelSyncStatus } from 'twenty-shared/types';

import { DevelopmentEmailAudienceEntity } from 'src/engine/core-modules/development-email/entities/development-email-audience.entity';
import { DevelopmentEmailBounceEventEntity } from 'src/engine/core-modules/development-email/entities/development-email-bounce-event.entity';
import { DevelopmentEmailCampaignEntity } from 'src/engine/core-modules/development-email/entities/development-email-campaign.entity';
import { DevelopmentEmailTemplateEntity } from 'src/engine/core-modules/development-email/entities/development-email-template.entity';
import { DevelopmentEmailUnsubscribeEntity } from 'src/engine/core-modules/development-email/entities/development-email-unsubscribe.entity';
import { type DevelopmentEmailWorkspaceDTO } from 'src/engine/core-modules/messaging/dtos/development-email-workspace.dto';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type ConnectedAccountWorkspaceEntity } from 'src/modules/connected-account/standard-objects/connected-account.workspace-entity';
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
  ) {}

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
        const connectedAccountRepository =
          await this.globalWorkspaceOrmManager.getRepository<ConnectedAccountWorkspaceEntity>(
            workspaceId,
            'connectedAccount',
          );

        const messageChannelRepository =
          await this.globalWorkspaceOrmManager.getRepository<MessageChannelWorkspaceEntity>(
            workspaceId,
            'messageChannel',
          );

        const [connectedAccountCount, messageChannels] = await Promise.all([
          connectedAccountRepository.count(),
          messageChannelRepository.find({
            select: {
              id: true,
              handle: true,
              syncStatus: true,
              throttleFailureCount: true,
            },
          }),
        ]);

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
              ? latestCampaigns.map((campaign) => ({
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
                }))
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
