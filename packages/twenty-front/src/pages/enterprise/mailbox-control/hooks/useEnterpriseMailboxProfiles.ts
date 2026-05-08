import { useEffect, useState } from 'react';

import { useEnterpriseApiRequest } from '@/enterprise/shared/hooks/useEnterpriseApiRequest';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

import { type EnterpriseMailboxProfile } from '~/pages/enterprise/mailbox-control/types/enterprise-mailbox-control.types';

export const useEnterpriseMailboxProfiles = () => {
  const enterpriseApiRequest = useEnterpriseApiRequest();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const [mailboxProfiles, setMailboxProfiles] = useState<
    EnterpriseMailboxProfile[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMailboxProfiles = async () => {
    setIsLoading(true);

    try {
      const response = await enterpriseApiRequest(
        '/api/enterprise/mailbox-profiles',
      );

      if (!response.ok) {
        throw new Error('Failed to load mailbox profiles');
      }

      const data = (await response.json()) as EnterpriseMailboxProfile[];

      setMailboxProfiles(data);
    } catch {
      enqueueErrorSnackBar({ message: 'Unable to load mailbox accounts' });
    } finally {
      setIsLoading(false);
    }
  };

  const getEnterpriseErrorMessage = async (response: Response) => {
    try {
      const data = (await response.json()) as {
        error?: string;
        message?: string | string[];
        messages?: string[];
      };

      if (Array.isArray(data.messages) && data.messages.length > 0) {
        return data.messages.join(', ');
      }

      if (Array.isArray(data.message) && data.message.length > 0) {
        return data.message.join(', ');
      }

      if (typeof data.message === 'string' && data.message.length > 0) {
        return data.message;
      }

      if (typeof data.error === 'string' && data.error.length > 0) {
        return data.error;
      }

      return 'Enterprise mailbox request failed';
    } catch {
      return 'Enterprise mailbox request failed';
    }
  };

  useEffect(() => {
    void loadMailboxProfiles();
  }, []);

  const createMailboxProfile = async (input: {
    emailAddress: string;
    loginUsername: string;
    secret: string;
  }) => {
    const response = await enterpriseApiRequest(
      '/api/enterprise/mailbox-profiles',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailAddress: input.emailAddress,
          provider: 'alibaba-mail',
          credentialMode: 'authorization-code',
          imapHost: 'imap.qiye.aliyun.com',
          imapPort: 993,
          imapSecure: true,
          smtpHost: 'smtp.qiye.aliyun.com',
          smtpPort: 465,
          smtpSecure: true,
          loginUsername: input.loginUsername,
          secret: input.secret,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(await getEnterpriseErrorMessage(response));
    }

    enqueueSuccessSnackBar({ message: 'Mailbox account created' });
    await loadMailboxProfiles();
  };

  const validateMailboxProfile = async (mailboxProfileId: string) => {
    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/mailbox-profiles/${mailboxProfileId}/validate`,
        {
          method: 'POST',
        },
      );

      if (!response.ok) {
        throw new Error(await getEnterpriseErrorMessage(response));
      }

      enqueueSuccessSnackBar({ message: 'Mailbox validation succeeded' });
    } finally {
      await loadMailboxProfiles();
    }
  };

  return {
    createMailboxProfile,
    isLoading,
    loadMailboxProfiles,
    mailboxProfiles,
    validateMailboxProfile,
  };
};
