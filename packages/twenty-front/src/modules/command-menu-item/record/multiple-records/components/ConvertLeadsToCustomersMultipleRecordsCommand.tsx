import { CommandMenuItemDisplay } from '@/command-menu-item/display/components/CommandMenuItemDisplay';
import { CommandConfigContext } from '@/command-menu-item/contexts/CommandConfigContext';
import { useCloseCommandMenu } from '@/command-menu-item/hooks/useCloseCommandMenu';
import { useSelectedRecordIds } from '@/command-menu-item/record/single-record/hooks/useSelectedRecordIds';
import { computeProgressText } from '@/command-menu-item/utils/computeProgressText';
import { getCommandMenuItemLabel } from '@/command-menu-item/utils/getCommandMenuItemLabel';
import { useTradeCrmLeadConversion } from '@/trade-crm/customers/hooks/useTradeCrmLeadConversion';
import { getTradeCrmCustomerPath } from '@/trade-crm/customers/utils/tradeCrmCustomerRouting';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { t } from '@lingui/core/macro';
import { useContext, useMemo, useState } from 'react';

export const ConvertLeadsToCustomersMultipleRecordsCommand = () => {
  const selectedLeadIds = useSelectedRecordIds();
  const { closeCommandMenu } = useCloseCommandMenu({});
  const { convertLeadToCustomer } = useTradeCrmLeadConversion();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar, enqueueWarningSnackBar } =
    useSnackBar();
  const actionConfig = useContext(CommandConfigContext);
  const [processedLeadCount, setProcessedLeadCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const actionConfigWithProgress = useMemo(() => {
    if (!actionConfig) {
      return null;
    }

    const originalLabel = getCommandMenuItemLabel(actionConfig.label);
    const originalShortLabel = getCommandMenuItemLabel(actionConfig.shortLabel);
    const progressText = computeProgressText({
      processedRecordCount: processedLeadCount,
      totalRecordCount: selectedLeadIds.length,
    });

    return {
      ...actionConfig,
      label: `${originalLabel}${progressText}`,
      shortLabel: `${originalShortLabel}${progressText}`,
    };
  }, [actionConfig, processedLeadCount, selectedLeadIds.length]);

  if (!actionConfigWithProgress) {
    return null;
  }

  const handleClick = async () => {
    if (isRunning || selectedLeadIds.length === 0) {
      return;
    }

    setIsRunning(true);
    setProcessedLeadCount(0);

    try {
      let successfulLeadCount = 0;
      let failedLeadCount = 0;
      let alreadyConvertedLeadCount = 0;
      let reusedCustomerCount = 0;
      let reusedContactCount = 0;

      for (const leadId of selectedLeadIds) {
        try {
          const result = await convertLeadToCustomer(leadId);

          if (result?.customerId) {
            successfulLeadCount += 1;
            if (result.alreadyConverted) {
              alreadyConvertedLeadCount += 1;
            }
            if (result.customerReused) {
              reusedCustomerCount += 1;
            }
            if (result.contactReused) {
              reusedContactCount += 1;
            }
          } else {
            failedLeadCount += 1;
          }
        } catch {
          failedLeadCount += 1;
        }

        setProcessedLeadCount((currentCount) => currentCount + 1);
      }

      closeCommandMenu();

      if (successfulLeadCount > 0 && failedLeadCount === 0) {
        enqueueSuccessSnackBar({
          message: `${successfulLeadCount} leads processed. ${alreadyConvertedLeadCount} already converted, ${reusedCustomerCount} customer reused, ${reusedContactCount} contact reused.`,
        });
      }

      if (successfulLeadCount > 0 && failedLeadCount > 0) {
        enqueueWarningSnackBar({
          message: `${successfulLeadCount} leads processed, ${failedLeadCount} failed. ${alreadyConvertedLeadCount} already converted, ${reusedCustomerCount} customer reused, ${reusedContactCount} contact reused.`,
        });
      }

      if (successfulLeadCount === 0 && failedLeadCount > 0) {
        enqueueErrorSnackBar({
          message: t`No selected leads could be converted`,
        });
        return;
      }

      window.location.assign(getTradeCrmCustomerPath('list'));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <CommandConfigContext.Provider value={actionConfigWithProgress}>
      <CommandMenuItemDisplay onClick={handleClick} disabled={isRunning} />
    </CommandConfigContext.Provider>
  );
};
