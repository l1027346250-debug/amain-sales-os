import { type TradeWorkspaceContext } from '@/trade-crm/shared/TradeWorkspaceContext';

export type TradeCrmAiGenerateType =
  | 'summary'
  | 'next_action'
  | 'draft'
  | 'lead_score';

export type TradeCrmAiSuggestionItem = {
  id: string;
  label: string;
  type: TradeCrmAiGenerateType;
  prompt: string;
};

export type TradeCrmAiSuggestionsResponse = {
  description?: string;
  suggestions?: TradeCrmAiSuggestionItem[];
};

export type TradeCrmAiGenerateResponse = {
  type: TradeCrmAiGenerateType;
  result: Record<string, unknown>;
};

const getRequestErrorMessage = (response: Response) =>
  `integration-hub request failed: ${response.status} ${response.statusText}`;

const postTradeCrmAiRequest = async <TResponse>({
  baseUrl,
  endpoint,
  payload,
  signal,
}: {
  baseUrl: string;
  endpoint: string;
  payload: Record<string, unknown>;
  signal?: AbortSignal;
}) => {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new Error(getRequestErrorMessage(response));
  }

  return (await response.json()) as TResponse;
};

const getAssistantContextLabel = (context: TradeWorkspaceContext) =>
  `${context.workspace} ${context.entityType ?? ''}`.trim();

export const fetchTradeCrmAiSuggestions = ({
  baseUrl,
  workspaceContext,
  signal,
}: {
  baseUrl: string;
  workspaceContext: TradeWorkspaceContext;
  signal?: AbortSignal;
}) =>
  postTradeCrmAiRequest<TradeCrmAiSuggestionsResponse>({
    baseUrl,
    endpoint: '/ai-assistant/suggestions',
    payload: {
      context: getAssistantContextLabel(workspaceContext),
      workspaceContext,
    },
    signal,
  });

export const generateTradeCrmAiResponse = ({
  baseUrl,
  workspaceContext,
  type,
  prompt,
  text,
}: {
  baseUrl: string;
  workspaceContext: TradeWorkspaceContext;
  type: TradeCrmAiGenerateType;
  prompt: string;
  text?: string;
}) =>
  postTradeCrmAiRequest<TradeCrmAiGenerateResponse>({
    baseUrl,
    endpoint: '/ai-assistant/generate',
    payload: {
      type,
      prompt,
      text,
      metadata: {
        workspace: workspaceContext.workspace,
        entityType: workspaceContext.entityType,
        entityId: workspaceContext.entityId,
        ownerId: workspaceContext.ownerId,
        channel: workspaceContext.channel,
        stage: workspaceContext.stage,
        pathname: workspaceContext.pathname,
        summaryText: workspaceContext.summaryText,
      },
      workspaceContext,
    },
  });
