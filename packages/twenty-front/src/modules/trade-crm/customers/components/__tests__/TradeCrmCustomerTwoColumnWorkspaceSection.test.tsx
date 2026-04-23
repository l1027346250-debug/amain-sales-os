jest.mock('twenty-ui/theme-constants', () => ({
  themeCssVariables: {
    spacing: {
      3: '12px',
    },
  },
}));

import { render, screen } from '@testing-library/react';

import { TradeCrmCustomerTwoColumnWorkspaceSection } from '@/trade-crm/customers/components/TradeCrmCustomerTwoColumnWorkspaceSection';

describe('TradeCrmCustomerTwoColumnWorkspaceSection', () => {
  it('should render sidebar content before main workspace content', () => {
    render(
      <TradeCrmCustomerTwoColumnWorkspaceSection
        sidebar={<section>Public pool rule summary</section>}
      >
        <section>Public pool customer table</section>
      </TradeCrmCustomerTwoColumnWorkspaceSection>,
    );

    expect(screen.getByText('Public pool rule summary')).toBeVisible();
    expect(screen.getByText('Public pool customer table')).toBeVisible();
  });
});
