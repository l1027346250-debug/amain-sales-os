jest.mock('@/trade-crm/customers/utils/tradeCrmCustomerNavigation', () => ({
  getTradeCrmCustomerSidebarItems: jest.fn(() => [
    {
      hint: 'mock hint',
      isActive: true,
      label: 'mock item',
    },
  ]),
}));

import { getTradeCrmCustomerDetailLayoutData } from '@/trade-crm/customers/utils/tradeCrmCustomerDetailLayout';

describe('tradeCrmCustomerDetailLayout', () => {
  it('should build detail workspace hero and context data', () => {
    const layoutData = getTradeCrmCustomerDetailLayoutData({
      companyTotalCount: 20,
      countryLabel: 'Germany',
      customerId: 'org_123',
      displayName: 'Acme GmbH',
      opportunityCount: 4,
      ownerLabel: 'Alice',
      peopleCount: 3,
      peopleTotalCount: 12,
      taskCount: 5,
    });

    expect(layoutData.heroTitle).toBe('Acme GmbH');
    expect(layoutData.heroPills).toEqual([
      'Company customer',
      'Germany',
      'Alice',
      '4 related deals',
    ]);
    expect(layoutData.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Route payload',
          value: 'org_123',
        }),
        expect.objectContaining({
          label: 'Scoped records',
          value: '3 contacts / 5 tasks',
        }),
      ]),
    );
    expect(layoutData.workspaceContext).toEqual({
      channel: 'detail',
      entityId: 'org_123',
      entityType: 'customer',
      stage: 'Acme GmbH',
      workspace: 'Customers',
    });
  });
});
