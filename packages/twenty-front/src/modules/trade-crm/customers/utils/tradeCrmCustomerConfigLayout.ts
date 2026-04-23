import { type CustomerWorkspaceInsight } from '@/trade-crm/customers/components/TradeCrmCustomerWorkspaceLayout';
import { getTradeCrmCustomerSidebarItems } from '@/trade-crm/customers/utils/tradeCrmCustomerNavigation';
import {
  tradeCrmCustomerRouteLabels,
  type TradeCrmCustomerConfigSection,
} from '@/trade-crm/customers/utils/tradeCrmCustomerRouting';
import { type FilterSidebarItem } from '@/trade-crm/shared/components/FilterSidebar';
import { type TradeWorkspaceContext } from '@/trade-crm/shared/TradeWorkspaceContext';

type TradeCrmCustomerConfigLayoutData = {
  heroDescription: string;
  heroPills: string[];
  heroTitle: string;
  insights: CustomerWorkspaceInsight[];
  sidebarItems: FilterSidebarItem[];
  sidebarTitle: string;
  workspaceContext: TradeWorkspaceContext;
};

export const getTradeCrmCustomerConfigLayoutData = ({
  activeSection,
  companyTotalCount,
  pendingConfigSectionKeys,
  peopleTotalCount,
}: {
  activeSection: TradeCrmCustomerConfigSection;
  companyTotalCount: number;
  pendingConfigSectionKeys: string[];
  peopleTotalCount: number;
}): TradeCrmCustomerConfigLayoutData => {
  const sectionLabel = tradeCrmCustomerRouteLabels[`config-${activeSection}`];

  return {
    heroDescription:
      'Public-pool rules, groups, tags, sources, matching, and import now have canonical URLs backed by workspace persistence. This keeps the customer module operating as a real configuration center.',
    heroPills: [
      `${companyTotalCount} companies`,
      `${peopleTotalCount} contacts`,
      sectionLabel,
    ],
    heroTitle:
      'Run customer configuration inside a dedicated control layer with stable deep links for each settings slice.',
    insights: [
      {
        description:
          'Each configuration concern now has a stable route instead of sharing one generic workspace tab.',
        label: 'Config slice',
        value: sectionLabel,
      },
      {
        description:
          'Customer settings now persist in workspace records instead of browser-local drafts.',
        label: 'Operational rule',
        value: 'Persist to workspace',
      },
    ],
    sidebarItems: getTradeCrmCustomerSidebarItems({
      activePath: `config-${activeSection}`,
      companyTotalCount,
      pendingConfigSectionKeys,
      peopleTotalCount,
    }),
    sidebarTitle: 'Customer Module',
    workspaceContext: {
      channel: activeSection,
      entityType: 'customer-config',
      stage: sectionLabel,
      workspace: 'Customers',
    },
  };
};
