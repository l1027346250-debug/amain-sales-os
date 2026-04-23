import { styled } from '@linaria/react';
import { Link } from 'react-router-dom';

import {
  TradeCrmCustomerTable,
  type TradeCrmCustomerTableRow,
} from '@/trade-crm/customers/components/TradeCrmCustomerTable';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type CustomerSegmentItem = {
  count: string;
  label: string;
};

type CustomerWorkspaceViewLink = {
  label: string;
  to: string;
};

type TradeCrmCustomerListContentPanelsProps = {
  companiesWithTagsCount: number;
  contactCount: number;
  customerRows: TradeCrmCustomerTableRow[];
  quickFilterTokens: string[];
  segmentItems: CustomerSegmentItem[];
  tableColumns: string[];
  workspaceViewLinks: CustomerWorkspaceViewLink[];
};

const StyledSplitGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: 300px minmax(0, 1fr);

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

const StyledQuickLinkList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledQuickLink = styled(Link)`
  align-items: center;
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: inherit;
  display: flex;
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[3]};
  text-decoration: none;

  &:hover {
    border-color: ${tradeCrmUiTheme.colors.borderStrong};
  }
`;

const StyledMetricGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
`;

const StyledMetricCard = styled.section`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledMetricLabel = styled.div`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
  margin-bottom: ${themeCssVariables.spacing[2]};
`;

const StyledMetricValue = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledMetricHint = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
  margin-top: ${themeCssVariables.spacing[2]};
`;

export const TradeCrmCustomerListContentPanels = ({
  companiesWithTagsCount,
  contactCount,
  customerRows,
  quickFilterTokens,
  segmentItems,
  tableColumns,
  workspaceViewLinks,
}: TradeCrmCustomerListContentPanelsProps) => (
  <StyledSplitGrid>
    <StyledStack>
      <StyledPanel>
        <StyledPanelTitle>Customer Segments</StyledPanelTitle>
        <StyledPanelDescription>
          Mirror the OKKI left-tree pattern with counts that sellers can use for
          quick slicing.
        </StyledPanelDescription>
        <StyledFilterList>
          {segmentItems.map((item) => (
            <StyledFilterNode key={item.label}>
              <StyledNodeLabel>{item.label}</StyledNodeLabel>
              <StyledNodeCount>{item.count}</StyledNodeCount>
            </StyledFilterNode>
          ))}
        </StyledFilterList>
      </StyledPanel>
      <StyledPanel>
        <StyledPanelTitle>Quick Filters</StyledPanelTitle>
        <StyledTokenWrap>
          {quickFilterTokens.map((token) => (
            <StyledToken key={token}>{token}</StyledToken>
          ))}
        </StyledTokenWrap>
      </StyledPanel>
      <StyledPanel>
        <StyledPanelTitle>Workspace Views</StyledPanelTitle>
        <StyledPanelDescription>
          Jump into the seeded Trade CRM company views when sellers need the
          native workspace table instead of the customer shell.
        </StyledPanelDescription>
        <StyledQuickLinkList>
          {workspaceViewLinks.map((viewLink) => (
            <StyledQuickLink key={viewLink.label} to={viewLink.to}>
              <StyledNodeLabel>{viewLink.label}</StyledNodeLabel>
              <StyledNodeCount>Open view</StyledNodeCount>
            </StyledQuickLink>
          ))}
        </StyledQuickLinkList>
      </StyledPanel>
    </StyledStack>
    <StyledStack>
      <TradeCrmCustomerTable
        title="Customer List"
        description="Keep company, owner, region, segmentation, and next action on the same row so customer follow-up decisions are visible at list level."
        columns={tableColumns}
        rows={customerRows}
        emptyState="No customer companies are available yet."
      />
      <StyledPanel>
        <StyledPanelTitle>Contact Coverage</StyledPanelTitle>
        <StyledPanelDescription>
          Contacts stay subordinate to company customers in the first formal
          release, but the workspace still keeps visibility on reachable people
          and follow-up density.
        </StyledPanelDescription>
        <StyledMetricGrid>
          <StyledMetricCard>
            <StyledMetricLabel>Visible contacts</StyledMetricLabel>
            <StyledMetricValue>{contactCount}</StyledMetricValue>
            <StyledMetricHint>
              Person records remain available as customer contacts, not as a
              parallel customer master.
            </StyledMetricHint>
          </StyledMetricCard>
          <StyledMetricCard>
            <StyledMetricLabel>Companies with tags</StyledMetricLabel>
            <StyledMetricValue>{companiesWithTagsCount}</StyledMetricValue>
            <StyledMetricHint>
              Company-level segmentation stays in the primary list and config
              center.
            </StyledMetricHint>
          </StyledMetricCard>
        </StyledMetricGrid>
      </StyledPanel>
    </StyledStack>
  </StyledSplitGrid>
);
