import { styled } from '@linaria/react';

import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledMetricGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
`;

const StyledMetricCard = styled.section`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledMetricLabel = styled.div`
  color: ${tradeCrmUiTheme.colors.inkFaint};
  font-size: ${themeCssVariables.font.size.xs};
  letter-spacing: 0.06em;
  margin-bottom: ${themeCssVariables.spacing[2]};
  text-transform: uppercase;
`;

const StyledMetricValue = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: 30px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin-bottom: ${themeCssVariables.spacing[1]};
`;

const StyledMetricHint = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

type TradeCrmCustomerSignalsCardsProps = {
  companyTotalCount: number;
  materialAlignmentNotice: string;
  opportunityTotalCount: number;
  peopleTotalCount: number;
  totalTasksDueTodayCount: number;
};

export const TradeCrmCustomerSignalsCards = ({
  companyTotalCount,
  materialAlignmentNotice,
  opportunityTotalCount,
  peopleTotalCount,
  totalTasksDueTodayCount,
}: TradeCrmCustomerSignalsCardsProps) => (
  <StyledMetricGrid>
    {[
      [
        'Customer Accounts',
        `${companyTotalCount}`,
        'Organization customers already anchored on live company records.',
      ],
      [
        'Contacts',
        `${peopleTotalCount}`,
        'Contact coverage that supports follow-up and ownership transfer.',
      ],
      [
        'Commercial Motion',
        `${opportunityTotalCount}`,
        'Opportunities that should stay attached to the customer context.',
      ],
      [
        'Tasks Due Today',
        `${totalTasksDueTodayCount}`,
        materialAlignmentNotice,
      ],
    ].map(([label, value, hint]) => (
      <StyledMetricCard key={label}>
        <StyledMetricLabel>{label}</StyledMetricLabel>
        <StyledMetricValue>{value}</StyledMetricValue>
        <StyledMetricHint>{hint}</StyledMetricHint>
      </StyledMetricCard>
    ))}
  </StyledMetricGrid>
);
