import { styled } from '@linaria/react';

import { type useTradeCrmCustomerConfigDraft } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigDraft';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type TradeCrmCustomerConfigMatchingRulesPanelProps = {
  configDraft: ReturnType<typeof useTradeCrmCustomerConfigDraft>;
  hasUnsavedMatchingRules: boolean;
};

const StyledStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledCallout = styled.div`
  background: ${tradeCrmUiTheme.colors.surfaceInteractive};
  border: 1px solid ${tradeCrmUiTheme.colors.borderInteractive};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledPanelTitleRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  margin-bottom: ${themeCssVariables.spacing[2]};
`;

const StyledPanelTitle = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin-bottom: ${themeCssVariables.spacing[2]};
`;

const StyledPanelDescription = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
  margin-bottom: ${themeCssVariables.spacing[3]};
`;

const StyledToken = styled.div`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.xs};
  padding: 4px 10px;
`;

const StyledMetricValue = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledColumns = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const StyledMetricCard = styled.div`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledMetricLabel = styled.div`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
  margin-bottom: ${themeCssVariables.spacing[2]};
`;

const StyledMetricHint = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
  margin-top: ${themeCssVariables.spacing[2]};
`;

const StyledTextInput = styled.input`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  font: inherit;
  min-height: 40px;
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledNumberInput = styled(StyledTextInput)`
  appearance: textfield;
`;

export const TradeCrmCustomerConfigMatchingRulesPanel = ({
  configDraft,
  hasUnsavedMatchingRules,
}: TradeCrmCustomerConfigMatchingRulesPanelProps) => {
  const totalWeight = configDraft.draft.matchingRules.reduce(
    (sum, rule) => sum + rule.weight,
    0,
  );

  return (
    <StyledStack>
      <StyledCallout>
        <StyledPanelTitleRow>
          <StyledPanelTitle>Matching Weight Total</StyledPanelTitle>
          {hasUnsavedMatchingRules ? <StyledToken>Unsaved</StyledToken> : null}
        </StyledPanelTitleRow>
        <StyledPanelDescription>
          Keep the combined weight close to 100 so manual dedup and import dedup
          stay predictable.
        </StyledPanelDescription>
        <StyledMetricValue>{totalWeight}%</StyledMetricValue>
      </StyledCallout>
      <StyledColumns>
        {configDraft.draft.matchingRules.map((rule) => (
          <StyledMetricCard key={rule.field}>
            <StyledMetricLabel>{rule.field}</StyledMetricLabel>
            <StyledNumberInput
              max={100}
              min={0}
              type="number"
              value={rule.weight}
              onChange={(event) =>
                configDraft.setMatchingWeight(
                  rule.field,
                  Math.max(0, Math.min(100, Number(event.target.value) || 0)),
                )
              }
            />
            <StyledMetricHint>
              Shared by customer dedup and import collision review.
            </StyledMetricHint>
          </StyledMetricCard>
        ))}
      </StyledColumns>
    </StyledStack>
  );
};
