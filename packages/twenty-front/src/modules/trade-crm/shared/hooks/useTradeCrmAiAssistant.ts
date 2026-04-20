import { useEffect, useState } from 'react';

import {
  fetchTradeCrmAiSuggestions,
  generateTradeCrmAiResponse,
  type TradeCrmAiGenerateResponse,
  type TradeCrmAiGenerateType,
  type TradeCrmAiSuggestionItem,
} from '@/trade-crm/shared/api/tradeCrmAiClient';
import { type TradeWorkspaceContext } from '@/trade-crm/shared/TradeWorkspaceContext';
import { getIntegrationHubApiBaseUrl } from '@/workbench/utils/getIntegrationHubApiBaseUrl';

export type { TradeCrmAiSuggestionItem };

const serializeContext = (context: TradeWorkspaceContext) =>
  JSON.stringify({
    workspace: context.workspace,
    entityType: context.entityType,
    entityId: context.entityId,
    ownerId: context.ownerId,
    channel: context.channel,
    stage: context.stage,
    pathname: context.pathname,
    summaryText: context.summaryText,
  });

export const useTradeCrmAiAssistant = ({
  context,
  isEnabled,
}: {
  context: TradeWorkspaceContext;
  isEnabled: boolean;
}) => {
  const integrationHubApiBaseUrl = getIntegrationHubApiBaseUrl();
  const contextCacheKey = serializeContext(context);
  const [description, setDescription] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<TradeCrmAiSuggestionItem[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [runningGenerate, setRunningGenerate] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generateResponse, setGenerateResponse] =
    useState<TradeCrmAiGenerateResponse | null>(null);

  const resetUnavailableState = () => {
    setErrorMessage('integration-hub-base-url-missing');
    setSuggestions([]);
    setGenerateResponse(null);
    setDescription(
      'AI suggestions require integration-hub API configuration before live context can be loaded.',
    );
  };

  useEffect(() => {
    setGenerateResponse(null);
    setErrorMessage(null);
  }, [contextCacheKey]);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    if (!integrationHubApiBaseUrl) {
      resetUnavailableState();

      return;
    }

    let isCancelled = false;

    const run = async () => {
      setLoadingSuggestions(true);
      setErrorMessage(null);

      try {
        const payload = await fetchTradeCrmAiSuggestions({
          baseUrl: integrationHubApiBaseUrl,
          workspaceContext: context,
          signal: undefined,
        });

        if (isCancelled) {
          return;
        }

        setDescription(payload.description ?? null);
        setSuggestions(payload.suggestions ?? []);
      } catch (error) {
        if (!isCancelled) {
          setSuggestions([]);
          setErrorMessage(
            error instanceof Error ? error.message : 'unknown-error',
          );
        }
      } finally {
        if (!isCancelled) {
          setLoadingSuggestions(false);
        }
      }
    };

    void run();

    return () => {
      isCancelled = true;
    };
  }, [contextCacheKey, integrationHubApiBaseUrl, isEnabled]);

  const runGenerate = async (
    type: TradeCrmAiGenerateType,
    prompt: string,
    text?: string,
  ) => {
    if (!integrationHubApiBaseUrl) {
      resetUnavailableState();

      return null;
    }

    setRunningGenerate(true);
    setErrorMessage(null);

    try {
      const payload = await generateTradeCrmAiResponse({
        baseUrl: integrationHubApiBaseUrl,
        workspaceContext: context,
        type,
        prompt,
        text,
      });
      setGenerateResponse(payload);

      return payload;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'unknown-error');

      return null;
    } finally {
      setRunningGenerate(false);
    }
  };

  return {
    integrationHubApiBaseUrl,
    description,
    suggestions,
    loadingSuggestions,
    runningGenerate,
    errorMessage,
    generateResponse,
    runGenerate,
    contextCacheKey,
  };
};
