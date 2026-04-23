import { styled } from '@linaria/react';

import {
  canApplyCustomerConfigSnapshotPreview,
  type CustomerConfigSnapshotPreview,
  type CustomerConfigSnapshotSectionKey,
} from '@/trade-crm/customers/utils/tradeCrmCustomerConfigSnapshot';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type TradeCrmCustomerConfigSnapshotImportPanelProps = {
  getSectionLabel: (sectionKey: string) => string;
  onApplySelectedSnapshotSections: () => void;
  onApplySnapshot: () => void;
  onApplySnapshotSection: (sectionKey: CustomerConfigSnapshotSectionKey) => void;
  onClearSnapshotSectionSelection: () => void;
  onExportPreviewReport: () => void;
  onPreviewSnapshot: () => void;
  onSelectAllSnapshotSections: () => void;
  onSnapshotJsonInputChange: (value: string) => void;
  onSnapshotWarningsAcknowledgedChange: (value: boolean) => void;
  onToggleSnapshotSection: (sectionKey: CustomerConfigSnapshotSectionKey) => void;
  selectedSnapshotSectionKeys: CustomerConfigSnapshotSectionKey[];
  snapshotJsonInput: string;
  snapshotPreview: CustomerConfigSnapshotPreview | null;
  snapshotWarningsAcknowledged: boolean;
};

