import { useMemo } from 'react';

import { useTradeCrmCustomerConfigDraft } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigDraft';
import type { useTradeCrmCustomerWorkspaceData } from '@/trade-crm/customers/hooks/useTradeCrmCustomerWorkspaceData';
import { getPublicPoolGroupLabels } from '@/trade-crm/customers/utils/tradeCrmCustomerConfigWorkspace';

export const useTradeCrmCustomerRuntimeConfig = (
  workspaceData: ReturnType<typeof useTradeCrmCustomerWorkspaceData>,
) => {
  const configDraft = useTradeCrmCustomerConfigDraft({
    customerStageSummary: workspaceData.customerStageSummary,
    customerGroupSummary: workspaceData.customerGroupSummary,
    customerTagSummary: workspaceData.customerTagSummary,
    customerSourceSummary: workspaceData.customerSourceSummary,
    publicPoolGroupLabels: getPublicPoolGroupLabels(
      workspaceData.publicPoolRecords,
    ),
  });

  const publicPoolGroupLabels = useMemo(
    () =>
      [
        ...getPublicPoolGroupLabels(workspaceData.publicPoolRecords),
        configDraft.draft.publicPoolRule.publicPoolGroup,
      ].filter(
        (label, index, labels) =>
          label.length > 0 && labels.indexOf(label) === index,
      ),
    [
      configDraft.draft.publicPoolRule.publicPoolGroup,
      workspaceData.publicPoolRecords,
    ],
  );

  return {
    configDraft,
    publicPoolGroupLabels,
  };
};
