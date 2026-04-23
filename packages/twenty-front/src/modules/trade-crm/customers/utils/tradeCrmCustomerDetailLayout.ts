import { type CustomerWorkspaceInsight } from '@/trade-crm/customers/components/TradeCrmCustomerWorkspaceLayout';
import { getTradeCrmCustomerSidebarItems } from '@/trade-crm/customers/utils/tradeCrmCustomerNavigation';
import { type FilterSidebarItem } from '@/trade-crm/shared/components/FilterSidebar';
import { type TradeWorkspaceContext } from '@/trade-crm/shared/TradeWorkspaceContext';

type TradeCrmCustomerDetailLayoutData = {
  heroDescription: string;
  heroPills: string[];
  heroTitle: string;
  insights: CustomerWorkspaceInsight[];
  sidebarItems: FilterSidebarItem[];
  sidebarTitle: string;
  workspaceContext: TradeWorkspaceContext;
};

export const getTradeCrmCustomerDetailLayoutData = ({
  companyTotalCount,
  countryLabel,
  customerId,
  displayName,
  opportunityCount,
  ownerLabel,
  peopleCount,
  peopleTotalCount,
  taskCount,
}: {
  companyTotalCount: number;
  countryLabel: string | null | undefined;
  customerId: string;
  displayName: string | null | undefined;
  opportunityCount: number;
  ownerLabel: string | null | undefined;
  peopleCount: number;
  peopleTotalCount: number;
  taskCount: number;
}): TradeCrmCustomerDetailLayoutData => {
  const resolvedDisplayName = displayName ?? 'Customer detail';

  return {
    heroDescription:
      'This routed detail page is the stable customer-module handoff into company customer records. Customer timeline, public-pool state, import audit, and related commercial data surface together here.',
    heroPills: [
      'Company customer',
      countryLabel ?? 'Country pending',
      ownerLabel ?? 'Owner pending',
      `${opportunityCount} related deals`,
    ],
    heroTitle: resolvedDisplayName,
    insights: [
      {
        description:
          'Person-prefixed legacy routes now resolve into the linked company customer detail or fall back to the customer list.',
        label: 'Route payload',
        value: customerId,
      },
      {
        description:
          'This detail shell stays anchored to live company records, with people rendered as contact coverage instead of parallel customer masters.',
        label: 'Source record',
        value: 'Company',
      },
      {
        description:
          'Detail panels now prioritize records that match the current company, point of contact, and task targets.',
        label: 'Scoped records',
        value: `${peopleCount} contacts / ${taskCount} tasks`,
      },
    ],
    sidebarItems: getTradeCrmCustomerSidebarItems({
      activePath: 'list',
      companyTotalCount,
      peopleTotalCount,
    }),
    sidebarTitle: 'Customer Module',
    workspaceContext: {
      channel: 'detail',
      entityId: customerId,
      entityType: 'customer',
      stage: resolvedDisplayName,
      workspace: 'Customers',
    },
  };
};
