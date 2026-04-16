import { useLingui } from '@lingui/react/macro';
import { styled } from '@linaria/react';
import { useNavigate } from 'react-router-dom';

import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { getLinkToShowPage } from '@/object-metadata/utils/getLinkToShowPage';
import { AppPath } from 'twenty-shared/types';
import { WorkbenchBlockCard } from '@/workbench/components/WorkbenchBlockCard';
import {
  WorkbenchBlockEmptyState,
  WorkbenchBlockHint,
} from '@/workbench/components/WorkbenchBlockText';
import {
  type WorkbenchLeadRecord,
  useTodayNewLeads,
} from '@/workbench/hooks/useTodayNewLeads';
import { useTradeCrmObjectViewLink } from '@/workbench/hooks/useTradeCrmObjectViewLink';
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

const getLeadTitle = (lead: WorkbenchLeadRecord) =>
  lead.leadName || lead.contactName || lead.email || lead.id;

export const TodayNewLeadsBlock = () => {
  const { objectMetadataItems } = useObjectMetadataItems();
  const hasLeadObject = objectMetadataItems.some(
    (item) => item.nameSingular === 'lead',
  );

  if (!hasLeadObject) {
    return <TodayNewLeadsBlockUnavailable />;
  }

  return <TodayNewLeadsBlockContent />;
};

const TodayNewLeadsBlockUnavailable = () => {
  const { t } = useLingui();

  return (
    <WorkbenchBlockCard
      testId="sales-workbench-block-today-new-leads"
      title={t`Today New Leads`}
      description={t`Review the latest leads created today so the seller can qualify them and respond quickly.`}
      count={0}
      footerLabel={t`Open today's leads queue`}
      footerTo={AppPath.Index}
    >
      <StyledList>
        <WorkbenchBlockEmptyState>
          {t`Lead object metadata is not initialized in this workspace yet. Run the trade CRM object/view initialization first.`}
        </WorkbenchBlockEmptyState>
      </StyledList>
    </WorkbenchBlockCard>
  );
};

const TodayNewLeadsBlockContent = () => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { todayNewLeads, totalTodayNewLeadsCount, loading, hasError } =
    useTodayNewLeads();
  const leadsViewLink = useTradeCrmObjectViewLink({
    objectNameSingular: 'lead',
    preferredViewName: 'Today New Leads',
  });

  return (
    <WorkbenchBlockCard
      testId="sales-workbench-block-today-new-leads"
      title={t`Today New Leads`}
      description={t`Review the latest leads created today so the seller can qualify them and respond quickly.`}
      count={totalTodayNewLeadsCount}
      footerLabel={t`Open today's leads queue`}
      footerTo={leadsViewLink}
    >
      <StyledList>
        {loading ? (
          <WorkbenchBlockEmptyState>{t`Loading today's leads...`}</WorkbenchBlockEmptyState>
        ) : hasError ? (
          <WorkbenchBlockEmptyState>
            {t`Today's leads queue is temporarily unavailable. Open the leads list to retry.`}
          </WorkbenchBlockEmptyState>
        ) : todayNewLeads.length === 0 ? (
          <WorkbenchBlockEmptyState>
            {t`Today's new-lead queue is clear for now.`}
          </WorkbenchBlockEmptyState>
        ) : (
          <>
            <WorkbenchBlockHint>
              {t`Open a lead to qualify it and prioritize the first response while the contact is still fresh.`}
            </WorkbenchBlockHint>
            {todayNewLeads.map((lead) => {
              const source = getSelectDisplayValue(lead.source);
              const productCategory = getSelectDisplayValue(lead.productCategory);
              const destination = getLinkToShowPage('lead', lead);

              return (
                <StyledRowButton
                  key={lead.id}
                  type="button"
                  onClick={() => navigate(destination)}
                >
                  <StyledPrimaryText>{getLeadTitle(lead)}</StyledPrimaryText>
                  <StyledSecondaryText>
                    {[source, productCategory].filter(Boolean).join(' · ') || t`Open lead record`}
                  </StyledSecondaryText>
                  <StyledMetaText>{beautifyExactDate(lead.createdAt)}</StyledMetaText>
                </StyledRowButton>
              );
            })}
          </>
        )}
      </StyledList>
    </WorkbenchBlockCard>
  );
};
