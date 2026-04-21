import { styled } from '@linaria/react';
import { useMemo, useState } from 'react';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { TradeCrmCustomerDetailWorkbench } from '@/trade-crm/customers/components/TradeCrmCustomerDetailWorkbench';
import { useTradeCrmCustomerConfigDraft } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigDraft';
import { useTradeCrmCustomerDedupSearch } from '@/trade-crm/customers/hooks/useTradeCrmCustomerDedupSearch';
import {
  type TradeCrmCustomerImportJobResult,
  useTradeCrmCustomerImportJobs,
} from '@/trade-crm/customers/hooks/useTradeCrmCustomerImportJobs';
import { useTradeCrmLeadConversion } from '@/trade-crm/customers/hooks/useTradeCrmLeadConversion';
import { useTradeCrmCustomerRecordMutations } from '@/trade-crm/customers/hooks/useTradeCrmCustomerRecordMutations';
import {
  TradeCrmCustomerTable,
  type TradeCrmCustomerTableBadgeTone,
} from '@/trade-crm/customers/components/TradeCrmCustomerTable';
import { TradeCrmCustomerWorkspaceLayout } from '@/trade-crm/customers/components/TradeCrmCustomerWorkspaceLayout';
import { useTradeCrmCustomerWorkspaceData } from '@/trade-crm/customers/hooks/useTradeCrmCustomerWorkspaceData';
import {
  getTradeCrmCustomerDetailPath,
  getTradeCrmCustomerConfigPath,
  getTradeCrmCustomerLegacyViewRedirectPath,
  getTradeCrmCustomerPath,
  tradeCrmCustomerConfigSections,
  tradeCrmCustomerRouteLabels,
} from '@/trade-crm/customers/utils/tradeCrmCustomerRouting';
import {
  getTradeCrmCustomerCodeLabelForRecord,
  getTradeCrmCustomerCountryLabel,
  getTradeCrmCustomerEmailLabel,
  getTradeCrmCustomerGroupLabelForRecord,
  getTradeCrmCustomerLastTouchLabelForRecord,
  getTradeCrmCustomerOwnerLabel,
  getTradeCrmCustomerPhoneLabel,
  getTradeCrmCustomerRoutePath,
  getTradeCrmCustomerScoreLabelForRecord,
  getTradeCrmCustomerSourceLabelForRecord,
  getTradeCrmCustomerStageLabelForRecord,
  getTradeCrmCustomerStarLabelForRecord,
  getTradeCrmCustomerTagsForRecord,
  getTradeCrmCustomerWebsiteLabel,
  getTradeCrmPublicPoolGroupLabelForRecord,
  getTradeCrmPublicPoolStateLabelForRecord,
  getTradeCrmRecordName,
  type TradeCrmCustomerPresentationRecord,
} from '@/trade-crm/customers/utils/tradeCrmCustomerPresentation';
import { tradeCrmRouteMap } from '@/trade-crm/navigation/tradeCrmRouteMap';
import { type FilterSidebarItem } from '@/trade-crm/shared/components/FilterSidebar';
import { type PageHeaderTab } from '@/trade-crm/shared/components/PageHeaderTabs';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type ConfigSection =
  | 'public-pool-rules'
  | 'groups'
  | 'tags'
  | 'sources'
  | 'matching'
  | 'import';

const StyledMetricGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
`;

const StyledMetricCard = styled.section`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledMetricLabel = styled.div`
  color: ${tradeCrmUiTheme.colors.inkFaint};
  font-size: ${themeCssVariables.font.size.xs};
  letter-spacing: 0.06em;
  margin-bottom: ${themeCssVariables.spacing[2]};
  text-transform: uppercase;
`;

const StyledMetricValue = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: 30px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin-bottom: ${themeCssVariables.spacing[1]};
`;

const StyledMetricHint = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

const StyledSplitGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: 320px minmax(0, 1fr);

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`;

const StyledStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledPanel = styled.section`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledPanelTitle = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin-bottom: ${themeCssVariables.spacing[2]};
`;

const StyledPanelDescription = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
  margin-bottom: ${themeCssVariables.spacing[3]};
`;

const StyledFilterList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledFilterNode = styled.div`
  align-items: center;
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  display: flex;
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledNodeLabel = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledNodeCount = styled.div`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledTokenWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledToken = styled.div`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.xs};
  padding: 4px 10px;
`;

const StyledQuickLinkList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledQuickLink = styled(Link)`
  align-items: center;
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  display: flex;
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[3]};
  text-decoration: none;

  &:hover {
    border-color: ${tradeCrmUiTheme.colors.borderStrong};
  }
