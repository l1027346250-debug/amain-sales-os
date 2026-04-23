jest.mock('twenty-ui/theme-constants', () => ({
  themeCssVariables: {
    font: {
      size: {
        sm: '14px',
        xs: '12px',
      },
      weight: {
        semiBold: 600,
      },
    },
    spacing: {
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
    },
  },
}));

import { render, screen } from '@testing-library/react';

import { TradeCrmCustomerSignalsCards } from '@/trade-crm/customers/components/TradeCrmCustomerSignalsCards';

describe('TradeCrmCustomerSignalsCards', () => {
  it('should render the core customer operations metrics', () => {
    render(
      <TradeCrmCustomerSignalsCards
        companyTotalCount={12}
        materialAlignmentNotice="Use saved URLs instead of local filenames."
        opportunityTotalCount={5}
        peopleTotalCount={9}
        totalTasksDueTodayCount={3}
      />,
    );

    expect(screen.getByText('Customer Accounts')).toBeVisible();
    expect(screen.getByText('12')).toBeVisible();
    expect(screen.getByText('Contacts')).toBeVisible();
    expect(screen.getByText('9')).toBeVisible();
    expect(screen.getByText('Commercial Motion')).toBeVisible();
    expect(screen.getByText('5')).toBeVisible();
    expect(screen.getByText('Tasks Due Today')).toBeVisible();
    expect(
      screen.getByText('Use saved URLs instead of local filenames.'),
    ).toBeVisible();
  });
});
