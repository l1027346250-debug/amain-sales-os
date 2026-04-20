import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { styled } from '@linaria/react';

import { agentChatInputState } from '@/ai/states/agentChatInputState';
import { shouldFocusChatEditorState } from '@/ai/states/shouldFocusChatEditorState';
import { useOpenAskAIPageInSidePanel } from '@/side-panel/hooks/useOpenAskAIPageInSidePanel';
import { getTradeCrmCustomerRouteContext } from '@/trade-crm/customers/utils/tradeCrmCustomerRouting';
import { tradeCrmRouteMap } from '@/trade-crm/navigation/tradeCrmRouteMap';
import { AiAssistantFab } from '@/trade-crm/shared/components/AiAssistantFab';
import { AiSuggestionDrawer } from '@/trade-crm/shared/components/AiSuggestionDrawer';
import { type TradeCrmAiSuggestionItem } from '@/trade-crm/shared/hooks/useTradeCrmAiAssistant';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import { getIntegrationHubApiBaseUrl } from '@/workbench/utils/getIntegrationHubApiBaseUrl';
import { FeatureFlagKey } from '~/generated-metadata/graphql';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { useIsMobile } from 'twenty-ui/utilities';

const StyledFloatingContainer = styled.div`
  bottom: ${themeCssVariables.spacing[5]};
  position: fixed;
  right: ${themeCssVariables.spacing[5]};
  z-index: 40;
`;

const routeContextByPath = (pathname: string) => {
  const customerRouteContext = getTradeCrmCustomerRouteContext(pathname);

  if (customerRouteContext) {
    return customerRouteContext;
  }

  if (pathname === tradeCrmRouteMap.workbench) return 'trade-workbench';
  if (pathname === tradeCrmRouteMap.prospecting) return 'trade-prospecting';
  if (pathname === tradeCrmRouteMap.mail) return 'trade-mail';
  if (pathname === tradeCrmRouteMap.opportunities) {
    return 'trade-opportunities';
  }
  if (pathname === tradeCrmRouteMap.collaboration) {
    return 'trade-collaboration';
  }
  if (pathname === tradeCrmRouteMap.analytics) return 'trade-analytics';
  if (pathname === tradeCrmRouteMap.settings) return 'trade-settings';
  if (pathname.includes('/sales-workbench')) return 'workbench';
  if (pathname.includes('/leads')) return 'lead';
  if (pathname.includes('/companies')) return 'company';
  if (pathname.includes('/people')) return 'people';
  if (pathname.includes('/opportunities')) return 'opportunity';
  if (pathname.includes('/tasks')) return 'task';

  return 'general';
};

const fallbackSuggestionsByContext: Record<string, TradeCrmAiSuggestionItem[]> = {
  'trade-workbench': [
    {
      id: 'trade-workbench-summary',
      label: 'Summarize seller queues',
      type: 'summary',
      prompt: 'Summarize the seller queues that need movement first.',
    },
    {
      id: 'trade-workbench-next-action',
      label: 'Recommend execution order',
      type: 'next_action',
      prompt:
        'Suggest the best execution order for today across leads, tasks, and opportunities.',
    },
  ],
  'trade-prospecting': [
    {
      id: 'trade-prospecting-summary',
      label: 'Review intake lanes',
      type: 'summary',
      prompt:
        'Review the lead intake lanes and suggest the next qualification priorities.',
    },
    {
      id: 'trade-prospecting-draft',
      label: 'Draft first-touch plan',
      type: 'draft',
      prompt:
        'Draft a first-touch plan for AI-sourced prospects that still need human confirmation.',
    },
  ],
  'trade-mail': [
    {
      id: 'trade-mail-summary',
      label: 'Summarize inbox',
      type: 'summary',
      prompt: 'Summarize the inbox and propose the highest-priority replies.',
    },
    {
      id: 'trade-mail-draft',
      label: 'Draft follow-up email',
      type: 'draft',
      prompt:
        'Draft a follow-up email based on the current customer and opportunity context.',
    },
  ],
  'trade-customers': [
    {
      id: 'trade-customers-summary',
      label: 'Summarize customer context',
      type: 'summary',
      prompt:
        'Summarize the current customer context and highlight missing follow-up.',
    },
    {
      id: 'trade-customers-next-action',
      label: 'Suggest next account action',
      type: 'next_action',
      prompt:
        'Suggest the next account-level action based on communication and pipeline signals.',
    },
  ],
  'trade-opportunities': [
    {
      id: 'trade-opportunities-summary',
      label: 'Analyze stalled risk',
      type: 'summary',
      prompt: 'Analyze stalled opportunity risk and propose the next move.',
    },
    {
      id: 'trade-opportunities-next-action',
      label: 'List stage actions',
      type: 'next_action',
      prompt:
        'List the actions required to push the current deal into the next stage.',
    },
  ],
  'trade-collaboration': [
    {
      id: 'trade-collaboration-summary',
      label: 'Build execution checklist',
      type: 'summary',
      prompt: 'Turn the current page context into a short execution checklist.',
    },
    {
      id: 'trade-collaboration-next-action',
      label: 'Suggest cross-team follow-up',
      type: 'next_action',
      prompt:
        'Suggest the next cross-team follow-up items that should become tasks.',
    },
  ],
  'trade-analytics': [
    {
      id: 'trade-analytics-summary',
      label: 'Summarize management risks',
      type: 'summary',
      prompt:
        'Summarize the top management risks in the current funnel and follow-up rhythm.',
    },
    {
      id: 'trade-analytics-next-action',
      label: 'Suggest metric review',
      type: 'next_action',
      prompt: 'Suggest which source, owner, or stage metrics need review first.',
    },
  ],
  'trade-settings': [
    {
      id: 'trade-settings-summary',
      label: 'Explain go-live settings',
      type: 'summary',
      prompt:
        'Explain which trade CRM settings should be configured before go-live.',
    },
    {
      id: 'trade-settings-next-action',
      label: 'Summarize config gaps',
      type: 'next_action',
      prompt:
        'Summarize the highest-impact configuration gaps for routing, AI, and automation.',
    },
  ],
  workbench: [
    {
      id: 'workbench-summary',
      label: 'Summarize priority order',
      type: 'summary',
      prompt: 'Summarize the risk and priority order for today.',
    },
    {
      id: 'workbench-next-action',
      label: 'Suggest handling order',
      type: 'next_action',
      prompt:
        'Suggest the handling order for first response, quote follow-up, and stalled opportunities.',
    },
  ],
  lead: [
    {
      id: 'lead-score',
      label: 'Score this lead',
      type: 'lead_score',
      prompt: 'Score this lead and explain the reasoning.',
    },
    {
      id: 'lead-draft',
      label: 'Draft first response',
      type: 'draft',
      prompt: 'Draft a first-response message for this lead.',
    },
  ],
  opportunity: [
    {
      id: 'opportunity-summary',
      label: 'Analyze stalled-deal risk',
      type: 'summary',
      prompt: 'Analyze the stalled-deal risk and recommend the next move.',
    },
    {
      id: 'opportunity-next-action',
      label: 'List key stage actions',
      type: 'next_action',
      prompt:
        'List the key actions needed to move this opportunity to the next stage.',
    },
  ],
  general: [
    {
      id: 'general-next-action',
      label: 'Suggest next best action',
      type: 'next_action',
      prompt: 'Suggest the next best action from the current page context.',
    },
    {
      id: 'general-summary',
      label: 'Generate sales plan',
      type: 'summary',
      prompt: 'Generate a short sales execution plan for today.',
    },
  ],
};

