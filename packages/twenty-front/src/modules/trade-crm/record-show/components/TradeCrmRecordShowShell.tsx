import { styled } from '@linaria/react';
import { Link, useSearchParams } from 'react-router-dom';

import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import {
  getTradeCrmScopedViewPath,
  tradeCrmRouteMap,
} from '@/trade-crm/navigation/tradeCrmRouteMap';
import { getTradeCrmRecordShowPath } from '@/trade-crm/shared/getTradeCrmRecordShowPath';
import { TradeCrmAiDock } from '@/trade-crm/shared/components/TradeCrmAiDock';
import { useLeadFirstResponseRisk } from '@/workbench/hooks/useLeadFirstResponseRisk';
import { useMyPipelineNeedingNextAction } from '@/workbench/hooks/useMyPipelineNeedingNextAction';
import { useQuoteFollowUpReminderQueue } from '@/workbench/hooks/useQuoteFollowUpReminderQueue';
import { useStalledOpportunityReminderQueue } from '@/workbench/hooks/useStalledOpportunityReminderQueue';
import { useTasksDueToday } from '@/workbench/hooks/useTasksDueToday';
import { useTodayNewLeads } from '@/workbench/hooks/useTodayNewLeads';
import { useTradeCrmObjectViewLink } from '@/workbench/hooks/useTradeCrmObjectViewLink';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { AppPath, CoreObjectNameSingular } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledShell = styled.section`
  background: linear-gradient(
    145deg,
    ${themeCssVariables.background.primary},
    ${themeCssVariables.background.secondary}
  );
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.xl};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  margin: ${themeCssVariables.spacing[4]};
  overflow: hidden;
  padding: ${themeCssVariables.spacing[4]};
  position: relative;

  &::before {
    background: linear-gradient(
      120deg,
      ${themeCssVariables.accent.primary}16,
      transparent
    );
    content: '';
    inset: 0;
    pointer-events: none;
    position: absolute;
  }
`;

const StyledHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
  position: relative;
  z-index: 1;
`;

const StyledEyebrow = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const StyledTitle = styled.h3`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledDescription = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
  margin: 0;
  max-width: 900px;
`;

const StyledGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  position: relative;
  z-index: 1;
`;

const StyledCard = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.xl};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledCardLabel = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  text-transform: uppercase;
`;

const StyledCardValue = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledCardDescription = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
`;

const StyledNote = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  line-height: 1.6;
  position: relative;
  z-index: 1;
`;

const StyledChecklist = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.xl};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
  position: relative;
  z-index: 1;
`;

const StyledChecklistTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledChecklistItem = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
`;

const StyledContextPanel = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.xl};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
  position: relative;
  z-index: 1;
`;

const StyledContextTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledContextRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledContextLabel = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  text-transform: uppercase;
`;

const StyledContextValue = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
  text-align: right;
`;

const StyledContextLink = styled(Link)`
  color: ${themeCssVariables.accent.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  text-decoration: none;

  &:hover {
    color: ${themeCssVariables.font.color.primary};
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: 2px;
  }
`;

const StyledActionGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  position: relative;
  z-index: 1;
`;

const StyledActionTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledActionLink = styled(Link)`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.rounded};
  color: ${themeCssVariables.font.color.secondary};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  min-height: 32px;
  padding: 0 ${themeCssVariables.spacing[3]};
  text-decoration: none;
  transition:
    border-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;

  &:hover {
    border-color: ${themeCssVariables.accent.primary};
    color: ${themeCssVariables.font.color.primary};
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: 2px;
  }
