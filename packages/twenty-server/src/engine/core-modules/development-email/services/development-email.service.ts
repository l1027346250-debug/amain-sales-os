import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { In, Repository } from 'typeorm';
import { ConnectedAccountProvider } from 'twenty-shared/types';

import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { type CreateDevelopmentEmailAudienceInput } from 'src/engine/core-modules/development-email/dtos/create-development-email-audience.input';
import { type CreateDevelopmentEmailCampaignInput } from 'src/engine/core-modules/development-email/dtos/create-development-email-campaign.input';
import { type CreateDevelopmentEmailTemplateInput } from 'src/engine/core-modules/development-email/dtos/create-development-email-template.input';
import { type DevelopmentEmailAnalyticsDTO } from 'src/engine/core-modules/development-email/dtos/development-email-analytics.dto';
import { type DevelopmentEmailReportExportDTO } from 'src/engine/core-modules/development-email/dtos/development-email-report-export.dto';
import { type ExecuteDevelopmentEmailSendJobInput } from 'src/engine/core-modules/development-email/dtos/execute-development-email-send-job.input';
import { type DevelopmentEmailSendJobSummaryDTO } from 'src/engine/core-modules/development-email/dtos/development-email-send-job-summary.dto';
import { type GenerateDevelopmentEmailTrackingLinksInput } from 'src/engine/core-modules/development-email/dtos/generate-development-email-tracking-links.input';
import { type DevelopmentEmailReportDTO } from 'src/engine/core-modules/development-email/dtos/development-email-report.dto';
import { type DevelopmentEmailTrackingLinksDTO } from 'src/engine/core-modules/development-email/dtos/development-email-tracking-links.dto';
import { type QueueDevelopmentEmailCampaignInput } from 'src/engine/core-modules/development-email/dtos/queue-development-email-campaign.input';
import { type RecordDevelopmentEmailBounceEventInput } from 'src/engine/core-modules/development-email/dtos/record-development-email-bounce-event.input';
import { type RecordDevelopmentEmailEventInput } from 'src/engine/core-modules/development-email/dtos/record-development-email-event.input';
import { type RecordDevelopmentEmailProviderCallbackInput } from 'src/engine/core-modules/development-email/dtos/record-development-email-provider-callback.input';
import { type RecordDevelopmentEmailUnsubscribeInput } from 'src/engine/core-modules/development-email/dtos/record-development-email-unsubscribe.input';
import { type StartDevelopmentEmailSendJobInput } from 'src/engine/core-modules/development-email/dtos/start-development-email-send-job.input';
import { DevelopmentEmailAudienceEntity } from 'src/engine/core-modules/development-email/entities/development-email-audience.entity';
import { DevelopmentEmailBounceEventEntity } from 'src/engine/core-modules/development-email/entities/development-email-bounce-event.entity';
import { DevelopmentEmailCampaignEntity } from 'src/engine/core-modules/development-email/entities/development-email-campaign.entity';
import { DevelopmentEmailEventEntity } from 'src/engine/core-modules/development-email/entities/development-email-event.entity';
import { DevelopmentEmailSendJobEntity } from 'src/engine/core-modules/development-email/entities/development-email-send-job.entity';
import { DevelopmentEmailSendTaskEntity } from 'src/engine/core-modules/development-email/entities/development-email-send-task.entity';
import { DevelopmentEmailTemplateEntity } from 'src/engine/core-modules/development-email/entities/development-email-template.entity';
import { DevelopmentEmailUnsubscribeEntity } from 'src/engine/core-modules/development-email/entities/development-email-unsubscribe.entity';
import { ConnectedAccountEntity } from 'src/engine/metadata-modules/connected-account/entities/connected-account.entity';
import { signDevelopmentEmailTrackingPayload } from 'src/engine/core-modules/development-email/utils/development-email-tracking-signature.util';
import {
  DevelopmentEmailExecutionFallbackError,
  DevelopmentEmailProviderExecutorService,
} from 'src/engine/core-modules/development-email/services/development-email-provider-executor.service';

