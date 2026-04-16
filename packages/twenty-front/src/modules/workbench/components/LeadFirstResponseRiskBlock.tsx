import { useLingui } from '@lingui/react/macro';
import { styled } from '@linaria/react';
import { useNavigate } from 'react-router-dom';

import { WorkbenchBlockCard } from '@/workbench/components/WorkbenchBlockCard';
import {
  WorkbenchBlockEmptyState,
  WorkbenchBlockHint,
} from '@/workbench/components/WorkbenchBlockText';
import { useLeadFirstResponseRisk } from '@/workbench/hooks/useLeadFirstResponseRisk';
import { useTradeCrmObjectViewLink } from '@/workbench/hooks/useTradeCrmObjectViewLink';
import { getLinkToShowPage } from '@/object-metadata/utils/getLinkToShowPage';
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

const StyledRiskText = styled.div`
  color: ${themeCssVariables.font.color.danger};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

export const LeadFirstResponseRiskBlock = () => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const leadsViewLink = useTradeCrmObjectViewLink({
    objectNameSingular: 'lead',
    preferredViewName: 'Leads (Trade CRM)',
  });
  const {
    integrationHubApiBaseUrl,
    loading,
    errorMessage,
    sellerRiskReminders,
    totalRiskCount,
  } = useLeadFirstResponseRisk();

  return (
    <WorkbenchBlockCard
      testId="sales-workbench-block-lead-first-response-risk"
      title={t`Lead First Response Risk`}
      description={t`Review first-response risk leads from integration-hub so the seller can protect the SLA before it slips further.`}
      count={totalRiskCount}
      footerLabel={t`Open lead follow-up queue`}
      footerTo={leadsViewLink}
    >
      <StyledList>
        {!integrationHubApiBaseUrl ? (
          <WorkbenchBlockEmptyState>
            {t`The lead follow-up risk queue is not connected yet. Add the integration-hub base URL to enable it.`}
          </WorkbenchBlockEmptyState>
        ) : loading ? (
          <WorkbenchBlockEmptyState>{t`Loading SLA-risk leads...`}</WorkbenchBlockEmptyState>
        ) : errorMessage ? (
          <WorkbenchBlockEmptyState>
            {t`The lead follow-up risk queue is temporarily unavailable. Try again shortly or review the lead follow-up list.`}
          </WorkbenchBlockEmptyState>
        ) : sellerRiskReminders.length === 0 ? (
          <WorkbenchBlockEmptyState>
            {t`The lead follow-up risk queue is clear for this seller right now.`}
          </WorkbenchBlockEmptyState>
        ) : (
          <>
            <WorkbenchBlockHint>
              {t`Open a risky lead to review the contact and send the first response before the SLA slips further.`}
            </WorkbenchBlockHint>
            {sellerRiskReminders.map((reminder) => (
              <StyledRowButton
                key={reminder.leadId}
                type="button"
                onClick={() =>
                  navigate(
                    getLinkToShowPage('lead', {
                      id: reminder.leadId,
                    }),
                  )
                }
              >
                <StyledPrimaryText>
                  {reminder.leadName || reminder.email || reminder.leadId}
                </StyledPrimaryText>
                <StyledSecondaryText>
                  {reminder.createdAt
                    ? beautifyExactDate(reminder.createdAt)
                    : t`Created date unavailable`}
                </StyledSecondaryText>
                <StyledRiskText>
                  {reminder.overdueHours != null
                    ? `${reminder.overdueHours}h overdue`
                    : t`Overdue duration unavailable`}
                </StyledRiskText>
              </StyledRowButton>
            ))}
          </>
        )}
      </StyledList>
    </WorkbenchBlockCard>
  );
};