`;

const StyledToolbar = styled.div`
  align-items: center;
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledSearchInput = styled.input`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  flex: 1 1 240px;
  font: inherit;
  min-width: 200px;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledFilterButton = styled.button<{ $active: boolean }>`
  background: ${({ $active }) =>
    $active ? tradeCrmUiTheme.colors.borderStrong : tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid
    ${({ $active }) =>
      $active ? tradeCrmUiTheme.colors.borderStrong : tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${({ $active }) =>
    $active ? tradeCrmUiTheme.colors.surface : tradeCrmUiTheme.colors.inkMuted};
  cursor: pointer;
  font: inherit;
  padding: 6px 12px;
`;

const StyledFilterSummary = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledActionBar = styled.div`
  align-items: center;
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledActionMeta = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: 4px;
`;

const StyledActionButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledControlButton = styled.button<{ $tone?: 'primary' | 'neutral' | 'danger' }>`
  background: ${({ $tone }) =>
    $tone === 'primary'
      ? tradeCrmUiTheme.colors.borderStrong
      : $tone === 'danger'
        ? 'rgba(197, 56, 56, 0.12)'
        : tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'primary'
        ? tradeCrmUiTheme.colors.borderStrong
        : $tone === 'danger'
          ? 'rgba(197, 56, 56, 0.28)'
          : tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${({ $tone }) =>
    $tone === 'primary'
      ? tradeCrmUiTheme.colors.surface
      : $tone === 'danger'
        ? '#8f1f1f'
        : tradeCrmUiTheme.colors.ink};
  cursor: pointer;
  font: inherit;
  padding: 8px 14px;
`;

const StyledFormGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const StyledField = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledFieldLabel = styled.span`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledTextInput = styled.input`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  font: inherit;
  min-height: 40px;
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledSelect = styled.select`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  font: inherit;
  min-height: 40px;
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledNumberInput = styled(StyledTextInput)`
  appearance: textfield;
`;

const StyledInlineComposer = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledIndentedNode = styled(StyledFilterNode)<{ $level: 1 | 2 }>`
  margin-left: ${({ $level }) => ($level === 2 ? themeCssVariables.spacing[4] : 0)};
`;

const StyledTagButton = styled.button`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${tradeCrmUiTheme.colors.ink};
  cursor: pointer;
  font: inherit;
  padding: 6px 10px;
`;

const StyledConfigNote = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

const StyledStepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledStepItem = styled.div`
  border-left: 2px solid ${tradeCrmUiTheme.colors.borderStrong};
  padding-left: ${themeCssVariables.spacing[3]};
`;

const StyledStepTitle = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin-bottom: ${themeCssVariables.spacing[1]};
`;

const StyledStepText = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

const StyledColumns = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const StyledCallout = styled.div`
  background: linear-gradient(
    180deg,
    rgba(39, 106, 245, 0.06),
    rgba(39, 106, 245, 0.02)
  );
  border: 1px solid rgba(39, 106, 245, 0.16);
  border-radius: ${tradeCrmUiTheme.radius.panel};
  padding: ${themeCssVariables.spacing[4]};
`;

const getBadgeTone = (
  index: number,
): TradeCrmCustomerTableBadgeTone =>
  index % 4 === 0
    ? 'green'
    : index % 4 === 1
      ? 'blue'
      : index % 4 === 2
        ? 'amber'
        : 'red';

const getPrimaryTabs = (
  activeKey: 'list' | 'public' | 'dedup' | 'settings' | 'detail',
): PageHeaderTab[] => [
  {
    label: 'Customer List',
    isActive: activeKey === 'list',
    to: getTradeCrmCustomerPath('list'),
  },
  {
    label: 'Public Pool',
    isActive: activeKey === 'public',
    to: getTradeCrmCustomerPath('public'),
  },
  {
    label: 'Customer Dedup',
    isActive: activeKey === 'dedup',
    to: getTradeCrmCustomerPath('dedup'),
  },
  {
    label: 'Settings',
    isActive: activeKey === 'settings',
    to: getTradeCrmCustomerPath('config-public-pool-rules'),
  },
  {
    label: 'Customer Detail',
    isActive: activeKey === 'detail',
  },
];

const getSidebarItems = ({
  activePath,
  companyTotalCount,
  peopleTotalCount,
}: {
  activePath: string;
  companyTotalCount: number;
  peopleTotalCount: number;
}): FilterSidebarItem[] => [
  {
    label: 'Customer List',
    hint: 'Private customers, ownership, and follow-up queues.',
    isActive: activePath === 'list',
    to: getTradeCrmCustomerPath('list'),
    countLabel: `${companyTotalCount}`,
  },
  {
    label: 'Public Pool',
    hint: 'Claimable accounts and recycle candidates.',
    isActive: activePath === 'public',
    to: getTradeCrmCustomerPath('public'),
    countLabel: `${Math.max(6, Math.floor(companyTotalCount / 4))}`,
  },
  {
    label: 'Customer Dedup',
    hint: 'Pre-claim and pre-import collision checks.',
    isActive: activePath === 'dedup',
    to: getTradeCrmCustomerPath('dedup'),
    countLabel: `${Math.max(4, Math.floor(peopleTotalCount / 3))}`,
  },
  {
    label: 'Public Pool Rules',
    hint: 'Auto-move rules and recycle policy.',
    isActive: activePath === 'config-public-pool-rules',
    to: getTradeCrmCustomerPath('config-public-pool-rules'),
  },
  {
    label: 'Groups',
    hint: 'Customer grouping tree and segment governance.',
    isActive: activePath === 'config-groups',
    to: getTradeCrmCustomerPath('config-groups'),
  },
  {
    label: 'Tags',
    hint: 'Company, personal, and subordinate tag dictionaries.',
    isActive: activePath === 'config-tags',
    to: getTradeCrmCustomerPath('config-tags'),
  },
  {
    label: 'Sources',
    hint: 'Inbound origin dictionary for leads and customers.',
    isActive: activePath === 'config-sources',
    to: getTradeCrmCustomerPath('config-sources'),
  },
  {
    label: 'Matching',
    hint: 'Dedup scoring weights and field priorities.',
    isActive: activePath === 'config-matching',
    to: getTradeCrmCustomerPath('config-matching'),
  },
  {
    label: 'Import',
    hint: 'File upload, mapping, and import job history.',
    isActive: activePath === 'config-import',
    to: getTradeCrmCustomerPath('config-import'),
  },
];

const getCustomerConfigTabs = (activeSection: ConfigSection): PageHeaderTab[] =>
  tradeCrmCustomerConfigSections.map((section) => ({
    label: tradeCrmCustomerRouteLabels[`config-${section}`],
    isActive: activeSection === section,
    to: getTradeCrmCustomerConfigPath(section),
  }));

const CustomerSignalsCards = ({
  companyTotalCount,
  peopleTotalCount,
  opportunityTotalCount,
  totalTasksDueTodayCount,
  materialAlignmentNotice,
}: ReturnType<typeof useTradeCrmCustomerWorkspaceData>) => (
  <StyledMetricGrid>
    {[
      [
        'Customer Accounts',
        `${companyTotalCount}`,
        'Organization customers already anchored on live company records.',
      ],
      [
        'Contacts',
        `${peopleTotalCount}`,
        'Contact coverage that supports follow-up and ownership transfer.',
      ],
      [
        'Commercial Motion',
        `${opportunityTotalCount}`,
        'Opportunities that should stay attached to the customer context.',
      ],
      [
        'Tasks Due Today',
        `${totalTasksDueTodayCount}`,
        materialAlignmentNotice,
      ],
    ].map(([label, value, hint]) => (
      <StyledMetricCard key={label}>
        <StyledMetricLabel>{label}</StyledMetricLabel>
        <StyledMetricValue>{value}</StyledMetricValue>
        <StyledMetricHint>{hint}</StyledMetricHint>
      </StyledMetricCard>
    ))}
  </StyledMetricGrid>
);

const buildCompanyRows = (
  companyRecords: TradeCrmCustomerPresentationRecord[] | undefined,
) =>
  (companyRecords ?? []).slice(0, 8).map((record, index) => ({
    id: record.id,
    cells: [
      {
        primary: getTradeCrmRecordName({
          kind: 'organization',
          record,
        }),
        secondary: getTradeCrmCustomerWebsiteLabel(record),
        badgeLabel: getTradeCrmCustomerStageLabelForRecord({
          record,
          fallbackIndex: index,
        }),
        badgeTone: getBadgeTone(index),
      },
      {
        primary: getTradeCrmCustomerOwnerLabel(record),
        secondary: getTradeCrmCustomerSourceLabelForRecord({
          record,
          fallbackIndex: index,
        }),
      },
      {
        primary: getTradeCrmCustomerCountryLabel(record),
        secondary: getTradeCrmCustomerGroupLabelForRecord({
          record,
          fallbackIndex: index,
        }),
      },
      {
        primary: getTradeCrmCustomerTagsForRecord({
          record,
          fallbackIndex: index,
        }).join(' · '),
        secondary: `${getTradeCrmCustomerStarLabelForRecord({
          record,
          fallbackIndex: index,
        })} · ${getTradeCrmCustomerScoreLabelForRecord({
          record,
          fallbackIndex: index,
        })}`,
      },
      {
        primary: getTradeCrmCustomerLastTouchLabelForRecord({
          record,
          fallbackIndex: index,
        }),
        secondary: `Next move: ${getTradeCrmCustomerStageLabelForRecord({
          record,
          fallbackIndex: index + 1,
        })}`,
      },
    ],
    actionLabel: 'Open',
    actionTo: getTradeCrmCustomerRoutePath({
      kind: 'organization',
      record,
    }),
  }));

type CustomerFilterState = {
  searchTerm: string;
  stage: string | null;
  source: string | null;
  tag: string | null;
};

const recordMatchesSearchTerm = ({
  record,
  kind,
  searchTerm,
}: {
  record: TradeCrmCustomerPresentationRecord;
  kind: 'organization' | 'individual';
  searchTerm: string;
}) => {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  if (normalizedSearchTerm.length === 0) {
    return true;
  }

  const searchableValues = [
    getTradeCrmRecordName({ kind, record }),
    getTradeCrmCustomerWebsiteLabel(record),
    getTradeCrmCustomerOwnerLabel(record),
    getTradeCrmCustomerCountryLabel(record),
    getTradeCrmCustomerSourceLabelForRecord({ record }),
    getTradeCrmCustomerGroupLabelForRecord({ record }),
    getTradeCrmCustomerStageLabelForRecord({ record }),
    getTradeCrmCustomerEmailLabel(record),
    getTradeCrmCustomerPhoneLabel(record),
    ...getTradeCrmCustomerTagsForRecord({ record }),
  ]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.toLowerCase());

  return searchableValues.some((value) => value.includes(normalizedSearchTerm));
};

const filterCompanyRecords = ({
  records,
  filters,
}: {
  records: TradeCrmCustomerPresentationRecord[] | undefined;
  filters: CustomerFilterState;
}) =>
  (records ?? []).filter((record) => {
    if (
      filters.stage &&
      getTradeCrmCustomerStageLabelForRecord({ record }) !== filters.stage
    ) {
      return false;
    }

    if (
      filters.source &&
      getTradeCrmCustomerSourceLabelForRecord({ record }) !== filters.source
    ) {
      return false;
    }

    if (
      filters.tag &&
      !getTradeCrmCustomerTagsForRecord({ record }).includes(filters.tag)
    ) {
      return false;
    }

    return recordMatchesSearchTerm({
      record,
      kind: 'organization',
      searchTerm: filters.searchTerm,
    });
  });

const filterPeopleRecords = ({
  records,
  filters,
}: {
  records: TradeCrmCustomerPresentationRecord[] | undefined;
  filters: CustomerFilterState;
}) =>
  (records ?? []).filter((record) => {
    if (
      filters.source &&
      getTradeCrmCustomerSourceLabelForRecord({ record }) !== filters.source
    ) {
      return false;
    }

    if (
      filters.tag &&
      !getTradeCrmCustomerTagsForRecord({ record }).includes(filters.tag)
    ) {
      return false;
    }

    return recordMatchesSearchTerm({
      record,
      kind: 'individual',
      searchTerm: filters.searchTerm,
    });
  });

const getPublicPoolGroupLabels = (
  publicPoolRecords: TradeCrmCustomerPresentationRecord[] | undefined,
) => {
  const labels = (publicPoolRecords ?? [])
    .map((record) => getTradeCrmPublicPoolGroupLabelForRecord(record))
    .filter((label): label is string => typeof label === 'string' && label.length > 0);

  return labels.length > 0 ? [...new Set(labels)] : ['Default Public Pool'];
};

const getImportDestinationValue = (destination: string) =>
  destination === 'public-pool' ? 'PUBLIC_POOL' : 'CUSTOMER_LIST';

const escapeCsvCell = (value: number | string | null | undefined) => {
  const normalizedValue = value === null || value === undefined ? '' : String(value);

  return `"${normalizedValue.replace(/"/g, '""')}"`;
};

const getImportResultCsvContent = (result: TradeCrmCustomerImportJobResult) =>
  [
    ['rowNumber', 'rowLabel', 'companyName', 'contactEmail', 'status', 'message'],
    ...result.rows.map((row) => [
      row.rowNumber,
      row.rowLabel,
      row.companyName,
      row.contactEmail,
      row.status,
      row.errorMessage,
    ]),
  ]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\n');

