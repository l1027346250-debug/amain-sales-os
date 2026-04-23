import { styled } from '@linaria/react';

import { type useTradeCrmCustomerConfigDraft } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigDraft';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type TradeCrmCustomerConfigHistoryPanelProps = {
  configDraft: ReturnType<typeof useTradeCrmCustomerConfigDraft>;
};

type ConfigHistorySummarySegment = {
  detail: string;
  label: string;
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

const StyledHighlightedHistoryNode = styled(StyledFilterNode)`
  background: linear-gradient(
    180deg,
    ${tradeCrmUiTheme.colors.surface},
    ${tradeCrmUiTheme.colors.surfaceMuted}
  );
  border-color: ${tradeCrmUiTheme.colors.focusRing};
  box-shadow: inset 0 0 0 1px ${tradeCrmUiTheme.colors.focusRing};
`;

const StyledHistorySummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledHistoryMetaRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledHistorySegmentWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledHistorySegment = styled.div`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  display: flex;
  flex: 1 1 240px;
  flex-direction: column;
  gap: 4px;
  min-width: 220px;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledHistorySegmentLabel = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const StyledHistorySegmentText = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

const StyledNodeCount = styled.div`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledToken = styled.div`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.xs};
  padding: 4px 10px;
`;

const StyledConfigNote = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

const stripConfigOperationSummarySuffix = (summary: string) =>
  summary.replace(/\s*\(\d+ section(?:s)?\)\s*$/u, '');

const getConfigHistorySummarySegments = (
  operationSummary: string,
): ConfigHistorySummarySegment[] =>
  stripConfigOperationSummarySuffix(operationSummary)
    .split(' | ')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      const delimiterIndex = segment.indexOf(':');

      if (delimiterIndex < 0) {
        return {
          detail: segment,
          label: 'Config',
        };
      }

      return {
        detail: segment.slice(delimiterIndex + 1).trim(),
        label: segment.slice(0, delimiterIndex).trim(),
      };
    });

export const TradeCrmCustomerConfigHistoryPanel = ({
  configDraft,
}: TradeCrmCustomerConfigHistoryPanelProps) => (
  <StyledPanel>
    <StyledPanelTitle>
      Recent Config Changes ({configDraft.configOperationHistoryItems.length}
      {configDraft.configOperationHistoryTotalCount >
      configDraft.configOperationHistoryItems.length
        ? ` / ${configDraft.configOperationHistoryTotalCount}`
        : ''}
      )
    </StyledPanelTitle>
    <StyledPanelDescription>
      Keep a workspace-level audit trail for customer settings so rule,
      dictionary, and import-default updates can be reviewed without opening a
      specific customer record. Each save is broken into section-level change
      notes for faster review.
    </StyledPanelDescription>
    <StyledFilterList>
      {configDraft.configOperationHistoryItems.map((historyItem) => {
        const summarySegments = getConfigHistorySummarySegments(
          historyItem.operationSummary,
        );
        const HistoryNodeComponent =
          historyItem.id === configDraft.lastSavedConfigOperationId
            ? StyledHighlightedHistoryNode
            : StyledFilterNode;

        return (
          <HistoryNodeComponent key={historyItem.id}>
            <StyledHistorySummary>
              <StyledHistoryMetaRow>
                <StyledNodeCount>
                  {historyItem.operatorName ?? 'system'} /{' '}
                  {historyItem.operatedAt?.slice(0, 16).replace('T', ' ') ??
                    '--'}
                </StyledNodeCount>
                {historyItem.id === configDraft.lastSavedConfigOperationId ? (
                  <StyledToken>Latest save</StyledToken>
                ) : null}
                <StyledToken>{historyItem.operationType ?? 'CONFIG'}</StyledToken>
              </StyledHistoryMetaRow>
              <StyledHistorySegmentWrap>
                {summarySegments.map((segment) => (
                  <StyledHistorySegment
                    key={`${historyItem.id}-${segment.label}`}
                  >
                    <StyledHistorySegmentLabel>
                      {segment.label}
                    </StyledHistorySegmentLabel>
                    <StyledHistorySegmentText>
                      {segment.detail}
                    </StyledHistorySegmentText>
                  </StyledHistorySegment>
                ))}
              </StyledHistorySegmentWrap>
            </StyledHistorySummary>
          </HistoryNodeComponent>
        );
      })}
      {configDraft.configOperationHistoryItems.length === 0 ? (
        <StyledConfigNote>
          No customer-setting change has been audited yet. Saving a config
          update will create the first workspace-level log entry here.
        </StyledConfigNote>
      ) : null}
    </StyledFilterList>
  </StyledPanel>
);
