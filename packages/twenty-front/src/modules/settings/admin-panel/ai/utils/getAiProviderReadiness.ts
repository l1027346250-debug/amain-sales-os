import { t } from '@lingui/core/macro';

import { type AiProviderItem } from '@/settings/admin-panel/ai/types/AiProviderItem';

type AiProviderReadiness = {
  descriptionParts: string[];
  statusColor: 'green' | 'orange';
  statusText: string;
};

const isLocalRuntimeProvider = (provider: AiProviderItem) => {
  const providerId = provider.id.toLowerCase();
  const baseUrl = provider.baseUrl?.toLowerCase() ?? '';

  return providerId.includes('ollama') || baseUrl.includes('127.0.0.1:11434');
};

const requiresBaseUrl = (provider: AiProviderItem) =>
  provider.npm === '@ai-sdk/openai-compatible';

const hasCredentialConfig = (provider: AiProviderItem) =>
  !!(provider.authType || provider.apiKey || provider.hasAccessKey);

export const getAiProviderReadiness = (
  provider: AiProviderItem,
): AiProviderReadiness => {
  const parts: string[] = [];
  const isLocalRuntime = isLocalRuntimeProvider(provider);
  const hasCredentials = hasCredentialConfig(provider);
  const missingBaseUrl = requiresBaseUrl(provider) && !provider.baseUrl;

  if (provider.region) {
    parts.push(provider.region);
  }

  if (provider.baseUrl) {
    parts.push(provider.baseUrl);
  }

  if (provider.authType === 'role') {
    parts.push(String(t`IAM role`));
  } else if (provider.hasAccessKey) {
    parts.push(String(t`IAM credentials`));
  } else if (provider.apiKey) {
    parts.push(String(t`API key configured`));
  } else if (isLocalRuntime) {
    parts.push(String(t`Local runtime`));
  } else if (provider.apiKeyConfigVariable) {
    parts.push(String(t`Config variable available`));
  }

  if (missingBaseUrl) {
    return {
      descriptionParts: parts,
      statusColor: 'orange',
      statusText: String(t`Needs endpoint`),
    };
  }

  if (isLocalRuntime) {
    return {
      descriptionParts: parts,
      statusColor: provider.baseUrl ? 'green' : 'orange',
      statusText: provider.baseUrl
        ? String(t`Local runtime`)
        : String(t`Needs local URL`),
    };
  }

  if (!hasCredentials) {
    return {
      descriptionParts: parts,
      statusColor: 'orange',
      statusText:
        provider.authType === 'role'
          ? String(t`Needs IAM role`)
          : String(t`Needs API key`),
    };
  }

  if (provider.authType === 'role') {
    return {
      descriptionParts: parts,
      statusColor: 'green',
      statusText: String(t`IAM role`),
    };
  }

  if (provider.hasAccessKey) {
    return {
      descriptionParts: parts,
      statusColor: 'green',
      statusText: String(t`IAM credentials`),
    };
  }

  return {
    descriptionParts: parts,
    statusColor: 'green',
    statusText: String(t`Ready`),
  };
};
