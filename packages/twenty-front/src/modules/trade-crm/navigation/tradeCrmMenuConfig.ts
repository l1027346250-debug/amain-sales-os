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
import { getTradeCrmMailPath } from '@/trade-crm/mail/navigation/trade-crm-mail-navigation';
import {
  getTradeCrmScopedViewPath,
  tradeCrmRouteMap,
} from '@/trade-crm/navigation/tradeCrmRouteMap';

export type TradeCrmMenuKey =
  | 'sales-desk'
  | 'leads'
  | 'customers'
  | 'opportunities'
  | 'mail'
  | 'team'
  | 'automation'
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
    key: 'sales-desk',
    label: 'Sales Desk',
    description: 'Daily seller workspace and action-first execution queues.',
    to: tradeCrmRouteMap.workbench,
    Icon: IconLayoutDashboard,
    children: [
      {
        key: 'sales-desk.my-queue',
        label: 'My Queue',
        to: getTradeCrmScopedViewPath(tradeCrmRouteMap.workbench, 'my-tasks'),
      },
      {
        key: 'sales-desk.first-response-risk',
        label: 'First Response Risk',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.workbench,
          'first-response',
        ),
      },
      {
        key: 'sales-desk.follow-up-due',
        label: 'Follow-up Due',
        to: getTradeCrmScopedViewPath(tradeCrmRouteMap.workbench, 'follow-up'),
      },
      {
        key: 'sales-desk.overdue',
        label: 'Overdue',
        to: getTradeCrmScopedViewPath(tradeCrmRouteMap.workbench, 'overdue'),
      },
      {
        key: 'sales-desk.quote-follow-up',
        label: 'Quote Follow-up',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.opportunities,
          'quotation-follow-up',
        ),
      },
      {
        key: 'sales-desk.stalled-deals',
        label: 'Stalled Deals',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.opportunities,
          'stalled',
        ),
      },
      {
        key: 'sales-desk.manager-review',
        label: 'Manager Review',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.workbench,
          'manager-board',
        ),
        requiresManager: true,
      },
    ],
  },
  {
    key: 'leads',
    label: 'Leads',
    description: 'Acquisition intake, lead queues, and routing work surfaces.',
    to: tradeCrmRouteMap.prospecting,
    Icon: IconTargetArrow,
    children: [
      {
        key: 'leads.lead-pool',
        label: 'Lead Pool',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.prospecting,
          'lead-pool',
        ),
      },
      {
        key: 'leads.channel-leads',
        label: 'Channel Leads',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.prospecting,
          'channel-leads',
        ),
      },
      {
        key: 'leads.untouched',
        label: 'Untouched Leads',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.prospecting,
          'ai-sourced',
        ),
      },
      {
        key: 'leads.due-follow-up',
        label: 'Due Follow-up',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.prospecting,
          'communication-feed',
        ),
      },
      {
        key: 'leads.routing-review',
        label: 'Routing Review',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.prospecting,
          'assignment-routing',
        ),
        requiresManager: true,
      },
      {
        key: 'leads.communication-feed',
        label: 'Communication Feed',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.prospecting,
          'communication-feed',
        ),
      },
    ],
  },
  {
    key: 'customers',
    label: 'Customers',
    description: 'Customer operating center, public pool, dedup, and import.',
    to: getTradeCrmCustomerPath('list'),
    Icon: IconUsers,
    children: [
      {
        key: 'customers.active-customers',
        label: 'Active Customers',
        to: getTradeCrmCustomerPath('list'),
      },
      {
        key: 'customers.public-pool',
        label: 'Public Pool',
        to: getTradeCrmCustomerPath('public'),
      },
      {
        key: 'customers.dedup-center',
        label: 'Dedup Center',
        to: getTradeCrmCustomerPath('dedup'),
      },
      {
        key: 'customers.key-accounts-groups',
        label: 'Key Accounts and Groups',
        to: getTradeCrmCustomerPath('config-groups'),
      },
      {
        key: 'customers.import-center',
        label: 'Import Center',
        to: getTradeCrmCustomerPath('config-import'),
      },
      {
        key: 'customers.customer-settings',
        label: 'Customer Settings',
        to: getTradeCrmCustomerPath('config-tags'),
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
        key: 'opportunities.pipeline',
        label: 'Pipeline',
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
        key: 'opportunities.quote-follow-up',
        label: 'Quote Follow-up',
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
        key: 'opportunities.loss-review',
        label: 'Loss Review',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.opportunities,
          'lost-analysis',
        ),
      },
    ],
  },
  {
    key: 'mail',
    label: 'Mail',
    description: 'Business communication workspace tied to live accounts.',
    to: tradeCrmRouteMap.mail,
    Icon: IconMail,
    children: [
      {
        key: 'mail.inbox',
        label: 'Inbox',
        to: getTradeCrmMailPath({ scope: 'mail', view: 'inbox' }),
      },
      {
        key: 'mail.pending-replies',
        label: 'Pending Replies',
        to: getTradeCrmMailPath({ scope: 'mail', view: 'pending' }),
      },
      {
        key: 'mail.customer-conversations',
        label: 'Customer Conversations',
        to: getTradeCrmMailPath({ scope: 'customer', view: 'recent' }),
      },
      {
        key: 'mail.development-mail',
        label: 'Development Mail',
        to: getTradeCrmMailPath({ scope: 'campaign', view: 'overview' }),
      },
      {
        key: 'mail.tracking',
        label: 'Tracking',
        to: getTradeCrmMailPath({ scope: 'mail', view: 'tracking' }),
      },
    ],
  },
  {
    key: 'team',
    label: 'Team',
    description: 'Execution collaboration, review, and team visibility.',
    to: tradeCrmRouteMap.collaboration,
    Icon: IconCalendarEvent,
    children: [
      {
        key: 'team.tasks',
        label: 'Tasks',
        to: getTradeCrmScopedViewPath(tradeCrmRouteMap.collaboration, 'tasks'),
      },
      {
        key: 'team.calendar',
        label: 'Calendar',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.collaboration,
          'calendar',
        ),
      },
      {
        key: 'team.team-review',
        label: 'Team Review',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.analytics,
          'team-performance',
        ),
        requiresManager: true,
      },
      {
        key: 'team.performance-snapshot',
        label: 'Performance Snapshot',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.analytics,
          'goal-progress',
        ),
        requiresManager: true,
      },
      {
        key: 'team.mail-efficiency',
        label: 'Mail Efficiency',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.analytics,
          'mail-efficiency',
        ),
        requiresManager: true,
      },
    ],
  },
  {
    key: 'automation',
    label: 'Automation',
    description:
      'Routing, reminder, and follow-up rule surfaces for foreign-trade execution.',
    to: tradeCrmRouteMap.settings,
    Icon: IconSettings,
    requiresManager: true,
    children: [
      {
        key: 'automation.lead-routing-rules',
        label: 'Lead Routing Rules',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.settings,
          'assignment-rules',
        ),
        requiresManager: true,
      },
      {
        key: 'automation.follow-up-rules',
        label: 'Follow-up Rules',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.settings,
          'automation-rules',
        ),
        requiresManager: true,
      },
      {
        key: 'automation.public-pool-rules',
        label: 'Public Pool Rules',
        to: getTradeCrmCustomerPath('config-public-pool-rules'),
        requiresManager: true,
      },
      {
        key: 'automation.quote-reminder-rules',
        label: 'Quote Reminder Rules',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.opportunities,
          'quotation-follow-up',
        ),
        requiresManager: true,
      },
      {
        key: 'automation.stalled-deal-rules',
        label: 'Stalled Deal Rules',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.opportunities,
          'stalled',
        ),
        requiresManager: true,
      },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    description:
      'Dictionaries, stages, templates, AI, and integration setup.',
    to: tradeCrmRouteMap.settings,
    Icon: IconChartBar,
    requiresManager: true,
    children: [
      {
        key: 'settings.lead-dictionaries',
        label: 'Lead Dictionaries',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.settings,
          'fields-dictionaries',
        ),
        requiresManager: true,
      },
      {
        key: 'settings.opportunity-stages',
        label: 'Opportunity Stages',
        to: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.settings,
          'stages-status',
        ),
        requiresManager: true,
      },
      {
        key: 'settings.tags-groups',
        label: 'Tags and Groups',
        to: getTradeCrmCustomerPath('config-tags'),
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
        key: 'settings.email-templates',
        label: 'Email Templates',
        to: getTradeCrmMailPath({ scope: 'campaign', view: 'overview' }),
        requiresManager: true,
      },
      {
        key: 'settings.ai-assistants',
        label: 'AI Assistants',
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