const downloadImportResultCsv = (result: TradeCrmCustomerImportJobResult) => {
  const blob = new Blob([getImportResultCsvContent(result)], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = window.URL.createObjectURL(blob);
  const anchorElement = document.createElement('a');

  anchorElement.href = url;
  anchorElement.download = `customer-import-${
    result.job?.id ?? 'result'
  }-rows.csv`;
  anchorElement.click();
  window.URL.revokeObjectURL(url);
};

const useTradeCrmCustomerRuntimeConfig = (
  workspaceData: ReturnType<typeof useTradeCrmCustomerWorkspaceData>,
) => {
  const configDraft = useTradeCrmCustomerConfigDraft({
    customerStageSummary: workspaceData.customerStageSummary,
    customerGroupSummary: workspaceData.customerGroupSummary,
    customerTagSummary: workspaceData.customerTagSummary,
    customerSourceSummary: workspaceData.customerSourceSummary,
    publicPoolGroupLabels: getPublicPoolGroupLabels(workspaceData.publicPoolRecords),
  });
  const publicPoolGroupLabels = useMemo(
    () =>
      [
        ...getPublicPoolGroupLabels(workspaceData.publicPoolRecords),
        configDraft.draft.publicPoolRule.publicPoolGroup,
      ].filter(
        (label, index, labels) =>
          label.length > 0 && labels.indexOf(label) === index,
      ),
    [configDraft.draft.publicPoolRule.publicPoolGroup, workspaceData.publicPoolRecords],
  );

  return {
    configDraft,
    publicPoolGroupLabels,
  };
};

type CustomerConfigTagInputState = {
  company: string;
  mine: string;
  subordinate: string;
};

const renderConfigContent = ({
  activeSection,
  workspaceData,
  configDraft,
  newGroupLabel,
  onNewGroupLabelChange,
  groupParentId,
  onGroupParentIdChange,
  newTagLabels,
  onNewTagLabelChange,
    newSourceLabel,
    onNewSourceLabelChange,
    importFileName,
    onImportFileNameChange,
    importJobs,
    publicPoolGroupLabels,
  }: {
    activeSection: ConfigSection;
    workspaceData: ReturnType<typeof useTradeCrmCustomerWorkspaceData>;
    configDraft: ReturnType<typeof useTradeCrmCustomerConfigDraft>;
  newGroupLabel: string;
  onNewGroupLabelChange: (value: string) => void;
  groupParentId: string | null;
  onGroupParentIdChange: (value: string | null) => void;
  newTagLabels: CustomerConfigTagInputState;
  onNewTagLabelChange: (
    scope: keyof CustomerConfigTagInputState,
    value: string,
    ) => void;
    newSourceLabel: string;
    onNewSourceLabelChange: (value: string) => void;
    importFileName: string;
    onImportFileNameChange: (value: string) => void;
    importJobs: ReturnType<typeof useTradeCrmCustomerImportJobs>;
    publicPoolGroupLabels: string[];
  }) => {
  if (activeSection === 'public-pool-rules') {
    return (
      <StyledSplitGrid>
        <StyledStack>
          <StyledPanel>
            <StyledPanelTitle>Rule Conditions</StyledPanelTitle>
            <StyledFormGrid>
              <StyledField>
                <StyledFieldLabel>Rule Name</StyledFieldLabel>
                <StyledTextInput
                  value={configDraft.draft.publicPoolRule.ruleName}
                  onChange={(event) =>
                    configDraft.setPublicPoolRule('ruleName', event.target.value)
                  }
                />
              </StyledField>
              <StyledField>
                <StyledFieldLabel>Move After Inactivity Days</StyledFieldLabel>
                <StyledNumberInput
                  type="number"
                  min={1}
                  value={configDraft.draft.publicPoolRule.inactivityDays}
                  onChange={(event) =>
                    configDraft.setPublicPoolRule(
                      'inactivityDays',
                      Math.max(1, Number(event.target.value) || 1),
                    )
                  }
                />
              </StyledField>
              <StyledField>
                <StyledFieldLabel>Public Pool Group</StyledFieldLabel>
                <StyledSelect
                  value={configDraft.draft.publicPoolRule.publicPoolGroup}
                  onChange={(event) =>
                    configDraft.setPublicPoolRule('publicPoolGroup', event.target.value)
                  }
                >
                  {publicPoolGroupLabels.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </StyledSelect>
              </StyledField>
            </StyledFormGrid>
            <StyledPanelDescription>
              Choose which customer stages should be eligible for nightly recycle into
              the public pool.
            </StyledPanelDescription>
            <StyledTokenWrap>
              {(workspaceData.customerStageSummary.length > 0
                ? workspaceData.customerStageSummary.map((item) => item.label)
                : ['Potential Customer', 'Active Customer', 'Won Customer']
              ).map((stageLabel) => (
                <StyledFilterButton
                  key={stageLabel}
                  type="button"
                  $active={configDraft.draft.publicPoolRule.scopeStages.includes(
                    stageLabel,
                  )}
                  onClick={() => configDraft.togglePublicPoolStage(stageLabel)}
                >
                  {stageLabel}
                </StyledFilterButton>
              ))}
            </StyledTokenWrap>
            <StyledInlineComposer>
              <StyledFilterButton
                type="button"
                $active={configDraft.draft.publicPoolRule.notifyOwnersFirst}
                onClick={() =>
                  configDraft.setPublicPoolRule(
                    'notifyOwnersFirst',
                    !configDraft.draft.publicPoolRule.notifyOwnersFirst,
                  )
                }
              >
                {configDraft.draft.publicPoolRule.notifyOwnersFirst
                  ? 'Owner Reminder Enabled'
                  : 'Owner Reminder Disabled'}
              </StyledFilterButton>
              <StyledConfigNote>
                {workspaceData.publicPoolRecords.length} current public-pool records stay
                visible in the audit lane after auto-move.
              </StyledConfigNote>
            </StyledInlineComposer>
          </StyledPanel>
        </StyledStack>
        <StyledStack>
          <StyledPanel>
            <StyledPanelTitle>Execution Preview</StyledPanelTitle>
            <StyledStepList>
              {[
                [
                  'Condition scan',
                  `Move customers without contact in ${configDraft.draft.publicPoolRule.inactivityDays} days.`,
                ],
                [
                  'Stage scope',
                  configDraft.draft.publicPoolRule.scopeStages.join(', ') ||
                    'No customer stage selected yet.',
                ],
                [
                  'Public move',
                  `Write the record into ${configDraft.draft.publicPoolRule.publicPoolGroup} and preserve original owner audit.`,
                ],
              ].map(([title, text]) => (
                <StyledStepItem key={title}>
                  <StyledStepTitle>{title}</StyledStepTitle>
                  <StyledStepText>{text}</StyledStepText>
                </StyledStepItem>
              ))}
            </StyledStepList>
            <StyledActionButtons>
              <StyledControlButton
                type="button"
                $tone="primary"
                disabled={workspaceData.executeCustomerPublicPoolRulesLoading}
                onClick={() => {
                  void workspaceData.executeCustomerPublicPoolRules();
                }}
              >
                {workspaceData.executeCustomerPublicPoolRulesLoading
                  ? 'Executing Rule Scan'
                  : 'Execute Rule Scan'}
              </StyledControlButton>
            </StyledActionButtons>
            <StyledConfigNote>
              Runs the saved public-pool rules against current customer records and
              refreshes both private and public-pool lists after execution.
            </StyledConfigNote>
          </StyledPanel>
        </StyledStack>
      </StyledSplitGrid>
    );
  }

  if (activeSection === 'groups') {
    const rootGroups = configDraft.draft.groups.filter((group) => group.level === 1);

    return (
      <StyledSplitGrid>
        <StyledPanel>
          <StyledPanelTitle>Group Tree Editor</StyledPanelTitle>
          <StyledPanelDescription>
            Add new root or second-level customer groups, then reorder them before the
            backend config mutation is wired in.
          </StyledPanelDescription>
          <StyledInlineComposer>
            <StyledTextInput
              value={newGroupLabel}
              onChange={(event) => onNewGroupLabelChange(event.target.value)}
              placeholder="Add a group label"
            />
            <StyledSelect
              value={groupParentId ?? ''}
              onChange={(event) =>
                onGroupParentIdChange(
                  event.target.value.length > 0 ? event.target.value : null,
                )
              }
            >
              <option value="">Root group</option>
              {rootGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.label}
                </option>
              ))}
            </StyledSelect>
            <StyledControlButton
              type="button"
              onClick={() => {
                configDraft.addGroup(newGroupLabel, groupParentId);
                onNewGroupLabelChange('');
              }}
            >
              Add Group
            </StyledControlButton>
          </StyledInlineComposer>
        </StyledPanel>
        <StyledStack>
          <StyledPanel>
            <StyledPanelTitle>Configured Groups</StyledPanelTitle>
            <StyledFilterList>
              {configDraft.draft.groups.map((group) => (
                <StyledIndentedNode key={group.id} $level={group.level}>
                  <StyledInlineComposer>
                    <StyledNodeCount>{group.level === 1 ? 'L1' : 'L2'}</StyledNodeCount>
                    <StyledTextInput
                      value={group.label}
                      onChange={(event) =>
                        configDraft.renameGroup(group.id, event.target.value)
                      }
                    />
                  </StyledInlineComposer>
                  <StyledInlineComposer>
                    <StyledControlButton
                      type="button"
                      onClick={() => configDraft.moveGroup(group.id, 'up')}
                    >
                      Up
                    </StyledControlButton>
                    <StyledControlButton
                      type="button"
                      onClick={() => configDraft.moveGroup(group.id, 'down')}
                    >
                      Down
                    </StyledControlButton>
                  </StyledInlineComposer>
                </StyledIndentedNode>
              ))}
            </StyledFilterList>
          </StyledPanel>
        </StyledStack>
      </StyledSplitGrid>
    );
  }

  if (activeSection === 'tags') {
    return (
      <StyledColumns>
        {[
          ['company', 'Company Tags'],
          ['mine', 'My Tags'],
          ['subordinate', 'Subordinate Tags'],
        ].map(([scope, title]) => (
          <StyledPanel key={scope}>
            <StyledPanelTitle>{title}</StyledPanelTitle>
            <StyledTokenWrap>
              {configDraft.draft.tags[scope as keyof CustomerConfigTagInputState].map(
                (tag) => (
                  <StyledTagButton
                    key={tag}
                    type="button"
                    onClick={() =>
                      configDraft.removeTag(
                        scope as keyof CustomerConfigTagInputState,
                        tag,
                      )
                    }
                  >
                    {tag} ×
                  </StyledTagButton>
                ),
              )}
            </StyledTokenWrap>
            <StyledInlineComposer>
              <StyledTextInput
                value={newTagLabels[scope as keyof CustomerConfigTagInputState]}
                onChange={(event) =>
                  onNewTagLabelChange(
                    scope as keyof CustomerConfigTagInputState,
                    event.target.value,
                  )
                }
                placeholder={`Add ${title}`}
              />
              <StyledControlButton
                type="button"
                onClick={() => {
                  configDraft.addTag(
                    scope as keyof CustomerConfigTagInputState,
                    newTagLabels[scope as keyof CustomerConfigTagInputState],
                  );
                  onNewTagLabelChange(
                    scope as keyof CustomerConfigTagInputState,
                    '',
                  );
                }}
              >
                Add
              </StyledControlButton>
            </StyledInlineComposer>
          </StyledPanel>
        ))}
      </StyledColumns>
    );
  }

  if (activeSection === 'sources') {
    return (
      <StyledPanel>
        <StyledPanelTitle>Source Dictionary</StyledPanelTitle>
        <StyledPanelDescription>
          Keep the same source dictionary shared by leads, customers, dedup, and import
          mapping.
        </StyledPanelDescription>
        <StyledInlineComposer>
          <StyledTextInput
            value={newSourceLabel}
            onChange={(event) => onNewSourceLabelChange(event.target.value)}
            placeholder="Add a source label"
          />
          <StyledControlButton
            type="button"
            onClick={() => {
              configDraft.addSource(newSourceLabel);
              onNewSourceLabelChange('');
            }}
          >
            Add Source
          </StyledControlButton>
        </StyledInlineComposer>
        <StyledFilterList>
          {configDraft.draft.sources.map((source) => (
            <StyledFilterNode key={source}>
              <StyledNodeLabel>{source}</StyledNodeLabel>
              <StyledInlineComposer>
                <StyledNodeCount>Shared dictionary</StyledNodeCount>
                <StyledControlButton
                  type="button"
                  $tone="danger"
                  onClick={() => configDraft.removeSource(source)}
                >
                  Remove
                </StyledControlButton>
              </StyledInlineComposer>
            </StyledFilterNode>
          ))}
        </StyledFilterList>
      </StyledPanel>
    );
  }

  if (activeSection === 'matching') {
    const totalWeight = configDraft.draft.matchingRules.reduce(
      (sum, rule) => sum + rule.weight,
      0,
    );

    return (
      <StyledStack>
        <StyledCallout>
          <StyledPanelTitle>Matching Weight Total</StyledPanelTitle>
          <StyledPanelDescription>
            Keep the combined weight close to 100 so manual dedup and import dedup stay
            predictable.
          </StyledPanelDescription>
          <StyledMetricValue>{totalWeight}%</StyledMetricValue>
        </StyledCallout>
        <StyledColumns>
          {configDraft.draft.matchingRules.map((rule) => (
            <StyledMetricCard key={rule.field}>
              <StyledMetricLabel>{rule.field}</StyledMetricLabel>
              <StyledNumberInput
                type="number"
                min={0}
                max={100}
                value={rule.weight}
                onChange={(event) =>
                  configDraft.setMatchingWeight(
                    rule.field,
                    Math.max(0, Math.min(100, Number(event.target.value) || 0)),
                  )
                }
              />
              <StyledMetricHint>
                Shared by customer dedup and import collision review.
              </StyledMetricHint>
            </StyledMetricCard>
          ))}
        </StyledColumns>
      </StyledStack>
    );
  }

  return (
    <StyledSplitGrid>
      <StyledPanel>
        <StyledPanelTitle>Import Defaults</StyledPanelTitle>
        <StyledPanelDescription>
          Save the destination and update strategy here so import setup stays
          consistent across customer settings and later import runs.
        </StyledPanelDescription>
        <StyledInlineComposer>
          <StyledTextInput
            value={importFileName}
            onChange={(event) => onImportFileNameChange(event.target.value)}
            placeholder="Customer import file name"
          />
          <StyledControlButton
            type="button"
            $tone="primary"
            disabled={
              importFileName.trim().length === 0 || importJobs.startLoading
            }
            onClick={() => {
              void importJobs
                .startCustomerImportJob({
                  destination: getImportDestinationValue(
                    configDraft.draft.importConfig.destination,
                  ),
                  fileName: importFileName,
                  selectedFields: configDraft.draft.importConfig.selectedFields,
                  updateExistingContacts:
                    configDraft.draft.importConfig.updateExistingContacts,
                })
                .then(() => onImportFileNameChange(''))
                .catch(() => undefined);
            }}
          >
            {importJobs.startLoading ? 'Creating...' : 'Create Import Job'}
          </StyledControlButton>
        </StyledInlineComposer>
        <StyledInlineComposer>
          <StyledFilterButton
            type="button"
            $active={configDraft.draft.importConfig.destination === 'customer-list'}
            onClick={() => configDraft.setImportDestination('customer-list')}
          >
            Customer List
          </StyledFilterButton>
          <StyledFilterButton
            type="button"
            $active={configDraft.draft.importConfig.destination === 'public-pool'}
            onClick={() => configDraft.setImportDestination('public-pool')}
          >
            Public Pool
          </StyledFilterButton>
          <StyledFilterButton
            type="button"
            $active={configDraft.draft.importConfig.updateExistingContacts}
            onClick={() =>
              configDraft.setImportUpdateExistingContacts(
                !configDraft.draft.importConfig.updateExistingContacts,
              )
            }
          >
            {configDraft.draft.importConfig.updateExistingContacts
              ? 'Update Existing Contacts'
              : 'Do Not Update Existing Contacts'}
          </StyledFilterButton>
        </StyledInlineComposer>
        <StyledStepList>
          {[
            ['1. Upload file', 'Excel, CSV, and template-driven imports enter the customer module here.'],
            ['2. Match fields', 'Map customer, contact, source, and public-pool fields before commit.'],
            ['3. Review results', 'Keep success counts, failed rows, and downloadable logs together.'],
          ].map(([title, text]) => (
            <StyledStepItem key={title}>
              <StyledStepTitle>{title}</StyledStepTitle>
              <StyledStepText>{text}</StyledStepText>
            </StyledStepItem>
          ))}
          </StyledStepList>
        </StyledPanel>
        <StyledPanel>
          <StyledPanelTitle>Import Job Records</StyledPanelTitle>
          <StyledPanelDescription>
            {importJobs.loading
              ? 'Loading import jobs...'
              : `${importJobs.totalCount} persisted import job(s) in this workspace.`}
          </StyledPanelDescription>
          <StyledFilterList>
              {importJobs.jobs.slice(0, 6).map((job) => (
                <StyledFilterNode key={job.id}>
                  <StyledStack>
                    <StyledNodeLabel>{job.fileName}</StyledNodeLabel>
                    <StyledNodeCount>
                      {job.destination} / {job.status} / success {job.successCount} /
                      failed {job.failedCount}
                    </StyledNodeCount>
                  </StyledStack>
                  <StyledActionButtons>
                    <StyledControlButton
                      type="button"
                      disabled={importJobs.saveMappingLoading}
                      onClick={() => {
                        void importJobs
                          .saveCustomerImportMapping({
                            jobId: job.id,
                            mappedFields:
                              configDraft.draft.importConfig.selectedFields,
                          })
                          .catch(() => undefined);
                      }}
                    >
                      {importJobs.saveMappingLoading ? 'Saving...' : 'Save Mapping'}
                    </StyledControlButton>
                    <StyledControlButton
                      type="button"
                      $tone="primary"
                      disabled={importJobs.commitLoading}
                      onClick={() => {
                        void importJobs
                          .commitCustomerImportJob({
                            jobId: job.id,
                          })
                          .catch(() => undefined);
                      }}
                    >
                      {importJobs.commitLoading ? 'Committing...' : 'Commit'}
                    </StyledControlButton>
                    <StyledControlButton
                      type="button"
                      disabled={importJobs.resultLoading}
                      onClick={() => {
                        void importJobs
                          .getCustomerImportJobResult({
                            jobId: job.id,
                          })
                          .catch(() => undefined);
                      }}
                    >
                      {importJobs.resultLoading ? 'Loading...' : 'View Result'}
                    </StyledControlButton>
                  </StyledActionButtons>
                  <StyledNodeCount>
                    {job.executedAt?.slice(0, 16).replace('T', ' ') ?? '--'}
                  </StyledNodeCount>
                </StyledFilterNode>
              ))}
            {!importJobs.loading && importJobs.jobs.length === 0 ? (
              <StyledConfigNote>
                No import job exists yet. Create one above to persist the upload
                setup before field mapping and commit are implemented.
              </StyledConfigNote>
            ) : null}
          </StyledFilterList>
          {importJobs.activeResult ? (
            <StyledPanel>
              <StyledPanelTitle>
                Import Result: {importJobs.activeResult.job?.fileName ?? 'Unknown job'}
              </StyledPanelTitle>
              <StyledPanelDescription>
                {importJobs.activeResult.job
                  ? `Success ${importJobs.activeResult.job.successCount}, failed ${importJobs.activeResult.job.failedCount}, status ${importJobs.activeResult.job.status}.`
                  : 'The selected import job is no longer available.'}
              </StyledPanelDescription>
              <StyledActionButtons>
                <StyledControlButton
                  type="button"
                  disabled={importJobs.activeResult.rows.length === 0}
                  onClick={() => {
                    if (!importJobs.activeResult) {
                      return;
                    }

                    downloadImportResultCsv(importJobs.activeResult);
                  }}
                >
                  Download Result CSV
                </StyledControlButton>
              </StyledActionButtons>
              <StyledFilterList>
                {importJobs.activeResult.rows.map((row) => (
                  <StyledFilterNode key={row.id}>
                    <StyledStack>
                      <StyledNodeLabel>
                        #{row.rowNumber} {row.rowLabel}
                      </StyledNodeLabel>
                      <StyledNodeCount>
                        {row.companyName ?? 'Company pending'} /{' '}
                        {row.contactEmail ?? 'No contact email'} / {row.status}
                      </StyledNodeCount>
                    </StyledStack>
                    <StyledNodeCount>
                      {row.errorMessage ?? 'No row issue'}
                    </StyledNodeCount>
                  </StyledFilterNode>
                ))}
                {importJobs.activeResult.rows.length === 0 ? (
                  <StyledConfigNote>
                    No row-level import result has been recorded for this job yet.
                  </StyledConfigNote>
                ) : null}
              </StyledFilterList>
            </StyledPanel>
          ) : null}
        </StyledPanel>
        <StyledPanel>
          <StyledPanelTitle>Template Fields</StyledPanelTitle>
        <StyledTokenWrap>
          {configDraft.draft.importConfig.selectedFields.map((field) => (
            <StyledTagButton
              key={field}
              type="button"
              onClick={() => configDraft.toggleImportField(field)}
            >
              {field} ×
            </StyledTagButton>
          ))}
        </StyledTokenWrap>
        <StyledPanelDescription>
          Click a field to remove it from the default import selection. Add it back from
          the recommended field list below.
        </StyledPanelDescription>
        <StyledTokenWrap>
          {[
            'Company Name',
            'Contact Nickname',
            'Contact Email',
            'Company Short Name',
            'Country/Region',
            'Tag',
            'Customer Stage',
            'Customer Source',
            'Website',
            'Phone',
            'Address',
            'Customer Code',
            'Public Pool Group',
            'Facebook',
            'Twitter',
            'LinkedIn',
            'Position',
            'Gender',
          ]
            .filter(
              (field) => !configDraft.draft.importConfig.selectedFields.includes(field),
            )
            .map((field) => (
              <StyledFilterButton
                key={field}
                type="button"
                $active={false}
                onClick={() => configDraft.toggleImportField(field)}
              >
                {field}
              </StyledFilterButton>
            ))}
        </StyledTokenWrap>
      </StyledPanel>
    </StyledSplitGrid>
  );
};

