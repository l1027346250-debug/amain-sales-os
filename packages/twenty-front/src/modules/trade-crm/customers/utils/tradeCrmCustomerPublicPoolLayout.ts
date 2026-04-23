import { type CustomerWorkspaceInsight } from '@/trade-crm/customers/components/TradeCrmCustomerWorkspaceLayout';
import { getTradeCrmCustomerSidebarItems } from '@/trade-crm/customers/utils/tradeCrmCustomerNavigation';
import { type FilterSidebarItem } from '@/trade-crm/shared/components/FilterSidebar';
import { type TradeWorkspaceContext } from '@/trade-crm/shared/TradeWorkspaceContext';

type TradeCrmCustomerPublicPoolLayoutData = {
  heroDescription: string;
  heroPills: string[];
  heroTitle: string;
  insights: CustomerWorkspaceInsight[];
  sidebarItems: FilterSidebarItem[];
  sidebarTitle: string;
  workspaceContext: TradeWorkspaceContext;
};

export const getTradeCrmCustomerPublicPoolLayoutData = ({
  companyTotalCount,
  filteredPublicPoolCount,
  peopleTotalCount,
  publicPoolGroup,
  publicPoolRuleInactivityDays,
  publicPoolRuleName,
  publicPoolStageScopeLabel,
  totalPublicPoolCount,
  notifyOwnersFirst,
}: {
  companyTotalCount: number;
  filteredPublicPoolCount: number;
  peopleTotalCount: number;
  publicPoolGroup: string;
  publicPoolRuleInactivityDays: number;
  publicPoolRuleName: string;
  publicPoolStageScopeLabel: string;
  totalPublicPoolCount: number;
  notifyOwnersFirst: boolean;
}): TradeCrmCustomerPublicPoolLayoutData => ({
  heroDescription:
    'This page now carries the operating frame for claim, recycle, and ownership transfer. Rule execution, reclaim actions, and public-pool audit are all available from this workspace.',
  heroPills: [
    `${filteredPublicPoolCount} claimable`,
    `${totalPublicPoolCount} already pooled`,
    `${publicPoolRuleInactivityDays} day rule`,
    publicPoolGroup,
  ],
  heroTitle:
    'Keep public-pool review inside the customer workspace, not hidden behind settings.',
  insights: [
    {
      description:
        'Public pool remains visible as an execution queue rather than a hidden rule screen.',
      label: 'Ownership rule',
      value: publicPoolRuleName,
    },
    {
      description: notifyOwnersFirst
        ? 'Owner reminder is enabled before public-pool transfer.'
        : 'Owner reminder is disabled for direct recycle.',
      label: 'Configured scope',
      value: publicPoolStageScopeLabel,
    },
  ],
  sidebarItems: getTradeCrmCustomerSidebarItems({
    activePath: 'public',
    companyTotalCount,
    peopleTotalCount,
  }),
  sidebarTitle: 'Customer Module',
  workspaceContext: {
    channel: 'public-pool',
    entityType: 'customer',
    stage: 'Public pool',
    workspace: 'Customers',
  },
});
