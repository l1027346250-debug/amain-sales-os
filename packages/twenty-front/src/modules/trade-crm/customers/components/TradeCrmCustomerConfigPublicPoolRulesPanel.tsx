import { styled } from '@linaria/react';
import { useMemo } from 'react';

import { type useTradeCrmCustomerConfigDraft } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigDraft';
import {
  buildCustomerPublicPoolRuleExecutionPreview,
  canExecuteCustomerPublicPoolRuleScan,
  getCustomerPublicPoolRuleValidationMessages,
} from '@/trade-crm/customers/utils/tradeCrmCustomerPublicPoolRuleValidation';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type TradeCrmCustomerConfigPublicPoolRulesPanelProps = {
  configDraft: ReturnType<typeof useTradeCrmCustomerConfigDraft>;
  currentPublicPoolRecordCount: number;
  hasUnsavedPublicPoolRules: boolean;
  isExecutingPublicPoolRules: boolean;
  onExecutePublicPoolRules: () => void;
  publicPoolGroupLabels: string[];
  stageLabels: string[];
};

const FALLBACK_STAGE_LABELS = [
  'Potential Customer',
  'Active Customer',
  'Won Customer',
];

const StyledSplitGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`;

const StyledStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledPanel = styled.section`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
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

const StyledFormGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-bottom: ${themeCssVariables.spacing[4]};
`;

const StyledField = styled.label`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledFieldLabel = styled.span`
  font-weight: ${themeCssVariables.font.weight.medium};
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

const StyledSelect = styled.select`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  font: inherit;
  min-height: 40px;
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledToken = styled.div`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.xs};
  padding: 4px 10px;
`;

const StyledTokenWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledFilterButton = styled.button<{ $active?: boolean }>`
  background: ${({ $active }) =>
    $active
      ? tradeCrmUiTheme.colors.surfaceInteractive
      : tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid
    ${({ $active }) =>
      $active
        ? tradeCrmUiTheme.colors.borderInteractive
        : tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${tradeCrmUiTheme.colors.ink};
  cursor: pointer;
  font: inherit;
  padding: 7px 12px;
`;

const StyledInlineComposer = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledConfigNote = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

const StyledStepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledStepItem = styled.div`
  border-left: 3px solid ${tradeCrmUiTheme.colors.borderInteractive};
  padding-left: ${themeCssVariables.spacing[3]};
`;

const StyledStepTitle = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin-bottom: ${themeCssVariables.spacing[1]};
`;

const StyledStepText = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

const StyledActionButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  margin: ${themeCssVariables.spacing[3]} 0;
`;

const StyledControlButton = styled.button<{
  $tone?: 'primary' | 'neutral' | 'danger';
}>`
  background: ${({ $tone }) =>
    $tone === 'primary'
      ? tradeCrmUiTheme.colors.borderStrong
      : $tone === 'danger'
        ? tradeCrmUiTheme.colors.surfaceInteractive
        : tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'primary'
        ? tradeCrmUiTheme.colors.borderStrong
        : $tone === 'danger'
          ? tradeCrmUiTheme.colors.borderInteractive
          : tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${({ $tone }) =>
    $tone === 'primary'
      ? tradeCrmUiTheme.colors.surface
      : tradeCrmUiTheme.colors.ink};
  cursor: pointer;
  font: inherit;
  padding: 8px 14px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const StyledValidationList = styled.ul`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
  margin: ${themeCssVariables.spacing[2]} 0 0;
  padding-left: ${themeCssVariables.spacing[5]};
