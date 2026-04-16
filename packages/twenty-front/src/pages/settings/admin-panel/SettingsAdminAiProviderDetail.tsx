import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useMutation, useQuery } from '@apollo/client/react';
import { t } from '@lingui/core/macro';
import { Controller, useForm } from 'react-hook-form';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath, isDefined } from 'twenty-shared/utils';

import { AI_ADMIN_PATH } from '@/settings/admin-panel/ai/constants/AiAdminPath';
import { AI_PROVIDER_SOURCE } from '@/settings/admin-panel/ai/constants/AiProviderSource';
import {
  H2Title,
  type IconComponent,
  IconFlag,
  IconKey,
  IconPlug,
  IconPlus,
  IconServer,
  IconTag,
  IconTestPipe,
  IconTrash,
  IconWorld,
} from 'twenty-ui/display';
import { Button, SearchInput } from 'twenty-ui/input';
import { Section } from 'twenty-ui/layout';
import { RoundedLink, UndecoratedLink } from 'twenty-ui/navigation';

import { useClientConfig } from '@/client-config/hooks/useClientConfig';
import { SettingsSkeletonLoader } from '@/settings/components/SettingsSkeletonLoader';
import { SettingsAdminAiModelsTable } from '@/settings/admin-panel/ai/components/SettingsAdminAiModelsTable';
import { REMOVE_AI_PROVIDER } from '@/settings/admin-panel/ai/graphql/mutations/removeAiProvider';
import { REMOVE_MODEL_FROM_PROVIDER } from '@/settings/admin-panel/ai/graphql/mutations/removeModelFromProvider';
import { TEST_AI_PROVIDER_CONNECTION } from '@/settings/admin-panel/ai/graphql/mutations/testAiProviderConnection';
import { UPDATE_AI_PROVIDER } from '@/settings/admin-panel/ai/graphql/mutations/updateAiProvider';
import { GET_ADMIN_AI_MODELS } from '@/settings/admin-panel/ai/graphql/queries/getAdminAiModels';
import { GET_AI_PROVIDERS } from '@/settings/admin-panel/ai/graphql/queries/getAiProviders';
import { type GetAiProvidersResult } from '@/settings/admin-panel/ai/types/GetAiProvidersResult';
import { type RawAiProviderConfig } from '@/settings/admin-panel/ai/types/RawAiProviderConfig';
import { type TestAiProviderConnectionResult } from '@/settings/admin-panel/ai/types/TestAiProviderConnectionResult';
import { getDataResidencyDisplay } from '@/settings/admin-panel/ai/utils/getDataResidencyDisplay';
import { SaveAndCancelButtons } from '@/settings/components/SaveAndCancelButtons/SaveAndCancelButtons';
import { SettingsAdminTableCard } from '@/settings/admin-panel/components/SettingsAdminTableCard';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { ConfirmationModal } from '@/ui/layout/modal/components/ConfirmationModal';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { TextInput } from '@/ui/input/components/TextInput';
import {
  type AdminAiModelConfig,
  SetAdminAiModelEnabledDocument,
} from '~/generated-metadata/graphql';

const REMOVE_PROVIDER_MODAL_ID = 'settings-ai-provider-remove';
const REMOVE_MODEL_MODAL_ID = 'settings-ai-model-remove';

type ProviderFormValues = {
  label: string;
  baseUrl: string;
  apiKey: string;
  region: string;
};

type ProviderTestResult = {
  ok?: boolean;
  checkedEndpoint?: string;
  modelCount?: number;
  sampleModels?: string[];
  warning?: string;
  error?: string;
  status?: number;
  statusText?: string;
  authHeader?: string;
  authMode?: string;
  sdkPackage?: string;
};