export const AIAssistantFloatingEntry = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { openAskAIPage } = useOpenAskAIPageInSidePanel();
  const setAgentChatInput = useSetAtomState(agentChatInputState);
  const setShouldFocusChatEditor = useSetAtomState(shouldFocusChatEditorState);
  const isAiEnabled = useIsFeatureEnabled(FeatureFlagKey.IS_AI_ENABLED);
  const integrationHubApiBaseUrl = getIntegrationHubApiBaseUrl();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<TradeCrmAiSuggestionItem[]>([]);

  const routeContext = useMemo(
    () => routeContextByPath(location.pathname),
    [location.pathname],
  );

  if (!isAiEnabled) {
    return null;
  }

  const loadSuggestions = async () => {
    if (isLoadingSuggestions) {
      return;
    }

    setIsLoadingSuggestions(true);

    try {
      if (!integrationHubApiBaseUrl) {
        throw new Error('integration-hub-base-url-missing');
      }

      const response = await fetch(
        `${integrationHubApiBaseUrl}/ai-assistant/suggestions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            context: routeContext,
            workspaceContext: {
              workspace: routeContext,
              pathname: location.pathname,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `integration-hub request failed: ${response.status} ${response.statusText}`,
        );
      }

      const payload = (await response.json()) as {
        suggestions?: TradeCrmAiSuggestionItem[];
      };

      setSuggestions(payload.suggestions ?? []);
    } catch {
      setSuggestions(
        fallbackSuggestionsByContext[routeContext] ??
          fallbackSuggestionsByContext.general,
      );
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleToggleOpen = async () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);

    if (nextOpen) {
      await loadSuggestions();
    }
  };

  const handleOpenChat = () => {
    openAskAIPage({ resetNavigationStack: true });
    setShouldFocusChatEditor(true);
    setIsOpen(false);
  };

  const handleSuggestionClick = (suggestion: TradeCrmAiSuggestionItem) => {
    setAgentChatInput(suggestion.prompt);
    openAskAIPage({ resetNavigationStack: true });
    setShouldFocusChatEditor(true);
    setIsOpen(false);
  };

  const displayedSuggestions =
    suggestions.length > 0
      ? suggestions
      : fallbackSuggestionsByContext[routeContext] ??
        fallbackSuggestionsByContext.general;

  return (
    <StyledFloatingContainer>
      {isOpen ? (
        <AiSuggestionDrawer
          title="AI Assistant"
          description="Open the side panel chat or use one of the context-aware prompts below."
          buttonLabel="Open AI conversation"
          suggestions={displayedSuggestions}
          onPrimaryAction={handleOpenChat}
          onSuggestionClick={handleSuggestionClick}
        />
      ) : null}

      <AiAssistantFab isMobile={isMobile} onClick={handleToggleOpen} />
    </StyledFloatingContainer>
  );
};
