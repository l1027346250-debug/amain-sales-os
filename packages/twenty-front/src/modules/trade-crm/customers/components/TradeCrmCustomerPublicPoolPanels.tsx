import { styled } from '@linaria/react';

import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type TradeCrmCustomerPublicPoolToolbarProps = {
  claimableCustomerCount: number;
  onSearchTermChange: (value: string) => void;
  searchTerm: string;
};

type TradeCrmCustomerPublicPoolClaimActionPanelProps = {
  canClaimFirstPublicPoolCustomer: boolean;
  canClaimVisiblePublicPoolCustomers: boolean;
  firstClaimableCustomerName: string | null;
  isClaimingPublicPoolCustomer: boolean;
  onClaimFirstPublicPoolCustomer: () => void;
  onClaimVisiblePublicPoolCustomers: () => void;
  visiblePublicPoolCustomerCount: number;
};

type TradeCrmCustomerPublicPoolRuleSummaryPanelProps = {
  inactivityDays: number;
  isOwnerReminderEnabled: boolean;
  publicPoolGroup: string;
  publicPoolRecordCount: number;
  recycleCandidateCount: number;
  stageScopeCount: number;
};

const StyledToolbar = styled.div`
  align-items: center;
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledSearchInput = styled.input`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  flex: 1 1 240px;
  font: inherit;
  min-width: 200px;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledFilterSummary = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  margin-left: auto;
`;

const StyledActionBar = styled.div`
  align-items: flex-start;
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

const StyledFilterList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledFilterNode = styled.div`
  align-items: center;
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  display: flex;
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledNodeLabel = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledNodeCount = styled.div`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledConfigNote = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

export const TradeCrmCustomerPublicPoolToolbar = ({
  claimableCustomerCount,
  onSearchTermChange,
  searchTerm,
}: TradeCrmCustomerPublicPoolToolbarProps) => (
  <StyledToolbar>
    <StyledSearchInput
      value={searchTerm}
      onChange={(event) => onSearchTermChange(event.target.value)}
      placeholder="Search claimable accounts by company, owner, country, or tags"
    />
    <StyledFilterSummary>
      {claimableCustomerCount} claimable accounts visible
    </StyledFilterSummary>
  </StyledToolbar>
);

export const TradeCrmCustomerPublicPoolClaimActionPanel = ({
  canClaimFirstPublicPoolCustomer,
  canClaimVisiblePublicPoolCustomers,
  firstClaimableCustomerName,
  isClaimingPublicPoolCustomer,
  onClaimFirstPublicPoolCustomer,
  onClaimVisiblePublicPoolCustomers,
  visiblePublicPoolCustomerCount,
}: TradeCrmCustomerPublicPoolClaimActionPanelProps) => (
  <StyledActionBar>
    <StyledActionMeta>
      <span>
        {firstClaimableCustomerName !== null
          ? `Next claim: ${firstClaimableCustomerName}`
          : 'No public-pool customer selected'}
      </span>
      <span>
        Claim writes the current workspace member as owner, clears public-pool
        state, and logs the operation.
      </span>
    </StyledActionMeta>
    <StyledActionButtons>
      <StyledControlButton
        $tone="primary"
        disabled={!canClaimFirstPublicPoolCustomer}
        type="button"
        onClick={onClaimFirstPublicPoolCustomer}
      >
        {isClaimingPublicPoolCustomer ? 'Claiming...' : 'Claim First Customer'}
      </StyledControlButton>
      <StyledControlButton
        disabled={!canClaimVisiblePublicPoolCustomers}
        type="button"
        onClick={onClaimVisiblePublicPoolCustomers}
      >
        {isClaimingPublicPoolCustomer
          ? 'Claiming...'
          : `Claim Visible (${visiblePublicPoolCustomerCount})`}
      </StyledControlButton>
    </StyledActionButtons>
  </StyledActionBar>
);

export const TradeCrmCustomerPublicPoolRuleSummaryPanel = ({
  inactivityDays,
  isOwnerReminderEnabled,
  publicPoolGroup,
  publicPoolRecordCount,
  recycleCandidateCount,
  stageScopeCount,
}: TradeCrmCustomerPublicPoolRuleSummaryPanelProps) => (
  <StyledPanel>
    <StyledPanelTitle>Move to Public Pool Modes</StyledPanelTitle>
    <StyledFilterList>
      {[
        [`No follow-up > ${inactivityDays}d`, `${recycleCandidateCount}`],
        ['Destination group', publicPoolGroup],
        ['Public pool state', `${publicPoolRecordCount}`],
        ['Stage watchlist', `${stageScopeCount}`],
      ].map(([label, count]) => (
        <StyledFilterNode key={label}>
          <StyledNodeLabel>{label}</StyledNodeLabel>
          <StyledNodeCount>{count}</StyledNodeCount>
        </StyledFilterNode>
      ))}
    </StyledFilterList>
    <StyledConfigNote>
      {isOwnerReminderEnabled
        ? 'Owners are warned before recycle and the original owner remains visible in the pooled record.'
        : 'Direct recycle is enabled and the original owner remains visible only in the audit lane.'}
    </StyledConfigNote>
  </StyledPanel>
);