export const SettingsAdminAiProviderDetail = () => {
  const { providerName } = useParams<{ providerName: string }>();
  const navigate = useNavigate();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const { refetch: refetchClientConfig } = useClientConfig();
  const { openModal } = useModal();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSavingProvider, setIsSavingProvider] = useState(false);
  const [testResult, setTestResult] = useState<ProviderTestResult | null>(null);
  const [modelToRemove, setModelToRemove] = useState<{
    modelId: string;
    label: string;
    name: string;
  } | null>(null);

  const { data: providersData, loading: isLoadingProviders } =
    useQuery<GetAiProvidersResult>(GET_AI_PROVIDERS);

  const { data: modelsData, loading: isLoadingModels } = useQuery<{
    getAdminAiModels: {
      models: AdminAiModelConfig[];
    };
  }>(GET_ADMIN_AI_MODELS);

  const [setModelEnabled] = useMutation(SetAdminAiModelEnabledDocument);
  const [removeAiProvider] = useMutation(REMOVE_AI_PROVIDER);
  const [removeModelFromProvider] = useMutation(REMOVE_MODEL_FROM_PROVIDER);
  const [updateAiProvider] = useMutation(UPDATE_AI_PROVIDER);
  const [testAiProviderConnection, { loading: isTestingConnection }] =
    useMutation<TestAiProviderConnectionResult>(TEST_AI_PROVIDER_CONNECTION);
  const form = useForm<ProviderFormValues>({
    mode: 'onSubmit',
    defaultValues: {
      label: '',
      baseUrl: '',
      apiKey: '',
      region: '',
    },
  });

  const handleRemoveProvider = async () => {
    if (!providerName) {
      return;
    }

    try {
      await removeAiProvider({
        variables: { providerName },
        refetchQueries: [
          { query: GET_AI_PROVIDERS },
          { query: GET_ADMIN_AI_MODELS },
        ],
      });
      enqueueSuccessSnackBar({
        message: t`Provider "${provider?.label ?? providerName}" removed`,
      });
      navigate(AI_ADMIN_PATH);
    } catch {
      enqueueErrorSnackBar({
        message: t`Failed to remove provider`,
      });
    }
  };

  const handleRemoveModel = async () => {
    if (!providerName || !modelToRemove) {
      return;
    }

    try {
      await removeModelFromProvider({
        variables: {
          providerName,
          modelName: modelToRemove.name,
        },
        refetchQueries: [
          { query: GET_AI_PROVIDERS },
          { query: GET_ADMIN_AI_MODELS },
        ],
      });
      await refetchClientConfig();
      enqueueSuccessSnackBar({
        message: t`Model "${modelToRemove.label}" removed`,
      });
      setModelToRemove(null);
    } catch {
      enqueueErrorSnackBar({
        message: t`Failed to remove model`,
      });
    }
  };

  const providerConfig =
    providerName && providersData?.getAiProviders
      ? providersData.getAiProviders[providerName]
      : undefined;

  const provider = useMemo(
    () =>
      providerName && isDefined(providerConfig)
        ? { id: providerName, ...providerConfig }
        : undefined,
    [providerName, providerConfig],
  );

  const isCustomProvider = provider?.source === AI_PROVIDER_SOURCE.CUSTOM;

  useEffect(() => {
    if (!provider || !isCustomProvider) {
      return;
    }

    form.reset({
      label: provider.label ?? provider.id,
      baseUrl: provider.baseUrl ?? '',
      apiKey: '',
      region: provider.region ?? '',
    });
    setTestResult(null);
  }, [form, isCustomProvider, provider]);

  const providerModels = useMemo(() => {
    const allModels = modelsData?.getAdminAiModels?.models ?? [];

    return allModels.filter((model) => model.providerName === providerName);
  }, [modelsData, providerName]);

  const filteredModels =
    searchQuery.trim().length === 0
      ? providerModels
      : providerModels.filter((model) => {
          const query = searchQuery.toLowerCase();

          return (
            model.label.toLowerCase().includes(query) ||
            model.modelId.toLowerCase().includes(query)
          );
        });

  const providerTestGuidance = useMemo(() => {
    if (!provider) {
      return [];
    }

    const providerId = provider.id.toLowerCase();
    const normalizedBaseUrl = provider.baseUrl?.toLowerCase() ?? '';
    const hints: string[] = [];

    if (providerId.includes('ollama') || normalizedBaseUrl.includes('11434')) {
      hints.push(
        String(
          t`For Ollama, make sure the local service is running and at least one model has been pulled before testing.`,
        ),
      );
    }

    if (
      providerId.includes('openrouter') ||
      normalizedBaseUrl.includes('openrouter.ai')
    ) {
      hints.push(
        String(
          t`For OpenRouter, confirm the base URL ends with /api/v1 and the API key is active for the models you want to use.`,
        ),
      );
    }

    if (provider.npm === '@ai-sdk/google') {
      hints.push(
        String(
          t`Google Gemini testing uses the API key directly against the Gemini API endpoint. Vertex AI credentials are not covered by this test yet.`,
        ),
      );
    }

    if (provider.npm === '@ai-sdk/anthropic') {
      hints.push(
        String(
          t`Anthropic testing checks the official models endpoint. If it fails with 401 or 403, verify the API key and workspace access first.`,
        ),
      );
    }

    if (hints.length === 0) {
      hints.push(
        String(
          t`If the test fails, verify base URL, API key, outbound network access, and whether the provider account has access to the target models.`,
        ),
      );
    }

    return hints;
  }, [provider]);

  const providerTestResultItems = useMemo(() => {
    if (!testResult) {
      return [];
    }

    return [
      {
        Icon: testResult.ok ? IconPlug : IconTrash,
        label: t`Status`,
        value: String(testResult.ok ? t`Connected` : t`Failed`),
      },
      ...(testResult.checkedEndpoint
        ? [
            {
              Icon: IconWorld,
              label: t`Endpoint`,
              value: String(testResult.checkedEndpoint),
            },
          ]
        : []),
      ...(testResult.status !== undefined
        ? [
            {
              Icon: IconServer,
              label: t`HTTP`,
              value: `${String(testResult.status)}${testResult.statusText ? ` ${String(testResult.statusText)}` : ''}`,
            },
          ]
        : []),
      ...(testResult.modelCount !== undefined
        ? [
            {
              Icon: IconServer,
              label: t`Models`,
              value: String(testResult.modelCount),
            },
          ]
        : []),
      ...(testResult.authHeader || testResult.authMode
        ? [
            {
              Icon: IconKey,
              label: t`Auth`,
              value: String(
                testResult.authHeader ?? testResult.authMode ?? '',
              ),
            },
          ]
        : []),
      ...(Array.isArray(testResult.sampleModels) &&
      testResult.sampleModels.length > 0
        ? [
            {
              Icon: IconTag,
              label: t`Sample Models`,
              value: testResult.sampleModels.slice(0, 5).join(', '),
            },
          ]
        : []),
      ...(testResult.warning
        ? [
            {
              Icon: IconFlag,
              label: t`Warning`,
              value: String(testResult.warning),
            },
          ]
        : []),
      ...(testResult.error
        ? [
            {
              Icon: IconTrash,
              label: t`Error`,
              value: String(testResult.error),
            },
          ]
        : []),
    ];
  }, [testResult]);

  const handleModelToggle = async (
    modelId: string,
    isCurrentlyEnabled: boolean,
  ) => {
    try {
      await setModelEnabled({
        variables: { modelId, enabled: !isCurrentlyEnabled },
        refetchQueries: [{ query: GET_ADMIN_AI_MODELS }],
      });
      await refetchClientConfig();
    } catch {
      enqueueErrorSnackBar({
        message: t`Failed to update model availability`,
      });
    }
  };

  const handleModelRemoveClick = (model: AdminAiModelConfig) => {
    setModelToRemove({
      modelId: model.modelId,
      label: model.label,
      name: model.name ?? model.modelId,
    });
    openModal(REMOVE_MODEL_MODAL_ID);
  };

  const providerInfoItems = useMemo(() => {
    if (!provider) {
      return [];
    }

    const items: Array<{
      Icon: IconComponent;
      label: string;
      value: string | React.ReactNode;
    }> = [
      {
        Icon: IconTag,
        label: t`Name`,
        value: provider.label ?? provider.id,
      },
      {
        Icon: IconPlug,
        label: t`SDK`,
        value: provider.npm,
      },
    ];

    if (provider.apiKeyConfigVariable) {
      const envVar = provider.apiKeyConfigVariable;
      const configPath = getSettingsPath(
        SettingsPath.AdminPanelConfigVariableDetails,
        { variableName: envVar },
      );

      items.push({
        Icon: IconKey,
        label: t`API Key`,
        value: (
          <RoundedLink
            href={configPath}
            label={provider.apiKey ?? t`Configure`}
            onClick={(event) => {
              event.preventDefault();
              navigate(configPath);
            }}
          />
        ),
      });
    } else if (provider.apiKey) {
      items.push({
        Icon: IconKey,
        label: t`API Key`,
        value: provider.apiKey,
      });
    }

    if (provider.baseUrl) {
      items.push({
        Icon: IconWorld,
        label: t`Base URL`,
        value: provider.baseUrl,
      });
    }

    if (provider.region) {
      items.push({
        Icon: IconServer,
        label: t`Region`,
        value: provider.region,
      });
    }

    if (provider.hasAccessKey) {
      items.push({
        Icon: IconKey,
        label: t`Credentials`,
        value: t`IAM credentials configured`,
      });
    } else if (provider.authType === 'role') {
      items.push({
        Icon: IconKey,
        label: t`Credentials`,
        value: t`IAM role (instance profile)`,
      });
    }

    if (isCustomProvider && provider.dataResidency) {
      items.push({
        Icon: IconFlag,
        label: t`Data Residency`,
        value: getDataResidencyDisplay(provider.dataResidency),
      });
    }

    return items;
  }, [provider, navigate, isCustomProvider]);

  const handleSaveProvider = async () => {
    if (!providerName || !isCustomProvider) {
      return;
    }

    const values = form.getValues();
    const providerConfig: Partial<RawAiProviderConfig> = {
      label: values.label.trim(),
      ...(values.baseUrl.trim() && { baseUrl: values.baseUrl.trim() }),
      ...(values.region.trim() && { region: values.region.trim() }),
      ...(values.apiKey.trim() && { apiKey: values.apiKey.trim() }),
    };

    setIsSavingProvider(true);

    try {
      await updateAiProvider({
        variables: {
          providerName,
          providerConfig,
        },
        refetchQueries: [
          { query: GET_AI_PROVIDERS },
          { query: GET_ADMIN_AI_MODELS },
        ],
      });
      enqueueSuccessSnackBar({
        message: t`Provider settings updated`,
      });
      await runProviderConnectionTest({
        providerConfig,
        successMessage: t`Provider saved and connection test passed`,
        failureMessage: t`Provider saved but connection test failed`,
      });
    } catch {
      enqueueErrorSnackBar({
        message: t`Failed to update provider settings`,
      });
    } finally {
      setIsSavingProvider(false);
    }
  };

  const handleTestConnection = async () => {
    if (!providerName || !provider) {
      return;
    }

    const values = form.getValues();
    const providerConfig = buildProviderTestConfig(values);

    await runProviderConnectionTest({
      providerConfig,
      successMessage: t`Provider connection test passed`,
      failureMessage: t`Provider connection test failed`,
    });
  };

  const buildProviderTestConfig = (
    values: ProviderFormValues,
  ): Partial<RawAiProviderConfig> => {
    if (!provider) {
      return {};
    }

    return {
      npm: provider.npm,
      label: values.label.trim(),
      ...(provider.name && { name: provider.name }),
      ...(values.baseUrl.trim() && { baseUrl: values.baseUrl.trim() }),
      ...(values.region.trim() && { region: values.region.trim() }),
      ...(values.apiKey.trim() && { apiKey: values.apiKey.trim() }),
    };
  };

  const runProviderConnectionTest = async ({
    providerConfig,
    successMessage,
    failureMessage,
  }: {
    providerConfig: Partial<RawAiProviderConfig>;
    successMessage: string;
    failureMessage: string;
  }) => {
    if (!providerName) {
      return null;
    }

    try {
      const result = await testAiProviderConnection({
        variables: {
          providerName,
          providerConfig,
        },
      });

      const payload = (result.data?.testAiProviderConnection ??
        null) as ProviderTestResult | null;
      setTestResult(payload);

      if (payload?.ok) {
        enqueueSuccessSnackBar({
          message: successMessage,
        });
      } else {
        enqueueErrorSnackBar({
          message: failureMessage,
        });
      }

      return payload;
    } catch {
      enqueueErrorSnackBar({
        message: failureMessage,
      });

      return null;
    }
  };

  const newModelPath = providerName
    ? getSettingsPath(SettingsPath.AdminPanelNewAiModel, { providerName })
    : undefined;

  if (isLoadingProviders || isLoadingModels) {
    return <SettingsSkeletonLoader />;
  }

  return (
    <SubMenuTopBarContainer
      title={provider?.label ?? providerName ?? ''}
      links={[
        {
          children: t`Other`,
          href: getSettingsPath(SettingsPath.AdminPanel),
        },
        {
          children: t`Admin Panel`,
          href: getSettingsPath(SettingsPath.AdminPanel),
        },
        {
          children: t`AI`,
          href: AI_ADMIN_PATH,
        },
        {
          children: provider?.label ?? providerName ?? '',
        },
      ]}
      actionButton={
        isCustomProvider ? (
          <SaveAndCancelButtons
            onCancel={() =>
              form.reset({
                label: provider?.label ?? provider?.id ?? '',
                baseUrl: provider?.baseUrl ?? '',
                apiKey: '',
                region: provider?.region ?? '',
              })
            }
            isLoading={isSavingProvider}
            onSave={handleSaveProvider}
          />
        ) : undefined
      }
    >
      <SettingsPageContainer>
        <Section>
          <H2Title
            title={provider?.label ?? providerName ?? ''}
            description={provider?.npm ?? ''}
          />

          {provider && (
            <SettingsAdminTableCard
              rounded
              items={providerInfoItems}
              gridAutoColumns="120px 1fr"
            />
          )}
        </Section>

        {isCustomProvider && (
          <Section>
            <H2Title
              title={t`Connection Settings`}
              description={t`Update provider credentials and run a connection test before enabling models`}
            />

            <Controller
              name="label"
              control={form.control}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  value={value}
                  onChange={onChange}
                  placeholder={t`Provider label`}
                  fullWidth
                />
              )}
            />

            <Controller
              name="baseUrl"
              control={form.control}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  value={value}
                  onChange={onChange}
                  placeholder={t`Base URL`}
                  fullWidth
                />
              )}
            />

            <Controller
              name="apiKey"
              control={form.control}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  value={value}
                  onChange={onChange}
                  placeholder={t`Leave blank to keep current key`}
                  fullWidth
                  type="password"
                />
              )}
            />

            <Controller
              name="region"
              control={form.control}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  value={value}
                  onChange={onChange}
                  placeholder={t`Region (optional)`}
                  fullWidth
                />
              )}
            />

            <Button
              Icon={IconTestPipe}
              title={t`Test Connection`}
              variant="secondary"
              onClick={handleTestConnection}
              isLoading={isTestingConnection}
            />

            {testResult && (
              <SettingsAdminTableCard
                rounded
                items={providerTestResultItems}
                gridAutoColumns="120px 1fr"
              />
            )}

            {isCustomProvider && (
              <SettingsAdminTableCard
                rounded
                items={providerTestGuidance.map((hint, index) => ({
                  Icon: IconFlag,
                  label:
                    index === 0 ? String(t`Next Step`) : String(t`Check`),
                  value: hint,
                }))}
                gridAutoColumns="120px 1fr"
              />
            )}
          </Section>
        )}

        <Section>
          <H2Title
            title={t`Models`}
            description={
              isCustomProvider
                ? t`Models for this provider. Toggle to enable or disable.`
                : t`Built-in models from this provider. Toggle to enable or disable.`
            }
          />

          {providerModels.length > 3 && (
            <SearchInput
              placeholder={t`Search a model...`}
              value={searchQuery}
              onChange={setSearchQuery}
            />
          )}

          {filteredModels.length > 0 && (
            <SettingsAdminAiModelsTable
              models={filteredModels}
              onToggle={handleModelToggle}
              checkedField="isAdminEnabled"
              anchorPrefix="provider-model-row"
              showDisabledState
              secondaryColumn="cost"
              onRemove={isCustomProvider ? handleModelRemoveClick : undefined}
            />
          )}

          {isCustomProvider && newModelPath && (
            <UndecoratedLink to={newModelPath}>
              <Button
                Icon={IconPlus}
                title={t`Add Model`}
                variant="secondary"
              />
            </UndecoratedLink>
          )}
        </Section>

        {isCustomProvider && (
          <Section>
            <H2Title
              title={t`Danger zone`}
              description={t`Remove this provider and disconnect all its models`}
            />
            <Button
              Icon={IconTrash}
              title={t`Remove provider`}
              variant="secondary"
              accent="danger"
              onClick={() => openModal(REMOVE_PROVIDER_MODAL_ID)}
            />
          </Section>
        )}
      </SettingsPageContainer>

      <ConfirmationModal
        modalInstanceId={REMOVE_PROVIDER_MODAL_ID}
        title={t`Remove provider "${provider?.label ?? providerName}"`}
        subtitle={t`This will disconnect all models from this provider. Models will no longer be available until a new provider is configured.`}
        onConfirmClick={handleRemoveProvider}
        confirmButtonText={t`Remove`}
        confirmButtonAccent="danger"
      />

      <ConfirmationModal
        modalInstanceId={REMOVE_MODEL_MODAL_ID}
        title={t`Remove model "${modelToRemove?.label ?? ''}"`}
        subtitle={t`This model will be removed from the provider. You can re-add it later.`}
        onConfirmClick={handleRemoveModel}
        confirmButtonText={t`Remove`}
        confirmButtonAccent="danger"
      />
    </SubMenuTopBarContainer>
  );
};