const TradeCrmCustomerListWorkspace = () => {
  const navigate = useNavigate();
  const customerRecordMutations = useTradeCrmCustomerRecordMutations();
  const leadConversion = useTradeCrmLeadConversion();
  const [newCustomerName, setNewCustomerName] = useState('');
  const [leadIdToConvert, setLeadIdToConvert] = useState('');
  const [filters, setFilters] = useState<CustomerFilterState>({
    searchTerm: '',
    stage: null,
    source: null,
    tag: null,
  });
  const workspaceData = useTradeCrmCustomerWorkspaceData(undefined, {
    stageLabel: filters.stage,
    sourceLabel: filters.source,
    searchTerm: filters.searchTerm,
    tagLabel: filters.tag,
  });
  const { configDraft } = useTradeCrmCustomerRuntimeConfig(workspaceData);

  const filteredCompanyRecords = useMemo(
    () =>
      filterCompanyRecords({
        records: workspaceData.companyRecords,
        filters,
      }),
    [filters, workspaceData.companyRecords],
  );

  const filteredPeopleRecords = useMemo(
    () =>
      filterPeopleRecords({
        records: workspaceData.peopleRecords,
        filters,
      }),
    [filters, workspaceData.peopleRecords],
  );
  const visibleCustomerIds = filteredCompanyRecords
    .slice(0, 6)
    .map((record) => record.id);
  const canMoveVisibleCustomersToPublicPool =
    visibleCustomerIds.length > 0 && !workspaceData.moveCustomersToPublicPoolLoading;
  const canCreateCustomer =
    newCustomerName.trim().length > 0 &&
    !customerRecordMutations.createCustomerLoading;
  const canConvertLead =
    leadIdToConvert.trim().length > 0 &&
    !leadConversion.convertLeadToCustomerLoading;

  return (
    <TradeCrmCustomerWorkspaceLayout
      title="Customers"
      heroTitle="Operate customers from one working surface, not scattered across records, tasks, and ad-hoc follow-up."
      heroDescription="This page now behaves like a real customer operations desk: left-side segment tree, central account table, and immediate links into public pool, dedup, and customer detail."
      heroPills={[
        `${filteredCompanyRecords.length} companies`,
        `${filteredPeopleRecords.length} contacts`,
        `${workspaceData.opportunityTotalCount} opportunities`,
        `${workspaceData.taskTotalCount} tasks`,
      ]}
      tabs={getPrimaryTabs('list')}
      sidebarTitle="Customer Module"
      sidebarItems={getSidebarItems({
        activePath: 'list',
        companyTotalCount: workspaceData.companyTotalCount,
        peopleTotalCount: workspaceData.peopleTotalCount,
      })}
      insights={[
        {
          label: 'Current anchor',
          value: 'Company customer',
          description:
            'This rebuild treats company records as the formal customer master while contacts stay visible as related operators.',
        },
        {
          label: 'Main risk',
          value: `${workspaceData.totalTasksDueTodayCount} due today`,
          description:
            'Follow-up pressure stays in view so the customer list remains an execution page.',
        },
        {
          label: 'Implementation note',
          value: 'Saved URLs over filenames',
          description: workspaceData.materialAlignmentNotice,
        },
        {
          label: 'Public-pool rule',
          value: configDraft.draft.publicPoolRule.ruleName,
          description: `Configured recycle threshold: ${configDraft.draft.publicPoolRule.inactivityDays} days.`,
        },
      ]}
      workspaceContext={{
        workspace: 'Customers',
        entityType: 'customer',
        channel: 'ownership-and-follow-up',
        stage: 'Customer list',
        pathname: tradeCrmRouteMap.customers,
      }}
    >
      <CustomerSignalsCards {...workspaceData} />
      <StyledToolbar>
        <StyledSearchInput
          value={filters.searchTerm}
          onChange={(event) =>
            setFilters((currentFilters) => ({
              ...currentFilters,
              searchTerm: event.target.value,
            }))
          }
          placeholder="Search company, owner, email, phone, country, or tags"
        />
        <StyledFilterButton
          type="button"
          $active={filters.stage === null}
          onClick={() =>
            setFilters((currentFilters) => ({
              ...currentFilters,
              stage: null,
            }))
          }
        >
          All stages
        </StyledFilterButton>
        {workspaceData.customerStageSummary.slice(0, 3).map((item) => (
          <StyledFilterButton
            key={item.label}
            type="button"
            $active={filters.stage === item.label}
            onClick={() =>
              setFilters((currentFilters) => ({
                ...currentFilters,
                stage:
                  currentFilters.stage === item.label ? null : item.label,
              }))
            }
          >
            {item.label}
          </StyledFilterButton>
        ))}
        {workspaceData.customerSourceSummary.slice(0, 2).map((item) => (
          <StyledFilterButton
            key={item.label}
            type="button"
            $active={filters.source === item.label}
            onClick={() =>
              setFilters((currentFilters) => ({
                ...currentFilters,
                source:
                  currentFilters.source === item.label ? null : item.label,
              }))
            }
          >
            {item.label}
          </StyledFilterButton>
        ))}
        {workspaceData.customerTagSummary.slice(0, 2).map((item) => (
          <StyledFilterButton
            key={item.label}
            type="button"
            $active={filters.tag === item.label}
            onClick={() =>
              setFilters((currentFilters) => ({
                ...currentFilters,
                tag: currentFilters.tag === item.label ? null : item.label,
              }))
            }
          >
            {item.label}
          </StyledFilterButton>
        ))}
        <StyledFilterSummary>
          {filteredCompanyRecords.length} companies / {filteredPeopleRecords.length}{' '}
          contacts visible
          </StyledFilterSummary>
        </StyledToolbar>
        <StyledActionBar>
          <StyledActionMeta>
            <span>Create company customer</span>
            <span>
              Company is the formal customer master; contacts stay subordinate and can be
              added from the detail workspace.
            </span>
          </StyledActionMeta>
          <StyledActionButtons>
            <StyledTextInput
              value={newCustomerName}
              onChange={(event) => setNewCustomerName(event.target.value)}
              placeholder="Company name"
            />
            <StyledControlButton
              type="button"
              $tone="primary"
              disabled={!canCreateCustomer}
              onClick={() => {
                void customerRecordMutations
                  .createCustomer({
                    name: newCustomerName,
                  })
                  .then((record) => {
                    setNewCustomerName('');

                    if (record?.id) {
                      navigate(getTradeCrmCustomerDetailPath(record.id));
                    }
                  })
                  .catch(() => undefined);
              }}
            >
              {customerRecordMutations.createCustomerLoading
                ? 'Creating...'
                : 'Create Customer'}
            </StyledControlButton>
          </StyledActionButtons>
        </StyledActionBar>
        <StyledActionBar>
          <StyledActionMeta>
            <span>Convert lead to customer</span>
            <span>
              Creates the company master and first contact from a lead, then writes the
              conversion into customer timeline and operation history.
            </span>
          </StyledActionMeta>
          <StyledActionButtons>
            <StyledTextInput
              value={leadIdToConvert}
              onChange={(event) => setLeadIdToConvert(event.target.value)}
              placeholder="Lead record ID"
            />
            <StyledControlButton
              type="button"
              $tone="primary"
              disabled={!canConvertLead}
              onClick={() => {
                void leadConversion
                  .convertLeadToCustomer(leadIdToConvert.trim())
                  .then((result) => {
                    setLeadIdToConvert('');

                    if (result?.customerId) {
                      navigate(getTradeCrmCustomerDetailPath(result.customerId));
                    }
                  })
                  .catch(() => undefined);
              }}
            >
              {leadConversion.convertLeadToCustomerLoading
                ? 'Converting...'
                : 'Convert Lead'}
            </StyledControlButton>
          </StyledActionButtons>
        </StyledActionBar>
        <StyledActionBar>
          <StyledActionMeta>
            <span>Batch public-pool execution</span>
            <span>
              Move the first {visibleCustomerIds.length} visible customer(s) into the
              configured public-pool group and preserve owner audit fields.
            </span>
          </StyledActionMeta>
          <StyledActionButtons>
            <StyledControlButton
              type="button"
              $tone="danger"
              disabled={!canMoveVisibleCustomersToPublicPool}
              onClick={() => {
                void workspaceData.moveCustomersToPublicPool({
                  customerIds: visibleCustomerIds,
                  publicPoolGroup: configDraft.draft.publicPoolRule.publicPoolGroup,
                  reason: 'Manual public-pool move from customer list',
                });
              }}
            >
              {workspaceData.moveCustomersToPublicPoolLoading
                ? 'Moving...'
                : 'Move Visible To Public Pool'}
            </StyledControlButton>
          </StyledActionButtons>
        </StyledActionBar>
        <StyledSplitGrid>
        <StyledStack>
          <StyledPanel>
            <StyledPanelTitle>Customer Segments</StyledPanelTitle>
            <StyledPanelDescription>
              Mirror the OKKI left-tree pattern with counts that sellers can use for quick slicing.
            </StyledPanelDescription>
            <StyledFilterList>
              {[
                ['All Accounts', `${workspaceData.companyTotalCount}`],
                ['Visible Accounts', `${filteredCompanyRecords.length}`],
                ...workspaceData.customerStageSummary
                  .slice(0, 4)
                  .map((item) => [item.label, `${item.count}`]),
              ].map(([label, count]) => (
                <StyledFilterNode key={label}>
                  <StyledNodeLabel>{label}</StyledNodeLabel>
                  <StyledNodeCount>{count}</StyledNodeCount>
                </StyledFilterNode>
              ))}
            </StyledFilterList>
          </StyledPanel>
          <StyledPanel>
            <StyledPanelTitle>Quick Filters</StyledPanelTitle>
            <StyledTokenWrap>
              {[
                'My Customers',
                'Team Customers',
                'Department',
                'Country',
                ...configDraft.draft.sources.slice(0, 2),
                ...configDraft.draft.tags.company.slice(0, 2),
              ].map((token) => (
                <StyledToken key={token}>{token}</StyledToken>
              ))}
            </StyledTokenWrap>
          </StyledPanel>
          <StyledPanel>
            <StyledPanelTitle>Workspace Views</StyledPanelTitle>
            <StyledPanelDescription>
              Jump into the seeded Trade CRM company views when sellers need the native
              workspace table instead of the customer shell.
            </StyledPanelDescription>
            <StyledQuickLinkList>
              {[
                ['Customers (Trade CRM)', workspaceData.customerWorkspaceViewLink],
                ['Public Pool Customers', workspaceData.publicPoolWorkspaceViewLink],
                ['Customers Need Follow-up', workspaceData.followUpWorkspaceViewLink],
              ].map(([label, to]) => (
                <StyledQuickLink key={label} to={to as string}>
                  <StyledNodeLabel>{label as string}</StyledNodeLabel>
                  <StyledNodeCount>Open view</StyledNodeCount>
                </StyledQuickLink>
              ))}
            </StyledQuickLinkList>
          </StyledPanel>
        </StyledStack>
        <StyledStack>
          <TradeCrmCustomerTable
            title="Customer List"
            description="Keep company, owner, region, segmentation, and next action on the same row so customer follow-up decisions are visible at list level."
            columns={['Company', 'Owner', 'Region', 'Tags & Score', 'Latest Action']}
            rows={buildCompanyRows(filteredCompanyRecords)}
            emptyState="No customer companies are available yet."
          />
          <StyledPanel>
            <StyledPanelTitle>Contact Coverage</StyledPanelTitle>
            <StyledPanelDescription>
              Contacts stay subordinate to company customers in the first formal
              release, but the workspace still keeps visibility on reachable people and
              follow-up density.
            </StyledPanelDescription>
            <StyledMetricGrid>
              <StyledMetricCard>
                <StyledMetricLabel>Visible contacts</StyledMetricLabel>
                <StyledMetricValue>{filteredPeopleRecords.length}</StyledMetricValue>
                <StyledMetricHint>
                  Person records remain available as customer contacts, not as a parallel
                  customer master.
                </StyledMetricHint>
              </StyledMetricCard>
              <StyledMetricCard>
                <StyledMetricLabel>Companies with tags</StyledMetricLabel>
                <StyledMetricValue>
                  {
                    filteredCompanyRecords.filter(
                      (record) => getTradeCrmCustomerTagsForRecord({ record }).length > 0,
                    ).length
                  }
                </StyledMetricValue>
                <StyledMetricHint>
                  Company-level segmentation stays in the primary list and config
                  center.
                </StyledMetricHint>
              </StyledMetricCard>
            </StyledMetricGrid>
          </StyledPanel>
        </StyledStack>
      </StyledSplitGrid>
    </TradeCrmCustomerWorkspaceLayout>
  );
};

