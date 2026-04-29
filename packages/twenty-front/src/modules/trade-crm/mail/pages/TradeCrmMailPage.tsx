import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  AppPath,
  CoreObjectNameSingular,
  SettingsPath,
} from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { useOpenCreateActivityDrawer } from '@/activities/hooks/useOpenCreateActivityDrawer';
import { type ActivityTargetableObject } from '@/activities/types/ActivityTargetableEntity';
import { getTradeCrmCustomerPath } from '@/trade-crm/customers/utils/tradeCrmCustomerRouting';
import {
  getTradeCrmScopedViewPath,
  tradeCrmRouteMap,
} from '@/trade-crm/navigation/tradeCrmRouteMap';

import { MainContainerLayoutWithSidePanel } from '@/object-record/components/MainContainerLayoutWithSidePanel';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { TradeCrmMailFolderTree } from '@/trade-crm/mail/components/TradeCrmMailFolderTree';
import {
  getTradeCrmMailSidebarLink,
  getTradeCrmMailWorkspace,
  type TradeCrmMailSidebarItem,
  type TradeCrmMailViewKey,
} from '@/trade-crm/mail/constants/trade-crm-mail-workspace';
import { CREATE_DEVELOPMENT_EMAIL_AUDIENCE } from '@/trade-crm/mail/graphql/mutations/createDevelopmentEmailAudience';
import { CREATE_DEVELOPMENT_EMAIL_CAMPAIGN } from '@/trade-crm/mail/graphql/mutations/createDevelopmentEmailCampaign';
import { CREATE_DEVELOPMENT_EMAIL_TEMPLATE } from '@/trade-crm/mail/graphql/mutations/createDevelopmentEmailTemplate';
import { EXECUTE_DEVELOPMENT_EMAIL_SEND_JOB } from '@/trade-crm/mail/graphql/mutations/executeDevelopmentEmailSendJob';
import { QUEUE_DEVELOPMENT_EMAIL_CAMPAIGN } from '@/trade-crm/mail/graphql/mutations/queueDevelopmentEmailCampaign';
import { RECORD_DEVELOPMENT_EMAIL_BOUNCE_EVENT } from '@/trade-crm/mail/graphql/mutations/recordDevelopmentEmailBounceEvent';
import { RECORD_DEVELOPMENT_EMAIL_EVENT } from '@/trade-crm/mail/graphql/mutations/recordDevelopmentEmailEvent';
import { RECORD_DEVELOPMENT_EMAIL_UNSUBSCRIBE } from '@/trade-crm/mail/graphql/mutations/recordDevelopmentEmailUnsubscribe';
import { UPSERT_TRADE_CRM_MAIL_THREAD_TASK_LINK } from '@/trade-crm/mail/graphql/mutations/upsertTradeCrmMailThreadTaskLink';
import { START_DEVELOPMENT_EMAIL_SEND_JOB } from '@/trade-crm/mail/graphql/mutations/startDevelopmentEmailSendJob';
import { UPDATE_TRADE_CRM_MAIL_THREAD_TAG } from '@/trade-crm/mail/graphql/mutations/updateTradeCrmMailThreadTag';
import { UPDATE_TRADE_CRM_MAIL_THREAD_STATE } from '@/trade-crm/mail/graphql/mutations/updateTradeCrmMailThreadState';
import { GET_DEVELOPMENT_EMAIL_AUDIENCES } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailAudiences';
import { GET_DEVELOPMENT_EMAIL_ANALYTICS } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailAnalytics';
import { GET_DEVELOPMENT_EMAIL_BOUNCE_EVENTS } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailBounceEvents';
import { GET_DEVELOPMENT_EMAIL_CAMPAIGNS } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailCampaigns';
import { GET_DEVELOPMENT_EMAIL_REPORT_EXPORT } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailReportExport';
import { GET_DEVELOPMENT_EMAIL_SEND_JOBS } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailSendJobs';
import { GET_DEVELOPMENT_EMAIL_SEND_JOB_SUMMARY } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailSendJobSummary';
import { GET_DEVELOPMENT_EMAIL_SEND_TASKS } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailSendTasks';
import { GET_DEVELOPMENT_EMAIL_TEMPLATES } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailTemplates';
import { GET_DEVELOPMENT_EMAIL_TRACKING_LINKS } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailTrackingLinks';
import { GET_DEVELOPMENT_EMAIL_UNSUBSCRIBES } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailUnsubscribes';
import { GET_DEVELOPMENT_EMAIL_WORKSPACE } from '@/trade-crm/mail/graphql/queries/getDevelopmentEmailWorkspace';
import { GET_MY_INBOX_THREADS } from '@/trade-crm/mail/graphql/queries/getMyInboxThreads';
import { GET_TRADE_CRM_MAIL_THREAD_TASK_LINKS } from '@/trade-crm/mail/graphql/queries/getTradeCrmMailThreadTaskLinks';
import { useTradeCrmMailWorkspaceData } from '@/trade-crm/mail/hooks/useTradeCrmMailWorkspaceData';
import {
  TRADE_CRM_MAIL_SCOPE_ORDER,
  getTradeCrmMailPath,
  type TradeCrmMailScopeKey,
} from '@/trade-crm/mail/navigation/trade-crm-mail-navigation';
import { useCopyToClipboard } from '~/hooks/useCopyToClipboard';
import { useOpenEmailThreadInSidePanel } from '@/side-panel/hooks/useOpenEmailThreadInSidePanel';
import {
  type RecordInsightItem,
  RecordInsightPanel,
} from '@/trade-crm/shared/components/RecordInsightPanel';
import { TradeCrmAiDock } from '@/trade-crm/shared/components/TradeCrmAiDock';
import { TradeCrmLocaleSwitch } from '@/trade-crm/shared/components/TradeCrmLocaleSwitch';
import { useTradeCrmLocale } from '@/trade-crm/shared/hooks/useTradeCrmLocale';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import {
  createTradeCrmRecordSource,
  getTradeCrmRecordPathFromSource,
} from '@/trade-crm/shared/navigation/tradeCrmRecordSource';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { formatToHumanReadableDate } from '~/utils/date-utils';

type GenericTaskRecord = Record<string, unknown> & {
  __typename: string;
  id: string;
};

type TradeCrmMailThreadTaskLinkRecord = {
  id: string;
  threadId: string;
  taskId: string;
  updatedAt: string;
};

const getTaskTargets = (record: GenericTaskRecord | undefined) => {
  if (!record || !('taskTargets' in record)) {
    return [];
  }

  const taskTargets = record.taskTargets;

  if (Array.isArray(taskTargets)) {
    return taskTargets;
  }

  if (
    taskTargets &&
    typeof taskTargets === 'object' &&
    Array.isArray((taskTargets as { edges?: unknown[] }).edges)
  ) {
    return (taskTargets as { edges: Array<{ node?: unknown }> }).edges
      .map((edge) => edge.node)
      .filter((node) => typeof node === 'object' && node !== null);
  }

  return [];
};

const getTaskTargetValue = (
  taskTarget: unknown,
  key: 'targetCompanyId' | 'companyId' | 'targetPersonId' | 'personId' | 'targetOpportunityId' | 'opportunityId',
) => {
  if (!taskTarget || typeof taskTarget !== 'object') {
    return null;
  }

  const value = (taskTarget as Record<string, unknown>)[key];

  return typeof value === 'string' ? value : null;
};

const StyledContent = styled.div`
  background: radial-gradient(
      circle at top left,
      rgba(10, 106, 255, 0.06),
      transparent 18%
    ),
    linear-gradient(180deg, #f7f9fc 0%, #eef3f8 100%);
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  min-height: 100%;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledHero = styled.section<{ $compact?: boolean }>`
  align-items: center;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(31, 64, 112, 0.08);
  border-radius: 18px;
  box-shadow: 0 20px 44px rgba(31, 64, 112, 0.08);
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
  padding: ${({ $compact }) =>
    $compact
      ? `${themeCssVariables.spacing[3]}`
      : `${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]}`};

  @media (max-width: 1080px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const StyledCompactHeroStack = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledCompactHeroRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
`;

const StyledCompactHeroSummary = styled.div`
  align-items: flex-start;
  background: #f8fbff;
  border: 1px solid rgba(10, 106, 255, 0.12);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 240px;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledCompactHeroValue = styled.div`
  color: #1e2126;
  font-size: 22px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  line-height: 1.15;
`;

const StyledCompactHeroText = styled.div`
  color: #66768f;
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
  max-width: 680px;
`;

const StyledScopeTabs = styled.div`
  align-items: center;
  background: #eef4ff;
  border-radius: 999px;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  padding: 4px;
`;

const StyledScopeTab = styled(Link)`
  background: transparent;
  border: 0;
  border-radius: 999px;
  color: #1f4070;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  padding: 10px 18px;
  text-decoration: none;

  &[data-active='true'] {
    background: #0a6aff;
    color: #ffffff;
  }
`;

const StyledSubviewTabs = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledSubviewTab = styled(Link)`
  background: #ffffff;
  border: 1px solid rgba(31, 64, 112, 0.1);
  border-radius: 999px;
  color: #50627a;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: 8px 14px;
  text-decoration: none;

  &[data-active='true'] {
    background: #1e2126;
    border-color: #1e2126;
    color: #ffffff;
  }
`;

const StyledHeroGrid = styled.div`
  align-items: center;
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: minmax(0, 1fr) minmax(220px, 0.62fr);

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const StyledHeroCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledEyebrow = styled.div`
  color: #0a6aff;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const StyledHeroTitle = styled.h2`
  color: #1e2126;
  font-family: ${tradeCrmUiTheme.typography.display};
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.12;
  margin: 0;
`;

const StyledHeroDescription = styled.p`
  color: #76839b;
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.55;
  margin: 0;
  max-width: 760px;
`;

const StyledHeroSummary = styled.div`
  background: linear-gradient(135deg, #0a6aff 0%, #2f87ff 100%);
  border: 0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 220px;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledHeroSummaryTitle = styled.div`
  color: rgba(255, 255, 255, 0.76);
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const StyledHeroSummaryValue = styled.div`
  color: #ffffff;
  font-size: 24px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledHeroSummaryText = styled.div`
  color: rgba(255, 255, 255, 0.84);
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

const StyledWorkspace = styled.div<{
  $withoutInsight?: boolean;
  $relationshipScope?: boolean;
}>`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: ${({ $withoutInsight, $relationshipScope }) => {
    const sidebarWidth = $relationshipScope ? '236px' : '260px';

    return $withoutInsight
      ? `${sidebarWidth} minmax(0, 1fr)`
      : `${sidebarWidth} minmax(0, 1fr) 340px`;
  }};

  @media (max-width: 1220px) {
    grid-template-columns: 1fr;
  }
`;

const StyledSidebar = styled.aside<{ $relationshipScope?: boolean }>`
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(31, 64, 112, 0.08);
  border-radius: 18px;
  box-shadow: 0 18px 36px rgba(31, 64, 112, 0.08);
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${({ $relationshipScope }) =>
    $relationshipScope
      ? `${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[2]}`
      : themeCssVariables.spacing[3]};
  position: sticky;
  top: ${themeCssVariables.spacing[4]};
`;

const StyledSidebarTitle = styled.div`
  color: #1f4070;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.02em;
`;

const StyledSidebarList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledSidebarSection = styled.div`
  border-top: 1px solid rgba(31, 64, 112, 0.08);
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding-top: ${themeCssVariables.spacing[2]};
`;

const StyledSidebarSectionLabel = styled.div`
  color: #76839b;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const StyledComposeButton = styled(Link)`
  align-items: center;
  background: linear-gradient(135deg, #0a6aff 0%, #2f87ff 100%);
  border-radius: 999px;
  color: #ffffff;
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  justify-content: center;
  min-height: 42px;
  padding: 0 ${themeCssVariables.spacing[4]};
  text-decoration: none;
`;

const StyledSidebarLink = styled(Link)`
  background: transparent;
  border: 1px solid transparent;
  border-radius: 12px;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  text-decoration: none;

  &[data-active='true'] {
    background: #eef4ff;
    border-color: rgba(10, 106, 255, 0.22);
  }
`;

const StyledSidebarLabelRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledSidebarLabel = styled.div`
  color: #1e2126;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledSidebarCount = styled.div`
  color: #76839b;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledSidebarHint = styled.div`
  color: #98a2b3;
  font-size: ${themeCssVariables.font.size.xs};
  line-height: 1.45;
`;

const StyledSidebarControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledMainColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledPanel = styled.section`
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(31, 64, 112, 0.08);
  border-radius: 18px;
  box-shadow: 0 18px 36px rgba(31, 64, 112, 0.08);
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledToolbar = styled.div`
  align-items: center;
  border-bottom: 1px solid rgba(31, 64, 112, 0.08);
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: minmax(0, 1fr) auto;
  padding-bottom: ${themeCssVariables.spacing[3]};

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const StyledSearchInput = styled.div`
  background: #f8fbff;
  border: 1px solid rgba(31, 64, 112, 0.08);
  border-radius: 12px;
  color: #76839b;
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledToolbarMeta = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
`;

const StyledBadge = styled.div`
  background: #f3f6fb;
  border: 1px solid rgba(31, 64, 112, 0.08);
  border-radius: 999px;
  color: #50627a;
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledRuntimeNotice = styled.div<{ $tone?: 'warning' | 'neutral' }>`
  background: ${({ $tone }) =>
    $tone === 'warning' ? 'rgba(255, 171, 0, 0.10)' : '#f5f9ff'};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'warning'
        ? 'rgba(255, 171, 0, 0.24)'
        : 'rgba(10, 106, 255, 0.10)'};
  border-radius: ${tradeCrmUiTheme.radius.card};
  color: ${({ $tone }) => ($tone === 'warning' ? '#935b00' : '#50627a')};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledMetrics = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const StyledMetricCard = styled.div`
  background: #f8fbff;
  border: 1px solid rgba(31, 64, 112, 0.08);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledMetricLabel = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.xs};
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const StyledMetricValue = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: 28px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledMetricDescription = styled.div`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
`;

const StyledSectionTitle = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledSubsectionTitle = styled.div`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const StyledList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledListItem = styled.div`
  background: ${tradeCrmUiTheme.colors.page};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.card};
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: minmax(0, 1fr) auto;
  padding: ${themeCssVariables.spacing[3]};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const StyledListItemLink = styled(Link)`
  background: ${tradeCrmUiTheme.colors.page};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.card};
  color: inherit;
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: minmax(0, 1fr) auto;
  padding: ${themeCssVariables.spacing[3]};
  text-decoration: none;

  &:hover {
    border-color: ${tradeCrmUiTheme.colors.borderStrong};
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const StyledListCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledListPrimary = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledListSecondary = styled.div`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledListTertiary = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

const StyledListMeta = styled.div`
  color: ${tradeCrmUiTheme.colors.inkFaint};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledStatus = styled.div`
  align-self: flex-start;
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.borderStrong};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledListActions = styled.div`
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledMailWorkbench = styled.div<{ $relationshipView?: boolean }>`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: ${({ $relationshipView }) =>
    $relationshipView
      ? 'minmax(320px, 0.88fr) minmax(520px, 1.12fr)'
      : 'minmax(0, 1.2fr) minmax(280px, 0.9fr)'};

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`;

const StyledMailWorkbenchList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledMailWorkbenchListHeader = styled.div`
  align-items: center;
  color: #7a8799;
  display: grid;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: minmax(120px, 0.45fr) minmax(0, 1fr) 96px;
  letter-spacing: 0.08em;
  padding: 0 ${themeCssVariables.spacing[3]};
  text-transform: uppercase;
`;

const StyledMailWorkbenchRow = styled.div`
  align-items: flex-start;
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: minmax(120px, 0.45fr) minmax(0, 1fr) 96px;
`;

const StyledMailSenderCell = styled.div`
  color: #1e2126;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  line-height: 1.4;
`;

const StyledMailSubjectCell = styled.div`
  color: #465469;
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: 6px;
  min-width: 0;
`;

const StyledMailTimeCell = styled.div`
  color: #7a8799;
  font-size: ${themeCssVariables.font.size.xs};
  line-height: 1.5;
  text-align: right;
`;

const StyledMailWorkbenchSummaryRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledMailWorkbenchChip = styled.div<{ $tone?: 'accent' | 'neutral' }>`
  background: ${({ $tone }) =>
    $tone === 'accent' ? 'rgba(10, 106, 255, 0.10)' : '#f3f6fb'};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'accent'
        ? 'rgba(10, 106, 255, 0.18)'
        : 'rgba(31, 64, 112, 0.08)'};
  border-radius: 999px;
  color: ${({ $tone }) => ($tone === 'accent' ? '#0a52cb' : '#617287')};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: 6px 10px;
`;

const StyledMailWorkbenchItem = styled.button<{ $active: boolean }>`
  align-items: stretch;
  background: ${({ $active }) => ($active ? '#eef4ff' : '#ffffff')};
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(10, 106, 255, 0.24)' : 'rgba(31, 64, 112, 0.08)'};
  border-radius: 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  text-align: left;
`;

const StyledMailWorkbenchHeader = styled.div`
  align-items: flex-start;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledMailWorkbenchTitle = styled.div`
  color: #1e2126;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  line-height: 1.5;
`;

const StyledMailWorkbenchMeta = styled.div`
  color: #98a2b3;
  font-size: ${themeCssVariables.font.size.xs};
  line-height: 1.45;
`;

const StyledMailWorkbenchPreview = styled.div<{ $relationshipView?: boolean }>`
  align-self: ${({ $relationshipView }) =>
    $relationshipView ? 'start' : 'stretch'};
  background: #fbfdff;
  border: 1px solid rgba(31, 64, 112, 0.08);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  min-height: 100%;
  padding: ${themeCssVariables.spacing[3]};
  position: ${({ $relationshipView }) =>
    $relationshipView ? 'sticky' : 'static'};
  top: ${({ $relationshipView }) =>
    $relationshipView ? themeCssVariables.spacing[4] : 'auto'};
`;

const StyledMailPreviewTopbar = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledMailPreviewTopbarCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StyledMailPreviewSideStack = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: minmax(0, 1fr);
`;

const StyledMailRelationshipPreviewGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: minmax(0, 1.12fr) minmax(320px, 0.98fr);

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`;

const StyledMailRelationshipDetailStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledMailAssistantTabs = styled.div`
  align-items: center;
  border-bottom: 1px solid rgba(31, 64, 112, 0.08);
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  padding-bottom: ${themeCssVariables.spacing[2]};
`;

const StyledMailAssistantTab = styled.button`
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  color: #76839b;
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  padding: 0 0 ${themeCssVariables.spacing[1]} 0;

  &[data-active='true'] {
    border-bottom-color: #0a6aff;
    color: #0a6aff;
  }
`;

const StyledMailTagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledMailTag = styled.div`
  align-items: center;
  background: #eef4ff;
  border-radius: 999px;
  color: #0a6aff;
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  min-height: 28px;
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledMailQuote = styled.div`
  background: #f8fbff;
  border: 1px solid rgba(31, 64, 112, 0.08);
  border-radius: 12px;
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.7;
  padding: ${themeCssVariables.spacing[3]};
  white-space: pre-wrap;
`;

const StyledMailProfileGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const StyledMailProfileItem = styled.div`
  background: #f8fbff;
  border: 1px solid rgba(31, 64, 112, 0.08);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledMailProfileLabel = styled.div`
  color: #8a95a8;
  font-size: ${themeCssVariables.font.size.xs};
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const StyledMailProfileValue = styled.div`
  color: #1e2126;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  line-height: 1.5;
`;

const StyledMailPreviewTitle = styled.div`
  color: #1e2126;
  font-size: 20px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  line-height: 1.35;
`;

const StyledMailPreviewBlock = styled.div`
  background: #ffffff;
  border: 1px solid rgba(31, 64, 112, 0.08);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledMailPreviewLabel = styled.div`
  color: #76839b;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const StyledMailAiList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledMailAiItem = styled.div`
  align-items: flex-start;
  background: linear-gradient(180deg, #ffffff 0%, #f7faff 100%);
  border: 1px solid rgba(10, 106, 255, 0.1);
  border-radius: 12px;
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: 22px minmax(0, 1fr);
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledMailAiButton = styled.button<{ $active?: boolean }>`
  align-items: flex-start;
  background: ${({ $active }) =>
    $active ? '#eef4ff' : 'linear-gradient(180deg, #ffffff 0%, #f7faff 100%)'};
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(10, 106, 255, 0.24)' : 'rgba(10, 106, 255, 0.1)'};
  border-radius: 12px;
  cursor: pointer;
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: 22px minmax(0, 1fr);
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  text-align: left;
`;

const StyledMailAiIndex = styled.div`
  align-items: center;
  background: rgba(10, 106, 255, 0.1);
  border-radius: 999px;
  color: #0a52cb;
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  height: 22px;
  justify-content: center;
  width: 22px;
`;

const StyledInlineActionForm = styled.div`
  align-items: stretch;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 220px;
`;

const StyledInlineActionRow = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledCardGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const StyledActionCard = styled.div`
  background: ${tradeCrmUiTheme.colors.page};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.card};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledActionTitle = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledActionDescription = styled.div`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

const StyledFormGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const StyledFormField = styled.label`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledInput = styled.input`
  background: ${tradeCrmUiTheme.colors.page};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledSelect = styled.select`
  background: ${tradeCrmUiTheme.colors.page};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledTextArea = styled.textarea`
  background: ${tradeCrmUiTheme.colors.page};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  min-height: 140px;
  padding: ${themeCssVariables.spacing[3]};
  resize: vertical;
`;

const StyledButtonRow = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
`;

const StyledActionLink = styled(Link)`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.borderStrong};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  text-decoration: none;
`;

const StyledPrimaryButton = styled.button`
  background: ${tradeCrmUiTheme.colors.ink};
  border: 1px solid ${tradeCrmUiTheme.colors.ink};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.surface};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledSecondaryButton = styled.button`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.borderStrong};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledFilterPresetRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledFilterPresetButton = styled.button<{ $active: boolean }>`
  background: ${({ $active }) =>
    $active ? tradeCrmUiTheme.colors.ink : tradeCrmUiTheme.colors.surface};
  border: 1px solid
    ${({ $active }) =>
      $active
        ? tradeCrmUiTheme.colors.ink
        : tradeCrmUiTheme.colors.borderStrong};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${({ $active }) =>
    $active ? tradeCrmUiTheme.colors.surface : tradeCrmUiTheme.colors.ink};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledErrorText = styled.div`
  color: #b42318;
  font-size: ${themeCssVariables.font.size.sm};
