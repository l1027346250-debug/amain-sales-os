import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useEffect, useState } from 'react';
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
  background:
    radial-gradient(circle at top left, rgba(10, 106, 255, 0.06), transparent 18%),
    linear-gradient(180deg, #f7f9fc 0%, #eef3f8 100%);
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  min-height: 100%;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledHero = styled.section`
  align-items: center;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(31, 64, 112, 0.08);
  border-radius: 18px;
  box-shadow: 0 20px 44px rgba(31, 64, 112, 0.08);
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};

  @media (max-width: 1080px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const StyledScopeTabs = styled.div`
  align-items: center;
  background: #eef4ff;
  border-radius: 999px;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  padding: 4px;
`;

const StyledScopeTab = styled(Link)<{ $active: boolean }>`
  background: ${({ $active }) =>
    $active ? '#0a6aff' : 'transparent'};
  border: 0;
  border-radius: 999px;
  color: ${({ $active }) =>
    $active ? '#ffffff' : '#1f4070'};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  padding: 10px 18px;
  text-decoration: none;
`;

const StyledSubviewTabs = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledSubviewTab = styled(Link)<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? '#1e2126' : '#ffffff')};
  border: 1px solid
    ${({ $active }) =>
      $active ? '#1e2126' : 'rgba(31, 64, 112, 0.10)'};
  border-radius: 999px;
  color: ${({ $active }) => ($active ? '#ffffff' : '#50627a')};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: 8px 14px;
  text-decoration: none;
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

const StyledWorkspace = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: 260px minmax(0, 1fr) 340px;

  @media (max-width: 1220px) {
    grid-template-columns: 1fr;
  }
`;

const StyledSidebar = styled.aside`
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(31, 64, 112, 0.08);
  border-radius: 18px;
  box-shadow: 0 18px 36px rgba(31, 64, 112, 0.08);
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[3]};
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

const StyledSidebarLink = styled(Link)<{ $active: boolean }>`
  background: ${({ $active }) =>
    $active ? '#eef4ff' : 'transparent'};
  border: 1px solid
    ${({ $active }) => ($active ? 'rgba(10, 106, 255, 0.22)' : 'transparent')};
  border-radius: 12px;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  text-decoration: none;
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
  color: ${({ $tone }) =>
    $tone === 'warning' ? '#935b00' : '#50627a'};
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

const StyledMailWorkbench = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.9fr);

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
      $tone === 'accent' ? 'rgba(10, 106, 255, 0.18)' : 'rgba(31, 64, 112, 0.08)'};
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
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
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