@Injectable()
export class DevelopmentEmailService {
  constructor(
    @InjectRepository(DevelopmentEmailAudienceEntity)
    private readonly developmentEmailAudienceRepository: Repository<DevelopmentEmailAudienceEntity>,
    @InjectRepository(DevelopmentEmailTemplateEntity)
    private readonly developmentEmailTemplateRepository: Repository<DevelopmentEmailTemplateEntity>,
    @InjectRepository(DevelopmentEmailCampaignEntity)
    private readonly developmentEmailCampaignRepository: Repository<DevelopmentEmailCampaignEntity>,
    @InjectRepository(DevelopmentEmailSendJobEntity)
    private readonly developmentEmailSendJobRepository: Repository<DevelopmentEmailSendJobEntity>,
    @InjectRepository(DevelopmentEmailSendTaskEntity)
    private readonly developmentEmailSendTaskRepository: Repository<DevelopmentEmailSendTaskEntity>,
    @InjectRepository(DevelopmentEmailBounceEventEntity)
    private readonly developmentEmailBounceEventRepository: Repository<DevelopmentEmailBounceEventEntity>,
    @InjectRepository(DevelopmentEmailUnsubscribeEntity)
    private readonly developmentEmailUnsubscribeRepository: Repository<DevelopmentEmailUnsubscribeEntity>,
    @InjectRepository(DevelopmentEmailEventEntity)
    private readonly developmentEmailEventRepository: Repository<DevelopmentEmailEventEntity>,
    @InjectRepository(ConnectedAccountEntity)
    private readonly connectedAccountRepository: Repository<ConnectedAccountEntity>,
    private readonly developmentEmailProviderExecutorService: DevelopmentEmailProviderExecutorService,
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

  private async findAudienceByEmailOrId({
    workspaceId,
    audienceId,
    email,
  }: {
    workspaceId: string;
    audienceId?: string | null;
    email: string;
  }): Promise<DevelopmentEmailAudienceEntity | null> {
    if (audienceId) {
      return this.developmentEmailAudienceRepository.findOneBy({
        workspaceId,
        id: audienceId,
      });
    }

    return this.developmentEmailAudienceRepository.findOneBy({
      workspaceId,
      email,
    });
  }

  private async updateAudienceSubscriptionStatus(
    audienceId: string | undefined,
    subscriptionStatus: string,
  ): Promise<void> {
    if (!audienceId) {
      return;
    }

    await this.developmentEmailAudienceRepository.update(audienceId, {
      subscriptionStatus,
    });
  }

  private async updateSendTaskCallbackSnapshot({
    workspaceId,
    sendTaskId,
    eventType,
    provider,
    providerMessageId,
    occurredAt,
    metadata,
  }: {
    workspaceId: string;
    sendTaskId?: string | null;
    eventType: string;
    provider?: string | null;
    providerMessageId?: string | null;
    occurredAt: Date;
    metadata?: Record<string, unknown> | null;
  }): Promise<void> {
    if (!sendTaskId) {
      return;
    }

    const sendTask = await this.developmentEmailSendTaskRepository.findOneBy({
      workspaceId,
      id: sendTaskId,
    });

    if (!sendTask) {
      return;
    }

    const nextTaskStatus =
      eventType === 'delivered'
        ? 'delivered'
        : eventType === 'hard_bounce' || eventType === 'soft_bounce'
          ? 'bounced'
          : eventType === 'complaint'
            ? 'complained'
            : eventType === 'unsubscribed'
              ? 'unsubscribed'
              : eventType === 'replied'
                ? 'replied'
                : eventType === 'clicked'
                  ? 'clicked'
                  : eventType === 'opened'
                    ? 'opened'
                    : eventType === 'sent'
                      ? 'sent'
                      : sendTask.status;

    await this.developmentEmailSendTaskRepository.update(sendTask.id, {
      status: nextTaskStatus,
      ...((providerMessageId ?? sendTask.providerMessageId)
        ? {
            providerMessageId:
              providerMessageId ?? sendTask.providerMessageId ?? undefined,
          }
        : {}),
      trackingSnapshot: {
        ...(sendTask.trackingSnapshot ?? {}),
        lastCallbackType: eventType,
        ...(provider ? { lastCallbackProvider: provider } : {}),
        lastCallbackAt: occurredAt.toISOString(),
        statusFromCallback: nextTaskStatus,
        ...(metadata ?? {}),
      },
    });
  }

  private async refreshSendJobAggregateSummary({
    workspaceId,
    sendJobId,
    callbackOccurredAt,
  }: {
    workspaceId: string;
    sendJobId?: string | null;
    callbackOccurredAt: Date;
  }): Promise<void> {
    if (!sendJobId) {
      return;
    }

    const sendJob = await this.developmentEmailSendJobRepository.findOneBy({
      workspaceId,
      id: sendJobId,
    });

    if (!sendJob) {
      return;
    }

    const sendTasks = await this.developmentEmailSendTaskRepository.find({
      where: {
        workspaceId,
        sendJobId,
      },
      take: 5000,
    });

    const deliveredCount = sendTasks.filter(
      (sendTask) => sendTask.status === 'delivered',
    ).length;
    const openedCount = sendTasks.filter(
      (sendTask) => sendTask.status === 'opened',
    ).length;
    const clickedCount = sendTasks.filter(
      (sendTask) => sendTask.status === 'clicked',
    ).length;
    const repliedCount = sendTasks.filter(
      (sendTask) => sendTask.status === 'replied',
    ).length;
    const bouncedCount = sendTasks.filter(
      (sendTask) => sendTask.status === 'bounced',
    ).length;
    const complainedCount = sendTasks.filter(
      (sendTask) => sendTask.status === 'complained',
    ).length;
    const unsubscribedCount = sendTasks.filter(
      (sendTask) => sendTask.status === 'unsubscribed',
    ).length;
    const sendFailureCount = sendTasks.filter(
      (sendTask) => sendTask.status === 'failed',
    ).length;
    const sentCount = sendTasks.filter((sendTask) =>
      [
        'sent',
        'delivered',
        'opened',
        'clicked',
        'replied',
        'bounced',
        'complained',
        'unsubscribed',
      ].includes(sendTask.status),
    ).length;
    const failedCount =
      sendFailureCount + bouncedCount + complainedCount + unsubscribedCount;

    await this.developmentEmailSendJobRepository.update(sendJob.id, {
      status:
        failedCount > 0 && sendJob.status === 'completed'
          ? 'completed_with_failures'
          : sendJob.status,
      sentCount,
      failedCount,
      executionSummary: {
        ...(sendJob.executionSummary ?? {}),
        deliveredCount,
        openedCount,
        clickedCount,
        repliedCount,
        bouncedCount,
        complainedCount,
        unsubscribedCount,
        sendFailureCount,
        lastCallbackAt: callbackOccurredAt.toISOString(),
      },
    });

    if (sendJob.campaignId && failedCount > 0) {
      await this.developmentEmailCampaignRepository.update(sendJob.campaignId, {
        status: 'completed_with_failures',
      });
    }
  }

  async getAudiences(
    workspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailAudienceEntity[]> {
    return this.developmentEmailAudienceRepository.find({
      where: { workspaceId: workspace.id },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async createAudience(
    workspace: WorkspaceEntity,
    input: CreateDevelopmentEmailAudienceInput,
  ): Promise<DevelopmentEmailAudienceEntity> {
    const existingAudience =
      await this.developmentEmailAudienceRepository.findOneBy({
        workspaceId: workspace.id,
        email: input.email,
      });

    if (existingAudience) {
      throw new Error('Development email audience already exists');
    }

    return this.developmentEmailAudienceRepository.save({
      workspaceId: workspace.id,
      email: input.email,
      displayName: input.displayName,
      companyId: input.companyId ?? null,
      personId: input.personId ?? null,
      source: input.source ?? 'crm',
      tags: input.tags ?? [],
      subscriptionStatus: 'subscribed',
      metadata: null,
    });
  }

  async getTemplates(
    workspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailTemplateEntity[]> {
    return this.developmentEmailTemplateRepository.find({
      where: { workspaceId: workspace.id },
      order: { updatedAt: 'DESC' },
      take: 50,
    });
  }

  async createTemplate(
    workspace: WorkspaceEntity,
    input: CreateDevelopmentEmailTemplateInput,
  ): Promise<DevelopmentEmailTemplateEntity> {
    return this.developmentEmailTemplateRepository.save({
      workspaceId: workspace.id,
      name: input.name,
      subject: input.subject,
      bodyHtml: input.bodyHtml,
      bodyText: input.bodyText ?? null,
      status: 'draft',
      version: 1,
      variableSchema: null,
    });
  }

  async getCampaigns(
    workspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailCampaignEntity[]> {
    return this.developmentEmailCampaignRepository.find({
      where: { workspaceId: workspace.id },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async createCampaign(
    workspace: WorkspaceEntity,
    input: CreateDevelopmentEmailCampaignInput,
  ): Promise<DevelopmentEmailCampaignEntity> {
    return this.developmentEmailCampaignRepository.save({
      workspaceId: workspace.id,
      name: input.name,
      templateId: input.templateId ?? null,
      status: input.scheduledAt ? 'scheduled' : 'draft',
      scheduledAt: input.scheduledAt ?? null,
      startedAt: null,
      completedAt: null,
      audienceFilter: null,
      sendingPolicy: null,
    });
  }

  async getSendJobs(
    workspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailSendJobEntity[]> {
    return this.developmentEmailSendJobRepository.find({
      where: { workspaceId: workspace.id },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getSendJobSummary(
    workspace: WorkspaceEntity,
    sendJobId: string,
  ): Promise<DevelopmentEmailSendJobSummaryDTO> {
    const sendJob = await this.developmentEmailSendJobRepository.findOneBy({
      workspaceId: workspace.id,
      id: sendJobId,
    });

    if (!sendJob) {
      throw new Error('Development email send job was not found');
    }

    const executionSummary = (sendJob.executionSummary ?? {}) as Record<
      string,
      unknown
    >;
    const lastCallbackAt =
      typeof executionSummary.lastCallbackAt === 'string'
        ? executionSummary.lastCallbackAt
        : null;
    const senderPoolMode =
      typeof executionSummary.senderPoolMode === 'string'
        ? executionSummary.senderPoolMode
        : 'not recorded';
    const executableSenderPoolSize = Number(
      executionSummary.executableSenderPoolSize ??
        executionSummary.senderPoolSize ??
        0,
    );
    const skippedSenderPoolSize = Number(
      executionSummary.skippedSenderPoolSize ?? 0,
    );

    return {
      metrics: [
        {
          label: 'Execution mode',
          value: `${executionSummary.executionMode ?? 'not recorded'}`,
          description:
            'Current delivery path for this send job: smtp-live, gmail-live, microsoft-live, or fallback.',
        },
        {
          label: 'Queued',
          value: `${sendJob.queuedCount}`,
          description: 'Tasks initially created for this send job.',
        },
        {
          label: 'Sent lifecycle',
          value: `${sendJob.sentCount}`,
          description:
            'Tasks that entered the sent/delivered/replied lifecycle.',
        },
        {
          label: 'Failure lifecycle',
          value: `${sendJob.failedCount}`,
          description:
            'Tasks that failed, bounced, complained, or unsubscribed.',
        },
        {
          label: 'Delivered',
          value: `${executionSummary.deliveredCount ?? 0}`,
          description: 'Callbacks that confirmed provider delivery.',
        },
        {
          label: 'Opened',
          value: `${executionSummary.openedCount ?? 0}`,
          description: 'Open tracking callbacks matched to this send job.',
        },
        {
          label: 'Clicked',
          value: `${executionSummary.clickedCount ?? 0}`,
          description: 'Click tracking callbacks matched to this send job.',
        },
        {
          label: 'Replied',
          value: `${executionSummary.repliedCount ?? 0}`,
          description: 'Reply callbacks matched to this send job.',
        },
        {
          label: 'Bounce and complaint',
          value: `${Number(executionSummary.bouncedCount ?? 0) + Number(executionSummary.complainedCount ?? 0)}`,
          description: 'Combined negative delivery feedback for this send job.',
        },
        {
          label: 'Sender pool mode',
          value: senderPoolMode,
          description:
            'Whether execution used live-capable mailboxes or simulation-only fallback routing.',
        },
        {
          label: 'Executable senders',
          value: `${executableSenderPoolSize}`,
          description: 'Connected accounts ready for live delivery.',
        },
        {
          label: 'Skipped senders',
          value: `${skippedSenderPoolSize}`,
          description:
            'Connected accounts excluded from live delivery because credentials or SMTP settings were incomplete.',
        },
      ],
      listItems: [
        {
          id: `${sendJob.id}-status`,
          primary: `Job ${sendJob.id.slice(0, 8)}`,
          secondary:
            sendJob.campaignId !== null
              ? `Campaign ${sendJob.campaignId.slice(0, 8)}`
              : 'No campaign linked',
          tertiary: `Status ${sendJob.status} · started ${
            sendJob.startedAt?.toISOString?.() ?? 'not started'
          }`,
          meta: `Completed ${
            sendJob.completedAt?.toISOString?.() ?? 'not completed'
          }`,
          status: sendJob.status,
        },
        {
          id: `${sendJob.id}-delivery`,
          primary: 'Delivery health',
          secondary: `Delivered ${executionSummary.deliveredCount ?? 0} · bounced ${
            executionSummary.bouncedCount ?? 0
          }`,
          tertiary: `Complaints ${executionSummary.complainedCount ?? 0} · unsubscribes ${
            executionSummary.unsubscribedCount ?? 0
          }`,
          meta: `Last callback ${lastCallbackAt ?? 'not received'}`,
          status:
            Number(executionSummary.complainedCount ?? 0) > 0 ||
            Number(executionSummary.bouncedCount ?? 0) > 0
              ? 'Needs review'
              : 'Healthy',
        },
        {
          id: `${sendJob.id}-sender-pool`,
          primary: `Sender pool ${senderPoolMode}`,
          secondary: `Executable ${executableSenderPoolSize} · skipped ${skippedSenderPoolSize}`,
          tertiary:
            senderPoolMode === 'fallback-only'
              ? 'Runtime used internal simulation because no live-capable mailbox was available.'
              : 'Runtime assigned at least one live-capable mailbox.',
          meta: `Assigned pool ${executionSummary.senderPoolSize ?? 0}`,
          status:
            senderPoolMode === 'fallback-only' ? 'Fallback only' : 'Live ready',
        },
        {
          id: `${sendJob.id}-engagement`,
          primary: 'Engagement',
          secondary: `Opened ${executionSummary.openedCount ?? 0} · clicked ${
            executionSummary.clickedCount ?? 0
          }`,
          tertiary: `Replied ${executionSummary.repliedCount ?? 0} · send failures ${
            executionSummary.sendFailureCount ?? 0
          }`,
          meta: `Execution mode ${
            executionSummary.executionMode ?? 'not recorded'
          }`,
          status:
            Number(executionSummary.repliedCount ?? 0) > 0
              ? 'Engaged'
              : 'Pending',
        },
      ],
    };
  }

  async getSendTasks(
    workspace: WorkspaceEntity,
    sendJobId?: string,
  ): Promise<DevelopmentEmailSendTaskEntity[]> {
    return this.developmentEmailSendTaskRepository.find({
      where: {
        workspaceId: workspace.id,
        ...(sendJobId ? { sendJobId } : {}),
      },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async getAnalytics(
    workspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailAnalyticsDTO> {
    const [events, bounceCount, unsubscribeCount] = await Promise.all([
      this.developmentEmailEventRepository.find({
        where: { workspaceId: workspace.id },
        order: { occurredAt: 'DESC' },
        take: 20,
      }),
      this.developmentEmailBounceEventRepository.count({
        where: { workspaceId: workspace.id },
      }),
      this.developmentEmailUnsubscribeRepository.count({
        where: { workspaceId: workspace.id },
      }),
    ]);

    const sentCount = events.filter(
      (event) => event.eventType === 'sent',
    ).length;
    const deliveredCount = events.filter(
      (event) => event.eventType === 'delivered',
    ).length;
    const openedCount = events.filter(
      (event) => event.eventType === 'opened',
    ).length;
    const clickedCount = events.filter(
      (event) => event.eventType === 'clicked',
    ).length;
    const repliedCount = events.filter(
      (event) => event.eventType === 'replied',
    ).length;

    return {
      metrics: [
        {
          label: 'Sent events',
          value: `${sentCount}`,
          description: 'Send events emitted by the development-email executor.',
        },
        {
          label: 'Delivered events',
          value: `${deliveredCount}`,
          description:
            'Delivery confirmations currently emitted by the internal execution simulator.',
        },
        {
          label: 'Bounce and complaint events',
          value: `${bounceCount}`,
          description:
            'Feedback loop events recorded from bounce and complaint tracking.',
        },
        {
          label: 'Opened events',
          value: `${openedCount}`,
          description: 'Open tracking events recorded for development email.',
        },
        {
          label: 'Clicked events',
          value: `${clickedCount}`,
          description: 'Click tracking events recorded for development email.',
        },
        {
          label: 'Replied events',
          value: `${repliedCount}`,
          description: 'Reply events recorded for development email threads.',
        },
        {
          label: 'Unsubscribes',
          value: `${unsubscribeCount}`,
          description:
            'Unsubscribe actions captured for suppression and compliance.',
        },
      ],
      listItems: events.map((event) => ({
        id: event.id,
        primary: event.email,
        secondary: `${event.eventType} - ${event.provider ?? 'provider not set'}`,
        tertiary:
          event.providerMessageId !== null
            ? `Provider message ${event.providerMessageId}`
            : event.sendTaskId !== null
              ? `Task ${event.sendTaskId.slice(0, 8)}`
              : 'No send task linked',
        meta: `occurred ${event.occurredAt.toISOString()}`,
        status: event.eventType,
      })),
    };
  }

  async getReports(
    workspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailReportDTO> {
    const [campaigns, sendJobs, events] = await Promise.all([
      this.developmentEmailCampaignRepository.find({
        where: { workspaceId: workspace.id },
        order: { createdAt: 'DESC' },
        take: 20,
      }),
      this.developmentEmailSendJobRepository.find({
        where: { workspaceId: workspace.id },
        order: { createdAt: 'DESC' },
        take: 50,
      }),
      this.developmentEmailEventRepository.find({
        where: { workspaceId: workspace.id },
        order: { occurredAt: 'DESC' },
        take: 200,
      }),
    ]);

    const completedJobs = sendJobs.filter((sendJob) =>
      ['completed', 'completed_with_failures'].includes(sendJob.status),
    );
    const deliveredCount = events.filter(
      (event) => event.eventType === 'delivered',
    ).length;
    const clickedCount = events.filter(
      (event) => event.eventType === 'clicked',
    ).length;
    const repliedCount = events.filter(
      (event) => event.eventType === 'replied',
    ).length;

    return {
      metrics: [
        {
          label: 'Campaign exports ready',
          value: `${campaigns.length}`,
          description:
            'Campaign records currently available to feed CSV, Excel, or PDF exports.',
        },
        {
          label: 'Completed jobs',
          value: `${completedJobs.length}`,
          description:
            'Send jobs that have reached a completed terminal state and can be reported safely.',
        },
        {
          label: 'Delivered total',
          value: `${deliveredCount}`,
          description:
            'Delivered events available for report aggregation and downstream exports.',
        },
        {
          label: 'Click and reply total',
          value: `${clickedCount + repliedCount}`,
          description:
            'Combined engagement events currently available for report summaries.',
        },
      ],
      listItems: campaigns.map((campaign) => {
        const campaignJobs = sendJobs.filter(
          (sendJob) => sendJob.campaignId === campaign.id,
        );
        const campaignEvents = events.filter(
          (event) => event.campaignId === campaign.id,
        );
        const campaignDeliveredCount = campaignEvents.filter(
          (event) => event.eventType === 'delivered',
        ).length;
        const campaignClickedCount = campaignEvents.filter(
          (event) => event.eventType === 'clicked',
        ).length;
        const campaignRepliedCount = campaignEvents.filter(
          (event) => event.eventType === 'replied',
        ).length;

        return {
          id: campaign.id,
          primary: campaign.name,
          secondary: `status ${campaign.status} - jobs ${campaignJobs.length}`,
          tertiary: `delivered ${campaignDeliveredCount} - clicked ${campaignClickedCount} - replied ${campaignRepliedCount}`,
          meta: `created ${campaign.createdAt.toISOString()}`,
          status: campaign.status,
        };
      }),
    };
  }

  async getReportExport(
    workspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailReportExportDTO> {
    const report = await this.getReports(workspace);
    const header = [
      'campaignName',
      'status',
      'jobs',
      'delivered',
      'clicked',
      'replied',
      'createdAt',
    ];
    const rows = report.listItems.map((item) => {
      const tertiarySegments = item.tertiary.split(' - ');
      const delivered = tertiarySegments[0]?.replace('delivered ', '') ?? '0';
      const clicked = tertiarySegments[1]?.replace('clicked ', '') ?? '0';
      const replied = tertiarySegments[2]?.replace('replied ', '') ?? '0';
      const secondarySegments = item.secondary.split(' - ');
      const status =
        secondarySegments[0]?.replace('status ', '') ?? item.status;
      const jobs = secondarySegments[1]?.replace('jobs ', '') ?? '0';
      const createdAt = item.meta.replace('created ', '');

      return [
        item.primary,
        status,
        jobs,
        delivered,
        clicked,
        replied,
        createdAt,
      ];
    });

    const csvContent = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');

    return {
      fileName: `development-email-report-${workspace.id.slice(0, 8)}.csv`,
      csvContent,
      rowCount: rows.length,
    };
  }

  async generateTrackingLinks(
    workspace: WorkspaceEntity,
    input: GenerateDevelopmentEmailTrackingLinksInput,
  ): Promise<DevelopmentEmailTrackingLinksDTO> {
    const baseUrl = process.env.SERVER_URL ?? 'http://localhost:3000';
    const expiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24 * 7,
    ).toISOString();
    const signatureBasePayload = {
      workspaceId: workspace.id,
      email: input.email,
      campaignId: input.campaignId,
      sendJobId: input.sendJobId,
      sendTaskId: input.sendTaskId,
      provider: input.provider,
      expiresAt,
    };
    const openSignature = signDevelopmentEmailTrackingPayload({
      ...signatureBasePayload,
      eventType: 'opened',
    });
    const clickSignature = signDevelopmentEmailTrackingPayload({
      ...signatureBasePayload,
      eventType: 'clicked',
      targetUrl: input.targetUrl,
    });
    const openTrackingUrl =
      `${baseUrl}/development-email/track/open` +
      `?workspaceId=${encodeURIComponent(workspace.id)}` +
      `&email=${encodeURIComponent(input.email)}` +
      `&expiresAt=${encodeURIComponent(expiresAt)}` +
      (input.campaignId
        ? `&campaignId=${encodeURIComponent(input.campaignId)}`
        : '') +
      (input.sendJobId
        ? `&sendJobId=${encodeURIComponent(input.sendJobId)}`
        : '') +
      (input.sendTaskId
        ? `&sendTaskId=${encodeURIComponent(input.sendTaskId)}`
        : '') +
      (input.provider
        ? `&provider=${encodeURIComponent(input.provider)}`
        : '') +
      `&sig=${encodeURIComponent(openSignature)}`;
    const clickTrackingUrl =
      `${baseUrl}/development-email/track/click` +
      `?workspaceId=${encodeURIComponent(workspace.id)}` +
      `&email=${encodeURIComponent(input.email)}` +
      `&expiresAt=${encodeURIComponent(expiresAt)}` +
      `&targetUrl=${encodeURIComponent(input.targetUrl ?? 'https://example.com')}` +
      (input.campaignId
        ? `&campaignId=${encodeURIComponent(input.campaignId)}`
        : '') +
      (input.sendJobId
        ? `&sendJobId=${encodeURIComponent(input.sendJobId)}`
        : '') +
      (input.sendTaskId
        ? `&sendTaskId=${encodeURIComponent(input.sendTaskId)}`
        : '') +
      (input.provider
        ? `&provider=${encodeURIComponent(input.provider)}`
        : '') +
      `&sig=${encodeURIComponent(clickSignature)}`;

    return {
      openTrackingUrl,
      clickTrackingUrl,
      expiresAt,
    };
  }

  async recordEvent(
    workspace: WorkspaceEntity,
    input: RecordDevelopmentEmailEventInput,
  ): Promise<DevelopmentEmailEventEntity> {
    return this.developmentEmailEventRepository.save({
      workspaceId: workspace.id,
      eventType: input.eventType,
      campaignId: input.campaignId ?? null,
      sendJobId: input.sendJobId ?? null,
      sendTaskId: input.sendTaskId ?? null,
      email: input.email,
      provider: input.provider ?? null,
      providerMessageId: input.providerMessageId ?? null,
      metadata: {
        source: 'manual-or-webhook',
      },
      occurredAt: input.occurredAt ?? new Date(),
    });
  }

  async recordPublicTrackingEvent({
    workspaceId,
    email,
    eventType,
    campaignId,
    sendJobId,
    sendTaskId,
    provider,
    metadata,
  }: {
    workspaceId: string;
    email: string;
    eventType: string;
    campaignId?: string;
    sendJobId?: string;
    sendTaskId?: string;
    provider?: string;
    metadata?: Record<string, unknown>;
  }): Promise<DevelopmentEmailEventEntity> {
    return this.developmentEmailEventRepository.save({
      workspaceId,
      eventType,
      campaignId: campaignId ?? null,
      sendJobId: sendJobId ?? null,
      sendTaskId: sendTaskId ?? null,
      email,
      provider: provider ?? null,
      providerMessageId: null,
      metadata: metadata ?? null,
      occurredAt: new Date(),
    });
  }

  async recordProviderCallbackEvent(
    input: RecordDevelopmentEmailProviderCallbackInput,
  ): Promise<DevelopmentEmailEventEntity> {
    const occurredAt = input.occurredAt ?? new Date();
    const matchingAudience = await this.findAudienceByEmailOrId({
      workspaceId: input.workspaceId,
      audienceId: null,
      email: input.email,
    });

    if (
      input.eventType === 'hard_bounce' ||
      input.eventType === 'soft_bounce' ||
      input.eventType === 'complaint'
    ) {
      await this.developmentEmailBounceEventRepository.save({
        workspaceId: input.workspaceId,
        eventType: input.eventType,
        email: input.email,
        audienceId: matchingAudience?.id ?? null,
        campaignId: input.campaignId ?? null,
        sendTaskId: input.sendTaskId ?? null,
        provider: input.provider ?? null,
        reason: input.reason ?? null,
        occurredAt,
      });

      await this.updateAudienceSubscriptionStatus(
        matchingAudience?.id,
        input.eventType === 'complaint' ? 'complained' : 'bounced',
      );
    }

    if (input.eventType === 'unsubscribed') {
      await this.developmentEmailUnsubscribeRepository.save({
        workspaceId: input.workspaceId,
        email: input.email,
        audienceId: matchingAudience?.id ?? null,
        campaignId: input.campaignId ?? null,
        sendTaskId: input.sendTaskId ?? null,
        source: input.source ?? 'provider-webhook',
        reason: input.reason ?? null,
        occurredAt,
      });

      await this.updateAudienceSubscriptionStatus(
        matchingAudience?.id,
        'unsubscribed',
      );
    }

    await this.updateSendTaskCallbackSnapshot({
      workspaceId: input.workspaceId,
      sendTaskId: input.sendTaskId,
      eventType: input.eventType,
      provider: input.provider,
      providerMessageId: input.providerMessageId,
      occurredAt,
      metadata: input.metadata ?? null,
    });

    const sendTaskForAggregation = input.sendTaskId
      ? await this.developmentEmailSendTaskRepository.findOneBy({
          workspaceId: input.workspaceId,
          id: input.sendTaskId,
        })
      : null;

    await this.refreshSendJobAggregateSummary({
      workspaceId: input.workspaceId,
      sendJobId: input.sendJobId ?? sendTaskForAggregation?.sendJobId ?? null,
      callbackOccurredAt: occurredAt,
    });

    return this.developmentEmailEventRepository.save({
      workspaceId: input.workspaceId,
      eventType: input.eventType,
      campaignId: input.campaignId ?? null,
      sendJobId: input.sendJobId ?? null,
      sendTaskId: input.sendTaskId ?? null,
      email: input.email,
      provider: input.provider ?? null,
      providerMessageId: input.providerMessageId ?? null,
      metadata: {
        source: input.source ?? 'provider-webhook',
        reason: input.reason ?? null,
        targetUrl: input.targetUrl ?? null,
        ...(input.metadata ?? {}),
      },
      occurredAt,
    });
  }

  async queueCampaign(
    workspace: WorkspaceEntity,
    input: QueueDevelopmentEmailCampaignInput,
  ): Promise<DevelopmentEmailSendJobEntity> {
    const campaign = await this.developmentEmailCampaignRepository.findOneBy({
      workspaceId: workspace.id,
      id: input.campaignId,
    });

    if (!campaign) {
      throw new Error('Development email campaign was not found');
    }

    if (!campaign.templateId) {
      throw new Error('Development email campaign must link to a template');
    }

    const template = await this.developmentEmailTemplateRepository.findOneBy({
      workspaceId: workspace.id,
      id: campaign.templateId,
    });

    if (!template) {
      throw new Error('Development email template was not found');
    }

    const subscribedAudiences =
      await this.developmentEmailAudienceRepository.find({
        where: {
          workspaceId: workspace.id,
          subscriptionStatus: 'subscribed',
        },
        order: { createdAt: 'ASC' },
        take: 1000,
      });

    if (subscribedAudiences.length === 0) {
      throw new Error(
        'Development email campaign requires at least one subscribed audience',
      );
    }

    return this.developmentEmailCampaignRepository.manager.transaction(
      async (entityManager) => {
        const sendJobRepository = entityManager.getRepository(
          DevelopmentEmailSendJobEntity,
        );
        const eventRepository = entityManager.getRepository(
          DevelopmentEmailEventEntity,
        );
        const sendTaskRepository = entityManager.getRepository(
          DevelopmentEmailSendTaskEntity,
        );
        const campaignRepository = entityManager.getRepository(
          DevelopmentEmailCampaignEntity,
        );

        const sendJob = await sendJobRepository.save({
          workspaceId: workspace.id,
          campaignId: campaign.id,
          status: 'queued',
          queuedCount: subscribedAudiences.length,
          sentCount: 0,
          failedCount: 0,
          startedAt: null,
          completedAt: null,
          executionSummary: {
            audienceCount: subscribedAudiences.length,
            templateId: template.id,
            queuedAt: new Date().toISOString(),
          },
        });

        await sendTaskRepository.save(
          subscribedAudiences.map((audience) => ({
            workspaceId: workspace.id,
            sendJobId: sendJob.id,
            campaignId: campaign.id,
            audienceId: audience.id,
            templateId: template.id,
            connectedAccountId: null,
            status: 'queued',
            retryCount: 0,
            providerMessageId: null,
            lastError: null,
            scheduledAt: campaign.scheduledAt ?? new Date(),
            sentAt: null,
            trackingSnapshot: {
              audienceEmail: audience.email,
              audienceDisplayName: audience.displayName,
              templateVersion: template.version,
            },
          })),
        );

        await campaignRepository.update(campaign.id, {
          status: 'queued',
        });

        return sendJob;
      },
    );
  }

  async getBounceEvents(
    workspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailBounceEventEntity[]> {
    return this.developmentEmailBounceEventRepository.find({
      where: { workspaceId: workspace.id },
      order: { occurredAt: 'DESC' },
      take: 100,
    });
  }

  async recordBounceEvent(
    workspace: WorkspaceEntity,
    input: RecordDevelopmentEmailBounceEventInput,
  ): Promise<DevelopmentEmailBounceEventEntity> {
    const occurredAt = input.occurredAt ?? new Date();
    const bounceEvent = await this.developmentEmailBounceEventRepository.save({
      workspaceId: workspace.id,
      eventType: input.eventType,
      email: input.email,
      audienceId: input.audienceId ?? null,
      campaignId: input.campaignId ?? null,
      sendTaskId: input.sendTaskId ?? null,
      provider: input.provider ?? null,
      reason: input.reason ?? null,
      occurredAt,
    });

    await this.developmentEmailEventRepository.save({
      workspaceId: workspace.id,
      eventType: input.eventType,
      campaignId: input.campaignId ?? null,
      sendJobId: null,
      sendTaskId: input.sendTaskId ?? null,
      email: input.email,
      provider: input.provider ?? null,
      providerMessageId: null,
      metadata: {
        source: 'feedback-loop',
        reason: input.reason ?? null,
      },
      occurredAt,
    });

    const matchingAudience = await this.findAudienceByEmailOrId({
      workspaceId: workspace.id,
      audienceId: input.audienceId ?? null,
      email: input.email,
    });

    await this.updateAudienceSubscriptionStatus(
      matchingAudience?.id,
      input.eventType === 'complaint' ? 'complained' : 'bounced',
    );

    return bounceEvent;
  }

  async getUnsubscribes(
    workspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailUnsubscribeEntity[]> {
    return this.developmentEmailUnsubscribeRepository.find({
      where: { workspaceId: workspace.id },
      order: { occurredAt: 'DESC' },
      take: 100,
    });
  }

  async recordUnsubscribe(
    workspace: WorkspaceEntity,
    input: RecordDevelopmentEmailUnsubscribeInput,
  ): Promise<DevelopmentEmailUnsubscribeEntity> {
    const occurredAt = input.occurredAt ?? new Date();
    const unsubscribe = await this.developmentEmailUnsubscribeRepository.save({
      workspaceId: workspace.id,
      email: input.email,
      audienceId: input.audienceId ?? null,
      campaignId: input.campaignId ?? null,
      sendTaskId: input.sendTaskId ?? null,
      source: input.source ?? null,
      reason: input.reason ?? null,
      occurredAt,
    });

    await this.developmentEmailEventRepository.save({
      workspaceId: workspace.id,
      eventType: 'unsubscribed',
      campaignId: input.campaignId ?? null,
      sendJobId: null,
      sendTaskId: input.sendTaskId ?? null,
      email: input.email,
      provider: null,
      providerMessageId: null,
      metadata: {
        source: input.source ?? null,
        reason: input.reason ?? null,
      },
      occurredAt,
    });

    const matchingAudience = await this.findAudienceByEmailOrId({
      workspaceId: workspace.id,
      audienceId: input.audienceId ?? null,
      email: input.email,
    });

    await this.updateAudienceSubscriptionStatus(
      matchingAudience?.id,
      'unsubscribed',
    );

    return unsubscribe;
  }

  async startSendJob(
    workspace: WorkspaceEntity,
    input: StartDevelopmentEmailSendJobInput,
  ): Promise<DevelopmentEmailSendJobEntity> {
    const sendJob = await this.developmentEmailSendJobRepository.findOneBy({
      workspaceId: workspace.id,
      id: input.sendJobId,
    });

    if (!sendJob) {
      throw new Error('Development email send job was not found');
    }

    const queuedTasks = await this.developmentEmailSendTaskRepository.find({
      where: {
        workspaceId: workspace.id,
        sendJobId: sendJob.id,
        status: 'queued',
      },
      order: { createdAt: 'ASC' },
      take: 1000,
    });

    if (queuedTasks.length === 0) {
      throw new Error('Development email send job has no queued tasks');
    }

    const connectedAccounts = await this.connectedAccountRepository.find({
      where: { workspaceId: workspace.id },
      order: { createdAt: 'ASC' },
      take: 50,
    });

    const executableConnectedAccounts = connectedAccounts.filter((account) =>
      this.canExecuteDevelopmentEmailFromConnectedAccount(account),
    );
    const assignedConnectedAccounts =
      executableConnectedAccounts.length > 0
        ? executableConnectedAccounts
        : connectedAccounts;

    return this.developmentEmailSendJobRepository.manager.transaction(
      async (entityManager) => {
        const sendJobRepository = entityManager.getRepository(
          DevelopmentEmailSendJobEntity,
        );
        const sendTaskRepository = entityManager.getRepository(
          DevelopmentEmailSendTaskEntity,
        );

        await Promise.all(
          queuedTasks.map((sendTask, index) => {
            const connectedAccount =
              assignedConnectedAccounts[index % assignedConnectedAccounts.length];

            return sendTaskRepository.update(sendTask.id, {
              connectedAccountId: connectedAccount.id,
              status: 'prepared',
              lastError: null,
              trackingSnapshot: {
                ...(sendTask.trackingSnapshot ?? {}),
                senderHandle: connectedAccount.handle,
                senderProvider: connectedAccount.provider,
                preparedAt: new Date().toISOString(),
              },
            });
          }),
        );

        await sendJobRepository.update(sendJob.id, {
          status: 'processing',
          startedAt: sendJob.startedAt ?? new Date(),
          executionSummary: {
            ...(sendJob.executionSummary ?? {}),
            preparedTaskCount: queuedTasks.length,
            senderPoolSize: assignedConnectedAccounts.length,
            executableSenderPoolSize: executableConnectedAccounts.length,
            skippedSenderPoolSize:
              connectedAccounts.length - executableConnectedAccounts.length,
            senderPoolMode:
              executableConnectedAccounts.length > 0
                ? 'live-capable'
                : 'fallback-only',
            startedAt: new Date().toISOString(),
          },
        });

        const startedSendJob = await sendJobRepository.findOneByOrFail({
          workspaceId: workspace.id,
          id: sendJob.id,
        });

        return startedSendJob;
      },
    );
  }

  async executeSendJob(
    workspace: WorkspaceEntity,
    input: ExecuteDevelopmentEmailSendJobInput,
  ): Promise<DevelopmentEmailSendJobEntity> {
    const sendJob = await this.developmentEmailSendJobRepository.findOneBy({
      workspaceId: workspace.id,
      id: input.sendJobId,
    });

    if (!sendJob) {
      throw new Error('Development email send job was not found');
    }

    const preparedTasks = await this.developmentEmailSendTaskRepository.find({
      where: {
        workspaceId: workspace.id,
        sendJobId: sendJob.id,
        status: 'prepared',
      },
      order: { createdAt: 'ASC' },
      take: 1000,
    });

    if (preparedTasks.length === 0) {
      throw new Error('Development email send job has no prepared tasks');
    }

    const audienceIds = preparedTasks
      .map((preparedTask) => preparedTask.audienceId)
      .filter((audienceId): audienceId is string => audienceId !== null);
    const templateIds = preparedTasks
      .map((preparedTask) => preparedTask.templateId)
      .filter((templateId): templateId is string => templateId !== null);
    const [audiences, templates, campaign] = await Promise.all([
      audienceIds.length > 0
        ? this.developmentEmailAudienceRepository.find({
            where: {
              workspaceId: workspace.id,
              id: In(audienceIds),
            },
          })
        : Promise.resolve([]),
      templateIds.length > 0
        ? this.developmentEmailTemplateRepository.find({
            where: {
              workspaceId: workspace.id,
              id: In(templateIds),
            },
          })
        : Promise.resolve([]),
      sendJob.campaignId
        ? this.developmentEmailCampaignRepository.findOneBy({
            workspaceId: workspace.id,
            id: sendJob.campaignId,
          })
        : Promise.resolve(null),
    ]);
    const audienceById = new Map(
      audiences.map((audience) => [audience.id, audience]),
    );
    const templateById = new Map(
      templates.map((template) => [template.id, template]),
    );

    let successfulTaskCount = 0;
    let failedTaskCount = 0;
    let executionModeSummary = 'smtp-live';

    for (const preparedTask of preparedTasks) {
      const executionTimestamp = new Date();
      const audience =
        preparedTask.audienceId !== null
          ? audienceById.get(preparedTask.audienceId)
          : undefined;
      const template =
        preparedTask.templateId !== null
          ? templateById.get(preparedTask.templateId)
          : undefined;

      if (!audience || !template) {
        failedTaskCount += 1;

        await this.developmentEmailSendTaskRepository.update(preparedTask.id, {
          status: 'failed',
          lastError: !audience
            ? 'Audience for development email task was not found.'
            : 'Template for development email task was not found.',
          trackingSnapshot: {
            ...(preparedTask.trackingSnapshot ?? {}),
            executedAt: executionTimestamp.toISOString(),
            executionMode: 'validation-failed',
          },
        });

        continue;
      }

      try {
        const executionResult =
          await this.developmentEmailProviderExecutorService.executePreparedTask(
            {
              workspaceId: workspace.id,
              preparedTask,
              audience,
              campaign,
              template,
            },
          );

        successfulTaskCount += 1;

        if (executionResult.executionMode !== 'smtp-live') {
          executionModeSummary = executionResult.executionMode;
        }

        await this.developmentEmailSendTaskRepository.update(preparedTask.id, {
          status: 'sent',
          providerMessageId: executionResult.providerMessageId,
          sentAt: executionTimestamp,
          lastError: null,
          trackingSnapshot: {
            ...(preparedTask.trackingSnapshot ?? {}),
            executedAt: executionTimestamp.toISOString(),
            executionMode: executionResult.executionMode,
            senderHandle: executionResult.senderHandle,
            senderProvider: executionResult.provider,
          },
        });

        await this.developmentEmailEventRepository.save({
          workspaceId: workspace.id,
          eventType: 'sent',
          campaignId: preparedTask.campaignId,
          sendJobId: preparedTask.sendJobId,
          sendTaskId: preparedTask.id,
          email: audience.email,
          provider: executionResult.provider,
          providerMessageId: executionResult.providerMessageId,
          metadata: {
            executionMode: executionResult.executionMode,
          },
          occurredAt: executionTimestamp,
        });
      } catch (error) {
        if (error instanceof DevelopmentEmailExecutionFallbackError) {
          successfulTaskCount += 1;
          executionModeSummary = 'internal-simulation-fallback';

          const providerMessageId = `dev-email-${preparedTask.id}`;
          const senderProvider =
            typeof preparedTask.trackingSnapshot?.senderProvider === 'string'
              ? preparedTask.trackingSnapshot.senderProvider
              : null;

          await this.developmentEmailSendTaskRepository.update(
            preparedTask.id,
            {
              status: 'sent',
              providerMessageId,
              sentAt: executionTimestamp,
              lastError: null,
              trackingSnapshot: {
                ...(preparedTask.trackingSnapshot ?? {}),
                executedAt: executionTimestamp.toISOString(),
                executionMode: 'internal-simulation-fallback',
              },
            },
          );

          await this.developmentEmailEventRepository.save([
            {
              workspaceId: workspace.id,
              eventType: 'sent',
              campaignId: preparedTask.campaignId,
              sendJobId: preparedTask.sendJobId,
              sendTaskId: preparedTask.id,
              email: audience.email,
              provider: senderProvider,
              providerMessageId,
              metadata: {
                executionMode: 'internal-simulation-fallback',
              },
              occurredAt: executionTimestamp,
            },
            {
              workspaceId: workspace.id,
              eventType: 'delivered',
              campaignId: preparedTask.campaignId,
              sendJobId: preparedTask.sendJobId,
              sendTaskId: preparedTask.id,
              email: audience.email,
              provider: senderProvider,
              providerMessageId,
              metadata: {
                executionMode: 'internal-simulation-fallback',
              },
              occurredAt: executionTimestamp,
            },
          ]);

          continue;
        }

        failedTaskCount += 1;

        await this.developmentEmailSendTaskRepository.update(preparedTask.id, {
          status: 'failed',
          lastError: error instanceof Error ? error.message : 'Send failed.',
          trackingSnapshot: {
            ...(preparedTask.trackingSnapshot ?? {}),
            executedAt: executionTimestamp.toISOString(),
            executionMode: 'send-failed',
          },
        });
      }
    }

    await this.developmentEmailSendJobRepository.update(sendJob.id, {
      status: failedTaskCount > 0 ? 'completed_with_failures' : 'completed',
      sentCount: successfulTaskCount,
      failedCount: failedTaskCount,
      completedAt: new Date(),
      executionSummary: {
        ...(sendJob.executionSummary ?? {}),
        executedAt: new Date().toISOString(),
        executionMode: executionModeSummary,
        sentTaskCount: successfulTaskCount,
        failedTaskCount,
      },
    });

    if (sendJob.campaignId) {
      await this.developmentEmailCampaignRepository.update(sendJob.campaignId, {
        status: failedTaskCount > 0 ? 'completed_with_failures' : 'completed',
        completedAt: new Date(),
      });
    }

    return this.developmentEmailSendJobRepository.findOneByOrFail({
      workspaceId: workspace.id,
      id: sendJob.id,
    });
  }
}
