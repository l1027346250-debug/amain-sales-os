import { useEffect, useState } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router-dom';

import type { useTradeCrmCustomerConfigDraft } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigDraft';

const DEFAULT_SAVE_FAILURE_MESSAGE =
  'Saving failed. Resolve validation issues or retry before leaving.';

export const useTradeCrmCustomerConfigNavigationGuard = ({
  configDraft,
  unsavedChangesMessage,
}: {
  configDraft: ReturnType<typeof useTradeCrmCustomerConfigDraft>;
  unsavedChangesMessage: string;
}) => {
  const leaveBlocker = useBlocker(configDraft.hasUnsavedChanges);
  const [blockedNavigationError, setBlockedNavigationError] = useState<
    string | null
  >(null);

  useBeforeUnload(
    (event) => {
      if (!configDraft.hasUnsavedChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = unsavedChangesMessage;
    },
    {
      capture: true,
    },
  );

  useEffect(() => {
    if (configDraft.hasUnsavedChanges) {
      return;
    }

    setBlockedNavigationError(null);
  }, [configDraft.hasUnsavedChanges]);

  const onDiscardAndProceed = () => {
    setBlockedNavigationError(null);
    configDraft.resetDraft();

    if (leaveBlocker.state === 'blocked') {
      leaveBlocker.proceed();
    }
  };

  const onSaveAndProceed = () => {
    void (async () => {
      setBlockedNavigationError(null);
      const didSave = await configDraft.saveDraft();

      if (didSave && leaveBlocker.state === 'blocked') {
        leaveBlocker.proceed();

        return;
      }

      setBlockedNavigationError(
        configDraft.saveError ?? DEFAULT_SAVE_FAILURE_MESSAGE,
      );
    })();
  };

  const onSaveConfig = () => {
    void configDraft.saveDraft();
  };

  const onStayOnPage = () => {
    setBlockedNavigationError(null);

    if (leaveBlocker.state === 'blocked') {
      leaveBlocker.reset();
    }
  };

  return {
    blockedNavigationError,
    isNavigationBlocked: leaveBlocker.state === 'blocked',
    onDiscardAndProceed,
    onSaveAndProceed,
    onSaveConfig,
    onStayOnPage,
  };
};