const TradeCrmCustomerPublicPoolWorkspace = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const workspaceData = useTradeCrmCustomerWorkspaceData(undefined, {
    publicPoolStateLabel: 'Public Pool',
    searchTerm,
  });
  const { configDraft } = useTradeCrmCustomerRuntimeConfig(workspaceData);
  const publicPoolBaseRecords = workspaceData.publicPoolRecords;
  const filteredPublicPoolRecords = useMemo(
    () =>
      filterCompanyRecords({
        records: publicPoolBaseRecords,
        filters: {
          searchTerm,
          stage: null,
          source: null,
          tag: null,
        },
      }),
    [publicPoolBaseRecords, searchTerm],
  );
  const publicPoolStageScopeLabel =
    configDraft.draft.publicPoolRule.scopeStages.join(', ') || 'No stage scope selected';
  const firstClaimablePublicPoolRecord = filteredPublicPoolRecords[0] ?? null;
  const visiblePublicPoolCustomerIds = filteredPublicPoolRecords
    .slice(0, 20)
    .map((record) => record.id);
  const canClaimFirstPublicPoolCustomer =
    firstClaimablePublicPoolRecord !== null &&
    !workspaceData.claimPublicPoolCustomerLoading;
  const canClaimVisiblePublicPoolCustomers =
    visiblePublicPoolCustomerIds.length > 0 &&
    !workspaceData.claimPublicPoolCustomerLoading;

  const publicPoolRows = buildCompanyRows(filteredPublicPoolRecords)
    .slice(0, 6)
    .map((row, index) => ({
      ...row,
      cells: [
        row.cells[0],
        {
          primary: `Original owner: ${row.cells[1]?.primary ?? 'Unknown'}`,
          secondary: getTradeCrmCustomerSourceLabelForRecord({
            record: filteredPublicPoolRecords?.[index],
            fallbackIndex: index,
          }),
        },
        {
          primary: getTradeCrmCustomerCountryLabel(filteredPublicPoolRecords?.[index]),
          secondary: getTradeCrmPublicPoolGroupLabelForRecord(
            filteredPublicPoolRecords?.[index],
          ),
        },
        {
          primary: getTradeCrmCustomerLastTouchLabelForRecord({
            record: filteredPublicPoolRecords?.[index],
            fallbackIndex: index + 2,
          }),
          secondary: getTradeCrmPublicPoolStateLabelForRecord(
            filteredPublicPoolRecords?.[index],
          ),
          badgeLabel: getTradeCrmPublicPoolStateLabelForRecord(
            filteredPublicPoolRecords?.[index],
          ),
          badgeTone: index % 2 === 0 ? 'amber' : 'red',
        },
        {
          primary: getTradeCrmCustomerCodeLabelForRecord(
            filteredPublicPoolRecords?.[index],
          ),
          secondary: 'Preserve owner audit',
        },
      ],
    }));

  return (
    <TradeCrmCustomerWorkspaceLayout
      title="Customers"
      heroTitle="Keep public-pool review inside the customer workspace, not hidden behind settings."
      heroDescription="This page now carries the operating frame for claim, recycle, and ownership transfer. It is the stable shell for the later public-pool resolver, rule audit, and reclaim actions."
      heroPills={[
        `${filteredPublicPoolRecords.length} claimable`,
        `${workspaceData.publicPoolRecords.length} already pooled`,
        `${configDraft.draft.publicPoolRule.inactivityDays} day rule`,
        configDraft.draft.publicPoolRule.publicPoolGroup,
      ]}
      tabs={getPrimaryTabs('public')}
      sidebarTitle="Customer Module"
      sidebarItems={getSidebarItems({
        activePath: 'public',
        companyTotalCount: workspaceData.companyTotalCount,
        peopleTotalCount: workspaceData.peopleTotalCount,
      })}
      insights={[
        {
          label: 'Ownership rule',
          value: configDraft.draft.publicPoolRule.ruleName,
          description:
            'Public pool remains visible as an execution queue rather than a hidden rule screen.',
        },
        {
          label: 'Configured scope',
          value: publicPoolStageScopeLabel,
          description:
            configDraft.draft.publicPoolRule.notifyOwnersFirst
              ? 'Owner reminder is enabled before public-pool transfer.'
              : 'Owner reminder is disabled for direct recycle.',
        },
      ]}
      workspaceContext={{
        workspace: 'Customers',
        entityType: 'customer',
        channel: 'public-pool',
        stage: 'Public pool',
      }}
    >
      <CustomerSignalsCards {...workspaceData} />
      <StyledToolbar>
        <StyledSearchInput
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search claimable accounts by company, owner, country, or tags"
        />
          <StyledFilterSummary>
            {filteredPublicPoolRecords.length} claimable accounts visible
          </StyledFilterSummary>
        </StyledToolbar>
        <StyledActionBar>
          <StyledActionMeta>
            <span>
              {firstClaimablePublicPoolRecord
                ? `Next claim: ${getTradeCrmRecordName({
                    kind: 'organization',
                    record: firstClaimablePublicPoolRecord,
                  })}`
                : 'No public-pool customer selected'}
            </span>
            <span>
              Claim writes the current workspace member as owner, clears public-pool
              state, and logs the operation.
            </span>
          </StyledActionMeta>
          <StyledActionButtons>
            <StyledControlButton
              type="button"
              $tone="primary"
              disabled={!canClaimFirstPublicPoolCustomer}
              onClick={() => {
                if (!firstClaimablePublicPoolRecord) {
                  return;
                }

                void workspaceData.claimPublicPoolCustomer(
                  firstClaimablePublicPoolRecord.id,
                );
              }}
            >
              {workspaceData.claimPublicPoolCustomerLoading
                ? 'Claiming...'
                : 'Claim First Customer'}
            </StyledControlButton>
            <StyledControlButton
              type="button"
              disabled={!canClaimVisiblePublicPoolCustomers}
              onClick={() => {
                void workspaceData.claimPublicPoolCustomers(
                  visiblePublicPoolCustomerIds,
                );
              }}
            >
              {workspaceData.claimPublicPoolCustomerLoading
                ? 'Claiming...'
                : `Claim Visible (${visiblePublicPoolCustomerIds.length})`}
            </StyledControlButton>
          </StyledActionButtons>
        </StyledActionBar>
        <StyledSplitGrid>
        <StyledStack>
          <StyledPanel>
            <StyledPanelTitle>Move to Public Pool Modes</StyledPanelTitle>
            <StyledFilterList>
              {[
                [
                  `No follow-up > ${configDraft.draft.publicPoolRule.inactivityDays}d`,
                  `${Math.max(3, Math.floor(workspaceData.companyTotalCount / 10))}`,
                ],
                [
                  'Destination group',
                  configDraft.draft.publicPoolRule.publicPoolGroup,
                ],
                ['Public pool state', `${filteredPublicPoolRecords.length}`],
                [
                  'Stage watchlist',
                  `${configDraft.draft.publicPoolRule.scopeStages.length}`,
                ],
              ].map(([label, count]) => (
                <StyledFilterNode key={label}>
                  <StyledNodeLabel>{label}</StyledNodeLabel>
                  <StyledNodeCount>{count}</StyledNodeCount>
                </StyledFilterNode>
              ))}
            </StyledFilterList>
            <StyledConfigNote>
              {configDraft.draft.publicPoolRule.notifyOwnersFirst
                ? 'Owners are warned before recycle and the original owner remains visible in the pooled record.'
                : 'Direct recycle is enabled and the original owner remains visible only in the audit lane.'}
            </StyledConfigNote>
          </StyledPanel>
        </StyledStack>
        <TradeCrmCustomerTable
          title="Public Pool Customers"
          description="Expose original owner, latest touch, region, and reclaim readiness on a high-density list similar to the OKKI public pool page."
          columns={['Company', 'Original Owner', 'Region', 'Pool Status', 'Next Move']}
          rows={publicPoolRows}
          emptyState="No public pool candidates are visible yet."
        />
      </StyledSplitGrid>
    </TradeCrmCustomerWorkspaceLayout>
  );
};

