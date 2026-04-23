import { styled } from '@linaria/react';

import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type CustomerMatchingRule = {
  field: string;
  weight: number;
};

type TradeCrmCustomerDedupToolbarProps = {
  isSearchingDedupCandidates: boolean;
  onSearchTermChange: (value: string) => void;
  searchTerm: string;
  totalCandidateCount: number;
};

type TradeCrmCustomerDedupMergeActionPanelProps = {
  canMergeTopCandidates: boolean;
  duplicateCandidateCount: number;
  isMergingCustomers: boolean;
  onMergeTopCandidates: () => void;
  primaryCustomerName: string | null;
};

type TradeCrmCustomerDedupSearchScopePanelProps = {
  appliedMatchingRules: CustomerMatchingRule[];
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

export const TradeCrmCustomerDedupToolbar = ({
  isSearchingDedupCandidates,
  onSearchTermChange,
  searchTerm,
  totalCandidateCount,
}: TradeCrmCustomerDedupToolbarProps) => (
  <StyledToolbar>
    <StyledSearchInput
      value={searchTerm}
      onChange={(event) => onSearchTermChange(event.target.value)}
      placeholder="Search duplicate candidates by company, email, phone, or country"
    />
    <StyledFilterSummary>
      {searchTerm.trim().length === 0
        ? 'Enter a company, email, phone, contact, country, or social account'
        : isSearchingDedupCandidates
          ? 'Searching duplicate candidates...'
          : `${totalCandidateCount} potential candidates in current scope`}
    </StyledFilterSummary>
  </StyledToolbar>
);

export const TradeCrmCustomerDedupMergeActionPanel = ({
  canMergeTopCandidates,
  duplicateCandidateCount,
  isMergingCustomers,
  onMergeTopCandidates,
  primaryCustomerName,
}: TradeCrmCustomerDedupMergeActionPanelProps) => (
  <StyledActionBar>
    <StyledActionMeta>
      <span>
        {primaryCustomerName !== null
          ? `Primary record: ${primaryCustomerName}`
          : 'Search first to select a primary customer'}
      </span>
      <span>
        {duplicateCandidateCount > 0
          ? `${duplicateCandidateCount} top duplicate candidate(s) will be migrated into the primary customer and audit logged.`
          : 'Merge requires at least two dedup hits.'}
      </span>
    </StyledActionMeta>
    <StyledActionButtons>
      <StyledControlButton
        $tone="danger"
        disabled={!canMergeTopCandidates}
        type="button"
        onClick={onMergeTopCandidates}
      >
        {isMergingCustomers ? 'Merging...' : 'Merge Top Candidates'}
      </StyledControlButton>
    </StyledActionButtons>
  </StyledActionBar>
);

export const TradeCrmCustomerDedupSearchScopePanel = ({
  appliedMatchingRules,
}: TradeCrmCustomerDedupSearchScopePanelProps) => (
  <StyledCallout>
    <StyledPanelTitle>Dedup Search Scope</StyledPanelTitle>
    <StyledPanelDescription>
      Search company name, short name, contact email, phone, country, and social
      fields from one bar. This keeps manual dedup and import dedup aligned.
    </StyledPanelDescription>
    <StyledTokenWrap>
      {['All', ...appliedMatchingRules.map((rule) => rule.field)].map(
        (token) => (
          <StyledToken key={token}>{token}</StyledToken>
        ),
      )}
    </StyledTokenWrap>
  </StyledCallout>
);
