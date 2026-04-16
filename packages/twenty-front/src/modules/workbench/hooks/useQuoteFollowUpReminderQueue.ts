import { useEffect, useMemo, useState } from 'react';

import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { getIntegrationHubApiBaseUrl } from '@/workbench/utils/getIntegrationHubApiBaseUrl';

type QuoteFollowUpReminder = {
  opportunityId: string;
  opportunityName: string | null;
  stage: string | null;
  assignedToId: string | null;
  companyName: string | null;
  updatedAt: string | null;
  overdueDays: number | null;
  assigneeState?: 'assigned' | 'unassigned';
  reminderReason?: string;
  hasPreparedTaskRequest?: boolean;
  taskAlreadyApplied?: boolean;
};

type QuoteFollowUpReminderQueueResponse = {
  summary?: {
    overdueCount?: number;
  };
  opportunities?: QuoteFollowUpReminder[];
};

export const useQuoteFollowUpReminderQueue = () => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const [data, setData] = useState<QuoteFollowUpReminderQueueResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const integrationHubApiBaseUrl = getIntegrationHubApiBaseUrl();

  useEffect(() => {
    if (!integrationHubApiBaseUrl) {
      setData(null);
      setLoading(false);
      setErrorMessage('integration-hub-base-url-missing');

      return;
    }

    let isCancelled = false;

    const run = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(
          `${integrationHubApiBaseUrl}/opportunity-monitoring/quote-follow-up/reminders`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `integration-hub request failed: ${response.status} ${response.statusText}`,
          );
        }

        const payload =
          (await response.json()) as QuoteFollowUpReminderQueueResponse;

        if (isCancelled) {
          return;
        }

        setData(payload);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : 'unknown-error',
        );
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      isCancelled = true;
    };
  }, [integrationHubApiBaseUrl]);

  const allSellerReminders = useMemo(() => {
    const reminders = data?.opportunities ?? [];

    if (!currentWorkspaceMember?.id) {
      return reminders;
    }

    return reminders.filter(
      (opportunity) => opportunity.assignedToId === currentWorkspaceMember.id,
    );
  }, [currentWorkspaceMember?.id, data?.opportunities]);

  return {
    integrationHubApiBaseUrl,
    loading,
    errorMessage,
    quoteFollowUpReminders: allSellerReminders.slice(0, 5),
    totalQuoteFollowUpReminderCount:
      currentWorkspaceMember?.id != null
        ? allSellerReminders.length
        : (data?.summary?.overdueCount ?? allSellerReminders.length),
  };
};
