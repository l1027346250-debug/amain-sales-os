import { type CustomerWorkspaceInsight } from '@/trade-crm/customers/components/TradeCrmCustomerWorkspaceLayout';
import { getTradeCrmCustomerSidebarItems } from '@/trade-crm/customers/utils/tradeCrmCustomerNavigation';
import { tradeCrmRouteMap } from '@/trade-crm/navigation/tradeCrmRouteMap';
import { type FilterSidebarItem } from '@/trade-crm/shared/components/FilterSidebar';
import { type TradeWorkspaceContext } from '@/trade-crm/shared/TradeWorkspaceContext';

type TradeCrmCustomerListLayoutData = {
  heroDescription: string;
  heroPills: string[];
  heroTitle: string;
  insights: CustomerWorkspaceInsight[];
  sidebarItems: FilterSidebarItem[];
  sidebarTitle: string;
  workspaceContext: TradeWorkspaceContext;
};

export const getTradeCrmCustomerListLayoutData = ({
  companyTotalCount,
  filteredCompanyCount,
  filteredPeopleCount,
  materialAlignmentNotice,
  peopleTotalCount,
  publicPoolRuleInactivityDays,
  publicPoolRuleName,
  totalOpportunityCount,
  totalTaskCount,
  totalTasksDueTodayCount,
}: {
  companyTotalCount: number;
  filteredCompanyCount: number;
  filteredPeopleCount: number;
  materialAlignmentNotice: string;
  peopleTotalCount: number;
  publicPoolRuleInactivityDays: number;
  publicPoolRuleName: string;
  totalOpportunityCount: number;
  totalTaskCount: number;
  totalTasksDueTodayCount: number;
}): TradeCrmCustomerListLayoutData => ({
  heroDescription:
    'This page now behaves like a real customer operations desk: left-side segment tree, central account table, and immediate links into public pool, dedup, and customer detail.',
  heroPills: [
    `${filteredCompanyCount} companies`,
    `${filteredPeopleCount} contacts`,
    `${totalOpportunityCount} opportunities`,
    `${totalTaskCount} tasks`,
  ],
  heroTitle:
    'Operate customers from one working surface, not scattered across records, tasks, and ad-hoc follow-up.',
  insights: [
    {
      description:
        'This rebuild treats company records as the formal customer master while contacts stay visible as related operators.',
      label: 'Current anchor',
      value: 'Company customer',
    },
    {
      description:
        'Follow-up pressure stays in view so the customer list remains an execution page.',
      label: 'Main risk',
      value: `${totalTasksDueTodayCount} due today`,
    },
    {
      description: materialAlignmentNotice,
      label: 'Implementation note',
      value: 'Saved URLs over filenames',
    },
    {
      description: `Configured recycle threshold: ${publicPoolRuleInactivityDays} days.`,
      label: 'Public-pool rule',
      value: publicPoolRuleName,
    },
  ],
  sidebarItems: getTradeCrmCustomerSidebarItems({
    activePath: 'list',
    companyTotalCount,
    peopleTotalCount,
  }),
  sidebarTitle: 'Customer Queues',
  workspaceContext: {
    channel: 'ownership-and-follow-up',
    entityType: 'customer',
    pathname: tradeCrmRouteMap.customers,
    stage: 'Active Customers',
    workspace: 'Customers',
  },
});
