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

jest.mock('@/trade-crm/customers/utils/tradeCrmCustomerPresentation', () => ({
  getTradeCrmPublicPoolGroupLabelForRecord: jest.fn(),
}));

import {
  CUSTOMER_CONFIG_UNSAVED_CHANGES_MESSAGE,
  getCustomerConfigSectionLabel,
  hasPendingConfigSectionChange,
} from '@/trade-crm/customers/utils/tradeCrmCustomerConfigWorkspace';

describe('tradeCrmCustomerConfigWorkspace', () => {
  it('should resolve known config route labels', () => {
    expect(getCustomerConfigSectionLabel('public-pool-rules')).toBe(
      'Public Pool Rules',
    );
    expect(getCustomerConfigSectionLabel('matching')).toBe('Matching');
  });

  it('should fallback to the raw section key for unknown labels', () => {
    expect(getCustomerConfigSectionLabel('custom-section')).toBe(
      'custom-section',
    );
  });

  it('should detect pending section changes', () => {
    expect(
      hasPendingConfigSectionChange(
        [{ key: 'groups' }, { key: 'tags' }],
        'tags',
      ),
    ).toBe(true);
    expect(
      hasPendingConfigSectionChange(
        [{ key: 'groups' }, { key: 'tags' }],
        'sources',
      ),
    ).toBe(false);
  });

  it('should keep the unsaved changes guard message stable', () => {
    expect(CUSTOMER_CONFIG_UNSAVED_CHANGES_MESSAGE).toBe(
      'Customer settings have unsaved changes. Leave without saving?',
    );
  });
});
