import { useEffect, useMemo, useState } from 'react';

import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { getIntegrationHubApiBaseUrl } from '@/workbench/utils/getIntegrationHubApiBaseUrl';

type FirstResponseRiskReminder = {
  leadId: string;
  leadName: string | null;
  email: string | null;
  assignedToId: string | null;
  createdAt: string | null;
  overdueHours: number | null;
};

type LeadFirstResponseOverviewResponse = {
  summary?: {
    overdueCount?: number;
  };
  reminders?: FirstResponseRiskReminder[];
};

export const useLeadFirstResponseRisk = () => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const [data, setData] = useState<LeadFirstResponseOverviewResponse | null>(
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
          `${integrationHubApiBaseUrl}/lead-monitoring/first-response`,
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
          (await response.json()) as LeadFirstResponseOverviewResponse;

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

  const allSellerRiskReminders = useMemo(() => {
    const reminders = data?.reminders ?? [];

    if (!currentWorkspaceMember?.id) {
      return reminders;
    }

    return reminders.filter(
      (reminder) => reminder.assignedToId === currentWorkspaceMember.id,
    );
  }, [currentWorkspaceMember?.id, data?.reminders]);

  const sellerRiskReminders = useMemo(
    () => allSellerRiskReminders.slice(0, 5),
    [allSellerRiskReminders],
  );

  return {
    integrationHubApiBaseUrl,
    loading,
    errorMessage,
    sellerRiskReminders,
    totalRiskCount:
      currentWorkspaceMember?.id != null
        ? allSellerRiskReminders.length
        : (data?.summary?.overdueCount ?? allSellerRiskReminders.length),
  };
};