const TradeCrmCustomerDedupWorkspace = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const workspaceData = useTradeCrmCustomerWorkspaceData();
  const dedupSearch = useTradeCrmCustomerDedupSearch(searchTerm);
  const { configDraft } = useTradeCrmCustomerRuntimeConfig(workspaceData);
  const rankedMatchingRules = [...configDraft.draft.matchingRules].sort(
    (leftRule, rightRule) => rightRule.weight - leftRule.weight,
  );
  const appliedMatchingRules =
    dedupSearch.appliedRules.length > 0
      ? dedupSearch.appliedRules
      : rankedMatchingRules;
  const matchingRuleLabel = appliedMatchingRules
    .slice(0, 3)
    .map((rule) => `${rule.field} ${rule.weight}%`)
    .join(' / ');
  const totalMatchingWeight = appliedMatchingRules.reduce(
    (totalWeight, rule) => totalWeight + rule.weight,
    0,
  );
  const mergePrimaryHit = dedupSearch.hits[0] ?? null;
  const mergeDuplicateIds = dedupSearch.hits
    .slice(1, 4)
    .map((hit) => hit.customer.id);
  const canMergeTopCandidates =
    mergePrimaryHit !== null &&
    mergeDuplicateIds.length > 0 &&
    !dedupSearch.mergeCustomersLoading;

  const dedupRows = dedupSearch.hits
    .slice(0, 6)
    .map((hit, index) => ({
      id: hit.customer.id,
      cells: [
        {
          primary: getTradeCrmRecordName({
            kind: 'organization',
            record: hit.customer,
          }),
          secondary: hit.primaryMatch ?? getTradeCrmCustomerWebsiteLabel(hit.customer),
          badgeLabel: `${hit.matchScore}% match`,
          badgeTone: hit.matchScore >= 80 ? 'red' : hit.matchScore >= 55 ? 'amber' : 'blue',
        },
        {
          primary: `${getTradeCrmRecordName({
            kind: 'individual',
            record: hit.matchedContact ?? undefined,
          })}`,
          secondary: getTradeCrmCustomerEmailLabel(hit.matchedContact ?? undefined),
        },
        {
          primary: getTradeCrmCustomerCountryLabel(hit.customer),
          secondary: getTradeCrmCustomerSourceLabelForRecord({
            record: hit.customer,
            fallbackIndex: index,
          }),
        },
        {
          primary: getTradeCrmCustomerStageLabelForRecord({
            record: hit.customer,
            fallbackIndex: index,
          }),
          secondary: `Matched: ${hit.matchedFields.join(', ') || '--'}`,
          badgeLabel: `${hit.matchScore}% match`,
          badgeTone: hit.matchScore >= 80 ? 'red' : hit.matchScore >= 55 ? 'amber' : 'blue',
        },
        {
          primary: getTradeCrmCustomerLastTouchLabelForRecord({
            record: hit.customer,
            fallbackIndex: index,
          }),
          secondary: `Owner ${getTradeCrmCustomerOwnerLabel(hit.customer)}`,
        },
      ],
      actionLabel: 'Review',
      actionTo: getTradeCrmCustomerRoutePath({
        kind: 'organization',
        record: hit.customer,
      }),
    }));

  return (
    <TradeCrmCustomerWorkspaceLayout
      title="Customers"
      heroTitle="Make pre-claim and pre-import duplicate checks a first-class customer workflow."
      heroDescription="This route is now the canonical target for matching rules and dedup search. It is positioned to receive import collision review and merge actions without mixing those concerns back into list or settings."
      heroPills={[
        `${dedupSearch.totalCount} hits`,
        `${workspaceData.peopleTotalCount} contacts`,
        `${totalMatchingWeight}% configured weight`,
      ]}
      tabs={getPrimaryTabs('dedup')}
      sidebarTitle="Customer Module"
      sidebarItems={getSidebarItems({
        activePath: 'dedup',
        companyTotalCount: workspaceData.companyTotalCount,
        peopleTotalCount: workspaceData.peopleTotalCount,
      })}
      insights={[
        {
          label: 'Primary fields',
          value: matchingRuleLabel || 'No weighted fields configured',
          description:
            'The backend matching rules will extend this with social links and country weighting.',
        },
        {
          label: 'Import impact',
          value: configDraft.draft.importConfig.destination,
          description:
            'Import should call into the same dedup logic instead of keeping a separate collision model.',
        },
      ]}
      workspaceContext={{
        workspace: 'Customers',
        entityType: 'customer',
        channel: 'dedup',
        stage: 'Customer dedup',
      }}
    >
      <StyledToolbar>
        <StyledSearchInput
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search duplicate candidates by company, email, phone, or country"
        />
        <StyledFilterSummary>
          {searchTerm.trim().length === 0
            ? 'Enter a company, email, phone, contact, country, or social account'
            : dedupSearch.loading
              ? 'Searching duplicate candidates...'
              : `${dedupSearch.totalCount} potential candidates in current scope`}
        </StyledFilterSummary>
      </StyledToolbar>
      <StyledActionBar>
        <StyledActionMeta>
          <span>
            {mergePrimaryHit
              ? `Primary record: ${getTradeCrmRecordName({
                  kind: 'organization',
                  record: mergePrimaryHit.customer,
                })}`
              : 'Search first to select a primary customer'}
          </span>
          <span>
            {mergeDuplicateIds.length > 0
              ? `${mergeDuplicateIds.length} top duplicate candidate(s) will be migrated into the primary customer and audit logged.`
              : 'Merge requires at least two dedup hits.'}
          </span>
        </StyledActionMeta>
        <StyledActionButtons>
          <StyledControlButton
            type="button"
            $tone="danger"
            disabled={!canMergeTopCandidates}
            onClick={() => {
              if (!mergePrimaryHit) {
                return;
              }

              void dedupSearch.mergeCustomers({
                duplicateCustomerIds: mergeDuplicateIds,
                primaryCustomerId: mergePrimaryHit.customer.id,
                reason: 'Manual dedup merge from customer module',
              });
            }}
          >
            {dedupSearch.mergeCustomersLoading
              ? 'Merging...'
              : 'Merge Top Candidates'}
          </StyledControlButton>
        </StyledActionButtons>
      </StyledActionBar>
      <StyledCallout>
        <StyledPanelTitle>Dedup Search Scope</StyledPanelTitle>
        <StyledPanelDescription>
          Search company name, short name, contact email, phone, country, and social fields from one bar. This keeps manual dedup and import dedup aligned.
        </StyledPanelDescription>
        <StyledTokenWrap>
          {['All', ...appliedMatchingRules.map((rule) => rule.field)].map((token) => (
            <StyledToken key={token}>{token}</StyledToken>
          ))}
        </StyledTokenWrap>
      </StyledCallout>
      <TradeCrmCustomerTable
        title="Dedup Hits"
        description="Show likely existing customers before creating, claiming, or importing a new one."
        columns={['Candidate', 'Matched Contact', 'Region', 'Matching Rule', 'Latest Touch']}
        rows={dedupRows}
        emptyState="No matching candidates are available yet."
      />
    </TradeCrmCustomerWorkspaceLayout>
  );
};

