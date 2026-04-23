jest.mock('@/trade-crm/customers/utils/tradeCrmCustomerNavigation', () => ({
  getTradeCrmCustomerSidebarItems: jest.fn(() => [
    {
      hint: 'mock hint',
      isActive: true,
      label: 'mock item',
    },
  ]),
}));

import { getTradeCrmCustomerDedupLayoutData } from '@/trade-crm/customers/utils/tradeCrmCustomerDedupLayout';

describe('tradeCrmCustomerDedupLayout', () => {
  it('should build dedup workspace hero and context data', () => {
    const layoutData = getTradeCrmCustomerDedupLayoutData({
      companyTotalCount: 24,
      importDestination: 'customer_list',
      matchingRuleLabel: 'company_name 40% / email 30%',
      peopleTotalCount: 13,
      totalHitCount: 8,
      totalMatchingWeight: 90,
    });

    expect(layoutData.heroPills).toEqual([
      '8 hits',
      '13 contacts',
      '90% configured weight',
    ]);
    expect(layoutData.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Primary fields',
          value: 'company_name 40% / email 30%',
        }),
        expect.objectContaining({
          label: 'Import impact',
          value: 'customer_list',
        }),
      ]),
    );
    expect(layoutData.sidebarTitle).toBe('Customer Module');
    expect(layoutData.workspaceContext).toEqual({
      channel: 'dedup',
      entityType: 'customer',
      stage: 'Customer dedup',
      workspace: 'Customers',
    });
  });
});
