import { useLingui } from '@lingui/react/macro';
import { styled } from '@linaria/react';
import { useNavigate } from 'react-router-dom';

import { WorkbenchBlockCard } from '@/workbench/components/WorkbenchBlockCard';
import {
  WorkbenchBlockEmptyState,
  WorkbenchBlockHint,
} from '@/workbench/components/WorkbenchBlockText';
import {
  type WorkbenchOpportunityRecord,
  useMyPipelineNeedingNextAction,
} from '@/workbench/hooks/useMyPipelineNeedingNextAction';
import { useTradeCrmObjectViewLink } from '@/workbench/hooks/useTradeCrmObjectViewLink';
import { getLinkToShowPage } from '@/object-metadata/utils/getLinkToShowPage';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { beautifyExactDate } from '~/utils/date-utils';

const StyledList = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledRowButton = styled.button`
  align-items: flex-start;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[3]};
  text-align: left;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledPrimaryText = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledSecondaryText = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledMetaText = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const getSelectDisplayValue = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    const maybeLabel = (value as { label?: string | null }).label;
    const maybeName = (value as { name?: string | null }).name;
    const maybeValue = (value as { value?: string | null }).value;

    return maybeLabel ?? maybeName ?? maybeValue ?? null;
  }

  return null;
};

const getOpportunityTitle = (opportunity: WorkbenchOpportunityRecord) =>
  opportunity.name || opportunity.company?.name || opportunity.id;

const formatAmount = (amount?: number | string | null) => {
  if (typeof amount === 'number') {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(amount);
  }

  if (typeof amount === 'string' && amount.trim().length > 0) {
    return amount;
  }

  return null;
};

export const MyPipelineNeedingNextActionBlock = () => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const {
    myPipelineNeedingNextAction,
    totalMyPipelineNeedingNextActionCount,
    loading,
    hasError,
  } = useMyPipelineNeedingNextAction();
  const pipelineViewLink = useTradeCrmObjectViewLink({
    objectNameSingular: 'opportunity',
    preferredViewName: 'Pipeline Needs Next Action',
  });

  return (
    <WorkbenchBlockCard
      testId="sales-workbench-block-my-pipeline-needing-next-action"
      title={t`My Pipeline Needing Next Action`}
      description={t`Review open opportunities that still need a next action or next action date so the seller can keep the pipeline moving.`}
      count={totalMyPipelineNeedingNextActionCount}
      footerLabel={t`Open pipeline hygiene queue`}
      footerTo={pipelineViewLink}
    >
      <StyledList>
        {loading ? (
          <WorkbenchBlockEmptyState>{t`Loading pipeline hygiene queue...`}</WorkbenchBlockEmptyState>
        ) : hasError ? (
          <WorkbenchBlockEmptyState>
            {t`The pipeline hygiene queue is temporarily unavailable. Open the opportunity list to retry.`}
          </WorkbenchBlockEmptyState>
        ) : myPipelineNeedingNextAction.length === 0 ? (
          <WorkbenchBlockEmptyState>
            {t`The pipeline hygiene queue is clear for this seller right now.`}
          </WorkbenchBlockEmptyState>
        ) : (
          <>
            <WorkbenchBlockHint>
              {t`Open an opportunity to set the next action and next action date before the deal stalls further.`}
            </WorkbenchBlockHint>
            {myPipelineNeedingNextAction.map((opportunity) => {
              const companyName = opportunity.company?.name;
              const stage = getSelectDisplayValue(opportunity.stage);
              const amount = formatAmount(opportunity.amount);

              return (
                <StyledRowButton
                  key={opportunity.id}
                  type="button"
                  onClick={() =>
                    navigate(
                      getLinkToShowPage(CoreObjectNameSingular.Opportunity, {
                        id: opportunity.id,
                      }),
                    )
                  }
                >
                  <StyledPrimaryText>
                    {getOpportunityTitle(opportunity)}
                  </StyledPrimaryText>
                  <StyledSecondaryText>
                    {[companyName, stage, amount ? `$${amount}` : null]
                      .filter(Boolean)
                      .join(' · ') || t`Open opportunity record`}
                  </StyledSecondaryText>
                  <StyledMetaText>
                    {opportunity.nextActionDate
                      ? t`Next action date set`
                      : t`Missing next action date`}
                    {opportunity.updatedAt
                      ? ` · ${beautifyExactDate(opportunity.updatedAt)}`
                      : ''}
                  </StyledMetaText>
                </StyledRowButton>
              );
            })}
          </>
        )}
      </StyledList>
    </WorkbenchBlockCard>
  );
};
