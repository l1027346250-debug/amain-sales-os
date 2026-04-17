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
    label: '收件箱',
    hint: '主邮件处理队列。',
    countLabel: '753',
  },
  {
    key: 'pending',
    label: '待处理邮件',
    hint: '等待跟进或需要 CRM 归档的线程。',
    countLabel: '126',
  },
  {
    key: 'unread',
    label: '未读邮件',
    hint: '尚未完成首轮处理的新邮件。',
    countLabel: '87',
  },
  {
    key: 'drafts',
    label: '草稿箱',
    hint: '发送前仍需人工确认的草稿。',
    countLabel: '18',
  },
  {
    key: 'sent',
    label: '发件箱',
    hint: '外发和回复历史。',
    countLabel: '342',
  },
  {
    key: 'bulk-outbox',
    label: '群发箱',
    hint: '开发信和批量发送记录。',
    countLabel: '24',
  },
  {
    key: 'folders',
    label: '文件夹',
    hint: '系统文件夹和自定义文件夹。',
  },
  { key: 'tagged', label: '标签邮件', hint: '运营标签和业务标签邮件。', countLabel: '11' },
  { key: 'trash', label: '垃圾箱', hint: '可恢复的已删除邮件。' },
  { key: 'spam', label: '垃圾邮件', hint: '疑似风险或被过滤的来信。' },
  {
    key: 'tracking',
    label: '追踪',
    hint: '通道同步状态和送达追踪。',
  },
  {
    key: 'search',
    label: '高级搜索',
    hint: '按发件人、主题、客户或时间检索。',
  },
  {
    key: 'mobile-handle',
    label: '移动处理',
    hint: '面向移动端的快速处理队列。',
  },
  {
    key: 'accounts',
    label: '邮箱账号',
    hint: '邮箱连接、授权和同步管理。',
  },
  {
    key: 'domains',
    label: '发信域名',
    hint: 'SPF、DKIM、DMARC 和发件就绪度。',
  },
];

const customerSidebarItems: TradeCrmMailSidebarItem[] = [
  {
    key: 'recent',
    label: '最近 7 天往来',
    hint: '近期存在邮件往来的客户。',
    countLabel: '42',
  },
  {
    key: 'focus',
    label: '关注客户',
    hint: '需要重点跟进的高价值客户。',
    countLabel: '8',
  },
  {
    key: 'cooperating',
    label: '合作客户',
    hint: '处于持续合作或复购链路的客户。',
    countLabel: '16',
  },
  {
    key: 'potential',
    label: '潜在客户',
    hint: '新激活或重新激活的客户。',
    countLabel: '28',
  },
  {
    key: 'intent',
    label: '意向客户',
    hint: '正在讨论报价、样品、PI 或付款的客户。',
    countLabel: '13',
  },
  {
    key: 'key',
    label: '重点客户',
    hint: '需要更严密跟进节奏的战略客户。',
    countLabel: '6',
  },
  {
    key: 'normal',
    label: '普通客户',
    hint: '标准维护中的客户池。',
    countLabel: '14',
  },
  {
    key: 'long-tail',
    label: '零散客户',
    hint: '低频往来但仍需维护的客户。',
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
    label: '邮件',
    description: '邮件工作台',
    heroTitle: '将邮箱收发、跟进和客户归档放到同一个操作面。',
    heroDescription:
      '邮件视角承接收件箱、待回复、标签、文件夹、CRM 关联和 AI 辅助，目标是把 amainCRM 的 email 模块升级为真正可执行的工作台。',
    listTitle: '邮件列表',
    sidebarTitle: '邮件视图',
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
    label: '客户',
    description: '客户邮件视角',
    heroTitle: '从客户维度查看往来邮件，而不是只看单条线程。',
    heroDescription:
      '客户视角把邮件活动聚合到客户和联系人层，便于销售快速识别最近往来、沉默客户和需要回推到商机的沟通。',
    listTitle: '客户邮件池',
    sidebarTitle: '客户分组',
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
    label: '开发信',
    description: '开发信系统',
    heroTitle: '开发信不是模板页，而是一套完整的发送和运营系统。',
    heroDescription:
      '开发信视角覆盖受众、模板、活动、发送任务、发信池、退信、分析、报表与合规，在 Twenty 邮件内核之上构建完整前端工作台。',
    listTitle: '开发信任务',
    sidebarTitle: '开发信导航',
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
