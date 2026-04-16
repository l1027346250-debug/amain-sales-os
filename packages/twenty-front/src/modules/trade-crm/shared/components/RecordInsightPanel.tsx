import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { tradeCrmUiTheme } from '../ui/tradeCrmUiTheme';

export type RecordInsightItem = {
  label: string;
  value: string;
  description: string;
};

const StyledPanel = styled.aside`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  position: sticky;
  top: ${themeCssVariables.spacing[4]};
`;

const StyledCard = styled.div`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  box-shadow: ${tradeCrmUiTheme.shadow.inset};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledTitle = styled.div`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.04em;
  margin-bottom: ${themeCssVariables.spacing[1]};
`;

const StyledDescription = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
  margin-bottom: ${themeCssVariables.spacing[3]};
`;

const StyledItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledItem = styled.div`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  min-width: 0;
  padding: ${themeCssVariables.spacing[3]};
  position: relative;

  &::before {
    background: ${tradeCrmUiTheme.colors.ink};
    border-radius: ${themeCssVariables.border.radius.rounded};
    content: '';
    height: calc(100% - ${themeCssVariables.spacing[4]});
    left: ${themeCssVariables.spacing[2]};
    position: absolute;
    top: ${themeCssVariables.spacing[2]};
    width: 3px;
  }
`;

const StyledLabel = styled.div`
  color: ${tradeCrmUiTheme.colors.inkFaint};
  font-size: ${themeCssVariables.font.size.xs};
  letter-spacing: 0.04em;
`;

const StyledValue = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: 24px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: ${themeCssVariables.spacing[1]} 0 ${themeCssVariables.spacing[1]}
    ${themeCssVariables.spacing[3]};
  text-wrap: balance;
`;

const StyledItemDescription = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
  margin-left: ${themeCssVariables.spacing[3]};
`;

export const RecordInsightPanel = ({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: RecordInsightItem[];
}) => {
  return (
    <StyledPanel>
      <StyledCard>
        <StyledTitle>{title}</StyledTitle>
        <StyledDescription>{description}</StyledDescription>
        <StyledItemList>
          {items.map((item) => (
            <StyledItem key={item.label}>
              <StyledLabel>{item.label}</StyledLabel>
              <StyledValue>{item.value}</StyledValue>
              <StyledItemDescription>{item.description}</StyledItemDescription>
            </StyledItem>
          ))}
        </StyledItemList>
      </StyledCard>
    </StyledPanel>
  );
};
