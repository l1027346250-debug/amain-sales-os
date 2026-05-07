import { useEffect, useState } from 'react';

import { useEnterpriseApiRequest } from '@/enterprise/shared/hooks/useEnterpriseApiRequest';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

import { type EnterpriseMailboxWorkspaceMember } from '~/pages/enterprise/mailbox-control/types/enterprise-mailbox-control.types';

export const useEnterpriseMailboxWorkspaceMembers = () => {
  const enterpriseApiRequest = useEnterpriseApiRequest();
  const { enqueueErrorSnackBar } = useSnackBar();
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceMembers, setWorkspaceMembers] = useState<
    EnterpriseMailboxWorkspaceMember[]
  >([]);

  const loadWorkspaceMembers = async () => {
    setIsLoading(true);

    try {
      const response = await enterpriseApiRequest(
        '/api/enterprise/mailbox-workspace-members',
        {
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to load enterprise mailbox workspace members');
      }

      const data = (await response.json()) as EnterpriseMailboxWorkspaceMember[];

      setWorkspaceMembers(data);
    } catch {
      enqueueErrorSnackBar({
        message: 'Unable to load workspace members for mailbox assignment',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkspaceMembers();
  }, []);

  return {
    isLoading,
    loadWorkspaceMembers,
    workspaceMembers,
  };
};