const StyledPanel = styled.section`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  padding: ${themeCssVariables.spacing[4]};
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

const StyledField = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledFieldLabel = styled.span`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledTextInput = styled.input`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  font: inherit;
  min-height: 40px;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledActionBar = styled.div`
  align-items: center;
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledActionMeta = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: 4px;
`;

const StyledActionButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
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
      : $tone === 'danger'
        ? tradeCrmUiTheme.colors.ink
        : tradeCrmUiTheme.colors.ink};
  cursor: pointer;
  font: inherit;
  padding: 8px 14px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const StyledFilterButton = styled.button<{ $active: boolean }>`
  background: ${({ $active }) =>
    $active
      ? tradeCrmUiTheme.colors.borderStrong
      : tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid
    ${({ $active }) =>
      $active
        ? tradeCrmUiTheme.colors.borderStrong
        : tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${({ $active }) =>
    $active ? tradeCrmUiTheme.colors.surface : tradeCrmUiTheme.colors.inkMuted};
  cursor: pointer;
  font: inherit;
  padding: 6px 12px;
`;

const StyledConfigNote = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

const StyledStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledStepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledStepItem = styled.div`
  border-left: 2px solid ${tradeCrmUiTheme.colors.borderStrong};
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

export const TradeCrmCustomerConfigSnapshotImportPanel = ({
  getSectionLabel,
  onApplySelectedSnapshotSections,
  onApplySnapshot,
  onApplySnapshotSection,
  onClearSnapshotSectionSelection,
  onExportPreviewReport,
  onPreviewSnapshot,
  onSelectAllSnapshotSections,
  onSnapshotJsonInputChange,
  onSnapshotWarningsAcknowledgedChange,
  onToggleSnapshotSection,
  selectedSnapshotSectionKeys,
  snapshotJsonInput,
  snapshotPreview,
  snapshotWarningsAcknowledged,
}: TradeCrmCustomerConfigSnapshotImportPanelProps) => {
  const canApplySnapshotPreview = canApplyCustomerConfigSnapshotPreview({
    snapshotPreview,
    warningsAcknowledged: snapshotWarningsAcknowledged,
  });

  return (
    <StyledPanel>
      <StyledPanelTitle>Snapshot Import Preview</StyledPanelTitle>
      <StyledPanelDescription>
        Paste a customer configuration snapshot JSON to validate its shape and
        preview pending sections. Preview does not overwrite the current
        workspace configuration.
      </StyledPanelDescription>
      <StyledField>
        <StyledFieldLabel>Snapshot JSON</StyledFieldLabel>
        <StyledTextInput
          as="textarea"
          value={snapshotJsonInput}
          onChange={(event) => onSnapshotJsonInputChange(event.target.value)}
          placeholder="Paste exported customer-config JSON here"
        />
      </StyledField>
      <StyledActionButtons>
        <StyledControlButton
          type="button"
          disabled={snapshotJsonInput.trim().length === 0}
          onClick={onPreviewSnapshot}
        >
          Preview Snapshot
        </StyledControlButton>
        <StyledControlButton
          type="button"
          disabled={snapshotPreview === null}
          onClick={onExportPreviewReport}
        >
          Export Preview Report
        </StyledControlButton>
        <StyledControlButton
          type="button"
          disabled={
            !canApplySnapshotPreview || selectedSnapshotSectionKeys.length === 0
          }
          onClick={onApplySelectedSnapshotSections}
        >
          Apply Selected Sections
        </StyledControlButton>
        <StyledControlButton
          type="button"
          disabled={!canApplySnapshotPreview}
          onClick={onApplySnapshot}
        >
          Apply Snapshot to Draft
        </StyledControlButton>
      </StyledActionButtons>
      {snapshotPreview ? (
        <StyledStack>
          <StyledConfigNote>
            {snapshotPreview.error ??
              `${snapshotPreview.sectionCount} pending section(s) detected in snapshot.`}
          </StyledConfigNote>
          {snapshotPreview.snapshotMetadata !== null ? (
            <StyledStepList>
              <StyledStepItem>
                <StyledStepTitle>Snapshot Metadata</StyledStepTitle>
                <StyledStepText>
                  Compatibility:{' '}
                  {snapshotPreview.snapshotMetadata.compatibilityMessage}
                  {' / '}
                  Type:{' '}
                  {snapshotPreview.snapshotMetadata.snapshotType ?? 'Unmarked'}
                  {' / '}
                  Version:{' '}
                  {snapshotPreview.snapshotMetadata.snapshotVersion ??
                    'Unmarked'}
                  {' / '}
                  Source section:{' '}
                  {snapshotPreview.snapshotMetadata.activeSection
                    ? getSectionLabel(
                        snapshotPreview.snapshotMetadata.activeSection,
                      )
                    : 'Unknown'}
                  {' / '}
                  Exported at:{' '}
                  {snapshotPreview.snapshotMetadata.exportedAt ?? 'Unknown'}
                  {' / '}
                  Last saved at:{' '}
                  {snapshotPreview.snapshotMetadata.lastSavedAt ?? 'Unknown'}
                  {' / '}
                  Exported from:{' '}
                  {snapshotPreview.snapshotMetadata.hasUnsavedChanges === true
                    ? 'unsaved draft'
                    : 'saved config'}
                  {' / '}
                  Validation messages:{' '}
                  {snapshotPreview.snapshotMetadata.validationMessageCount}
                </StyledStepText>
              </StyledStepItem>
            </StyledStepList>
          ) : null}
          {snapshotPreview.snapshotMetadata?.hasUnsavedChanges === true ? (
            <StyledConfigNote>
              This snapshot was exported from an unsaved draft. Review diffs
              before applying it to the current workspace configuration.
            </StyledConfigNote>
          ) : null}
          {snapshotPreview.snapshotMetadata?.compatibilityStatus === 'legacy' ? (
            <StyledConfigNote>
              This snapshot does not include type/version metadata. It can be
              applied because its config structure is valid, but newer exports
              should be preferred for cross-workspace transfers.
            </StyledConfigNote>
          ) : null}
          {snapshotPreview.snapshotMetadata?.compatibilityStatus ===
          'incompatible' ? (
            <StyledConfigNote>
              This snapshot cannot be applied because it is not a compatible
              customer configuration snapshot.
            </StyledConfigNote>
          ) : null}
          {snapshotPreview.configSummary !== null ? (
            <StyledStepList>
              <StyledStepItem>
                <StyledStepTitle>Config Summary</StyledStepTitle>
                <StyledStepText>
                  Groups: {snapshotPreview.configSummary.groupCount}
                  {' / '}
                  Tags: {snapshotPreview.configSummary.tagCount}
                  {' / '}
                  Sources: {snapshotPreview.configSummary.sourceCount}
                  {' / '}
                  Matching rules:{' '}
                  {snapshotPreview.configSummary.matchingRuleCount}
                  {' / '}
                  Import fields: {snapshotPreview.configSummary.importFieldCount}
                  {' / '}
                  Public-pool stages:{' '}
                  {snapshotPreview.configSummary.publicPoolScopeStageCount}
                </StyledStepText>
              </StyledStepItem>
            </StyledStepList>
          ) : null}
          {snapshotPreview.impactWarnings.length > 0 ? (
            <>
              <StyledStepList>
                {snapshotPreview.impactWarnings.map((warning) => (
                  <StyledStepItem key={warning}>
                    <StyledStepTitle>Impact Warning</StyledStepTitle>
                    <StyledStepText>{warning}</StyledStepText>
                  </StyledStepItem>
                ))}
              </StyledStepList>
              <StyledConfigNote>
                <label>
                  <input
                    type="checkbox"
                    checked={snapshotWarningsAcknowledged}
                    onChange={(event) =>
                      onSnapshotWarningsAcknowledgedChange(
                        event.target.checked,
                      )
                    }
                  />{' '}
                  I have reviewed the impact warnings and want to allow applying
                  this snapshot.
                </label>
              </StyledConfigNote>
              {!snapshotWarningsAcknowledged ? (
                <StyledConfigNote>
                  Applying snapshot sections is disabled until the impact
                  warnings are acknowledged.
                </StyledConfigNote>
              ) : null}
            </>
          ) : null}
          {snapshotPreview.validationMessages.length > 0 ? (
            <StyledStepList>
              {snapshotPreview.validationMessages.map((message) => (
                <StyledStepItem key={message}>
                  <StyledStepTitle>Validation Issue</StyledStepTitle>
                  <StyledStepText>{message}</StyledStepText>
                </StyledStepItem>
              ))}
            </StyledStepList>
          ) : null}
          {snapshotPreview.pendingSectionSummaries.length > 0 ? (
            <StyledStepList>
              {snapshotPreview.pendingSectionSummaries.map((summary) => (
                <StyledStepItem key={summary}>
                  <StyledStepTitle>Snapshot Section</StyledStepTitle>
                  <StyledStepText>{summary}</StyledStepText>
                </StyledStepItem>
              ))}
            </StyledStepList>
          ) : null}
          {snapshotPreview.currentDraftDiffSections.length > 0 ? (
            <>
              <StyledActionBar>
                <StyledActionMeta>
                  <strong>
                    {selectedSnapshotSectionKeys.length} /{' '}
                    {snapshotPreview.currentDraftDiffSections.length}
                  </strong>{' '}
                  diff section(s) selected for batch apply.
                </StyledActionMeta>
                <StyledActionButtons>
                  <StyledControlButton
                    type="button"
                    disabled={
                      selectedSnapshotSectionKeys.length ===
                      snapshotPreview.currentDraftDiffSections.length
                    }
                    onClick={onSelectAllSnapshotSections}
                  >
                    Select All
                  </StyledControlButton>
                  <StyledControlButton
                    type="button"
                    disabled={selectedSnapshotSectionKeys.length === 0}
                    onClick={onClearSnapshotSectionSelection}
                  >
                    Clear Selection
                  </StyledControlButton>
                </StyledActionButtons>
              </StyledActionBar>
              <StyledStepList>
                {snapshotPreview.currentDraftDiffSections.map((section) => (
                  <StyledStepItem key={section.key}>
                    <StyledStepTitle>Current Draft Diff</StyledStepTitle>
                    <StyledStepText>{section.summary}</StyledStepText>
                    <StyledActionButtons>
                      <StyledFilterButton
                        type="button"
                        $active={selectedSnapshotSectionKeys.includes(
                          section.key,
                        )}
                        onClick={() => onToggleSnapshotSection(section.key)}
                      >
                        {selectedSnapshotSectionKeys.includes(section.key)
                          ? 'Selected'
                          : 'Select'}
                      </StyledFilterButton>
                      <StyledControlButton
                        type="button"
                        disabled={!canApplySnapshotPreview}
                        onClick={() => onApplySnapshotSection(section.key)}
                      >
                        Apply {section.label}
                      </StyledControlButton>
                    </StyledActionButtons>
                  </StyledStepItem>
                ))}
              </StyledStepList>
            </>
          ) : null}
          {snapshotPreview.error === null &&
          snapshotPreview.currentDraftDiffSummaries.length === 0 ? (
            <StyledConfigNote>
              Snapshot config matches the current draft.
            </StyledConfigNote>
          ) : null}
        </StyledStack>
      ) : null}
    </StyledPanel>
  );
};
