import { useEffect, useState } from 'react';

import { useEnterpriseApiRequest } from '@/enterprise/shared/hooks/useEnterpriseApiRequest';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

import { type EnterpriseMailboxAssignmentSnapshot } from '~/pages/enterprise/mailbox-control/types/enterprise-mailbox-control.types';

type UpdateEnterpriseMailboxAssignmentInput = {
  assignmentStatus?: string;
  isPrimaryMailbox?: boolean;
  canReceive?: boolean;
  canSend?: boolean;
  canViewSubordinates?: boolean;
  canHandleSubordinates?: boolean;
  canManageRules?: boolean;
  permissionCodes?: string[];
};

export const useEnterpriseMailboxAssignments = () => {
  const enterpriseApiRequest = useEnterpriseApiRequest();
  const { enqueueErrorSnackBar } = useSnackBar();
  const [mailboxAssignments, setMailboxAssignments] = useState<
    EnterpriseMailboxAssignmentSnapshot[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const getEnterpriseErrorMessage = async (response: Response) => {
    try {
      const data = (await response.json()) as {
        message?: string | string[];
      };

      if (Array.isArray(data.message)) {
        return data.message.join(', ');
      }

      return data.message ?? 'Mailbox assignment request failed';
    } catch {
      return 'Mailbox assignment request failed';
    }
  };

  const loadMailboxAssignments = async () => {
    setIsLoading(true);

    try {
      const response = await enterpriseApiRequest(
        '/api/enterprise/mailbox-assignments',
      );

      if (!response.ok) {
        throw new Error('Failed to load mailbox assignments');
      }

      const data =
        (await response.json()) as EnterpriseMailboxAssignmentSnapshot[];

      setMailboxAssignments(data);
    } catch {
      enqueueErrorSnackBar({ message: 'Unable to load mailbox assignments' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMailboxAssignments();
  }, []);

  const updateMailboxAssignment = async (
    mailboxAssignmentId: string,
    input: UpdateEnterpriseMailboxAssignmentInput,
  ) => {
    const response = await enterpriseApiRequest(
      `/api/enterprise/mailbox-assignments/${mailboxAssignmentId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      },
    );

    if (!response.ok) {
      throw new Error(await getEnterpriseErrorMessage(response));
    }

    await loadMailboxAssignments();
  };

  return {
    isLoading,
    loadMailboxAssignments,
    mailboxAssignments,
    updateMailboxAssignment,
  };
};
