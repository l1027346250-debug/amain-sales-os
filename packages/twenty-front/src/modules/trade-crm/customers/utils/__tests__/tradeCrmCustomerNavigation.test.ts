import {
  getTradeCrmCustomerConfigTabs,
  getTradeCrmCustomerPrimaryTabs,
  getTradeCrmCustomerSidebarItems,
} from '@/trade-crm/customers/utils/tradeCrmCustomerNavigation';

describe('tradeCrmCustomerNavigation', () => {
  it('should mark the active primary customer tab', () => {
    const tabs = getTradeCrmCustomerPrimaryTabs('public');

    expect(tabs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          isActive: true,
          label: 'Public Pool',
        }),
      ]),
    );
  });

  it('should expose sidebar counts and unsaved config state', () => {
    const sidebarItems = getTradeCrmCustomerSidebarItems({
      activePath: 'config-tags',
      companyTotalCount: 16,
      pendingConfigSectionKeys: ['tags'],
      peopleTotalCount: 9,
    });

    expect(sidebarItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          countLabel: '16',
          label: 'Customer List',
        }),
        expect.objectContaining({
          countLabel: '6',
          label: 'Public Pool',
        }),
        expect.objectContaining({
          countLabel: '4',
          label: 'Customer Dedup',
        }),
        expect.objectContaining({
          countLabel: 'Unsaved',
          isActive: true,
          label: 'Tags',
        }),
      ]),
    );
  });

  it('should mark dirty config tabs with an ASCII indicator', () => {
    const tabs = getTradeCrmCustomerConfigTabs('sources', ['sources']);

    expect(tabs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          isActive: true,
          label: 'Sources *',
        }),
      ]),
    );
  });
});