const TradeCrmCustomerConfigWorkspace = ({
  activeSection,
}: {
  activeSection: ConfigSection;
}) => {
  const workspaceData = useTradeCrmCustomerWorkspaceData();
  const { configDraft, publicPoolGroupLabels } =
    useTradeCrmCustomerRuntimeConfig(workspaceData);
  const importJobs = useTradeCrmCustomerImportJobs();
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [groupParentId, setGroupParentId] = useState<string | null>(null);
  const [newTagLabels, setNewTagLabels] = useState<CustomerConfigTagInputState>({
    company: '',
    mine: '',
    subordinate: '',
  });
  const [newSourceLabel, setNewSourceLabel] = useState('');
  const [importFileName, setImportFileName] = useState('');

  return (
    <TradeCrmCustomerWorkspaceLayout
      title="Customers"
      heroTitle="Run customer configuration inside a dedicated control layer with stable deep links for each settings slice."
      heroDescription="Public-pool rules, groups, tags, sources, matching, and import now have canonical URLs. This lets the customer module grow into a real configuration center without collapsing back to a single placeholder tab."
      heroPills={[
        `${workspaceData.companyTotalCount} companies`,
        `${workspaceData.peopleTotalCount} contacts`,
        tradeCrmCustomerRouteLabels[`config-${activeSection}`],
      ]}
      tabs={getPrimaryTabs('settings')}
      secondaryTabs={getCustomerConfigTabs(activeSection)}
      sidebarTitle="Customer Module"
      sidebarItems={getSidebarItems({
        activePath: `config-${activeSection}`,
        companyTotalCount: workspaceData.companyTotalCount,
        peopleTotalCount: workspaceData.peopleTotalCount,
      })}
      insights={[
        {
          label: 'Config slice',
          value: tradeCrmCustomerRouteLabels[`config-${activeSection}`],
          description:
            'Each configuration concern now has a stable route instead of sharing one generic workspace tab.',
        },
        {
          label: 'Operational rule',
          value: 'UI first, resolver next',
          description:
            'Customer settings now persist in workspace records instead of browser-local drafts.',
        },
      ]}
      workspaceContext={{
        workspace: 'Customers',
        entityType: 'customer-config',
        channel: activeSection,
        stage: tradeCrmCustomerRouteLabels[`config-${activeSection}`],
      }}
    >
      <StyledActionBar>
        <StyledActionMeta>
          <span>
            {configDraft.hasUnsavedChanges
              ? 'Unsaved customer configuration changes'
              : 'Customer configuration is synced with workspace records'}
          </span>
          <span>
            {configDraft.lastSavedAt
              ? `Last saved ${configDraft.lastSavedAt.slice(0, 16).replace('T', ' ')}`
              : 'Save once to persist customer settings into workspace objects'}
          </span>
        </StyledActionMeta>
        <StyledActionButtons>
          <StyledControlButton type="button" onClick={configDraft.resetDraft}>
            Reset
          </StyledControlButton>
          <StyledControlButton
            type="button"
            $tone="primary"
            onClick={configDraft.saveDraft}
          >
            Save Config
          </StyledControlButton>
        </StyledActionButtons>
      </StyledActionBar>
      {renderConfigContent({
        activeSection,
        workspaceData,
        configDraft,
        newGroupLabel,
        onNewGroupLabelChange: setNewGroupLabel,
        groupParentId,
        onGroupParentIdChange: setGroupParentId,
        newTagLabels,
        onNewTagLabelChange: (scope, value) =>
          setNewTagLabels((currentState) => ({
            ...currentState,
            [scope]: value,
          })),
        newSourceLabel,
        onNewSourceLabelChange: setNewSourceLabel,
        importFileName,
        onImportFileNameChange: setImportFileName,
        importJobs,
        publicPoolGroupLabels,
      })}
    </TradeCrmCustomerWorkspaceLayout>
  );
};

