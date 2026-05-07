import { useEffect, useState } from 'react';

import { useEnterpriseApiRequest } from '@/enterprise/shared/hooks/useEnterpriseApiRequest';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

import { type EnterpriseMailboxHealthSnapshot } from '~/pages/enterprise/mailbox-control/types/enterprise-mailbox-control.types';

export const useEnterpriseMailboxHealth = () => {
  const enterpriseApiRequest = useEnterpriseApiRequest();
  const { enqueueErrorSnackBar } = useSnackBar();
  const [mailboxHealthSnapshots, setMailboxHealthSnapshots] = useState<
    EnterpriseMailboxHealthSnapshot[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMailboxHealth = async () => {
    setIsLoading(true);

    try {
      const response = await enterpriseApiRequest('/api/enterprise/mailbox-health');

      if (!response.ok) {
        throw new Error('Failed to load mailbox health');
      }

      const data = (await response.json()) as EnterpriseMailboxHealthSnapshot[];

      setMailboxHealthSnapshots(data);
    } catch {
      enqueueErrorSnackBar({ message: 'Unable to load mailbox health' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMailboxHealth();
  }, []);

  return {
    isLoading,
    loadMailboxHealth,
    mailboxHealthSnapshots,
  };
};
