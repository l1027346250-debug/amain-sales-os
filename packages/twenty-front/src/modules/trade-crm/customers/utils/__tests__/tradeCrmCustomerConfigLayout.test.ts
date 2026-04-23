jest.mock('@/trade-crm/customers/utils/tradeCrmCustomerNavigation', () => ({
  getTradeCrmCustomerSidebarItems: jest.fn(() => [
    {
      hint: 'mock hint',
      isActive: true,
      label: 'mock item',
    },
  ]),
}));

jest.mock('@/trade-crm/customers/utils/tradeCrmCustomerRouting', () => ({
  tradeCrmCustomerRouteLabels: {
    'config-groups': 'Groups',
    'config-import': 'Import',
    'config-matching': 'Matching',
    'config-public-pool-rules': 'Public Pool Rules',
    'config-sources': 'Sources',
    'config-tags': 'Tags',
  },
}));

import { getTradeCrmCustomerConfigLayoutData } from '@/trade-crm/customers/utils/tradeCrmCustomerConfigLayout';

describe('tradeCrmCustomerConfigLayout', () => {
  it('should build config workspace hero and context data', () => {
    const layoutData = getTradeCrmCustomerConfigLayoutData({
      activeSection: 'sources',
      companyTotalCount: 18,
      pendingConfigSectionKeys: ['sources'],
      peopleTotalCount: 9,
    });

    expect(layoutData.heroPills).toEqual([
      '18 companies',
      '9 contacts',
      'Sources',
    ]);
    expect(layoutData.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Config slice',
          value: 'Sources',
        }),
      ]),
    );
    expect(layoutData.sidebarTitle).toBe('Customer Module');
    expect(layoutData.workspaceContext).toEqual({
      channel: 'sources',
      entityType: 'customer-config',
      stage: 'Sources',
      workspace: 'Customers',
    });
  });
});
