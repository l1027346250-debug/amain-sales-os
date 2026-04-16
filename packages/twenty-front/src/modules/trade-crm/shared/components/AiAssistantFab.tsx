import { styled } from '@linaria/react';
import { type PointerEventHandler } from 'react';
import { IconSparkles } from 'twenty-ui/display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useTradeCrmLocale } from '@/trade-crm/shared/hooks/useTradeCrmLocale';

const StyledEntryButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.accent.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.xl};
  box-shadow: ${themeCssVariables.boxShadow.strong};
  color: ${themeCssVariables.font.color.inverted};
  cursor: pointer;
  display: inline-flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    opacity 160ms ease;

  &:hover {
    opacity: 0.95;
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: 2px;
  }
`;

export const AiAssistantFab = ({
  isMobile,
  onClick,
  onPointerDown,
}: {
  isMobile: boolean;
  onClick: () => void;
  onPointerDown?: PointerEventHandler<HTMLButtonElement>;
}) => {
  const { tr } = useTradeCrmLocale();

  return (
    <StyledEntryButton
      onClick={onClick}
      onPointerDown={onPointerDown}
      aria-label={tr('Open AI assistant')}
      title={tr('Open AI assistant')}
      type="button"
    >
      <IconSparkles size={isMobile ? 16 : 18} />
      {isMobile ? null : tr('AI')}
    </StyledEntryButton>
  );
};
