import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';

import { type MessageFolder } from '@/accounts/types/MessageFolder';
import { MessageChannelSyncStatus } from '@/accounts/types/MessageChannel';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { computeMessageFolderTree } from '@/settings/accounts/components/message-folders/utils/computeMessageFolderTree';
import { useMyConnectedAccounts } from '@/settings/accounts/hooks/useMyConnectedAccounts';
import { useMyMessageChannels } from '@/settings/accounts/hooks/useMyMessageChannels';
import { useMyMessageFolders } from '@/settings/accounts/hooks/useMyMessageFolders';
import { type TradeCrmMailViewKey } from '@/trade-crm/mail/constants/trade-crm-mail-workspace';
import { GET_DEVELOPMENT_EMAIL_AUDIENCES } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailAudiences';
import { GET_DEVELOPMENT_EMAIL_ANALYTICS } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailAnalytics';
import { GET_DEVELOPMENT_EMAIL_BOUNCE_EVENTS } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailBounceEvents';
import { GET_DEVELOPMENT_EMAIL_CAMPAIGNS } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailCampaigns';
import { GET_DEVELOPMENT_EMAIL_SEND_JOBS } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailSendJobs';
import { GET_DEVELOPMENT_EMAIL_REPORTS } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailReports';
import { GET_DEVELOPMENT_EMAIL_SEND_TASKS } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailSendTasks';
import { GET_DEVELOPMENT_EMAIL_TEMPLATES } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailTemplates';
import { GET_DEVELOPMENT_EMAIL_UNSUBSCRIBES } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailUnsubscribes';
import { GET_DEVELOPMENT_EMAIL_WORKSPACE } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailWorkspace';
import { GET_MY_CUSTOMER_MAIL_COMPANIES } from '@/trade-crm/mail/graphql/queries/getMyCustomerMailCompanies';
import { GET_MY_INBOX_THREADS } from '@/trade-crm/mail/graphql/queries/getMyInboxThreads';
import { type TradeCrmMailScopeKey } from '@/trade-crm/mail/navigation/trade-crm-mail-navigation';
import { tradeCrmRouteMap } from '@/trade-crm/navigation/tradeCrmRouteMap';
import {
  createTradeCrmRecordSource,
  getTradeCrmRecordPathFromSource,
} from '@/trade-crm/shared/navigation/tradeCrmRecordSource';
import {
  MessageChannelVisibility,
  type TimelineThread,
} from '~/generated/graphql';
import { formatToHumanReadableDate } from '~/utils/date-utils';

export type TradeCrmMailThreadListItem = {
  id: string;
  primary: string;
  secondary: string;
  tertiary: string;
  meta: string;
  status: string;
  executionMode?: string;
  senderPoolMode?: string;
  threadId?: string;
  href?: string;
  tags?: string[];
};

type TradeCrmMailTimelineThread = TimelineThread & {
  tags?: string[];
};

