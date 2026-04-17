import { AppPath, SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

import {
  type TradeCrmMailScopeKey,
  getTradeCrmMailPath,
} from '@/trade-crm/mail/navigation/trade-crm-mail-navigation';
import { tradeCrmRouteMap } from '@/trade-crm/navigation/tradeCrmRouteMap';

export type TradeCrmMailViewKey =
  | 'inbox'
  | 'pending'
  | 'unread'
  | 'drafts'
  | 'sent'
  | 'bulk-outbox'
  | 'folders'
  | 'tagged'
  | 'trash'
  | 'spam'
  | 'tracking'
  | 'search'
  | 'mobile-handle'
  | 'accounts'
  | 'domains'
  | 'recent'
  | 'focus'
  | 'cooperating'
  | 'potential'
  | 'intent'
  | 'key'
  | 'normal'
  | 'long-tail'
  | 'overview'
  | 'audiences'
  | 'groups'
  | 'templates'
  | 'campaigns'
  | 'jobs'
  | 'sender-pool'
  | 'bounces'
  | 'unsubscribes'
  | 'analytics'
  | 'reports'
  | 'compliance'
  | 'webhooks'
  | 'monitoring';

export type TradeCrmMailSidebarItem = {
  key: TradeCrmMailViewKey;
  label: string;
  hint: string;
  countLabel?: string;
};

export type TradeCrmMailListItem = {
  id: string;
  primary: string;
  secondary: string;
  tertiary: string;
  meta: string;
  status: string;
  href?: string;
  threadId?: string;
};

export type TradeCrmMailMetric = {
  label: string;
  value: string;
  description: string;
};

export type TradeCrmMailActionCard = {
  title: string;
  description: string;
  actionLabel?: string;
  to?: string;
};

export type TradeCrmMailWorkspaceDefinition = {
  key: TradeCrmMailScopeKey;
  label: string;
  description: string;
  heroTitle: string;
  heroDescription: string;
  listTitle: string;
  sidebarTitle: string;
  defaultViewKey: TradeCrmMailViewKey;
  sidebarItems: TradeCrmMailSidebarItem[];
  metrics: TradeCrmMailMetric[];
  actionCards: TradeCrmMailActionCard[];
  listItems: TradeCrmMailListItem[];
};

const mailSidebarItems: TradeCrmMailSidebarItem[] = [
  {
    key: 'inbox',
    label: 'Inbox',
    hint: 'Primary email execution queue.',
    countLabel: '753',
  },
  {
    key: 'pending',
    label: 'Pending Replies',
    hint: 'Threads waiting for follow-up or CRM routing.',
    countLabel: '126',
  },
  {
    key: 'unread',
    label: 'Unread',
    hint: 'New mail that still needs a first pass.',
    countLabel: '87',
  },
  {
    key: 'drafts',
    label: 'Drafts',
    hint: 'Human-reviewed drafts before sending.',
    countLabel: '18',
  },
  {
    key: 'sent',
    label: 'Sent',
    hint: 'Outbound and reply history.',
    countLabel: '342',
  },
  {
    key: 'bulk-outbox',
    label: 'Bulk Outbox',
    hint: 'Campaign and bulk-send records.',
    countLabel: '24',
  },
  {
    key: 'folders',
    label: 'Folders',
    hint: 'System and custom mailbox folders.',
  },
  {
    key: 'tagged',
    label: 'Tagged Mail',
    hint: 'Operational and business tags.',
    countLabel: '11',
  },
  { key: 'trash', label: 'Trash', hint: 'Recoverable deleted messages.' },
  { key: 'spam', label: 'Spam', hint: 'Suspicious or filtered senders.' },
  {
    key: 'tracking',
    label: 'Tracking',
    hint: 'Channel sync health and delivery telemetry.',
  },
  {
    key: 'search',
    label: 'Advanced Search',
    hint: 'Search by sender, subject, customer, or time.',
  },
  {
    key: 'mobile-handle',
    label: 'Mobile Queue',
    hint: 'Fast-handle queue for mobile users.',
  },
  {
    key: 'accounts',
    label: 'Email Accounts',
    hint: 'Connected account and sync management.',
  },
  {
    key: 'domains',
    label: 'Sending Domains',
    hint: 'SPF, DKIM, DMARC, and sender readiness.',
  },
];

const customerSidebarItems: TradeCrmMailSidebarItem[] = [
  {
    key: 'recent',
    label: 'Recent 7 Days',
    hint: 'Customers with fresh email activity.',
    countLabel: '42',
  },
  {
    key: 'focus',
    label: 'Focus Customers',
    hint: 'High-value customers that need attention.',
    countLabel: '8',
  },
  {
    key: 'cooperating',
    label: 'Cooperating',
    hint: 'Accounts in active delivery or reorder loops.',
    countLabel: '16',
  },
  {
    key: 'potential',
    label: 'Potential',
    hint: 'Newly active or reactivated accounts.',
    countLabel: '28',
  },
  {
    key: 'intent',
    label: 'Intent',
    hint: 'Quote, sample, PI, and payment discussions.',
    countLabel: '13',
  },
  {
    key: 'key',
    label: 'Key Customers',
    hint: 'Strategic customers with tight follow-up rules.',
    countLabel: '6',
  },
  {
    key: 'normal',
    label: 'Normal',
    hint: 'Standard maintenance portfolio.',
    countLabel: '14',
  },
  {
    key: 'long-tail',
    label: 'Long Tail',
    hint: 'Lower-frequency customers managed in one queue.',
    countLabel: '19',
  },
];

const campaignSidebarItems: TradeCrmMailSidebarItem[] = [
  {
    key: 'overview',
    label: 'Overview',
    hint: 'Campaign health, sender load, and backlog.',
  },
  {
    key: 'audiences',
    label: 'Audiences',
    hint: 'Recipient lists, subscription states, and sources.',
    countLabel: '5,420',
  },
  {
    key: 'groups',
    label: 'Groups & Tags',
    hint: 'Segmentation and sending strategy.',
    countLabel: '126',
  },
  {
    key: 'templates',
    label: 'Templates',
    hint: 'Subjects, bodies, variables, and versions.',
    countLabel: '32',
  },
  {
    key: 'campaigns',
    label: 'Campaigns',
    hint: 'Create, schedule, warm up, and compare runs.',
    countLabel: '14',
  },
  {
    key: 'jobs',
    label: 'Send Queue',
    hint: 'Job orchestration, retries, and rate limits.',
    countLabel: '3,812',
  },
  {
    key: 'sender-pool',
    label: 'Sender Pool',
    hint: 'Account rotation and capacity control.',
    countLabel: '12',
  },
  {
    key: 'domains',
    label: 'Domains',
    hint: 'Domain verification and reputation.',
    countLabel: '4',
  },
  {
    key: 'bounces',
    label: 'Bounces & Complaints',
    hint: 'Hard bounce, soft bounce, and complaint loop.',
    countLabel: '37',
  },
  {
    key: 'unsubscribes',
    label: 'Unsubscribes',
    hint: 'Global suppression and unsubscribe compliance.',
    countLabel: '63',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    hint: 'Open, click, reply, and deliverability metrics.',
  },
  { key: 'reports', label: 'Reports', hint: 'CSV, Excel, and PDF exports.' },
  {
    key: 'compliance',
    label: 'Compliance',
    hint: 'Security, policy, GDPR, and audit logs.',
  },
  {
    key: 'webhooks',
    label: 'Webhooks',
    hint: 'Callback delivery logs and signature checks.',
  },
  {
    key: 'monitoring',
    label: 'Monitoring',
    hint: 'System throughput, failures, and alerts.',
  },
];

export const tradeCrmMailWorkspaceDefinitions: Record<
  TradeCrmMailScopeKey,
  TradeCrmMailWorkspaceDefinition
> = {
  mail: {
    key: 'mail',
    label: 'Email',
    description: 'Mailbox execution workspace linked back into CRM.',
    heroTitle:
      'Turn Mail into an operating workspace instead of a static landing page.',
    heroDescription:
      'The email scope keeps folders, threads, CRM linkage, and AI assistance in one surface. It reuses Twenty email infrastructure and upgrades the trade-crm entry into a real mail workbench.',
    listTitle: 'Recent Threads',
    sidebarTitle: 'Mailbox Views',
    defaultViewKey: 'inbox',
    sidebarItems: mailSidebarItems,
    metrics: [
      {
        label: 'Connected inboxes',
        value: '3',
        description: 'Mailbox accounts currently connected to this workspace.',
      },
      {
        label: 'Healthy channels',
        value: '2/3',
        description: 'Message channels with stable sync.',
      },
      {
        label: 'Threads in queue',
        value: '126',
        description: 'Threads that need a seller decision or reply.',
      },
    ],
    actionCards: [
      {
        title: 'Open email accounts',
        description:
          'Review mailbox connection, sync errors, and provider status.',
        actionLabel: 'Open accounts',
        to: getSettingsPath(SettingsPath.AccountsEmails),
      },
      {
        title: 'Open domain settings',
        description:
          'Check SPF, DKIM, DMARC, and sender readiness before scaling outbound.',
        actionLabel: 'Open domains',
        to: getSettingsPath(SettingsPath.Domains),
      },
      {
        title: 'Open tasks',
        description:
          'Push reply pressure and follow-up work back into the CRM task queue.',
        actionLabel: 'Open tasks',
        to: AppPath.TasksPage,
      },
    ],
    listItems: [
      {
        id: 'mail-1',
        primary: 'James Fischer <james@example.com>',
        secondary: 'Re: Quotation of the art design',
        tertiary:
          'Customer has replied and asked about sample timing. Quote attachments and opportunity stage need review.',
        meta: '2h ago �� linked customer �� active opportunity',
        status: 'Reply needed',
      },
      {
        id: 'mail-2',
        primary: 'Raymond Zhao <raymond@buyer.com>',
        secondary: 'Unlock New Opportunities',
        tertiary:
          'First reply after outbound outreach. Customer record and follow-up task still need to be created.',
        meta: '4h ago �� not linked to CRM',
        status: 'Create customer',
      },
      {
        id: 'mail-3',
        primary: 'System <noreply@example.com>',
        secondary: 'Shipping reminder',
        tertiary:
          'System-generated thread that should be routed by folder or rules instead of staying in the seller queue.',
        meta: '6h ago �� system mail',
        status: 'Archive by rule',
      },
    ],
  },
  customer: {
    key: 'customer',
    label: 'Customer',
    description: 'Customer-centric view of all meaningful email threads.',
    heroTitle: 'Review email by customer, not just by isolated thread.',
    heroDescription:
      'The customer scope groups email activity around accounts so sellers can see who is active, who is silent, and which threads should flow back into customer and opportunity execution.',
    listTitle: 'Customer Mail Buckets',
    sidebarTitle: 'Customer Groups',
    defaultViewKey: 'recent',
    sidebarItems: customerSidebarItems,
    metrics: [
      {
        label: 'Customers with mail',
        value: '42',
        description: 'Accounts with recent email activity.',
      },
      {
        label: 'Silent key accounts',
        value: '5',
        description: 'High-value accounts with no recent push forward.',
      },
      {
        label: 'Linked opportunities',
        value: '61',
        description: 'Customer mail threads linked to live commercial motion.',
      },
    ],
    actionCards: [
      {
        title: 'Open customers workspace',
        description:
          'Continue from customer mail into the broader customer operating workspace.',
        actionLabel: 'Open customers',
        to: tradeCrmRouteMap.customers,
      },
      {
        title: 'Open opportunities workspace',
        description:
          'Handle quote, sample, PI, payment, and delivery threads in the opportunity workspace.',
        actionLabel: 'Open opportunities',
        to: tradeCrmRouteMap.opportunities,
      },
      {
        title: 'Open advanced search',
        description:
          'Search mail by customer, contact, subject, attachments, or time range.',
        actionLabel: 'Open search',
        to: getTradeCrmMailPath({ scope: 'mail', view: 'search' }),
      },
    ],
    listItems: [
      {
        id: 'customer-1',
        primary: 'VISTA MANUFACTURING',
        secondary: 'Latest thread: Re: Quotation of the art design',
        tertiary:
          'Customer replied on samples and delivery timing. Surface contacts, quote history, and next action together.',
        meta: 'Focus customer �� replied 2h ago',
        status: 'Priority follow-up',
      },
      {
        id: 'customer-2',
        primary: '11 Daily Sale Inc.',
        secondary: 'Latest thread: Sample lead time confirmation',
        tertiary:
          'Sample-stage customer linked to an opportunity but not pushed forward within the last 48 hours.',
        meta: 'Potential customer �� sample stage',
        status: 'Needs nudge',
      },
      {
        id: 'customer-3',
        primary: 'Arrow Engine Company',
        secondary: 'Latest thread: Payment term discussion',
        tertiary:
          'Payment-terms conversation should stay visible with finance coordination and risk labels.',
        meta: 'Cooperating customer �� active this week',
        status: 'Cross-team follow-up',
      },
    ],
  },
  campaign: {
    key: 'campaign',
    label: 'Development Email',
    description: 'Full outbound and marketing email operating system.',
    heroTitle: 'Development email is a product system, not a templates page.',
    heroDescription:
      'This scope covers audiences, templates, campaigns, send jobs, sender pools, bounce handling, analytics, reporting, and compliance on top of the existing Twenty mailbox core.',
    listTitle: 'Campaigns and Jobs',
    sidebarTitle: 'Development Email System',
    defaultViewKey: 'overview',
    sidebarItems: campaignSidebarItems,
    metrics: [
      {
        label: 'Active campaigns',
        value: '14',
        description: 'Running, warming, or queued campaigns.',
      },
      {
        label: 'Queued tasks',
        value: '3,812',
        description: 'Tasks waiting for workers, retries, or callbacks.',
      },
      {
        label: 'Domain health',
        value: '98.1%',
        description:
          'Composite health across SPF, DKIM, DMARC, bounce rate, and complaints.',
      },
    ],
    actionCards: [
      {
        title: 'Open templates',
        description:
          'Manage subjects, bodies, variables, versions, and test sends.',
        actionLabel: 'Open templates',
        to: getTradeCrmMailPath({ scope: 'campaign', view: 'templates' }),
      },
      {
        title: 'Open campaigns',
        description:
          'Configure audience, send windows, rate limits, AB tests, and sender allocation.',
        actionLabel: 'Open campaigns',
        to: getTradeCrmMailPath({ scope: 'campaign', view: 'campaigns' }),
      },
      {
        title: 'Open analytics',
        description:
          'Monitor deliverability, bounce, complaint, unsubscribe, and sender-pool health.',
        actionLabel: 'Open analytics',
        to: getTradeCrmMailPath({ scope: 'campaign', view: 'analytics' }),
      },
    ],
    listItems: [
      {
        id: 'campaign-1',
        primary: 'Spring RFQ Outreach 2026',
        secondary: 'Campaign �� 2,400 recipients �� subject AB running',
        tertiary:
          'Audience segmentation, send windows, unsubscribe links, and click tracking all need to remain visible in one flow.',
        meta: 'sending �� Gmail pool 4 / SMTP pool 8',
        status: 'sending',
      },
      {
        id: 'campaign-2',
        primary: 'Re-activation Customers',
        secondary: 'Audience sync pending �� 560 recipients',
        tertiary:
          'List import is complete. Deduping, suppression filtering, and domain allocation are still pending.',
        meta: 'queued �� suppression ready',
        status: 'queued',
      },
      {
        id: 'campaign-3',
        primary: 'Compliance Watch',
        secondary: 'Bounce and complaint monitor',
        tertiary:
          'Continuously aggregates hard bounce, soft bounce, complaint, and unsubscribe events and can pause risky sender pools.',
        meta: 'monitoring �� webhook verified',
        status: 'healthy',
      },
    ],
  },
};

export const getTradeCrmMailWorkspace = (scope: TradeCrmMailScopeKey) =>
  tradeCrmMailWorkspaceDefinitions[scope];

export const getTradeCrmMailSidebarLink = ({
  scope,
  item,
}: {
  scope: TradeCrmMailScopeKey;
  item: TradeCrmMailSidebarItem;
}) => {
  if (item.key === 'accounts') {
    return getSettingsPath(SettingsPath.AccountsEmails);
  }

  if (item.key === 'domains' && scope === 'mail') {
    return getSettingsPath(SettingsPath.Domains);
  }

  return getTradeCrmMailPath({ scope, view: item.key });
};