const StyledMailWorkbenchPreview = styled.div`
  background: #fbfdff;
  border: 1px solid rgba(31, 64, 112, 0.08);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  min-height: 100%;
  padding: ${themeCssVariables.spacing[3]};
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
  border: 1px solid rgba(10, 106, 255, 0.10);
  border-radius: 12px;
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: 22px minmax(0, 1fr);
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledMailAiIndex = styled.div`
  align-items: center;
  background: rgba(10, 106, 255, 0.10);
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
    $active
      ? tradeCrmUiTheme.colors.ink
      : tradeCrmUiTheme.colors.surface};
  border: 1px solid
    ${({ $active }) =>
      $active
        ? tradeCrmUiTheme.colors.ink
        : tradeCrmUiTheme.colors.borderStrong};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${({ $active }) =>
    $active
      ? tradeCrmUiTheme.colors.surface
      : tradeCrmUiTheme.colors.ink};
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
      return { scope: 'campaign', view: 'overview' };
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
  const requestedScope = searchParams.get('scope');
  const requestedView = searchParams.get('view');
  const legacyMailRouteTarget =
    requestedScope === null ? getLegacyMailRouteTarget(requestedView) : null;
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
  const isMailboxWorkbenchView =
    currentScope === 'mail' &&
    [
      'inbox',
      'sent',
      'unread',
      'pending',
      'tagged',
      'search',
    ].includes(currentViewKey);
  const isCustomerWorkbenchView =
    currentScope === 'customer' &&
    [
      'recent',
      'focus',
      'cooperating',
      'potential',
      'intent',
      'key',
      'normal',
      'long-tail',
    ].includes(currentViewKey);
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
      ? getTradeCrmMailPath({ scope: 'campaign', view: 'templates' })
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
  const selectedMailboxPreviewItem =
    (isMailboxWorkbenchView
      ? filteredRenderedListItems.find(
          (item) => item.threadId === selectedPreviewThreadId,
        )
      : null) ??
    (isMailboxWorkbenchView ? filteredRenderedListItems[0] : undefined);
  const selectedCustomerPreviewItem =
    (isCustomerWorkbenchView
      ? filteredRenderedListItems.find(
          (item) => item.id === selectedPreviewCustomerId,
        )
      : null) ?? (isCustomerWorkbenchView ? filteredRenderedListItems[0] : undefined);
  const hasSelectedMailboxThread = Boolean(selectedMailboxPreviewItem?.threadId);
  const selectedMailboxHasTags = (selectedMailboxPreviewItem?.tags?.length ?? 0) > 0;
  const mailboxSelectedCustomerName =
    selectedMailboxPreviewItem?.primary ?? '未识别客户';
  const mailboxSelectedThreadTitle =
    selectedMailboxPreviewItem?.secondary ?? '当前没有选中线程';
  const mailboxSelectedThreadSummary =
    selectedMailboxPreviewItem?.tertiary ?? '当前筛选条件下没有可预览的邮件线程。';
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
  const customerSelectedSuggestions = selectedCustomerPreviewItem
    ? [
        '优先判断当前客户是否需要回到商机、报价或样品推进链路。',
        '结合最近一封邮件和客户分组，决定是否要立即提醒销售跟进。',
        '如果客户持续活跃但未推进，建议补任务、负责人和标签。',
      ]
    : ['当前没有可操作客户，请先从列表选择一个客户。'];
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
            <StyledSubviewTabs>
              {heroSubviewItems.map((item) => (
                <StyledSubviewTab
                  key={item.key}
                  to={getTradeCrmMailSidebarLink({
                    scope: currentScope,
                    item,
                  })}
                  $active={item.key === currentViewKey}
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
              <StyledComposeButton to={composeEntryPath}>
                {composeEntryLabel}
              </StyledComposeButton>
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
                        {tr('关键词')}
                        <StyledInput
                          onChange={(event) =>
                            handleMailSearchChange(event.target.value)
                          }
                          placeholder={tr(
                            '搜索发件人、主题、正文或标签',
                          )}
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
                        '搜索发件人、主题、客户、商机、活动、标签或时间范围',
                      )}
                    </StyledSearchInput>
                  )}
                  <StyledToolbarMeta>
                    <StyledBadge>{tr(workspace.label)}</StyledBadge>
                    <StyledBadge>{tr(currentViewItem.label)}</StyledBadge>
                    {currentScope === 'campaign' && currentViewKey === 'jobs' ? (
                      <StyledBadge>{tr(`当前作业 ${filteredSendJobCount}`)}</StyledBadge>
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
                            threadId: selectedMailboxPreviewItem?.threadId ?? '',
                            isPending: currentViewKey !== 'pending',
                          })
                        }
                        type="button"
                      >
                        {tr(currentViewKey === 'pending' ? '清除待处理' : '标记待处理')}
                      </StyledSecondaryButton>
                    ) : null}
                    {hasSelectedMailboxThread ? (
                      <StyledSecondaryButton
                        onClick={() => {
                          if (selectedMailboxHasTags) {
                            void handleUpdateThreadTag({
                              threadId: selectedMailboxPreviewItem?.threadId ?? '',
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
                            item.threadId === selectedMailboxPreviewItem?.threadId
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
                ) : isCustomerWorkbenchView ? (
                  <StyledMailWorkbench>
                    <StyledMailWorkbenchList>
                      <StyledMailWorkbenchListHeader>
                        <div>{tr('客户')}</div>
                        <div>{tr('最近线程与摘要')}</div>
                        <div>{tr('分组 / 状态')}</div>
                      </StyledMailWorkbenchListHeader>
                      {filteredRenderedListItems.map((item) => (
                        <StyledMailWorkbenchItem
                          $active={item.id === selectedCustomerPreviewItem?.id}
                          key={item.id}
                          onClick={() => handlePreviewCustomerSelection(item.id)}
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
                      {selectedCustomerPreviewItem ? (
                        <>
                          <StyledMailPreviewTopbar>
                            <StyledMailPreviewTopbarCopy>
                              <StyledMailPreviewLabel>
                                {tr('客户邮件面板')}
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
                          <StyledMailPreviewBlock>
                            <StyledMailPreviewLabel>
                              {tr('最近线程')}
                            </StyledMailPreviewLabel>
                            <StyledMailPreviewTitle>
                              {tr(customerSelectedLatestThread)}
                            </StyledMailPreviewTitle>
                            <StyledListMeta>{tr(customerSelectedMeta)}</StyledListMeta>
                          </StyledMailPreviewBlock>
                          <StyledMailPreviewBlock>
                            <StyledMailPreviewLabel>
                              {tr('往来摘要')}
                            </StyledMailPreviewLabel>
                            <StyledListTertiary>
                              {tr(customerSelectedSummary)}
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
                                    {tr(customerSelectedName)}
                                  </StyledMailProfileValue>
                                </StyledMailProfileItem>
                                <StyledMailProfileItem>
                                  <StyledMailProfileLabel>
                                    {tr('客户分组')}
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
                              <StyledMailPreviewLabel>
                                {tr('AI 跟进建议')}
                              </StyledMailPreviewLabel>
                              <StyledMailAiList>
                                {customerSelectedSuggestions.map(
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
                          <StyledButtonRow>
                            <StyledActionLink to={tradeCrmRouteMap.customers}>
                              {tr('打开客户详情')}
                            </StyledActionLink>
                            <StyledActionLink to={tradeCrmRouteMap.opportunities}>
                              {tr('进入商机处理')}
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
                        </>
                      ) : (
                        <StyledMailPreviewBlock>
                          <StyledMailPreviewLabel>
                            {tr('客户邮件面板')}
                          </StyledMailPreviewLabel>
                          <StyledListMeta>
                            {tr('当前分组下没有可预览的客户。')}
                          </StyledListMeta>
                        </StyledMailPreviewBlock>
                      )}
                    </StyledMailWorkbenchPreview>
                  </StyledMailWorkbench>
                ) : !(currentScope === 'campaign' &&
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
