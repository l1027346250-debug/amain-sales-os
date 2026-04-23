jest.mock('@/trade-crm/customers/utils/tradeCrmCustomerNavigation', () => ({
  getTradeCrmCustomerSidebarItems: jest.fn(() => [
    {
      hint: 'mock hint',
      isActive: true,
      label: 'mock item',
    },
  ]),
}));

import { getTradeCrmCustomerPublicPoolLayoutData } from '@/trade-crm/customers/utils/tradeCrmCustomerPublicPoolLayout';

describe('tradeCrmCustomerPublicPoolLayout', () => {
  it('should build public-pool workspace hero and context data', () => {
    const layoutData = getTradeCrmCustomerPublicPoolLayoutData({
      companyTotalCount: 24,
      filteredPublicPoolCount: 6,
      notifyOwnersFirst: true,
      peopleTotalCount: 13,
      publicPoolGroup: 'Dormant Accounts',
      publicPoolRuleInactivityDays: 60,
      publicPoolRuleName: 'Recycle unworked customers',
      publicPoolStageScopeLabel: 'Quoted, Negotiation',
      totalPublicPoolCount: 18,
    });

    expect(layoutData.heroPills).toEqual([
      '6 claimable',
      '18 already pooled',
      '60 day rule',
      'Dormant Accounts',
    ]);
    expect(layoutData.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Ownership rule',
          value: 'Recycle unworked customers',
        }),
        expect.objectContaining({
          label: 'Configured scope',
          value: 'Quoted, Negotiation',
        }),
      ]),
    );
    expect(layoutData.sidebarTitle).toBe('Customer Module');
    expect(layoutData.workspaceContext).toEqual({
      channel: 'public-pool',
      entityType: 'customer',
      stage: 'Public pool',
      workspace: 'Customers',
    });
  });
});