`;

const getCurrentScope = (
  requestedScope: string | null,
): TradeCrmMailScopeKey =>
  TRADE_CRM_MAIL_SCOPE_ORDER.includes(requestedScope as TradeCrmMailScopeKey)
    ? (requestedScope as TradeCrmMailScopeKey)
    : 'mail';

const getLegacyMailRouteTarget = (
  requestedView: string | null,
): { scope: TradeCrmMailScopeKey; view: TradeCrmMailViewKey } | null => {
  switch (requestedView) {
    case 'inbox':
      return { scope: 'mail', view: 'inbox' };
    case 'pending-replies':
      return { scope: 'mail', view: 'pending' };
    case 'sent':
      return { scope: 'mail', view: 'sent' };
    case 'templates':
      return { scope: 'campaign', view: 'templates' };
    case 'sequences':
      return { scope: 'campaign', view: 'campaigns' };
    case 'tracking':
      return { scope: 'campaign', view: 'analytics' };
    default:
      return null;
  }
};

const isDevelopmentEmailCreateView = (viewKey: TradeCrmMailViewKey) =>
  viewKey === 'audiences' ||
  viewKey === 'templates' ||
  viewKey === 'campaigns' ||
  viewKey === 'jobs' ||
  viewKey === 'analytics' ||
  viewKey === 'reports' ||
  viewKey === 'bounces' ||
  viewKey === 'unsubscribes';

const formatSnapshotValue = (value: unknown) => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (value === null || value === undefined) {
    return 'not recorded';
  }

  return JSON.stringify(value);
};

const getSenderHealthReasonParts = (value: string) => {
  const [code, ...messageParts] = value.split(' · ');

  if (messageParts.length === 0) {
    return {
      code: null,
      message: value,
    };
  }

  return {
    code,
    message: messageParts.join(' · '),
  };
};

const groupSidebarItemsBySection = (
  sidebarItems: TradeCrmMailSidebarItem[],
) => {
  const sectionMap = new Map<string, TradeCrmMailSidebarItem[]>();

  for (const item of sidebarItems) {
    const sectionItems = sectionMap.get(item.section) ?? [];

    sectionItems.push(item);
    sectionMap.set(item.section, sectionItems);
  }

  return Array.from(sectionMap.entries()).map(([section, items]) => ({
    section,
    items,
  }));
};

const getCurrentView = ({
  requestedView,
  availableViewKeys,
  fallbackViewKey,
}: {
  requestedView: string | null;
  availableViewKeys: TradeCrmMailViewKey[];
  fallbackViewKey: TradeCrmMailViewKey;
}) =>
  availableViewKeys.includes(requestedView as TradeCrmMailViewKey)
    ? (requestedView as TradeCrmMailViewKey)
    : fallbackViewKey;

const getInsightItems = (scope: TradeCrmMailScopeKey): RecordInsightItem[] => {
  if (scope === 'campaign') {
    return [
      {
        label: 'System split',
        value: 'Mailbox core + outbound system',
        description:
          'Twenty continues to own mailbox sync, folders, and threads while development email adds campaigns, queues, tracking, and compliance.',
      },
      {
        label: 'Critical rule',
        value: 'Unsubscribe and suppression enforced',
        description:
          'Every outbound path must honor unsubscribe links, suppression lists, bounce handling, and complaint loops.',
      },
      {
        label: 'Sending discipline',
        value: 'Domain and sender-pool governance',
        description:
          'Rate limits, sender rotation, domain health, and webhook feedback must all stay visible in the operating surface.',
      },
      {
        label: 'AI boundary',
        value: 'Advise, not send',
        description:
          'AI can draft, summarize, and flag risks, but it cannot auto-send or silently change CRM state.',
      },
    ];
  }

  if (scope === 'customer') {
    return [
      {
        label: 'Primary goal',
        value: 'Customer operating loop',
        description:
          'Email should resolve back into customer, contact, and opportunity execution instead of staying as a detached thread list.',
      },
      {
        label: 'Priority logic',
        value: 'Value plus response timing',
        description:
          'Key accounts, reply latency, and commercial stage should jointly determine which customer is surfaced first.',
      },
      {
        label: 'CRM discipline',
        value: 'Threads must route back',
        description:
          'Important customer threads should route back into company and opportunity context rather than living only in mailbox views.',
      },
      {
        label: 'AI boundary',
        value: 'Summarize and rank',
        description:
          'AI can prioritize, summarize, and suggest next actions, but it cannot change customer or opportunity state on its own.',
      },
    ];
  }

  if (scope === 'subordinate') {
    return [
      {
        label: 'Primary goal',
        value: 'Manager review and coaching',
        description:
          'This surface exists to review subordinate reply quality, handoff delays, and ownership gaps before they become customer risk.',
      },
      {
        label: 'Priority logic',
        value: 'Owner pressure plus customer value',
        description:
          'Threads should rise when reply latency, quote-stage activity, or key-account value makes manager intervention necessary.',
      },
      {
        label: 'CRM discipline',
        value: 'Coach back into customer flow',
        description:
          'A subordinate thread only matters if it returns to customer, opportunity, or team-task execution with a clear owner.',
      },
      {
        label: 'AI boundary',
        value: 'Summarize and route',
        description:
          'AI can highlight blocked sellers and suggest reassignment, but it cannot change ownership or send mail on behalf of a manager.',
      },
    ];
  }

  return [
    {
      label: 'Core reuse',
      value: 'Thread, folder, and channel',
      description:
        'The current workspace stands on top of existing Twenty messageThread, messageFolder, and messageChannel capabilities.',
    },
    {
      label: 'Operating model',
      value: 'Three-column workspace',
      description:
        'Left navigation, central list, and right-side CRM and AI context mirror the target xiaoman work pattern.',
    },
    {
      label: 'Critical rule',
      value: 'Human confirmation',
      description:
        'AI can summarize and draft, but it cannot auto-send or auto-update CRM status.',
    },
    {
      label: 'Target state',
      value: 'Full email application',
      description:
        'Inbox, folders, tracking, advanced search, and customer routing should eventually live inside one operating entry.',
    },
  ];
};

const getInsightPanelCopy = (scope: TradeCrmMailScopeKey) => {
  if (scope === 'campaign') {
    return {
      title: 'Outbound Control',
      description:
        'Keep sender health, unsubscribe discipline, delivery risk, and operator actions visible in the right-side control panel.',
    };
  }

  if (scope === 'customer') {
    return {
      title: 'Customer Communication Context',
      description:
        'Use the right-side panel to keep customer value, latest mail signal, and the next CRM action visible while handling threads.',
    };
  }

  if (scope === 'subordinate') {
    return {
      title: 'Manager Review Context',
      description:
        'The right-side panel should help a manager spot reply pressure, coaching needs, and handoff risk without leaving the mail desk.',
    };
  }

  return {
    title: 'Mailbox Operating Rules',
    description:
      'Keep reply pressure, folder discipline, CRM linkage, and AI guardrails visible while sellers work through the inbox.',
  };
};

export const TradeCrmMailPage = () => {
  const apolloCoreClient = useApolloCoreClient();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedScope = searchParams.get('scope');
  const requestedView = searchParams.get('view');
  const legacyMailPathView =
    requestedScope === null && requestedView === null
      ? location.pathname
          .replace(`${tradeCrmRouteMap.mail}/`, '')
          .trim()
          .toLowerCase() || null
      : null;
  const legacyMailRouteTarget =
    requestedScope === null
      ? getLegacyMailRouteTarget(requestedView ?? legacyMailPathView)
      : null;
  const selectedSendJobId = searchParams.get('jobId') ?? undefined;
  const selectedSendTaskId = searchParams.get('taskId') ?? undefined;
  const selectedPreviewThreadId =
    searchParams.get('previewThreadId') ?? undefined;
  const selectedPreviewCustomerId =
    searchParams.get('previewCustomerId') ?? undefined;
  const sendJobModeFilter = searchParams.get('jobMode') ?? 'all';
  const sendJobStatusFilter = searchParams.get('jobStatus') ?? 'all';
  const mailSearchQuery = searchParams.get('q') ?? '';
  const mailTagFilter = searchParams.get('tag') ?? '';
  const mailReceivedAtFrom = searchParams.get('from') ?? '';
  const mailReceivedAtTo = searchParams.get('to') ?? '';
  const { tr } = useTradeCrmLocale();
  const { copyToClipboard } = useCopyToClipboard();
  const { openEmailThreadInSidePanel } = useOpenEmailThreadInSidePanel();
  const openCreateTaskDrawer = useOpenCreateActivityDrawer({
    activityObjectNameSingular: CoreObjectNameSingular.Task,
  });
  const [audienceEmail, setAudienceEmail] = useState('');
  const [audienceDisplayName, setAudienceDisplayName] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBodyHtml, setTemplateBodyHtml] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [campaignTemplateId, setCampaignTemplateId] = useState('');
  const [campaignScheduledAt, setCampaignScheduledAt] = useState('');
  const [selectedCampaignToQueueId, setSelectedCampaignToQueueId] =
    useState('');
  const [bounceEmail, setBounceEmail] = useState('');
  const [bounceEventType, setBounceEventType] = useState('hard_bounce');
  const [bounceReason, setBounceReason] = useState('');
  const [unsubscribeEmail, setUnsubscribeEmail] = useState('');
  const [unsubscribeSource, setUnsubscribeSource] = useState('manual');
  const [unsubscribeReason, setUnsubscribeReason] = useState('');
  const [selectedSendJobToStartId, setSelectedSendJobToStartId] = useState('');
  const [analyticsEmail, setAnalyticsEmail] = useState('');
  const [analyticsEventType, setAnalyticsEventType] = useState('opened');
  const [analyticsProvider, setAnalyticsProvider] = useState(
    'internal-simulation',
  );
  const [reportExportPreview, setReportExportPreview] = useState('');
  const [reportExportFileName, setReportExportFileName] = useState('');
  const [reportExportRowCount, setReportExportRowCount] = useState(0);
  const [trackingEmail, setTrackingEmail] = useState('');
  const [trackingTargetUrl, setTrackingTargetUrl] = useState(
    'https://example.com',
  );
  const [signedOpenTrackingUrl, setSignedOpenTrackingUrl] = useState('');
  const [signedClickTrackingUrl, setSignedClickTrackingUrl] = useState('');
  const [trackingLinksExpiresAt, setTrackingLinksExpiresAt] = useState('');
  const [providerWebhookFormat, setProviderWebhookFormat] = useState<
    'development-email' | 'resend' | 'ses-sns'
  >('development-email');
  const [activeTagEditorThreadId, setActiveTagEditorThreadId] = useState<
    string | null
  >(null);
  const [threadTagDraft, setThreadTagDraft] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (legacyMailRouteTarget === null) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.set('scope', legacyMailRouteTarget.scope);
    nextSearchParams.set('view', legacyMailRouteTarget.view);

    setSearchParams(nextSearchParams, { replace: true });
  }, [legacyMailRouteTarget, searchParams, setSearchParams]);

  const [
    createDevelopmentEmailAudienceMutation,
    { loading: creatingAudience },
  ] = useMutation(CREATE_DEVELOPMENT_EMAIL_AUDIENCE, {
    refetchQueries: [
      { query: GET_DEVELOPMENT_EMAIL_AUDIENCES },
      { query: GET_DEVELOPMENT_EMAIL_WORKSPACE },
    ],
    awaitRefetchQueries: true,
  });

  const [
    createDevelopmentEmailTemplateMutation,
    { loading: creatingTemplate },
  ] = useMutation(CREATE_DEVELOPMENT_EMAIL_TEMPLATE, {
    refetchQueries: [
      { query: GET_DEVELOPMENT_EMAIL_TEMPLATES },
      { query: GET_DEVELOPMENT_EMAIL_WORKSPACE },
    ],
    awaitRefetchQueries: true,
  });

  const [
    updateTradeCrmMailThreadTagMutation,
    { loading: updatingTradeCrmMailThreadTag },
  ] = useMutation(UPDATE_TRADE_CRM_MAIL_THREAD_TAG);

  const [
    updateTradeCrmMailThreadStateMutation,
    { loading: updatingTradeCrmMailThreadState },
  ] = useMutation(UPDATE_TRADE_CRM_MAIL_THREAD_STATE);
  const [upsertTradeCrmMailThreadTaskLinkMutation] = useMutation(
    UPSERT_TRADE_CRM_MAIL_THREAD_TASK_LINK,
    {
      client: apolloCoreClient,
    },
  );
  const currentScope = getCurrentScope(
    legacyMailRouteTarget?.scope ?? requestedScope,
  );
  const workspace = getTradeCrmMailWorkspace(currentScope);
  const currentViewKey = getCurrentView({
    requestedView: legacyMailRouteTarget?.view ?? requestedView,
    availableViewKeys: workspace.sidebarItems.map((item) => item.key),
    fallbackViewKey: workspace.defaultViewKey,
  });
  const heroSubviewItems = workspace.sidebarItems.slice(
    0,
    currentScope === 'campaign' ? 6 : 5,
  );

  const sidebarItems =
    currentViewKey === 'pending-replies'
      ? [
          {
            label: 'Pending Replies',
            hint: 'Prioritize messages and follow-up actions that still need a seller response.',
            isActive: true,
            to: getTradeCrmScopedViewPath(tradeCrmRouteMap.mail, 'pending-replies'),
          },
          {
            label: 'Task Handoff',
            hint: 'The most stable pending-reply operating surface in phase one is still the task queue.',
            to: AppPath.TasksPage,
          },
          {
            label: 'Customer Context',
            hint: 'Important replies should return to the customer workspace for continued follow-up.',
            to: getTradeCrmCustomerPath('list'),
          },
          {
            label: 'Opportunity Context',
            hint: 'Quote and stage-related replies should return to the opportunity workspace.',
            to: tradeCrmRouteMap.opportunities,
          },
        ]
      : currentViewKey === 'templates'
        ? [
            {
              label: 'Templates',
              hint: 'Templates remain seller-reviewed content assets, not an auto-send surface.',
              isActive: true,
              to: getTradeCrmScopedViewPath(tradeCrmRouteMap.mail, 'templates'),
            },
            {
              label: 'AI Drafts',
              hint: 'AI can propose drafts and edits, but it cannot send critical mail directly.',
            },
            {
              label: 'Customer Context',
              hint: 'Templates should serve real customer and opportunity communication, not a detached mail workflow.',
              to: getTradeCrmCustomerPath('list'),
            },
            {
              label: 'Guardrails',
              hint: 'Critical business emails still require manual confirmation before sending.',
            },
          ]
        : currentViewKey === 'sequences'
          ? [
              {
                label: 'Sequences',
                hint: 'This remains a directional workspace only and is not yet a bulk automation engine.',
                isActive: true,
                to: getTradeCrmScopedViewPath(tradeCrmRouteMap.mail, 'sequences'),
              },
              {
                label: 'Manual Approval',
                hint: 'Any future sequence execution must keep a manual review step.',
              },
              {
                label: 'Email Accounts',
                hint: 'Sequences depend on stable mailbox accounts and sender configuration.',
                to: getSettingsPath(SettingsPath.AccountsEmails),
              },
              {
                label: 'Sending Domains',
                hint: 'Domain readiness comes before sequence scale-up.',
                to: getSettingsPath(SettingsPath.Domains),
              },
            ]
          : currentViewKey === 'tracking'
            ? [
                {
                  label: 'Tracking',
                  hint: 'Review whether replies are being handled and routed back into CRM action loops.',
                  isActive: true,
                  to: getTradeCrmScopedViewPath(tradeCrmRouteMap.mail, 'tracking'),
                },
                {
                  label: 'Customer Follow-up',
                  hint: 'Mail quality is only useful if it improves customer follow-up quality.',
                  to: getTradeCrmCustomerPath('list'),
                },
                {
                  label: 'Opportunity Follow-up',
                  hint: 'Quote-stage mail quality must show up in opportunity progression.',
                  to: tradeCrmRouteMap.opportunities,
                },
                {
                  label: 'Task Handoff',
                  hint: 'If mail signals do not return to tasks, the follow-up loop stays incomplete.',
                  to: AppPath.TasksPage,
                },
              ]
            : currentViewKey === 'sent'
              ? [
                  {
                    label: 'Sent',
                    hint: 'Review whether important outbound messages are linked back into CRM context.',
                    isActive: true,
                    to: getTradeCrmScopedViewPath(tradeCrmRouteMap.mail, 'sent'),
                  },
                  {
                    label: 'Customer Context',
                    hint: 'Important sent mail should continue inside the customer workspace.',
                    to: getTradeCrmCustomerPath('list'),
                  },
                  {
                    label: 'Opportunity Context',
                    hint: 'Commercial quote communication should remain visible inside opportunity workflow.',
                    to: tradeCrmRouteMap.opportunities,
                  },
                  {
                    label: 'AI Summary',
                    hint: 'AI can summarize sent communication, but it cannot mutate CRM state.',
                  },
                ]
              : [
                  {
                    label: 'Inbox',
                    hint: 'Use real mailbox accounts and CRM entry paths instead of a fake inbox shell.',
                    isActive: true,
                    to: getTradeCrmScopedViewPath(tradeCrmRouteMap.mail, 'inbox'),
                  },
                  {
                    label: 'Email Accounts',
                    hint: 'Confirm mailbox connection and sync stability first.',
                    to: getSettingsPath(SettingsPath.AccountsEmails),
                  },
                  {
                    label: 'Sending Domains',
                    hint: 'Domain and sender readiness are prerequisites for outbound work.',
                    to: getSettingsPath(SettingsPath.Domains),
                  },
                  {
                    label: 'CRM Linkage',
                    hint: 'Important threads should return to customer and opportunity context.',
                    to: getTradeCrmCustomerPath('list'),
                  },
                ];

  const cards =
    currentViewKey === 'pending-replies'
      ? [
          {
            title: 'Need Reply / Follow-up',
            description:
              'Use the existing task queue as the current reliable follow-up surface until a dedicated mail reply workspace is built.',
            href: AppPath.TasksPage,
            actionLabel: 'Open pending-reply tasks',
          },
          {
            title: 'Customer-linked Replies',
            description:
              'Pending reply work should return to the customer workspace so communication turns into visible relationship follow-up.',
            href: getTradeCrmCustomerPath('list'),
            actionLabel: 'Open customers workspace',
          },
          {
            title: 'Opportunity Replies',
            description:
              'Quote and stage-related replies should return to the opportunity workspace instead of staying isolated inside mail.',
            href: tradeCrmRouteMap.opportunities,
            actionLabel: 'Open opportunities workspace',
          },
          {
            title: 'AI Reply Draft',
            description:
              'AI can summarize thread context and draft a reply, but sending still requires explicit seller confirmation.',
          },
        ]
      : currentViewKey === 'sent'
        ? [
            {
              title: 'Sent Communication',
              description:
                'Use the sent workspace to confirm whether key outbound communication continues into customer and opportunity actions.',
            },
            {
              title: 'Customer-linked Communication',
              description:
                'Use the customer workspace as the operating base after important outbound mail is sent.',
              href: getTradeCrmCustomerPath('list'),
              actionLabel: 'Open customers workspace',
            },
            {
              title: 'Quote-stage Communication',
              description:
                'Quote-stage outbound mail should stay linked to the opportunity workflow so commercial movement remains visible.',
              href: tradeCrmRouteMap.opportunities,
              actionLabel: 'Open opportunities workspace',
            },
            {
              title: 'AI Summary',
              description:
                'AI can summarize what was sent and suggest next steps, but it cannot auto-send or auto-update status.',
            },
          ]
        : currentViewKey === 'templates'
          ? [
              {
                title: 'Templates',
                description:
                  'Templates are seller-reviewed content assets, not an automated delivery engine.',
              },
              {
                title: 'AI Draft Guardrail',
                description:
                  'AI may propose drafts and edits, but it cannot bypass manual confirmation for critical business mail.',
              },
              {
                title: 'Customer Context',
                description:
                  'Template content must serve real customer communication instead of a detached marketing flow.',
                href: getTradeCrmCustomerPath('list'),
                actionLabel: 'Open customers workspace',
              },
              {
                title: 'Opportunity Context',
                description:
                  'Quote, follow-up, and stage-specific templates should stay tied to opportunity actions.',
                href: tradeCrmRouteMap.opportunities,
                actionLabel: 'Open opportunities workspace',
              },
            ]
          : currentViewKey === 'sequences'
            ? [
                {
                  title: 'Sequences',
                  description:
                    'Templates, sequences, and tracking remain later-phase mail capabilities. They should stay manual and review-driven, not auto-send driven.',
                },
                {
                  title: 'Email Accounts',
                  description:
                    'The first prerequisite for sequences is reliable mailbox account connection and sync, not more automation.',
                  href: getSettingsPath(SettingsPath.AccountsEmails),
                  actionLabel: 'Open email accounts',
                },
                {
                  title: 'Sending Domains',
                  description:
                    'Domain and sender readiness must be confirmed before sequence expansion.',
                  href: getSettingsPath(SettingsPath.Domains),
                  actionLabel: 'Open domain settings',
                },
                {
                  title: 'Manual Review',
                  description:
                    'Even when sequences are extended later, they must keep manual approval and CRM context guardrails.',
                },
              ]
            : currentViewKey === 'tracking'
              ? [
                  {
                    title: 'Tracking Analysis',
                    description:
                      'Tracking should first map back to reply handling, task closure, and CRM linkage quality instead of becoming a detached mail BI panel.',
                  },
                  {
                    title: 'Task-linked Follow-up',
                    description:
                      'If tracking signals do not return to the task queue, the real follow-up loop remains incomplete.',
                    href: AppPath.TasksPage,
                    actionLabel: 'Open task queue',
                  },
                  {
                    title: 'Customer-linked Communication',
                    description:
                      'The customer workspace is the real place to confirm whether mail activity becomes customer operating progress.',
                    href: getTradeCrmCustomerPath('list'),
                    actionLabel: 'Open customers workspace',
                  },
                  {
                    title: 'Opportunity-linked Communication',
                    description:
                      'Quote and progression-related tracking should ultimately be reviewed from the opportunity workspace.',
                    href: tradeCrmRouteMap.opportunities,
                    actionLabel: 'Open opportunities workspace',
                  },
                ]
              : [
                  {
                    title: 'Email Accounts',
                    description:
                      'Connect and review synced mailboxes from the real account settings page instead of using a fake inbox shell.',
                    href: getSettingsPath(SettingsPath.AccountsEmails),
                    actionLabel: 'Open email accounts',
                  },
                  {
                    title: 'Sending Domains',
                    description:
                      'Manage emailing domains and sender readiness from the existing settings flow before scaling outbound communication.',
                    href: getSettingsPath(SettingsPath.Domains),
                    actionLabel: 'Open domain settings',
                  },
                  {
                    title: 'Need Reply / Follow-up',
                    description:
                      'Use the existing task queue as the current reliable follow-up surface until a dedicated mail reply workspace is built.',
                    href: AppPath.TasksPage,
                    actionLabel: 'Open pending-reply tasks',
                  },
                  {
                    title: 'CRM-linked Communication',
                    description:
                      'Use customer and opportunity workspaces as the current entry points for email-thread context instead of splitting communication away from CRM records.',
                    href: getTradeCrmCustomerPath('list'),
                    actionLabel: 'Open customers workspace',
                  },
                  {
                    title: 'Quote-stage Communication',
                    description:
                      'Quote follow-up and reply risk should remain visible from the opportunity workspace until a fuller mail workbench exists.',
                    href: tradeCrmRouteMap.opportunities,
                    actionLabel: 'Open opportunities workspace',
                  },
                  {
                    title: 'AI Reply Summary',
                    description:
                      'The AI dock on this page uses mail context to summarize reply pressure, surface CRM linkage gaps, and point the seller to the threads that matter first.',
                  },
                  {
                    title: 'AI Draft Guardrail',
                    description:
                      'AI can draft a follow-up email or quote-stage reply, but it cannot send mail or change CRM status without explicit seller confirmation.',
                  },
                  {
                    title: 'Templates and Sequences',
                    description:
                      'Templates, sequences, and tracking remain later-phase mail capabilities. They stay manual and review-driven in phase one.',
                    href: getTradeCrmScopedViewPath(tradeCrmRouteMap.mail, 'templates'),
                    actionLabel: 'Switch to templates',
                  },
                ];

  const [
    createDevelopmentEmailCampaignMutation,
    { loading: creatingCampaign },
  ] = useMutation(CREATE_DEVELOPMENT_EMAIL_CAMPAIGN, {
    refetchQueries: [
      { query: GET_DEVELOPMENT_EMAIL_CAMPAIGNS },
      { query: GET_DEVELOPMENT_EMAIL_WORKSPACE },
    ],
    awaitRefetchQueries: true,
  });
  const [queueDevelopmentEmailCampaignMutation, { loading: queueingCampaign }] =
    useMutation(QUEUE_DEVELOPMENT_EMAIL_CAMPAIGN, {
      refetchQueries: [
        { query: GET_DEVELOPMENT_EMAIL_CAMPAIGNS },
        { query: GET_DEVELOPMENT_EMAIL_SEND_JOBS },
        { query: GET_DEVELOPMENT_EMAIL_WORKSPACE },
      ],
      awaitRefetchQueries: true,
    });
  const [
    recordDevelopmentEmailBounceEventMutation,
    { loading: recordingBounceEvent },
  ] = useMutation(RECORD_DEVELOPMENT_EMAIL_BOUNCE_EVENT, {
    refetchQueries: [
      { query: GET_DEVELOPMENT_EMAIL_BOUNCE_EVENTS },
      { query: GET_DEVELOPMENT_EMAIL_AUDIENCES },
      { query: GET_DEVELOPMENT_EMAIL_WORKSPACE },
    ],
    awaitRefetchQueries: true,
  });
  const [
    recordDevelopmentEmailUnsubscribeMutation,
    { loading: recordingUnsubscribe },
  ] = useMutation(RECORD_DEVELOPMENT_EMAIL_UNSUBSCRIBE, {
    refetchQueries: [
      { query: GET_DEVELOPMENT_EMAIL_UNSUBSCRIBES },
      { query: GET_DEVELOPMENT_EMAIL_AUDIENCES },
      { query: GET_DEVELOPMENT_EMAIL_WORKSPACE },
    ],
    awaitRefetchQueries: true,
  });
  const [recordDevelopmentEmailEventMutation, { loading: recordingEvent }] =
    useMutation(RECORD_DEVELOPMENT_EMAIL_EVENT, {
      refetchQueries: [
        { query: GET_DEVELOPMENT_EMAIL_ANALYTICS },
        { query: GET_DEVELOPMENT_EMAIL_WORKSPACE },
      ],
      awaitRefetchQueries: true,
    });
  const [
    getDevelopmentEmailReportExport,
    {
      loading: loadingReportExport,
      data: developmentEmailReportExportData,
    },
  ] = useLazyQuery<{
    getDevelopmentEmailReportExport: {
      fileName: string;
      csvContent: string;
      rowCount: number;
    };
  }>(GET_DEVELOPMENT_EMAIL_REPORT_EXPORT, {
    fetchPolicy: 'network-only',
  });
  const [
    getDevelopmentEmailTrackingLinks,
    {
      loading: loadingTrackingLinks,
      data: developmentEmailTrackingLinksData,
    },
  ] = useLazyQuery<{
    getDevelopmentEmailTrackingLinks: {
      openTrackingUrl: string;
      clickTrackingUrl: string;
      expiresAt: string;
    };
  }>(GET_DEVELOPMENT_EMAIL_TRACKING_LINKS, {
    fetchPolicy: 'network-only',
  });
  useEffect(() => {
    if (!developmentEmailReportExportData) {
      return;
    }

    setReportExportFileName(
      developmentEmailReportExportData.getDevelopmentEmailReportExport.fileName,
    );
    setReportExportPreview(
      developmentEmailReportExportData.getDevelopmentEmailReportExport.csvContent,
    );
    setReportExportRowCount(
      developmentEmailReportExportData.getDevelopmentEmailReportExport.rowCount,
    );
  }, [developmentEmailReportExportData]);
  useEffect(() => {
    if (!developmentEmailTrackingLinksData) {
      return;
    }

    setSignedOpenTrackingUrl(
      developmentEmailTrackingLinksData.getDevelopmentEmailTrackingLinks.openTrackingUrl,
    );
    setSignedClickTrackingUrl(
      developmentEmailTrackingLinksData.getDevelopmentEmailTrackingLinks.clickTrackingUrl,
    );
    setTrackingLinksExpiresAt(
      developmentEmailTrackingLinksData.getDevelopmentEmailTrackingLinks.expiresAt,
    );
  }, [developmentEmailTrackingLinksData]);
  const [startDevelopmentEmailSendJobMutation, { loading: startingSendJob }] =
    useMutation(START_DEVELOPMENT_EMAIL_SEND_JOB, {
      refetchQueries: [
        { query: GET_DEVELOPMENT_EMAIL_SEND_JOBS },
        {
          query: GET_DEVELOPMENT_EMAIL_SEND_TASKS,
          variables: { sendJobId: selectedSendJobToStartId || null },
        },
        { query: GET_DEVELOPMENT_EMAIL_WORKSPACE },
      ],
      awaitRefetchQueries: true,
    });
  const [
    executeDevelopmentEmailSendJobMutation,
    { loading: executingSendJob },
  ] = useMutation(EXECUTE_DEVELOPMENT_EMAIL_SEND_JOB, {
    refetchQueries: [
      { query: GET_DEVELOPMENT_EMAIL_SEND_JOBS },
      {
        query: GET_DEVELOPMENT_EMAIL_SEND_TASKS,
        variables: {
          sendJobId: (selectedSendJobId ?? selectedSendJobToStartId) || null,
        },
      },
      { query: GET_DEVELOPMENT_EMAIL_WORKSPACE },
    ],
      awaitRefetchQueries: true,
    });
  const { data: developmentEmailTemplatesData } = useQuery<{
    getDevelopmentEmailTemplates: Array<{
      id: string;
      name: string;
      subject: string;
      status: string;
      version: number;
    }>;
  }>(GET_DEVELOPMENT_EMAIL_TEMPLATES, {
    skip: currentScope !== 'campaign' || currentViewKey !== 'campaigns',
  });
  const { data: developmentEmailCampaignsData } = useQuery<{
    getDevelopmentEmailCampaigns: Array<{
      id: string;
      name: string;
      templateId: string | null;
      status: string;
      scheduledAt: string | null;
    }>;
  }>(GET_DEVELOPMENT_EMAIL_CAMPAIGNS, {
    skip: currentScope !== 'campaign' || currentViewKey !== 'campaigns',
  });
  const { data: developmentEmailSendJobsData } = useQuery<{
    getDevelopmentEmailSendJobs: Array<{
      id: string;
      campaignId: string | null;
      status: string;
      executionMode: string | null;
      senderPoolMode: string | null;
      queuedCount: number;
      sentCount: number;
      failedCount: number;
      startedAt: string | null;
      completedAt: string | null;
      createdAt: string;
    }>;
  }>(GET_DEVELOPMENT_EMAIL_SEND_JOBS, {
    skip: currentScope !== 'campaign' || currentViewKey !== 'jobs',
  });
  const { data: developmentEmailSendJobSummaryData } = useQuery<{
    getDevelopmentEmailSendJobSummary: {
      metrics: Array<{
        label: string;
        value: string;
        description: string;
      }>;
      listItems: Array<{
        id: string;
        primary: string;
        secondary: string;
        tertiary: string;
        meta: string;
        status: string;
      }>;
    };
  }>(GET_DEVELOPMENT_EMAIL_SEND_JOB_SUMMARY, {
    variables: {
      sendJobId: selectedSendJobId ?? selectedSendJobToStartId,
    },
    skip:
      currentScope !== 'campaign' ||
      currentViewKey !== 'jobs' ||
      !(selectedSendJobId ?? selectedSendJobToStartId),
  });
  const currentViewItem =
    workspace.sidebarItems.find((item) => item.key === currentViewKey) ??
    workspace.sidebarItems[0];
  const sidebarSections = groupSidebarItemsBySection(workspace.sidebarItems);
  const runtimeBaseUrl =
    typeof window !== 'undefined' ? window.location.origin : '';
  const openTrackingUrl = signedOpenTrackingUrl;
  const clickTrackingUrl = signedClickTrackingUrl;
  const providerWebhookUrl = `${runtimeBaseUrl}/development-email/webhook/provider`;
  const providerWebhookHeadersTemplate = [
    'x-development-email-provider-format: development-email | resend | ses-sns',
    'x-development-email-webhook-secret: DEVELOPMENT_EMAIL_WEBHOOK_SECRET',
    'or',
    'x-development-email-webhook-timestamp: 2026-04-16T12:00:00.000Z',
    'x-development-email-webhook-signature: <sha256-hmac>',
    'resend alternative:',
    'svix-id: <event-id>',
    'svix-timestamp: <unix-or-iso-timestamp-from-provider>',
    'svix-signature: v1,<provider-signature>',
  ].join('\n');
  const providerWebhookExamples = {
    'development-email': JSON.stringify(
      {
        workspaceId: 'workspace-id',
        eventType: 'delivered',
        email: 'buyer@example.com',
        sendJobId: selectedSendJobId ?? 'send-job-id',
        sendTaskId: 'send-task-id',
        provider: analyticsProvider || 'ses',
        providerMessageId: 'provider-message-id',
        occurredAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    resend: JSON.stringify(
      {
        type: 'email.delivered',
        created_at: new Date().toISOString(),
        data: {
          email_id: 're_123456789',
          to: ['buyer@example.com'],
          from: 'sales@example.com',
          subject: 'April quote follow-up',
          workspaceId: 'workspace-id',
          sendJobId: selectedSendJobId ?? 'send-job-id',
          sendTaskId: 'send-task-id',
          campaignId: 'campaign-id',
        },
      },
      null,
      2,
    ),
    'ses-sns': JSON.stringify(
      {
        Type: 'Notification',
        Message: JSON.stringify({
          notificationType: 'Delivery',
          mail: {
            timestamp: new Date().toISOString(),
            messageId: '01020123456789abcdef',
            destination: ['buyer@example.com'],
            commonHeaders: {
              'X-Workspace-Id': 'workspace-id',
              'X-Campaign-Id': 'campaign-id',
              'X-Send-Job-Id': selectedSendJobId ?? 'send-job-id',
              'X-Send-Task-Id': 'send-task-id',
            },
          },
        }),
      },
      null,
      2,
    ),
  } as const;
  const providerWebhookExample = providerWebhookExamples[providerWebhookFormat];
  const providerWebhookCurlExample = [
    `curl -X POST "${providerWebhookUrl}" \\`,
    '  -H "Content-Type: application/json" \\',
    `  -H "x-development-email-provider-format: ${providerWebhookFormat}" \\`,
    '  -H "x-development-email-webhook-secret: DEVELOPMENT_EMAIL_WEBHOOK_SECRET" \\',
    ...(providerWebhookFormat === 'resend'
      ? [
          '  -H "svix-id: <event-id>" \\',
          '  -H "svix-timestamp: <provider-timestamp>" \\',
          '  -H "svix-signature: v1,<provider-signature>" \\',
        ]
      : []),
    `  -d '${providerWebhookExample.replace(/'/g, "'\\''")}'`,
  ].join('\n');
  const providerWebhookSignatureNotes =
    providerWebhookFormat === 'resend'
      ? [
          'Resend signature path',
          '1. Use the raw request body exactly as delivered by Resend.',
          '2. Send svix-id, svix-timestamp, and svix-signature headers.',
          '3. Server validates against RESEND_WEBHOOK_SECRET.',
        ].join('\n')
      : providerWebhookFormat === 'ses-sns'
        ? [
            'SES / SNS signature path',
            '1. Current app normalizes ses-sns payload format.',
            '2. Full SNS certificate-chain verification is not wired yet.',
            '3. Use workspace headers in commonHeaders for correlation.',
          ].join('\n')
        : [
            'Development-email signature path',
            '1. Use shared secret or timestamp + HMAC headers.',
            '2. Payload must match the normalized development-email shape.',
            '3. occurredAt should be an ISO timestamp.',
          ].join('\n');
  const availableTemplates =
    developmentEmailTemplatesData?.getDevelopmentEmailTemplates ?? [];
  const availableCampaigns =
    developmentEmailCampaignsData?.getDevelopmentEmailCampaigns ?? [];
  const availableSendJobs =
    developmentEmailSendJobsData?.getDevelopmentEmailSendJobs ?? [];
  const {
    campaignWorkspaceHealthItems,
    campaignWorkspacePrimaryItems,
    inboxMetrics,
    loading,
    recentThreads,
    rootFolders,
    sendTasks,
  } = useTradeCrmMailWorkspaceData({
    scope: currentScope,
    view: currentViewKey,
    selectedSendJobId,
    searchQuery: currentScope === 'mail' ? mailSearchQuery : undefined,
    tagFilter: currentScope === 'mail' ? mailTagFilter : undefined,
    receivedAtFrom: currentScope === 'mail' ? mailReceivedAtFrom : undefined,
    receivedAtTo: currentScope === 'mail' ? mailReceivedAtTo : undefined,
  });
  const renderedMetrics =
    inboxMetrics.length > 0 ? inboxMetrics : workspace.metrics;
  const shouldUseWorkspaceListFallback =
    currentScope === 'mail' &&
    ![
      'pending-replies',
      'templates',
      'sequences',
      'sender-pool',
      'campaigns',
      'jobs',
      'bounces',
      'unsubscribes',
      'analytics',
      'reports',
    ].includes(currentViewKey);
  const renderedListItems =
    recentThreads.length > 0
      ? recentThreads
      : shouldUseWorkspaceListFallback
        ? workspace.listItems
        : [];
  const filteredRenderedListItems =
    currentScope === 'campaign' && currentViewKey === 'jobs'
      ? renderedListItems.filter((item) => {
          const matchesMode =
            sendJobModeFilter === 'all' ||
            item.senderPoolMode === sendJobModeFilter;
          const matchesStatus =
            sendJobStatusFilter === 'all' ||
            item.status === sendJobStatusFilter;

          return matchesMode && matchesStatus;
        })
      : renderedListItems;
  const filteredAvailableSendJobs =
    currentScope === 'campaign' && currentViewKey === 'jobs'
      ? availableSendJobs.filter((sendJob) => {
          const matchesMode =
            sendJobModeFilter === 'all' ||
            sendJob.senderPoolMode === sendJobModeFilter;
          const matchesStatus =
            sendJobStatusFilter === 'all' ||
            sendJob.status === sendJobStatusFilter;

          return matchesMode && matchesStatus;
        })
      : availableSendJobs;
  const filteredSendJobCount =
    currentScope === 'campaign' && currentViewKey === 'jobs'
      ? filteredAvailableSendJobs.length
      : availableSendJobs.length;
  const isMailboxWorkbenchView =
    currentScope === 'mail' &&
    ['inbox', 'sent', 'unread', 'tagged', 'search'].includes(
      currentViewKey,
    );
  const isPendingActionQueueView =
    currentScope === 'mail' && currentViewKey === 'pending';
  const pendingThreadIds = isPendingActionQueueView
    ? filteredRenderedListItems
        .map((item) => item.threadId)
        .filter((threadId): threadId is string => typeof threadId === 'string')
    : [];
  const { data: pendingThreadTaskLinksData } = useQuery<{
    getTradeCrmMailThreadTaskLinks: TradeCrmMailThreadTaskLinkRecord[];
  }>(GET_TRADE_CRM_MAIL_THREAD_TASK_LINKS, {
    client: apolloCoreClient,
    variables: {
      threadIds: pendingThreadIds,
    },
    skip: pendingThreadIds.length === 0,
  });
  const pendingThreadTaskLinksByThreadId = useMemo(
    () =>
      (
        pendingThreadTaskLinksData?.getTradeCrmMailThreadTaskLinks ?? []
      ).reduce<Record<string, string>>((accumulator, threadTaskLink) => {
        accumulator[threadTaskLink.threadId] = threadTaskLink.taskId;

        return accumulator;
      }, {}),
    [pendingThreadTaskLinksData],
  );
  const isSubordinateWorkbenchView =
    currentScope === 'subordinate' &&
    ['recent', 'focus', 'pending-replies', 'long-tail'].includes(
      currentViewKey,
    );
  const isCustomerWorkbenchView =
    (currentScope === 'customer' &&
      [
        'recent',
        'focus',
        'cooperating',
        'potential',
        'intent',
        'key',
        'normal',
        'long-tail',
      ].includes(currentViewKey)) ||
    isSubordinateWorkbenchView;
  const isFolderManagementView =
    currentScope === 'mail' && currentViewKey === 'folders';
  const hasNoFilteredSendJobs =
    currentScope === 'campaign' &&
    currentViewKey === 'jobs' &&
    filteredAvailableSendJobs.length === 0;
  const senderHealthGroups = Object.entries(
    campaignWorkspaceHealthItems.reduce<
      Record<string, typeof campaignWorkspaceHealthItems>
    >((accumulator, item) => {
      const providerLabel = item.secondary.startsWith('Provider ')
        ? item.secondary.slice('Provider '.length)
        : 'unknown';
      const providerKey =
        providerLabel.trim().length > 0 ? providerLabel.trim() : 'unknown';

      accumulator[providerKey] = [...(accumulator[providerKey] ?? []), item];

      return accumulator;
    }, {}),
  ).sort(([leftProvider], [rightProvider]) =>
    leftProvider.localeCompare(rightProvider),
  );
  const selectedSendJobSummary =
    developmentEmailSendJobSummaryData?.getDevelopmentEmailSendJobSummary;
  const selectedSendJobExecutionMode =
    selectedSendJobSummary?.metrics.find(
      (metric) => metric.label === 'Execution mode',
    )?.value ?? 'not recorded';
  const selectedSendJobSenderPoolMode =
    selectedSendJobSummary?.metrics.find(
      (metric) => metric.label === 'Sender pool mode',
    )?.value ?? 'not recorded';
  const selectedSendJobExecutableSenders =
    selectedSendJobSummary?.metrics.find(
      (metric) => metric.label === 'Executable senders',
    )?.value ?? '0';
  const selectedSendJobSkippedSenders =
    selectedSendJobSummary?.metrics.find(
      (metric) => metric.label === 'Skipped senders',
    )?.value ?? '0';
  const isFallbackOnlySendJob =
    selectedSendJobSenderPoolMode === 'fallback-only' ||
    selectedSendJobExecutionMode === 'internal-simulation-fallback';
  const selectedSendJobSummaryText = selectedSendJobSummary
    ? [
        ...(selectedSendJobId ? [`sendJobId=${selectedSendJobId}`] : []),
        ...selectedSendJobSummary.metrics.map(
          (metric) => `${metric.label}=${metric.value}`,
        ),
        ...selectedSendJobSummary.listItems.map(
          (item) => `${item.primary} | ${item.secondary} | ${item.status}`,
        ),
      ].join('\n')
    : '';
  const senderPoolModeMetric =
    renderedMetrics.find((metric) => metric.label === 'Sender pool mode')
      ?.value ?? 'not recorded';
  const executableSendersMetric =
    renderedMetrics.find((metric) => metric.label === 'Executable senders')
      ?.value ?? '0';
  const skippedSendersMetric =
    renderedMetrics.find((metric) => metric.label === 'Skipped senders')
      ?.value ?? '0';
  const healthySenderChannelsMetric =
    renderedMetrics.find((metric) => metric.label === 'Healthy sender channels')
      ?.value ?? '0/0';
  const senderPoolAccountsPath = getSettingsPath(SettingsPath.AccountsEmails);
  const senderPoolDomainsPath = getSettingsPath(SettingsPath.Domains);
  const senderPoolJobsPath = getTradeCrmMailPath({
    scope: 'campaign',
    view: 'jobs',
  });
  const composeEntryPath =
    currentScope === 'campaign'
      ? getTradeCrmMailPath({ scope: 'campaign', view: 'campaigns' })
      : getTradeCrmMailPath({ scope: 'mail', view: 'drafts' });
  const composeEntryLabel =
    currentScope === 'campaign' ? tr('新建开发信') : tr('写信');
  const getSenderHealthActions = ({
    secondary,
    reasonCode,
  }: {
    secondary: string;
    reasonCode: string | null;
  }) => {
    const providerLabel = secondary.startsWith('Provider ')
      ? secondary.slice('Provider '.length).trim().toLowerCase()
      : 'unknown';

    if (reasonCode === 'missing_google_refresh_token') {
      return [
        { label: tr('Reconnect Google token'), to: senderPoolAccountsPath },
      ];
    }

    if (reasonCode === 'missing_microsoft_access_token') {
      return [
        { label: tr('Reconnect Microsoft token'), to: senderPoolAccountsPath },
      ];
    }

    if (reasonCode === 'missing_smtp_password') {
      return [
        { label: tr('Update SMTP password'), to: senderPoolDomainsPath },
        { label: tr('Open email accounts'), to: senderPoolAccountsPath },
      ];
    }

    if (reasonCode === 'missing_smtp_host') {
      return [
        { label: tr('Update SMTP host'), to: senderPoolDomainsPath },
        { label: tr('Open email accounts'), to: senderPoolAccountsPath },
      ];
    }

    if (reasonCode === 'missing_smtp_port') {
      return [
        { label: tr('Update SMTP port'), to: senderPoolDomainsPath },
        { label: tr('Open email accounts'), to: senderPoolAccountsPath },
      ];
    }

    if (reasonCode === 'missing_smtp_settings') {
      return [
        { label: tr('Configure SMTP settings'), to: senderPoolDomainsPath },
        { label: tr('Open email accounts'), to: senderPoolAccountsPath },
      ];
    }

    if (reasonCode === 'unsupported_provider_live_delivery') {
      return [{ label: tr('Open email accounts'), to: senderPoolAccountsPath }];
    }

    if (providerLabel === 'imap_smtp_caldav') {
      return [
        { label: tr('Open SMTP settings'), to: senderPoolDomainsPath },
        { label: tr('Open email accounts'), to: senderPoolAccountsPath },
      ];
    }

    if (providerLabel === 'google') {
      return [{ label: tr('Reauthorize Google'), to: senderPoolAccountsPath }];
    }

    if (providerLabel === 'microsoft') {
      return [
        { label: tr('Reauthorize Microsoft'), to: senderPoolAccountsPath },
      ];
    }

    return [{ label: tr('Open email accounts'), to: senderPoolAccountsPath }];
  };
  const selectedSendTask =
    sendTasks.find((sendTask) => sendTask.id === selectedSendTaskId) ??
    sendTasks[0];
  const selectedMailboxPreviewItem =
    (isMailboxWorkbenchView
      ? filteredRenderedListItems.find(
          (item) => item.threadId === selectedPreviewThreadId,
        )
      : null) ??
    (isMailboxWorkbenchView ? filteredRenderedListItems[0] : undefined);
  const selectedPendingPreviewItem =
    (isPendingActionQueueView
      ? filteredRenderedListItems.find(
          (item) => item.threadId === selectedPreviewThreadId,
        )
      : null) ??
    (isPendingActionQueueView ? filteredRenderedListItems[0] : undefined);
  const selectedCustomerPreviewItem =
    (isCustomerWorkbenchView
      ? filteredRenderedListItems.find(
          (item) => item.id === selectedPreviewCustomerId,
        )
      : null) ??
    (isCustomerWorkbenchView ? filteredRenderedListItems[0] : undefined);
  const hasSelectedMailboxThread = Boolean(
    selectedMailboxPreviewItem?.threadId,
  );
  const selectedMailboxHasTags =
    (selectedMailboxPreviewItem?.tags?.length ?? 0) > 0;
  const mailboxSelectedCustomerName =
    selectedMailboxPreviewItem?.primary ?? '未识别客户';
  const mailboxSelectedThreadTitle =
    selectedMailboxPreviewItem?.secondary ?? '当前没有选中线程';
  const mailboxSelectedThreadSummary =
    selectedMailboxPreviewItem?.tertiary ??
    '当前筛选条件下没有可预览的邮件线程。';
  const mailboxSelectedThreadMeta =
    selectedMailboxPreviewItem?.meta ?? '暂无往来记录';
  const mailboxSelectedAssistantSuggestions = hasSelectedMailboxThread
    ? [
        selectedMailboxPreviewItem?.status === 'Create customer'
          ? '当前线程未形成客户档案，建议优先创建客户并补齐负责人。'
          : '当前线程已有 CRM 上下文，可以直接回到客户或商机链路处理。',
        currentViewKey === 'pending'
          ? '该线程已经进入待处理池，下一步适合补标签、分配负责人或完成回复。'
          : '建议先判断是否需要进入待处理池，再决定回复、归档或转标签。',
        selectedMailboxHasTags
          ? '线程已有标签，适合继续做规则归档和客户分层。'
          : '线程尚未添加标签，建议补充业务标签以便后续搜索和自动化。',
      ]
    : ['当前没有可操作线程，请先从左侧列表选择一封邮件。'];
  const customerSelectedName =
    selectedCustomerPreviewItem?.primary ?? '当前没有选中客户';
  const customerSelectedLatestThread =
    selectedCustomerPreviewItem?.secondary ?? '暂无往来线程';
  const customerSelectedSummary =
    selectedCustomerPreviewItem?.tertiary ?? '当前分组下没有可预览的客户邮件。';
  const customerSelectedMeta =
    selectedCustomerPreviewItem?.meta ?? '暂无最近活动';
  const customerSelectedThreadId = selectedCustomerPreviewItem?.threadId ?? null;
  const customerSelectedSuggestions = selectedCustomerPreviewItem
    ? [
        '优先判断当前客户是否需要回到商机、报价或样品推进链路。',
        '结合最近一封邮件和客户分组，决定是否要立即提醒销售跟进。',
        '如果客户持续活跃但未推进，建议补任务、负责人和标签。',
      ]
    : ['当前没有可操作客户，请先从列表选择一个客户。'];
  const pendingSelectedCustomerName =
    selectedPendingPreviewItem?.primary ?? '当前没有选中待处理线程';
  const pendingSelectedThreadTitle =
    selectedPendingPreviewItem?.secondary ?? '暂无待处理线程';
  const pendingSelectedThreadSummary =
    selectedPendingPreviewItem?.tertiary ??
    '当前筛选条件下没有待处理邮件。';
  const pendingSelectedThreadMeta =
    selectedPendingPreviewItem?.meta ?? '暂无待处理记录';
  const pendingSelectedReason =
    selectedPendingPreviewItem?.pendingReason ?? 'Manual review';
  const pendingSelectedUpdatedAt =
    selectedPendingPreviewItem?.pendingUpdatedAt
      ? formatToHumanReadableDate(selectedPendingPreviewItem.pendingUpdatedAt)
      : 'not recorded';
  const pendingPrimaryActionPath =
    selectedPendingPreviewItem?.primaryRecordHref ?? tradeCrmRouteMap.customers;
  const pendingPrimaryActionLabel =
    selectedPendingPreviewItem?.primaryRecordLabel ?? '进入客户处理';
  const pendingSecondaryActionPath =
    selectedPendingPreviewItem?.secondaryRecordHref ??
    tradeCrmRouteMap.opportunities;
  const pendingSecondaryActionLabel =
    selectedPendingPreviewItem?.secondaryRecordLabel ?? '进入商机处理';
  const pendingSuggestedDestination = [
    selectedPendingPreviewItem?.primaryRecordLabel,
    selectedPendingPreviewItem?.secondaryRecordLabel,
    'Tasks',
  ]
    .filter((label): label is string => Boolean(label))
    .join(' / ');
  const pendingSelectedSuggestions = selectedPendingPreviewItem
    ? [
        '先打开线程确认回复责任，再决定是否清除待处理或继续保留。',
        '对未挂客户或商机的线程，优先回到 Customers 或 Opportunities 补业务上下文。',
        '如果线程已过卖家可控范围，就把下一步动作转回任务队列和负责人。',
      ]
    : ['当前没有待处理线程，请先从待处理列表选择一项。'];
  const pendingTaskTargetableObject: ActivityTargetableObject | null =
    selectedPendingPreviewItem?.opportunityRecordId
      ? {
          id: selectedPendingPreviewItem.opportunityRecordId,
          targetObjectNameSingular: CoreObjectNameSingular.Opportunity,
        }
      : selectedPendingPreviewItem?.customerRecordId
        ? {
            id: selectedPendingPreviewItem.customerRecordId,
            targetObjectNameSingular: CoreObjectNameSingular.Company,
          }
        : selectedPendingPreviewItem?.personRecordId
          ? {
              id: selectedPendingPreviewItem.personRecordId,
              targetObjectNameSingular: CoreObjectNameSingular.Person,
            }
          : null;
  const { records: pendingTaskRecords } = useFindManyRecords<GenericTaskRecord>({
    objectNameSingular: CoreObjectNameSingular.Task,
    limit: 100,
    skip:
      !isPendingActionQueueView || pendingTaskTargetableObject === null,
  });
  const pendingTaskRecordSource = useMemo(
    () =>
      createTradeCrmRecordSource({
        href: getTradeCrmMailPath({
          scope: currentScope,
          view: currentViewKey,
        }),
        workspaceKey: 'mail',
        workspaceLabel: 'Mail',
        viewKey: currentViewKey,
        viewLabel: currentViewItem.label,
        trail: selectedPendingPreviewItem?.threadId
          ? `thread:${selectedPendingPreviewItem.threadId}`
          : undefined,
      }),
    [
      currentScope,
      currentViewItem.label,
      currentViewKey,
      selectedPendingPreviewItem?.threadId,
    ],
  );
  const exactPendingTaskRecordId = selectedPendingPreviewItem?.threadId
    ? pendingThreadTaskLinksByThreadId[selectedPendingPreviewItem.threadId]
    : undefined;
  const pendingLinkedTaskRecord = useMemo(() => {
    if (!selectedPendingPreviewItem) {
      return undefined;
    }

    if (typeof exactPendingTaskRecordId === 'string') {
      return (pendingTaskRecords ?? []).find(
        (record) => record.id === exactPendingTaskRecordId,
      );
    }

    return (pendingTaskRecords ?? []).find((record) => {
      const taskTargets = getTaskTargets(record);

      return taskTargets.some((taskTarget) => {
        const targetOpportunityId =
          getTaskTargetValue(taskTarget, 'targetOpportunityId') ??
          getTaskTargetValue(taskTarget, 'opportunityId');
        const targetCompanyId =
          getTaskTargetValue(taskTarget, 'targetCompanyId') ??
          getTaskTargetValue(taskTarget, 'companyId');
        const targetPersonId =
          getTaskTargetValue(taskTarget, 'targetPersonId') ??
          getTaskTargetValue(taskTarget, 'personId');

        return (
          (selectedPendingPreviewItem.opportunityRecordId != null &&
            targetOpportunityId ===
              selectedPendingPreviewItem.opportunityRecordId) ||
          (selectedPendingPreviewItem.customerRecordId != null &&
            targetCompanyId === selectedPendingPreviewItem.customerRecordId) ||
          (selectedPendingPreviewItem.personRecordId != null &&
            targetPersonId === selectedPendingPreviewItem.personRecordId)
        );
      });
    });
  }, [
    exactPendingTaskRecordId,
    pendingTaskRecords,
    selectedPendingPreviewItem,
  ]);
  const pendingLinkedTaskRecordId =
    pendingLinkedTaskRecord?.id ?? exactPendingTaskRecordId;
  const pendingTaskRecordPath =
    typeof pendingLinkedTaskRecordId === 'string'
      ? getTradeCrmRecordPathFromSource({
          objectNameSingular: CoreObjectNameSingular.Task,
          objectRecordId: pendingLinkedTaskRecordId,
          source: pendingTaskRecordSource,
        })
      : undefined;
  const handleCreatePendingTask = async () => {
    const createdTaskId = await openCreateTaskDrawer({
      targetableObjects: pendingTaskTargetableObject
        ? [pendingTaskTargetableObject]
        : [],
    });

    if (!selectedPendingPreviewItem?.threadId) {
      return;
    }

    await upsertTradeCrmMailThreadTaskLinkMutation({
      variables: {
        input: {
          threadId: selectedPendingPreviewItem.threadId,
          taskId: createdTaskId,
        },
      },
      refetchQueries:
        pendingThreadIds.length > 0
          ? [
              {
                query: GET_TRADE_CRM_MAIL_THREAD_TASK_LINKS,
                variables: {
                  threadIds: pendingThreadIds,
                },
              },
            ]
          : [],
      awaitRefetchQueries: true,
    });
  };
  const subordinateSelectedSuggestions = selectedCustomerPreviewItem
    ? [
        '先确认负责人是否超时未回复，再决定是否直接介入或转交。',
        '如果线程已经进入报价或样品阶段，优先把动作压回客户和商机链路。',
        '对持续低活跃的销售，补充下一步动作和管理备注，避免客户再次沉默。',
      ]
    : ['当前没有可审阅的下属线程，请先从左侧列表选择一项。'];
  const relationshipWorkbenchTitle = isSubordinateWorkbenchView
    ? '下属邮件面板'
    : '客户邮件面板';
  const relationshipListPrimaryLabel = isSubordinateWorkbenchView
    ? '负责人'
    : '客户';
  const relationshipListMetaLabel = isSubordinateWorkbenchView
    ? '负责人与最近线程'
    : '最近线程与摘要';
  const relationshipStatusLabel = isSubordinateWorkbenchView
    ? '处理状态 / 风险'
    : '分组 / 状态';
  const relationshipRecordLabel = isSubordinateWorkbenchView
    ? '负责人档案'
    : '客户档案';
  const relationshipNameLabel = isSubordinateWorkbenchView
    ? '负责人'
    : '客户名称';
  const relationshipGroupLabel = isSubordinateWorkbenchView
    ? '管理分组'
    : '客户分组';
  const relationshipActionPrimaryLabel = isSubordinateWorkbenchView
    ? '打开团队工作面'
    : selectedCustomerPreviewItem?.primaryRecordLabel ?? '打开客户详情';
  const relationshipActionPrimaryPath = isSubordinateWorkbenchView
    ? tradeCrmRouteMap.collaboration
    : selectedCustomerPreviewItem?.primaryRecordHref ??
      selectedCustomerPreviewItem?.href ??
      tradeCrmRouteMap.customers;
  const relationshipActionSecondaryLabel = isSubordinateWorkbenchView
    ? '进入客户处理'
    : selectedCustomerPreviewItem?.secondaryRecordLabel ?? '进入商机处理';
  const relationshipActionSecondaryPath = isSubordinateWorkbenchView
    ? tradeCrmRouteMap.customers
    : selectedCustomerPreviewItem?.secondaryRecordHref ??
      tradeCrmRouteMap.opportunities;
  const relationshipSuggestions = isSubordinateWorkbenchView
    ? subordinateSelectedSuggestions
    : customerSelectedSuggestions;
  const relationshipAssistantTabs = isSubordinateWorkbenchView
    ? ['AI 审阅', '动态', '资料', '团队负载', '风险']
    : ['OKKI AI', '动态', '资料', '商机&交易', '数据'];
  const relationshipTags = isSubordinateWorkbenchView
    ? [currentViewItem.label, selectedCustomerPreviewItem?.status ?? '待审阅']
    : [currentViewItem.label, selectedCustomerPreviewItem?.status ?? '待推进', '客户邮件'];
  const relationshipDetailBody = isSubordinateWorkbenchView
    ? [
        `负责人视角：${customerSelectedName}`,
        customerSelectedSummary,
        '优先检查是否超时未回复、是否需要转交，以及是否已经回写到客户或商机链路。',
      ].join('\n\n')
    : [
        customerSelectedSummary,
        '建议在这里同时判断客户阶段、最近一封邮件、下一步动作，以及是否应该回到商机或报价链路继续推进。',
      ].join('\n\n');
  const insightPanelCopy = getInsightPanelCopy(currentScope);
  const isDevelopmentEmailWorkbenchView =
    currentScope === 'campaign' &&
    ['campaigns', 'jobs', 'analytics'].includes(currentViewKey);
  const selectedCampaignWorkbench =
    currentScope === 'campaign' && currentViewKey === 'campaigns'
      ? (availableCampaigns.find(
          (campaign) => campaign.id === selectedCampaignToQueueId,
        ) ?? availableCampaigns[0])
      : undefined;
  const selectedCampaignTemplate =
    availableTemplates.find(
      (template) => template.id === selectedCampaignWorkbench?.templateId,
    ) ?? null;
  const selectedCampaignSendJobs = selectedCampaignWorkbench
    ? availableSendJobs.filter(
        (sendJob) => sendJob.campaignId === selectedCampaignWorkbench.id,
      )
    : [];
  const activeSendJobWorkbench =
    currentScope === 'campaign' && currentViewKey === 'jobs'
      ? (filteredAvailableSendJobs.find(
          (sendJob) =>
            sendJob.id === (selectedSendJobId ?? selectedSendJobToStartId),
        ) ?? filteredAvailableSendJobs[0])
      : undefined;
  const analyticsPrimaryRecord =
    currentScope === 'campaign' && currentViewKey === 'analytics'
      ? filteredRenderedListItems[0]
      : undefined;
  const analyticsSecondaryRecords =
    currentScope === 'campaign' && currentViewKey === 'analytics'
      ? filteredRenderedListItems.slice(1, 4)
      : [];
  const selectedSendTaskExecutionMode =
    typeof selectedSendTask?.trackingSnapshot?.executionMode === 'string'
      ? selectedSendTask.trackingSnapshot.executionMode
      : 'not recorded';
  const selectedSendTaskLastCallbackType =
    typeof selectedSendTask?.trackingSnapshot?.lastCallbackType === 'string'
      ? selectedSendTask.trackingSnapshot.lastCallbackType
      : 'not recorded';
  const selectedSendTaskLastCallbackProvider =
    typeof selectedSendTask?.trackingSnapshot?.lastCallbackProvider === 'string'
      ? selectedSendTask.trackingSnapshot.lastCallbackProvider
      : 'not recorded';
  const selectedSendTaskLastCallbackAt =
    typeof selectedSendTask?.trackingSnapshot?.lastCallbackAt === 'string'
      ? selectedSendTask.trackingSnapshot.lastCallbackAt
      : null;
  const isOperationalMailScope = currentScope !== 'campaign';
  const shouldHideInsightRail = isOperationalMailScope;
  const shouldRenderNarrativeMetrics = currentScope === 'campaign';
  const compactHeroSummaryText =
    currentScope === 'mail'
      ? '收件箱、待处理、文件夹、标签和 CRM 上下文放在同一工作面里处理。'
      : currentScope === 'customer'
        ? '按客户归档邮件，把线程持续压回客户、联系人和商机。'
        : '按负责人审阅下属邮件，把跟进压力、交接风险和管理动作放在一起。';
  const selectedSendTaskStatusFromCallback =
    typeof selectedSendTask?.trackingSnapshot?.statusFromCallback === 'string'
      ? selectedSendTask.trackingSnapshot.statusFromCallback
      : 'not recorded';
  const selectedSendTaskTrackingSnapshotPreview = selectedSendTask
    ? JSON.stringify(selectedSendTask.trackingSnapshot ?? {}, null, 2)
    : '';
  const selectedSendTaskCallbackSummary = selectedSendTask
    ? [
        `taskId=${selectedSendTask.id}`,
        `status=${selectedSendTask.status}`,
        `callbackType=${selectedSendTaskLastCallbackType}`,
        `callbackProvider=${selectedSendTaskLastCallbackProvider}`,
        `callbackAt=${selectedSendTaskLastCallbackAt ?? 'not-recorded'}`,
        `statusFromCallback=${selectedSendTaskStatusFromCallback}`,
        `providerMessageId=${selectedSendTask.providerMessageId ?? 'not-set'}`,
      ].join('\n')
    : '';
  const selectedSendTaskMetadataDetails = selectedSendTask
    ? Object.entries(selectedSendTask.trackingSnapshot ?? {})
        .filter(
          ([key]) =>
            ![
              'executionMode',
              'lastCallbackType',
              'lastCallbackProvider',
              'lastCallbackAt',
              'statusFromCallback',
            ].includes(key),
        )
        .map(([key, value]) => ({
          label: key,
          value: formatSnapshotValue(value),
        }))
    : [];
  const selectedSendTaskIdentityDetails = selectedSendTask
    ? [
        {
          label: 'Task id',
          value: selectedSendTask.id,
        },
        {
          label: 'Send job id',
          value: selectedSendTask.sendJobId ?? 'not linked',
        },
        {
          label: 'Campaign id',
          value: selectedSendTask.campaignId ?? 'not linked',
        },
        {
          label: 'Audience id',
          value: selectedSendTask.audienceId ?? 'not linked',
        },
        {
          label: 'Sender account',
          value: selectedSendTask.connectedAccountId ?? 'not assigned',
        },
        {
          label: 'Template id',
          value: selectedSendTask.templateId ?? 'not linked',
        },
      ]
    : [];
  const selectedSendTaskDeliveryDetails = selectedSendTask
    ? [
        {
          label: 'Execution mode',
          value: selectedSendTaskExecutionMode,
        },
        {
          label: 'Provider message id',
          value: selectedSendTask.providerMessageId ?? 'not set',
        },
        {
          label: 'Scheduled at',
          value:
            selectedSendTask.scheduledAt !== null
              ? formatToHumanReadableDate(selectedSendTask.scheduledAt)
              : 'not recorded',
        },
        {
          label: 'Sent at',
          value:
            selectedSendTask.sentAt !== null
              ? formatToHumanReadableDate(selectedSendTask.sentAt)
              : 'not recorded',
        },
        {
          label: 'Updated at',
          value: formatToHumanReadableDate(selectedSendTask.updatedAt),
        },
        {
          label: 'Retry count',
          value: `${selectedSendTask.retryCount}`,
        },
      ]
    : [];
  const selectedSendTaskCallbackDetails = selectedSendTask
    ? [
        {
          label: 'Last callback type',
          value: selectedSendTaskLastCallbackType,
        },
        {
          label: 'Last callback provider',
          value: selectedSendTaskLastCallbackProvider,
        },
        {
          label: 'Last callback at',
          value:
            selectedSendTaskLastCallbackAt !== null
              ? formatToHumanReadableDate(selectedSendTaskLastCallbackAt)
              : 'not recorded',
        },
        {
          label: 'Status from callback',
          value: selectedSendTaskStatusFromCallback,
        },
      ]
    : [];
  const showDevelopmentEmailCreatePanel =
    currentScope === 'campaign' && isDevelopmentEmailCreateView(currentViewKey);

  const handleCreateAudience = async () => {
    if (!audienceEmail || !audienceDisplayName) {
      setFormError('Audience email and display name are required.');

      return;
    }

    setFormError(null);

    try {
      await createDevelopmentEmailAudienceMutation({
        variables: {
          input: {
            email: audienceEmail,
            displayName: audienceDisplayName,
          },
        },
      });

      setAudienceEmail('');
      setAudienceDisplayName('');
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Unable to create audience.',
      );
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName || !templateSubject || !templateBodyHtml) {
      setFormError('Template name, subject, and body are required.');

      return;
    }

    setFormError(null);

    try {
      await createDevelopmentEmailTemplateMutation({
        variables: {
          input: {
            name: templateName,
            subject: templateSubject,
            bodyHtml: templateBodyHtml,
          },
        },
      });

      setTemplateName('');
      setTemplateSubject('');
      setTemplateBodyHtml('');
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Unable to create template.',
      );
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignName) {
      setFormError('Campaign name is required.');

      return;
    }

    setFormError(null);

    try {
      await createDevelopmentEmailCampaignMutation({
        variables: {
          input: {
            name: campaignName,
            templateId: campaignTemplateId || undefined,
            scheduledAt: campaignScheduledAt
              ? new Date(campaignScheduledAt).toISOString()
              : undefined,
          },
        },
      });

      setCampaignName('');
      setCampaignTemplateId('');
      setCampaignScheduledAt('');
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Unable to create campaign.',
      );
    }
  };

  const handleQueueCampaign = async () => {
    if (!selectedCampaignToQueueId) {
      setFormError('Select a campaign before creating queued send tasks.');

      return;
    }

    setFormError(null);

    try {
      await queueDevelopmentEmailCampaignMutation({
        variables: {
          input: {
            campaignId: selectedCampaignToQueueId,
          },
        },
      });

      setSelectedCampaignToQueueId('');
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Unable to queue campaign.',
      );
    }
  };

  const handleRecordBounceEvent = async () => {
    if (!bounceEmail) {
      setFormError('Bounce email is required.');

      return;
    }

    setFormError(null);

    try {
      await recordDevelopmentEmailBounceEventMutation({
        variables: {
          input: {
            email: bounceEmail,
            eventType: bounceEventType,
            reason: bounceReason || undefined,
          },
        },
      });

      setBounceEmail('');
      setBounceEventType('hard_bounce');
      setBounceReason('');
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to record bounce event.',
      );
    }
  };

  const handleRecordUnsubscribe = async () => {
    if (!unsubscribeEmail) {
      setFormError('Unsubscribe email is required.');

      return;
    }

    setFormError(null);

    try {
      await recordDevelopmentEmailUnsubscribeMutation({
        variables: {
          input: {
            email: unsubscribeEmail,
            source: unsubscribeSource || undefined,
            reason: unsubscribeReason || undefined,
          },
        },
      });

      setUnsubscribeEmail('');
      setUnsubscribeSource('manual');
      setUnsubscribeReason('');
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to record unsubscribe.',
      );
    }
  };

  const handleRecordAnalyticsEvent = async () => {
    if (!analyticsEmail) {
      setFormError('Analytics event email is required.');

      return;
    }

    setFormError(null);

    try {
      await recordDevelopmentEmailEventMutation({
        variables: {
          input: {
            email: analyticsEmail,
            eventType: analyticsEventType,
            provider: analyticsProvider || undefined,
            sendJobId: selectedSendJobId,
          },
        },
      });

      setAnalyticsEmail('');
      setAnalyticsEventType('opened');
      setAnalyticsProvider('internal-simulation');
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to record analytics event.',
      );
    }
  };

  const handleGenerateReportExport = async () => {
    setFormError(null);

    try {
      await getDevelopmentEmailReportExport();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to generate report export.',
      );
    }
  };

  const handleGenerateTrackingLinks = async () => {
    if (!trackingEmail) {
      setFormError('Tracking email is required.');

      return;
    }

    setFormError(null);

    try {
      await getDevelopmentEmailTrackingLinks({
        variables: {
          input: {
            email: trackingEmail,
            provider: analyticsProvider || undefined,
            sendJobId: selectedSendJobId,
            targetUrl: trackingTargetUrl || undefined,
          },
        },
      });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to generate signed tracking links.',
      );
    }
  };

  const handleDownloadReportExport = () => {
    if (!reportExportPreview || !reportExportFileName) {
      setFormError('Generate the CSV export before downloading it.');

      return;
    }

    setFormError(null);

    const csvBlob = new Blob([reportExportPreview], {
      type: 'text/csv;charset=utf-8;',
    });
    const downloadUrl = URL.createObjectURL(csvBlob);
    const downloadLink = document.createElement('a');

    downloadLink.href = downloadUrl;
    downloadLink.download = reportExportFileName;
    document.body.append(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  const handleStartSendJob = async () => {
    const sendJobId = selectedSendJobId ?? selectedSendJobToStartId;

    if (!sendJobId) {
      setFormError('Select a send job before preparing sender assignments.');

      return;
    }

    setFormError(null);

    try {
      await startDevelopmentEmailSendJobMutation({
        variables: {
          input: {
            sendJobId,
          },
        },
      });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to start development email send job.',
      );
    }
  };

  const handleExecuteSendJob = async () => {
    const sendJobId = selectedSendJobId ?? selectedSendJobToStartId;

    if (!sendJobId) {
      setFormError('Select a send job before executing prepared tasks.');

      return;
    }

    setFormError(null);

    try {
      await executeDevelopmentEmailSendJobMutation({
        variables: {
          input: {
            sendJobId,
          },
        },
      });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to execute development email send job.',
      );
    }
  };

  const handleUpdateThreadPendingState = async ({
    threadId,
    isPending,
  }: {
    threadId: string;
    isPending: boolean;
  }) => {
    setFormError(null);

    try {
      await updateTradeCrmMailThreadStateMutation({
        variables: {
          input: {
            threadId,
            isPending,
            pendingReason: isPending ? 'manual_workspace_review' : undefined,
          },
        },
        refetchQueries: [
          {
            query: GET_MY_INBOX_THREADS,
            variables: {
              page: 1,
              pageSize: 20,
              direction:
                currentViewKey === 'sent'
                  ? 'OUTGOING'
                  : currentViewKey === 'search' || currentViewKey === 'tagged'
                    ? undefined
                    : 'INCOMING',
              filter:
                currentViewKey === 'unread'
                  ? 'UNREAD'
                  : currentViewKey === 'pending'
                    ? 'PENDING'
                    : currentViewKey === 'tagged'
                      ? 'TAGGED'
                      : undefined,
              search: currentViewKey === 'search' ? mailSearchQuery : undefined,
              tag: currentViewKey === 'search' ? mailTagFilter : undefined,
              receivedAtFrom:
                currentViewKey === 'search' ? mailReceivedAtFrom : undefined,
              receivedAtTo:
                currentViewKey === 'search' ? mailReceivedAtTo : undefined,
            },
          },
        ],
        awaitRefetchQueries: true,
      });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to update pending state.',
      );
    }
  };

  const handleUpdateThreadTag = async ({
    threadId,
    mode,
    tag,
  }: {
    threadId: string;
    mode: 'ADD' | 'CLEAR_ALL';
    tag?: string;
  }) => {
    if (mode === 'ADD' && !tag) {
      return;
    }

    setFormError(null);

    try {
      await updateTradeCrmMailThreadTagMutation({
        variables: {
          input: {
            threadId,
            mode,
            tag,
          },
        },
        refetchQueries: [
          {
            query: GET_MY_INBOX_THREADS,
            variables: {
              page: 1,
              pageSize: 20,
              direction:
                currentViewKey === 'sent'
                  ? 'OUTGOING'
                  : currentViewKey === 'search' || currentViewKey === 'tagged'
                    ? undefined
                    : 'INCOMING',
              filter:
                currentViewKey === 'unread'
                  ? 'UNREAD'
                  : currentViewKey === 'pending'
                    ? 'PENDING'
                    : currentViewKey === 'tagged'
                      ? 'TAGGED'
                      : undefined,
              search: currentViewKey === 'search' ? mailSearchQuery : undefined,
              tag: currentViewKey === 'search' ? mailTagFilter : undefined,
              receivedAtFrom:
                currentViewKey === 'search' ? mailReceivedAtFrom : undefined,
              receivedAtTo:
                currentViewKey === 'search' ? mailReceivedAtTo : undefined,
            },
          },
        ],
        awaitRefetchQueries: true,
      });
      setActiveTagEditorThreadId(null);
      setThreadTagDraft('');
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Unable to update tags.',
      );
    }
  };

  const handleOpenThreadTagEditor = (threadId: string) => {
    setFormError(null);
    setActiveTagEditorThreadId(threadId);
    setThreadTagDraft('important-customer');
  };

  const handleCancelThreadTagEditor = () => {
    setActiveTagEditorThreadId(null);
    setThreadTagDraft('');
  };

  const handleMailSearchChange = (value: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (value.trim()) {
      nextSearchParams.set('q', value);
    } else {
      nextSearchParams.delete('q');
    }

    setSearchParams(nextSearchParams);
  };

  const handleMailSearchFilterChange = ({
    key,
    value,
  }: {
    key: 'tag' | 'from' | 'to';
    value: string;
  }) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (value.trim()) {
      nextSearchParams.set(key, value);
    } else {
      nextSearchParams.delete(key);
    }

    setSearchParams(nextSearchParams);
  };

  const handlePreviewThreadSelection = (threadId: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.set('previewThreadId', threadId);
    setSearchParams(nextSearchParams);
  };

  const handlePreviewCustomerSelection = (customerId: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.set('previewCustomerId', customerId);
    setSearchParams(nextSearchParams);
  };

  const handleCampaignSelection = (campaignId: string) => {
    setSelectedCampaignToQueueId(campaignId);
  };

  const handleSendJobSelection = (sendJobId: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.set('jobId', sendJobId);
    nextSearchParams.delete('taskId');
    setSelectedSendJobToStartId(sendJobId);
    setSearchParams(nextSearchParams);
  };

  const handleSendTaskSelection = (taskId: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.set('taskId', taskId);
    setSearchParams(nextSearchParams);
  };

  const handleSendJobModeFilterChange = (value: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (value === 'all') {
      nextSearchParams.delete('jobMode');
    } else {
      nextSearchParams.set('jobMode', value);
    }

    setSearchParams(nextSearchParams);
  };

  const handleSendJobStatusFilterChange = (value: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (value === 'all') {
      nextSearchParams.delete('jobStatus');
    } else {
      nextSearchParams.set('jobStatus', value);
    }

    setSearchParams(nextSearchParams);
  };

  const handleSendJobPresetChange = ({
    mode,
    status,
  }: {
    mode: string;
    status: string;
  }) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (mode === 'all') {
      nextSearchParams.delete('jobMode');
    } else {
      nextSearchParams.set('jobMode', mode);
    }

    if (status === 'all') {
      nextSearchParams.delete('jobStatus');
    } else {
      nextSearchParams.set('jobStatus', status);
    }

    setSearchParams(nextSearchParams);
  };

  const sendJobPresets = [
    {
      key: 'all-jobs',
      label: tr('All jobs'),
      mode: 'all',
      status: 'all',
    },
    {
      key: 'live-failures',
      label: tr('Live failures'),
      mode: 'live-capable',
      status: 'completed_with_failures',
    },
    {
      key: 'fallback-completed',
      label: tr('Fallback completed'),
      mode: 'fallback-only',
      status: 'completed',
    },
    {
      key: 'queued-jobs',
      label: tr('Queued jobs'),
      mode: 'all',
      status: 'queued',
    },
  ];

  return (
    <PageContainer>
      <PageHeader title={tr(workspace.label)}>
        <TradeCrmLocaleSwitch />
      </PageHeader>
      <MainContainerLayoutWithSidePanel>
        <StyledContent>
          <StyledHero $compact={isOperationalMailScope}>
            {isOperationalMailScope ? (
              <StyledCompactHeroStack>
                <StyledCompactHeroRow>
                  <StyledScopeTabs>
                    {TRADE_CRM_MAIL_SCOPE_ORDER.map((scopeKey) => {
                      const scopeWorkspace = getTradeCrmMailWorkspace(scopeKey);

                      return (
                        <StyledScopeTab
                          key={scopeKey}
                          to={getTradeCrmMailPath({
                            scope: scopeKey,
                            view: scopeWorkspace.defaultViewKey,
                          })}
                          data-active={
                            scopeKey === currentScope ? 'true' : 'false'
                          }
                        >
                          {tr(scopeWorkspace.label)}
                        </StyledScopeTab>
                      );
                    })}
                  </StyledScopeTabs>
                  <StyledSubviewTabs>
                    {heroSubviewItems.map((item) => (
                      <StyledSubviewTab
                        key={item.key}
                        to={getTradeCrmMailSidebarLink({
                          scope: currentScope,
                          item,
                        })}
                        data-active={
                          item.key === currentViewKey ? 'true' : 'false'
                        }
                      >
                        {tr(item.label)}
                      </StyledSubviewTab>
                    ))}
                  </StyledSubviewTabs>
                </StyledCompactHeroRow>
                <StyledCompactHeroSummary>
                  <StyledEyebrow>{tr(workspace.description)}</StyledEyebrow>
                  <StyledCompactHeroValue>
                    {tr(currentViewItem.label)}
                  </StyledCompactHeroValue>
                  <StyledCompactHeroText>
                    {tr(compactHeroSummaryText)}
                  </StyledCompactHeroText>
                </StyledCompactHeroSummary>
              </StyledCompactHeroStack>
            ) : (
              <>
                <StyledScopeTabs>
                  {TRADE_CRM_MAIL_SCOPE_ORDER.map((scopeKey) => {
                    const scopeWorkspace = getTradeCrmMailWorkspace(scopeKey);

                    return (
                      <StyledScopeTab
                        key={scopeKey}
                        to={getTradeCrmMailPath({
                          scope: scopeKey,
                          view: scopeWorkspace.defaultViewKey,
                        })}
                        data-active={
                          scopeKey === currentScope ? 'true' : 'false'
                        }
                      >
                        {tr(scopeWorkspace.label)}
                      </StyledScopeTab>
                    );
                  })}
                </StyledScopeTabs>
                <StyledSubviewTabs>
                  {heroSubviewItems.map((item) => (
                    <StyledSubviewTab
                      key={item.key}
                      to={getTradeCrmMailSidebarLink({
                        scope: currentScope,
                        item,
                      })}
                      data-active={
                        item.key === currentViewKey ? 'true' : 'false'
                      }
                    >
                      {tr(item.label)}
                    </StyledSubviewTab>
                  ))}
                </StyledSubviewTabs>
                <StyledHeroGrid>
                  <StyledHeroCopy>
                    <StyledEyebrow>{tr(workspace.description)}</StyledEyebrow>
                    <StyledHeroTitle>{tr(workspace.heroTitle)}</StyledHeroTitle>
                    <StyledHeroDescription>
                      {tr(workspace.heroDescription)}
                    </StyledHeroDescription>
                  </StyledHeroCopy>
                  <StyledHeroSummary>
                    <StyledHeroSummaryTitle>
                      {tr(workspace.heroSummaryTitle)}
                    </StyledHeroSummaryTitle>
                    <StyledHeroSummaryValue>
                      {tr(currentViewItem.label)}
                    </StyledHeroSummaryValue>
                    <StyledHeroSummaryText>
                      {tr(workspace.heroSummaryText)}
                    </StyledHeroSummaryText>
                  </StyledHeroSummary>
                </StyledHeroGrid>
              </>
            )}
          </StyledHero>
          <StyledWorkspace
            $relationshipScope={
              currentScope === 'customer' || currentScope === 'subordinate'
            }
            $withoutInsight={shouldHideInsightRail}
          >
            <StyledSidebar
              $relationshipScope={
                currentScope === 'customer' || currentScope === 'subordinate'
              }
            >
              <StyledSidebarTitle>{tr(workspace.sidebarTitle)}</StyledSidebarTitle>
              <StyledComposeButton to={composeEntryPath}>
                {composeEntryLabel}
              </StyledComposeButton>
              {currentScope === 'customer' ? (
                <StyledSidebarControls>
                  <StyledInput
                    onChange={(event) =>
                      handleMailSearchChange(event.target.value)
                    }
                    placeholder={tr('客户名称/编号/邮箱/联系人')}
                    value={mailSearchQuery}
                  />
                  <StyledSelect
                    onChange={(event) => {
                      window.location.assign(
                        getTradeCrmMailPath({
                          scope: 'customer',
                          view: event.target.value as TradeCrmMailViewKey,
                        }),
                      );
                    }}
                    value={currentViewKey}
                  >
                    {heroSubviewItems.map((item) => (
                      <option key={item.key} value={item.key}>
                        {tr(item.label)}
                      </option>
                    ))}
                  </StyledSelect>
                </StyledSidebarControls>
              ) : null}
              {currentScope === 'subordinate' ? (
                <StyledSidebarControls>
                  <StyledInput
                    onChange={(event) =>
                      handleMailSearchChange(event.target.value)
                    }
                    placeholder={tr('负责人 / 客户 / 主题')}
                    value={mailSearchQuery}
                  />
                  <StyledSelect
                    aria-label={tr('Subordinate filter')}
                    onChange={() => undefined}
                    value="all"
                  >
                    <option value="all">{tr('所有下属')}</option>
                  </StyledSelect>
                </StyledSidebarControls>
              ) : null}
              {sidebarSections.map(({ section, items }, index) => (
                <StyledSidebarSection
                  key={section}
                  style={
                    index === 0
                      ? { borderTop: '0', paddingTop: '0' }
                      : undefined
                  }
                >
                  <StyledSidebarSectionLabel>
                    {tr(section)}
                  </StyledSidebarSectionLabel>
                  <StyledSidebarList>
                    {items.map((item) => (
                      <StyledSidebarLink
                        key={item.key}
                        to={getTradeCrmMailSidebarLink({
                          scope: currentScope,
                          item,
                        })}
                        data-active={
                          item.key === currentViewKey ? 'true' : 'false'
                        }
                      >
                        <StyledSidebarLabelRow>
                          <StyledSidebarLabel>
                            {tr(item.label)}
                          </StyledSidebarLabel>
                          {item.countLabel ? (
                            <StyledSidebarCount>
                              {item.countLabel}
                            </StyledSidebarCount>
                          ) : null}
                        </StyledSidebarLabelRow>
                        <StyledSidebarHint>{tr(item.hint)}</StyledSidebarHint>
                      </StyledSidebarLink>
                    ))}
                  </StyledSidebarList>
                </StyledSidebarSection>
              ))}
              {currentScope === 'mail' ? (
                <StyledSidebarSection>
                  <StyledSidebarSectionLabel>
                    {tr('Synced folders')}
                  </StyledSidebarSectionLabel>
                  {rootFolders.length > 0 ? (
                    <TradeCrmMailFolderTree folderTreeNodes={rootFolders} />
                  ) : (
                    <StyledSidebarHint>
                      {tr(
                        'No synced folders are available yet, or the primary inbox has not completed initialization.',
                      )}
                    </StyledSidebarHint>
                  )}
                </StyledSidebarSection>
              ) : null}
            </StyledSidebar>
            <StyledMainColumn>
              <StyledPanel>
                <StyledToolbar>
                  {currentScope === 'mail' ? (
                    <StyledFormGrid>
                      <StyledFormField>
                        {tr('关键词')}
                        <StyledInput
                          onChange={(event) =>
                            handleMailSearchChange(event.target.value)
                          }
                          placeholder={tr('搜索发件人、主题、正文或标签')}
                          value={mailSearchQuery}
                        />
                      </StyledFormField>
                      {currentViewKey === 'search' ? (
                        <>
                          <StyledFormField>
                            {tr('标签')}
                            <StyledInput
                              onChange={(event) =>
                                handleMailSearchFilterChange({
                                  key: 'tag',
                                  value: event.target.value,
                                })
                              }
                              placeholder={tr('重点客户')}
                              value={mailTagFilter}
                            />
                          </StyledFormField>
                          <StyledFormField>
                            {tr('开始时间')}
                            <StyledInput
                              onChange={(event) =>
                                handleMailSearchFilterChange({
                                  key: 'from',
                                  value: event.target.value,
                                })
                              }
                              type="datetime-local"
                              value={mailReceivedAtFrom}
                            />
                          </StyledFormField>
                          <StyledFormField>
                            {tr('结束时间')}
                            <StyledInput
                              onChange={(event) =>
                                handleMailSearchFilterChange({
                                  key: 'to',
                                  value: event.target.value,
                                })
                              }
                              type="datetime-local"
                              value={mailReceivedAtTo}
                            />
                          </StyledFormField>
                        </>
                      ) : null}
                    </StyledFormGrid>
                  ) : currentScope === 'campaign' &&
                    currentViewKey === 'jobs' ? (
                    <StyledFormGrid>
                      <StyledFormField>
                        {tr('Sender pool mode')}
                        <StyledSelect
                          onChange={(event) =>
                            handleSendJobModeFilterChange(event.target.value)
                          }
                          value={sendJobModeFilter}
                        >
                          <option value="all">{tr('All jobs')}</option>
                          <option value="fallback-only">
                            {tr('Fallback-only')}
                          </option>
                          <option value="live-capable">
                            {tr('Live-capable')}
                          </option>
                        </StyledSelect>
                      </StyledFormField>
                      <StyledFormField>
                        {tr('Job status')}
                        <StyledSelect
                          onChange={(event) =>
                            handleSendJobStatusFilterChange(event.target.value)
                          }
                          value={sendJobStatusFilter}
                        >
                          <option value="all">{tr('All statuses')}</option>
                          <option value="queued">{tr('Queued')}</option>
                          <option value="completed">{tr('Completed')}</option>
                          <option value="completed_with_failures">
                            {tr('Completed with failures')}
                          </option>
                          <option value="prepared">{tr('Prepared')}</option>
                          <option value="running">{tr('Running')}</option>
                        </StyledSelect>
                      </StyledFormField>
                    </StyledFormGrid>
                  ) : (
                    <StyledSearchInput>
                      {tr('搜索发件人、主题、客户、商机、活动、标签或时间范围')}
                    </StyledSearchInput>
                  )}
                  <StyledToolbarMeta>
                    <StyledBadge>{tr(workspace.label)}</StyledBadge>
                    <StyledBadge>{tr(currentViewItem.label)}</StyledBadge>
                    {currentScope === 'campaign' &&
                    currentViewKey === 'jobs' ? (
                      <StyledBadge>
                        {tr(`当前作业 ${filteredSendJobCount}`)}
                      </StyledBadge>
                    ) : null}
                    <StyledBadge>{tr('CRM 与 AI 联动')}</StyledBadge>
                  </StyledToolbarMeta>
                </StyledToolbar>
                {currentScope === 'mail' ? (
                  <StyledFilterPresetRow>
                    <StyledActionLink
                      to={getTradeCrmMailPath({
                        scope: 'mail',
                        view: 'inbox',
                      })}
                    >
                      {tr('全部邮件')}
                    </StyledActionLink>
                    <StyledActionLink
                      to={getTradeCrmMailPath({
                        scope: 'mail',
                        view: 'pending',
                      })}
                    >
                      {tr('待处理')}
                    </StyledActionLink>
                    <StyledActionLink
                      to={getTradeCrmMailPath({
                        scope: 'mail',
                        view: 'unread',
                      })}
                    >
                      {tr('未读')}
                    </StyledActionLink>
                    <StyledActionLink
                      to={getTradeCrmMailPath({
                        scope: 'mail',
                        view: 'sent',
                      })}
                    >
                      {tr('已发送')}
                    </StyledActionLink>
                    <StyledActionLink
                      to={getTradeCrmMailPath({
                        scope: 'mail',
                        view: 'search',
                      })}
                    >
                      {tr('高级搜索')}
                    </StyledActionLink>
                    {hasSelectedMailboxThread ? (
                      <StyledSecondaryButton
                        onClick={() =>
                          openEmailThreadInSidePanel(
                            selectedMailboxPreviewItem?.threadId ?? '',
                          )
                        }
                        type="button"
                      >
                        {tr('打开线程')}
                      </StyledSecondaryButton>
                    ) : null}
                    {hasSelectedMailboxThread ? (
                      <StyledSecondaryButton
                        onClick={() =>
                          handleUpdateThreadPendingState({
                            threadId:
                              selectedMailboxPreviewItem?.threadId ?? '',
                            isPending: currentViewKey !== 'pending',
                          })
                        }
                        type="button"
                      >
                        {tr(
                          currentViewKey === 'pending'
                            ? '清除待处理'
                            : '标记待处理',
                        )}
                      </StyledSecondaryButton>
                    ) : null}
                    {hasSelectedMailboxThread ? (
                      <StyledSecondaryButton
                        onClick={() => {
                          if (selectedMailboxHasTags) {
                            void handleUpdateThreadTag({
                              threadId:
                                selectedMailboxPreviewItem?.threadId ?? '',
                              mode: 'CLEAR_ALL',
                            });

                            return;
                          }

                          handleOpenThreadTagEditor(
                            selectedMailboxPreviewItem?.threadId ?? '',
                          );
                        }}
                        type="button"
                      >
                        {tr(selectedMailboxHasTags ? '清空标签' : '添加标签')}
                      </StyledSecondaryButton>
                    ) : null}
                  </StyledFilterPresetRow>
                ) : currentScope === 'customer' ? (
                  <StyledFilterPresetRow>
                    <StyledActionLink
                      to={getTradeCrmMailPath({
                        scope: 'customer',
                        view: 'recent',
                      })}
                    >
                      {tr('最近往来')}
                    </StyledActionLink>
                    <StyledActionLink
                      to={getTradeCrmMailPath({
                        scope: 'customer',
                        view: 'focus',
                      })}
                    >
                      {tr('关注客户')}
                    </StyledActionLink>
                    <StyledActionLink
                      to={getTradeCrmMailPath({
                        scope: 'customer',
                        view: 'cooperating',
                      })}
                    >
                      {tr('合作客户')}
                    </StyledActionLink>
                    <StyledActionLink to={tradeCrmRouteMap.customers}>
                      {tr('打开客户工作台')}
                    </StyledActionLink>
                    <StyledActionLink to={tradeCrmRouteMap.opportunities}>
                      {tr('打开商机工作台')}
                    </StyledActionLink>
                    <StyledActionLink
                      to={getTradeCrmMailPath({
                        scope: 'mail',
                        view: 'search',
                      })}
                    >
                      {tr('搜索邮件')}
                    </StyledActionLink>
                  </StyledFilterPresetRow>
                ) : null}
                {currentScope === 'campaign' && currentViewKey === 'jobs' ? (
                  <StyledFilterPresetRow>
                    {sendJobPresets.map((preset) => {
                      const isActive =
                        sendJobModeFilter === preset.mode &&
                        sendJobStatusFilter === preset.status;

                      return (
                        <StyledFilterPresetButton
                          $active={isActive}
                          key={preset.key}
                          onClick={() =>
                            handleSendJobPresetChange({
                              mode: preset.mode,
                              status: preset.status,
                            })
                          }
                          type="button"
                        >
                          {preset.label}
                        </StyledFilterPresetButton>
                      );
                    })}
                  </StyledFilterPresetRow>
                ) : null}
                {shouldRenderNarrativeMetrics ? (
                  <StyledMetrics>
                    {renderedMetrics.map((metric) => (
                      <StyledMetricCard key={metric.label}>
                        <StyledMetricLabel>{tr(metric.label)}</StyledMetricLabel>
                        <StyledMetricValue>{metric.value}</StyledMetricValue>
                        <StyledMetricDescription>
                          {tr(metric.description)}
                        </StyledMetricDescription>
                      </StyledMetricCard>
                    ))}
                  </StyledMetrics>
                ) : null}
              </StyledPanel>
              <StyledPanel>
                <StyledSectionTitle>
                  {tr(workspace.listTitle)}
                </StyledSectionTitle>
                {showDevelopmentEmailCreatePanel ? (
                  <StyledFormGrid>
                    {currentViewKey === 'audiences' ? (
                      <>
                        <StyledFormField>
                          {tr('Audience Email')}
                          <StyledInput
                            onChange={(event) =>
                              setAudienceEmail(event.target.value)
                            }
                            value={audienceEmail}
                          />
                        </StyledFormField>
                        <StyledFormField>
                          {tr('Display Name')}
                          <StyledInput
                            onChange={(event) =>
                              setAudienceDisplayName(event.target.value)
                            }
                            value={audienceDisplayName}
                          />
                        </StyledFormField>
                      </>
                    ) : null}
                    {currentViewKey === 'templates' ? (
                      <>
                        <StyledFormField>
                          {tr('Template Name')}
                          <StyledInput
                            onChange={(event) =>
                              setTemplateName(event.target.value)
                            }
                            value={templateName}
                          />
                        </StyledFormField>
                        <StyledFormField>
                          {tr('Template Subject')}
                          <StyledInput
                            onChange={(event) =>
                              setTemplateSubject(event.target.value)
                            }
                            value={templateSubject}
                          />
                        </StyledFormField>
                        <StyledFormField>
                          {tr('HTML Body')}
                          <StyledTextArea
                            onChange={(event) =>
                              setTemplateBodyHtml(event.target.value)
                            }
                            value={templateBodyHtml}
                          />
                        </StyledFormField>
                      </>
                    ) : null}
                    {currentViewKey === 'campaigns' ? (
                      <>
                        <StyledFormField>
                          {tr('Campaign Name')}
                          <StyledInput
                            onChange={(event) =>
                              setCampaignName(event.target.value)
                            }
                            value={campaignName}
                          />
                        </StyledFormField>
                        <StyledFormField>
                          {tr('Template')}
                          <StyledSelect
                            onChange={(event) =>
                              setCampaignTemplateId(event.target.value)
                            }
                            value={campaignTemplateId}
                          >
                            <option value="">
                              {tr('No template selected')}
                            </option>
                            {availableTemplates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {`${template.name} - v${template.version}`}
                              </option>
                            ))}
                          </StyledSelect>
                        </StyledFormField>
                        {availableTemplates.length === 0 ? (
                          <StyledListMeta>
                            {tr(
                              'Create at least one template before linking a campaign.',
                            )}
                          </StyledListMeta>
                        ) : null}
                        <StyledFormField>
                          {tr('Scheduled At')}
                          <StyledInput
                            onChange={(event) =>
                              setCampaignScheduledAt(event.target.value)
                            }
                            type="datetime-local"
                            value={campaignScheduledAt}
                          />
                        </StyledFormField>
                      </>
                    ) : null}
                    {currentViewKey === 'bounces' ? (
                      <>
                        <StyledFormField>
                          {tr('Recipient Email')}
                          <StyledInput
                            onChange={(event) =>
                              setBounceEmail(event.target.value)
                            }
                            value={bounceEmail}
                          />
                        </StyledFormField>
                        <StyledFormField>
                          {tr('Event Type')}
                          <StyledSelect
                            onChange={(event) =>
                              setBounceEventType(event.target.value)
                            }
                            value={bounceEventType}
                          >
                            <option value="hard_bounce">
                              {tr('Hard Bounce')}
                            </option>
                            <option value="soft_bounce">
                              {tr('Soft Bounce')}
                            </option>
                            <option value="complaint">{tr('Complaint')}</option>
                          </StyledSelect>
                        </StyledFormField>
                        <StyledFormField>
                          {tr('Reason')}
                          <StyledInput
                            onChange={(event) =>
                              setBounceReason(event.target.value)
                            }
                            value={bounceReason}
                          />
                        </StyledFormField>
                      </>
                    ) : null}
                    {currentViewKey === 'unsubscribes' ? (
                      <>
                        <StyledFormField>
                          {tr('Recipient Email')}
                          <StyledInput
                            onChange={(event) =>
                              setUnsubscribeEmail(event.target.value)
                            }
                            value={unsubscribeEmail}
                          />
                        </StyledFormField>
                        <StyledFormField>
                          {tr('Source')}
                          <StyledInput
                            onChange={(event) =>
                              setUnsubscribeSource(event.target.value)
                            }
                            value={unsubscribeSource}
                          />
                        </StyledFormField>
                        <StyledFormField>
                          {tr('Reason')}
                          <StyledInput
                            onChange={(event) =>
                              setUnsubscribeReason(event.target.value)
                            }
                            value={unsubscribeReason}
                          />
                        </StyledFormField>
                      </>
                    ) : null}
                    {currentViewKey === 'jobs' ? (
                      <StyledFormField>
                        {tr('Prepare Send Job')}
                        <StyledSelect
                          onChange={(event) =>
                            setSelectedSendJobToStartId(event.target.value)
                          }
                          value={selectedSendJobToStartId}
                        >
                          <option value="">{tr('No send job selected')}</option>
                          {filteredAvailableSendJobs.map((sendJob) => (
                            <option key={sendJob.id} value={sendJob.id}>
                              {`Job ${sendJob.id.slice(0, 8)} - ${sendJob.status} - ${sendJob.senderPoolMode ?? 'not recorded'}`}
                            </option>
                          ))}
                        </StyledSelect>
                      </StyledFormField>
                    ) : null}
                    {currentViewKey === 'analytics' ? (
                      <>
                        <StyledFormField>
                          {tr('Recipient Email')}
                          <StyledInput
                            onChange={(event) =>
                              setAnalyticsEmail(event.target.value)
                            }
                            value={analyticsEmail}
                          />
                        </StyledFormField>
                        <StyledFormField>
                          {tr('Event Type')}
                          <StyledSelect
                            onChange={(event) =>
                              setAnalyticsEventType(event.target.value)
                            }
                            value={analyticsEventType}
                          >
                            <option value="opened">{tr('Opened')}</option>
                            <option value="clicked">{tr('Clicked')}</option>
                            <option value="replied">{tr('Replied')}</option>
                          </StyledSelect>
                        </StyledFormField>
                        <StyledFormField>
                          {tr('Provider')}
                          <StyledInput
                            onChange={(event) =>
                              setAnalyticsProvider(event.target.value)
                            }
                            value={analyticsProvider}
                          />
                        </StyledFormField>
                        <StyledFormField>
                          {tr('Tracking Email')}
                          <StyledInput
                            onChange={(event) =>
                              setTrackingEmail(event.target.value)
                            }
                            value={trackingEmail}
                          />
                        </StyledFormField>
                        <StyledFormField>
                          {tr('Click Target Url')}
                          <StyledInput
                            onChange={(event) =>
                              setTrackingTargetUrl(event.target.value)
                            }
                            value={trackingTargetUrl}
                          />
                        </StyledFormField>
                      </>
                    ) : null}
                  </StyledFormGrid>
                ) : null}
                {showDevelopmentEmailCreatePanel && formError ? (
                  <StyledErrorText>{tr(formError)}</StyledErrorText>
                ) : null}
                {showDevelopmentEmailCreatePanel ? (
                  <StyledButtonRow>
                    {currentViewKey === 'audiences' ? (
                      <StyledPrimaryButton
                        onClick={handleCreateAudience}
                        type="button"
                      >
                        {tr(
                          creatingAudience ? 'Creating...' : 'Create Audience',
                        )}
                      </StyledPrimaryButton>
                    ) : null}
                    {currentViewKey === 'templates' ? (
                      <StyledPrimaryButton
                        onClick={handleCreateTemplate}
                        type="button"
                      >
                        {tr(
                          creatingTemplate ? 'Creating...' : 'Create Template',
                        )}
                      </StyledPrimaryButton>
                    ) : null}
                    {currentViewKey === 'campaigns' ? (
                      <StyledPrimaryButton
                        onClick={handleCreateCampaign}
                        type="button"
                      >
                        {tr(
                          creatingCampaign ? 'Creating...' : 'Create Campaign',
                        )}
                      </StyledPrimaryButton>
                    ) : null}
                    {currentViewKey === 'bounces' ? (
                      <StyledPrimaryButton
                        onClick={handleRecordBounceEvent}
                        type="button"
                      >
                        {tr(
                          recordingBounceEvent
                            ? 'Recording...'
                            : 'Record Bounce Event',
                        )}
                      </StyledPrimaryButton>
                    ) : null}
                    {currentViewKey === 'unsubscribes' ? (
                      <StyledPrimaryButton
                        onClick={handleRecordUnsubscribe}
                        type="button"
                      >
                        {tr(
                          recordingUnsubscribe
                            ? 'Recording...'
                            : 'Record Unsubscribe',
                        )}
                      </StyledPrimaryButton>
                    ) : null}
                    {currentViewKey === 'jobs' ? (
                      <>
                        <StyledPrimaryButton
                          onClick={handleStartSendJob}
                          type="button"
                        >
                          {tr(
                            startingSendJob
                              ? 'Preparing...'
                              : 'Prepare Sender Assignments',
                          )}
                        </StyledPrimaryButton>
                        <StyledPrimaryButton
                          onClick={handleExecuteSendJob}
                          type="button"
                        >
                          {tr(
                            executingSendJob
                              ? 'Executing...'
                              : 'Execute Prepared Tasks',
                          )}
                        </StyledPrimaryButton>
                      </>
                    ) : null}
                    {currentViewKey === 'analytics' ? (
                      <>
                        <StyledPrimaryButton
                          onClick={handleRecordAnalyticsEvent}
                          type="button"
                        >
                          {tr(
                            recordingEvent
                              ? 'Recording...'
                              : 'Record Analytics Event',
                          )}
                        </StyledPrimaryButton>
                        <StyledPrimaryButton
                          onClick={handleGenerateTrackingLinks}
                          type="button"
                        >
                          {tr(
                            loadingTrackingLinks
                              ? 'Generating...'
                              : 'Generate Signed Tracking URLs',
                          )}
                        </StyledPrimaryButton>
                      </>
                    ) : null}
                    {currentViewKey === 'reports' ? (
                      <>
                        <StyledPrimaryButton
                          onClick={handleGenerateReportExport}
                          type="button"
                        >
                          {tr(
                            loadingReportExport
                              ? 'Generating...'
                              : 'Generate CSV Export',
                          )}
                        </StyledPrimaryButton>
                        <StyledPrimaryButton
                          onClick={handleDownloadReportExport}
                          type="button"
                        >
                          {tr('Download CSV')}
                        </StyledPrimaryButton>
                      </>
                    ) : null}
                  </StyledButtonRow>
                ) : null}
                {currentViewKey === 'reports' && reportExportPreview ? (
                  <>
                    <StyledListMeta>
                      {tr(
                        `Export preview: ${reportExportFileName} · rows ${reportExportRowCount}`,
                      )}
                    </StyledListMeta>
                    <StyledTextArea readOnly value={reportExportPreview} />
                  </>
                ) : null}
                {currentViewKey === 'analytics' &&
                (openTrackingUrl || clickTrackingUrl) ? (
                  <>
                    {openTrackingUrl ? (
                      <>
                        <StyledListMeta>
                          {tr(
                            trackingLinksExpiresAt
                              ? `Open tracking URL - expires ${trackingLinksExpiresAt}`
                              : 'Open tracking URL',
                          )}
                        </StyledListMeta>
                        <StyledTextArea readOnly value={openTrackingUrl} />
                      </>
                    ) : null}
                    {clickTrackingUrl ? (
                      <>
                        <StyledListMeta>
                          {tr('Click tracking URL')}
                        </StyledListMeta>
                        <StyledTextArea readOnly value={clickTrackingUrl} />
                      </>
                    ) : null}
                  </>
                ) : null}
                {currentViewKey === 'jobs' && selectedSendJobSummary ? (
                  <>
                    <StyledSectionTitle>
                      {tr('Selected Job Summary')}
                    </StyledSectionTitle>
                    <StyledListMeta>
                      {tr(`Execution path: ${selectedSendJobExecutionMode}`)}
                    </StyledListMeta>
                    <StyledToolbarMeta>
                      <StyledBadge>
                        {tr(`Sender pool ${selectedSendJobSenderPoolMode}`)}
                      </StyledBadge>
                      <StyledBadge>
                        {tr(
                          `Executable senders ${selectedSendJobExecutableSenders}`,
                        )}
                      </StyledBadge>
                      <StyledBadge>
                        {tr(`Skipped senders ${selectedSendJobSkippedSenders}`)}
                      </StyledBadge>
                    </StyledToolbarMeta>
                    <StyledRuntimeNotice
                      $tone={isFallbackOnlySendJob ? 'warning' : 'neutral'}
                    >
                      <StyledListPrimary>
                        {tr(
                          isFallbackOnlySendJob
                            ? 'Simulation fallback is active'
                            : 'Live-capable sender pool is active',
                        )}
                      </StyledListPrimary>
                      <StyledListMeta>
                        {tr(
                          isFallbackOnlySendJob
                            ? 'This send job completed through internal simulation because the workspace has no connected mailbox with valid live-delivery credentials.'
                            : 'This send job had at least one connected mailbox that was ready for live delivery assignment.',
                        )}
                      </StyledListMeta>
                    </StyledRuntimeNotice>
                    <StyledButtonRow>
                      <StyledSecondaryButton
                        onClick={() =>
                          copyToClipboard(
                            selectedSendJobSummaryText,
                            tr('Job summary copied'),
                          )
                        }
                        type="button"
                      >
                        {tr('Copy job summary')}
                      </StyledSecondaryButton>
                    </StyledButtonRow>
                    <StyledMetrics>
                      {selectedSendJobSummary.metrics.map((metric) => (
                        <StyledMetricCard key={metric.label}>
                          <StyledMetricLabel>
                            {tr(metric.label)}
                          </StyledMetricLabel>
                          <StyledMetricValue>{metric.value}</StyledMetricValue>
                          <StyledMetricDescription>
                            {tr(metric.description)}
                          </StyledMetricDescription>
                        </StyledMetricCard>
                      ))}
                    </StyledMetrics>
                    <StyledList>
                      {selectedSendJobSummary.listItems.map((item) => (
                        <StyledListItem key={item.id}>
                          <StyledListCopy>
                            <StyledListPrimary>
                              {tr(item.primary)}
                            </StyledListPrimary>
                            <StyledListSecondary>
                              {tr(item.secondary)}
                            </StyledListSecondary>
                            <StyledListTertiary>
                              {tr(item.tertiary)}
                            </StyledListTertiary>
                            <StyledListMeta>{tr(item.meta)}</StyledListMeta>
                          </StyledListCopy>
                          <StyledStatus>{tr(item.status)}</StyledStatus>
                        </StyledListItem>
                      ))}
                    </StyledList>
                  </>
                ) : null}
                {currentViewKey === 'jobs' &&
                selectedSendJobId &&
                selectedSendTask ? (
                  <>
                    <StyledSectionTitle>
                      {tr('Selected Task Detail')}
                    </StyledSectionTitle>
                    <StyledMetrics>
                      <StyledMetricCard>
                        <StyledMetricLabel>
                          {tr('Task status')}
                        </StyledMetricLabel>
                        <StyledMetricValue>
                          {tr(selectedSendTask.status)}
                        </StyledMetricValue>
                        <StyledMetricDescription>
                          {tr(
                            `Current task lifecycle state for ${selectedSendTask.id.slice(
                              0,
                              8,
                            )}.`,
                          )}
                        </StyledMetricDescription>
                      </StyledMetricCard>
                      <StyledMetricCard>
                        <StyledMetricLabel>
                          {tr('Execution mode')}
                        </StyledMetricLabel>
                        <StyledMetricValue>
                          {selectedSendTaskExecutionMode}
                        </StyledMetricValue>
                        <StyledMetricDescription>
                          {tr(
                            'Shows whether the task ran through smtp-live, provider live, or fallback execution.',
                          )}
                        </StyledMetricDescription>
                      </StyledMetricCard>
                      <StyledMetricCard>
                        <StyledMetricLabel>
                          {tr('Provider message')}
                        </StyledMetricLabel>
                        <StyledMetricValue>
                          {selectedSendTask.providerMessageId ?? 'not set'}
                        </StyledMetricValue>
                        <StyledMetricDescription>
                          {tr(
                            'Real provider identifier when available; useful for webhook correlation and provider-side lookup.',
                          )}
                        </StyledMetricDescription>
                      </StyledMetricCard>
                    </StyledMetrics>
                    <StyledList>
                      <StyledListItem>
                        <StyledListCopy>
                          <StyledListPrimary>
                            {tr('Callback snapshot')}
                          </StyledListPrimary>
                          <StyledListSecondary>
                            {tr(
                              `Last callback ${selectedSendTaskLastCallbackType} via ${selectedSendTaskLastCallbackProvider}`,
                            )}
                          </StyledListSecondary>
                          <StyledListTertiary>
                            {tr(
                              `statusFromCallback ${selectedSendTaskStatusFromCallback} · sent ${
                                selectedSendTask.sentAt !== null
                                  ? formatToHumanReadableDate(
                                      selectedSendTask.sentAt,
                                    )
                                  : 'not recorded'
                              } · updated ${formatToHumanReadableDate(
                                selectedSendTask.updatedAt,
                              )}`,
                            )}
                          </StyledListTertiary>
                          <StyledListMeta>
                            {tr(
                              `Audience ${
                                selectedSendTask.audienceId ?? 'not linked'
                              } · Sender ${
                                selectedSendTask.connectedAccountId ??
                                'not assigned'
                              } · Last callback at ${
                                selectedSendTaskLastCallbackAt !== null
                                  ? formatToHumanReadableDate(
                                      selectedSendTaskLastCallbackAt,
                                    )
                                  : 'not recorded'
                              }`,
                            )}
                          </StyledListMeta>
                          {selectedSendTask.lastError ? (
                            <StyledErrorText>
                              {tr(selectedSendTask.lastError)}
                            </StyledErrorText>
                          ) : null}
                        </StyledListCopy>
                        <StyledStatus>
                          {tr(selectedSendTask.status)}
                        </StyledStatus>
                      </StyledListItem>
                    </StyledList>
                    <StyledCardGrid>
                      <StyledActionCard>
                        <StyledActionTitle>{tr('Identity')}</StyledActionTitle>
                        {selectedSendTaskIdentityDetails.map((item) => (
                          <StyledListMeta key={item.label}>
                            {tr(`${item.label}: ${item.value}`)}
                          </StyledListMeta>
                        ))}
                        <StyledButtonRow>
                          <StyledSecondaryButton
                            onClick={() =>
                              copyToClipboard(
                                selectedSendTask.id,
                                tr('Task id copied'),
                              )
                            }
                            type="button"
                          >
                            {tr('Copy task id')}
                          </StyledSecondaryButton>
                          {selectedSendTask.audienceId ? (
                            <StyledSecondaryButton
                              onClick={() =>
                                copyToClipboard(
                                  selectedSendTask.audienceId ?? '',
                                  tr('Audience id copied'),
                                )
                              }
                              type="button"
                            >
                              {tr('Copy audience id')}
                            </StyledSecondaryButton>
                          ) : null}
                          {selectedSendTask.campaignId ? (
                            <StyledSecondaryButton
                              onClick={() =>
                                copyToClipboard(
                                  selectedSendTask.campaignId ?? '',
                                  tr('Campaign id copied'),
                                )
                              }
                              type="button"
                            >
                              {tr('Copy campaign id')}
                            </StyledSecondaryButton>
                          ) : null}
                          {selectedSendTask.connectedAccountId ? (
                            <StyledSecondaryButton
                              onClick={() =>
                                copyToClipboard(
                                  selectedSendTask.connectedAccountId ?? '',
                                  tr('Sender account copied'),
                                )
                              }
                              type="button"
                            >
                              {tr('Copy sender account')}
                            </StyledSecondaryButton>
                          ) : null}
                        </StyledButtonRow>
                      </StyledActionCard>
                      <StyledActionCard>
                        <StyledActionTitle>{tr('Delivery')}</StyledActionTitle>
                        {selectedSendTaskDeliveryDetails.map((item) => (
                          <StyledListMeta key={item.label}>
                            {tr(`${item.label}: ${item.value}`)}
                          </StyledListMeta>
                        ))}
                        {selectedSendTask.providerMessageId ? (
                          <StyledSecondaryButton
                            onClick={() =>
                              copyToClipboard(
                                selectedSendTask.providerMessageId ?? '',
                                tr('Provider message id copied'),
                              )
                            }
                            type="button"
                          >
                            {tr('Copy provider message id')}
                          </StyledSecondaryButton>
                        ) : null}
                      </StyledActionCard>
                      <StyledActionCard>
                        <StyledActionTitle>{tr('Callback')}</StyledActionTitle>
                        {selectedSendTaskCallbackDetails.map((item) => (
                          <StyledListMeta key={item.label}>
                            {tr(`${item.label}: ${item.value}`)}
                          </StyledListMeta>
                        ))}
                        <StyledButtonRow>
                          {selectedSendTaskLastCallbackAt !== null ? (
                            <StyledSecondaryButton
                              onClick={() =>
                                copyToClipboard(
                                  selectedSendTaskLastCallbackAt,
                                  tr('Last callback timestamp copied'),
                                )
                              }
                              type="button"
                            >
                              {tr('Copy callback timestamp')}
                            </StyledSecondaryButton>
                          ) : null}
                          <StyledSecondaryButton
                            onClick={() =>
                              copyToClipboard(
                                selectedSendTaskCallbackSummary,
                                tr('Callback summary copied'),
                              )
                            }
                            type="button"
                          >
                            {tr('Copy callback summary')}
                          </StyledSecondaryButton>
                        </StyledButtonRow>
                      </StyledActionCard>
                      {selectedSendTaskMetadataDetails.length > 0 ? (
                        <StyledActionCard>
                          <StyledActionTitle>
                            {tr('Metadata')}
                          </StyledActionTitle>
                          {selectedSendTaskMetadataDetails.map((item) => (
                            <StyledListMeta key={item.label}>
                              {tr(`${item.label}: ${item.value}`)}
                            </StyledListMeta>
                          ))}
                        </StyledActionCard>
                      ) : null}
                      {selectedSendTask.lastError ? (
                        <StyledActionCard>
                          <StyledActionTitle>{tr('Error')}</StyledActionTitle>
                          <StyledErrorText>
                            {tr(selectedSendTask.lastError)}
                          </StyledErrorText>
                        </StyledActionCard>
                      ) : null}
                    </StyledCardGrid>
                    <StyledListMeta>{tr('Tracking snapshot')}</StyledListMeta>
                    <StyledButtonRow>
                      <StyledSecondaryButton
                        onClick={() =>
                          copyToClipboard(
                            selectedSendTaskTrackingSnapshotPreview,
                            tr('Tracking snapshot copied'),
                          )
                        }
                        type="button"
                      >
                        {tr('Copy tracking snapshot')}
                      </StyledSecondaryButton>
                    </StyledButtonRow>
                    <StyledTextArea
                      readOnly
                      value={selectedSendTaskTrackingSnapshotPreview}
                    />
                  </>
                ) : null}
                {currentViewKey === 'jobs' ? (
                  <>
                    <StyledListMeta>
                      {tr('Provider webhook endpoint')}
                    </StyledListMeta>
                    <StyledTextArea readOnly value={providerWebhookUrl} />
                    <StyledButtonRow>
                      <StyledSecondaryButton
                        onClick={() =>
                          copyToClipboard(
                            providerWebhookUrl,
                            tr('Provider webhook endpoint copied'),
                          )
                        }
                        type="button"
                      >
                        {tr('Copy webhook endpoint')}
                      </StyledSecondaryButton>
                    </StyledButtonRow>
                    <StyledListMeta>
                      {tr('Accepted auth and provider format headers')}
                    </StyledListMeta>
                    <StyledTextArea
                      readOnly
                      value={providerWebhookHeadersTemplate}
                    />
                    <StyledButtonRow>
                      <StyledSecondaryButton
                        onClick={() =>
                          copyToClipboard(
                            providerWebhookHeadersTemplate,
                            tr('Webhook headers template copied'),
                          )
                        }
                        type="button"
                      >
                        {tr('Copy headers template')}
                      </StyledSecondaryButton>
                    </StyledButtonRow>
                    <StyledFormGrid>
                      <StyledFormField>
                        {tr('Webhook payload format')}
                        <StyledSelect
                          onChange={(event) =>
                            setProviderWebhookFormat(
                              event.target.value as
                                | 'development-email'
                                | 'resend'
                                | 'ses-sns',
                            )
                          }
                          value={providerWebhookFormat}
                        >
                          <option value="development-email">
                            {tr('development-email')}
                          </option>
                          <option value="resend">{tr('resend')}</option>
                          <option value="ses-sns">{tr('ses-sns')}</option>
                        </StyledSelect>
                      </StyledFormField>
                    </StyledFormGrid>
                    <StyledButtonRow>
                      <StyledSecondaryButton
                        onClick={() =>
                          copyToClipboard(
                            providerWebhookFormat,
                            tr('Webhook payload format copied'),
                          )
                        }
                        type="button"
                      >
                        {tr('Copy payload format')}
                      </StyledSecondaryButton>
                    </StyledButtonRow>
                    <StyledListMeta>
                      {tr('Example provider callback payload')}
                    </StyledListMeta>
                    <StyledButtonRow>
                      <StyledSecondaryButton
                        onClick={() =>
                          copyToClipboard(
                            providerWebhookExample,
                            tr('Provider callback payload copied'),
                          )
                        }
                        type="button"
                      >
                        {tr('Copy payload example')}
                      </StyledSecondaryButton>
                    </StyledButtonRow>
                    <StyledTextArea readOnly value={providerWebhookExample} />
                    <StyledListMeta>
                      {tr('Example curl command')}
                    </StyledListMeta>
                    <StyledButtonRow>
                      <StyledSecondaryButton
                        onClick={() =>
                          copyToClipboard(
                            providerWebhookCurlExample,
                            tr('Webhook curl example copied'),
                          )
                        }
                        type="button"
                      >
                        {tr('Copy curl example')}
                      </StyledSecondaryButton>
                    </StyledButtonRow>
                    <StyledTextArea
                      readOnly
                      value={providerWebhookCurlExample}
                    />
                    <StyledListMeta>{tr('Signature notes')}</StyledListMeta>
                    <StyledButtonRow>
                      <StyledSecondaryButton
                        onClick={() =>
                          copyToClipboard(
                            providerWebhookSignatureNotes,
                            tr('Webhook signature notes copied'),
                          )
                        }
                        type="button"
                      >
                        {tr('Copy signature notes')}
                      </StyledSecondaryButton>
                    </StyledButtonRow>
                    <StyledTextArea
                      readOnly
                      value={providerWebhookSignatureNotes}
                    />
                    <StyledListMeta>
                      {tr(
                        'Provider format notes: resend now supports raw-body svix signature verification; ses-sns still expects an SNS envelope or SES event body with workspace headers.',
                      )}
                    </StyledListMeta>
                  </>
                ) : null}
                {currentViewKey === 'campaigns' ? (
                  <>
                    <StyledFormGrid>
                      <StyledFormField>
                        {tr('Queue Existing Campaign')}
                        <StyledSelect
                          onChange={(event) =>
                            setSelectedCampaignToQueueId(event.target.value)
                          }
                          value={selectedCampaignToQueueId}
                        >
                          <option value="">{tr('No campaign selected')}</option>
                          {availableCampaigns.map((campaign) => (
                            <option key={campaign.id} value={campaign.id}>
                              {`${campaign.name} - ${campaign.status}`}
                            </option>
                          ))}
                        </StyledSelect>
                      </StyledFormField>
                    </StyledFormGrid>
                    <StyledButtonRow>
                      <StyledPrimaryButton
                        onClick={handleQueueCampaign}
                        type="button"
                      >
                        {tr(
                          queueingCampaign
                            ? 'Queueing...'
                            : 'Generate Send Job',
                        )}
                      </StyledPrimaryButton>
                    </StyledButtonRow>
                  </>
                ) : null}
                {currentScope === 'campaign' &&
                currentViewKey === 'campaigns' ? (
                  <StyledMailWorkbench>
                    <StyledMailWorkbenchList>
                      <StyledMailPreviewLabel>
                        {tr('Campaign 列表')}
                      </StyledMailPreviewLabel>
                      {availableCampaigns.length > 0 ? (
                        availableCampaigns.map((campaign) => (
                          <StyledMailWorkbenchItem
                            $active={
                              campaign.id === selectedCampaignWorkbench?.id
                            }
                            key={campaign.id}
                            onClick={() => handleCampaignSelection(campaign.id)}
                            type="button"
                          >
                            <StyledMailWorkbenchHeader>
                              <StyledMailWorkbenchTitle>
                                {campaign.name}
                              </StyledMailWorkbenchTitle>
                              <StyledMailWorkbenchChip $tone="accent">
                                {tr(campaign.status)}
                              </StyledMailWorkbenchChip>
                            </StyledMailWorkbenchHeader>
                            <StyledMailWorkbenchMeta>
                              {tr(
                                campaign.scheduledAt
                                  ? `计划发送 ${formatToHumanReadableDate(campaign.scheduledAt)}`
                                  : '未设置发送时间',
                              )}
                            </StyledMailWorkbenchMeta>
                            <StyledMailWorkbenchMeta>
                              {tr(
                                campaign.templateId
                                  ? `模板 ${campaign.templateId}`
                                  : '尚未绑定模板',
                              )}
                            </StyledMailWorkbenchMeta>
                          </StyledMailWorkbenchItem>
                        ))
                      ) : (
                        <StyledMailPreviewBlock>
                          <StyledListMeta>
                            {tr(
                              '当前还没有开发信活动。先在上方创建一条 campaign。',
                            )}
                          </StyledListMeta>
                        </StyledMailPreviewBlock>
                      )}
                    </StyledMailWorkbenchList>
                    <StyledMailWorkbenchPreview>
                      <StyledMailPreviewTopbar>
                        <StyledMailPreviewTopbarCopy>
                          <StyledMailPreviewLabel>
                            {tr('活动执行面板')}
                          </StyledMailPreviewLabel>
                          <StyledMailPreviewTitle>
                            {selectedCampaignWorkbench?.name ??
                              tr('尚未选择 Campaign')}
                          </StyledMailPreviewTitle>
                        </StyledMailPreviewTopbarCopy>
                        {selectedCampaignWorkbench ? (
                          <StyledMailWorkbenchChip $tone="accent">
                            {tr(selectedCampaignWorkbench.status)}
                          </StyledMailWorkbenchChip>
                        ) : null}
                      </StyledMailPreviewTopbar>
                      <StyledMailPreviewBlock>
                        <StyledMailPreviewLabel>
                          {tr('活动摘要')}
                        </StyledMailPreviewLabel>
                        <StyledMailProfileGrid>
                          <StyledMailProfileItem>
                            <StyledMailProfileLabel>
                              {tr('发送时间')}
                            </StyledMailProfileLabel>
                            <StyledMailProfileValue>
                              {selectedCampaignWorkbench?.scheduledAt
                                ? formatToHumanReadableDate(
                                    selectedCampaignWorkbench.scheduledAt,
                                  )
                                : tr('未安排')}
                            </StyledMailProfileValue>
                          </StyledMailProfileItem>
                          <StyledMailProfileItem>
                            <StyledMailProfileLabel>
                              {tr('关联模板')}
                            </StyledMailProfileLabel>
                            <StyledMailProfileValue>
                              {selectedCampaignTemplate
                                ? tr(
                                    `${selectedCampaignTemplate.name} · v${selectedCampaignTemplate.version}`,
                                  )
                                : tr('未绑定模板')}
                            </StyledMailProfileValue>
                          </StyledMailProfileItem>
                          <StyledMailProfileItem>
                            <StyledMailProfileLabel>
                              {tr('生成作业')}
                            </StyledMailProfileLabel>
                            <StyledMailProfileValue>
                              {tr(
                                `${selectedCampaignSendJobs.length} 个 send job`,
                              )}
                            </StyledMailProfileValue>
                          </StyledMailProfileItem>
                          <StyledMailProfileItem>
                            <StyledMailProfileLabel>
                              {tr('当前状态')}
                            </StyledMailProfileLabel>
                            <StyledMailProfileValue>
                              {selectedCampaignWorkbench
                                ? tr(selectedCampaignWorkbench.status)
                                : tr('待创建')}
                            </StyledMailProfileValue>
                          </StyledMailProfileItem>
                        </StyledMailProfileGrid>
                      </StyledMailPreviewBlock>
                      <StyledCardGrid>
                        {renderedMetrics.slice(0, 3).map((metric) => (
                          <StyledActionCard key={metric.label}>
                            <StyledActionTitle>
                              {tr(metric.label)}
                            </StyledActionTitle>
                            <StyledMetricValue>
                              {metric.value}
                            </StyledMetricValue>
                            <StyledActionDescription>
                              {tr(metric.description)}
                            </StyledActionDescription>
                          </StyledActionCard>
                        ))}
                      </StyledCardGrid>
                      <StyledMailPreviewBlock>
                        <StyledMailPreviewLabel>
                          {tr('最近作业')}
                        </StyledMailPreviewLabel>
                        {selectedCampaignSendJobs.length > 0 ? (
                          <StyledMailAiList>
                            {selectedCampaignSendJobs
                              .slice(0, 3)
                              .map((sendJob) => (
                                <StyledMailAiItem key={sendJob.id}>
                                  <StyledMailAiIndex>
                                    {sendJob.sentCount}
                                  </StyledMailAiIndex>
                                  <div>
                                    <StyledListSecondary>
                                      {tr(
                                        `Job ${sendJob.id.slice(0, 8)} · ${sendJob.status}`,
                                      )}
                                    </StyledListSecondary>
                                    <StyledListMeta>
                                      {tr(
                                        `${sendJob.senderPoolMode ?? 'unknown mode'} · queued ${sendJob.queuedCount} · failed ${sendJob.failedCount}`,
                                      )}
                                    </StyledListMeta>
                                  </div>
                                </StyledMailAiItem>
                              ))}
                          </StyledMailAiList>
                        ) : (
                          <StyledListMeta>
                            {tr('当前活动还没有生成发送作业。')}
                          </StyledListMeta>
                        )}
                      </StyledMailPreviewBlock>
                      <StyledMailPreviewBlock>
                        <StyledMailPreviewLabel>
                          {tr('发件池健康度')}
                        </StyledMailPreviewLabel>
                        {senderHealthGroups.length > 0 ? (
                          <StyledMailAiList>
                            {senderHealthGroups
                              .slice(0, 3)
                              .map(([provider, items]) => (
                                <StyledMailAiItem key={provider}>
                                  <StyledMailAiIndex>
                                    {items.length}
                                  </StyledMailAiIndex>
                                  <div>
                                    <StyledListSecondary>
                                      {tr(`Provider ${provider}`)}
                                    </StyledListSecondary>
                                    <StyledListMeta>
                                      {tr(
                                        items[0]?.tertiary ??
                                          'No issue recorded',
                                      )}
                                    </StyledListMeta>
                                  </div>
                                </StyledMailAiItem>
                              ))}
                          </StyledMailAiList>
                        ) : (
                          <StyledListMeta>
                            {tr('当前没有发件健康告警。')}
                          </StyledListMeta>
                        )}
                      </StyledMailPreviewBlock>
                    </StyledMailWorkbenchPreview>
                  </StyledMailWorkbench>
                ) : null}
                {currentScope === 'campaign' && currentViewKey === 'jobs' ? (
                  <StyledMailWorkbench>
                    <StyledMailWorkbenchList>
                      <StyledMailPreviewLabel>
                        {tr('Send Queue')}
                      </StyledMailPreviewLabel>
                      {filteredAvailableSendJobs.map((sendJob) => (
                        <StyledMailWorkbenchItem
                          $active={sendJob.id === activeSendJobWorkbench?.id}
                          key={sendJob.id}
                          onClick={() => handleSendJobSelection(sendJob.id)}
                          type="button"
                        >
                          <StyledMailWorkbenchHeader>
                            <StyledMailWorkbenchTitle>
                              {tr(`Job ${sendJob.id.slice(0, 8)}`)}
                            </StyledMailWorkbenchTitle>
                            <StyledMailWorkbenchChip $tone="accent">
                              {tr(sendJob.status)}
                            </StyledMailWorkbenchChip>
                          </StyledMailWorkbenchHeader>
                          <StyledMailWorkbenchMeta>
                            {tr(
                              `${sendJob.executionMode ?? 'not recorded'} · ${sendJob.senderPoolMode ?? 'unknown sender pool'}`,
                            )}
                          </StyledMailWorkbenchMeta>
                          <StyledMailWorkbenchMeta>
                            {tr(
                              `queued ${sendJob.queuedCount} · sent ${sendJob.sentCount} · failed ${sendJob.failedCount}`,
                            )}
                          </StyledMailWorkbenchMeta>
                        </StyledMailWorkbenchItem>
                      ))}
                    </StyledMailWorkbenchList>
                    <StyledMailWorkbenchPreview>
                      <StyledMailPreviewTopbar>
                        <StyledMailPreviewTopbarCopy>
                          <StyledMailPreviewLabel>
                            {tr('作业详情')}
                          </StyledMailPreviewLabel>
                          <StyledMailPreviewTitle>
                            {activeSendJobWorkbench
                              ? tr(
                                  `Job ${activeSendJobWorkbench.id.slice(0, 8)}`,
                                )
                              : tr('当前没有可用作业')}
                          </StyledMailPreviewTitle>
                        </StyledMailPreviewTopbarCopy>
                        {activeSendJobWorkbench ? (
                          <StyledMailWorkbenchSummaryRow>
                            <StyledMailWorkbenchChip $tone="accent">
                              {tr(activeSendJobWorkbench.status)}
                            </StyledMailWorkbenchChip>
                            <StyledMailWorkbenchChip>
                              {tr(
                                activeSendJobWorkbench.senderPoolMode ??
                                  'unknown sender pool',
                              )}
                            </StyledMailWorkbenchChip>
                          </StyledMailWorkbenchSummaryRow>
                        ) : null}
                      </StyledMailPreviewTopbar>
                      <StyledMailPreviewBlock>
                        <StyledMailPreviewLabel>
                          {tr('执行摘要')}
                        </StyledMailPreviewLabel>
                        <StyledMailProfileGrid>
                          <StyledMailProfileItem>
                            <StyledMailProfileLabel>
                              {tr('排队中')}
                            </StyledMailProfileLabel>
                            <StyledMailProfileValue>
                              {activeSendJobWorkbench?.queuedCount ?? 0}
                            </StyledMailProfileValue>
                          </StyledMailProfileItem>
                          <StyledMailProfileItem>
                            <StyledMailProfileLabel>
                              {tr('已发送')}
                            </StyledMailProfileLabel>
                            <StyledMailProfileValue>
                              {activeSendJobWorkbench?.sentCount ?? 0}
                            </StyledMailProfileValue>
                          </StyledMailProfileItem>
                          <StyledMailProfileItem>
                            <StyledMailProfileLabel>
                              {tr('失败')}
                            </StyledMailProfileLabel>
                            <StyledMailProfileValue>
                              {activeSendJobWorkbench?.failedCount ?? 0}
                            </StyledMailProfileValue>
                          </StyledMailProfileItem>
                          <StyledMailProfileItem>
                            <StyledMailProfileLabel>
                              {tr('开始时间')}
                            </StyledMailProfileLabel>
                            <StyledMailProfileValue>
                              {activeSendJobWorkbench?.startedAt
                                ? formatToHumanReadableDate(
                                    activeSendJobWorkbench.startedAt,
                                  )
                                : tr('未执行')}
                            </StyledMailProfileValue>
                          </StyledMailProfileItem>
                        </StyledMailProfileGrid>
                      </StyledMailPreviewBlock>
                      <StyledButtonRow>
                        <StyledPrimaryButton
                          onClick={handleStartSendJob}
                          type="button"
                        >
                          {tr(
                            startingSendJob
                              ? 'Preparing...'
                              : 'Prepare Sender Assignments',
                          )}
                        </StyledPrimaryButton>
                        <StyledPrimaryButton
                          onClick={handleExecuteSendJob}
                          type="button"
                        >
                          {tr(
                            executingSendJob
                              ? 'Executing...'
                              : 'Execute Prepared Tasks',
                          )}
                        </StyledPrimaryButton>
                      </StyledButtonRow>
                      {selectedSendJobSummary ? (
                        <>
                          <StyledMetrics>
                            {selectedSendJobSummary.metrics
                              .slice(0, 4)
                              .map((metric) => (
                                <StyledMetricCard key={metric.label}>
                                  <StyledMetricLabel>
                                    {tr(metric.label)}
                                  </StyledMetricLabel>
                                  <StyledMetricValue>
                                    {metric.value}
                                  </StyledMetricValue>
                                  <StyledMetricDescription>
                                    {tr(metric.description)}
                                  </StyledMetricDescription>
                                </StyledMetricCard>
                              ))}
                          </StyledMetrics>
                          <StyledMailPreviewBlock>
                            <StyledMailPreviewLabel>
                              {tr('任务样本')}
                            </StyledMailPreviewLabel>
                            <StyledMailAiList>
                              {selectedSendJobSummary.listItems
                                .slice(0, 4)
                                .map((item) => (
                                  <StyledMailAiItem key={item.id}>
                                    <StyledMailAiIndex>•</StyledMailAiIndex>
                                    <div>
                                      <StyledListSecondary>
                                        {tr(item.primary)}
                                      </StyledListSecondary>
                                      <StyledListMeta>
                                        {tr(
                                          `${item.secondary} · ${item.status}`,
                                        )}
                                      </StyledListMeta>
                                    </div>
                                  </StyledMailAiItem>
                                ))}
                            </StyledMailAiList>
                          </StyledMailPreviewBlock>
                        </>
                      ) : null}
                      {sendTasks.length > 0 ? (
                        <StyledMailPreviewBlock>
                          <StyledMailPreviewLabel>
                            {tr('回调任务')}
                          </StyledMailPreviewLabel>
                          <StyledMailAiList>
                            {sendTasks.slice(0, 4).map((sendTask) => (
                              <StyledMailAiButton
                                $active={sendTask.id === selectedSendTask?.id}
                                key={sendTask.id}
                                onClick={() =>
                                  handleSendTaskSelection(sendTask.id)
                                }
                                type="button"
                              >
                                <StyledMailAiIndex>
                                  {sendTask.retryCount}
                                </StyledMailAiIndex>
                                <div>
                                  <StyledListSecondary>
                                    {tr(
                                      `${sendTask.status} · ${sendTask.audienceId ?? 'no audience'}`,
                                    )}
                                  </StyledListSecondary>
                                  <StyledListMeta>
                                    {tr(
                                      `callback ${selectedSendTaskLastCallbackType} · provider ${sendTask.providerMessageId ?? 'not set'}`,
                                    )}
                                  </StyledListMeta>
                                </div>
                              </StyledMailAiButton>
                            ))}
                          </StyledMailAiList>
                        </StyledMailPreviewBlock>
                      ) : null}
                    </StyledMailWorkbenchPreview>
                  </StyledMailWorkbench>
                ) : null}
                {currentScope === 'campaign' &&
                currentViewKey === 'analytics' ? (
                  <StyledMailWorkbench>
                    <StyledMailWorkbenchList>
                      <StyledMailPreviewLabel>
                        {tr('最近事件')}
                      </StyledMailPreviewLabel>
                      {filteredRenderedListItems.length > 0 ? (
                        filteredRenderedListItems.slice(0, 6).map((item) => (
                          <StyledMailWorkbenchItem
                            $active={item.id === analyticsPrimaryRecord?.id}
                            key={item.id}
                            type="button"
                          >
                            <StyledMailWorkbenchHeader>
                              <StyledMailWorkbenchTitle>
                                {tr(item.primary)}
                              </StyledMailWorkbenchTitle>
                              <StyledMailWorkbenchChip $tone="accent">
                                {tr(item.status)}
                              </StyledMailWorkbenchChip>
                            </StyledMailWorkbenchHeader>
                            <StyledMailWorkbenchMeta>
                              {tr(item.secondary)}
                            </StyledMailWorkbenchMeta>
                            <StyledMailWorkbenchMeta>
                              {tr(item.meta)}
                            </StyledMailWorkbenchMeta>
                          </StyledMailWorkbenchItem>
                        ))
                      ) : (
                        <StyledMailPreviewBlock>
                          <StyledListMeta>
                            {tr('当前还没有分析事件。先记录打开、点击或回复。')}
                          </StyledListMeta>
                        </StyledMailPreviewBlock>
                      )}
                    </StyledMailWorkbenchList>
                    <StyledMailWorkbenchPreview>
                      <StyledMailPreviewTopbar>
                        <StyledMailPreviewTopbarCopy>
                          <StyledMailPreviewLabel>
                            {tr('分析概览')}
                          </StyledMailPreviewLabel>
                          <StyledMailPreviewTitle>
                            {analyticsPrimaryRecord?.primary ??
                              tr('Analytics 工作台')}
                          </StyledMailPreviewTitle>
                        </StyledMailPreviewTopbarCopy>
                        <StyledMailWorkbenchChip $tone="accent">
                          {tr('Live analytics')}
                        </StyledMailWorkbenchChip>
                      </StyledMailPreviewTopbar>
                      <StyledMetrics>
                        {renderedMetrics.slice(0, 4).map((metric) => (
                          <StyledMetricCard key={metric.label}>
                            <StyledMetricLabel>
                              {tr(metric.label)}
                            </StyledMetricLabel>
                            <StyledMetricValue>
                              {metric.value}
                            </StyledMetricValue>
                            <StyledMetricDescription>
                              {tr(metric.description)}
                            </StyledMetricDescription>
                          </StyledMetricCard>
                        ))}
                      </StyledMetrics>
                      <StyledMailPreviewBlock>
                        <StyledMailPreviewLabel>
                          {tr('当前重点事件')}
                        </StyledMailPreviewLabel>
                        <StyledListPrimary>
                          {tr(
                            analyticsPrimaryRecord?.secondary ??
                              '等待新的送达、打开或点击事件',
                          )}
                        </StyledListPrimary>
                        <StyledListTertiary>
                          {tr(
                            analyticsPrimaryRecord?.tertiary ??
                              '生成签名追踪链接后，这里会优先显示关键事件摘要。',
                          )}
                        </StyledListTertiary>
                        <StyledListMeta>
                          {tr(
                            analyticsPrimaryRecord?.meta ??
                              '开发信分析会把打开、点击、回复、退订与投诉串回同一个活动上下文。',
                          )}
                        </StyledListMeta>
                      </StyledMailPreviewBlock>
                      {openTrackingUrl || clickTrackingUrl ? (
                        <StyledMailPreviewBlock>
                          <StyledMailPreviewLabel>
                            {tr('追踪链接')}
                          </StyledMailPreviewLabel>
                          {openTrackingUrl ? (
                            <StyledTextArea readOnly value={openTrackingUrl} />
                          ) : null}
                          {clickTrackingUrl ? (
                            <StyledTextArea readOnly value={clickTrackingUrl} />
                          ) : null}
                        </StyledMailPreviewBlock>
                      ) : (
                        <StyledRuntimeNotice $tone="neutral">
                          <StyledListPrimary>
                            {tr('追踪链接尚未生成')}
                          </StyledListPrimary>
                          <StyledListMeta>
                            {tr(
                              '使用上方 Analytics 表单输入收件人和目标链接后，即可生成签名追踪地址。',
                            )}
                          </StyledListMeta>
                        </StyledRuntimeNotice>
                      )}
                      {analyticsSecondaryRecords.length > 0 ? (
                        <StyledMailPreviewBlock>
                          <StyledMailPreviewLabel>
                            {tr('次级事件')}
                          </StyledMailPreviewLabel>
                          <StyledMailAiList>
                            {analyticsSecondaryRecords.map((item, index) => (
                              <StyledMailAiItem key={item.id}>
                                <StyledMailAiIndex>
                                  {index + 1}
                                </StyledMailAiIndex>
                                <div>
                                  <StyledListSecondary>
                                    {tr(item.primary)}
                                  </StyledListSecondary>
                                  <StyledListMeta>
                                    {tr(`${item.secondary} · ${item.status}`)}
                                  </StyledListMeta>
                                </div>
                              </StyledMailAiItem>
                            ))}
                          </StyledMailAiList>
                        </StyledMailPreviewBlock>
                      ) : null}
                    </StyledMailWorkbenchPreview>
                  </StyledMailWorkbench>
                ) : null}
                {loading ? (
                  <StyledListMeta>
                    {tr(
                      'Loading connected inboxes, folders, and recent thread buckets...',
                    )}
                  </StyledListMeta>
                ) : null}
                {hasNoFilteredSendJobs ? (
                  <StyledRuntimeNotice $tone="warning">
                    <StyledListPrimary>
                      {tr('No jobs match the current filters')}
                    </StyledListPrimary>
                    <StyledListMeta>
                      {tr(
                        'Adjust sender pool mode or job status filters to inspect other send-job cohorts.',
                      )}
                    </StyledListMeta>
                  </StyledRuntimeNotice>
                ) : null}
                {currentScope === 'campaign' &&
                currentViewKey === 'sender-pool' ? (
                  <>
                    <StyledRuntimeNotice
                      $tone={
                        senderPoolModeMetric === 'fallback-only'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      <StyledListPrimary>
                        {tr(
                          senderPoolModeMetric === 'fallback-only'
                            ? 'Sender pool is fallback-only'
                            : 'Sender pool has live-ready capacity',
                        )}
                      </StyledListPrimary>
                      <StyledListMeta>
                        {tr(
                          senderPoolModeMetric === 'fallback-only'
                            ? `No connected sender is currently eligible for live delivery. Executable ${executableSendersMetric}, skipped ${skippedSendersMetric}, healthy channels ${healthySenderChannelsMetric}.`
                            : `Live delivery can use ${executableSendersMetric} sender account(s). Skipped ${skippedSendersMetric}, healthy channels ${healthySenderChannelsMetric}.`,
                        )}
                      </StyledListMeta>
                    </StyledRuntimeNotice>
                    <StyledButtonRow>
                      <StyledActionLink to={senderPoolAccountsPath}>
                        {tr('Open email accounts')}
                      </StyledActionLink>
                      <StyledActionLink to={senderPoolDomainsPath}>
                        {tr('Open domain settings')}
                      </StyledActionLink>
                      <StyledActionLink to={senderPoolJobsPath}>
                        {tr('Open send queue')}
                      </StyledActionLink>
                    </StyledButtonRow>
                    {campaignWorkspacePrimaryItems.length > 0 ? (
                      <>
                        <StyledSectionTitle>
                          {tr('Related Campaigns')}
                        </StyledSectionTitle>
                        <StyledList>
                          {campaignWorkspacePrimaryItems.map((item) => (
                            <StyledListItem key={item.id}>
                              <StyledListCopy>
                                <StyledListPrimary>
                                  {tr(item.primary)}
                                </StyledListPrimary>
                                <StyledListSecondary>
                                  {tr(item.secondary)}
                                </StyledListSecondary>
                                <StyledListTertiary>
                                  {tr(item.tertiary)}
                                </StyledListTertiary>
                                <StyledListMeta>{tr(item.meta)}</StyledListMeta>
                              </StyledListCopy>
                              <StyledStatus>{tr(item.status)}</StyledStatus>
                            </StyledListItem>
                          ))}
                        </StyledList>
                      </>
                    ) : null}
                    {senderHealthGroups.length > 0 ? (
                      <>
                        <StyledSectionTitle>
                          {tr('Providers')}
                        </StyledSectionTitle>
                        {senderHealthGroups.map(([provider, items]) => (
                          <StyledList key={provider}>
                            <StyledSubsectionTitle>
                              {tr(`Provider ${provider} (${items.length})`)}
                            </StyledSubsectionTitle>
                            {items.map((item) => {
                              const senderHealthReason =
                                getSenderHealthReasonParts(item.tertiary);

                              return (
                                <StyledListItem key={item.id}>
                                  <StyledListCopy>
                                    <StyledListPrimary>
                                      {tr(item.primary)}
                                    </StyledListPrimary>
                                    <StyledListSecondary>
                                      {tr(item.secondary)}
                                    </StyledListSecondary>
                                    <StyledListTertiary>
                                      {tr(senderHealthReason.message)}
                                    </StyledListTertiary>
                                    {senderHealthReason.code ? (
                                      <StyledListMeta>
                                        {tr(senderHealthReason.code)}
                                      </StyledListMeta>
                                    ) : null}
                                    <StyledListMeta>
                                      {tr(item.meta)}
                                    </StyledListMeta>
                                  </StyledListCopy>
                                  <StyledListActions>
                                    <StyledStatus>
                                      {tr(item.status)}
                                    </StyledStatus>
                                    {getSenderHealthActions({
                                      secondary: item.secondary,
                                      reasonCode: senderHealthReason.code,
                                    }).map((action) => (
                                      <StyledActionLink
                                        key={`${item.id}-${action.label}`}
                                        to={action.to}
                                      >
                                        {action.label}
                                      </StyledActionLink>
                                    ))}
                                  </StyledListActions>
                                </StyledListItem>
                              );
                            })}
                          </StyledList>
                        ))}
                      </>
                    ) : null}
                  </>
                ) : null}
                {currentScope === 'campaign' &&
                currentViewKey === 'overview' &&
                campaignWorkspaceHealthItems.length > 0 ? (
                  <>
                    <StyledSectionTitle>
                      {tr('Sender Health')}
                    </StyledSectionTitle>
                    <StyledRuntimeNotice $tone="warning">
                      <StyledListPrimary>
                        {tr('Credential blockers are isolated here')}
                      </StyledListPrimary>
                      <StyledListMeta>
                        {tr(
                          'Sender readiness rows are separated from campaign entries so mailbox credential gaps remain visible before queue execution begins.',
                        )}
                      </StyledListMeta>
                    </StyledRuntimeNotice>
                    {senderHealthGroups.map(([provider, items]) => (
                      <StyledList key={provider}>
                        <StyledSubsectionTitle>
                          {tr(`Provider ${provider} (${items.length})`)}
                        </StyledSubsectionTitle>
                        {items.map((item) => {
                          const senderHealthReason = getSenderHealthReasonParts(
                            item.tertiary,
                          );

                          return (
                            <StyledListItem key={item.id}>
                              <StyledListCopy>
                                <StyledListPrimary>
                                  {tr(item.primary)}
                                </StyledListPrimary>
                                <StyledListSecondary>
                                  {tr(item.secondary)}
                                </StyledListSecondary>
                                <StyledListTertiary>
                                  {tr(senderHealthReason.message)}
                                </StyledListTertiary>
                                {senderHealthReason.code ? (
                                  <StyledListMeta>
                                    {tr(senderHealthReason.code)}
                                  </StyledListMeta>
                                ) : null}
                                <StyledListMeta>{tr(item.meta)}</StyledListMeta>
                              </StyledListCopy>
                              <StyledListActions>
                                <StyledStatus>{tr(item.status)}</StyledStatus>
                                {getSenderHealthActions({
                                  secondary: item.secondary,
                                  reasonCode: senderHealthReason.code,
                                }).map((action) => (
                                  <StyledActionLink
                                    key={`${item.id}-${action.label}`}
                                    to={action.to}
                                  >
                                    {action.label}
                                  </StyledActionLink>
                                ))}
                              </StyledListActions>
                            </StyledListItem>
                          );
                        })}
                      </StyledList>
                    ))}
                  </>
                ) : null}
                {isMailboxWorkbenchView ? (
                  <StyledMailWorkbench>
                    <StyledMailWorkbenchList>
                      <StyledMailWorkbenchListHeader>
                        <div>{tr('发件人')}</div>
                        <div>{tr('主题与摘要')}</div>
                        <div>{tr('时间 / 状态')}</div>
                      </StyledMailWorkbenchListHeader>
                      {filteredRenderedListItems.map((item) => (
                        <StyledMailWorkbenchItem
                          $active={
                            item.threadId ===
                            selectedMailboxPreviewItem?.threadId
                          }
                          key={item.id}
                          onClick={() =>
                            item.threadId
                              ? handlePreviewThreadSelection(item.threadId)
                              : undefined
                          }
                          type="button"
                        >
                          <StyledMailWorkbenchRow>
                            <StyledMailSenderCell>
                              {tr(item.primary)}
                            </StyledMailSenderCell>
                            <StyledMailSubjectCell>
                              <StyledMailWorkbenchTitle>
                                {tr(item.secondary)}
                              </StyledMailWorkbenchTitle>
                              <StyledListTertiary>
                                {tr(item.tertiary)}
                              </StyledListTertiary>
                            </StyledMailSubjectCell>
                            <StyledMailTimeCell>
                              <div>{tr(item.meta)}</div>
                              <StyledMailWorkbenchSummaryRow>
                                <StyledMailWorkbenchChip $tone="accent">
                                  {tr(item.status)}
                                </StyledMailWorkbenchChip>
                                {item.tags?.length ? (
                                  <StyledMailWorkbenchChip>
                                    {tr(`标签 ${item.tags.length}`)}
                                  </StyledMailWorkbenchChip>
                                ) : null}
                              </StyledMailWorkbenchSummaryRow>
                            </StyledMailTimeCell>
                          </StyledMailWorkbenchRow>
                        </StyledMailWorkbenchItem>
                      ))}
                    </StyledMailWorkbenchList>
                    <StyledMailWorkbenchPreview>
                      {selectedMailboxPreviewItem ? (
                        <>
                          <StyledMailPreviewTopbar>
                            <StyledMailPreviewTopbarCopy>
                              <StyledMailPreviewLabel>
                                {tr('线程面板')}
                              </StyledMailPreviewLabel>
                              <StyledMailPreviewTitle>
                                {tr(mailboxSelectedThreadTitle)}
                              </StyledMailPreviewTitle>
                            </StyledMailPreviewTopbarCopy>
                            <StyledMailWorkbenchSummaryRow>
                              <StyledMailWorkbenchChip $tone="accent">
                                {tr(selectedMailboxPreviewItem.status)}
                              </StyledMailWorkbenchChip>
                              {selectedMailboxHasTags ? (
                                <StyledMailWorkbenchChip>
                                  {tr('已打标签')}
                                </StyledMailWorkbenchChip>
                              ) : (
                                <StyledMailWorkbenchChip>
                                  {tr('待补标签')}
                                </StyledMailWorkbenchChip>
                              )}
                            </StyledMailWorkbenchSummaryRow>
                          </StyledMailPreviewTopbar>
                          <StyledMailPreviewBlock>
                            <StyledMailPreviewLabel>
                              {tr('当前线程')}
                            </StyledMailPreviewLabel>
                            <StyledListPrimary>
                              {tr(mailboxSelectedCustomerName)}
                            </StyledListPrimary>
                            <StyledListMeta>
                              {tr(mailboxSelectedThreadMeta)}
                            </StyledListMeta>
                          </StyledMailPreviewBlock>
                          <StyledMailPreviewBlock>
                            <StyledMailPreviewLabel>
                              {tr('邮件摘要')}
                            </StyledMailPreviewLabel>
                            <StyledListTertiary>
                              {tr(mailboxSelectedThreadSummary)}
                            </StyledListTertiary>
                          </StyledMailPreviewBlock>
                          <StyledMailPreviewSideStack>
                            <StyledMailPreviewBlock>
                              <StyledMailPreviewLabel>
                                {tr('客户档案')}
                              </StyledMailPreviewLabel>
                              <StyledMailProfileGrid>
                                <StyledMailProfileItem>
                                  <StyledMailProfileLabel>
                                    {tr('客户名称')}
                                  </StyledMailProfileLabel>
                                  <StyledMailProfileValue>
                                    {tr(mailboxSelectedCustomerName)}
                                  </StyledMailProfileValue>
                                </StyledMailProfileItem>
                                <StyledMailProfileItem>
                                  <StyledMailProfileLabel>
                                    {tr('当前分组')}
                                  </StyledMailProfileLabel>
                                  <StyledMailProfileValue>
                                    {tr(currentViewItem.label)}
                                  </StyledMailProfileValue>
                                </StyledMailProfileItem>
                                <StyledMailProfileItem>
                                  <StyledMailProfileLabel>
                                    {tr('处理状态')}
                                  </StyledMailProfileLabel>
                                  <StyledMailProfileValue>
                                    {tr(selectedMailboxPreviewItem.status)}
                                  </StyledMailProfileValue>
                                </StyledMailProfileItem>
                                <StyledMailProfileItem>
                                  <StyledMailProfileLabel>
                                    {tr('最近动作')}
                                  </StyledMailProfileLabel>
                                  <StyledMailProfileValue>
                                    {tr(mailboxSelectedThreadMeta)}
                                  </StyledMailProfileValue>
                                </StyledMailProfileItem>
                              </StyledMailProfileGrid>
                            </StyledMailPreviewBlock>
                            <StyledMailPreviewBlock>
                              <StyledMailPreviewLabel>
                                {tr('AI 处理建议')}
                              </StyledMailPreviewLabel>
                              <StyledMailAiList>
                                {mailboxSelectedAssistantSuggestions.map(
                                  (suggestion, index) => (
                                    <StyledMailAiItem
                                      key={`${selectedMailboxPreviewItem.id}-${index}`}
                                    >
                                      <StyledMailAiIndex>
                                        {index + 1}
                                      </StyledMailAiIndex>
                                      <StyledListSecondary>
                                        {tr(suggestion)}
                                      </StyledListSecondary>
                                    </StyledMailAiItem>
                                  ),
                                )}
                              </StyledMailAiList>
                            </StyledMailPreviewBlock>
                          </StyledMailPreviewSideStack>
                          <StyledButtonRow>
                            {selectedMailboxPreviewItem.threadId ? (
                              <StyledSecondaryButton
                                onClick={() =>
                                  openEmailThreadInSidePanel(
                                    selectedMailboxPreviewItem.threadId ?? '',
                                  )
                                }
                                type="button"
                              >
                                {tr('打开线程')}
                              </StyledSecondaryButton>
                            ) : null}
                            {selectedMailboxPreviewItem.threadId ? (
                              <StyledSecondaryButton
                                onClick={() =>
                                  handleUpdateThreadPendingState({
                                    threadId:
                                      selectedMailboxPreviewItem.threadId ?? '',
                                    isPending: currentViewKey !== 'pending',
                                  })
                                }
                                type="button"
                              >
                                {tr(
                                  currentViewKey === 'pending'
                                    ? '清除待处理'
                                    : '标记待处理',
                                )}
                              </StyledSecondaryButton>
                            ) : null}
                          </StyledButtonRow>
                        </>
                      ) : (
                        <StyledMailPreviewBlock>
                          <StyledMailPreviewLabel>
                            {tr('当前线程')}
                          </StyledMailPreviewLabel>
                          <StyledListMeta>
                            {tr('当前筛选条件下没有可预览的邮件线程。')}
                          </StyledListMeta>
                        </StyledMailPreviewBlock>
                      )}
                    </StyledMailWorkbenchPreview>
                  </StyledMailWorkbench>
                ) : isPendingActionQueueView ? (
                  <StyledMailWorkbench>
                    <StyledMailWorkbenchList>
                      <StyledMailWorkbenchListHeader>
                        <div>{tr('客户 / 线程')}</div>
                        <div>{tr('待处理原因')}</div>
                        <div>{tr('更新时间 / 状态')}</div>
                      </StyledMailWorkbenchListHeader>
                      {filteredRenderedListItems.map((item) => (
                        <StyledMailWorkbenchItem
                          $active={item.id === selectedPendingPreviewItem?.id}
                          key={item.id}
                          onClick={() =>
                            item.threadId
                              ? handlePreviewThreadSelection(item.threadId)
                              : undefined
                          }
                          type="button"
                        >
                          <StyledMailWorkbenchRow>
                            <StyledMailSenderCell>
                              {tr(item.primary)}
                            </StyledMailSenderCell>
                            <StyledMailSubjectCell>
                              <StyledMailWorkbenchTitle>
                                {tr(item.secondary)}
                              </StyledMailWorkbenchTitle>
                              <StyledListTertiary>
                                {tr(item.pendingReason ?? item.tertiary)}
                              </StyledListTertiary>
                            </StyledMailSubjectCell>
                            <StyledMailTimeCell>
                              <div>
                                {tr(
                                  item.pendingUpdatedAt
                                    ? formatToHumanReadableDate(
                                        item.pendingUpdatedAt,
                                      )
                                    : item.meta,
                                )}
                              </div>
                              <StyledMailWorkbenchSummaryRow>
                                <StyledMailWorkbenchChip $tone="accent">
                                  {tr(item.status)}
                                </StyledMailWorkbenchChip>
                              </StyledMailWorkbenchSummaryRow>
                            </StyledMailTimeCell>
                          </StyledMailWorkbenchRow>
                        </StyledMailWorkbenchItem>
                      ))}
                    </StyledMailWorkbenchList>
                    <StyledMailWorkbenchPreview>
                      {selectedPendingPreviewItem ? (
                        <>
                          <StyledMailPreviewTopbar>
                            <StyledMailPreviewTopbarCopy>
                              <StyledMailPreviewLabel>
                                {tr('待处理邮件面板')}
                              </StyledMailPreviewLabel>
                              <StyledMailPreviewTitle>
                                {tr(pendingSelectedThreadTitle)}
                              </StyledMailPreviewTitle>
                            </StyledMailPreviewTopbarCopy>
                            <StyledMailWorkbenchSummaryRow>
                              <StyledMailWorkbenchChip $tone="accent">
                                {tr(selectedPendingPreviewItem.status)}
                              </StyledMailWorkbenchChip>
                              <StyledMailWorkbenchChip>
                                {tr(pendingSelectedReason)}
                              </StyledMailWorkbenchChip>
                            </StyledMailWorkbenchSummaryRow>
                          </StyledMailPreviewTopbar>
                          <StyledMailPreviewBlock>
                            <StyledMailPreviewLabel>
                              {tr('当前客户')}
                            </StyledMailPreviewLabel>
                            <StyledListPrimary>
                              {tr(pendingSelectedCustomerName)}
                            </StyledListPrimary>
                            <StyledListMeta>
                              {tr(pendingSelectedThreadMeta)}
                            </StyledListMeta>
                          </StyledMailPreviewBlock>
                          <StyledMailPreviewBlock>
                            <StyledMailPreviewLabel>
                              {tr('邮件摘要')}
                            </StyledMailPreviewLabel>
                            <StyledListTertiary>
                              {tr(pendingSelectedThreadSummary)}
                            </StyledListTertiary>
                          </StyledMailPreviewBlock>
                          <StyledMailPreviewSideStack>
                            <StyledMailPreviewBlock>
                              <StyledMailPreviewLabel>
                                {tr('待处理信息')}
                              </StyledMailPreviewLabel>
                              <StyledMailProfileGrid>
                                <StyledMailProfileItem>
                                  <StyledMailProfileLabel>
                                    {tr('待处理原因')}
                                  </StyledMailProfileLabel>
                                  <StyledMailProfileValue>
                                    {tr(pendingSelectedReason)}
                                  </StyledMailProfileValue>
                                </StyledMailProfileItem>
                                <StyledMailProfileItem>
                                  <StyledMailProfileLabel>
                                    {tr('最后更新')}
                                  </StyledMailProfileLabel>
                                  <StyledMailProfileValue>
                                    {tr(pendingSelectedUpdatedAt)}
                                  </StyledMailProfileValue>
                                </StyledMailProfileItem>
                                <StyledMailProfileItem>
                                  <StyledMailProfileLabel>
                                    {tr('当前视图')}
                                  </StyledMailProfileLabel>
                                  <StyledMailProfileValue>
                                    {tr(currentViewItem.label)}
                                  </StyledMailProfileValue>
                                </StyledMailProfileItem>
                                  <StyledMailProfileItem>
                                    <StyledMailProfileLabel>
                                      {tr('建议去向')}
                                    </StyledMailProfileLabel>
                                    <StyledMailProfileValue>
                                      {tr(pendingSuggestedDestination)}
                                    </StyledMailProfileValue>
                                  </StyledMailProfileItem>
                                </StyledMailProfileGrid>
                              </StyledMailPreviewBlock>
                            <StyledMailPreviewBlock>
                              <StyledMailPreviewLabel>
                                {tr('AI 处理建议')}
                              </StyledMailPreviewLabel>
                              <StyledMailAiList>
                                {pendingSelectedSuggestions.map(
                                  (suggestion, index) => (
                                    <StyledMailAiItem
                                      key={`${selectedPendingPreviewItem.id}-${index}`}
                                    >
                                      <StyledMailAiIndex>
                                        {index + 1}
                                      </StyledMailAiIndex>
                                      <StyledListSecondary>
                                        {tr(suggestion)}
                                      </StyledListSecondary>
                                    </StyledMailAiItem>
                                  ),
                                )}
                              </StyledMailAiList>
                            </StyledMailPreviewBlock>
                          </StyledMailPreviewSideStack>
                          <StyledButtonRow>
                            {selectedPendingPreviewItem.threadId ? (
                              <StyledSecondaryButton
                                onClick={() =>
                                  openEmailThreadInSidePanel(
                                    selectedPendingPreviewItem.threadId ?? '',
                                  )
                                }
                                type="button"
                              >
                                {tr('打开线程')}
                              </StyledSecondaryButton>
                            ) : null}
                            {selectedPendingPreviewItem.threadId ? (
                              <StyledSecondaryButton
                                onClick={() =>
                                  handleUpdateThreadPendingState({
                                    threadId:
                                      selectedPendingPreviewItem.threadId ?? '',
                                    isPending: false,
                                  })
                                }
                                type="button"
                              >
                                {tr('清除待处理')}
                              </StyledSecondaryButton>
                            ) : null}
                            {pendingTaskRecordPath ? (
                              <StyledActionLink to={pendingTaskRecordPath}>
                                {tr('打开跟进任务')}
                              </StyledActionLink>
                            ) : null}
                            <StyledSecondaryButton
                              onClick={() => void handleCreatePendingTask()}
                              type="button"
                            >
                              {tr(
                                pendingTaskRecordPath
                                  ? '新增跟进任务'
                                  : '创建跟进任务',
                              )}
                            </StyledSecondaryButton>
                            <StyledActionLink to={pendingPrimaryActionPath}>
                              {tr(pendingPrimaryActionLabel)}
                            </StyledActionLink>
                            <StyledActionLink to={pendingSecondaryActionPath}>
                              {tr(pendingSecondaryActionLabel)}
                            </StyledActionLink>
                          </StyledButtonRow>
                          </>
                      ) : (
                        <StyledMailPreviewBlock>
                          <StyledMailPreviewLabel>
                            {tr('待处理邮件面板')}
                          </StyledMailPreviewLabel>
                          <StyledListMeta>
                            {tr('当前筛选条件下没有待处理邮件。')}
                          </StyledListMeta>
                        </StyledMailPreviewBlock>
                      )}
                    </StyledMailWorkbenchPreview>
                  </StyledMailWorkbench>
                ) : isCustomerWorkbenchView ? (
                  <StyledMailWorkbench $relationshipView>
                    <StyledMailWorkbenchList>
                      <StyledMailWorkbenchListHeader>
                        <div>{tr(relationshipListPrimaryLabel)}</div>
                        <div>{tr(relationshipListMetaLabel)}</div>
                        <div>{tr(relationshipStatusLabel)}</div>
                      </StyledMailWorkbenchListHeader>
                      {filteredRenderedListItems.map((item) => (
                        <StyledMailWorkbenchItem
                          $active={item.id === selectedCustomerPreviewItem?.id}
                          key={item.id}
                          onClick={() =>
                            handlePreviewCustomerSelection(item.id)
                          }
                          type="button"
                        >
                          <StyledMailWorkbenchRow>
                            <StyledMailSenderCell>
                              {tr(item.primary)}
                            </StyledMailSenderCell>
                            <StyledMailSubjectCell>
                              <StyledMailWorkbenchTitle>
                                {tr(item.secondary)}
                              </StyledMailWorkbenchTitle>
                              <StyledListTertiary>
                                {tr(item.tertiary)}
                              </StyledListTertiary>
                            </StyledMailSubjectCell>
                            <StyledMailTimeCell>
                              <div>{tr(item.meta)}</div>
                              <StyledMailWorkbenchSummaryRow>
                                <StyledMailWorkbenchChip $tone="accent">
                                  {tr(item.status)}
                                </StyledMailWorkbenchChip>
                              </StyledMailWorkbenchSummaryRow>
                            </StyledMailTimeCell>
                          </StyledMailWorkbenchRow>
                        </StyledMailWorkbenchItem>
                      ))}
                    </StyledMailWorkbenchList>
                    <StyledMailWorkbenchPreview $relationshipView>
                      {selectedCustomerPreviewItem ? (
                        <>
                          <StyledMailPreviewTopbar>
                            <StyledMailPreviewTopbarCopy>
                              <StyledMailPreviewLabel>
                                {tr(relationshipWorkbenchTitle)}
                              </StyledMailPreviewLabel>
                              <StyledMailPreviewTitle>
                                {tr(customerSelectedName)}
                              </StyledMailPreviewTitle>
                            </StyledMailPreviewTopbarCopy>
                            <StyledMailWorkbenchSummaryRow>
                              <StyledMailWorkbenchChip $tone="accent">
                                {tr(selectedCustomerPreviewItem.status)}
                              </StyledMailWorkbenchChip>
                              <StyledMailWorkbenchChip>
                                {tr(currentViewItem.label)}
                              </StyledMailWorkbenchChip>
                            </StyledMailWorkbenchSummaryRow>
                          </StyledMailPreviewTopbar>
                          <StyledMailRelationshipPreviewGrid>
                            <StyledMailRelationshipDetailStack>
                              <StyledMailPreviewBlock>
                                <StyledMailPreviewLabel>
                                  {tr('邮件详情')}
                                </StyledMailPreviewLabel>
                                <StyledMailPreviewTitle>
                                  {tr(customerSelectedLatestThread)}
                                </StyledMailPreviewTitle>
                                <StyledListMeta>
                                  {tr(customerSelectedMeta)}
                                </StyledListMeta>
                                <StyledMailTagRow>
                                  {relationshipTags.map((tag) => (
                                    <StyledMailTag key={tag}>
                                      {tr(tag)}
                                    </StyledMailTag>
                                  ))}
                                </StyledMailTagRow>
                                <StyledMailQuote>
                                  {tr(relationshipDetailBody)}
                                </StyledMailQuote>
                              </StyledMailPreviewBlock>
                              <StyledMailPreviewBlock>
                                <StyledMailPreviewLabel>
                                  {tr('处理动作')}
                                </StyledMailPreviewLabel>
                                <StyledButtonRow>
                                  {customerSelectedThreadId ? (
                                    <StyledSecondaryButton
                                      onClick={() =>
                                        openEmailThreadInSidePanel(
                                          customerSelectedThreadId,
                                        )
                                      }
                                      type="button"
                                    >
                                      {tr('打开线程')}
                                    </StyledSecondaryButton>
                                  ) : null}
                                  <StyledActionLink
                                    to={relationshipActionPrimaryPath}
                                  >
                                    {tr(relationshipActionPrimaryLabel)}
                                  </StyledActionLink>
                                  <StyledActionLink
                                    to={relationshipActionSecondaryPath}
                                  >
                                    {tr(relationshipActionSecondaryLabel)}
                                  </StyledActionLink>
                                  <StyledActionLink
                                    to={getTradeCrmMailPath({
                                      scope: 'mail',
                                      view: 'search',
                                    })}
                                  >
                                    {tr('查看相关邮件')}
                                  </StyledActionLink>
                                </StyledButtonRow>
                              </StyledMailPreviewBlock>
                            </StyledMailRelationshipDetailStack>
                            <StyledMailPreviewSideStack>
                              <StyledMailPreviewBlock>
                                <StyledMailPreviewLabel>
                                  {tr(relationshipRecordLabel)}
                                </StyledMailPreviewLabel>
                                <StyledMailProfileGrid>
                                  <StyledMailProfileItem>
                                    <StyledMailProfileLabel>
                                      {tr(relationshipNameLabel)}
                                    </StyledMailProfileLabel>
                                    <StyledMailProfileValue>
                                      {tr(customerSelectedName)}
                                    </StyledMailProfileValue>
                                  </StyledMailProfileItem>
                                  <StyledMailProfileItem>
                                    <StyledMailProfileLabel>
                                      {tr(relationshipGroupLabel)}
                                    </StyledMailProfileLabel>
                                    <StyledMailProfileValue>
                                      {tr(currentViewItem.label)}
                                    </StyledMailProfileValue>
                                  </StyledMailProfileItem>
                                  <StyledMailProfileItem>
                                    <StyledMailProfileLabel>
                                      {tr('最近动作')}
                                    </StyledMailProfileLabel>
                                    <StyledMailProfileValue>
                                      {tr(customerSelectedMeta)}
                                    </StyledMailProfileValue>
                                  </StyledMailProfileItem>
                                  <StyledMailProfileItem>
                                    <StyledMailProfileLabel>
                                      {tr('跟进状态')}
                                    </StyledMailProfileLabel>
                                    <StyledMailProfileValue>
                                      {tr(selectedCustomerPreviewItem.status)}
                                    </StyledMailProfileValue>
                                  </StyledMailProfileItem>
                                </StyledMailProfileGrid>
                              </StyledMailPreviewBlock>
                              <StyledMailPreviewBlock>
                                <StyledMailAssistantTabs>
                                  {relationshipAssistantTabs.map(
                                    (assistantTab, index) => (
                                      <StyledMailAssistantTab
                                        data-active={
                                          index === 0 ? 'true' : 'false'
                                        }
                                        key={assistantTab}
                                        type="button"
                                      >
                                        {tr(assistantTab)}
                                      </StyledMailAssistantTab>
                                    ),
                                  )}
                                </StyledMailAssistantTabs>
                                <StyledMailPreviewLabel>
                                  {tr(
                                    isSubordinateWorkbenchView
                                      ? 'AI 管理建议'
                                      : 'AI 销售助手',
                                  )}
                                </StyledMailPreviewLabel>
                                <StyledMailAiList>
                                  {relationshipSuggestions.map(
                                    (suggestion, index) => (
                                      <StyledMailAiItem
                                        key={`${selectedCustomerPreviewItem.id}-${index}`}
                                      >
                                        <StyledMailAiIndex>
                                          {index + 1}
                                        </StyledMailAiIndex>
                                        <StyledListSecondary>
                                          {tr(suggestion)}
                                        </StyledListSecondary>
                                      </StyledMailAiItem>
                                    ),
                                  )}
                                </StyledMailAiList>
                              </StyledMailPreviewBlock>
                            </StyledMailPreviewSideStack>
                          </StyledMailRelationshipPreviewGrid>
                          <StyledButtonRow>
                            <StyledMailWorkbenchChip $tone="accent">
                              {tr(isSubordinateWorkbenchView ? 'Manager Review' : 'Customer Conversation')}
                            </StyledMailWorkbenchChip>
                            <StyledMailWorkbenchChip>
                              {tr(selectedCustomerPreviewItem.threadId ? 'Thread linked' : 'Summary only')}
                            </StyledMailWorkbenchChip>
                          </StyledButtonRow>
                        </>
                      ) : (
                        <StyledMailPreviewBlock>
                          <StyledMailPreviewLabel>
                            {tr(relationshipWorkbenchTitle)}
                          </StyledMailPreviewLabel>
                          <StyledListMeta>
                            {tr(
                              isSubordinateWorkbenchView
                                ? '当前分组下没有可预览的下属邮件。'
                                : '当前分组下没有可预览的客户。',
                            )}
                          </StyledListMeta>
                          {isSubordinateWorkbenchView ? null : (
                            <StyledButtonRow>
                              <StyledActionLink
                                to={getTradeCrmScopedViewPath(
                                  tradeCrmRouteMap.mail,
                                  'search',
                                )}
                              >
                                {tr('去邮件搜索补关联')}
                              </StyledActionLink>
                              <StyledActionLink
                                to={getTradeCrmCustomerPath('list')}
                              >
                                {tr('打开客户工作台')}
                              </StyledActionLink>
                            </StyledButtonRow>
                          )}
                        </StyledMailPreviewBlock>
                      )}
                    </StyledMailWorkbenchPreview>
                  </StyledMailWorkbench>
                ) : isFolderManagementView ? (
                  <StyledMailWorkbench>
                    <StyledMailWorkbenchList>
                      <StyledMailWorkbenchListHeader>
                        <div>{tr('文件夹')}</div>
                        <div>{tr('同步与可见性')}</div>
                        <div>{tr('状态')}</div>
                      </StyledMailWorkbenchListHeader>
                      {filteredRenderedListItems.map((item) => (
                        <StyledMailWorkbenchItem
                          $active={item.id === selectedPreviewCustomerId}
                          key={item.id}
                          onClick={() =>
                            handlePreviewCustomerSelection(item.id)
                          }
                          type="button"
                        >
                          <StyledMailWorkbenchRow>
                            <StyledMailSenderCell>
                              {tr(item.primary)}
                            </StyledMailSenderCell>
                            <StyledMailSubjectCell>
                              <StyledMailWorkbenchTitle>
                                {tr(item.secondary)}
                              </StyledMailWorkbenchTitle>
                              <StyledListTertiary>
                                {tr(item.tertiary)}
                              </StyledListTertiary>
                            </StyledMailSubjectCell>
                            <StyledMailTimeCell>
                              <div>{tr(item.meta)}</div>
                              <StyledMailWorkbenchSummaryRow>
                                <StyledMailWorkbenchChip $tone="accent">
                                  {tr(item.status)}
                                </StyledMailWorkbenchChip>
                              </StyledMailWorkbenchSummaryRow>
                            </StyledMailTimeCell>
                          </StyledMailWorkbenchRow>
                        </StyledMailWorkbenchItem>
                      ))}
                    </StyledMailWorkbenchList>
                    <StyledMailWorkbenchPreview>
                      <StyledMailPreviewTopbar>
                        <StyledMailPreviewTopbarCopy>
                          <StyledMailPreviewLabel>
                            {tr('文件夹与标签管理')}
                          </StyledMailPreviewLabel>
                          <StyledMailPreviewTitle>
                            {tr('管理文件夹树、同步范围与邮件分类规则')}
                          </StyledMailPreviewTitle>
                        </StyledMailPreviewTopbarCopy>
                        <StyledMailWorkbenchSummaryRow>
                          <StyledMailWorkbenchChip $tone="accent">
                            {tr(`${rootFolders.length} folders`)}
                          </StyledMailWorkbenchChip>
                          <StyledMailWorkbenchChip>
                            {tr(`${filteredRenderedListItems.length} visible`)}
                          </StyledMailWorkbenchChip>
                        </StyledMailWorkbenchSummaryRow>
                      </StyledMailPreviewTopbar>
                      <StyledMailPreviewBlock>
                        <StyledMailPreviewLabel>
                          {tr('文件夹树')}
                        </StyledMailPreviewLabel>
                        {rootFolders.length > 0 ? (
                          <TradeCrmMailFolderTree folderTreeNodes={rootFolders} />
                        ) : (
                          <StyledListMeta>
                            {tr(
                              'No synced folders are available yet, or the primary inbox has not completed initialization.',
                            )}
                          </StyledListMeta>
                        )}
                      </StyledMailPreviewBlock>
                      <StyledMailPreviewSideStack>
                        <StyledMailPreviewBlock>
                          <StyledMailPreviewLabel>
                            {tr('标签与归类规则')}
                          </StyledMailPreviewLabel>
                          <StyledMailAiList>
                            {[
                              '重点客户、报价阶段、异常同步应优先形成标签规则。',
                              '文件夹负责来源归档，标签负责业务语义，不要混成一层。',
                              '批量移动和标签应立即回写到客户与商机检索条件里。',
                            ].map((suggestion, index) => (
                              <StyledMailAiItem key={`folder-ai-${index}`}>
                                <StyledMailAiIndex>{index + 1}</StyledMailAiIndex>
                                <StyledListSecondary>
                                  {tr(suggestion)}
                                </StyledListSecondary>
                              </StyledMailAiItem>
                            ))}
                          </StyledMailAiList>
                        </StyledMailPreviewBlock>
                      </StyledMailPreviewSideStack>
                      <StyledButtonRow>
                        <StyledActionLink
                          to={getSettingsPath(SettingsPath.AccountsEmails)}
                        >
                          {tr('打开邮箱账号')}
                        </StyledActionLink>
                        <StyledActionLink
                          to={getTradeCrmMailPath({
                            scope: 'mail',
                            view: 'tagged',
                          })}
                        >
                          {tr('查看标签邮件')}
                        </StyledActionLink>
                      </StyledButtonRow>
                    </StyledMailWorkbenchPreview>
                  </StyledMailWorkbench>
                ) : !(
                    currentScope === 'campaign' &&
                    ['sender-pool', 'campaigns', 'jobs', 'analytics'].includes(
                      currentViewKey,
                    )
                  ) ? (
                  <StyledList>
                    {filteredRenderedListItems.map((item) =>
                      item.threadId &&
                      (currentViewKey === 'inbox' ||
                        currentViewKey === 'sent' ||
                        currentViewKey === 'unread' ||
                        currentViewKey === 'pending' ||
                        currentViewKey === 'tagged' ||
                        currentViewKey === 'search') ? (
                        <StyledListItem key={item.id}>
                          <StyledListCopy>
                            <StyledListPrimary>
                              {tr(item.primary)}
                            </StyledListPrimary>
                            <StyledListSecondary>
                              {tr(item.secondary)}
                            </StyledListSecondary>
                            <StyledListTertiary>
                              {tr(item.tertiary)}
                            </StyledListTertiary>
                            <StyledListMeta>{tr(item.meta)}</StyledListMeta>
                          </StyledListCopy>
                          <StyledListActions>
                            <StyledStatus>{tr(item.status)}</StyledStatus>
                            <StyledSecondaryButton
                              onClick={() =>
                                openEmailThreadInSidePanel(item.threadId ?? '')
                              }
                              type="button"
                            >
                              {tr('打开线程')}
                            </StyledSecondaryButton>
                            <StyledSecondaryButton
                              onClick={() =>
                                handleUpdateThreadPendingState({
                                  threadId: item.threadId ?? '',
                                  isPending: currentViewKey !== 'pending',
                                })
                              }
                              type="button"
                            >
                              {tr(
                                updatingTradeCrmMailThreadState
                                  ? '更新中...'
                                  : currentViewKey === 'pending'
                                    ? '清除待处理'
                                    : '标记待处理',
                              )}
                            </StyledSecondaryButton>
                            <StyledSecondaryButton
                              onClick={() => {
                                if (
                                  currentViewKey === 'tagged' ||
                                  (item.tags?.length ?? 0) > 0
                                ) {
                                  void handleUpdateThreadTag({
                                    threadId: item.threadId ?? '',
                                    mode: 'CLEAR_ALL',
                                  });

                                  return;
                                }

                                handleOpenThreadTagEditor(item.threadId ?? '');
                              }}
                              type="button"
                            >
                              {tr(
                                updatingTradeCrmMailThreadTag
                                  ? '更新标签中...'
                                  : currentViewKey === 'tagged' ||
                                      (item.tags?.length ?? 0) > 0
                                    ? '清空标签'
                                    : '添加标签',
                              )}
                            </StyledSecondaryButton>
                            {activeTagEditorThreadId === item.threadId ? (
                              <StyledInlineActionForm>
                                <StyledInput
                                  onChange={(event) =>
                                    setThreadTagDraft(event.target.value)
                                  }
                                  placeholder={tr('important-customer')}
                                  value={threadTagDraft}
                                />
                                <StyledInlineActionRow>
                                  <StyledPrimaryButton
                                    onClick={() =>
                                      handleUpdateThreadTag({
                                        threadId: item.threadId ?? '',
                                        mode: 'ADD',
                                        tag: threadTagDraft.trim(),
                                      })
                                    }
                                    type="button"
                                  >
                                    {tr(
                                      updatingTradeCrmMailThreadTag
                                        ? 'Saving...'
                                        : 'Save tag',
                                    )}
                                  </StyledPrimaryButton>
                                  <StyledSecondaryButton
                                    onClick={handleCancelThreadTagEditor}
                                    type="button"
                                  >
                                    {tr('Cancel')}
                                  </StyledSecondaryButton>
                                </StyledInlineActionRow>
                              </StyledInlineActionForm>
                            ) : null}
                          </StyledListActions>
                        </StyledListItem>
                      ) : item.href ? (
                        <StyledListItemLink key={item.id} to={item.href}>
                          <StyledListCopy>
                            <StyledListPrimary>
                              {tr(item.primary)}
                            </StyledListPrimary>
                            <StyledListSecondary>
                              {tr(item.secondary)}
                            </StyledListSecondary>
                            <StyledListTertiary>
                              {tr(item.tertiary)}
                            </StyledListTertiary>
                            <StyledListMeta>{tr(item.meta)}</StyledListMeta>
                          </StyledListCopy>
                          <StyledStatus>{tr(item.status)}</StyledStatus>
                        </StyledListItemLink>
                      ) : (
                        <StyledListItem key={item.id}>
                          <StyledListCopy>
                            <StyledListPrimary>
                              {tr(item.primary)}
                            </StyledListPrimary>
                            <StyledListSecondary>
                              {tr(item.secondary)}
                            </StyledListSecondary>
                            <StyledListTertiary>
                              {tr(item.tertiary)}
                            </StyledListTertiary>
                            <StyledListMeta>{tr(item.meta)}</StyledListMeta>
                          </StyledListCopy>
                          <StyledStatus>{tr(item.status)}</StyledStatus>
                        </StyledListItem>
                      ),
                    )}
                  </StyledList>
                ) : null}
              </StyledPanel>
              {shouldRenderNarrativeMetrics ? (
                <StyledPanel>
                  <StyledSectionTitle>{tr('Key Entries')}</StyledSectionTitle>
                  <StyledCardGrid>
                    {workspace.actionCards.map((card) => (
                      <StyledActionCard key={card.title}>
                        <StyledActionTitle>{tr(card.title)}</StyledActionTitle>
                        <StyledActionDescription>
                          {tr(card.description)}
                        </StyledActionDescription>
                        {card.to ? (
                          <StyledActionLink to={card.to}>
                            {tr(card.actionLabel ?? 'Open')}
                          </StyledActionLink>
                        ) : null}
                      </StyledActionCard>
                    ))}
                  </StyledCardGrid>
                </StyledPanel>
              ) : null}
            </StyledMainColumn>
            {!shouldHideInsightRail ? (
              <RecordInsightPanel
                title={tr(insightPanelCopy.title)}
                description={tr(insightPanelCopy.description)}
                items={getInsightItems(currentScope).map((item) => ({
                  ...item,
                  label: tr(item.label),
                  value: tr(item.value),
                  description: tr(item.description),
                }))}
              />
            ) : null}
          </StyledWorkspace>
        </StyledContent>
        <TradeCrmAiDock
          context={{
            workspace: workspace.label,
            entityType: currentScope,
            channel: 'email',
            stage: currentViewKey,
            summaryText: [
              `Scope: ${workspace.label}`,
              `Current view: ${currentViewItem.label}`,
              currentScope === 'subordinate'
                ? 'Current focus: review subordinate reply quality, handoff delays, and coaching pressure.'
                : currentScope === 'customer'
                  ? 'Current focus: keep customer communication tied to relationship and opportunity follow-up.'
                  : currentScope === 'campaign'
                    ? 'Current focus: manage outbound audiences, sender health, and execution risk in one workspace.'
                    : isFolderManagementView
                      ? 'Current focus: keep folder hierarchy, sync scope, and mail tagging rules clean and searchable.'
                      : 'Current focus: move inbox work into customer, opportunity, and task execution with minimal friction.',
              'Guardrail: AI can summarize and draft, but cannot auto-send or mutate CRM status.',
            ].join('\n'),
          }}
        />
      </MainContainerLayoutWithSidePanel>
    </PageContainer>
  );
};
