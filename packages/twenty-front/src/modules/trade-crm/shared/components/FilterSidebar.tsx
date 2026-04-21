import { styled } from '@linaria/react';
import { Link } from 'react-router-dom';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { tradeCrmUiTheme } from '../ui/tradeCrmUiTheme';

export type FilterSidebarItem = {
  label: string;
  hint: string;
  isActive?: boolean;
  to?: string;
  countLabel?: string;
};

const StyledSidebar = styled.aside`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  box-shadow: ${tradeCrmUiTheme.shadow.inset};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  position: sticky;
  padding: ${themeCssVariables.spacing[4]};
  top: ${themeCssVariables.spacing[4]};
`;

const StyledTitle = styled.div`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.04em;
`;

const StyledList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledItem = styled.div`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[3]};
  position: relative;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease;

  &::before {
    background: ${tradeCrmUiTheme.colors.borderInteractive};
    border-radius: ${themeCssVariables.border.radius.rounded};
    content: '';
    height: 8px;
    position: absolute;
    right: ${themeCssVariables.spacing[3]};
    top: ${themeCssVariables.spacing[3]};
    width: 8px;
  }

  &:hover {
    background: ${tradeCrmUiTheme.colors.surfaceMuted};
    border-color: ${tradeCrmUiTheme.colors.borderStrong};
    transform: translateY(-1px);
  }

  &[data-active='true'] {
    background: ${tradeCrmUiTheme.colors.surfaceMuted};
    border-color: ${tradeCrmUiTheme.colors.borderStrong};
  }

  &[data-active='true']::before {
    background: ${tradeCrmUiTheme.colors.ink};
  }
`;

const StyledItemLink = styled(Link)`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[3]};
  position: relative;
  text-decoration: none;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease;

  &::before {
    background: ${tradeCrmUiTheme.colors.borderInteractive};
    border-radius: ${themeCssVariables.border.radius.rounded};
    content: '';
    height: 8px;
    position: absolute;
    right: ${themeCssVariables.spacing[3]};
    top: ${themeCssVariables.spacing[3]};
    width: 8px;
  }

  &:hover {
    background: ${tradeCrmUiTheme.colors.surfaceMuted};
    border-color: ${tradeCrmUiTheme.colors.borderStrong};
    transform: translateY(-1px);
  }

  &[data-active='true'] {
    background: ${tradeCrmUiTheme.colors.surfaceMuted};
    border-color: ${tradeCrmUiTheme.colors.borderStrong};
  }

  &[data-active='true']::before {
    background: ${tradeCrmUiTheme.colors.ink};
  }
`;

const StyledLabelRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledLabel = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledCount = styled.div`
  color: ${tradeCrmUiTheme.colors.inkFaint};
  font-size: ${themeCssVariables.font.size.sm};
  padding-right: ${themeCssVariables.spacing[4]};
`;

const StyledHint = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
  padding-right: ${themeCssVariables.spacing[4]};
`;

export const FilterSidebar = ({
  title,
  items,
}: {
  title: string;
  items: FilterSidebarItem[];
}) => {
  return (
    <StyledSidebar>
      <StyledTitle>{title}</StyledTitle>
      <StyledList>
        {items.map((item) => (
          item.to ? (
            <StyledItemLink
              data-active={item.isActive ? 'true' : 'false'}
              key={item.label}
              to={item.to}
            >
              <StyledLabelRow>
                <StyledLabel>{item.label}</StyledLabel>
                {item.countLabel ? <StyledCount>{item.countLabel}</StyledCount> : null}
              </StyledLabelRow>
              <StyledHint>{item.hint}</StyledHint>
            </StyledItemLink>
          ) : (
            <StyledItem
              data-active={item.isActive ? 'true' : 'false'}
              key={item.label}
            >
              <StyledLabelRow>
                <StyledLabel>{item.label}</StyledLabel>
                {item.countLabel ? <StyledCount>{item.countLabel}</StyledCount> : null}
              </StyledLabelRow>
              <StyledHint>{item.hint}</StyledHint>
            </StyledItem>
          )
        ))}
      </StyledList>
    </StyledSidebar>
  );
};
