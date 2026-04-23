jest.mock('@/trade-crm/customers/utils/tradeCrmCustomerNavigation', () => ({
  getTradeCrmCustomerSidebarItems: jest.fn(() => [
    {
      hint: 'mock hint',
      isActive: true,
      label: 'mock item',
    },
  ]),
}));

import { getTradeCrmCustomerListLayoutData } from '@/trade-crm/customers/utils/tradeCrmCustomerListLayout';
import { tradeCrmRouteMap } from '@/trade-crm/navigation/tradeCrmRouteMap';

describe('tradeCrmCustomerListLayout', () => {
  it('should build list workspace hero and context data', () => {
    const layoutData = getTradeCrmCustomerListLayoutData({
      companyTotalCount: 24,
      filteredCompanyCount: 11,
      filteredPeopleCount: 7,
      materialAlignmentNotice: 'Use saved URLs instead of local filename aliases.',
      peopleTotalCount: 13,
      publicPoolRuleInactivityDays: 45,
      publicPoolRuleName: 'Recycle idle customers',
      totalOpportunityCount: 9,
      totalTaskCount: 14,
      totalTasksDueTodayCount: 5,
    });

    expect(layoutData.heroPills).toEqual([
      '11 companies',
      '7 contacts',
      '9 opportunities',
      '14 tasks',
    ]);
    expect(layoutData.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Current anchor',
          value: 'Company customer',
        }),
        expect.objectContaining({
          label: 'Public-pool rule',
          value: 'Recycle idle customers',
        }),
      ]),
    );
    expect(layoutData.sidebarTitle).toBe('Customer Module');
    expect(layoutData.workspaceContext).toEqual({
      channel: 'ownership-and-follow-up',
      entityType: 'customer',
      pathname: tradeCrmRouteMap.customers,
      stage: 'Customer list',
      workspace: 'Customers',
    });
  });
});
