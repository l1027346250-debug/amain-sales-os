import { useEffect, useMemo, useState } from 'react';

import { useMutation, useQuery } from '@apollo/client/react';
import { t } from '@lingui/core/macro';
import { Tag } from 'twenty-ui/components';
import {
  H2Title,
  IconBolt,
  IconLock,
  IconRobot,
  IconTestPipe,
} from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { Card, Section } from 'twenty-ui/layout';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { billingState } from '@/client-config/states/billingState';
import { useClientConfig } from '@/client-config/hooks/useClientConfig';
import { SettingsAdminAiModelsTable } from '@/settings/admin-panel/ai/components/SettingsAdminAiModelsTable';
import { SettingsAdminAiProviderListCard } from '@/settings/admin-panel/ai/components/SettingsAdminAiProviderListCard';
import { AI_PROVIDER_SOURCE } from '@/settings/admin-panel/ai/constants/AiProviderSource';
import { TEST_AI_PROVIDER_CONNECTION } from '@/settings/admin-panel/ai/graphql/mutations/testAiProviderConnection';
import { SET_ADMIN_AI_MODEL_RECOMMENDED } from '@/settings/admin-panel/ai/graphql/mutations/setAdminAiModelRecommended';
import { SET_ADMIN_DEFAULT_AI_MODEL } from '@/settings/admin-panel/ai/graphql/mutations/setAdminDefaultAiModel';
import { GET_ADMIN_AI_MODELS } from '@/settings/admin-panel/ai/graphql/queries/getAdminAiModels';
import { GET_ADMIN_AI_USAGE_BY_WORKSPACE } from '@/settings/admin-panel/ai/graphql/queries/getAdminAiUsageByWorkspace';
import { GET_AI_PROVIDERS } from '@/settings/admin-panel/ai/graphql/queries/getAiProviders';
import { type AiProviderItem } from '@/settings/admin-panel/ai/types/AiProviderItem';
import { type GetAiProvidersResult } from '@/settings/admin-panel/ai/types/GetAiProvidersResult';
import { getAiProviderReadiness } from '@/settings/admin-panel/ai/utils/getAiProviderReadiness';
import { getModelIcon } from '@/settings/admin-panel/ai/utils/getModelIcon';
import { parseProviderItems } from '@/settings/admin-panel/ai/utils/parseProviderItems';
import { type TestAiProviderConnectionResult } from '@/settings/admin-panel/ai/types/TestAiProviderConnectionResult';
import { SettingsAdminTabSkeletonLoader } from '@/settings/admin-panel/components/SettingsAdminTabSkeletonLoader';
import { SettingsEnterpriseFeatureGateCard } from '@/settings/components/SettingsEnterpriseFeatureGateCard';
import { SettingsOptionCardContentSelect } from '@/settings/components/SettingsOptions/SettingsOptionCardContentSelect';
import { useUsageValueFormatter } from '@/settings/usage/hooks/useUsageValueFormatter';
import { getPeriodDates } from '@/settings/usage/utils/getPeriodDates';
import { getPeriodOptions } from '@/settings/usage/utils/getPeriodOptions';
import { type PeriodPreset } from '@/settings/usage/utils/periodPreset';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { Select } from '@/ui/input/components/Select';
import { Table } from '@/ui/layout/table/components/Table';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';
import {
  AiModelRole,
  type AdminAiModelConfig,
} from '~/generated-metadata/graphql';

const USAGE_TABLE_GRID_TEMPLATE_COLUMNS = '1fr 120px';
const PROVIDER_PROBE_RESULTS_STORAGE_KEY =
  'settings-admin-ai-provider-probe-results';

type UsageBreakdownItem = {
  key: string;
  label?: string | null;
  creditsUsed: number;
};

type ProviderProbeSummary = {
  ok: boolean;
  testedAt: string;
  modelCount?: number;
  error?: string;
};

type ProviderFilterMode = 'all' | 'attention' | 'failed';

const getProviderFilterModeLabel = (filterMode: ProviderFilterMode) => {
  switch (filterMode) {
    case 'attention':
      return String(t`Showing providers that need attention`);
    case 'failed':
      return String(t`Showing providers with failed tests only`);
    default:
      return String(t`Showing all providers`);
  }
};

