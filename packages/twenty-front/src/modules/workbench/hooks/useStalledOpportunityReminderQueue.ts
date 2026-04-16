import { useEffect, useMemo, useState } from 'react';

import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { getIntegrationHubApiBaseUrl } from '@/workbench/utils/getIntegrationHubApiBaseUrl';

type StalledReminder = {
  opportunityId: string;
  opportunityName: string | null;
  stage: string | null;
  assignedToId: string | null;
  companyName: string | null;
  updatedAt: string | null;
  stalledDays: number | null;
  assigneeState?: 'assigned' | 'unassigned';
  reminderReason?: string;
  hasPreparedTaskRequest?: boolean;
  taskAlreadyApplied?: boolean;
};

type StalledReminderQueueResponse = {
  summary?: {
    stalledCount?: number;
  };
  opportunities?: StalledReminder[];
};

export const useStalledOpportunityReminderQueue = () => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const [data, setData] = useState<StalledReminderQueueResponse | null>(null);
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
          `${integrationHubApiBaseUrl}/opportunity-monitoring/stalled/reminders`,
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

        const payload = (await response.json()) as StalledReminderQueueResponse;

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
    stalledOpportunityReminders: allSellerReminders.slice(0, 5),
    totalStalledOpportunityReminderCount:
      currentWorkspaceMember?.id != null
        ? allSellerReminders.length
        : (data?.summary?.stalledCount ?? allSellerReminders.length),
  };
};
