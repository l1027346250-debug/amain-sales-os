import { type IconComponent } from 'twenty-ui/display';
import {
  IconCalendarEvent,
  IconChartBar,
  IconLayoutDashboard,
  IconMail,
  IconSettings,
  IconTarget,
  IconTargetArrow,
  IconUsers,
} from 'twenty-ui/display';

import { getTradeCrmCustomerPath } from '@/trade-crm/customers/utils/tradeCrmCustomerRouting';
import {
  getTradeCrmScopedViewPath,
  tradeCrmRouteMap,
} from '@/trade-crm/navigation/tradeCrmRouteMap';
import { getTradeCrmMailPath } from '@/trade-crm/mail/navigation/trade-crm-mail-navigation';

export type TradeCrmMenuKey =
  | 'workbench'
  | 'prospecting'
  | 'mail'
  | 'customers'
  | 'opportunities'
  | 'collaboration'
  | 'analytics'
  | 'settings';

export type TradeCrmMenuItemConfig = {
  key: TradeCrmMenuKey;
  label: string;
  description: string;
  to: string;
  Icon: IconComponent;
  requiresManager?: boolean;
  children?: TradeCrmMenuSubItemConfig[];
};

export type TradeCrmMenuSubItemConfig = {
  key: string;
  label: string;
  to: string;
  requiresManager?: boolean;
};