`;

const getRelationName = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? `${value.length} linked` : null;
  }

  if (typeof value === 'object') {
    const relation = value as {
      name?:
        | string
        | {
            firstName?: string | null;
            lastName?: string | null;
          }
        | null;
      label?: string | null;
      value?: string | null;
      domainName?: string | null;
      email?: string | null;
      primaryEmail?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    };

    if (typeof relation.name === 'string' && relation.name.trim().length > 0) {
      return relation.name;
    }

    if (relation.name && typeof relation.name === 'object') {
      const fullName = [relation.name.firstName, relation.name.lastName]
        .filter((part): part is string => Boolean(part?.trim()))
        .join(' ')
        .trim();

      if (fullName.length > 0) {
        return fullName;
      }
    }

    const objectFullName = [relation.firstName, relation.lastName]
      .filter((part): part is string => Boolean(part?.trim()))
      .join(' ')
      .trim();

    return (
      relation.label ??
      relation.value ??
      relation.domainName ??
      relation.primaryEmail ??
      relation.email ??
      (objectFullName.length > 0 ? objectFullName : null)
    );
  }

  return null;
};

const getRelationId = (value: unknown): string | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const relation = value as {
    id?: string | null;
  };

  return relation.id ?? null;
};

const getSelectLabel = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    const option = value as {
      label?: string | null;
      value?: string | null;
      name?: string | null;
    };

    return option.label ?? option.name ?? option.value ?? null;
  }

  return null;
};

const getEmailPreview = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    for (const emailItem of value) {
      if (typeof emailItem === 'string' && emailItem.trim().length > 0) {
        return emailItem;
      }

      if (typeof emailItem === 'object' && emailItem) {
        const item = emailItem as {
          primaryEmail?: string | null;
          email?: string | null;
          value?: string | null;
        };

        if (item.primaryEmail) {
          return item.primaryEmail;
        }

        if (item.email) {
          return item.email;
        }

        if (item.value) {
          return item.value;
        }
      }
    }
  }

  return getRelationName(value);
};

const getTextValue = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
};

const getCollectionCountLabel = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return `${value.length}`;
  }

  return null;
};

const getFirstCollectionItem = (value: unknown): unknown | null => {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  return value[0] ?? null;
};

const getCurrencyPreview = (value: unknown): string | null => {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number' || typeof value === 'string') {
    return String(value);
  }

  if (typeof value === 'object') {
    const currencyValue = value as {
      amountMicros?: number | null;
      amount?: number | string | null;
      currencyCode?: string | null;
    };

    if (
      typeof currencyValue.amountMicros === 'number' &&
      Number.isFinite(currencyValue.amountMicros)
    ) {
      const normalizedAmount = currencyValue.amountMicros / 1_000_000;

      return currencyValue.currencyCode
        ? `${currencyValue.currencyCode} ${normalizedAmount}`
        : `${normalizedAmount}`;
    }

    if (currencyValue.amount != null) {
      return currencyValue.currencyCode
        ? `${currencyValue.currencyCode} ${currencyValue.amount}`
        : String(currencyValue.amount);
    }
  }

  return null;
};

const buildSummaryText = (items: Array<[string, string | null | undefined]>) =>
  items
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n');

const getQueueCountSummary = ({
  count,
  singularLabel,
  pluralLabel,
}: {
  count: number;
  singularLabel: string;
  pluralLabel: string;
}) => `${count} ${count === 1 ? singularLabel : pluralLabel}`;

const getTaskQueuePreview = ({
  loading,
  hasError,
  count,
  firstTaskTitle,
}: {
  loading: boolean;
  hasError: boolean;
  count: number;
  firstTaskTitle: string | null;
}) => {
  if (loading) {
    return 'Loading today follow-up queue';
  }

  if (hasError) {
    return 'Today follow-up queue is temporarily unavailable';
  }

  if (count === 0) {
    return 'No tasks are due today';
  }

  return firstTaskTitle
    ? `${getQueueCountSummary({
        count,
        singularLabel: 'task due today',
        pluralLabel: 'tasks due today',
      })} · next item: ${firstTaskTitle}`
    : getQueueCountSummary({
        count,
        singularLabel: 'task due today',
        pluralLabel: 'tasks due today',
      });
};

const getPipelineQueuePreview = ({
  loading,
  hasError,
  count,
  firstOpportunityName,
}: {
  loading: boolean;
  hasError: boolean;
  count: number;
  firstOpportunityName: string | null;
}) => {
  if (loading) {
    return 'Loading next-action queue';
  }

  if (hasError) {
    return 'Next-action queue is temporarily unavailable';
  }

  if (count === 0) {
    return 'No open opportunities are missing a next action';
  }

  return firstOpportunityName
    ? `${getQueueCountSummary({
        count,
        singularLabel: 'deal needs next action',
        pluralLabel: 'deals need next action',
      })} · first queue item: ${firstOpportunityName}`
    : getQueueCountSummary({
        count,
      singularLabel: 'deal needs next action',
      pluralLabel: 'deals need next action',
    });
};

const getLeadQueuePreview = ({
  loading,
  hasError,
  count,
  firstLeadName,
}: {
  loading: boolean;
  hasError: boolean;
  count: number;
  firstLeadName: string | null;
}) => {
  if (loading) {
    return 'Loading today new leads queue';
  }

  if (hasError) {
    return 'Today new leads queue is temporarily unavailable';
  }

  if (count === 0) {
    return 'No leads were created today';
  }

  return firstLeadName
    ? `${getQueueCountSummary({
        count,
        singularLabel: 'new lead today',
        pluralLabel: 'new leads today',
      })} · first queue item: ${firstLeadName}`
    : getQueueCountSummary({
        count,
        singularLabel: 'new lead today',
        pluralLabel: 'new leads today',
      });
};

const getReminderQueuePreview = ({
  loading,
  errorMessage,
  count,
  emptyLabel,
  singularLabel,
  pluralLabel,
  firstOpportunityName,
  firstCompanyName,
  ageLabel,
}: {
  loading: boolean;
  errorMessage: string | null;
  count: number;
  emptyLabel: string;
  singularLabel: string;
  pluralLabel: string;
  firstOpportunityName: string | null;
  firstCompanyName: string | null;
  ageLabel: string | null;
}) => {
  if (loading) {
    return 'Loading reminder queue';
  }

  if (errorMessage) {
    return 'Reminder queue is temporarily unavailable';
  }

  if (count === 0) {
    return emptyLabel;
  }

  const primaryAnchor = firstOpportunityName ?? firstCompanyName;
  const queueSummary = getQueueCountSummary({
    count,
    singularLabel,
    pluralLabel,
  });

  if (primaryAnchor && ageLabel) {
    return `${queueSummary} · first queue item: ${primaryAnchor} · ${ageLabel}`;
  }

  if (primaryAnchor) {
    return `${queueSummary} · first queue item: ${primaryAnchor}`;
  }

  return queueSummary;
};

const TradeCrmRecordShowShellCard = ({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) => (
  <StyledCard>
    <StyledCardLabel>{label}</StyledCardLabel>
    <StyledCardValue>{value}</StyledCardValue>
    <StyledCardDescription>{description}</StyledCardDescription>
  </StyledCard>
);

const TradeCrmRecordShowShellChecklist = ({
  title,
  items,
}: {
  title: string;
  items: string[];
}) => (
  <StyledChecklist>
    <StyledChecklistTitle>{title}</StyledChecklistTitle>
    {items.map((item) => (
      <StyledChecklistItem key={item}>- {item}</StyledChecklistItem>
    ))}
  </StyledChecklist>
);

const TradeCrmRecordShowShellActions = ({
  title,
  actions,
}: {
  title: string;
  actions: Array<{ label: string; to: string }>;
}) => {
  if (actions.length === 0) {
    return null;
  }

  return (
    <StyledActionGroup>
      <StyledActionTitle>{title}</StyledActionTitle>
      <StyledActionRow>
        {actions.map((action) => (
          <StyledActionLink key={`${action.label}-${action.to}`} to={action.to}>
            {action.label}
          </StyledActionLink>
        ))}
      </StyledActionRow>
    </StyledActionGroup>
  );
};

const TradeCrmRecordShowShellContext = ({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: string; to?: string }>;
}) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <StyledContextPanel>
      <StyledContextTitle>{title}</StyledContextTitle>
      {items.map((item) => (
        <StyledContextRow key={`${item.label}-${item.value}`}>
          <StyledContextLabel>{item.label}</StyledContextLabel>
          {item.to ? (
            <StyledContextLink to={item.to}>{item.value}</StyledContextLink>
          ) : (
            <StyledContextValue>{item.value}</StyledContextValue>
          )}
        </StyledContextRow>
      ))}
    </StyledContextPanel>
  );
};

const getInheritedRelationSourceTrail = ({
  sourceTrail,
  relationLabel,
}: {
  sourceTrail: string | null;
  relationLabel: string;
}) =>
  sourceTrail
    ? `${sourceTrail} -> ${relationLabel}`
    : relationLabel;

const getTradeCrmSourceLinkFromLabel = (sourceLabel: string | null) => {
  if (!sourceLabel) {
    return null;
  }

  const [workspaceCandidate, ...viewParts] = sourceLabel
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (
    !workspaceCandidate ||
    !(workspaceCandidate in tradeCrmRouteMap)
  ) {
    return null;
  }

  const basePath =
    tradeCrmRouteMap[workspaceCandidate as keyof typeof tradeCrmRouteMap];
  const inferredView = viewParts.join(' / ');

  return inferredView.length > 0
    ? getTradeCrmScopedViewPath(basePath, inferredView)
    : basePath;
};

const getTradeCrmSourceContextFromLabel = (sourceLabel: string | null) => {
  if (!sourceLabel) {
    return null;
  }

  const [workspaceCandidate, ...viewParts] = sourceLabel
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (
    !workspaceCandidate ||
    !(workspaceCandidate in tradeCrmRouteMap)
  ) {
    return null;
  }

  const inferredView = viewParts.join(' / ');

  return {
    sourceWorkspace:
      workspaceCandidate as keyof typeof tradeCrmRouteMap,
    sourceView: inferredView.length > 0 ? inferredView : null,
  };
};

const getTradeCrmSourceContextFromHref = (sourceHref: string | null) => {
  if (!sourceHref) {
    return null;
  }

  const [pathname, search = ''] = sourceHref.split('?');
  const routeEntry = Object.entries(tradeCrmRouteMap).find(
    ([, basePath]) => basePath === pathname,
  );

  if (!routeEntry) {
    return null;
  }

  const [sourceWorkspace] = routeEntry;
  const sourceView =
    new URLSearchParams(search).get('view')?.trim() || null;

  return {
    sourceWorkspace:
      sourceWorkspace as keyof typeof tradeCrmRouteMap,
    sourceView,
  };
};

export const TradeCrmRecordShowShell = ({
  objectNameSingular,
  recordId,
}: {
  objectNameSingular: string;
  recordId: string;
}) => {
  const [searchParams] = useSearchParams();
  const taskWorkspaceLink = useTradeCrmObjectViewLink({
    objectNameSingular: CoreObjectNameSingular.Task,
  });
  const tasksDueTodayLink = useTradeCrmObjectViewLink({
    objectNameSingular: CoreObjectNameSingular.Task,
    preferredViewName: 'Tasks Due Today',
  });
  const pipelineNeedsNextActionLink = useTradeCrmObjectViewLink({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
    preferredViewName: 'Pipeline Needs Next Action',
  });
  const collaborationTasksLink = getTradeCrmScopedViewPath(
    tradeCrmRouteMap.collaboration,
    'tasks',
  );
  const quotationFollowUpWorkspaceLink = getTradeCrmScopedViewPath(
    tradeCrmRouteMap.opportunities,
    'quotation-follow-up',
  );
  const stalledWorkspaceLink = getTradeCrmScopedViewPath(
    tradeCrmRouteMap.opportunities,
    'stalled',
  );
  const {
    tasksDueToday,
    totalTasksDueTodayCount,
    loading: tasksDueTodayLoading,
    hasError: tasksDueTodayError,
  } = useTasksDueToday();
  const {
    sellerRiskReminders,
    totalRiskCount,
    loading: leadFirstResponseLoading,
    errorMessage: leadFirstResponseErrorMessage,
  } = useLeadFirstResponseRisk();
  const {
    todayNewLeads,
    totalTodayNewLeadsCount,
    loading: todayNewLeadsLoading,
    hasError: todayNewLeadsError,
  } = useTodayNewLeads();
  const {
    myPipelineNeedingNextAction,
    totalMyPipelineNeedingNextActionCount,
    loading: nextActionQueueLoading,
    hasError: nextActionQueueError,
  } = useMyPipelineNeedingNextAction();
  const {
    quoteFollowUpReminders,
    totalQuoteFollowUpReminderCount,
    loading: quoteFollowUpLoading,
    errorMessage: quoteFollowUpErrorMessage,
  } = useQuoteFollowUpReminderQueue();
  const {
    stalledOpportunityReminders,
    totalStalledOpportunityReminderCount,
    loading: stalledLoading,
    errorMessage: stalledErrorMessage,
  } = useStalledOpportunityReminderQueue();
  const accountOwner = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'accountOwner',
  });
  const domainName = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'domainName',
  });
  const company = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'company',
  });
  const emails = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'emails',
  });
  const jobTitle = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'jobTitle',
  });
  const stage = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'stage',
  });
  const amount = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'amount',
  });
  const closeDate = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'closeDate',
  });
  const nextAction = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'nextAction',
  });
  const nextActionDate = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'nextActionDate',
  });
  const lostReason = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'lostReason',
  });
  const leadStatus = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'leadStatus',
  });
  const source = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'source',
  });
  const productCategory = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'productCategory',
  });
  const country = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'country',
  });
  const companyName = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'companyName',
  });
  const contactName = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'contactName',
  });
  const email = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'email',
  });
  const people = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'people',
  });
  const opportunities = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'opportunities',
  });
  const phones = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'phones',
  });
  const city = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'city',
  });
  const pointOfContactForOpportunities = useAtomFamilySelectorValue(
    recordStoreFamilySelector,
    {
      recordId,
      fieldName: 'pointOfContactForOpportunities',
    },
  );
  const pointOfContact = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'pointOfContact',
  });
  const firstTaskQueueTitle = getTextValue(tasksDueToday[0]?.title);
  const firstTodayLeadName =
    getTextValue(todayNewLeads[0]?.leadName) ??
    getTextValue(todayNewLeads[0]?.contactName) ??
    getTextValue(todayNewLeads[0]?.companyName);
  const firstNextActionQueueName =
    getTextValue(myPipelineNeedingNextAction[0]?.name) ??
    getRelationName(myPipelineNeedingNextAction[0]?.company);
  const firstLeadRiskReminder = sellerRiskReminders[0];
  const firstQuoteFollowUpReminder = quoteFollowUpReminders[0];
  const firstStalledReminder = stalledOpportunityReminders[0];
  const todayNewLeadsPreview = getLeadQueuePreview({
    loading: todayNewLeadsLoading,
    hasError: todayNewLeadsError,
    count: totalTodayNewLeadsCount,
    firstLeadName: firstTodayLeadName,
  });
  const leadFirstResponsePreview = getReminderQueuePreview({
    loading: leadFirstResponseLoading,
    errorMessage: leadFirstResponseErrorMessage,
    count: totalRiskCount,
    emptyLabel: 'No first-response risk reminders are active',
    singularLabel: 'first-response risk reminder',
    pluralLabel: 'first-response risk reminders',
    firstOpportunityName: firstLeadRiskReminder?.leadName ?? null,
    firstCompanyName: firstLeadRiskReminder?.email ?? null,
    ageLabel:
      firstLeadRiskReminder?.overdueHours != null
        ? `${firstLeadRiskReminder.overdueHours} overdue hours`
        : null,
  });
  const quoteFollowUpQueuePreview = getReminderQueuePreview({
    loading: quoteFollowUpLoading,
    errorMessage: quoteFollowUpErrorMessage,
    count: totalQuoteFollowUpReminderCount,
    emptyLabel: 'No quotation follow-up reminders are active',
    singularLabel: 'quote follow-up reminder',
    pluralLabel: 'quote follow-up reminders',
    firstOpportunityName: firstQuoteFollowUpReminder?.opportunityName ?? null,
    firstCompanyName: firstQuoteFollowUpReminder?.companyName ?? null,
    ageLabel:
      firstQuoteFollowUpReminder?.overdueDays != null
        ? `${firstQuoteFollowUpReminder.overdueDays} overdue days`
        : null,
  });
  const stalledQueuePreview = getReminderQueuePreview({
    loading: stalledLoading,
    errorMessage: stalledErrorMessage,
    count: totalStalledOpportunityReminderCount,
    emptyLabel: 'No stalled reminders are active',
    singularLabel: 'stalled reminder',
    pluralLabel: 'stalled reminders',
    firstOpportunityName: firstStalledReminder?.opportunityName ?? null,
    firstCompanyName: firstStalledReminder?.companyName ?? null,
    ageLabel:
      firstStalledReminder?.stalledDays != null
        ? `${firstStalledReminder.stalledDays} stalled days`
        : null,
  });
  const nextActionQueuePreview = getPipelineQueuePreview({
    loading: nextActionQueueLoading,
    hasError: nextActionQueueError,
    count: totalMyPipelineNeedingNextActionCount,
    firstOpportunityName: firstNextActionQueueName,
  });
  const tasksDueTodayPreview = getTaskQueuePreview({
    loading: tasksDueTodayLoading,
    hasError: tasksDueTodayError,
    count: totalTasksDueTodayCount,
    firstTaskTitle: firstTaskQueueTitle,
  });
  const sourceWorkspaceKey = searchParams.get('sourceWorkspace');
  const sourceView = searchParams.get('sourceView');
  const sourceHref = searchParams.get('sourceHref');
  const sourceLabel = searchParams.get('sourceLabel')?.trim() || null;
  const sourceTrail = searchParams.get('sourceTrail')?.trim() || null;
  const inferredSourceContextFromLabel =
    sourceWorkspaceKey == null
      ? getTradeCrmSourceContextFromLabel(sourceLabel)
      : null;
  const inferredSourceContextFromHref =
    sourceWorkspaceKey == null && inferredSourceContextFromLabel == null
      ? getTradeCrmSourceContextFromHref(sourceHref)
      : null;
  const normalizedSourceWorkspaceKey =
    sourceWorkspaceKey ??
    inferredSourceContextFromLabel?.sourceWorkspace ??
    inferredSourceContextFromHref?.sourceWorkspace ??
    null;
  const normalizedSourceView =
    sourceView ??
    inferredSourceContextFromLabel?.sourceView ??
    inferredSourceContextFromHref?.sourceView ??
    null;
  const sourceWorkspaceBasePath =
    normalizedSourceWorkspaceKey &&
    normalizedSourceWorkspaceKey in tradeCrmRouteMap
      ? tradeCrmRouteMap[
          normalizedSourceWorkspaceKey as keyof typeof tradeCrmRouteMap
        ]
      : null;
  const inferredSourceQueueLink =
    sourceWorkspaceBasePath == null
      ? getTradeCrmSourceLinkFromLabel(sourceLabel)
      : null;
  const sourceQueueLink =
    sourceHref ??
    (sourceWorkspaceBasePath
      ? normalizedSourceView
        ? getTradeCrmScopedViewPath(sourceWorkspaceBasePath, normalizedSourceView)
        : sourceWorkspaceBasePath
      : inferredSourceQueueLink);
  const sourceQueueValue =
    sourceLabel ??
    (normalizedSourceWorkspaceKey
      ? normalizedSourceView
        ? `${normalizedSourceWorkspaceKey} / ${normalizedSourceView}`
        : normalizedSourceWorkspaceKey
      : null);
  const sourceViewLink = sourceWorkspaceBasePath
    ? normalizedSourceView
      ? getTradeCrmScopedViewPath(sourceWorkspaceBasePath, normalizedSourceView)
      : sourceWorkspaceBasePath
    : null;
  const sourceViewContextValue = normalizedSourceWorkspaceKey
    ? normalizedSourceView
      ? `${normalizedSourceWorkspaceKey} / ${normalizedSourceView}`
      : normalizedSourceWorkspaceKey
    : null;
  const sourceReturnContext =
    getTradeCrmSourceContextFromHref(sourceQueueLink);
  const sourceReturnQueueValue = sourceReturnContext
    ? sourceReturnContext.sourceView
      ? `${sourceReturnContext.sourceWorkspace} / ${sourceReturnContext.sourceView}`
      : sourceReturnContext.sourceWorkspace
    : null;
  const sourceQueueActions = [
    sourceViewLink &&
    sourceViewContextValue &&
    sourceViewLink !== sourceQueueLink
      ? {
          label: 'Open source view',
          to: sourceViewLink,
        }
      : null,
    sourceQueueLink
      ? {
          label: 'Back to source queue',
          to: sourceQueueLink,
        }
      : null,
  ].filter((action): action is { label: string; to: string } => action !== null);
  const openedFromLink =
    sourceQueueValue == null
      ? undefined
      : sourceQueueValue === sourceReturnQueueValue
        ? sourceQueueLink ?? undefined
        : sourceQueueValue === sourceViewContextValue
          ? sourceViewLink ?? undefined
          : undefined;
  const sourceQueuePanelItems = [
    sourceQueueValue
      ? {
          label: 'Opened from',
          value: sourceQueueValue,
          to: openedFromLink,
        }
      : null,
    sourceViewContextValue && sourceViewContextValue !== sourceQueueValue
      ? {
          label: 'Opened in view',
          value: sourceViewContextValue,
          to: sourceViewLink ?? undefined,
        }
      : null,
    sourceQueueLink &&
    sourceReturnQueueValue &&
    sourceReturnQueueValue !== sourceQueueValue &&
    sourceReturnQueueValue !== sourceViewContextValue
      ? {
          label: 'Return queue',
          value: sourceReturnQueueValue,
          to: sourceQueueLink,
        }
      : null,
    sourceTrail
      ? {
          label: 'Relation hop',
          value: sourceTrail,
        }
      : null,
  ].filter(
    (item): item is { label: string; value: string; to?: string } =>
      item !== null,
  );
  const inheritedSourceContext = {
    sourceHref: sourceQueueLink ?? undefined,
    sourceWorkspace: normalizedSourceWorkspaceKey ?? undefined,
    sourceView: normalizedSourceView ?? undefined,
    sourceLabel: sourceQueueValue ?? undefined,
    sourceTrail: sourceTrail ?? undefined,
  };
  const getInheritedRecordLink = ({
    objectNameSingular,
    objectRecordId,
    relationLabel,
  }: {
    objectNameSingular: string;
    objectRecordId: string;
    relationLabel: string;
  }) =>
    getTradeCrmRecordShowPath({
      objectNameSingular,
      objectRecordId,
      ...inheritedSourceContext,
      sourceLabel: sourceQueueValue ?? undefined,
      sourceTrail: getInheritedRelationSourceTrail({
        sourceTrail,
        relationLabel,
      }),
    });
  const sourceQueuePanel =
    sourceQueuePanelItems.length > 0 ? (
      <TradeCrmRecordShowShellContext
        title="Source queue"
        items={sourceQueuePanelItems}
      />
    ) : null;

  if (
    objectNameSingular !== 'lead' &&
    objectNameSingular !== CoreObjectNameSingular.Company &&
    objectNameSingular !== CoreObjectNameSingular.Person &&
    objectNameSingular !== CoreObjectNameSingular.Opportunity
  ) {
    return null;
  }

  if (objectNameSingular === 'lead') {
    const leadStatusText = getSelectLabel(leadStatus);
    const leadSourceText = getSelectLabel(source);
    const leadCategoryText = getSelectLabel(productCategory);
    const leadCountryText = getTextValue(country);
    const leadContactText =
      getTextValue(contactName) ??
      getTextValue(email) ??
      getTextValue(companyName);
    const leadOwnerText = getRelationName(accountOwner);
    const leadChecklistItems = [
      leadOwnerText
        ? `Owner is assigned to ${leadOwnerText}.`
        : 'Assign an owner before the first response and qualification continue.',
      leadSourceText && leadCategoryText
        ? `Source and product category are both visible: ${leadSourceText} / ${leadCategoryText}.`
        : 'Source and product category should both be standardized for routing and review.',
      leadContactText
        ? `There is a contact anchor for follow-up: ${leadContactText}.`
        : 'Add a contact anchor so the lead can move into real follow-up.',
      leadCountryText
        ? `Geography is visible through country: ${leadCountryText}.`
        : 'Country or market context is still missing from this lead.',
    ];
    const leadActions = [
      ...sourceQueueActions,
      {
        label: 'Open lead workspace',
        to: tradeCrmRouteMap.prospecting,
      },
      {
        label: 'Open first-response queue',
        to: getTradeCrmScopedViewPath(tradeCrmRouteMap.workbench, 'first-response'),
      },
      {
        label: 'Open customer workspace',
        to: tradeCrmRouteMap.customers,
      },
      {
        label: 'Open task workspace',
        to: taskWorkspaceLink,
      },
      {
        label: 'Open workbench',
        to: tradeCrmRouteMap.workbench,
      },
      {
        label: 'Open lead conversion review',
        to: getTradeCrmScopedViewPath(tradeCrmRouteMap.analytics, 'lead-conversion'),
      },
      {
        label: 'Open assignment rules',
        to: getTradeCrmScopedViewPath(tradeCrmRouteMap.settings, 'assignment-rules'),
      },
      {
        label: 'Open source and dedup rules',
        to: getTradeCrmScopedViewPath(tradeCrmRouteMap.settings, 'sources-dedup'),
      },
    ];
    const leadSummaryText = buildSummaryText([
      ['Workspace', 'Lead Record'],
      ['Source Queue', sourceQueueValue],
      ['Source Workspace View', sourceViewContextValue],
      ['Source Return Queue', sourceReturnQueueValue],
      ['Source Relation Hop', sourceTrail],
      ['Lead Status', leadStatusText],
      ['Source', leadSourceText],
      ['Product Category', leadCategoryText],
      ['Country', leadCountryText],
      ['Contact Anchor', leadContactText],
      ['Company Candidate', getTextValue(companyName)],
      ['Contact Candidate', getTextValue(contactName)],
      ['Email Anchor', getTextValue(email)],
      ['Owner', leadOwnerText],
      ['Today New Leads Queue', todayNewLeadsPreview],
      ['First Response Queue', leadFirstResponsePreview],
    ]);
    const leadContextItems = [
      leadOwnerText
        ? {
            label: 'Owner',
            value: leadOwnerText,
          }
        : null,
      leadSourceText
        ? {
            label: 'Source',
            value: leadSourceText,
          }
        : null,
      leadCategoryText
        ? {
            label: 'Category',
            value: leadCategoryText,
          }
        : null,
      leadContactText
        ? {
            label: 'Contact Anchor',
            value: leadContactText,
          }
        : null,
      leadCountryText
        ? {
            label: 'Country',
            value: leadCountryText,
          }
        : null,
    ].filter((item): item is { label: string; value: string; to?: string } => item !== null);
    const leadRelatedRecordItems = [
      getTextValue(companyName)
        ? {
            label: 'Company Candidate',
            value: getTextValue(companyName) as string,
            to: tradeCrmRouteMap.customers,
          }
        : null,
      getTextValue(contactName)
        ? {
            label: 'Contact Candidate',
            value: getTextValue(contactName) as string,
            to: tradeCrmRouteMap.prospecting,
          }
        : null,
      getTextValue(email)
        ? {
            label: 'Email Anchor',
            value: getTextValue(email) as string,
            to: tradeCrmRouteMap.mail,
          }
        : null,
    ].filter((item): item is { label: string; value: string; to?: string } => item !== null);
    const leadQueueSnapshotItems = [
      {
        label: 'Today New Leads',
        value: todayNewLeadsPreview,
        to: getTradeCrmScopedViewPath(tradeCrmRouteMap.workbench, 'today-new-leads'),
      },
      {
        label: 'First Response Risk',
        value: leadFirstResponsePreview,
        to: getTradeCrmScopedViewPath(tradeCrmRouteMap.workbench, 'first-response'),
      },
    ];

    return (
      <>
        <StyledShell>
          <StyledHeader>
            <StyledEyebrow>Trade CRM lead context</StyledEyebrow>
            <StyledTitle>Operate this lead through qualification and first response.</StyledTitle>
            <StyledDescription>
              A lead record should make four things explicit: where the lead came
              from, which product category it belongs to, who owns the next move,
              and whether the lead is ready to continue nurturing, convert, or be
              disqualified.
            </StyledDescription>
          </StyledHeader>
          <StyledGrid>
            <TradeCrmRecordShowShellCard
              label="Lead status"
              value={leadStatusText ?? 'Status not set'}
              description="Lead status should be kept current so sellers and supervisors can distinguish fresh intake, active follow-up, qualified leads, and non-viable records."
            />
            <TradeCrmRecordShowShellCard
              label="Source and category"
              value={
                getSelectLabel(source) ??
                getSelectLabel(productCategory) ??
                'Source or category missing'
              }
              description={
                getSelectLabel(productCategory)
                  ? `Product category: ${getSelectLabel(productCategory)}`
                  : 'Lead routing should follow source and storefront product category instead of ad hoc assignment.'
              }
            />
            <TradeCrmRecordShowShellCard
              label="Contact anchor"
              value={
                getTextValue(contactName) ??
                getTextValue(email) ??
                getTextValue(companyName) ??
                'No contact anchor'
              }
              description={
                getTextValue(country)
                  ? `Country: ${getTextValue(country)}`
                  : 'Use contact, company, and geography together when deciding follow-up priority and routing.'
              }
            />
            <TradeCrmRecordShowShellCard
              label="Owner and next move"
              value={getRelationName(accountOwner) ?? 'Unassigned'}
              description="The lead should always have a clear owner before first response, qualification, and conversion decisions continue."
            />
            <TradeCrmRecordShowShellCard
              label="Today new leads queue"
              value={
                totalTodayNewLeadsCount > 0
                  ? getQueueCountSummary({
                      count: totalTodayNewLeadsCount,
                      singularLabel: 'new lead today',
                      pluralLabel: 'new leads today',
                    })
                  : 'No new leads today'
              }
              description={todayNewLeadsPreview}
            />
            <TradeCrmRecordShowShellCard
              label="First-response risk"
              value={
                totalRiskCount > 0
                  ? getQueueCountSummary({
                      count: totalRiskCount,
                      singularLabel: 'lead at risk',
                      pluralLabel: 'leads at risk',
                    })
                  : 'No first-response pressure'
              }
              description={leadFirstResponsePreview}
            />
          </StyledGrid>
          <TradeCrmRecordShowShellChecklist
            title="Lead operating checklist"
            items={leadChecklistItems}
          />
          {sourceQueuePanel}
          <TradeCrmRecordShowShellContext
            title="Lead context anchors"
            items={leadContextItems}
          />
          {leadRelatedRecordItems.length > 0 ? (
            <TradeCrmRecordShowShellContext
              title="Follow-up anchor snapshot"
              items={leadRelatedRecordItems}
            />
          ) : null}
          <TradeCrmRecordShowShellContext
            title="Live queue snapshot"
            items={leadQueueSnapshotItems}
          />
          <TradeCrmRecordShowShellActions
            title="Quick actions"
            actions={leadActions}
          />
          <StyledNote>
            This shell does not replace the standard lead detail layout below. It
            frames how the record should be used inside the trade CRM lead
            workflow.
          </StyledNote>
        </StyledShell>
        <TradeCrmAiDock
          context={{
            workspace: 'Lead Record',
            entityType: 'lead',
            entityId: recordId,
            ownerId: getRelationId(accountOwner) ?? undefined,
            channel: 'lead-follow-up',
            stage: leadStatusText ?? undefined,
            summaryText: leadSummaryText,
          }}
        />
      </>
    );
  }

  if (objectNameSingular === CoreObjectNameSingular.Company) {
    const linkedPeopleCount = getCollectionCountLabel(people);
    const linkedOpportunityCount = getCollectionCountLabel(opportunities);
    const accountOwnerText = getRelationName(accountOwner);
    const domainText = getTextValue(domainName);
    const companyEmailText = getEmailPreview(emails);
    const companyPhoneText = getRelationName(phones);
    const firstLinkedPerson = getFirstCollectionItem(people);
    const firstLinkedOpportunity = getFirstCollectionItem(opportunities);
    const firstLinkedPersonId = getRelationId(firstLinkedPerson);
    const firstLinkedOpportunityId = getRelationId(firstLinkedOpportunity);
    const firstLinkedPersonName = getRelationName(firstLinkedPerson);
    const firstLinkedOpportunityName = getRelationName(firstLinkedOpportunity);
    const customer360WorkspaceLink = getTradeCrmScopedViewPath(
      tradeCrmRouteMap.customers,
      'customer-360',
    );
    const customerContactsWorkspaceLink = getTradeCrmScopedViewPath(
      tradeCrmRouteMap.customers,
      'contacts',
    );
    const opportunityPipelineWorkspaceLink = getTradeCrmScopedViewPath(
      tradeCrmRouteMap.opportunities,
      'pipeline-board',
    );
  const firstLinkedPersonLink = firstLinkedPersonId
    ? getInheritedRecordLink({
        objectNameSingular: CoreObjectNameSingular.Person,
        objectRecordId: firstLinkedPersonId,
        relationLabel: 'Company -> First Contact',
      })
    : null;
  const firstLinkedOpportunityLink = firstLinkedOpportunityId
    ? getInheritedRecordLink({
        objectNameSingular: CoreObjectNameSingular.Opportunity,
        objectRecordId: firstLinkedOpportunityId,
        relationLabel: 'Company -> First Opportunity',
      })
    : null;
    const companyChecklistItems = [
      accountOwnerText
        ? `Customer ownership is explicit: ${accountOwnerText}.`
        : 'Assign an account owner before the account spreads across teammates.',
      linkedPeopleCount != null && Number(linkedPeopleCount) > 0
        ? `Contact coverage is visible with ${linkedPeopleCount} linked contacts.`
        : 'Add at least one usable contact so the account can be worked reliably.',
      linkedOpportunityCount != null && Number(linkedOpportunityCount) > 0
        ? `Commercial motion exists with ${linkedOpportunityCount} linked opportunities.`
        : 'No linked opportunity is visible yet. Confirm whether the account is still commercial-active.',
      companyEmailText || companyPhoneText || domainText
        ? `Communication anchor is visible through ${companyEmailText ?? companyPhoneText ?? domainText}.`
        : 'No practical communication anchor is visible yet for customer follow-up.',
      domainText
        ? `Domain identity is anchored through ${domainText}.`
        : 'Domain is still missing, which weakens identity, email linkage, and duplicate review.',
    ];
    const companyActions = [
      ...sourceQueueActions,
      firstLinkedPersonLink
        ? {
            label: 'Open first contact record',
            to: firstLinkedPersonLink,
          }
        : null,
      firstLinkedOpportunityLink
        ? {
            label: 'Open first opportunity record',
            to: firstLinkedOpportunityLink,
          }
        : null,
      {
        label: 'Open customer 360 workspace',
        to: customer360WorkspaceLink,
      },
      {
        label: 'Open contacts view',
        to: customerContactsWorkspaceLink,
      },
      {
        label: 'Open opportunity pipeline',
        to: opportunityPipelineWorkspaceLink,
      },
      {
        label: 'Open mail workspace',
        to: tradeCrmRouteMap.mail,
      },
      {
        label: 'Open collaboration workspace',
        to: tradeCrmRouteMap.collaboration,
      },
      {
        label: 'Open task workspace',
        to: taskWorkspaceLink,
      },
      {
        label: 'Open team data',
        to: tradeCrmRouteMap.analytics,
      },
      {
        label: 'Open team performance',
        to: getTradeCrmScopedViewPath(tradeCrmRouteMap.analytics, 'team-performance'),
      },
      {
        label: 'Open stage governance',
        to: getTradeCrmScopedViewPath(tradeCrmRouteMap.settings, 'stages-status'),
      },
    ].filter((action): action is { label: string; to: string } => action !== null);
    const companySummaryText = buildSummaryText([
      ['Workspace', 'Customer 360'],
      ['Source Queue', sourceQueueValue],
      ['Source Workspace View', sourceViewContextValue],
      ['Source Return Queue', sourceReturnQueueValue],
      ['Source Relation Hop', sourceTrail],
      ['Account Owner', accountOwnerText],
      ['Domain', domainText],
      ['Primary Email', companyEmailText],
      ['Phone', companyPhoneText],
      ['First Contact', firstLinkedPersonName],
      ['First Opportunity', firstLinkedOpportunityName],
      [
        'Contact Coverage',
        linkedPeopleCount != null ? `${linkedPeopleCount} linked contacts` : null,
      ],
      [
        'Commercial Motion',
        linkedOpportunityCount != null
          ? `${linkedOpportunityCount} linked opportunities`
          : null,
      ],
      ['Tasks Due Today Queue', tasksDueTodayPreview],
      ['Pipeline Hygiene Queue', nextActionQueuePreview],
    ]);
    const companyContextItems = [
      accountOwnerText
        ? {
            label: 'Account Owner',
            value: accountOwnerText,
          }
        : null,
      domainText
        ? {
            label: 'Domain',
            value: domainText,
          }
        : null,
      companyEmailText
        ? {
            label: 'Primary Email',
            value: companyEmailText,
            to: tradeCrmRouteMap.mail,
          }
        : null,
      linkedPeopleCount != null
        ? {
            label: 'Contacts',
            value:
              firstLinkedPersonName != null
                ? `${linkedPeopleCount} linked, first: ${firstLinkedPersonName}`
                : `${linkedPeopleCount} linked`,
            to: firstLinkedPersonLink ?? customerContactsWorkspaceLink,
          }
        : null,
      linkedOpportunityCount != null
        ? {
            label: 'Opportunities',
            value:
              firstLinkedOpportunityName != null
                ? `${linkedOpportunityCount} linked, first: ${firstLinkedOpportunityName}`
                : `${linkedOpportunityCount} linked`,
            to: firstLinkedOpportunityLink ?? opportunityPipelineWorkspaceLink,
          }
        : null,
    ].filter((item): item is { label: string; value: string; to?: string } => item !== null);
    const companyRelatedRecordItems = [
      firstLinkedPersonName != null
        ? {
            label: 'First Contact',
            value: firstLinkedPersonName,
            to: firstLinkedPersonLink ?? customerContactsWorkspaceLink,
          }
        : null,
      firstLinkedOpportunityName != null
        ? {
            label: 'First Opportunity',
            value: firstLinkedOpportunityName,
            to: firstLinkedOpportunityLink ?? opportunityPipelineWorkspaceLink,
          }
        : null,
    ].filter((item): item is { label: string; value: string; to?: string } => item !== null);
    const companyQueueSnapshotItems = [
      {
        label: 'Tasks Due Today',
        value: tasksDueTodayPreview,
        to: tasksDueTodayLink,
      },
      {
        label: 'Pipeline Needs Next Action',
        value: nextActionQueuePreview,
        to: pipelineNeedsNextActionLink,
      },
    ];

    return (
      <>
        <StyledShell>
          <StyledHeader>
            <StyledEyebrow>Trade CRM customer context</StyledEyebrow>
            <StyledTitle>Operate this account as the customer hub.</StyledTitle>
            <StyledDescription>
              A company record should make customer ownership, contact coverage,
              active opportunities, and communication history visible from one
              place. The standard Twenty sections below remain the underlying
              record page; this shell clarifies how to operate the account in the
              trade CRM workflow.
            </StyledDescription>
          </StyledHeader>
          <StyledGrid>
            <TradeCrmRecordShowShellCard
              label="Account owner"
              value={getRelationName(accountOwner) ?? 'Unassigned'}
              description="Customer ownership should stay explicit before communication, follow-up, and opportunity movement spread across teammates."
            />
            <TradeCrmRecordShowShellCard
              label="Domain"
              value={getTextValue(domainName) ?? 'Not set'}
              description="Website domain remains the cleanest anchor for customer identity, email linkage, and duplicate review."
            />
            <TradeCrmRecordShowShellCard
              label="Contact coverage"
              value={
                linkedPeopleCount != null
                  ? `${linkedPeopleCount} linked contacts`
                  : 'Coverage not visible'
              }
              description={
                linkedPeopleCount != null
                  ? 'A healthy account should show who the team can actually reach inside the customer organization.'
                  : 'If linked contacts are missing, customer follow-up will remain fragile.'
              }
            />
            <TradeCrmRecordShowShellCard
              label="Commercial motion"
              value={
                linkedOpportunityCount != null
                  ? `${linkedOpportunityCount} linked opportunities`
                  : 'No opportunity signal'
              }
              description="Use the customer record together with linked opportunities so account review and commercial motion stay connected."
            />
            <TradeCrmRecordShowShellCard
              label="Communication anchor"
              value={
                companyEmailText ??
                companyPhoneText ??
                domainText ??
                'No communication anchor'
              }
              description={
                companyEmailText
                  ? 'A direct email anchor exists for follow-up, reply drafting, and mailbox review.'
                  : companyPhoneText
                    ? 'Phone coverage exists, but email alignment should still be confirmed for outbound follow-up.'
                    : 'Use the record sections below to keep communication, coordination, and follow-up attached to the same customer context.'
              }
            />
            <TradeCrmRecordShowShellCard
              label="Today follow-up queue"
              value={
                totalTasksDueTodayCount > 0
                  ? getQueueCountSummary({
                      count: totalTasksDueTodayCount,
                      singularLabel: 'task due today',
                      pluralLabel: 'tasks due today',
                    })
                  : 'No due-today pressure'
              }
              description={tasksDueTodayPreview}
            />
            <TradeCrmRecordShowShellCard
              label="Pipeline hygiene queue"
              value={
                totalMyPipelineNeedingNextActionCount > 0
                  ? getQueueCountSummary({
                      count: totalMyPipelineNeedingNextActionCount,
                      singularLabel: 'deal needs next action',
                      pluralLabel: 'deals need next action',
                    })
                  : 'Pipeline hygiene is clear'
              }
              description={nextActionQueuePreview}
            />
          </StyledGrid>
          <TradeCrmRecordShowShellChecklist
            title="Customer operating checklist"
            items={companyChecklistItems}
          />
          {sourceQueuePanel}
          <TradeCrmRecordShowShellContext
            title="Customer context anchors"
            items={companyContextItems}
          />
          {companyRelatedRecordItems.length > 0 ? (
            <TradeCrmRecordShowShellContext
              title="Related record snapshot"
              items={companyRelatedRecordItems}
            />
          ) : null}
          <TradeCrmRecordShowShellContext
            title="Live queue snapshot"
            items={companyQueueSnapshotItems}
          />
          <TradeCrmRecordShowShellActions
            title="Quick actions"
            actions={companyActions}
          />
          <StyledNote>
            Customer 360 in phase one should not be a new system. It should be a
            clearer account operating shell wrapped around the standard record
            page.
          </StyledNote>
        </StyledShell>
        <TradeCrmAiDock
          context={{
            workspace: 'Customer 360',
            entityType: 'company',
            entityId: recordId,
            ownerId: getRelationId(accountOwner) ?? undefined,
            channel: 'account-follow-up',
            stage: linkedOpportunityCount != null
              ? `${linkedOpportunityCount} linked opportunities`
              : 'customer-review',
            summaryText: companySummaryText,
          }}
        />
      </>
    );
  }

  if (objectNameSingular === CoreObjectNameSingular.Person) {
    const pointOfContactOpportunityCount = getCollectionCountLabel(
      pointOfContactForOpportunities,
    );
    const firstPointOfContactOpportunity = getFirstCollectionItem(
      pointOfContactForOpportunities,
    );
    const personCompanyText = getRelationName(company);
    const personEmailText = getEmailPreview(emails);
    const personRoleText = getTextValue(jobTitle);
    const personPhoneOrCityText =
      getRelationName(phones) ?? getTextValue(city) ?? null;
    const firstPointOfContactOpportunityId = getRelationId(
      firstPointOfContactOpportunity,
    );
    const firstPointOfContactOpportunityName = getRelationName(
      firstPointOfContactOpportunity,
    );
    const contactWorkspaceLink = getTradeCrmScopedViewPath(
      tradeCrmRouteMap.customers,
      'contacts',
    );
  const firstPointOfContactOpportunityLink = firstPointOfContactOpportunityId
    ? getInheritedRecordLink({
        objectNameSingular: CoreObjectNameSingular.Opportunity,
        objectRecordId: firstPointOfContactOpportunityId,
        relationLabel: 'Contact -> First Opportunity',
      })
    : null;
    const personChecklistItems = [
      personCompanyText
        ? `This contact is anchored to ${personCompanyText}.`
        : 'Link this contact to an account so follow-up stays commercially grounded.',
      personEmailText
        ? `A practical email anchor exists: ${personEmailText}.`
        : 'Add a usable email before relying on this contact for outbound work.',
      personRoleText
        ? `Role context is visible: ${personRoleText}.`
        : 'Job title or buying-role context is still missing.',
      pointOfContactOpportunityCount != null &&
      Number(pointOfContactOpportunityCount) > 0
        ? `This contact already participates in ${pointOfContactOpportunityCount} linked opportunities.`
        : 'Commercial relevance is not visible yet through linked opportunities.',
    ];
    const relatedCompanyId = getRelationId(company);
  const companyRecordLink = relatedCompanyId
    ? getInheritedRecordLink({
        objectNameSingular: CoreObjectNameSingular.Company,
        objectRecordId: relatedCompanyId,
        relationLabel: 'Contact -> Account',
      })
    : null;
    const personActions = [
      ...sourceQueueActions,
      companyRecordLink
        ? {
            label: 'Open account record',
            to: companyRecordLink,
          }
        : null,
      firstPointOfContactOpportunityLink
        ? {
            label: 'Open first linked opportunity',
            to: firstPointOfContactOpportunityLink,
          }
        : null,
      {
        label: 'Open customer workspace',
        to: tradeCrmRouteMap.customers,
      },
      {
        label: 'Open mail workspace',
        to: tradeCrmRouteMap.mail,
      },
      {
        label: 'Open contacts view',
        to: contactWorkspaceLink,
      },
      {
        label: 'Open collaboration workspace',
        to: tradeCrmRouteMap.collaboration,
      },
      {
        label: 'Open task workspace',
        to: taskWorkspaceLink,
      },
      {
        label: 'Open mail efficiency review',
        to: getTradeCrmScopedViewPath(tradeCrmRouteMap.analytics, 'mail-efficiency'),
      },
      {
        label: 'Open customer segmentation',
        to: getTradeCrmScopedViewPath(tradeCrmRouteMap.customers, 'segmentation'),
      },
    ].filter((action): action is { label: string; to: string } => action !== null);
    const personSummaryText = buildSummaryText([
      ['Workspace', 'Contact Record'],
      ['Source Queue', sourceQueueValue],
      ['Source Workspace View', sourceViewContextValue],
      ['Source Return Queue', sourceReturnQueueValue],
      ['Source Relation Hop', sourceTrail],
      ['Company', personCompanyText],
      ['Primary Email', personEmailText],
      ['Role', personRoleText],
      ['Phone Or City', personPhoneOrCityText],
      ['First Opportunity', firstPointOfContactOpportunityName],
      [
        'Commercial Relevance',
        pointOfContactOpportunityCount != null
          ? `${pointOfContactOpportunityCount} linked opportunities`
          : null,
      ],
      ['Tasks Due Today Queue', tasksDueTodayPreview],
      ['Pipeline Hygiene Queue', nextActionQueuePreview],
    ]);
    const personContextItems = [
      personCompanyText
        ? {
            label: 'Account',
            value: personCompanyText,
            to: companyRecordLink ?? undefined,
          }
        : null,
      personEmailText
        ? {
            label: 'Email',
            value: personEmailText,
            to: tradeCrmRouteMap.mail,
          }
        : null,
      personRoleText
        ? {
            label: 'Role',
            value: personRoleText,
          }
        : null,
      pointOfContactOpportunityCount != null
        ? {
            label: 'Opportunities',
            value:
              firstPointOfContactOpportunityName != null
                ? `${pointOfContactOpportunityCount} linked, first: ${firstPointOfContactOpportunityName}`
                : `${pointOfContactOpportunityCount} linked`,
            to:
              firstPointOfContactOpportunityLink ??
              getTradeCrmScopedViewPath(
                tradeCrmRouteMap.opportunities,
                'my-opportunities',
              ),
          }
        : null,
    ].filter((item): item is { label: string; value: string; to?: string } => item !== null);
    const personRelatedRecordItems = [
      firstPointOfContactOpportunityName != null
        ? {
            label: 'First Opportunity',
            value: firstPointOfContactOpportunityName,
            to:
              firstPointOfContactOpportunityLink ??
              getTradeCrmScopedViewPath(
                tradeCrmRouteMap.opportunities,
                'my-opportunities',
              ),
          }
        : null,
    ].filter((item): item is { label: string; value: string; to?: string } => item !== null);
    const personQueueSnapshotItems = [
      {
        label: 'Tasks Due Today',
        value: tasksDueTodayPreview,
        to: tasksDueTodayLink,
      },
      {
        label: 'Pipeline Needs Next Action',
        value: nextActionQueuePreview,
        to: pipelineNeedsNextActionLink,
      },
    ];

    return (
      <>
        <StyledShell>
          <StyledHeader>
            <StyledEyebrow>Trade CRM contact context</StyledEyebrow>
            <StyledTitle>Operate this contact inside account coverage.</StyledTitle>
            <StyledDescription>
              A contact record should explain which account this person belongs
              to, how the team reaches them, and whether this person is relevant
              to ongoing commercial motion. Contact data is only useful if it
              stays attached to account and opportunity follow-up.
            </StyledDescription>
          </StyledHeader>
          <StyledGrid>
            <TradeCrmRecordShowShellCard
              label="Company"
              value={getRelationName(company) ?? 'No linked company'}
              description="A person without clear account context is harder to route through customer and opportunity workflows."
            />
            <TradeCrmRecordShowShellCard
              label="Primary email"
              value={getEmailPreview(emails) ?? 'No email on record'}
              description="Email remains the practical communication anchor for follow-up, reply drafting, and thread review."
            />
            <TradeCrmRecordShowShellCard
              label="Phone or city"
              value={
                getRelationName(phones) ??
                getTextValue(city) ??
                'No phone or city context'
              }
              description={
                getTextValue(city)
                  ? `City: ${getTextValue(city)}`
                  : 'Phone and location context help the team understand practical reachability and market coverage.'
              }
            />
            <TradeCrmRecordShowShellCard
              label="Role"
              value={getTextValue(jobTitle) ?? 'Role not set'}
              description="Role and buying influence can be refined later, but this record should already support communication and follow-through."
            />
            <TradeCrmRecordShowShellCard
              label="Commercial relevance"
              value={
                pointOfContactOpportunityCount != null
                  ? `${pointOfContactOpportunityCount} linked opportunities`
                  : 'Relevance not visible'
              }
              description="If this contact participates in active opportunities, account communication and commercial follow-up should stay aligned here."
            />
            <TradeCrmRecordShowShellCard
              label="Today follow-up queue"
              value={
                totalTasksDueTodayCount > 0
                  ? getQueueCountSummary({
                      count: totalTasksDueTodayCount,
                      singularLabel: 'task due today',
                      pluralLabel: 'tasks due today',
                    })
                  : 'No due-today pressure'
              }
              description={tasksDueTodayPreview}
            />
            <TradeCrmRecordShowShellCard
              label="Pipeline hygiene queue"
              value={
                totalMyPipelineNeedingNextActionCount > 0
                  ? getQueueCountSummary({
                      count: totalMyPipelineNeedingNextActionCount,
                      singularLabel: 'deal needs next action',
                      pluralLabel: 'deals need next action',
                    })
                  : 'Pipeline hygiene is clear'
              }
              description={nextActionQueuePreview}
            />
          </StyledGrid>
          <TradeCrmRecordShowShellChecklist
            title="Contact operating checklist"
            items={personChecklistItems}
          />
          {sourceQueuePanel}
          <TradeCrmRecordShowShellContext
            title="Contact context anchors"
            items={personContextItems}
          />
          {personRelatedRecordItems.length > 0 ? (
            <TradeCrmRecordShowShellContext
              title="Related record snapshot"
              items={personRelatedRecordItems}
            />
          ) : null}
          <TradeCrmRecordShowShellContext
            title="Live queue snapshot"
            items={personQueueSnapshotItems}
          />
          <TradeCrmRecordShowShellActions
            title="Quick actions"
            actions={personActions}
          />
          <StyledNote>
            Contacts should be treated as part of account coverage, not as an
            isolated address book. Keep communication and commercial context tied
            back to the customer record.
          </StyledNote>
        </StyledShell>
        <TradeCrmAiDock
          context={{
            workspace: 'Contact Record',
            entityType: 'people',
            entityId: recordId,
            channel: 'contact-follow-up',
            stage: pointOfContactOpportunityCount != null
              ? `${pointOfContactOpportunityCount} linked opportunities`
              : undefined,
            summaryText: personSummaryText,
          }}
        />
      </>
    );
  }

  const nextActionText = getTextValue(nextAction);
  const nextActionDateText = getTextValue(nextActionDate);
  const stageText = getSelectLabel(stage);
  const lostReasonText = getSelectLabel(lostReason);
  const amountText = getCurrencyPreview(amount);
  const companyText = getRelationName(company);
  const pointOfContactText = getRelationName(pointOfContact);
  const opportunityOwnerText = getRelationName(accountOwner);
  const closeDateText = getTextValue(closeDate);
  const opportunityEmailText = getEmailPreview(emails);
  const opportunityChecklistItems = [
    stageText
      ? `Current stage is explicit: ${stageText}.`
      : 'Stage should be set before the deal is treated as actively progressing.',
    nextActionText && nextActionDateText
      ? `Next move is scheduled: ${nextActionText} by ${nextActionDateText}.`
      : 'Set both next action and next-action date to avoid silent pipeline slippage.',
    companyText && pointOfContactText
      ? `Both account and contact anchors are visible: ${companyText} / ${pointOfContactText}.`
      : 'Link the deal to both an account and a usable contact before deeper follow-up.',
    amountText || closeDateText
      ? `Commercial timing is partially visible${closeDateText ? ` with close date ${closeDateText}` : ''}${amountText ? ` and amount ${amountText}` : ''}.`
      : 'Expected amount or timing is still missing, which weakens manager review and forecasting.',
    opportunityEmailText || pointOfContactText
      ? `A follow-up channel is visible through ${opportunityEmailText ?? pointOfContactText}.`
      : 'No practical communication anchor is visible yet for this opportunity.',
  ];
  const relatedOpportunityCompanyId = getRelationId(company);
  const opportunityCompanyLink = relatedOpportunityCompanyId
    ? getInheritedRecordLink({
        objectNameSingular: CoreObjectNameSingular.Company,
        objectRecordId: relatedOpportunityCompanyId,
        relationLabel: 'Opportunity -> Account',
      })
    : null;
  const opportunityWorkspaceLink = getTradeCrmScopedViewPath(
    tradeCrmRouteMap.opportunities,
    'pipeline-board',
  );
  const opportunityMyWorkspaceLink = getTradeCrmScopedViewPath(
    tradeCrmRouteMap.opportunities,
    'my-opportunities',
  );
  const opportunityQuoteFollowUpLink = getTradeCrmScopedViewPath(
    tradeCrmRouteMap.opportunities,
    'quotation-follow-up',
  );
  const opportunityStalledWorkspaceLink = getTradeCrmScopedViewPath(
    tradeCrmRouteMap.opportunities,
    'stalled',
  );
  const relatedPointOfContactId = getRelationId(pointOfContact);
  const opportunityPointOfContactLink = relatedPointOfContactId
    ? getInheritedRecordLink({
        objectNameSingular: CoreObjectNameSingular.Person,
        objectRecordId: relatedPointOfContactId,
        relationLabel: 'Opportunity -> Contact',
      })
    : null;
  const opportunityActions = [
    ...sourceQueueActions,
    {
      label: 'Open opportunity workspace',
      to: opportunityWorkspaceLink,
    },
    {
      label: 'Open my opportunities workspace',
      to: opportunityMyWorkspaceLink,
    },
    {
      label: 'Open quote follow-up',
      to: opportunityQuoteFollowUpLink,
    },
    {
      label: 'Open stalled workspace',
      to: opportunityStalledWorkspaceLink,
    },
    {
      label: 'Open mail workspace',
      to: tradeCrmRouteMap.mail,
    },
    {
      label: 'Open team data',
      to: tradeCrmRouteMap.analytics,
    },
    {
      label: 'Open pipeline funnel review',
      to: getTradeCrmScopedViewPath(tradeCrmRouteMap.analytics, 'pipeline-funnel'),
    },
    {
      label: 'Open automation rules',
      to: getTradeCrmScopedViewPath(tradeCrmRouteMap.settings, 'automation-rules'),
    },
    {
      label: 'Open collaboration tasks',
      to: collaborationTasksLink,
    },
    {
      label: 'Open task workspace',
      to: taskWorkspaceLink,
    },
    opportunityCompanyLink
      ? {
          label: 'Open account record',
          to: opportunityCompanyLink,
        }
      : null,
    opportunityPointOfContactLink
      ? {
          label: 'Open contact record',
          to: opportunityPointOfContactLink,
        }
      : null,
  ].filter((action): action is { label: string; to: string } => action !== null);
  const opportunitySummaryText = buildSummaryText([
    ['Workspace', 'Opportunity 360'],
    ['Source Queue', sourceQueueValue],
    ['Source Workspace View', sourceViewContextValue],
    ['Source Return Queue', sourceReturnQueueValue],
    ['Source Relation Hop', sourceTrail],
    ['Owner', opportunityOwnerText],
    ['Stage', stageText],
    ['Next Action', nextActionText],
    ['Next Action Date', nextActionDateText],
    ['Account Anchor', companyText],
    ['Point Of Contact', pointOfContactText],
    ['Follow-up Channel', opportunityEmailText],
    ['Amount', amountText],
    ['Close Date', closeDateText],
    ['Lost Reason', lostReasonText],
    ['Account Record', companyText],
    ['Contact Record', pointOfContactText],
    ['Next Action Queue', nextActionQueuePreview],
    ['Quotation Queue', quoteFollowUpQueuePreview],
    ['Stalled Queue', stalledQueuePreview],
  ]);
  const opportunityContextItems = [
    companyText
      ? {
          label: 'Account',
          value: companyText,
          to: opportunityCompanyLink ?? undefined,
        }
      : null,
    pointOfContactText
      ? {
          label: 'Contact',
          value: pointOfContactText,
          to: opportunityPointOfContactLink ?? undefined,
        }
      : null,
    opportunityOwnerText
      ? {
          label: 'Owner',
          value: opportunityOwnerText,
        }
      : null,
    stageText
      ? {
          label: 'Stage',
          value: stageText,
        }
      : null,
    nextActionDateText
      ? {
          label: 'Next Action Date',
          value: nextActionDateText,
          to: opportunityMyWorkspaceLink,
        }
      : null,
    opportunityEmailText
      ? {
          label: 'Follow-up Channel',
          value: opportunityEmailText,
          to: tradeCrmRouteMap.mail,
        }
      : null,
    amountText
      ? {
          label: 'Amount',
          value: amountText,
        }
      : null,
  ].filter((item): item is { label: string; value: string; to?: string } => item !== null);
  const opportunityRelatedRecordItems = [
    companyText
      ? {
          label: 'Account Record',
          value: companyText,
          to: opportunityCompanyLink ?? opportunityWorkspaceLink,
        }
      : null,
    pointOfContactText
      ? {
          label: 'Contact Record',
          value: pointOfContactText,
          to: opportunityPointOfContactLink ?? opportunityWorkspaceLink,
        }
      : null,
  ].filter((item): item is { label: string; value: string; to?: string } => item !== null);
  const opportunityQueueSnapshotItems = [
    {
      label: 'Needs Next Action',
      value: nextActionQueuePreview,
      to: pipelineNeedsNextActionLink,
    },
    {
      label: 'Quotation Follow-up',
      value: quoteFollowUpQueuePreview,
      to: quotationFollowUpWorkspaceLink,
    },
    {
      label: 'Stalled Queue',
      value: stalledQueuePreview,
      to: stalledWorkspaceLink,
    },
  ];

  return (
    <>
      <StyledShell>
        <StyledHeader>
          <StyledEyebrow>Trade CRM pipeline context</StyledEyebrow>
          <StyledTitle>Operate this deal as a live pipeline record.</StyledTitle>
          <StyledDescription>
            Opportunity work should stay explicit about current stage, account
            anchor, key contact, timing, and the next move. The standard record
            page below remains intact; this shell makes the pipeline discipline
            visible for day-to-day trade CRM execution.
          </StyledDescription>
        </StyledHeader>
        <StyledGrid>
          <TradeCrmRecordShowShellCard
            label="Owner"
            value={opportunityOwnerText ?? 'Unassigned'}
            description="Opportunity ownership should stay explicit before quote follow-up and manager escalation continue."
          />
          <TradeCrmRecordShowShellCard
            label="Stage"
            value={stageText ?? 'Stage not set'}
            description="Pipeline stage names matter only if they still lead to a concrete next commercial move."
          />
          <TradeCrmRecordShowShellCard
            label="Next action"
            value={nextActionText ?? 'Needs update'}
            description={
              nextActionDateText
                ? `Target date: ${nextActionDateText}`
                : 'Set both the next action and the next action date to keep the deal from stalling.'
            }
          />
          <TradeCrmRecordShowShellCard
            label="Account anchor"
            value={companyText ?? 'No linked company'}
            description={
              pointOfContactText
                ? `Point of contact: ${pointOfContactText}`
                : 'Link the deal to both an account and a usable contact so follow-up remains commercially grounded.'
            }
          />
          <TradeCrmRecordShowShellCard
            label="Commercial timing"
            value={closeDateText ?? 'Close date not set'}
            description={
              amountText
                ? `Expected commercial amount: ${amountText}`
                : 'Use amount and target timing together when deciding whether this deal is still progressing normally.'
            }
          />
          <TradeCrmRecordShowShellCard
            label="Follow-up channel"
            value={opportunityEmailText ?? pointOfContactText ?? 'No channel visible'}
            description={
              opportunityEmailText
                ? 'A direct email anchor exists for quotation follow-up and reply handling.'
                : pointOfContactText
                  ? 'A contact anchor exists, but mailbox alignment should still be confirmed for consistent follow-up.'
                  : 'Keep the deal linked to a usable contact and communication channel before it moves deeper into the pipeline.'
            }
          />
          <TradeCrmRecordShowShellCard
            label="Risk boundary"
            value={lostReasonText ?? 'Still open or not marked lost'}
            description={
              lostReasonText
                ? 'If the deal is lost, keep the reason standardized so future funnel review stays usable.'
                : nextActionText && nextActionDateText
                  ? 'The deal has both a next action and next-action date. Keep them current as the stage changes.'
                  : 'Missing next-action detail is the clearest early warning that the deal is slipping.'
              }
            />
          <TradeCrmRecordShowShellCard
            label="Next-action queue"
            value={
              totalMyPipelineNeedingNextActionCount > 0
                ? getQueueCountSummary({
                    count: totalMyPipelineNeedingNextActionCount,
                    singularLabel: 'deal needs action',
                    pluralLabel: 'deals need action',
                  })
                : 'Queue is clear'
            }
            description={nextActionQueuePreview}
          />
          <TradeCrmRecordShowShellCard
            label="Quotation follow-up"
            value={
              totalQuoteFollowUpReminderCount > 0
                ? getQueueCountSummary({
                    count: totalQuoteFollowUpReminderCount,
                    singularLabel: 'quote reminder',
                    pluralLabel: 'quote reminders',
                  })
                : 'No quote pressure'
            }
            description={quoteFollowUpQueuePreview}
          />
          <TradeCrmRecordShowShellCard
            label="Stalled recovery"
            value={
              totalStalledOpportunityReminderCount > 0
                ? getQueueCountSummary({
                    count: totalStalledOpportunityReminderCount,
                    singularLabel: 'stalled reminder',
                    pluralLabel: 'stalled reminders',
                  })
                : 'No stalled pressure'
            }
            description={stalledQueuePreview}
          />
        </StyledGrid>
        <TradeCrmRecordShowShellChecklist
          title="Opportunity operating checklist"
          items={opportunityChecklistItems}
        />
        {sourceQueuePanel}
    <TradeCrmRecordShowShellContext
      title="Opportunity context anchors"
      items={opportunityContextItems}
    />
    {opportunityRelatedRecordItems.length > 0 ? (
      <TradeCrmRecordShowShellContext
        title="Related record snapshot"
        items={opportunityRelatedRecordItems}
      />
    ) : null}
    <TradeCrmRecordShowShellContext
      title="Live queue snapshot"
      items={opportunityQueueSnapshotItems}
    />
        <TradeCrmRecordShowShellActions
          title="Quick actions"
          actions={opportunityActions}
        />
          <StyledNote>
          An opportunity should always answer five questions quickly: what stage
          it is in, who it is for, who the key contact is, what happens next, and
          by when.
        </StyledNote>
      </StyledShell>
      <TradeCrmAiDock
        context={{
          workspace: 'Opportunity 360',
          entityType: 'opportunity',
          entityId: recordId,
          ownerId: getRelationId(accountOwner) ?? undefined,
          channel: 'quote-and-stage-follow-up',
          stage: stageText ?? undefined,
          summaryText: opportunitySummaryText,
        }}
      />
    </>
  );
};
