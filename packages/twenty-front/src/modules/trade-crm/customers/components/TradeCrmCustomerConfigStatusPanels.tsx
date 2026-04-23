import { styled } from '@linaria/react';

import { type useTradeCrmCustomerConfigDraft } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigDraft';
import {
  type CustomerConfigSnapshotApplyNotice,
} from '@/trade-crm/customers/utils/tradeCrmCustomerConfigSnapshot';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type TradeCrmCustomerConfigStatusPanelsProps = {
  blockedNavigationError: string | null;
  configDraft: ReturnType<typeof useTradeCrmCustomerConfigDraft>;
  getSectionLabel: (sectionKey: string) => string;
  isNavigationBlocked: boolean;
  onDiscardAndProceed: () => void;
  onExportSnapshot: () => void;
  onResetConfig: () => void;
  onSaveAndProceed: () => void;
  onSaveConfig: () => void;
  onStayOnPage: () => void;
  snapshotApplyNotice: CustomerConfigSnapshotApplyNotice | null;
  unsavedChangesMessage: string;
};

const StyledActionBar = styled.div`
  align-items: center;
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledActionMeta = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
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
      : tradeCrmUiTheme.colors.ink};
  cursor: pointer;
  font: inherit;
  padding: 8px 14px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const StyledCallout = styled.div`
  background: linear-gradient(
    180deg,
    ${tradeCrmUiTheme.colors.surface},
    ${tradeCrmUiTheme.colors.surfaceMuted}
  );
  border: 1px solid ${tradeCrmUiTheme.colors.focusRing};
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

const StyledTokenWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledToken = styled.div`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.xs};
  padding: 4px 10px;
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

const StyledConfigNote = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

const getSnapshotApplyNoticeDescription = (
  snapshotApplyNotice: CustomerConfigSnapshotApplyNotice,
) => {
  if (snapshotApplyNotice.mode === 'full') {
    return 'A full customer configuration snapshot was applied to the current draft.';
  }

  if (snapshotApplyNotice.mode === 'selected') {
    return 'Selected customer configuration snapshot sections were applied to the current draft.';
  }

  return 'A single customer configuration snapshot section was applied to the current draft.';
};

export const TradeCrmCustomerConfigStatusPanels = ({
  blockedNavigationError,
  configDraft,
  getSectionLabel,
  isNavigationBlocked,
  onDiscardAndProceed,
  onExportSnapshot,
  onResetConfig,
  onSaveAndProceed,
  onSaveConfig,
  onStayOnPage,
  snapshotApplyNotice,
  unsavedChangesMessage,
}: TradeCrmCustomerConfigStatusPanelsProps) => (
  <>
    <StyledActionBar>
      <StyledActionMeta>
        <span>
          {configDraft.hasValidationErrors
            ? (configDraft.saveError ?? configDraft.validationMessages[0])
            : configDraft.hasUnsavedChanges
              ? 'Unsaved customer configuration changes'
              : 'Customer configuration is synced with workspace records'}
        </span>
        <span>
          {configDraft.hasValidationErrors
            ? `${configDraft.validationMessages.length} validation issue(s) must be resolved before saving.`
            : configDraft.hasUnsavedChanges
              ? `${configDraft.pendingChangedSections.length} config section(s) pending save.`
              : configDraft.lastSavedConfigOperationId !== null
                ? 'Latest save is highlighted in the config change history below.'
                : 'Settings are persisted through workspace records, not browser local storage.'}
        </span>
      </StyledActionMeta>
      <StyledActionButtons>
        <StyledControlButton
          type="button"
          onClick={onExportSnapshot}
        >
          Export Snapshot
        </StyledControlButton>
        <StyledControlButton
          disabled={configDraft.isSaving || !configDraft.hasUnsavedChanges}
          type="button"
          onClick={onResetConfig}
        >
          Reset Draft
        </StyledControlButton>
        <StyledControlButton
          $tone="primary"
          disabled={
            configDraft.isSaving ||
            !configDraft.hasUnsavedChanges ||
            configDraft.hasValidationErrors
          }
          type="button"
          onClick={onSaveConfig}
        >
          {configDraft.isSaving ? 'Saving...' : 'Save Config'}
        </StyledControlButton>
      </StyledActionButtons>
    </StyledActionBar>
    {isNavigationBlocked ? (
      <StyledCallout>
        <StyledPanelTitle>Unsaved Customer Settings</StyledPanelTitle>
        <StyledPanelDescription>
          {unsavedChangesMessage} Save before continuing, discard the draft, or
          stay on this page.
        </StyledPanelDescription>
        <StyledTokenWrap>
          {configDraft.pendingChangedSections.map((section) => (
            <StyledToken key={`blocked-${section.key}`}>
              {getSectionLabel(section.key)}
            </StyledToken>
          ))}
        </StyledTokenWrap>
        <StyledStepList>
          {configDraft.pendingChangedSections.map((section) => (
            <StyledStepItem key={`blocked-summary-${section.key}`}>
              <StyledStepTitle>{getSectionLabel(section.key)}</StyledStepTitle>
              <StyledStepText>{section.summary}</StyledStepText>
            </StyledStepItem>
          ))}
        </StyledStepList>
        {blockedNavigationError !== null ? (
          <StyledConfigNote>{blockedNavigationError}</StyledConfigNote>
        ) : null}
        <StyledActionButtons>
          <StyledControlButton
            $tone="primary"
            disabled={configDraft.isSaving || configDraft.hasValidationErrors}
            type="button"
            onClick={onSaveAndProceed}
          >
            {configDraft.isSaving ? 'Saving...' : 'Save and Continue'}
          </StyledControlButton>
          <StyledControlButton
            $tone="danger"
            disabled={configDraft.isSaving}
            type="button"
            onClick={onDiscardAndProceed}
          >
            Discard and Continue
          </StyledControlButton>
          <StyledControlButton
            disabled={configDraft.isSaving}
            type="button"
            onClick={onStayOnPage}
          >
            Stay Here
          </StyledControlButton>
        </StyledActionButtons>
      </StyledCallout>
    ) : null}
    {configDraft.hasUnsavedChanges &&
    configDraft.pendingChangedSections.length > 0 ? (
      <StyledCallout>
        <StyledPanelTitle>Pending Config Sections</StyledPanelTitle>
        <StyledPanelDescription>
          These customer settings sections have unsaved changes and will be
          written together on the next save.
        </StyledPanelDescription>
        <StyledTokenWrap>
          {configDraft.pendingChangedSections.map((section) => (
            <StyledToken key={section.key}>
              {getSectionLabel(section.key)}
            </StyledToken>
          ))}
        </StyledTokenWrap>
      </StyledCallout>
    ) : null}
    {snapshotApplyNotice !== null ? (
      <StyledCallout>
        <StyledPanelTitle>Latest Snapshot Application</StyledPanelTitle>
        <StyledPanelDescription>
          {getSnapshotApplyNoticeDescription(snapshotApplyNotice)} Save Config
          is still required to persist these draft changes.
        </StyledPanelDescription>
        <StyledTokenWrap>
          {snapshotApplyNotice.sectionLabels.map((sectionLabel) => (
            <StyledToken key={`snapshot-applied-${sectionLabel}`}>
              {sectionLabel}
            </StyledToken>
          ))}
        </StyledTokenWrap>
        <StyledConfigNote>
          Applied at {snapshotApplyNotice.appliedAt.slice(0, 16).replace('T', ' ')}
          {' / '}
          Impact warnings: {snapshotApplyNotice.impactWarningCount}
          {' / '}
          Risk acknowledgement:{' '}
          {snapshotApplyNotice.warningsAcknowledged ? 'yes' : 'not required'}
        </StyledConfigNote>
      </StyledCallout>
    ) : null}
  </>
);
