import { type CustomerWorkspaceInsight } from '@/trade-crm/customers/components/TradeCrmCustomerWorkspaceLayout';
import { getTradeCrmCustomerSidebarItems } from '@/trade-crm/customers/utils/tradeCrmCustomerNavigation';
import { type FilterSidebarItem } from '@/trade-crm/shared/components/FilterSidebar';
import { type TradeWorkspaceContext } from '@/trade-crm/shared/TradeWorkspaceContext';

type TradeCrmCustomerDedupLayoutData = {
  heroDescription: string;
  heroPills: string[];
  heroTitle: string;
  insights: CustomerWorkspaceInsight[];
  sidebarItems: FilterSidebarItem[];
  sidebarTitle: string;
  workspaceContext: TradeWorkspaceContext;
};

export const getTradeCrmCustomerDedupLayoutData = ({
  companyTotalCount,
  importDestination,
  matchingRuleLabel,
  peopleTotalCount,
  totalHitCount,
  totalMatchingWeight,
}: {
  companyTotalCount: number;
  importDestination: string;
  matchingRuleLabel: string;
  peopleTotalCount: number;
  totalHitCount: number;
  totalMatchingWeight: number;
}): TradeCrmCustomerDedupLayoutData => ({
  heroDescription:
    'This route is now the canonical target for matching rules and dedup search. It is positioned to receive import collision review and merge actions without mixing those concerns back into list or settings.',
  heroPills: [
    `${totalHitCount} hits`,
    `${peopleTotalCount} contacts`,
    `${totalMatchingWeight}% configured weight`,
  ],
  heroTitle:
    'Make pre-claim and pre-import duplicate checks a first-class customer workflow.',
  insights: [
    {
      description:
        'The backend matching rules will extend this with social links and country weighting.',
      label: 'Primary fields',
      value: matchingRuleLabel || 'No weighted fields configured',
    },
    {
      description:
        'Import should call into the same dedup logic instead of keeping a separate collision model.',
      label: 'Import impact',
      value: importDestination,
    },
  ],
  sidebarItems: getTradeCrmCustomerSidebarItems({
    activePath: 'dedup',
    companyTotalCount,
    peopleTotalCount,
  }),
  sidebarTitle: 'Customer Module',
  workspaceContext: {
    channel: 'dedup',
    entityType: 'customer',
    stage: 'Customer dedup',
    workspace: 'Customers',
  },
});