export const tradeCrmMenuConfig: TradeCrmMenuItemConfig[] = [
  {
    key: 'workbench',
    label: 'Workbench',
    description: 'Daily seller entry point and priority execution queues.',
    to: tradeCrmRouteMap.workbench,
    Icon: IconLayoutDashboard,
    children: [
      {
        key: 'workbench.my-tasks',
        label: 'My Tasks',
        to: getTradeCrmScopedViewPath(tradeCrmRouteMap.workbench, 'my-tasks'),
      },
      {
        key: 'workbench.first-response',
        label: 'First Response',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.workbench,
          'first-response',
        ),
      },
      {
        key: 'workbench.follow-up',
        label: 'Follow-up',
        to: getTradeCrmScopedViewPath(tradeCrmRouteMap.workbench, 'follow-up'),
      },
      {
        key: 'workbench.overdue',
        label: 'Overdue',
        to: getTradeCrmScopedViewPath(tradeCrmRouteMap.workbench, 'overdue'),
      },
      {
        key: 'workbench.manager-board',
        label: 'Manager Board',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.workbench,
          'manager-board',
        ),
        requiresManager: true,
      },
    ],
  },
  {
    key: 'prospecting',
    label: 'Prospecting',
    description: 'Lead pool, intake channels, and AI-sourced lead workspace.',
    to: tradeCrmRouteMap.prospecting,
    Icon: IconTargetArrow,
    children: [
      {
        key: 'prospecting.lead-pool',
        label: 'Lead Pool',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.prospecting,
          'lead-pool',
        ),
      },
      {
        key: 'prospecting.channel-leads',
        label: 'Channel Leads',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.prospecting,
          'channel-leads',
        ),
      },
      {
        key: 'prospecting.ai-sourced',
        label: 'AI-Sourced Leads',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.prospecting,
          'ai-sourced',
        ),
      },
      {
        key: 'prospecting.communication-feed',
        label: 'Communication Feed',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.prospecting,
          'communication-feed',
        ),
      },
      {
        key: 'prospecting.assignment-routing',
        label: 'Assignment Routing',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.prospecting,
          'assignment-routing',
        ),
        requiresManager: true,
      },
    ],
  },
  {
    key: 'mail',
    label: 'Mail',
    description:
      'Mailbox workspace, customer communication center, and outbound campaign system.',
    to: tradeCrmRouteMap.mail,
    Icon: IconMail,
    children: [
      {
        key: 'mail.inbox',
        label: '收件箱',
        to: getTradeCrmMailPath({ scope: 'mail', view: 'inbox' }),
      },
      {
        key: 'mail.pending',
        label: '待处理邮件',
        to: getTradeCrmMailPath({ scope: 'mail', view: 'pending' }),
      },
      {
        key: 'mail.customer',
        label: '客户视角',
        to: getTradeCrmMailPath({ scope: 'customer', view: 'recent' }),
      },
      {
        key: 'mail.campaign',
        label: '开发信',
        to: getTradeCrmMailPath({ scope: 'campaign', view: 'overview' }),
      },
      {
        key: 'mail.tracking',
        label: '追踪信息',
        to: getTradeCrmMailPath({ scope: 'mail', view: 'tracking' }),
      },
    ],
  },
  {
    key: 'customers',
    label: 'Customers',
    description: 'Customer operations center, public pool, dedup, and settings.',
    to: getTradeCrmCustomerPath('list'),
    Icon: IconUsers,
    children: [
      {
        key: 'customers.list',
        label: 'Customer List',
        to: getTradeCrmCustomerPath('list'),
      },
      {
        key: 'customers.public',
        label: 'Public Pool',
        to: getTradeCrmCustomerPath('public'),
      },
      {
        key: 'customers.dedup',
        label: 'Customer Dedup',
        to: getTradeCrmCustomerPath('dedup'),
      },
      {
        key: 'customers.tags',
        label: 'Tag Settings',
        to: getTradeCrmCustomerPath('config-tags'),
      },
      {
        key: 'customers.import',
        label: 'Import Center',
        to: getTradeCrmCustomerPath('config-import'),
      },
    ],
  },
  {
    key: 'opportunities',
    label: 'Opportunities',
    description:
      'Pipeline progression, quotation follow-up, and stalled review.',
    to: tradeCrmRouteMap.opportunities,
    Icon: IconTarget,
    children: [
      {
        key: 'opportunities.pipeline-board',
        label: 'Pipeline Board',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.opportunities,
          'pipeline-board',
        ),
      },
      {
        key: 'opportunities.my-opportunities',
        label: 'My Opportunities',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.opportunities,
          'my-opportunities',
        ),
      },
      {
        key: 'opportunities.quotation-follow-up',
        label: 'Quotation Follow-up',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.opportunities,
          'quotation-follow-up',
        ),
      },
      {
        key: 'opportunities.stalled',
        label: 'Stalled',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.opportunities,
          'stalled',
        ),
      },
      {
        key: 'opportunities.lost-analysis',
        label: 'Lost Analysis',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.opportunities,
          'lost-analysis',
        ),
      },
    ],
  },
  {
    key: 'collaboration',
    label: 'Collaboration',
    description: 'Tasks, calendar rhythm, and cross-team execution support.',
    to: tradeCrmRouteMap.collaboration,
    Icon: IconCalendarEvent,
    children: [
      {
        key: 'collaboration.tasks',
        label: 'Tasks',
        to: getTradeCrmScopedViewPath(tradeCrmRouteMap.collaboration, 'tasks'),
      },
      {
        key: 'collaboration.calendar',
        label: 'Calendar',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.collaboration,
          'calendar',
        ),
      },
      {
        key: 'collaboration.approvals',
        label: 'Approvals',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.collaboration,
          'approvals',
        ),
        requiresManager: true,
      },
    ],
  },
  {
    key: 'analytics',
    label: 'Team Data',
    description:
      'Manager views for conversion, execution, and team operations.',
    to: tradeCrmRouteMap.analytics,
    Icon: IconChartBar,
    requiresManager: true,
    children: [
      {
        key: 'analytics.goal-progress',
        label: 'Goal Progress',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.analytics,
          'goal-progress',
        ),
        requiresManager: true,
      },
      {
        key: 'analytics.lead-conversion',
        label: 'Lead Conversion',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.analytics,
          'lead-conversion',
        ),
        requiresManager: true,
      },
      {
        key: 'analytics.mail-efficiency',
        label: 'Mail Efficiency',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.analytics,
          'mail-efficiency',
        ),
        requiresManager: true,
      },
      {
        key: 'analytics.pipeline-funnel',
        label: 'Pipeline Funnel',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.analytics,
          'pipeline-funnel',
        ),
        requiresManager: true,
      },
      {
        key: 'analytics.team-performance',
        label: 'Team Performance',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.analytics,
          'team-performance',
        ),
        requiresManager: true,
      },
      {
        key: 'analytics.source-impact',
        label: 'Source Impact',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.analytics,
          'source-impact',
        ),
        requiresManager: true,
      },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    description:
      'Fields, stages, routing rules, AI, and integration configuration.',
    to: tradeCrmRouteMap.settings,
    Icon: IconSettings,
    requiresManager: true,
    children: [
      {
        key: 'settings.fields-dictionaries',
        label: 'Fields and Dictionaries',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.settings,
          'fields-dictionaries',
        ),
        requiresManager: true,
      },
      {
        key: 'settings.stages-status',
        label: 'Stages and Status',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.settings,
          'stages-status',
        ),
        requiresManager: true,
      },
      {
        key: 'settings.assignment-rules',
        label: 'Assignment Rules',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.settings,
          'assignment-rules',
        ),
        requiresManager: true,
      },
      {
        key: 'settings.sources-dedup',
        label: 'Sources and Dedup',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.settings,
          'sources-dedup',
        ),
        requiresManager: true,
      },
      {
        key: 'settings.automation-rules',
        label: 'Automation Rules',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.settings,
          'automation-rules',
        ),
        requiresManager: true,
      },
      {
        key: 'settings.ai-config',
        label: 'AI Config',
        to: getTradeCrmScopedViewPath(tradeCrmRouteMap.settings, 'ai-config'),
        requiresManager: true,
      },
      {
        key: 'settings.integrations',
        label: 'Integrations',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.settings,
          'integrations',
        ),
        requiresManager: true,
      },
    ],
  },
];
