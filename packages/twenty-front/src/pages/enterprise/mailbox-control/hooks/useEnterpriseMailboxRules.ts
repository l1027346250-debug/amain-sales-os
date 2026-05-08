import { useEffect, useState } from 'react';

import { useEnterpriseApiRequest } from '@/enterprise/shared/hooks/useEnterpriseApiRequest';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

import {
  type EnterpriseMailboxRuleExecutionResult,
  type EnterpriseMailboxRuleDryRunPreview,
  type EnterpriseMailboxRule,
  type EnterpriseMailboxRuleActivity,
  type EnterpriseMailboxRuleReadinessPreview,
} from '~/pages/enterprise/mailbox-control/types/enterprise-mailbox-control.types';

type CreateEnterpriseMailboxRuleInput = {
  mailboxProfileId: string;
  name: string;
  ruleType: string;
  enabled: boolean;
  priority: number;
  conditionsJson?: Record<string, unknown> | null;
  actionsJson?: Record<string, unknown> | null;
};

type UpdateEnterpriseMailboxRuleInput = {
  mailboxProfileId?: string;
  name?: string;
  ruleType?: string;
  conditionsJson?: Record<string, unknown> | null;
  actionsJson?: Record<string, unknown> | null;
  enabled?: boolean;
  priority?: number;
};

export const useEnterpriseMailboxRules = () => {
  const enterpriseApiRequest = useEnterpriseApiRequest();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const [isLoading, setIsLoading] = useState(true);
  const [mailboxRules, setMailboxRules] = useState<EnterpriseMailboxRule[]>([]);
  const [mailboxRuleActivity, setMailboxRuleActivity] = useState<
    EnterpriseMailboxRuleActivity[]
  >([]);
  const [mailboxRuleResults, setMailboxRuleResults] = useState<
    EnterpriseMailboxRuleExecutionResult[]
  >([]);
  const [mailboxRuleReadiness, setMailboxRuleReadiness] = useState<
    EnterpriseMailboxRuleReadinessPreview[]
  >([]);
  const [mailboxRulePreviewsById, setMailboxRulePreviewsById] = useState<
    Record<string, EnterpriseMailboxRuleDryRunPreview>
  >({});
  const [previewLoadingRuleId, setPreviewLoadingRuleId] = useState<string | null>(
    null,
  );

  const loadMailboxRules = async () => {
    setIsLoading(true);

    try {
      const rulesResponse = await enterpriseApiRequest(
        '/api/enterprise/mailbox-rules',
      );

      if (!rulesResponse.ok) {
        throw new Error('Failed to load mailbox rules');
      }

      const rulesData = (await rulesResponse.json()) as EnterpriseMailboxRule[];

      setMailboxRules(rulesData);

      try {
        const activityResponse = await enterpriseApiRequest(
          '/api/enterprise/mailbox-rules/activity',
        );

        if (activityResponse.ok) {
          const activityData =
            (await activityResponse.json()) as EnterpriseMailboxRuleActivity[];
          setMailboxRuleActivity(activityData);
        } else {
          setMailboxRuleActivity([]);
        }
      } catch {
        setMailboxRuleActivity([]);
      }

      try {
        const resultsResponse = await enterpriseApiRequest(
          '/api/enterprise/mailbox-rules/results',
        );

        if (resultsResponse.ok) {
          const resultsData =
            (await resultsResponse.json()) as EnterpriseMailboxRuleExecutionResult[];
          setMailboxRuleResults(resultsData);
        } else {
          setMailboxRuleResults([]);
        }
      } catch {
        setMailboxRuleResults([]);
      }

      try {
        const readinessResponse = await enterpriseApiRequest(
          '/api/enterprise/mailbox-rules/readiness',
        );

        if (readinessResponse.ok) {
          const readinessData =
            (await readinessResponse.json()) as EnterpriseMailboxRuleReadinessPreview[];

          setMailboxRuleReadiness(readinessData);
        } else {
          setMailboxRuleReadiness([]);
        }
      } catch {
        setMailboxRuleReadiness([]);
      }
    } catch {
      enqueueErrorSnackBar({ message: 'Unable to load mailbox rules' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMailboxRulePreview = async (mailboxRuleId: string) => {
    setPreviewLoadingRuleId(mailboxRuleId);

    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/mailbox-rules/${mailboxRuleId}/preview`,
      );

      if (!response.ok) {
        throw new Error('Failed to load mailbox rule preview');
      }

      const previewData =
        (await response.json()) as EnterpriseMailboxRuleDryRunPreview;

      setMailboxRulePreviewsById((currentValue) => ({
        ...currentValue,
        [mailboxRuleId]: previewData,
      }));
    } catch {
      enqueueErrorSnackBar({ message: 'Unable to load mailbox rule preview' });
    } finally {
      setPreviewLoadingRuleId(null);
    }
  };

  const runMailboxRuleNow = async (mailboxRuleId: string) => {
    const response = await enterpriseApiRequest(
      `/api/enterprise/mailbox-rules/${mailboxRuleId}/run`,
      {
        method: 'POST',
      },
    );

    if (!response.ok) {
      throw new Error('Failed to run mailbox rule');
    }

    enqueueSuccessSnackBar({ message: 'Mailbox rule executed' });
    await loadMailboxRules();
  };

  useEffect(() => {
    void loadMailboxRules();
  }, []);

  const createMailboxRule = async (input: CreateEnterpriseMailboxRuleInput) => {
    const response = await enterpriseApiRequest('/api/enterprise/mailbox-rules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error('Failed to create mailbox rule');
    }

    enqueueSuccessSnackBar({ message: 'Mailbox rule created' });
    await loadMailboxRules();
  };

  const updateMailboxRule = async (
    mailboxRuleId: string,
    input: UpdateEnterpriseMailboxRuleInput,
  ) => {
    const response = await enterpriseApiRequest(
      `/api/enterprise/mailbox-rules/${mailboxRuleId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      },
    );

    if (!response.ok) {
      throw new Error('Failed to update mailbox rule');
    }

    enqueueSuccessSnackBar({ message: 'Mailbox rule updated' });
    await loadMailboxRules();
  };

  return {
    createMailboxRule,
    isLoading,
    loadMailboxRules,
    loadMailboxRulePreview,
    mailboxRuleActivity,
    mailboxRuleResults,
    mailboxRulePreviewsById,
    mailboxRuleReadiness,
    mailboxRules,
    previewLoadingRuleId,
    runMailboxRuleNow,
    updateMailboxRule,
  };
};