const sortProvidersByAttention = (
  providers: AiProviderItem[],
  probeResults: Record<string, ProviderProbeSummary>,
) =>
  [...providers].sort((leftProvider, rightProvider) => {
    const leftProbe = probeResults[leftProvider.id];
    const rightProbe = probeResults[rightProvider.id];
    const leftReadiness = getAiProviderReadiness(leftProvider);
    const rightReadiness = getAiProviderReadiness(rightProvider);

    const getPriority = (
      probe: ProviderProbeSummary | undefined,
      readiness: ReturnType<typeof getAiProviderReadiness>,
    ) => {
      if (probe?.ok === false) {
        return 0;
      }

      if (readiness.statusColor === 'orange') {
        return 1;
      }

      if (probe?.ok === true) {
        return 2;
      }

      return 3;
    };

    const priorityDifference =
      getPriority(leftProbe, leftReadiness) -
      getPriority(rightProbe, rightReadiness);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return (leftProvider.label ?? leftProvider.id).localeCompare(
      rightProvider.label ?? rightProvider.id,
    );
  });

export const SettingsAdminAI = () => {
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const { refetch: refetchClientConfig } = useClientConfig();
  const { formatUsageValue } = useUsageValueFormatter();
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const billing = useAtomStateValue(billingState);
  const isBillingEnabled = billing?.isBillingEnabled ?? false;
  const hasEnterpriseAccess =
    isBillingEnabled || currentWorkspace?.hasValidEnterpriseKey === true;
  const [usagePeriod, setUsagePeriod] = useState<PeriodPreset>('30d');
  const [testingProviderId, setTestingProviderId] = useState<string | null>(
    null,
  );
  const [isBatchTestingProviders, setIsBatchTestingProviders] = useState(false);
  const [providerFilterMode, setProviderFilterMode] =
    useState<ProviderFilterMode>('all');
  const [providerProbeResults, setProviderProbeResults] = useState<
    Record<string, ProviderProbeSummary>
  >(() => {
    if (typeof window === 'undefined') {
      return {};
    }

    try {
      const savedResults = window.localStorage.getItem(
        PROVIDER_PROBE_RESULTS_STORAGE_KEY,
      );

      if (!savedResults) {
        return {};
      }

      return JSON.parse(savedResults) as Record<string, ProviderProbeSummary>;
    } catch {
      return {};
    }
  });
  const periodOptions = getPeriodOptions();
  const usageDates = getPeriodDates(usagePeriod);
  const probeTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(
        PROVIDER_PROBE_RESULTS_STORAGE_KEY,
        JSON.stringify(providerProbeResults),
      );
    } catch {
      // Ignore storage failures and keep the in-memory fallback.
    }
  }, [providerProbeResults]);

  const { data, loading: isLoadingModels } = useQuery<{
    getAdminAiModels: {
      defaultSmartModelId?: string | null;
      defaultFastModelId?: string | null;
      models: AdminAiModelConfig[];
    };
  }>(GET_ADMIN_AI_MODELS);

  const [setModelRecommended] = useMutation(SET_ADMIN_AI_MODEL_RECOMMENDED);
  const [setDefaultModel] = useMutation(SET_ADMIN_DEFAULT_AI_MODEL);
  const [testAiProviderConnection] = useMutation<TestAiProviderConnectionResult>(
    TEST_AI_PROVIDER_CONNECTION,
  );

  const { data: providersData, loading: isLoadingProviders } =
    useQuery<GetAiProvidersResult>(GET_AI_PROVIDERS);

  const { data: usageData, previousData: previousUsageData } = useQuery<{
    getAdminAiUsageByWorkspace: UsageBreakdownItem[];
  }>(GET_ADMIN_AI_USAGE_BY_WORKSPACE, {
    variables: {
      periodStart: usageDates.periodStart,
      periodEnd: usageDates.periodEnd,
    },
    skip: !hasEnterpriseAccess,
  });

  const effectiveUsageData = usageData ?? previousUsageData;
  const usageByWorkspace = effectiveUsageData?.getAdminAiUsageByWorkspace ?? [];

  const models = data?.getAdminAiModels?.models ?? [];

  const providerItems = useMemo(
    () => parseProviderItems(providersData?.getAiProviders ?? {}),
    [providersData],
  );

  const catalogProviders = useMemo(
    () =>
      sortProvidersByAttention(
        providerItems.filter(
          (provider) => provider.source === AI_PROVIDER_SOURCE.CATALOG,
        ),
        providerProbeResults,
      ),
    [providerItems, providerProbeResults],
  );

  const customProviders = useMemo(
    () =>
      sortProvidersByAttention(
        providerItems.filter(
          (provider) => provider.source === AI_PROVIDER_SOURCE.CUSTOM,
        ),
        providerProbeResults,
      ),
    [providerItems, providerProbeResults],
  );

  const getProvidersNeedingAttention = (providers: AiProviderItem[]) =>
    providers.filter(
      (provider) => getAiProviderReadiness(provider).statusColor === 'orange',
    );

  const getVisibleProviders = (providers: AiProviderItem[]) => {
    switch (providerFilterMode) {
      case 'attention':
        return providers.filter(
          (provider) =>
            getAiProviderReadiness(provider).statusColor === 'orange' ||
            providerProbeResults[provider.id]?.ok === false,
        );
      case 'failed':
        return providers.filter(
          (provider) => providerProbeResults[provider.id]?.ok === false,
        );
      default:
        return providers;
    }
  };

  const getAttentionProviders = (providers: AiProviderItem[]) =>
    providers.filter(
      (provider) =>
        getAiProviderReadiness(provider).statusColor === 'orange' ||
        providerProbeResults[provider.id]?.ok === false,
    );

  const getFailedProviders = (providers: AiProviderItem[]) =>
    providers.filter((provider) => providerProbeResults[provider.id]?.ok === false);

  const handleResetProviderView = () => {
    setProviderFilterMode('all');
  };

  const visibleCatalogProviders = getVisibleProviders(catalogProviders);
  const visibleCustomProviders = getVisibleProviders(customProviders);
  const catalogAttentionCount = getAttentionProviders(catalogProviders).length;
  const customAttentionCount = getAttentionProviders(customProviders).length;
  const catalogFailedCount = getFailedProviders(catalogProviders).length;
  const customFailedCount = getFailedProviders(customProviders).length;

  if (isLoadingProviders || isLoadingModels) {
    return <SettingsAdminTabSkeletonLoader />;
  }

  const handleRecommendedToggle = async (
    modelId: string,
    isCurrentlyRecommended: boolean,
  ) => {
    try {
      await setModelRecommended({
        variables: { modelId, recommended: !isCurrentlyRecommended },
        refetchQueries: [{ query: GET_ADMIN_AI_MODELS }],
      });
      await refetchClientConfig();
    } catch {
      enqueueErrorSnackBar({
        message: t`Failed to update model recommendation`,
      });
    }
  };

  const defaultSmartModelId = data?.getAdminAiModels?.defaultSmartModelId;
  const defaultFastModelId = data?.getAdminAiModels?.defaultFastModelId;

  const enabledModels = models.filter(
    (model) => model.isAvailable && model.isAdminEnabled && !model.isDeprecated,
  );

  const availableModelOptions = enabledModels.map((model) => ({
    value: model.modelId,
    label: model.label,
    Icon: getModelIcon(model.modelFamily, model.providerName),
  }));

  const handleDefaultModelChange = async (
    role: AiModelRole,
    modelId: string,
  ) => {
    try {
      await setDefaultModel({
        variables: { role, modelId },
        refetchQueries: [{ query: GET_ADMIN_AI_MODELS }],
      });
      await refetchClientConfig();
    } catch {
      enqueueErrorSnackBar({
        message: t`Failed to update default model`,
      });
    }
  };

  const recordProviderProbeResult = (
    providerId: string,
    result: ProviderProbeSummary,
  ) => {
    setProviderProbeResults((currentResults) => ({
      ...currentResults,
      [providerId]: result,
    }));
  };

  const handleProviderProbe = async (provider: AiProviderItem) => {
    setTestingProviderId(provider.id);

    try {
      const result = await testAiProviderConnection({
        variables: {
          providerName: provider.id,
        },
      });

      const payload = result.data?.testAiProviderConnection as
        | { ok?: boolean; error?: string; modelCount?: number }
        | undefined;

      if (payload?.ok) {
        recordProviderProbeResult(provider.id, {
          ok: true,
          testedAt: probeTimeFormatter.format(new Date()),
          modelCount: payload.modelCount,
        });

        enqueueSuccessSnackBar({
          message:
            payload.modelCount !== undefined
              ? t`Provider test passed (${payload.modelCount} models found)`
              : t`Provider test passed`,
        });
      } else {
        recordProviderProbeResult(provider.id, {
          ok: false,
          testedAt: probeTimeFormatter.format(new Date()),
          error: payload?.error ?? t`Unknown error`,
        });

        enqueueErrorSnackBar({
          message: payload?.error
            ? `Provider test failed: ${payload.error}`
            : t`Provider test failed`,
        });
      }
    } catch {
      recordProviderProbeResult(provider.id, {
        ok: false,
        testedAt: probeTimeFormatter.format(new Date()),
        error: t`Request failed`,
      });

      enqueueErrorSnackBar({
        message: t`Provider test failed`,
      });
    } finally {
      setTestingProviderId(null);
    }
  };

  const handleProbeProviders = async (providers: AiProviderItem[]) => {
    if (providers.length === 0) {
      return;
    }

    setIsBatchTestingProviders(true);

    let successCount = 0;
    let failedCount = 0;

    for (const provider of providers) {
      setTestingProviderId(provider.id);

      try {
        const result = await testAiProviderConnection({
          variables: {
            providerName: provider.id,
          },
        });

        const payload = result.data?.testAiProviderConnection as
          | { ok?: boolean; error?: string; modelCount?: number }
          | undefined;

        if (payload?.ok) {
          successCount += 1;
          recordProviderProbeResult(provider.id, {
            ok: true,
            testedAt: probeTimeFormatter.format(new Date()),
            modelCount: payload.modelCount,
          });
        } else {
          failedCount += 1;
          recordProviderProbeResult(provider.id, {
            ok: false,
            testedAt: probeTimeFormatter.format(new Date()),
            error: payload?.error ?? t`Unknown error`,
          });
        }
      } catch {
        failedCount += 1;
        recordProviderProbeResult(provider.id, {
          ok: false,
          testedAt: probeTimeFormatter.format(new Date()),
          error: t`Request failed`,
        });
      }
    }

    setTestingProviderId(null);
    setIsBatchTestingProviders(false);

    if (failedCount === 0) {
      enqueueSuccessSnackBar({
        message: t`Batch test passed for ${successCount} providers`,
      });
    } else if (successCount === 0) {
      enqueueErrorSnackBar({
        message: t`Batch test failed for ${failedCount} providers`,
      });
    } else {
      enqueueErrorSnackBar({
        message: t`Batch test finished: ${successCount} passed, ${failedCount} failed`,
      });
    }
  };

  const handleProbeUnreadyProviders = async (providers: AiProviderItem[]) => {
    const unreadyProviders = getProvidersNeedingAttention(providers);

    if (unreadyProviders.length === 0) {
      enqueueSuccessSnackBar({
        message: t`All providers in this group are already marked ready`,
      });

      return;
    }

    await handleProbeProviders(unreadyProviders);
  };

  const handleRetestFailedProviders = async (providers: AiProviderItem[]) => {
    const failedProviders = providers.filter(
      (provider) => providerProbeResults[provider.id]?.ok === false,
    );

    if (failedProviders.length === 0) {
      enqueueSuccessSnackBar({
        message: t`No failed provider tests to retry in this group`,
      });

      return;
    }

    await handleProbeProviders(failedProviders);
  };

  const handleClearProbeResults = (providers: AiProviderItem[]) => {
    const providerIds = new Set(providers.map((provider) => provider.id));

    setProviderProbeResults((currentResults) => {
      const nextResults = { ...currentResults };

      for (const providerId of providerIds) {
        delete nextResults[providerId];
      }

      return nextResults;
    });

    enqueueSuccessSnackBar({
      message: t`Cleared saved probe results for this group`,
    });
  };

  const handleClearProbeResult = (provider: AiProviderItem) => {
    setProviderProbeResults((currentResults) => {
      if (!(provider.id in currentResults)) {
        return currentResults;
      }

      const nextResults = { ...currentResults };

      delete nextResults[provider.id];

      return nextResults;
    });

    enqueueSuccessSnackBar({
      message: t`Cleared saved probe result`,
    });
  };

  return (
    <>
      <Section>
        <H2Title
          title={t`Providers`}
          description={t`Built-in providers activated by API key. Click to manage models.`}
          adornment={
            <>
              <Button
                title={`All (${catalogProviders.length})`}
                variant={
                  providerFilterMode === 'all' ? 'secondary' : 'tertiary'
                }
                size="small"
                onClick={() => setProviderFilterMode('all')}
              />
              <Button
                title={`Needs Attention (${catalogAttentionCount})`}
                variant={
                  providerFilterMode === 'attention'
                    ? 'secondary'
                    : 'tertiary'
                }
                size="small"
                onClick={() => setProviderFilterMode('attention')}
              />
              <Button
                title={`Failed (${catalogFailedCount})`}
                variant={
                  providerFilterMode === 'failed' ? 'secondary' : 'tertiary'
                }
                size="small"
                onClick={() => setProviderFilterMode('failed')}
              />
              <Button
                title={t`Reset View`}
                variant="tertiary"
                size="small"
                onClick={handleResetProviderView}
              />
              <Tag
                text={getProviderFilterModeLabel(providerFilterMode)}
                color="transparent"
                variant="border"
              />
              <Button
                title={t`Clear Results`}
                variant="secondary"
                size="small"
                onClick={() => handleClearProbeResults(catalogProviders)}
              />
              <Button
                Icon={IconTestPipe}
                title={t`Retest Failed`}
                variant="secondary"
                size="small"
                isLoading={isBatchTestingProviders}
                onClick={() =>
                  void handleRetestFailedProviders(catalogProviders)
                }
              />
              <Button
                Icon={IconTestPipe}
                title={t`Test Unready`}
                variant="secondary"
                size="small"
                isLoading={isBatchTestingProviders}
                onClick={() =>
                  void handleProbeUnreadyProviders(catalogProviders)
                }
              />
              <Button
                Icon={IconTestPipe}
                title={t`Test All`}
                variant="secondary"
                size="small"
                isLoading={isBatchTestingProviders}
                onClick={() => void handleProbeProviders(catalogProviders)}
              />
            </>
          }
        />

        <SettingsAdminAiProviderListCard
          emptyStateTitle={
            providerFilterMode === 'failed'
              ? t`No failed providers in this group`
              : providerFilterMode === 'attention'
                ? t`No providers need attention in this group`
                : undefined
          }
          emptyStateDescription={
            providerFilterMode === 'failed'
              ? t`Run a provider test or switch back to All to review the full catalog.`
              : providerFilterMode === 'attention'
                ? t`This group is currently clear. Switch back to All to review every provider.`
                : undefined
          }
          providers={visibleCatalogProviders}
          showAddButton={false}
          onClearProbeResult={handleClearProbeResult}
          onProbeProvider={handleProviderProbe}
          probeResultsByProvider={providerProbeResults}
          testingProviderId={testingProviderId}
        />
      </Section>

      <Section>
        <H2Title
          title={t`Custom Providers`}
          description={t`Add custom endpoints, private gateways, or additional regions.`}
          adornment={
            <>
              <Button
                title={`All (${customProviders.length})`}
                variant={
                  providerFilterMode === 'all' ? 'secondary' : 'tertiary'
                }
                size="small"
                onClick={() => setProviderFilterMode('all')}
              />
              <Button
                title={`Needs Attention (${customAttentionCount})`}
                variant={
                  providerFilterMode === 'attention'
                    ? 'secondary'
                    : 'tertiary'
                }
                size="small"
                onClick={() => setProviderFilterMode('attention')}
              />
              <Button
                title={`Failed (${customFailedCount})`}
                variant={
                  providerFilterMode === 'failed' ? 'secondary' : 'tertiary'
                }
                size="small"
                onClick={() => setProviderFilterMode('failed')}
              />
              <Button
                title={t`Reset View`}
                variant="tertiary"
                size="small"
                onClick={handleResetProviderView}
              />
              <Tag
                text={getProviderFilterModeLabel(providerFilterMode)}
                color="transparent"
                variant="border"
              />
              <Button
                title={t`Clear Results`}
                variant="secondary"
                size="small"
                onClick={() => handleClearProbeResults(customProviders)}
              />
              <Button
                Icon={IconTestPipe}
                title={t`Retest Failed`}
                variant="secondary"
                size="small"
                isLoading={isBatchTestingProviders}
                onClick={() =>
                  void handleRetestFailedProviders(customProviders)
                }
              />
              <Button
                Icon={IconTestPipe}
                title={t`Test Unready`}
                variant="secondary"
                size="small"
                isLoading={isBatchTestingProviders}
                onClick={() =>
                  void handleProbeUnreadyProviders(customProviders)
                }
              />
              <Button
                Icon={IconTestPipe}
                title={t`Test All`}
                variant="secondary"
                size="small"
                isLoading={isBatchTestingProviders}
                onClick={() => void handleProbeProviders(customProviders)}
              />
              <Tag
                text={t`Enterprise`}
                color="transparent"
                Icon={IconLock}
                variant="border"
              />
            </>
          }
        />

        <SettingsAdminAiProviderListCard
          emptyStateTitle={
            providerFilterMode === 'failed'
              ? t`No failed providers in this group`
              : providerFilterMode === 'attention'
                ? t`No providers need attention in this group`
                : undefined
          }
          emptyStateDescription={
            providerFilterMode === 'failed'
              ? t`Run a provider test or switch back to All to review the full custom list.`
              : providerFilterMode === 'attention'
                ? t`This group is currently clear. Switch back to All to review every custom provider.`
                : undefined
          }
          providers={visibleCustomProviders}
          showAddButton
          onClearProbeResult={handleClearProbeResult}
          onProbeProvider={handleProviderProbe}
          probeResultsByProvider={providerProbeResults}
          testingProviderId={testingProviderId}
        />
      </Section>

      {availableModelOptions.length > 0 && (
        <Section>
          <H2Title
            title={t`Default Models`}
            description={t`Configure the default AI models for all workspaces`}
          />

          <Card rounded>
            <SettingsOptionCardContentSelect
              Icon={IconRobot}
              title={t`Smart Model`}
              description={t`Default model for chats and complex reasoning`}
            >
              <Select
                dropdownId="admin-smart-model-select"
                value={defaultSmartModelId ?? undefined}
                onChange={(value: string) =>
                  handleDefaultModelChange(AiModelRole.SMART, value)
                }
                options={availableModelOptions}
                selectSizeVariant="small"
                dropdownWidth={GenericDropdownContentWidth.ExtraLarge}
              />
            </SettingsOptionCardContentSelect>
            <SettingsOptionCardContentSelect
              Icon={IconBolt}
              title={t`Fast Model`}
              description={t`Default model for lightweight tasks`}
            >
              <Select
                dropdownId="admin-fast-model-select"
                value={defaultFastModelId ?? undefined}
                onChange={(value: string) =>
                  handleDefaultModelChange(AiModelRole.FAST, value)
                }
                options={availableModelOptions}
                selectSizeVariant="small"
                dropdownWidth={GenericDropdownContentWidth.ExtraLarge}
              />
            </SettingsOptionCardContentSelect>
          </Card>
        </Section>
      )}

      {enabledModels.length > 0 && (
        <Section>
          <H2Title
            title={t`Recommended Models`}
            description={t`Select which models appear as recommended in the workspace model picker`}
          />

          <SettingsAdminAiModelsTable
            models={enabledModels}
            onToggle={handleRecommendedToggle}
            checkedField="isRecommended"
            anchorPrefix="recommended-model-row"
          />
        </Section>
      )}

      <Section>
        <H2Title
          title={t`AI Usage by Workspace`}
          description={t`AI consumption across all workspaces.`}
          adornment={
            hasEnterpriseAccess ? (
              <Select
                dropdownId="admin-ai-usage-period"
                value={usagePeriod}
                options={periodOptions}
                onChange={setUsagePeriod}
                needIconCheck
                selectSizeVariant="small"
              />
            ) : (
              <Tag
                text={t`Enterprise`}
                color="transparent"
                Icon={IconLock}
                variant="border"
              />
            )
          }
        />
        {hasEnterpriseAccess ? (
          usageByWorkspace.length > 0 ? (
            <Table>
              <TableRow gridTemplateColumns={USAGE_TABLE_GRID_TEMPLATE_COLUMNS}>
                <TableHeader>{t`Workspace`}</TableHeader>
                <TableHeader align="right">{t`Usage`}</TableHeader>
              </TableRow>
              {usageByWorkspace.map((item) => (
                <TableRow
                  key={item.key}
                  gridTemplateColumns={USAGE_TABLE_GRID_TEMPLATE_COLUMNS}
                >
                  <TableCell color={themeCssVariables.font.color.primary}>
                    {item.label ?? item.key}
                  </TableCell>
                  <TableCell align="right">
                    {formatUsageValue(item.creditsUsed)}
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          ) : (
            <Card rounded>
              <TableRow gridTemplateColumns="1fr">
                <TableCell
                  color={themeCssVariables.font.color.tertiary}
                  align="center"
                >
                  {t`No AI usage data recorded yet.`}
                </TableCell>
              </TableRow>
            </Card>
          )
        ) : (
          <SettingsEnterpriseFeatureGateCard
            description={t`AI usage analytics across workspaces is available with an Enterprise key.`}
          />
        )}
      </Section>
    </>
  );
};