`;

export const TradeCrmCustomerConfigPublicPoolRulesPanel = ({
  configDraft,
  currentPublicPoolRecordCount,
  hasUnsavedPublicPoolRules,
  isExecutingPublicPoolRules,
  onExecutePublicPoolRules,
  publicPoolGroupLabels,
  stageLabels,
}: TradeCrmCustomerConfigPublicPoolRulesPanelProps) => {
  const availableStageLabels =
    stageLabels.length > 0 ? stageLabels : FALLBACK_STAGE_LABELS;
  const validationMessages = useMemo(
    () =>
      getCustomerPublicPoolRuleValidationMessages({
        hasUnsavedChanges: hasUnsavedPublicPoolRules,
        publicPoolRule: configDraft.draft.publicPoolRule,
      }),
    [configDraft.draft.publicPoolRule, hasUnsavedPublicPoolRules],
  );
  const executionPreviewSteps = useMemo(
    () =>
      buildCustomerPublicPoolRuleExecutionPreview({
        publicPoolRule: configDraft.draft.publicPoolRule,
      }),
    [configDraft.draft.publicPoolRule],
  );
  const canExecuteRuleScan =
    canExecuteCustomerPublicPoolRuleScan(validationMessages) &&
    !isExecutingPublicPoolRules;

  return (
    <StyledSplitGrid>
      <StyledStack>
        <StyledPanel>
          <StyledPanelTitleRow>
            <StyledPanelTitle>Rule Conditions</StyledPanelTitle>
            {hasUnsavedPublicPoolRules ? <StyledToken>Unsaved</StyledToken> : null}
          </StyledPanelTitleRow>
          <StyledFormGrid>
            <StyledField>
              <StyledFieldLabel>Rule Name</StyledFieldLabel>
              <StyledTextInput
                value={configDraft.draft.publicPoolRule.ruleName}
                onChange={(event) =>
                  configDraft.setPublicPoolRule('ruleName', event.target.value)
                }
              />
            </StyledField>
            <StyledField>
              <StyledFieldLabel>Move After Inactivity Days</StyledFieldLabel>
              <StyledNumberInput
                min={1}
                type="number"
                value={configDraft.draft.publicPoolRule.inactivityDays}
                onChange={(event) =>
                  configDraft.setPublicPoolRule(
                    'inactivityDays',
                    Math.max(1, Number(event.target.value) || 1),
                  )
                }
              />
            </StyledField>
            <StyledField>
              <StyledFieldLabel>Public Pool Group</StyledFieldLabel>
              <StyledSelect
                value={configDraft.draft.publicPoolRule.publicPoolGroup}
                onChange={(event) =>
                  configDraft.setPublicPoolRule(
                    'publicPoolGroup',
                    event.target.value,
                  )
                }
              >
                {publicPoolGroupLabels.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </StyledSelect>
            </StyledField>
          </StyledFormGrid>
          <StyledPanelDescription>
            Choose which customer stages should be eligible for nightly recycle
            into the public pool.
          </StyledPanelDescription>
          <StyledTokenWrap>
            {availableStageLabels.map((stageLabel) => (
              <StyledFilterButton
                key={stageLabel}
                $active={configDraft.draft.publicPoolRule.scopeStages.includes(
                  stageLabel,
                )}
                type="button"
                onClick={() => configDraft.togglePublicPoolStage(stageLabel)}
              >
                {stageLabel}
              </StyledFilterButton>
            ))}
          </StyledTokenWrap>
          <StyledInlineComposer>
            <StyledFilterButton
              $active={configDraft.draft.publicPoolRule.notifyOwnersFirst}
              type="button"
              onClick={() =>
                configDraft.setPublicPoolRule(
                  'notifyOwnersFirst',
                  !configDraft.draft.publicPoolRule.notifyOwnersFirst,
                )
              }
            >
              {configDraft.draft.publicPoolRule.notifyOwnersFirst
                ? 'Owner Reminder Enabled'
                : 'Owner Reminder Disabled'}
            </StyledFilterButton>
            <StyledConfigNote>
              {currentPublicPoolRecordCount} current public-pool records stay
              visible in the audit lane after auto-move.
            </StyledConfigNote>
          </StyledInlineComposer>
        </StyledPanel>
      </StyledStack>
      <StyledStack>
        <StyledPanel>
          <StyledPanelTitleRow>
            <StyledPanelTitle>Execution Preview</StyledPanelTitle>
            {hasUnsavedPublicPoolRules ? <StyledToken>Unsaved</StyledToken> : null}
          </StyledPanelTitleRow>
          <StyledStepList>
            {executionPreviewSteps.map((step) => (
              <StyledStepItem key={step.title}>
                <StyledStepTitle>{step.title}</StyledStepTitle>
                <StyledStepText>{step.text}</StyledStepText>
              </StyledStepItem>
            ))}
          </StyledStepList>
          <StyledActionButtons>
            <StyledControlButton
              $tone="primary"
              disabled={!canExecuteRuleScan}
              type="button"
              onClick={onExecutePublicPoolRules}
            >
              {isExecutingPublicPoolRules
                ? 'Executing Rule Scan'
                : 'Execute Rule Scan'}
            </StyledControlButton>
          </StyledActionButtons>
          <StyledConfigNote>
            Runs the saved public-pool rules against current customer records
            and refreshes both private and public-pool lists after execution.
          </StyledConfigNote>
          {validationMessages.length > 0 ? (
            <StyledValidationList>
              {validationMessages.map((validationMessage) => (
                <li key={validationMessage}>{validationMessage}</li>
              ))}
            </StyledValidationList>
          ) : null}
        </StyledPanel>
      </StyledStack>
    </StyledSplitGrid>
  );
};
