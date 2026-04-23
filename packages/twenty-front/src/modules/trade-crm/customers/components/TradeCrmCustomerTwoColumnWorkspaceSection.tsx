import { styled } from '@linaria/react';
import { type ReactNode } from 'react';

import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledSplitGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: 320px minmax(0, 1fr);

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`;

const StyledStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

type TradeCrmCustomerTwoColumnWorkspaceSectionProps = {
  children: ReactNode;
  sidebar: ReactNode;
};

export const TradeCrmCustomerTwoColumnWorkspaceSection = ({
  children,
  sidebar,
}: TradeCrmCustomerTwoColumnWorkspaceSectionProps) => (
  <StyledSplitGrid>
    <StyledStack>{sidebar}</StyledStack>
    {children}
  </StyledSplitGrid>
);
