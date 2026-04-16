import { styled } from '@linaria/react';
import { type PointerEventHandler, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from 'twenty-ui/utilities';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { AiAssistantFab } from '@/trade-crm/shared/components/AiAssistantFab';
import { AiSuggestionDrawer } from '@/trade-crm/shared/components/AiSuggestionDrawer';
import { useTradeCrmLocale } from '@/trade-crm/shared/hooks/useTradeCrmLocale';
import { type TradeWorkspaceContext } from '@/trade-crm/shared/TradeWorkspaceContext';
import {
  type TradeCrmAiSuggestionItem,
  useTradeCrmAiAssistant,
} from '@/trade-crm/shared/hooks/useTradeCrmAiAssistant';

const StyledDock = styled.div`
  position: fixed;
  z-index: 20;
`;

const AI_DOCK_POSITION_STORAGE_KEY = 'trade-crm-ai-dock-position:v1';
const AI_DOCK_EDGE_OFFSET = 16;
const AI_DOCK_BUTTON_WIDTH = 92;
const AI_DOCK_BUTTON_HEIGHT = 48;
const AI_DOCK_MOBILE_BUTTON_WIDTH = 56;
const AI_DOCK_MOBILE_BUTTON_HEIGHT = 44;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getDefaultPosition = (isMobile: boolean) => {
  if (typeof window === 'undefined') {
    return {
      x: 0,
      y: 0,
    };
  }

  const buttonWidth = isMobile ? AI_DOCK_MOBILE_BUTTON_WIDTH : AI_DOCK_BUTTON_WIDTH;
  const buttonHeight = isMobile
    ? AI_DOCK_MOBILE_BUTTON_HEIGHT
    : AI_DOCK_BUTTON_HEIGHT;

  return {
    x: window.innerWidth - buttonWidth - AI_DOCK_EDGE_OFFSET,
    y: isMobile
      ? window.innerHeight - buttonHeight - AI_DOCK_EDGE_OFFSET
      : Math.max(
          AI_DOCK_EDGE_OFFSET,
          window.innerHeight / 2 - buttonHeight / 2,
        ),
  };
};

export const TradeCrmAiDock = ({
  context,
}: {
  context: TradeWorkspaceContext;
}) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { tr, isChinese } = useTradeCrmLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(() => getDefaultPosition(false));
  const dragOffsetRef = useRef({
    x: 0,
    y: 0,
  });
  const latestPositionRef = useRef(position);
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);

  useEffect(() => {
    latestPositionRef.current = position;
  }, [position]);

  const resolvedContext = useMemo(
    () => ({
      ...context,
      pathname: context.pathname ?? location.pathname,
    }),
    [context, location.pathname],
  );
  const {
    contextCacheKey,
    description,
    suggestions,
    loadingSuggestions,
    runningGenerate,
    errorMessage,
    generateResponse,
    runGenerate,
  } = useTradeCrmAiAssistant({
    context: resolvedContext,
    isEnabled: isOpen,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const fallbackPosition = getDefaultPosition(isMobile);

    try {
      const savedPosition = localStorage.getItem(AI_DOCK_POSITION_STORAGE_KEY);

      if (!savedPosition) {
        setPosition(fallbackPosition);

        return;
      }

      const parsedPosition = JSON.parse(savedPosition) as {
        x?: number;
        y?: number;
      };

      if (
        typeof parsedPosition.x === 'number' &&
        typeof parsedPosition.y === 'number'
      ) {
        setPosition(parsedPosition);

        return;
      }
    } catch {
      // Ignore malformed local state and fall back to defaults.
    }

    setPosition(fallbackPosition);
  }, [isMobile]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const clampPositionToViewport = () => {
      const buttonWidth = isMobile
        ? AI_DOCK_MOBILE_BUTTON_WIDTH
        : AI_DOCK_BUTTON_WIDTH;
      const buttonHeight = isMobile
        ? AI_DOCK_MOBILE_BUTTON_HEIGHT
        : AI_DOCK_BUTTON_HEIGHT;

      setPosition((currentValue) => ({
        x: clamp(
          currentValue.x,
          AI_DOCK_EDGE_OFFSET,
          window.innerWidth - buttonWidth - AI_DOCK_EDGE_OFFSET,
        ),
        y: clamp(
          currentValue.y,
          AI_DOCK_EDGE_OFFSET,
          window.innerHeight - buttonHeight - AI_DOCK_EDGE_OFFSET,
        ),
      }));
    };

    clampPositionToViewport();
    window.addEventListener('resize', clampPositionToViewport);

    return () => window.removeEventListener('resize', clampPositionToViewport);
  }, [isMobile]);

  const title = useMemo(() => {
    const workspaceTitle = resolvedContext.workspace;

    return `${workspaceTitle} AI`;
  }, [resolvedContext.workspace]);

  const fallbackDescription = useMemo(() => {
    const subject = resolvedContext.entityType
      ? `${resolvedContext.workspace} / ${resolvedContext.entityType}`
      : resolvedContext.workspace;

    return isChinese
      ? `基于当前 ${subject} 上下文生成摘要、下一步建议和跟进草稿。业务主状态仍需人工确认。`
      : `Use the current ${subject} context to ask for a summary, next-step suggestions, and draft follow-up content. State changes still require manual confirmation.`;
  }, [isChinese, resolvedContext.entityType, resolvedContext.workspace]);

  const fallbackSuggestions = useMemo<TradeCrmAiSuggestionItem[]>(
    () => [
      {
        id: `${contextCacheKey}-summary`,
        label: tr('Summarize current context'),
        type: 'summary',
        prompt: isChinese
          ? `总结 ${resolvedContext.workspace} 当前最重要的信息。`
          : `Summarize what matters in ${resolvedContext.workspace}.`,
      },
      {
        id: `${contextCacheKey}-next-action`,
        label: tr('Recommend next action'),
        type: 'next_action',
        prompt: isChinese
          ? `为 ${resolvedContext.entityType ?? '当前记录'} 提出下一步动作建议。`
          : `Suggest the next action for ${resolvedContext.entityType ?? 'this record'}.`,
      },
      {
        id: `${contextCacheKey}-draft`,
        label: tr('Draft follow-up'),
        type: 'draft',
        prompt: isChinese
          ? `为 ${resolvedContext.channel ?? '当前渠道'} 生成一份跟进草稿。`
          : `Draft a follow-up for ${resolvedContext.channel ?? 'the current channel'}.`,
      },
    ],
    [
      contextCacheKey,
      isChinese,
      resolvedContext.channel,
      resolvedContext.entityType,
      resolvedContext.workspace,
      tr,
    ],
  );

  const resolvedSuggestions =
    suggestions.length > 0 ? suggestions : fallbackSuggestions;

  const status = loadingSuggestions
    ? tr('Loading AI context...')
    : runningGenerate
      ? tr('Generating output...')
      : errorMessage
        ? tr(`AI fallback mode: ${errorMessage}`)
        : tr(
            'AI is suggestion-only. State changes still require manual confirmation.',
          );

  const resultView = useMemo(() => {
    if (!generateResponse) {
      return null;
    }

    const result = generateResponse.result;

    if (generateResponse.type === 'summary') {
      return {
        title: tr(String(result.title ?? 'Summary')),
        lines: [
          String(result.summary ?? ''),
          tr(`Focus: ${String(result.focus ?? '')}`),
        ].filter(Boolean),
      };
    }

    if (generateResponse.type === 'draft') {
      return {
        title: tr(String(result.subject ?? 'Draft')),
        lines: [String(result.body ?? '')].filter(Boolean),
      };
    }

    if (generateResponse.type === 'lead_score') {
      const factors = Array.isArray(result.factors)
        ? result.factors.map((factor) => `- ${String(factor)}`)
        : [];

      return {
        title: tr(
          `Lead score ${String(result.level ?? '')} / ${String(result.score ?? '')}`,
        ),
        lines: [String(result.reason ?? ''), ...factors].filter(Boolean),
      };
    }

    const actions = Array.isArray(result.actions)
      ? result.actions.map((action) => `- ${String(action)}`)
      : [];

    return {
      title: tr(String(result.title ?? 'Next actions')),
      lines: [String(result.rationale ?? ''), ...actions].filter(Boolean),
    };
  }, [generateResponse, tr]);

  const handleToggleOpen = () => {
    if (hasMovedRef.current) {
      hasMovedRef.current = false;

      return;
    }

    setIsOpen((currentValue) => !currentValue);
  };

  const persistPosition = (nextPosition: { x: number; y: number }) => {
    try {
      localStorage.setItem(
        AI_DOCK_POSITION_STORAGE_KEY,
        JSON.stringify(nextPosition),
      );
    } catch {
      // Ignore storage failures.
    }
  };

  const handleFabPointerDown: PointerEventHandler<HTMLButtonElement> = (event) => {
    if (isMobile) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();

    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    isDraggingRef.current = true;
    hasMovedRef.current = false;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current) {
        return;
      }

      hasMovedRef.current = true;

      setPosition({
        x: clamp(
          moveEvent.clientX - dragOffsetRef.current.x,
          AI_DOCK_EDGE_OFFSET,
          window.innerWidth - AI_DOCK_BUTTON_WIDTH - AI_DOCK_EDGE_OFFSET,
        ),
        y: clamp(
          moveEvent.clientY - dragOffsetRef.current.y,
          AI_DOCK_EDGE_OFFSET,
          window.innerHeight - AI_DOCK_BUTTON_HEIGHT - AI_DOCK_EDGE_OFFSET,
        ),
      });
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      persistPosition(latestPositionRef.current);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePrimaryAction = async () => {
    await runGenerate(
      'summary',
      isChinese
        ? `为 ${resolvedContext.workspace} 生成一份简洁的工作区摘要。`
        : `Generate a concise workspace brief for ${resolvedContext.workspace}.`,
      resolvedContext.summaryText,
    );
  };

  const handleSuggestionClick = async (suggestion: TradeCrmAiSuggestionItem) => {
    await runGenerate(
      suggestion.type,
      suggestion.prompt,
      resolvedContext.summaryText,
    );
  };

  return (
    <StyledDock
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {isOpen ? (
        <AiSuggestionDrawer
          title={tr(title)}
          description={description ?? fallbackDescription}
          status={status}
          buttonLabel={tr('Generate workspace brief')}
          suggestions={resolvedSuggestions}
          onPrimaryAction={handlePrimaryAction}
          onSuggestionClick={handleSuggestionClick}
          primaryActionDisabled={runningGenerate}
          resultTitle={resultView?.title}
          resultLines={resultView?.lines}
        />
      ) : null}
      <AiAssistantFab
        isMobile={isMobile}
        onClick={handleToggleOpen}
        onPointerDown={handleFabPointerDown}
      />
    </StyledDock>
  );
};
