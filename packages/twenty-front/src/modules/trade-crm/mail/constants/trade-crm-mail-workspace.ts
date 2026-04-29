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
  | 'pending-replies'
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
  | 'sequences'
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
  section: string;
  countLabel?: string;
};

export type TradeCrmMailListItem = {
  id: string;
  primary: string;
  secondary: string;
  tertiary: string;
  meta: string;
  status: string;
  isPending?: boolean;
  pendingReason?: string | null;
  pendingUpdatedAt?: string | null;
  href?: string;
  threadId?: string;
  senderPoolMode?: string;
  tags?: string[];
  personRecordId?: string;
  personRecordHref?: string;
  customerRecordId?: string;
  customerRecordHref?: string;
  opportunityRecordId?: string;
  opportunityRecordHref?: string;
  primaryRecordHref?: string;
  primaryRecordLabel?: string;
  secondaryRecordHref?: string;
  secondaryRecordLabel?: string;
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
  heroSummaryTitle: string;
  heroSummaryText: string;
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
    hint: '真实邮箱主收件区，优先处理客户来信与报价回复。',
    section: '核心邮箱',
    countLabel: '753',
  },
  {
    key: 'pending',
    label: '待处理邮件',
    hint: '等待跟进、需要回信或需要回填 CRM 的线程。',
    section: '核心邮箱',
    countLabel: '126',
  },
  {
    key: 'unread',
    label: '未读邮件',
    hint: '尚未完成首轮分拣的新来信。',
    section: '核心邮箱',
    countLabel: '87',
  },
  {
    key: 'drafts',
    label: '草稿箱',
    hint: '等待人工确认或补充上下文的草稿。',
    section: '核心邮箱',
    countLabel: '18',
  },
  {
    key: 'sent',
    label: '发件箱',
    hint: '外发与回信历史，用于回溯沟通动作。',
    section: '核心邮箱',
    countLabel: '342',
  },
  {
    key: 'bulk-outbox',
    label: '群发箱',
    hint: '开发信和批量外发的发送结果与复盘入口。',
    section: '核心邮箱',
    countLabel: '24',
  },
  {
    key: 'folders',
    label: '文件夹',
    hint: '系统文件夹与自定义文件夹的整理入口。',
    section: '组织与规则',
  },
  {
    key: 'tagged',
    label: '标签邮件',
    hint: '按客户、商机、风险或业务主题聚合邮件。',
    section: '组织与规则',
    countLabel: '11',
  },
  {
    key: 'trash',
    label: '垃圾箱',
    hint: '可恢复的已删除邮件。',
    section: '组织与规则',
  },
  {
    key: 'spam',
    label: '垃圾邮件',
    hint: '疑似风险邮件与过滤结果。',
    section: '组织与规则',
  },
  {
    key: 'tracking',
    label: '追踪',
    hint: '同步状态、送达结果与关键动作追踪。',
    section: '组织与规则',
  },
  {
    key: 'search',
    label: '高级搜索',
    hint: '按发件人、主题、客户、时间与标签搜索。',
    section: '组织与规则',
  },
  {
    key: 'mobile-handle',
    label: '移动处理',
    hint: '移动端快速处理队列与轻量操作入口。',
    section: '组织与规则',
  },
  {
    key: 'accounts',
    label: '邮箱账号',
    hint: '邮箱连接、授权、配额与同步健康度。',
    section: '基础设置',
  },
  {
    key: 'domains',
    label: '发信域名',
    hint: 'SPF、DKIM、DMARC 与发信准备度设置。',
    section: '基础设置',
  },
];