export type TradeCrmMailSendTaskRecord = {
  id: string;
  sendJobId: string | null;
  campaignId: string | null;
  audienceId: string | null;
  templateId: string | null;
  connectedAccountId: string | null;
  status: string;
  retryCount: number;
  providerMessageId: string | null;
  lastError: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  trackingSnapshot: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

const DEVELOPMENT_EMAIL_SENDER_HEALTH_STATUSES = new Set([
  'live-ready',
  'needs-credentials',
  'fallback-only',
  'live-capable',
]);

const truncate = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;

const getDirectionFromView = (view: TradeCrmMailViewKey) =>
  view === 'sent'
    ? 'OUTGOING'
    : view === 'search' || view === 'tagged'
      ? undefined
      : 'INCOMING';

const getFilterFromView = (view: TradeCrmMailViewKey) =>
  view === 'unread' ? 'UNREAD' : view === 'pending' ? 'PENDING' : undefined;
const getMailboxFilterFromView = (view: TradeCrmMailViewKey) =>
  view === 'tagged' ? 'TAGGED' : getFilterFromView(view);

const formatCampaignDate = (value?: string | null) =>
  value ? formatToHumanReadableDate(value) : 'not scheduled';

export const useTradeCrmMailWorkspaceData = ({
  scope,
  view,
  selectedSendJobId,
  searchQuery,
  tagFilter,
  receivedAtFrom,
  receivedAtTo,
}: {
  scope: TradeCrmMailScopeKey;
  view: TradeCrmMailViewKey;
  selectedSendJobId?: string;
  searchQuery?: string;
  tagFilter?: string;
  receivedAtFrom?: string;
  receivedAtTo?: string;
}) => {
  const isMailScope = scope === 'mail';
  const isCustomerScope = scope === 'customer';
  const isCampaignScope = scope === 'campaign';

  const { accounts, loading: accountsLoading } = useMyConnectedAccounts();
  const { channels, loading: channelsLoading } = useMyMessageChannels();
  const primaryChannelId = channels[0]?.id;
  const { messageFolders: primaryMessageFolders, loading: foldersLoading } =
    useMyMessageFolders(primaryChannelId);

  const { data: inboxThreadData, loading: inboxThreadsLoading } = useQuery<{
    getMyInboxThreads: {
      totalNumberOfThreads: number;
      timelineThreads: TradeCrmMailTimelineThread[];
    };
  }>(GET_MY_INBOX_THREADS, {
    variables: {
      page: 1,
      pageSize: 20,
      direction: getDirectionFromView(view),
      filter: getMailboxFilterFromView(view),
      search: searchQuery || undefined,
      tag: tagFilter || undefined,
      receivedAtFrom: receivedAtFrom || undefined,
      receivedAtTo: receivedAtTo || undefined,
    },
    skip: !isMailScope,
  });

  const { data: customerMailData, loading: customerMailLoading } = useQuery<{
    getMyCustomerMailCompanies: {
      totalNumberOfCompanies: number;
      timelineCompanyThreads: Array<{
        companyId: string;
        latestThreadId: string;
        companyName: string;
        latestMessageReceivedAt: string;
        latestMessageBody: string;
        subject: string;
        totalNumberOfThreads: number;
      }>;
    };
  }>(GET_MY_CUSTOMER_MAIL_COMPANIES, {
    variables: {
      page: 1,
      pageSize: 20,
    },
    skip: !isCustomerScope,
  });

  const {
    data: developmentEmailWorkspaceData,
    loading: developmentEmailWorkspaceLoading,
  } = useQuery<{
    getDevelopmentEmailWorkspace: {
      metrics: Array<{
        label: string;
        value: string;
        description: string;
      }>;
      listItems: Array<{
        id: string;
        primary: string;
        secondary: string;
        tertiary: string;
        meta: string;
        status: string;
      }>;
    };
  }>(GET_DEVELOPMENT_EMAIL_WORKSPACE, {
    skip: !isCampaignScope,
  });

  const { data: developmentEmailAudiencesData, loading: audiencesLoading } =
    useQuery<{
      getDevelopmentEmailAudiences: Array<{
        id: string;
        email: string;
        displayName: string;
        subscriptionStatus: string;
        source: string;
        companyId: string | null;
        personId: string | null;
        createdAt: string;
      }>;
    }>(GET_DEVELOPMENT_EMAIL_AUDIENCES, {
      skip: !isCampaignScope || view !== 'audiences',
    });

  const { data: developmentEmailTemplatesData, loading: templatesLoading } =
    useQuery<{
      getDevelopmentEmailTemplates: Array<{
        id: string;
        name: string;
        subject: string;
        status: string;
        version: number;
        updatedAt: string;
        createdAt: string;
      }>;
    }>(GET_DEVELOPMENT_EMAIL_TEMPLATES, {
      skip: !isCampaignScope || view !== 'templates',
    });

  const { data: developmentEmailCampaignsData, loading: campaignsLoading } =
    useQuery<{
      getDevelopmentEmailCampaigns: Array<{
        id: string;
        name: string;
        templateId: string | null;
        status: string;
        scheduledAt: string | null;
        startedAt: string | null;
        completedAt: string | null;
        createdAt: string;
      }>;
    }>(GET_DEVELOPMENT_EMAIL_CAMPAIGNS, {
      skip: !isCampaignScope || view !== 'campaigns',
    });

  const { data: developmentEmailSendJobsData, loading: sendJobsLoading } =
    useQuery<{
      getDevelopmentEmailSendJobs: Array<{
        id: string;
        campaignId: string | null;
        status: string;
        executionMode: string | null;
        senderPoolMode: string | null;
        queuedCount: number;
        sentCount: number;
        failedCount: number;
        startedAt: string | null;
        completedAt: string | null;
        createdAt: string;
      }>;
    }>(GET_DEVELOPMENT_EMAIL_SEND_JOBS, {
      skip: !isCampaignScope || view !== 'jobs',
    });
  const { data: developmentEmailSendTasksData, loading: sendTasksLoading } =
    useQuery<{
      getDevelopmentEmailSendTasks: TradeCrmMailSendTaskRecord[];
    }>(GET_DEVELOPMENT_EMAIL_SEND_TASKS, {
      variables: { sendJobId: selectedSendJobId ?? null },
      skip: !isCampaignScope || view !== 'jobs' || !selectedSendJobId,
    });
  const {
    data: developmentEmailBounceEventsData,
    loading: bounceEventsLoading,
  } = useQuery<{
    getDevelopmentEmailBounceEvents: Array<{
      id: string;
      eventType: string;
      email: string;
      audienceId: string | null;
      campaignId: string | null;
      sendTaskId: string | null;
      provider: string | null;
      reason: string | null;
      occurredAt: string;
      createdAt: string;
    }>;
  }>(GET_DEVELOPMENT_EMAIL_BOUNCE_EVENTS, {
    skip: !isCampaignScope || view !== 'bounces',
  });
  const { data: developmentEmailAnalyticsData, loading: analyticsLoading } =
    useQuery<{
      getDevelopmentEmailAnalytics: {
        metrics: Array<{
          label: string;
          value: string;
          description: string;
        }>;
        listItems: Array<{
          id: string;
          primary: string;
          secondary: string;
          tertiary: string;
          meta: string;
          status: string;
        }>;
      };
    }>(GET_DEVELOPMENT_EMAIL_ANALYTICS, {
      skip: !isCampaignScope || view !== 'analytics',
    });
  const { data: developmentEmailReportsData, loading: reportsLoading } =
    useQuery<{
      getDevelopmentEmailReports: {
        metrics: Array<{
          label: string;
          value: string;
          description: string;
        }>;
        listItems: Array<{
          id: string;
          primary: string;
          secondary: string;
          tertiary: string;
          meta: string;
          status: string;
        }>;
      };
    }>(GET_DEVELOPMENT_EMAIL_REPORTS, {
      skip: !isCampaignScope || view !== 'reports',
    });
  const {
    data: developmentEmailUnsubscribesData,
    loading: unsubscribesLoading,
  } = useQuery<{
    getDevelopmentEmailUnsubscribes: Array<{
      id: string;
      email: string;
      audienceId: string | null;
      campaignId: string | null;
      sendTaskId: string | null;
      source: string | null;
      reason: string | null;
      occurredAt: string;
      createdAt: string;
    }>;
  }>(GET_DEVELOPMENT_EMAIL_UNSUBSCRIBES, {
    skip: !isCampaignScope || view !== 'unsubscribes',
  });

  const { totalCount: companyTotalCount, loading: companiesLoading } =
    useFindManyRecords({
      objectNameSingular: CoreObjectNameSingular.Company,
      limit: 1,
      skip: !isCustomerScope,
    });

  const messageFolders = useMemo<MessageFolder[]>(() => {
    const channelMessageFolders = channels.flatMap(
      (messageChannel) => messageChannel.messageFolders ?? [],
    );

    return channelMessageFolders.length > 0
      ? channelMessageFolders
      : primaryMessageFolders;
  }, [channels, primaryMessageFolders]);

  const rootFolders = useMemo(
    () => computeMessageFolderTree(messageFolders),
    [messageFolders],
  );

  const recentThreads = useMemo<TradeCrmMailThreadListItem[]>(() => {
    const timelineThreads =
      inboxThreadData?.getMyInboxThreads.timelineThreads ?? [];

    return timelineThreads.map((thread) => {
      const participant = thread.firstParticipant;
      const displayName = participant.displayName || participant.handle;
      const handle = participant.handle ? ` <${participant.handle}>` : '';
      const visibilityLabel =
        thread.visibility === MessageChannelVisibility.SHARE_EVERYTHING
          ? 'Full share'
          : thread.visibility === MessageChannelVisibility.SUBJECT
            ? 'Subject only'
            : 'Metadata only';

      const tagSummary =
        (thread.tags?.length ?? 0) > 0
          ? `Tags: ${thread.tags?.join(', ')}`
          : 'No tags';

      return {
        id: thread.id,
        threadId: thread.id,
        primary: `${displayName}${handle}`,
        secondary: thread.subject || 'No subject',
        tertiary: truncate(
          `${thread.lastMessageBody || 'No preview available.'} · ${tagSummary}`,
          180,
        ),
        meta: `${formatToHumanReadableDate(thread.lastMessageReceivedAt)} · ${visibilityLabel}`,
        status:
          view === 'sent'
            ? 'Sent'
            : view === 'unread'
              ? 'Unread'
              : view === 'pending'
                ? 'Pending'
                : view === 'tagged'
                  ? 'Tagged'
                  : thread.read
                    ? 'Read'
                    : 'Unread',
        tags: thread.tags ?? [],
      };
    });
  }, [inboxThreadData, view]);

  const customerRecordSource = useMemo(
    () =>
      createTradeCrmRecordSource({
        href: `${tradeCrmRouteMap.mail}?scope=customer&view=${view}`,
        workspaceKey: 'mail',
        workspaceLabel: 'Mail',
        viewKey: view,
        viewLabel: 'Customer Mail',
      }),
    [view],
  );

  const customerListItems = useMemo<TradeCrmMailThreadListItem[]>(() => {
    const customerThreads =
      customerMailData?.getMyCustomerMailCompanies.timelineCompanyThreads ?? [];

    return customerThreads.map((companyThread) => ({
      id: companyThread.companyId,
      primary: companyThread.companyName,
      secondary: companyThread.subject || 'Latest customer thread',
      tertiary: truncate(
        companyThread.latestMessageBody || 'No preview available.',
        180,
      ),
      meta: `${formatToHumanReadableDate(companyThread.latestMessageReceivedAt)} · ${companyThread.totalNumberOfThreads} thread(s)`,
      status:
        companyThread.totalNumberOfThreads > 3 ? 'Active' : 'Needs review',
      href: getTradeCrmRecordPathFromSource({
        objectNameSingular: CoreObjectNameSingular.Company,
        objectRecordId: companyThread.companyId,
        source: customerRecordSource,
      }),
    }));
  }, [customerMailData, customerRecordSource]);

  const campaignWorkspaceListItems = useMemo<
    TradeCrmMailThreadListItem[]
  >(() => {
    return (
      developmentEmailWorkspaceData?.getDevelopmentEmailWorkspace.listItems ??
      []
    ).map((item) => ({
      id: item.id,
      primary: item.primary,
      secondary: item.secondary,
      tertiary: item.tertiary,
      meta: item.meta,
      status: item.status,
    }));
  }, [developmentEmailWorkspaceData]);
  const campaignWorkspaceHealthItems = useMemo<
    TradeCrmMailThreadListItem[]
  >(
    () =>
      campaignWorkspaceListItems.filter((item) =>
        DEVELOPMENT_EMAIL_SENDER_HEALTH_STATUSES.has(item.status),
      ),
    [campaignWorkspaceListItems],
  );
  const campaignWorkspacePrimaryItems = useMemo<
    TradeCrmMailThreadListItem[]
  >(
    () =>
      campaignWorkspaceListItems.filter(
        (item) => !DEVELOPMENT_EMAIL_SENDER_HEALTH_STATUSES.has(item.status),
      ),
    [campaignWorkspaceListItems],
  );

  const audienceListItems = useMemo<TradeCrmMailThreadListItem[]>(() => {
    return (
      developmentEmailAudiencesData?.getDevelopmentEmailAudiences ?? []
    ).map((audience) => ({
      id: audience.id,
      primary: audience.displayName,
      secondary: audience.email,
      tertiary:
        audience.companyId !== null
          ? `Linked company: ${audience.companyId}`
          : audience.personId !== null
            ? `Linked person: ${audience.personId}`
            : 'Not linked to CRM record yet.',
      meta: `${formatToHumanReadableDate(audience.createdAt)} · ${audience.source}`,
      status: audience.subscriptionStatus,
    }));
  }, [developmentEmailAudiencesData]);

  const templateListItems = useMemo<TradeCrmMailThreadListItem[]>(() => {
    return (
      developmentEmailTemplatesData?.getDevelopmentEmailTemplates ?? []
    ).map((template) => ({
      id: template.id,
      primary: template.name,
      secondary: template.subject,
      tertiary: `Version ${template.version} · updated ${formatToHumanReadableDate(template.updatedAt)}`,
      meta: `created ${formatToHumanReadableDate(template.createdAt)}`,
      status: template.status,
    }));
  }, [developmentEmailTemplatesData]);

  const campaignListItems = useMemo<TradeCrmMailThreadListItem[]>(() => {
    return (
      developmentEmailCampaignsData?.getDevelopmentEmailCampaigns ?? []
    ).map((campaign) => ({
      id: campaign.id,
      primary: campaign.name,
      secondary:
        campaign.templateId !== null
          ? `Template linked: ${campaign.templateId}`
          : 'No template linked yet',
      tertiary: `Scheduled ${formatCampaignDate(campaign.scheduledAt)} · created ${formatToHumanReadableDate(campaign.createdAt)}`,
      meta:
        campaign.startedAt !== null
          ? `started ${formatToHumanReadableDate(campaign.startedAt)}`
          : campaign.completedAt !== null
            ? `completed ${formatToHumanReadableDate(campaign.completedAt)}`
            : 'not started',
      status: campaign.status,
    }));
  }, [developmentEmailCampaignsData]);

  const sendJobListItems = useMemo<TradeCrmMailThreadListItem[]>(() => {
    return (
      developmentEmailSendJobsData?.getDevelopmentEmailSendJobs ?? []
    ).map((sendJob) => ({
      id: sendJob.id,
      primary: `Send job ${sendJob.id.slice(0, 8)}`,
      secondary:
        sendJob.campaignId !== null
          ? `Campaign ${sendJob.campaignId.slice(0, 8)}`
          : 'No campaign linked',
      tertiary: `Queued ${sendJob.queuedCount} · sent ${sendJob.sentCount} · failed ${sendJob.failedCount} · pool ${sendJob.senderPoolMode ?? 'not recorded'}`,
      meta: `created ${formatToHumanReadableDate(sendJob.createdAt)} · started ${
        sendJob.startedAt !== null
          ? formatToHumanReadableDate(sendJob.startedAt)
          : 'not started'
      } · path ${sendJob.executionMode ?? 'not recorded'}`,
      status: sendJob.status,
      executionMode: sendJob.executionMode ?? undefined,
      senderPoolMode: sendJob.senderPoolMode ?? undefined,
      href: `${tradeCrmRouteMap.mail}?scope=campaign&view=jobs&jobId=${sendJob.id}`,
    }));
  }, [developmentEmailSendJobsData]);

  const sendTaskListItems = useMemo<TradeCrmMailThreadListItem[]>(() => {
    return (
      developmentEmailSendTasksData?.getDevelopmentEmailSendTasks ?? []
    ).map((sendTask) => {
      const executionMode =
        typeof sendTask.trackingSnapshot?.executionMode === 'string'
          ? sendTask.trackingSnapshot.executionMode
          : 'not recorded';

      return {
        id: sendTask.id,
        primary: `Task ${sendTask.id.slice(0, 8)}`,
        secondary:
          sendTask.connectedAccountId !== null
            ? `Sender ${sendTask.connectedAccountId.slice(0, 8)}`
            : 'Sender not assigned',
        tertiary:
          sendTask.providerMessageId !== null
            ? `Provider ${sendTask.providerMessageId}`
            : (sendTask.lastError ??
              (sendTask.audienceId !== null
                ? `Audience ${sendTask.audienceId.slice(0, 8)} awaiting provider callback`
                : 'No audience linked')),
        meta: `scheduled ${
          sendTask.scheduledAt !== null
            ? formatToHumanReadableDate(sendTask.scheduledAt)
            : 'not set'
        } · updated ${formatToHumanReadableDate(sendTask.updatedAt)} · mode ${executionMode} · retries ${
          sendTask.retryCount
        }`,
        status: sendTask.status,
        href: `${tradeCrmRouteMap.mail}?scope=campaign&view=jobs&jobId=${
          sendTask.sendJobId ?? selectedSendJobId ?? ''
        }&taskId=${sendTask.id}`,
      };
    });
  }, [developmentEmailSendTasksData, selectedSendJobId]);

  const bounceEventListItems = useMemo<TradeCrmMailThreadListItem[]>(() => {
    return (
      developmentEmailBounceEventsData?.getDevelopmentEmailBounceEvents ?? []
    ).map((bounceEvent) => ({
      id: bounceEvent.id,
      primary: bounceEvent.email,
      secondary: `${bounceEvent.eventType} · ${
        bounceEvent.provider ?? 'provider not set'
      }`,
      tertiary:
        bounceEvent.reason ??
        (bounceEvent.campaignId !== null
          ? `Campaign ${bounceEvent.campaignId.slice(0, 8)}`
          : 'No campaign linked'),
      meta: `occurred ${formatToHumanReadableDate(bounceEvent.occurredAt)}`,
      status: bounceEvent.eventType,
    }));
  }, [developmentEmailBounceEventsData]);

  const unsubscribeListItems = useMemo<TradeCrmMailThreadListItem[]>(() => {
    return (
      developmentEmailUnsubscribesData?.getDevelopmentEmailUnsubscribes ?? []
    ).map((unsubscribe) => ({
      id: unsubscribe.id,
      primary: unsubscribe.email,
      secondary:
        unsubscribe.source !== null
          ? `Source ${unsubscribe.source}`
          : 'Source not set',
      tertiary:
        unsubscribe.reason ??
        (unsubscribe.campaignId !== null
          ? `Campaign ${unsubscribe.campaignId.slice(0, 8)}`
          : 'No campaign linked'),
      meta: `occurred ${formatToHumanReadableDate(unsubscribe.occurredAt)}`,
      status: 'unsubscribed',
    }));
  }, [developmentEmailUnsubscribesData]);

  const analyticsListItems = useMemo<TradeCrmMailThreadListItem[]>(() => {
    return (
      developmentEmailAnalyticsData?.getDevelopmentEmailAnalytics.listItems ??
      []
    ).map((item) => ({
      id: item.id,
      primary: item.primary,
      secondary: item.secondary,
      tertiary: item.tertiary,
      meta: item.meta,
      status: item.status,
    }));
  }, [developmentEmailAnalyticsData]);

  const reportListItems = useMemo<TradeCrmMailThreadListItem[]>(() => {
    return (
      developmentEmailReportsData?.getDevelopmentEmailReports.listItems ?? []
    ).map((item) => ({
      id: item.id,
      primary: item.primary,
      secondary: item.secondary,
      tertiary: item.tertiary,
      meta: item.meta,
      status: item.status,
    }));
  }, [developmentEmailReportsData]);

  const trackingListItems = useMemo<TradeCrmMailThreadListItem[]>(() => {
    return channels.map((messageChannel) => ({
      id: messageChannel.id,
      primary: messageChannel.handle,
      secondary: `Sync status: ${messageChannel.syncStatus}`,
      tertiary: `Stage: ${messageChannel.syncStage}. Folder policy: ${messageChannel.messageFolderImportPolicy}. Synced folders: ${messageChannel.messageFolders.filter((folder) => folder.isSynced).length}.`,
      meta: `Visibility: ${messageChannel.visibility} · Failures: ${messageChannel.throttleFailureCount}`,
      status:
        messageChannel.syncStatus === MessageChannelSyncStatus.ACTIVE
          ? 'Healthy'
          : messageChannel.syncStatus ===
                MessageChannelSyncStatus.FAILED_INSUFFICIENT_PERMISSIONS ||
              messageChannel.syncStatus ===
                MessageChannelSyncStatus.FAILED_UNKNOWN
            ? 'Blocked'
            : 'Syncing',
    }));
  }, [channels]);

  const activeChannels = useMemo(
    () =>
      channels.filter(
        (messageChannel) =>
          messageChannel.syncStatus === MessageChannelSyncStatus.ACTIVE,
      ),
    [channels],
  );

  const inboxMetrics = useMemo(
    () => [
      {
        label: 'Connected inboxes',
        value: `${accounts.length}`,
        description: 'Directly sourced from connected accounts.',
      },
      {
        label: 'Healthy channels',
        value: `${activeChannels.length}/${channels.length}`,
        description: 'Counted from message channel sync status.',
      },
      {
        label: 'Threads in view',
        value: `${inboxThreadData?.getMyInboxThreads.totalNumberOfThreads ?? 0}`,
        description:
          view === 'sent'
            ? 'Current sent mailbox thread count.'
            : 'Current inbox thread count.',
      },
    ],
    [
      accounts.length,
      activeChannels.length,
      channels.length,
      inboxThreadData,
      view,
    ],
  );

  const trackingMetrics = useMemo(
    () => [
      {
        label: 'Connected inboxes',
        value: `${accounts.length}`,
        description: 'Current connected accounts in this workspace.',
      },
      {
        label: 'Healthy channels',
        value: `${activeChannels.length}`,
        description: 'Message channels with ACTIVE sync status.',
      },
      {
        label: 'Synced folders',
        value: `${messageFolders.filter((folder) => folder.isSynced).length}`,
        description: 'Folders currently included in sync.',
      },
    ],
    [accounts.length, activeChannels.length, messageFolders],
  );

  const customerMetrics = useMemo(
    () => [
      {
        label: 'Customers with mail',
        value: `${customerMailData?.getMyCustomerMailCompanies.totalNumberOfCompanies ?? 0}`,
        description: 'Companies with at least one tracked email thread.',
      },
      {
        label: 'CRM companies',
        value: `${companyTotalCount ?? 0}`,
        description: 'Company records currently available in CRM.',
      },
      {
        label: 'Displayed customers',
        value: `${customerListItems.length}`,
        description: 'Customer mail buckets returned for this view.',
      },
    ],
    [companyTotalCount, customerListItems.length, customerMailData],
  );

  const campaignMetrics = useMemo(() => {
    if (view === 'sender-pool') {
      return (
        developmentEmailWorkspaceData?.getDevelopmentEmailWorkspace.metrics.filter(
          (metric) =>
            metric.label === 'Sender pool' ||
            metric.label === 'Sender pool mode' ||
            metric.label === 'Executable senders' ||
            metric.label === 'Skipped senders' ||
            metric.label === 'Healthy sender channels',
        ) ?? []
      );
    }

    if (view === 'analytics') {
      return (
        developmentEmailAnalyticsData?.getDevelopmentEmailAnalytics.metrics ??
        []
      );
    }

    if (view === 'reports') {
      return (
        developmentEmailReportsData?.getDevelopmentEmailReports.metrics ?? []
      );
    }

    return (
      developmentEmailWorkspaceData?.getDevelopmentEmailWorkspace.metrics ?? []
    );
  }, [
    developmentEmailAnalyticsData,
    developmentEmailReportsData,
    developmentEmailWorkspaceData,
    view,
  ]);

  const resolvedMetrics = isCampaignScope
    ? campaignMetrics
    : isCustomerScope
      ? customerMetrics
      : view === 'tracking'
        ? trackingMetrics
        : view === 'inbox' ||
            view === 'sent' ||
            view === 'unread' ||
            view === 'pending' ||
            view === 'tagged' ||
            view === 'search'
          ? inboxMetrics
          : [];

  const resolvedCampaignListItems =
    view === 'audiences'
      ? audienceListItems
      : view === 'templates'
        ? templateListItems
        : view === 'campaigns'
          ? campaignListItems
          : view === 'sender-pool'
            ? campaignWorkspaceHealthItems
          : view === 'jobs'
            ? selectedSendJobId
              ? sendTaskListItems
              : sendJobListItems
            : view === 'bounces'
              ? bounceEventListItems
              : view === 'unsubscribes'
                ? unsubscribeListItems
                : view === 'analytics'
                  ? analyticsListItems
                  : view === 'reports'
                    ? reportListItems
                    : campaignWorkspacePrimaryItems;

  const resolvedListItems = isCampaignScope
    ? resolvedCampaignListItems
    : isCustomerScope
      ? customerListItems
      : view === 'tracking'
        ? trackingListItems
        : view === 'inbox' ||
            view === 'sent' ||
            view === 'unread' ||
            view === 'pending' ||
            view === 'tagged' ||
            view === 'search'
          ? recentThreads
          : [];

  return {
    accounts,
    channels,
    rootFolders,
    sendTasks:
      developmentEmailSendTasksData?.getDevelopmentEmailSendTasks ?? [],
    campaignWorkspaceHealthItems,
    campaignWorkspacePrimaryItems,
    recentThreads: resolvedListItems,
    inboxMetrics: resolvedMetrics,
    loading:
      accountsLoading ||
      channelsLoading ||
      foldersLoading ||
      inboxThreadsLoading ||
      customerMailLoading ||
      developmentEmailWorkspaceLoading ||
      audiencesLoading ||
      templatesLoading ||
      campaignsLoading ||
      sendJobsLoading ||
      sendTasksLoading ||
      bounceEventsLoading ||
      analyticsLoading ||
      reportsLoading ||
      unsubscribesLoading ||
      companiesLoading,
  };
};
