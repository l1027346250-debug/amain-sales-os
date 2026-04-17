import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

import { MainContainerLayoutWithSidePanel } from '@/object-record/components/MainContainerLayoutWithSidePanel';
import { TradeCrmMailFolderTree } from '@/trade-crm/mail/components/TradeCrmMailFolderTree';
import {
  getTradeCrmMailSidebarLink,
  getTradeCrmMailWorkspace,
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
import { useTradeCrmMailWorkspaceData } from '@/trade-crm/mail/hooks/useTradeCrmMailWorkspaceData';
import {
  TRADE_CRM_MAIL_SCOPE_ORDER,
  getTradeCrmMailPath,
  type TradeCrmMailScopeKey,
} from '@/trade-crm/mail/navigation/trade-crm-mail-navigation';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useOpenEmailThreadInSidePanel } from '@/side-panel/hooks/useOpenEmailThreadInSidePanel';
import {
  type RecordInsightItem,
  RecordInsightPanel,
} from '@/trade-crm/shared/components/RecordInsightPanel';
import { TradeCrmAiDock } from '@/trade-crm/shared/components/TradeCrmAiDock';
import { TradeCrmLocaleSwitch } from '@/trade-crm/shared/components/TradeCrmLocaleSwitch';
import { useTradeCrmLocale } from '@/trade-crm/shared/hooks/useTradeCrmLocale';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { formatToHumanReadableDate } from '~/utils/date-utils';

const StyledContent = styled.div`
  background: ${tradeCrmUiTheme.colors.page};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  min-height: 100%;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledHero = styled.section`
  background: radial-gradient(
      circle at top right,
      rgba(28, 28, 28, 0.04),
      transparent 26%
    ),
    linear-gradient(
      180deg,
      ${tradeCrmUiTheme.colors.surface},
      ${tradeCrmUiTheme.colors.page}
    );
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[5]};
`;

const StyledScopeTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledScopeTab = styled(Link)<{ $active: boolean }>`
  background: ${({ $active }) =>
    $active ? tradeCrmUiTheme.colors.ink : tradeCrmUiTheme.colors.surface};
  border: 1px solid
    ${({ $active }) =>
      $active ? tradeCrmUiTheme.colors.ink : tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${({ $active }) =>
    $active ? tradeCrmUiTheme.colors.surface : tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]};
  text-decoration: none;
`;

const StyledHeroGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.8fr);

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
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const StyledHeroTitle = styled.h2`
  color: ${tradeCrmUiTheme.colors.ink};
  font-family: ${tradeCrmUiTheme.typography.display};
  font-size: 34px;
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1.08;
  margin: 0;
`;

const StyledHeroDescription = styled.p`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  line-height: 1.7;
  margin: 0;
  max-width: 840px;
`;

const StyledHeroSummary = styled.div`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.card};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledHeroSummaryTitle = styled.div`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const StyledHeroSummaryValue = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: 28px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledHeroSummaryText = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

const StyledWorkspace = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: 280px minmax(0, 1fr) 320px;

  @media (max-width: 1220px) {
    grid-template-columns: 1fr;
  }
`;

const StyledSidebar = styled.aside`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
  position: sticky;
  top: ${themeCssVariables.spacing[4]};
`;

const StyledSidebarTitle = styled.div`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.04em;
`;

const StyledSidebarList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledSidebarSection = styled.div`
  border-top: 1px solid ${tradeCrmUiTheme.colors.border};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding-top: ${themeCssVariables.spacing[2]};
`;

const StyledSidebarSectionLabel = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const StyledSidebarLink = styled(Link)<{ $active: boolean }>`
  background: ${({ $active }) =>
    $active
      ? tradeCrmUiTheme.colors.surfaceMuted
      : tradeCrmUiTheme.colors.surface};
  border: 1px solid
    ${({ $active }) =>
      $active
        ? tradeCrmUiTheme.colors.borderStrong
        : tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[3]};
  text-decoration: none;
`;

const StyledSidebarLabelRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledSidebarLabel = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledSidebarCount = styled.div`
  color: ${tradeCrmUiTheme.colors.inkFaint};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledSidebarHint = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
`;

const StyledMainColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledPanel = styled.section`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledToolbar = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: minmax(0, 1fr) auto;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const StyledSearchInput = styled.div`
  background: ${tradeCrmUiTheme.colors.page};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.inkSoft};
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
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledRuntimeNotice = styled.div<{ $tone?: 'warning' | 'neutral' }>`
  background: ${({ $tone }) =>
    $tone === 'warning'
      ? 'rgba(180, 35, 24, 0.06)'
      : tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'warning'
        ? 'rgba(180, 35, 24, 0.18)'
        : tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.card};
  color: ${({ $tone }) =>
    $tone === 'warning' ? '#7a271a' : tradeCrmUiTheme.colors.inkMuted};
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
  background: ${tradeCrmUiTheme.colors.page};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.card};
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

export const TradeCrmMailPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSendJobId = searchParams.get('jobId') ?? undefined;
  const selectedSendTaskId = searchParams.get('taskId') ?? undefined;
  const sendJobModeFilter = searchParams.get('jobMode') ?? 'all';
  const sendJobStatusFilter = searchParams.get('jobStatus') ?? 'all';
  const mailSearchQuery = searchParams.get('q') ?? '';
  const mailTagFilter = searchParams.get('tag') ?? '';
  const mailReceivedAtFrom = searchParams.get('from') ?? '';
  const mailReceivedAtTo = searchParams.get('to') ?? '';
  const { tr } = useTradeCrmLocale();
  const { copyToClipboard } = useCopyToClipboard();
  const { openEmailThreadInSidePanel } = useOpenEmailThreadInSidePanel();
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
  const [getDevelopmentEmailReportExport, { loading: loadingReportExport }] =
    useLazyQuery<{
      getDevelopmentEmailReportExport: {
        fileName: string;
        csvContent: string;
        rowCount: number;
      };
    }>(GET_DEVELOPMENT_EMAIL_REPORT_EXPORT, {
      fetchPolicy: 'network-only',
      onCompleted: (data) => {
        setReportExportFileName(data.getDevelopmentEmailReportExport.fileName);
        setReportExportPreview(data.getDevelopmentEmailReportExport.csvContent);
        setReportExportRowCount(data.getDevelopmentEmailReportExport.rowCount);
      },
    });
  const [getDevelopmentEmailTrackingLinks, { loading: loadingTrackingLinks }] =
    useLazyQuery<{
      getDevelopmentEmailTrackingLinks: {
        openTrackingUrl: string;
        clickTrackingUrl: string;
        expiresAt: string;
      };
    }>(GET_DEVELOPMENT_EMAIL_TRACKING_LINKS, {
      fetchPolicy: 'network-only',
      onCompleted: (data) => {
        setSignedOpenTrackingUrl(
          data.getDevelopmentEmailTrackingLinks.openTrackingUrl,
        );
        setSignedClickTrackingUrl(
          data.getDevelopmentEmailTrackingLinks.clickTrackingUrl,
        );
        setTrackingLinksExpiresAt(
          data.getDevelopmentEmailTrackingLinks.expiresAt,
        );
      },
    });
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

  const currentScope = getCurrentScope(searchParams.get('scope'));
  const workspace = getTradeCrmMailWorkspace(currentScope);
  const currentViewKey = getCurrentView({
    requestedView: searchParams.get('view'),
    availableViewKeys: workspace.sidebarItems.map((item) => item.key),
    fallbackViewKey: workspace.defaultViewKey,
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
  const renderedListItems =
    recentThreads.length > 0 ? recentThreads : workspace.listItems;
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
      return [{ label: tr('Reconnect Google token'), to: senderPoolAccountsPath }];
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

  return (
    <PageContainer>
      <PageHeader title={tr('Mail')}>
        <TradeCrmLocaleSwitch />
      </PageHeader>
      <MainContainerLayoutWithSidePanel>
        <StyledContent>
          <StyledHero>
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
                    $active={scopeKey === currentScope}
                  >
                    {tr(scopeWorkspace.label)}
                  </StyledScopeTab>
                );
              })}
            </StyledScopeTabs>
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
                  {tr('Current View')}
                </StyledHeroSummaryTitle>
                <StyledHeroSummaryValue>
                  {tr(currentViewItem.label)}
                </StyledHeroSummaryValue>
                <StyledHeroSummaryText>
                  {tr(
                    'This workspace is being rebuilt into a real operating surface. The next layers connect thread queries, customer aggregates, and development-email services.',
                  )}
                </StyledHeroSummaryText>
              </StyledHeroSummary>
            </StyledHeroGrid>
          </StyledHero>
          <StyledWorkspace>
            <StyledSidebar>
              <StyledSidebarTitle>
                {tr(workspace.sidebarTitle)}
              </StyledSidebarTitle>
              <StyledSidebarList>
                {workspace.sidebarItems.map((item) => (
                  <StyledSidebarLink
                    key={item.key}
                    to={getTradeCrmMailSidebarLink({
                      scope: currentScope,
                      item,
                    })}
                    $active={item.key === currentViewKey}
                  >
                    <StyledSidebarLabelRow>
                      <StyledSidebarLabel>{tr(item.label)}</StyledSidebarLabel>
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
                        {tr('Keyword')}
                        <StyledInput
                          onChange={(event) =>
                            handleMailSearchChange(event.target.value)
                          }
                          placeholder={tr(
                            'Search sender, subject, body text, or tag',
                          )}
                          value={mailSearchQuery}
                        />
                      </StyledFormField>
                      {currentViewKey === 'search' ? (
                        <>
                          <StyledFormField>
                            {tr('Tag')}
                            <StyledInput
                              onChange={(event) =>
                                handleMailSearchFilterChange({
                                  key: 'tag',
                                  value: event.target.value,
                                })
                              }
                              placeholder={tr('important-customer')}
                              value={mailTagFilter}
                            />
                          </StyledFormField>
                          <StyledFormField>
                            {tr('From')}
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
                            {tr('To')}
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
                  ) : currentScope === 'campaign' && currentViewKey === 'jobs' ? (
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
                      {tr(
                        'Search sender, subject, customer, opportunity, activity, tag, or time range',
                      )}
                    </StyledSearchInput>
                  )}
                  <StyledToolbarMeta>
                    <StyledBadge>{tr(workspace.label)}</StyledBadge>
                    <StyledBadge>{tr(currentViewItem.label)}</StyledBadge>
                    {currentScope === 'campaign' && currentViewKey === 'jobs' ? (
                      <StyledBadge>{tr(`Visible jobs ${filteredSendJobCount}`)}</StyledBadge>
                    ) : null}
                    <StyledBadge>{tr('CRM + AI linkage')}</StyledBadge>
                  </StyledToolbarMeta>
                </StyledToolbar>
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
                      {tr(
                        `Execution path: ${selectedSendJobExecutionMode}`,
                      )}
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
                {currentScope === 'campaign' && currentViewKey === 'sender-pool' ? (
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
                        <StyledSectionTitle>{tr('Related Campaigns')}</StyledSectionTitle>
                        <StyledList>
                          {campaignWorkspacePrimaryItems.map((item) => (
                            <StyledListItem key={item.id}>
                              <StyledListCopy>
                                <StyledListPrimary>{tr(item.primary)}</StyledListPrimary>
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
                        <StyledSectionTitle>{tr('Providers')}</StyledSectionTitle>
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
                                    <StyledListPrimary>{tr(item.primary)}</StyledListPrimary>
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
                                    }).map(
                                      (action) => (
                                        <StyledActionLink
                                          key={`${item.id}-${action.label}`}
                                          to={action.to}
                                        >
                                          {action.label}
                                        </StyledActionLink>
                                      ),
                                    )}
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
                    <StyledSectionTitle>{tr('Sender Health')}</StyledSectionTitle>
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
                                <StyledListPrimary>{tr(item.primary)}</StyledListPrimary>
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
                                }).map(
                                  (action) => (
                                    <StyledActionLink
                                      key={`${item.id}-${action.label}`}
                                      to={action.to}
                                    >
                                      {action.label}
                                    </StyledActionLink>
                                  ),
                                )}
                              </StyledListActions>
                            </StyledListItem>
                          );
                        })}
                      </StyledList>
                    ))}
                  </>
                ) : null}
                {!(currentScope === 'campaign' &&
                  currentViewKey === 'sender-pool') ? (
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
                              {tr('Open thread')}
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
                                  ? 'Updating...'
                                  : currentViewKey === 'pending'
                                    ? 'Clear pending'
                                    : 'Mark pending',
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
                                  ? 'Updating tags...'
                                  : currentViewKey === 'tagged' ||
                                      (item.tags?.length ?? 0) > 0
                                    ? 'Clear tags'
                                    : 'Add tag',
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
            </StyledMainColumn>
            <RecordInsightPanel
              title={tr('System Constraints and Design Rules')}
              description={tr(
                'The right side keeps product boundaries, reuse points, and development rules visible. It will later absorb customer profile, AI summary, sender-pool health, and campaign KPI context.',
              )}
              items={getInsightItems(currentScope).map((item) => ({
                ...item,
                label: tr(item.label),
                value: tr(item.value),
                description: tr(item.description),
              }))}
            />
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
              'Current focus: rebuild mail as a full workspace, customer communication center, and campaign operating system.',
              'Guardrail: AI can summarize and draft, but cannot auto-send or mutate CRM status.',
            ].join('\n'),
          }}
        />
      </MainContainerLayoutWithSidePanel>
    </PageContainer>
  );
};