const customerSidebarItems: TradeCrmMailSidebarItem[] = [
  {
    key: 'recent',
    label: '最近 7 天往来',
    hint: '近一周有邮件来往的客户与联系人。',
    section: '客户分层',
    countLabel: '42',
  },
  {
    key: 'focus',
    label: '关注客户',
    hint: '需要优先推进的重点客户。',
    section: '客户分层',
    countLabel: '8',
  },
  {
    key: 'cooperating',
    label: '合作客户',
    hint: '处于持续合作或复购链路的客户。',
    section: '客户分层',
    countLabel: '16',
  },
  {
    key: 'potential',
    label: '潜在客户',
    hint: '新激活或重新激活中的客户。',
    section: '客户分层',
    countLabel: '28',
  },
  {
    key: 'intent',
    label: '意向客户',
    hint: '正在讨论报价、样品、PI 或付款的客户。',
    section: '客户分层',
    countLabel: '13',
  },
  {
    key: 'key',
    label: '重点客户',
    hint: '需要更严密推进节奏的战略客户。',
    section: '客户分层',
    countLabel: '6',
  },
  {
    key: 'normal',
    label: '普通客户',
    hint: '标准维护中的客户池。',
    section: '客户分层',
    countLabel: '14',
  },
  {
    key: 'long-tail',
    label: '零散客户',
    hint: '低频往来但仍需维护的客户。',
    section: '客户分层',
    countLabel: '19',
  },
];

const subordinateSidebarItems: TradeCrmMailSidebarItem[] = [
  {
    key: 'recent',
    label: 'My Team',
    hint: 'Review the latest mail activity across direct-report sellers.',
    section: 'Subordinate queues',
    countLabel: '12',
  },
  {
    key: 'focus',
    label: 'Needs Review',
    hint: 'Escalate threads that still need manager review or owner correction.',
    section: 'Subordinate queues',
    countLabel: '5',
  },
  {
    key: 'pending-replies',
    label: 'Pending Handoff',
    hint: 'Catch threads that are waiting on team follow-up or reassignment.',
    section: 'Subordinate queues',
    countLabel: '9',
  },
  {
    key: 'long-tail',
    label: 'Low Activity',
    hint: 'Scan quiet subordinate accounts before they drift out of cadence.',
    section: 'Subordinate queues',
    countLabel: '18',
  },
];

