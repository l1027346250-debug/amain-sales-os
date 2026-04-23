import {
  getTradeCrmCustomerConfigPath,
  getTradeCrmCustomerPath,
  tradeCrmCustomerConfigSections,
  tradeCrmCustomerRouteLabels,
  type TradeCrmCustomerConfigSection,
} from '@/trade-crm/customers/utils/tradeCrmCustomerRouting';
import { type FilterSidebarItem } from '@/trade-crm/shared/components/FilterSidebar';
import { type PageHeaderTab } from '@/trade-crm/shared/components/PageHeaderTabs';

export type TradeCrmCustomerPrimaryTabKey =
  | 'dedup'
  | 'detail'
  | 'list'
  | 'public'
  | 'settings';

export const getTradeCrmCustomerPrimaryTabs = (
  activeKey: TradeCrmCustomerPrimaryTabKey,
): PageHeaderTab[] => [
  {
    isActive: activeKey === 'list',
    label: 'Customer List',
    to: getTradeCrmCustomerPath('list'),
  },
  {
    isActive: activeKey === 'public',
    label: 'Public Pool',
    to: getTradeCrmCustomerPath('public'),
  },
  {
    isActive: activeKey === 'dedup',
    label: 'Customer Dedup',
    to: getTradeCrmCustomerPath('dedup'),
  },
  {
    isActive: activeKey === 'settings',
    label: 'Settings',
    to: getTradeCrmCustomerPath('config-public-pool-rules'),
  },
  {
    isActive: activeKey === 'detail',
    label: 'Customer Detail',
  },
];

export const getTradeCrmCustomerSidebarItems = ({
  activePath,
  companyTotalCount,
  pendingConfigSectionKeys = [],
  peopleTotalCount,
}: {
  activePath: string;
  companyTotalCount: number;
  pendingConfigSectionKeys?: string[];
  peopleTotalCount: number;
}): FilterSidebarItem[] => [
  {
    countLabel: `${companyTotalCount}`,
    hint: 'Private customers, ownership, and follow-up queues.',
    isActive: activePath === 'list',
    label: 'Customer List',
    to: getTradeCrmCustomerPath('list'),
  },
  {
    countLabel: `${Math.max(6, Math.floor(companyTotalCount / 4))}`,
    hint: 'Claimable accounts and recycle candidates.',
    isActive: activePath === 'public',
    label: 'Public Pool',
    to: getTradeCrmCustomerPath('public'),
  },
  {
    countLabel: `${Math.max(4, Math.floor(peopleTotalCount / 3))}`,
    hint: 'Pre-claim and pre-import collision checks.',
    isActive: activePath === 'dedup',
    label: 'Customer Dedup',
    to: getTradeCrmCustomerPath('dedup'),
  },
  {
    countLabel: pendingConfigSectionKeys.includes('public-pool-rules')
      ? 'Unsaved'
      : undefined,
    hint: pendingConfigSectionKeys.includes('public-pool-rules')
      ? 'Auto-move rules and recycle policy. Unsaved changes.'
      : 'Auto-move rules and recycle policy.',
    isActive: activePath === 'config-public-pool-rules',
    label: 'Public Pool Rules',
    to: getTradeCrmCustomerPath('config-public-pool-rules'),
  },
  {
    countLabel: pendingConfigSectionKeys.includes('groups')
      ? 'Unsaved'
      : undefined,
    hint: pendingConfigSectionKeys.includes('groups')
      ? 'Customer grouping tree and segment governance. Unsaved changes.'
      : 'Customer grouping tree and segment governance.',
    isActive: activePath === 'config-groups',
    label: 'Groups',
    to: getTradeCrmCustomerPath('config-groups'),
  },
  {
    countLabel: pendingConfigSectionKeys.includes('tags')
      ? 'Unsaved'
      : undefined,
    hint: pendingConfigSectionKeys.includes('tags')
      ? 'Company, personal, and subordinate tag dictionaries. Unsaved changes.'
      : 'Company, personal, and subordinate tag dictionaries.',
    isActive: activePath === 'config-tags',
    label: 'Tags',
    to: getTradeCrmCustomerPath('config-tags'),
  },
  {
    countLabel: pendingConfigSectionKeys.includes('sources')
      ? 'Unsaved'
      : undefined,
    hint: pendingConfigSectionKeys.includes('sources')
      ? 'Inbound origin dictionary for leads and customers. Unsaved changes.'
      : 'Inbound origin dictionary for leads and customers.',
    isActive: activePath === 'config-sources',
    label: 'Sources',
    to: getTradeCrmCustomerPath('config-sources'),
  },
  {
    countLabel: pendingConfigSectionKeys.includes('matching')
      ? 'Unsaved'
      : undefined,
    hint: pendingConfigSectionKeys.includes('matching')
      ? 'Dedup scoring weights and field priorities. Unsaved changes.'
      : 'Dedup scoring weights and field priorities.',
    isActive: activePath === 'config-matching',
    label: 'Matching',
    to: getTradeCrmCustomerPath('config-matching'),
  },
  {
    countLabel: pendingConfigSectionKeys.includes('import')
      ? 'Unsaved'
      : undefined,
    hint: pendingConfigSectionKeys.includes('import')
      ? 'File upload, mapping, and import job history. Unsaved changes.'
      : 'File upload, mapping, and import job history.',
    isActive: activePath === 'config-import',
    label: 'Import',
    to: getTradeCrmCustomerPath('config-import'),
  },
];

export const getTradeCrmCustomerConfigTabs = (
  activeSection: TradeCrmCustomerConfigSection,
  pendingConfigSectionKeys: string[] = [],
): PageHeaderTab[] =>
  tradeCrmCustomerConfigSections.map((section) => {
    const routeKey = `config-${section}` as const;
    const label = tradeCrmCustomerRouteLabels[routeKey];

    return {
      isActive: activeSection === section,
      label: pendingConfigSectionKeys.includes(section)
        ? `${label} *`
        : label,
      to: getTradeCrmCustomerConfigPath(section),
    };
  });
