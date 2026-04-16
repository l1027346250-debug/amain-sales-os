import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { type TradeCrmAiSuggestionItem } from '@/trade-crm/shared/hooks/useTradeCrmAiAssistant';

const StyledPanel = styled.div`
  backdrop-filter: blur(12px);
  background: linear-gradient(
    180deg,
    ${themeCssVariables.background.primary},
    ${themeCssVariables.background.secondary}
  );
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.xl};
  box-shadow: ${themeCssVariables.boxShadow.strong};
  min-width: 340px;
  overflow: hidden;
  padding: ${themeCssVariables.spacing[4]};
  position: absolute;
  right: calc(100% + ${themeCssVariables.spacing[2]});
  top: 50%;
  transform: translateY(-50%);

  @media (max-width: 768px) {
    bottom: calc(100% + ${themeCssVariables.spacing[2]});
    min-width: min(340px, calc(100vw - 32px));
    right: 0;
    top: auto;
    transform: none;
  }
`;

const StyledTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const StyledDescription = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
  margin-top: ${themeCssVariables.spacing[1]};
`;

const StyledStatus = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  margin-top: ${themeCssVariables.spacing[2]};
`;

const StyledActionButton = styled.button`
  background: ${themeCssVariables.accent.primary};
  border: none;
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.inverted};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.sm};
  margin-top: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  transition:
    transform 160ms ease,
    opacity 160ms ease;
  width: 100%;

  &:hover {
    opacity: 0.95;
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
  }
`;

const StyledResultCard = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.xl};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledResultTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledResultLine = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
  white-space: pre-wrap;
`;

const StyledSuggestionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[3]};
`;

const StyledSuggestionButton = styled.button`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]};
  text-align: left;
  transition:
    border-color 160ms ease,
    transform 160ms ease,
    background-color 160ms ease;

  &:hover {
    border-color: ${themeCssVariables.accent.primary};
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: 2px;
  }
`;

export const AiSuggestionDrawer = ({
  title,
  description,
  status,
  buttonLabel,
  suggestions,
  onPrimaryAction,
  onSuggestionClick,
  primaryActionDisabled,
  resultTitle,
  resultLines,
}: {
  title: string;
  description: string;
  status?: string;
  buttonLabel: string;
  suggestions: TradeCrmAiSuggestionItem[];
  onPrimaryAction: () => void;
  onSuggestionClick: (suggestion: TradeCrmAiSuggestionItem) => void;
  primaryActionDisabled?: boolean;
  resultTitle?: string;
  resultLines?: string[];
}) => {
  return (
    <StyledPanel>
      <StyledTitle>{title}</StyledTitle>
      <StyledDescription>{description}</StyledDescription>
      {status ? <StyledStatus>{status}</StyledStatus> : null}
      <StyledActionButton
        type="button"
        onClick={onPrimaryAction}
        disabled={primaryActionDisabled}
      >
        {buttonLabel}
      </StyledActionButton>
      {resultTitle && resultLines && resultLines.length > 0 ? (
        <StyledResultCard>
          <StyledResultTitle>{resultTitle}</StyledResultTitle>
          {resultLines.map((line, index) => (
            <StyledResultLine key={`${index}-${line}`}>{line}</StyledResultLine>
          ))}
        </StyledResultCard>
      ) : null}
      <StyledSuggestionList>
        {suggestions.map((suggestion) => (
          <StyledSuggestionButton
            key={suggestion.id}
            type="button"
            onClick={() => onSuggestionClick(suggestion)}
          >
            {suggestion.label}
          </StyledSuggestionButton>
        ))}
      </StyledSuggestionList>
    </StyledPanel>
  );
};