const campaignSidebarItems: TradeCrmMailSidebarItem[] = [
  {
    key: 'campaigns',
    label: 'Campaigns',
    hint: '活动编排、发送窗口、AB 试验与执行状态。',
    section: '工作台',
    countLabel: '14',
  },
  {
    key: 'jobs',
    label: 'Send Queue',
    hint: '任务队列、重试、限速与执行观察。',
    section: '工作台',
    countLabel: '3,812',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    hint: '送达、打开、点击、回复与投诉数据。',
    section: '工作台',
  },
  {
    key: 'overview',
    label: 'Overview',
    hint: '总览当前发送压力、域名健康度与风险。',
    section: '工作台',
  },
  {
    key: 'audiences',
    label: 'Audiences',
    hint: '收件人列表、订阅状态与来源管理。',
    section: '受众与内容',
    countLabel: '5,420',
  },
  {
    key: 'groups',
    label: 'Groups & Tags',
    hint: '分组、标签、筛选规则与投放策略。',
    section: '受众与内容',
    countLabel: '126',
  },
  {
    key: 'templates',
    label: 'Templates',
    hint: '主题、正文、变量、版本与测试发送。',
    section: '受众与内容',
    countLabel: '32',
  },
  {
    key: 'sender-pool',
    label: 'Sender Pool',
    hint: '发件账号池、轮转策略与容量控制。',
    section: '发送基础设施',
    countLabel: '12',
  },
  {
    key: 'domains',
    label: 'Domains',
    hint: '域名验证、信誉、DNS 与通道准备度。',
    section: '发送基础设施',
    countLabel: '4',
  },
  {
    key: 'bounces',
    label: 'Bounces & Complaints',
    hint: '硬退、软退、投诉回流与暂停机制。',
    section: '发送基础设施',
    countLabel: '37',
  },
  {
    key: 'unsubscribes',
    label: 'Unsubscribes',
    hint: '退订、全局抑制与合规名单。',
    section: '发送基础设施',
    countLabel: '63',
  },
  {
    key: 'reports',
    label: 'Reports',
    hint: 'CSV、Excel、PDF 报表与导出审计。',
    section: '治理与审计',
  },
  {
    key: 'compliance',
    label: 'Compliance',
    hint: '安全策略、GDPR、审计日志与授权边界。',
    section: '治理与审计',
  },
  {
    key: 'webhooks',
    label: 'Webhooks',
    hint: '回调投递、签名校验与事件接入。',
    section: '治理与审计',
  },
  {
    key: 'monitoring',
    label: 'Monitoring',
    hint: '系统吞吐、失败率、告警与运行监控。',
    section: '治理与审计',
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
    heroTitle: '把收件、回信、归档和客户上下文放进同一个邮件操作台。',
    heroDescription:
      '邮件视角承接收件箱、待处理、标签、文件夹、CRM 关联和 AI 辅助，目标是把 amainCRM 的 email 模块升级成可持续使用的业务工作台。',
    heroSummaryTitle: '当前工作区',
    heroSummaryText:
      '这里优先解决真实邮箱接入、线程处理效率和 CRM 回填，不再保留空壳式入口页。',
    listTitle: '邮件列表',
    sidebarTitle: '邮件导航',
    defaultViewKey: 'inbox',
    sidebarItems: mailSidebarItems,
    metrics: [
      {
        label: 'Connected inboxes',
        value: '3',
        description: '当前已接入并可同步的邮箱账号数量。',
      },
      {
        label: 'Healthy channels',
        value: '2/3',
        description: '同步稳定且可继续承载业务的通道。',
      },
      {
        label: 'Threads in queue',
        value: '126',
        description: '等待卖家决策、回复或回填 CRM 的线程。',
      },
    ],
    actionCards: [
      {
        title: '打开邮箱账号',
        description: '查看邮箱连接、授权异常、同步错误和配额使用。',
        actionLabel: '打开账号设置',
        to: getSettingsPath(SettingsPath.AccountsEmails),
      },
      {
        title: '打开发信域名',
        description: '检查 SPF、DKIM、DMARC 与发信准备度。',
        actionLabel: '打开域名设置',
        to: getSettingsPath(SettingsPath.Domains),
      },
      {
        title: '打开任务工作区',
        description: '将回信压力和跟进动作推回 CRM 任务队列。',
        actionLabel: '打开任务',
        to: AppPath.TasksPage,
      },
    ],
    listItems: [
      {
        id: 'mail-1',
        threadId: '20202020-0d01-4e7c-8001-123456789def',
        primary: 'James Fischer <james@example.com>',
        secondary: 'Re: Quotation of the art design',
        tertiary:
          '客户已经回复并询问样品时间，报价附件与商机阶段需要一起复核。',
        meta: '2h ago · linked customer · active opportunity',
        status: 'Reply needed',
        personRecordId: '29baa328-8e0c-4dc4-983d-f9393d701ec0',
        customerRecordId: '0c0c525f-8814-4201-89ec-e14aef578f24',
        opportunityRecordId: '5cba6b52-431d-4436-b6b7-27a84cdc19b7',
      },
      {
        id: 'mail-2',
        threadId: '20202020-0d02-4e7c-8001-123456789def',
        primary: 'Raymond Zhao <raymond@buyer.com>',
        secondary: 'Unlock New Opportunities',
        tertiary:
          '这是开发信后的第一次人工回复，客户档案和后续跟进任务尚未建立。',
        meta: '4h ago · not linked to CRM',
        status: 'Create customer',
      },
      {
        id: 'mail-3',
        threadId: '20202020-0d03-4e7c-8001-123456789def',
        primary: 'System <noreply@example.com>',
        secondary: 'Shipping reminder',
        tertiary: '系统邮件应通过规则自动归档，不应长期停留在卖家待处理队列。',
        meta: '6h ago · system mail',
        status: 'Archive by rule',
      },
    ],
  },
  customer: {
    key: 'customer',
    label: '客户',
    description: '客户邮件工作台',
    heroTitle: '从客户视角管理邮件，而不是只盯着单条线程。',
    heroDescription:
      '客户视角把最近往来、分组状态、活跃线程和下一步动作聚合到客户层，方便销售快速识别重点客户、沉默客户和需要推进回商机的沟通。',
    heroSummaryTitle: '当前工作区',
    heroSummaryText:
      '这里强调客户分层和联系历史，邮件不再是孤立消息，而是客户经营的一部分。',
    listTitle: '客户邮件池',
    sidebarTitle: '客户分层',
    defaultViewKey: 'recent',
    sidebarItems: customerSidebarItems,
    metrics: [
      {
        label: 'Customers with mail',
        value: '42',
        description: '最近存在邮件往来的客户账户数。',
      },
      {
        label: 'Silent key accounts',
        value: '5',
        description: '高价值但近期没有推进动作的客户。',
      },
      {
        label: 'Linked opportunities',
        value: '61',
        description: '已关联到活跃商机的客户邮件线程。',
      },
    ],
    actionCards: [
      {
        title: '打开客户工作区',
        description: '从客户邮件进入完整客户工作台继续处理。',
        actionLabel: '打开客户',
        to: tradeCrmRouteMap.customers,
      },
      {
        title: '打开商机工作区',
        description: '处理报价、样品、PI、付款和交付相关线程。',
        actionLabel: '打开商机',
        to: tradeCrmRouteMap.opportunities,
      },
      {
        title: '打开高级搜索',
        description: '按客户、联系人、附件、主题和时间范围检索。',
        actionLabel: '打开搜索',
        to: getTradeCrmMailPath({ scope: 'mail', view: 'search' }),
      },
    ],
    listItems: [
      {
        id: 'customer-1',
        primary: 'VISTA MANUFACTURING',
        secondary: 'Latest thread: Re: Quotation of the art design',
        tertiary:
          '客户刚回复样品与交期问题，需要把联系人、报价历史和下一步动作放在一起看。',
        meta: 'Focus customer · replied 2h ago',
        status: 'Priority follow-up',
      },
      {
        id: 'customer-2',
        primary: '11 Daily Sale Inc.',
        secondary: 'Latest thread: Sample lead time confirmation',
        tertiary: '样品阶段客户已关联商机，但过去 48 小时没有推进动作。',
        meta: 'Potential customer · sample stage',
        status: 'Needs nudge',
      },
      {
        id: 'customer-3',
        primary: 'Arrow Engine Company',
        secondary: 'Latest thread: Payment term discussion',
        tertiary: '付款条款沟通需要和财务协同、风险标签以及回款状态一起呈现。',
        meta: 'Cooperating customer · active this week',
        status: 'Cross-team follow-up',
      },
    ],
  },
  subordinate: {
    key: 'subordinate',
    label: 'Subordinate View',
    description: 'Manager mail review desk',
    heroTitle:
      'Review subordinate mail execution by owner, handoff pressure, and follow-up quality.',
    heroDescription:
      'The subordinate view is the manager surface for checking who replied, who is blocked, and which customer threads still need intervention. It should stay focused on execution, not become a second inbox.',
    heroSummaryTitle: 'Current workspace',
    heroSummaryText:
      'Use this surface to inspect seller mail handling, reassign pressure, and coach follow-up quality without leaving the CRM operating layer.',
    listTitle: 'Subordinate mail queue',
    sidebarTitle: 'Subordinate view',
    defaultViewKey: 'recent',
    sidebarItems: subordinateSidebarItems,
    metrics: [
      {
        label: 'Active sellers',
        value: '12',
        description:
          'Direct-report sellers currently contributing visible mail activity.',
      },
      {
        label: 'Needs review',
        value: '5',
        description:
          'Threads that need manager review, reassignment, or next-step correction.',
      },
      {
        label: 'Pending handoff',
        value: '9',
        description:
          'Threads still waiting for owner follow-up or customer-to-opportunity handoff.',
      },
    ],
    actionCards: [
      {
        title: 'Open Team Tasks',
        description:
          'Jump into the team task queue when mail review needs a concrete follow-up action.',
        actionLabel: 'Open team tasks',
        to: tradeCrmRouteMap.collaboration,
      },
      {
        title: 'Open Customers',
        description:
          'Return to customer context when a subordinate thread should become an account action.',
        actionLabel: 'Open customers',
        to: tradeCrmRouteMap.customers,
      },
      {
        title: 'Open Main Inbox',
        description:
          'Switch back to the inbox when the manager needs raw mailbox context before coaching the owner.',
        actionLabel: 'Open inbox',
        to: getTradeCrmMailPath({ scope: 'mail', view: 'inbox' }),
      },
    ],
    listItems: [
      {
        id: 'subordinate-1',
        primary: 'Tim Apple',
        secondary: 'Latest thread: Re: Quotation for spring sourcing',
        tertiary:
          'Owner has not replied for 14 hours. Customer is already discussing quote timing and sample readiness.',
        meta: 'Needs review · 3 active threads · quote stage',
        status: 'Manager review',
      },
      {
        id: 'subordinate-2',
        primary: 'James Chen',
        secondary: 'Latest thread: Sample lead time confirmation',
        tertiary:
          'Thread is waiting for owner handoff into the customer and opportunity workflow.',
        meta: 'Pending handoff · 2 active threads · sample stage',
        status: 'Reassign or coach',
      },
      {
        id: 'subordinate-3',
        primary: 'Annie Wu',
        secondary: 'Latest thread: Pricing clarification for repeat buyer',
        tertiary:
          'Repeat customer is active again, but the follow-up rhythm has slowed and needs coaching.',
        meta: 'Low activity · repeat customer · active this week',
        status: 'Coaching needed',
      },
    ],
  },
  campaign: {
    key: 'campaign',
    label: '开发信',
    description: '开发信系统',
    heroTitle: '开发信不是模板页，而是一套完整的受众、发送、反馈和治理工作台。',
    heroDescription:
      '开发信视角覆盖受众、模板、活动、发送任务、发件池、退信、退订、分析和报表，在 Twenty 邮件内核之上构建完整的营销与开发信前端工作台。',
    heroSummaryTitle: '当前工作区',
    heroSummaryText:
      '默认直接落到 Campaigns 工作台，先看真实活动执行，再向外扩展到受众、通道与治理层。',
    listTitle: '开发信任务',
    sidebarTitle: '开发信导航',
    defaultViewKey: 'campaigns',
    sidebarItems: campaignSidebarItems,
    metrics: [
      {
        label: 'Active campaigns',
        value: '14',
        description: '运行中、预热中或排队中的开发信活动。',
      },
      {
        label: 'Queued tasks',
        value: '3,812',
        description: '等待 worker 执行、重试或回调处理的任务。',
      },
      {
        label: 'Domain health',
        value: '98.1%',
        description: '综合 SPF、DKIM、DMARC、退信率和投诉率的通道健康度。',
      },
    ],
    actionCards: [
      {
        title: '打开模板工作台',
        description: '管理主题、正文、变量、版本与测试发送。',
        actionLabel: '打开模板',
        to: getTradeCrmMailPath({ scope: 'campaign', view: 'templates' }),
      },
      {
        title: '打开活动工作台',
        description: '配置受众、发送窗口、限速、AB 试验与账号分配。',
        actionLabel: '打开 Campaigns',
        to: getTradeCrmMailPath({ scope: 'campaign', view: 'campaigns' }),
      },
      {
        title: '打开分析工作台',
        description: '查看送达、退信、投诉、退订与 sender pool 健康度。',
        actionLabel: '打开 Analytics',
        to: getTradeCrmMailPath({ scope: 'campaign', view: 'analytics' }),
      },
    ],
    listItems: [
      {
        id: 'campaign-1',
        primary: 'Spring RFQ Outreach 2026',
        secondary: 'Campaign · 2,400 recipients · subject AB running',
        tertiary:
          '需要在一个视图里同时看到受众分段、发送窗口、退订链路和点击追踪。',
        meta: 'sending · Gmail pool 4 / SMTP pool 8',
        status: 'sending',
      },
      {
        id: 'campaign-2',
        primary: 'Re-activation Customers',
        secondary: 'Audience sync pending · 560 recipients',
        tertiary: '名单导入已完成，去重、抑制过滤和域名分配仍待确认。',
        meta: 'queued · suppression ready',
        status: 'queued',
      },
      {
        id: 'campaign-3',
        primary: 'Compliance Watch',
        secondary: 'Bounce and complaint monitor',
        tertiary:
          '持续汇总硬退、软退、投诉和退订事件，并在风险升高时暂停发件池。',
        meta: 'monitoring · webhook verified',
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
