import { styled } from '@linaria/react';
import { Link } from 'react-router-dom';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export type PageHeaderTab = {
  label: string;
  isActive?: boolean;
  to?: string;
};

const StyledTabs = styled.div`
  align-items: center;
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledTabLink = styled(Link)<{ $active: boolean }>`
  background: ${({ $active }) =>
      $active
      ? tradeCrmUiTheme.colors.ink
      : tradeCrmUiTheme.colors.surface};
  border: 1px solid
    ${({ $active }) =>
      $active
        ? tradeCrmUiTheme.colors.ink
        : tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${({ $active }) =>
    $active
      ? tradeCrmUiTheme.colors.inverted
      : tradeCrmUiTheme.colors.inkMuted};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  line-height: 1;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  text-decoration: none;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;

  &:hover {
    border-color: ${tradeCrmUiTheme.colors.borderStrong};
    color: ${tradeCrmUiTheme.colors.ink};
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid ${tradeCrmUiTheme.colors.focusRing};
    outline-offset: 2px;
  }
`;

const StyledStaticTab = styled.div<{ $active: boolean }>`
  background: ${({ $active }) =>
      $active
      ? tradeCrmUiTheme.colors.ink
      : tradeCrmUiTheme.colors.surface};
  border: 1px solid
    ${({ $active }) =>
      $active
        ? tradeCrmUiTheme.colors.ink
        : tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${({ $active }) =>
    $active
      ? tradeCrmUiTheme.colors.inverted
      : tradeCrmUiTheme.colors.inkMuted};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  line-height: 1;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

export const PageHeaderTabs = ({ tabs }: { tabs: PageHeaderTab[] }) => {
  return (
    <StyledTabs>
      {tabs.map((tab) =>
        tab.to ? (
          <StyledTabLink key={tab.label} to={tab.to} $active={Boolean(tab.isActive)}>
            {tab.label}
          </StyledTabLink>
        ) : (
          <StyledStaticTab key={tab.label} $active={Boolean(tab.isActive)}>
            {tab.label}
          </StyledStaticTab>
        ),
      )}
    </StyledTabs>
  );
};