const TradeCrmCustomerDetailWorkspace = () => {
  const { customerId = '' } = useParams();
  const workspaceData = useTradeCrmCustomerWorkspaceData(customerId);

  if (workspaceData.customerDetailRedirectPath) {
    return <Navigate replace to={workspaceData.customerDetailRedirectPath} />;
  }

  return (
    <TradeCrmCustomerWorkspaceLayout
      title="Customers"
      heroTitle={workspaceData.customerDetail?.displayName ?? 'Customer detail'}
      heroDescription="This routed detail page is now the stable customer-module handoff into company customer records. It is where the later customer aggregate, timeline merge, public-pool state, and import audit will surface together."
      heroPills={[
        'Company customer',
        workspaceData.customerDetail?.countryLabel ?? 'Country pending',
        workspaceData.customerDetail?.ownerLabel ?? 'Owner pending',
        `${workspaceData.customerDetailOpportunityRecords.length} related deals`,
      ]}
      tabs={getPrimaryTabs('detail')}
      sidebarTitle="Customer Module"
      sidebarItems={getSidebarItems({
        activePath: 'list',
        companyTotalCount: workspaceData.companyTotalCount,
        peopleTotalCount: workspaceData.peopleTotalCount,
      })}
      insights={[
        {
          label: 'Route payload',
          value: customerId,
          description:
            'Person-prefixed legacy routes now resolve into the linked company customer detail or fall back to the customer list.',
        },
        {
          label: 'Source record',
          value: 'Company',
          description:
            'This detail shell stays anchored to live company records, with people rendered as contact coverage instead of parallel customer masters.',
        },
        {
          label: 'Scoped records',
          value: `${workspaceData.customerDetailPeopleRecords.length} contacts / ${workspaceData.customerDetailTaskRecords.length} tasks`,
          description:
            'Detail panels now prioritize records that match the current company, point of contact, and task targets.',
        },
      ]}
      workspaceContext={{
        workspace: 'Customers',
        entityType: 'customer',
        entityId: customerId,
        channel: 'detail',
        stage: workspaceData.customerDetail?.displayName ?? 'Customer detail',
      }}
    >
      <TradeCrmCustomerDetailWorkbench
        customerDetail={workspaceData.customerDetail}
        customerDetailLoading={workspaceData.customerDetailLoading}
        opportunityRecords={workspaceData.customerDetailOpportunityRecords}
        taskRecords={workspaceData.customerDetailTaskRecords}
        peopleRecords={workspaceData.customerDetailPeopleRecords}
        timelineThreadPreviews={workspaceData.timelineThreadPreviews}
        timelineThreadTotalCount={workspaceData.timelineThreadTotalCount}
        timelineCalendarPreviews={workspaceData.timelineCalendarPreviews}
        timelineCalendarTotalCount={workspaceData.timelineCalendarTotalCount}
        customerTimelineItems={workspaceData.customerTimelineItems}
        customerTimelineTotalCount={workspaceData.customerTimelineTotalCount}
        customerOperationHistoryItems={workspaceData.customerOperationHistoryItems}
        customerOperationHistoryTotalCount={
          workspaceData.customerOperationHistoryTotalCount
        }
        customerDocumentItems={workspaceData.customerDocumentItems}
        customerDocumentTotalCount={workspaceData.customerDocumentTotalCount}
        customerAiInsight={workspaceData.customerAiInsight}
        createCustomerFollowUp={workspaceData.createCustomerFollowUp}
        createCustomerFollowUpLoading={workspaceData.createCustomerFollowUpLoading}
        createCustomerContact={workspaceData.createCustomerContact}
        createCustomerContactLoading={workspaceData.createCustomerContactLoading}
        updateCustomer={workspaceData.updateCustomer}
        updateCustomerLoading={workspaceData.updateCustomerLoading}
        updateCustomerContact={workspaceData.updateCustomerContact}
        updateCustomerContactLoading={workspaceData.updateCustomerContactLoading}
        refreshCustomerCommercialSummary={
          workspaceData.refreshCustomerCommercialSummary
        }
        refreshCustomerCommercialSummaryLoading={
          workspaceData.refreshCustomerCommercialSummaryLoading
        }
      />
    </TradeCrmCustomerWorkspaceLayout>
  );
};

export const TradeCrmCustomersPage = () => {
  const location = useLocation();
  const redirectFromLegacyView = getTradeCrmCustomerLegacyViewRedirectPath(
    new URLSearchParams(location.search).get('view'),
  );

  if (location.pathname === tradeCrmRouteMap.customers) {
    return (
      <Navigate
        replace
        to={redirectFromLegacyView ?? getTradeCrmCustomerPath('list')}
      />
    );
  }

  if (redirectFromLegacyView) {
    return <Navigate replace to={redirectFromLegacyView} />;
  }

  return (
    <Routes>
      <Route path="list" element={<TradeCrmCustomerListWorkspace />} />
      <Route path="public" element={<TradeCrmCustomerPublicPoolWorkspace />} />
      <Route path="dedup" element={<TradeCrmCustomerDedupWorkspace />} />
      <Route
        path="config/public-pool-rules"
        element={<TradeCrmCustomerConfigWorkspace activeSection="public-pool-rules" />}
      />
      <Route
        path="config/groups"
        element={<TradeCrmCustomerConfigWorkspace activeSection="groups" />}
      />
      <Route
        path="config/tags"
        element={<TradeCrmCustomerConfigWorkspace activeSection="tags" />}
      />
      <Route
        path="config/sources"
        element={<TradeCrmCustomerConfigWorkspace activeSection="sources" />}
      />
      <Route
        path="config/matching"
        element={<TradeCrmCustomerConfigWorkspace activeSection="matching" />}
      />
      <Route
        path="config/import"
        element={<TradeCrmCustomerConfigWorkspace activeSection="import" />}
      />
      <Route path=":customerId" element={<TradeCrmCustomerDetailWorkspace />} />
      <Route
        path="*"
        element={<Navigate replace to={getTradeCrmCustomerPath('list')} />}
      />
    </Routes>
  );
};
