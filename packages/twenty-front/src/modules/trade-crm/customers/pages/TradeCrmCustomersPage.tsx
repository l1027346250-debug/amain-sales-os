import { styled } from '@linaria/react';
import { useEffect, useMemo, useState } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useBeforeUnload,
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { useEnterpriseApiRequest } from '@/enterprise/shared/hooks/useEnterpriseApiRequest';
import {
  TradeCrmCustomerConfigSourcesPanel,
  TradeCrmCustomerConfigTagsPanel,
} from '@/trade-crm/customers/components/TradeCrmCustomerConfigDictionaryPanels';
import { TradeCrmCustomerConfigGroupTreeEditor } from '@/trade-crm/customers/components/TradeCrmCustomerConfigGroupTreeEditor';
import { TradeCrmCustomerConfigHistoryPanel } from '@/trade-crm/customers/components/TradeCrmCustomerConfigHistoryPanel';
import { TradeCrmCustomerConfigImportPanel } from '@/trade-crm/customers/components/TradeCrmCustomerConfigImportPanel';
import { TradeCrmCustomerConfigMatchingRulesPanel } from '@/trade-crm/customers/components/TradeCrmCustomerConfigMatchingRulesPanel';
import { TradeCrmCustomerConfigPublicPoolRulesPanel } from '@/trade-crm/customers/components/TradeCrmCustomerConfigPublicPoolRulesPanel';
import { TradeCrmCustomerConfigSnapshotImportPanel } from '@/trade-crm/customers/components/TradeCrmCustomerConfigSnapshotImportPanel';
import { TradeCrmCustomerConfigStatusPanels } from '@/trade-crm/customers/components/TradeCrmCustomerConfigStatusPanels';
import { TradeCrmCustomerDetailWorkbench } from '@/trade-crm/customers/components/TradeCrmCustomerDetailWorkbench';
import {
  TradeCrmCustomerCreateCustomerActionPanel,
  TradeCrmCustomerLeadConversionActionPanel,
  TradeCrmCustomerMoveVisibleToPublicPoolActionPanel,
} from '@/trade-crm/customers/components/TradeCrmCustomerListActionPanels';
import { TradeCrmCustomerListContentPanels } from '@/trade-crm/customers/components/TradeCrmCustomerListContentPanels';
import { TradeCrmCustomerListToolbar } from '@/trade-crm/customers/components/TradeCrmCustomerListToolbar';
import {
  TradeCrmCustomerPublicPoolClaimActionPanel,
  TradeCrmCustomerPublicPoolRuleSummaryPanel,
  TradeCrmCustomerPublicPoolToolbar,
} from '@/trade-crm/customers/components/TradeCrmCustomerPublicPoolPanels';
import {
  TradeCrmCustomerDedupMergeActionPanel,
  TradeCrmCustomerDedupSearchScopePanel,
  TradeCrmCustomerDedupToolbar,
} from '@/trade-crm/customers/components/TradeCrmCustomerDedupPanels';
import {
  getTradeCrmEnterpriseCustomerFieldValidationMessage,
} from '@/trade-crm/customers/components/TradeCrmEnterpriseCustomerFieldInput';
import { useTradeCrmCustomerConfigDraft } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigDraft';
import { useTradeCrmCustomerDedupSearch } from '@/trade-crm/customers/hooks/useTradeCrmCustomerDedupSearch';
import { useTradeCrmCustomerImportJobs } from '@/trade-crm/customers/hooks/useTradeCrmCustomerImportJobs';
import { useTradeCrmLeadConversion } from '@/trade-crm/customers/hooks/useTradeCrmLeadConversion';
import { useTradeCrmCustomerRecordMutations } from '@/trade-crm/customers/hooks/useTradeCrmCustomerRecordMutations';
import {
  normalizeTradeCrmEnterpriseCustomerFieldValueForSave,
  useTradeCrmEnterpriseCustomerFieldDefinitions,
  useTradeCrmEnterpriseCustomerFields,
  useTradeCrmEnterpriseCustomerListFields,
  type TradeCrmEnterpriseCustomerFieldDraftValue,
} from '@/trade-crm/customers/hooks/useTradeCrmEnterpriseCustomerFields';
import { TradeCrmCustomerTable } from '@/trade-crm/customers/components/TradeCrmCustomerTable';
import { TradeCrmCustomerWorkspaceLayout } from '@/trade-crm/customers/components/TradeCrmCustomerWorkspaceLayout';
import { useTradeCrmCustomerWorkspaceData } from '@/trade-crm/customers/hooks/useTradeCrmCustomerWorkspaceData';
import {
  buildCompanyRows,
  buildCustomerListEnterpriseFieldFilters,
  filterCompanyRecords,
  filterCompanyRecordsByEnterpriseFields,
  filterPeopleRecords,
  type CustomerEnterpriseFieldFilterState,
  type CustomerFilterState,
} from '@/trade-crm/customers/utils/tradeCrmCustomerListUtils';
import {
  getTradeCrmCustomerDetailPath,
  getTradeCrmCustomerLegacyViewRedirectPath,
  getTradeCrmCustomerPath,
  tradeCrmCustomerRouteLabels,
  type TradeCrmCustomerConfigSection,
} from '@/trade-crm/customers/utils/tradeCrmCustomerRouting';
import {
  getTradeCrmCustomerConfigTabs,
  getTradeCrmCustomerPrimaryTabs,
  getTradeCrmCustomerSidebarItems,
} from '@/trade-crm/customers/utils/tradeCrmCustomerNavigation';
import {
  buildCustomerConfigDraftWithSnapshotSections,
  buildCustomerConfigSnapshotExport,
  buildCustomerConfigSnapshotPreviewReport,
  canApplyCustomerConfigSnapshotPreview,
  CUSTOMER_CONFIG_SNAPSHOT_DIFF_SECTIONS,
  getCustomerConfigSnapshotSectionLabel,
  previewCustomerConfigSnapshot,
  type CustomerConfigSnapshotApplyNotice,
  type CustomerConfigSnapshotPreview,
  type CustomerConfigSnapshotSectionKey,
} from '@/trade-crm/customers/utils/tradeCrmCustomerConfigSnapshot';
import {
  getTradeCrmCustomerCodeLabelForRecord,
  getTradeCrmCustomerCountryLabel,
  getTradeCrmCustomerEmailLabel,
  getTradeCrmCustomerLastTouchLabelForRecord,
  getTradeCrmCustomerOwnerLabel,
  getTradeCrmCustomerRoutePath,
  getTradeCrmCustomerSourceLabelForRecord,
  getTradeCrmCustomerStageLabelForRecord,
  getTradeCrmCustomerTagsForRecord,
  getTradeCrmCustomerWebsiteLabel,
  getTradeCrmPublicPoolGroupLabelForRecord,
  getTradeCrmPublicPoolStateLabelForRecord,
  getTradeCrmRecordName,
  type TradeCrmCustomerPresentationRecord,
} from '@/trade-crm/customers/utils/tradeCrmCustomerPresentation';
import { tradeCrmRouteMap } from '@/trade-crm/navigation/tradeCrmRouteMap';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type ConfigSection = TradeCrmCustomerConfigSection;

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

type CustomerSignalsCardsProps = {
  companyTotalCount: number;
  peopleTotalCount: number;
  opportunityTotalCount: number;
  totalTasksDueTodayCount: number;
  materialAlignmentNotice: string;
};

const CustomerSignalsCards = ({
  companyTotalCount,
  peopleTotalCount,
  opportunityTotalCount,
  totalTasksDueTodayCount,
  materialAlignmentNotice,
}: CustomerSignalsCardsProps) => (
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

const getPublicPoolGroupLabels = (
  publicPoolRecords: TradeCrmCustomerPresentationRecord[] | undefined,
) => {
  const labels = (publicPoolRecords ?? [])
    .map((record) => getTradeCrmPublicPoolGroupLabelForRecord(record))
    .filter(
      (label): label is string => typeof label === 'string' && label.length > 0,
    );

  return labels.length > 0 ? [...new Set(labels)] : ['Default Public Pool'];
};

const downloadCustomerConfigSnapshot = ({
  activeSection,
  configDraft,
}: {
  activeSection: ConfigSection;
  configDraft: ReturnType<typeof useTradeCrmCustomerConfigDraft>;
}) => {
  const exportedAt = new Date().toISOString();
  const snapshot = buildCustomerConfigSnapshotExport({
    activeSection,
    exportedAt,
    configDraft,
  });
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  const url = window.URL.createObjectURL(blob);
  const anchorElement = document.createElement('a');

  anchorElement.href = url;
  anchorElement.download = `customer-config-${activeSection}-${exportedAt.slice(
    0,
    10,
  )}.json`;
  anchorElement.click();
  window.URL.revokeObjectURL(url);
};

const downloadCustomerConfigSnapshotPreviewReport = ({
  applyNotice,
  selectedSectionKeys,
  snapshotPreview,
  warningsAcknowledged,
}: {
  applyNotice: CustomerConfigSnapshotApplyNotice | null;
  selectedSectionKeys: CustomerConfigSnapshotSectionKey[];
  snapshotPreview: CustomerConfigSnapshotPreview;
  warningsAcknowledged: boolean;
}) => {
  const exportedAt = new Date().toISOString();
  const report = buildCustomerConfigSnapshotPreviewReport({
    applyNotice,
    exportedAt,
    selectedSectionKeys,
    snapshotPreview,
    warningsAcknowledged,
  });
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  const url = window.URL.createObjectURL(blob);
  const anchorElement = document.createElement('a');

  anchorElement.href = url;
  anchorElement.download = `customer-config-preview-report-${exportedAt.slice(
    0,
    10,
  )}.json`;
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
    publicPoolGroupLabels: getPublicPoolGroupLabels(
      workspaceData.publicPoolRecords,
    ),
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
    [
      configDraft.draft.publicPoolRule.publicPoolGroup,
      workspaceData.publicPoolRecords,
    ],
  );

  return {
    configDraft,
    publicPoolGroupLabels,
  };
};

const getCustomerConfigSectionLabel = (sectionKey: string) =>
  tradeCrmCustomerRouteLabels[
    `config-${sectionKey}` as keyof typeof tradeCrmCustomerRouteLabels
  ] ?? sectionKey;

const hasPendingConfigSectionChange = (
  pendingChangedSections: Array<{ key: string }>,
  sectionKey: string,
) => pendingChangedSections.some((section) => section.key === sectionKey);

const CUSTOMER_CONFIG_UNSAVED_CHANGES_MESSAGE =
  'Customer settings have unsaved changes. Leave without saving?';

type CustomerConfigTagInputState = {
  company: string;
  mine: string;
  subordinate: string;
};

type CustomerConfigEditorState = Record<string, string>;

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
  tagEditorValues,
  onTagEditorValueChange,
  clearTagEditorValue,
  newSourceLabel,
  onNewSourceLabelChange,
  sourceEditorValues,
  onSourceEditorValueChange,
  clearSourceEditorValue,
  importFileName,
  onImportFileNameChange,
  snapshotJsonInput,
  onSnapshotJsonInputChange,
  snapshotApplyNotice,
  snapshotPreview,
  snapshotWarningsAcknowledged,
  selectedSnapshotSectionKeys,
  onPreviewSnapshot,
  onApplySnapshot,
  onApplySelectedSnapshotSections,
  onApplySnapshotSection,
  onClearSnapshotSectionSelection,
  onSelectAllSnapshotSections,
  onSnapshotWarningsAcknowledgedChange,
  onToggleSnapshotSection,
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
  tagEditorValues: CustomerConfigEditorState;
  onTagEditorValueChange: (key: string, value: string) => void;
  clearTagEditorValue: (key: string) => void;
  newSourceLabel: string;
  onNewSourceLabelChange: (value: string) => void;
  sourceEditorValues: CustomerConfigEditorState;
  onSourceEditorValueChange: (key: string, value: string) => void;
  clearSourceEditorValue: (key: string) => void;
  importFileName: string;
  onImportFileNameChange: (value: string) => void;
  snapshotJsonInput: string;
  onSnapshotJsonInputChange: (value: string) => void;
  snapshotApplyNotice: CustomerConfigSnapshotApplyNotice | null;
  snapshotPreview: CustomerConfigSnapshotPreview | null;
  snapshotWarningsAcknowledged: boolean;
  selectedSnapshotSectionKeys: CustomerConfigSnapshotSectionKey[];
  onPreviewSnapshot: () => void;
  onApplySnapshot: () => void;
  onApplySelectedSnapshotSections: () => void;
  onApplySnapshotSection: (
    sectionKey: CustomerConfigSnapshotSectionKey,
  ) => void;
  onClearSnapshotSectionSelection: () => void;
  onSelectAllSnapshotSections: () => void;
  onSnapshotWarningsAcknowledgedChange: (value: boolean) => void;
  onToggleSnapshotSection: (
    sectionKey: CustomerConfigSnapshotSectionKey,
  ) => void;
  importJobs: ReturnType<typeof useTradeCrmCustomerImportJobs>;
  publicPoolGroupLabels: string[];
}) => {
  if (activeSection === 'public-pool-rules') {
    return (
      <TradeCrmCustomerConfigPublicPoolRulesPanel
        configDraft={configDraft}
        currentPublicPoolRecordCount={workspaceData.publicPoolRecords.length}
        hasUnsavedPublicPoolRules={hasPendingConfigSectionChange(
          configDraft.pendingChangedSections,
          'public-pool-rules',
        )}
        isExecutingPublicPoolRules={
          workspaceData.executeCustomerPublicPoolRulesLoading
        }
        publicPoolGroupLabels={publicPoolGroupLabels}
        stageLabels={workspaceData.customerStageSummary.map(
          (item) => item.label,
        )}
        onExecutePublicPoolRules={() => {
          void workspaceData.executeCustomerPublicPoolRules();
        }}
      />
    );
  }

  if (activeSection === 'groups') {
    return (
      <TradeCrmCustomerConfigGroupTreeEditor
        configDraft={configDraft}
        groupParentId={groupParentId}
        hasUnsavedGroups={hasPendingConfigSectionChange(
          configDraft.pendingChangedSections,
          'groups',
        )}
        newGroupLabel={newGroupLabel}
        onGroupParentIdChange={onGroupParentIdChange}
        onNewGroupLabelChange={onNewGroupLabelChange}
      />
    );
  }

  if (activeSection === 'tags') {
    return (
      <TradeCrmCustomerConfigTagsPanel
        clearTagEditorValue={clearTagEditorValue}
        configDraft={configDraft}
        hasUnsavedTags={hasPendingConfigSectionChange(
          configDraft.pendingChangedSections,
          'tags',
        )}
        newTagLabels={newTagLabels}
        onNewTagLabelChange={onNewTagLabelChange}
        onTagEditorValueChange={onTagEditorValueChange}
        tagEditorValues={tagEditorValues}
      />
    );
  }

  if (activeSection === 'sources') {
    return (
      <TradeCrmCustomerConfigSourcesPanel
        clearSourceEditorValue={clearSourceEditorValue}
        configDraft={configDraft}
        hasUnsavedSources={hasPendingConfigSectionChange(
          configDraft.pendingChangedSections,
          'sources',
        )}
        newSourceLabel={newSourceLabel}
        onNewSourceLabelChange={onNewSourceLabelChange}
        onSourceEditorValueChange={onSourceEditorValueChange}
        sourceEditorValues={sourceEditorValues}
      />
    );
  }

  if (activeSection === 'matching') {
    return (
      <TradeCrmCustomerConfigMatchingRulesPanel
        configDraft={configDraft}
        hasUnsavedMatchingRules={hasPendingConfigSectionChange(
          configDraft.pendingChangedSections,
          'matching',
        )}
      />
    );
  }

  return (
    <>
      <TradeCrmCustomerConfigImportPanel
        configDraft={configDraft}
        hasUnsavedImportConfig={hasPendingConfigSectionChange(
          configDraft.pendingChangedSections,
          'import',
        )}
        importFileName={importFileName}
        importJobs={importJobs}
        onImportFileNameChange={onImportFileNameChange}
      />
      <TradeCrmCustomerConfigSnapshotImportPanel
        getSectionLabel={getCustomerConfigSectionLabel}
        onApplySelectedSnapshotSections={onApplySelectedSnapshotSections}
        onApplySnapshot={onApplySnapshot}
        onApplySnapshotSection={onApplySnapshotSection}
        onClearSnapshotSectionSelection={onClearSnapshotSectionSelection}
        onExportPreviewReport={() => {
          if (snapshotPreview === null) {
            return;
          }

          downloadCustomerConfigSnapshotPreviewReport({
            applyNotice: snapshotApplyNotice,
            selectedSectionKeys: selectedSnapshotSectionKeys,
            snapshotPreview,
            warningsAcknowledged: snapshotWarningsAcknowledged,
          });
        }}
        onPreviewSnapshot={onPreviewSnapshot}
        onSelectAllSnapshotSections={onSelectAllSnapshotSections}
        onSnapshotJsonInputChange={onSnapshotJsonInputChange}
        onSnapshotWarningsAcknowledgedChange={
          onSnapshotWarningsAcknowledgedChange
        }
        onToggleSnapshotSection={onToggleSnapshotSection}
        selectedSnapshotSectionKeys={selectedSnapshotSectionKeys}
        snapshotJsonInput={snapshotJsonInput}
        snapshotPreview={snapshotPreview}
        snapshotWarningsAcknowledged={snapshotWarningsAcknowledged}
      />
    </>
  );
};

const TradeCrmCustomerListWorkspace = () => {
  const navigate = useNavigate();
  const enterpriseApiRequest = useEnterpriseApiRequest();
  const customerRecordMutations = useTradeCrmCustomerRecordMutations();
  const leadConversion = useTradeCrmLeadConversion();
  const [newCustomerName, setNewCustomerName] = useState('');
  const [
    newCustomerEnterpriseFieldValues,
    setNewCustomerEnterpriseFieldValues,
  ] = useState<Record<string, TradeCrmEnterpriseCustomerFieldDraftValue>>({});
  const [
    isSavingNewCustomerEnterpriseFields,
    setIsSavingNewCustomerEnterpriseFields,
  ] = useState(false);
  const [leadIdToConvert, setLeadIdToConvert] = useState('');
  const [filters, setFilters] = useState<CustomerFilterState>({
    searchTerm: '',
    stage: null,
    source: null,
    tag: null,
  });
  const [enterpriseFieldFilters, setEnterpriseFieldFilters] =
    useState<CustomerEnterpriseFieldFilterState>({});
  const enterpriseFieldDefinitions =
    useTradeCrmEnterpriseCustomerFieldDefinitions();
  const enterpriseFieldFilterPayload = useMemo(
    () =>
      buildCustomerListEnterpriseFieldFilters({
        fields: enterpriseFieldDefinitions.searchableFields,
        filters: enterpriseFieldFilters,
      }),
    [enterpriseFieldDefinitions.searchableFields, enterpriseFieldFilters],
  );
  const workspaceData = useTradeCrmCustomerWorkspaceData(undefined, {
    enterpriseFieldFilters: enterpriseFieldFilterPayload,
    stageLabel: filters.stage,
    sourceLabel: filters.source,
    searchTerm: filters.searchTerm,
    tagLabel: filters.tag,
  });
  const enterpriseListFields = useTradeCrmEnterpriseCustomerListFields(
    (workspaceData.companyRecords ?? []).map((record) => record.id),
  );
  const { configDraft } = useTradeCrmCustomerRuntimeConfig(workspaceData);

  const baseFilteredCompanyRecords = useMemo(
    () =>
      filterCompanyRecords({
        records: workspaceData.companyRecords,
        filters,
      }),
    [filters, workspaceData.companyRecords],
  );
  const filteredCompanyRecords = useMemo(
    () =>
      filterCompanyRecordsByEnterpriseFields({
        fields: enterpriseFieldDefinitions.searchableFields,
        filters: enterpriseFieldFilters,
        optionsByFieldId: enterpriseFieldDefinitions.optionsByFieldId,
        records: baseFilteredCompanyRecords,
        valuesByRecordId: enterpriseListFields.valuesByRecordId,
      }),
    [
      baseFilteredCompanyRecords,
      enterpriseFieldDefinitions.optionsByFieldId,
      enterpriseFieldDefinitions.searchableFields,
      enterpriseFieldFilters,
      enterpriseListFields.valuesByRecordId,
    ],
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
    visibleCustomerIds.length > 0 &&
    !workspaceData.moveCustomersToPublicPoolLoading;
  const createEnterpriseFieldValidationMessages = useMemo(
    () =>
      Object.fromEntries(
        enterpriseFieldDefinitions.createFields.map((field) => [
          field.id,
          getTradeCrmEnterpriseCustomerFieldValidationMessage({
            field,
            options: enterpriseFieldDefinitions.optionsByFieldId[field.id] ?? [],
            value: newCustomerEnterpriseFieldValues[field.id],
          }),
        ]),
      ),
    [
      enterpriseFieldDefinitions.createFields,
      enterpriseFieldDefinitions.optionsByFieldId,
      newCustomerEnterpriseFieldValues,
    ],
  );
  const hasInvalidCreateEnterpriseField = Object.values(
    createEnterpriseFieldValidationMessages,
  ).some((message) => message !== null);
  const canCreateCustomer =
    newCustomerName.trim().length > 0 &&
    !customerRecordMutations.createCustomerLoading &&
    !isSavingNewCustomerEnterpriseFields &&
    !hasInvalidCreateEnterpriseField;
  const canConvertLead =
    leadIdToConvert.trim().length > 0 &&
    !leadConversion.convertLeadToCustomerLoading;

  const updateNewCustomerEnterpriseFieldValue = (
    fieldDefinitionId: string,
    value: TradeCrmEnterpriseCustomerFieldDraftValue,
  ) => {
    setNewCustomerEnterpriseFieldValues((currentValues) => ({
      ...currentValues,
      [fieldDefinitionId]: value,
    }));
  };

  const saveNewCustomerEnterpriseFields = async (recordId: string) => {
    const values = enterpriseFieldDefinitions.createFields
      .filter((field) => !field.readonly)
      .map((field) => ({
        fieldDefinitionId: field.id,
        value: normalizeTradeCrmEnterpriseCustomerFieldValueForSave({
          field,
          value: newCustomerEnterpriseFieldValues[field.id],
        }),
      }));

    if (values.length === 0) {
      return;
    }

    setIsSavingNewCustomerEnterpriseFields(true);

    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/records/customer/${recordId}/field-values`,
        {
          body: JSON.stringify({ values }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'PUT',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to save create-layout enterprise fields');
      }
    } finally {
      setIsSavingNewCustomerEnterpriseFields(false);
    }
  };

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
      tabs={getTradeCrmCustomerPrimaryTabs('list')}
      sidebarTitle="Customer Module"
      sidebarItems={getTradeCrmCustomerSidebarItems({
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
      <CustomerSignalsCards
        companyTotalCount={workspaceData.companyTotalCount}
        peopleTotalCount={workspaceData.peopleTotalCount}
        opportunityTotalCount={workspaceData.opportunityTotalCount}
        totalTasksDueTodayCount={workspaceData.totalTasksDueTodayCount}
        materialAlignmentNotice={workspaceData.materialAlignmentNotice}
      />
      <TradeCrmCustomerListToolbar
        customerSourceSummary={workspaceData.customerSourceSummary}
        customerStageSummary={workspaceData.customerStageSummary}
        customerTagSummary={workspaceData.customerTagSummary}
        enterpriseFieldFilters={enterpriseFieldFilters}
        filteredCompanyCount={filteredCompanyRecords.length}
        filteredPeopleCount={filteredPeopleRecords.length}
        filters={filters}
        isEnterpriseFieldDefinitionLoading={enterpriseFieldDefinitions.isLoading}
        isEnterpriseListFieldLoading={enterpriseListFields.isLoading}
        optionsByFieldId={enterpriseFieldDefinitions.optionsByFieldId}
        searchableEnterpriseFields={enterpriseFieldDefinitions.searchableFields}
        onEnterpriseFieldFiltersChange={setEnterpriseFieldFilters}
        onFiltersChange={setFilters}
      />
      <TradeCrmCustomerCreateCustomerActionPanel
        canCreateCustomer={canCreateCustomer}
        createFields={enterpriseFieldDefinitions.createFields}
        hasInvalidCreateEnterpriseField={hasInvalidCreateEnterpriseField}
        isCreatingCustomer={
          customerRecordMutations.createCustomerLoading ||
          isSavingNewCustomerEnterpriseFields
        }
        newCustomerEnterpriseFieldValues={newCustomerEnterpriseFieldValues}
        newCustomerName={newCustomerName}
        optionsByFieldId={enterpriseFieldDefinitions.optionsByFieldId}
        validationMessagesByFieldId={createEnterpriseFieldValidationMessages}
        onCreateCustomer={() => {
          void (async () => {
            const record = await customerRecordMutations.createCustomer({
              name: newCustomerName,
            });

            if (!record?.id) {
              return;
            }

            try {
              await saveNewCustomerEnterpriseFields(record.id);
            } catch {
              // The customer master has already been created; keep routing
              // to detail so operators can complete fields there if needed.
            }

            setNewCustomerName('');
            setNewCustomerEnterpriseFieldValues({});
            navigate(getTradeCrmCustomerDetailPath(record.id));
          })().catch(() => undefined);
        }}
        onNewCustomerNameChange={setNewCustomerName}
        onUpdateEnterpriseFieldValue={updateNewCustomerEnterpriseFieldValue}
      />
      <TradeCrmCustomerLeadConversionActionPanel
        canConvertLead={canConvertLead}
        isConvertingLead={leadConversion.convertLeadToCustomerLoading}
        leadIdToConvert={leadIdToConvert}
        onConvertLead={() => {
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
        onLeadIdToConvertChange={setLeadIdToConvert}
      />
      <TradeCrmCustomerMoveVisibleToPublicPoolActionPanel
        canMoveVisibleCustomersToPublicPool={
          canMoveVisibleCustomersToPublicPool
        }
        isMovingVisibleCustomersToPublicPool={
          workspaceData.moveCustomersToPublicPoolLoading
        }
        visibleCustomerCount={visibleCustomerIds.length}
        onMoveVisibleCustomersToPublicPool={() => {
          void workspaceData.moveCustomersToPublicPool({
            customerIds: visibleCustomerIds,
            publicPoolGroup: configDraft.draft.publicPoolRule.publicPoolGroup,
            reason: 'Manual public-pool move from customer list',
          });
        }}
      />
      <TradeCrmCustomerListContentPanels
        companiesWithTagsCount={
          filteredCompanyRecords.filter(
            (record) =>
              getTradeCrmCustomerTagsForRecord({ record }).length > 0,
          ).length
        }
        contactCount={filteredPeopleRecords.length}
        customerRows={buildCompanyRows(filteredCompanyRecords, {
          fields: enterpriseFieldDefinitions.listFields,
          optionsByFieldId: enterpriseListFields.optionsByFieldId,
          valuesByRecordId: enterpriseListFields.valuesByRecordId,
        })}
        quickFilterTokens={[
          'My Customers',
          'Team Customers',
          'Department',
          'Country',
          ...configDraft.draft.sources.slice(0, 2),
          ...configDraft.draft.tags.company.slice(0, 2),
        ]}
        segmentItems={[
          { count: `${workspaceData.companyTotalCount}`, label: 'All Accounts' },
          {
            count: `${filteredCompanyRecords.length}`,
            label: 'Visible Accounts',
          },
          ...workspaceData.customerStageSummary.slice(0, 4).map((item) => ({
            count: `${item.count}`,
            label: item.label,
          })),
        ]}
        tableColumns={[
          'Company',
          'Owner',
          'Region',
          'Tags & Score',
          'Latest Action',
          ...enterpriseFieldDefinitions.listFields.map(
            (field) => field.fieldName,
          ),
        ]}
        workspaceViewLinks={[
          {
            label: 'Customers (Trade CRM)',
            to: workspaceData.customerWorkspaceViewLink,
          },
          {
            label: 'Public Pool Customers',
            to: workspaceData.publicPoolWorkspaceViewLink,
          },
          {
            label: 'Customers Need Follow-up',
            to: workspaceData.followUpWorkspaceViewLink,
          },
        ]}
      />
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
    configDraft.draft.publicPoolRule.scopeStages.join(', ') ||
    'No stage scope selected';
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
          primary: getTradeCrmCustomerCountryLabel(
            filteredPublicPoolRecords?.[index],
          ),
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
      heroDescription="This page now carries the operating frame for claim, recycle, and ownership transfer. Rule execution, reclaim actions, and public-pool audit are all available from this workspace."
      heroPills={[
        `${filteredPublicPoolRecords.length} claimable`,
        `${workspaceData.publicPoolRecords.length} already pooled`,
        `${configDraft.draft.publicPoolRule.inactivityDays} day rule`,
        configDraft.draft.publicPoolRule.publicPoolGroup,
      ]}
      tabs={getTradeCrmCustomerPrimaryTabs('public')}
      sidebarTitle="Customer Module"
      sidebarItems={getTradeCrmCustomerSidebarItems({
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
          description: configDraft.draft.publicPoolRule.notifyOwnersFirst
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
      <CustomerSignalsCards
        companyTotalCount={workspaceData.companyTotalCount}
        peopleTotalCount={workspaceData.peopleTotalCount}
        opportunityTotalCount={workspaceData.opportunityTotalCount}
        totalTasksDueTodayCount={workspaceData.totalTasksDueTodayCount}
        materialAlignmentNotice={workspaceData.materialAlignmentNotice}
      />
      <TradeCrmCustomerPublicPoolToolbar
        claimableCustomerCount={filteredPublicPoolRecords.length}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
      />
      <TradeCrmCustomerPublicPoolClaimActionPanel
        canClaimFirstPublicPoolCustomer={canClaimFirstPublicPoolCustomer}
        canClaimVisiblePublicPoolCustomers={canClaimVisiblePublicPoolCustomers}
        firstClaimableCustomerName={
          firstClaimablePublicPoolRecord !== null
            ? getTradeCrmRecordName({
                kind: 'organization',
                record: firstClaimablePublicPoolRecord,
              })
            : null
        }
        isClaimingPublicPoolCustomer={
          workspaceData.claimPublicPoolCustomerLoading
        }
        visiblePublicPoolCustomerCount={visiblePublicPoolCustomerIds.length}
        onClaimFirstPublicPoolCustomer={() => {
          if (firstClaimablePublicPoolRecord === null) {
            return;
          }

          void workspaceData.claimPublicPoolCustomer(
            firstClaimablePublicPoolRecord.id,
          );
        }}
        onClaimVisiblePublicPoolCustomers={() => {
          void workspaceData.claimPublicPoolCustomers(
            visiblePublicPoolCustomerIds,
          );
        }}
      />
      <StyledSplitGrid>
        <StyledStack>
          <TradeCrmCustomerPublicPoolRuleSummaryPanel
            inactivityDays={configDraft.draft.publicPoolRule.inactivityDays}
            isOwnerReminderEnabled={
              configDraft.draft.publicPoolRule.notifyOwnersFirst
            }
            publicPoolGroup={configDraft.draft.publicPoolRule.publicPoolGroup}
            publicPoolRecordCount={filteredPublicPoolRecords.length}
            recycleCandidateCount={Math.max(
              3,
              Math.floor(workspaceData.companyTotalCount / 10),
            )}
            stageScopeCount={
              configDraft.draft.publicPoolRule.scopeStages.length
            }
          />
        </StyledStack>
        <TradeCrmCustomerTable
          title="Public Pool Customers"
          description="Expose original owner, latest touch, region, and reclaim readiness on a high-density list similar to the OKKI public pool page."
          columns={[
            'Company',
            'Original Owner',
            'Region',
            'Pool Status',
            'Next Move',
          ]}
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

  const dedupRows = dedupSearch.hits.slice(0, 6).map((hit, index) => ({
    id: hit.customer.id,
    cells: [
      {
        primary: getTradeCrmRecordName({
          kind: 'organization',
          record: hit.customer,
        }),
        secondary:
          hit.primaryMatch ?? getTradeCrmCustomerWebsiteLabel(hit.customer),
        badgeLabel: `${hit.matchScore}% match`,
        badgeTone:
          hit.matchScore >= 80
            ? 'red'
            : hit.matchScore >= 55
              ? 'amber'
              : 'blue',
      },
      {
        primary: `${getTradeCrmRecordName({
          kind: 'individual',
          record: hit.matchedContact ?? undefined,
        })}`,
        secondary: getTradeCrmCustomerEmailLabel(
          hit.matchedContact ?? undefined,
        ),
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
        badgeTone:
          hit.matchScore >= 80
            ? 'red'
            : hit.matchScore >= 55
              ? 'amber'
              : 'blue',
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
      tabs={getTradeCrmCustomerPrimaryTabs('dedup')}
      sidebarTitle="Customer Module"
      sidebarItems={getTradeCrmCustomerSidebarItems({
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
      <TradeCrmCustomerDedupToolbar
        isSearchingDedupCandidates={dedupSearch.loading}
        searchTerm={searchTerm}
        totalCandidateCount={dedupSearch.totalCount}
        onSearchTermChange={setSearchTerm}
      />
      <TradeCrmCustomerDedupMergeActionPanel
        canMergeTopCandidates={canMergeTopCandidates}
        duplicateCandidateCount={mergeDuplicateIds.length}
        isMergingCustomers={dedupSearch.mergeCustomersLoading}
        primaryCustomerName={
          mergePrimaryHit !== null
            ? getTradeCrmRecordName({
                kind: 'organization',
                record: mergePrimaryHit.customer,
              })
            : null
        }
        onMergeTopCandidates={() => {
          if (mergePrimaryHit === null) {
            return;
          }

          void dedupSearch.mergeCustomers({
            duplicateCustomerIds: mergeDuplicateIds,
            primaryCustomerId: mergePrimaryHit.customer.id,
            reason: 'Manual dedup merge from customer module',
          });
        }}
      />
      <TradeCrmCustomerDedupSearchScopePanel
        appliedMatchingRules={appliedMatchingRules}
      />
      <TradeCrmCustomerTable
        title="Dedup Hits"
        description="Show likely existing customers before creating, claiming, or importing a new one."
        columns={[
          'Candidate',
          'Matched Contact',
          'Region',
          'Matching Rule',
          'Latest Touch',
        ]}
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
  const leaveBlocker = useBlocker(configDraft.hasUnsavedChanges);
  const pendingConfigSectionKeys = configDraft.pendingChangedSections.map(
    (section) => section.key,
  );
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [groupParentId, setGroupParentId] = useState<string | null>(null);
  const [newTagLabels, setNewTagLabels] = useState<CustomerConfigTagInputState>(
    {
      company: '',
      mine: '',
      subordinate: '',
    },
  );
  const [tagEditorValues, setTagEditorValues] =
    useState<CustomerConfigEditorState>({});
  const [newSourceLabel, setNewSourceLabel] = useState('');
  const [sourceEditorValues, setSourceEditorValues] =
    useState<CustomerConfigEditorState>({});
  const [importFileName, setImportFileName] = useState('');
  const [snapshotJsonInput, setSnapshotJsonInput] = useState('');
  const [snapshotPreview, setSnapshotPreview] =
    useState<CustomerConfigSnapshotPreview | null>(null);
  const [snapshotWarningsAcknowledged, setSnapshotWarningsAcknowledged] =
    useState(false);
  const [selectedSnapshotSectionKeys, setSelectedSnapshotSectionKeys] =
    useState<CustomerConfigSnapshotSectionKey[]>([]);
  const [snapshotApplyNotice, setSnapshotApplyNotice] =
    useState<CustomerConfigSnapshotApplyNotice | null>(null);
  const [blockedNavigationError, setBlockedNavigationError] = useState<
    string | null
  >(null);

  useBeforeUnload(
    (event) => {
      if (!configDraft.hasUnsavedChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = CUSTOMER_CONFIG_UNSAVED_CHANGES_MESSAGE;
    },
    {
      capture: true,
    },
  );

  useEffect(() => {
    if (configDraft.hasUnsavedChanges) {
      return;
    }

    setBlockedNavigationError(null);
    setNewGroupLabel('');
    setGroupParentId(null);
    setNewTagLabels({
      company: '',
      mine: '',
      subordinate: '',
    });
    setTagEditorValues({});
    setNewSourceLabel('');
    setSourceEditorValues({});
    setImportFileName('');
    setSnapshotJsonInput('');
    setSnapshotPreview(null);
    setSnapshotWarningsAcknowledged(false);
    setSelectedSnapshotSectionKeys([]);
    setSnapshotApplyNotice(null);
  }, [configDraft.hasUnsavedChanges]);

  return (
    <TradeCrmCustomerWorkspaceLayout
      title="Customers"
      heroTitle="Run customer configuration inside a dedicated control layer with stable deep links for each settings slice."
      heroDescription="Public-pool rules, groups, tags, sources, matching, and import now have canonical URLs backed by workspace persistence. This keeps the customer module operating as a real configuration center."
      heroPills={[
        `${workspaceData.companyTotalCount} companies`,
        `${workspaceData.peopleTotalCount} contacts`,
        tradeCrmCustomerRouteLabels[`config-${activeSection}`],
      ]}
      tabs={getTradeCrmCustomerPrimaryTabs('settings')}
      secondaryTabs={getTradeCrmCustomerConfigTabs(
        activeSection,
        pendingConfigSectionKeys,
      )}
      sidebarTitle="Customer Module"
      sidebarItems={getTradeCrmCustomerSidebarItems({
        activePath: `config-${activeSection}`,
        companyTotalCount: workspaceData.companyTotalCount,
        peopleTotalCount: workspaceData.peopleTotalCount,
        pendingConfigSectionKeys,
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
          value: 'Persist to workspace',
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
      <TradeCrmCustomerConfigStatusPanels
        blockedNavigationError={blockedNavigationError}
        configDraft={configDraft}
        getSectionLabel={getCustomerConfigSectionLabel}
        isNavigationBlocked={leaveBlocker.state === 'blocked'}
        snapshotApplyNotice={snapshotApplyNotice}
        unsavedChangesMessage={CUSTOMER_CONFIG_UNSAVED_CHANGES_MESSAGE}
        onDiscardAndProceed={() => {
          setBlockedNavigationError(null);
          configDraft.resetDraft();

          if (leaveBlocker.state === 'blocked') {
            leaveBlocker.proceed();
          }
        }}
        onExportSnapshot={() =>
          downloadCustomerConfigSnapshot({
            activeSection,
            configDraft,
          })
        }
        onResetConfig={configDraft.resetDraft}
        onSaveAndProceed={() => {
          void (async () => {
            setBlockedNavigationError(null);
            const didSave = await configDraft.saveDraft();

            if (didSave && leaveBlocker.state === 'blocked') {
              leaveBlocker.proceed();

              return;
            }

            setBlockedNavigationError(
              configDraft.saveError ??
                'Saving failed. Resolve validation issues or retry before leaving.',
            );
          })();
        }}
        onSaveConfig={() => {
          void configDraft.saveDraft();
        }}
        onStayOnPage={() => {
          setBlockedNavigationError(null);
          if (leaveBlocker.state === 'blocked') {
            leaveBlocker.reset();
          }
        }}
      />
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
        tagEditorValues,
        onTagEditorValueChange: (key, value) =>
          setTagEditorValues((currentState) => ({
            ...currentState,
            [key]: value,
          })),
        clearTagEditorValue: (key) =>
          setTagEditorValues((currentState) => {
            const nextState = { ...currentState };

            delete nextState[key];

            return nextState;
          }),
        newSourceLabel,
        onNewSourceLabelChange: setNewSourceLabel,
        sourceEditorValues,
        onSourceEditorValueChange: (key, value) =>
          setSourceEditorValues((currentState) => ({
            ...currentState,
            [key]: value,
          })),
        clearSourceEditorValue: (key) =>
          setSourceEditorValues((currentState) => {
            const nextState = { ...currentState };

            delete nextState[key];

            return nextState;
          }),
        importFileName,
        onImportFileNameChange: setImportFileName,
        snapshotJsonInput,
        onSnapshotJsonInputChange: (value) => {
          setSnapshotJsonInput(value);
          setSnapshotPreview(null);
          setSnapshotWarningsAcknowledged(false);
          setSelectedSnapshotSectionKeys([]);
        },
        snapshotPreview,
        snapshotApplyNotice,
        snapshotWarningsAcknowledged,
        selectedSnapshotSectionKeys,
        onPreviewSnapshot: () => {
          const nextSnapshotPreview = previewCustomerConfigSnapshot({
            currentConfig: configDraft.draft,
            snapshotJsonInput,
          });

          setSnapshotPreview(nextSnapshotPreview);
          setSnapshotWarningsAcknowledged(
            nextSnapshotPreview.impactWarnings.length === 0,
          );
          setSelectedSnapshotSectionKeys(
            nextSnapshotPreview.currentDraftDiffSections.map(
              (section) => section.key,
            ),
          );
        },
        onApplySnapshot: () => {
          const snapshotConfigDraft =
            snapshotPreview?.snapshotConfigDraft ?? null;

          if (
            !canApplyCustomerConfigSnapshotPreview({
              snapshotPreview,
              warningsAcknowledged: snapshotWarningsAcknowledged,
            }) ||
            snapshotConfigDraft === null
          ) {
            return;
          }

          configDraft.replaceDraft(snapshotConfigDraft);
          setSnapshotApplyNotice({
            appliedAt: new Date().toISOString(),
            impactWarningCount: snapshotPreview?.impactWarnings.length ?? 0,
            mode: 'full',
            sectionLabels: CUSTOMER_CONFIG_SNAPSHOT_DIFF_SECTIONS.map(
              (section) => section.label,
            ),
            warningsAcknowledged: snapshotWarningsAcknowledged,
          });
          setSnapshotPreview(null);
          setSnapshotWarningsAcknowledged(false);
          setSelectedSnapshotSectionKeys([]);
        },
        onApplySelectedSnapshotSections: () => {
          const snapshotConfigDraft =
            snapshotPreview?.snapshotConfigDraft ?? null;

          if (
            !canApplyCustomerConfigSnapshotPreview({
              snapshotPreview,
              warningsAcknowledged: snapshotWarningsAcknowledged,
            }) ||
            snapshotConfigDraft === null ||
            selectedSnapshotSectionKeys.length === 0
          ) {
            return;
          }

          configDraft.replaceDraft(
            buildCustomerConfigDraftWithSnapshotSections({
              currentConfig: configDraft.draft,
              sectionKeys: selectedSnapshotSectionKeys,
              snapshotConfig: snapshotConfigDraft,
            }),
          );
          setSnapshotApplyNotice({
            appliedAt: new Date().toISOString(),
            impactWarningCount: snapshotPreview?.impactWarnings.length ?? 0,
            mode: 'selected',
            sectionLabels: selectedSnapshotSectionKeys.map(
              getCustomerConfigSnapshotSectionLabel,
            ),
            warningsAcknowledged: snapshotWarningsAcknowledged,
          });
          setSnapshotPreview(null);
          setSnapshotWarningsAcknowledged(false);
          setSelectedSnapshotSectionKeys([]);
        },
        onApplySnapshotSection: (sectionKey) => {
          const snapshotConfigDraft =
            snapshotPreview?.snapshotConfigDraft ?? null;

          if (
            !canApplyCustomerConfigSnapshotPreview({
              snapshotPreview,
              warningsAcknowledged: snapshotWarningsAcknowledged,
            }) ||
            snapshotConfigDraft === null
          ) {
            return;
          }

          configDraft.replaceDraft(
            buildCustomerConfigDraftWithSnapshotSections({
              currentConfig: configDraft.draft,
              sectionKeys: [sectionKey],
              snapshotConfig: snapshotConfigDraft,
            }),
          );
          setSnapshotApplyNotice({
            appliedAt: new Date().toISOString(),
            impactWarningCount: snapshotPreview?.impactWarnings.length ?? 0,
            mode: 'single',
            sectionLabels: [
              getCustomerConfigSnapshotSectionLabel(sectionKey),
            ],
            warningsAcknowledged: snapshotWarningsAcknowledged,
          });
          setSnapshotPreview(null);
          setSnapshotWarningsAcknowledged(false);
          setSelectedSnapshotSectionKeys([]);
        },
        onClearSnapshotSectionSelection: () => {
          setSelectedSnapshotSectionKeys([]);
        },
        onSelectAllSnapshotSections: () => {
          if (snapshotPreview === null) {
            return;
          }

          setSelectedSnapshotSectionKeys(
              snapshotPreview.currentDraftDiffSections.map(
                (section) => section.key,
              ),
          );
        },
        onSnapshotWarningsAcknowledgedChange: setSnapshotWarningsAcknowledged,
        onToggleSnapshotSection: (sectionKey) => {
          setSelectedSnapshotSectionKeys((currentSectionKeys) =>
            currentSectionKeys.includes(sectionKey)
              ? currentSectionKeys.filter(
                  (currentSectionKey) => currentSectionKey !== sectionKey,
                )
              : [...currentSectionKeys, sectionKey],
          );
        },
        importJobs,
        publicPoolGroupLabels,
      })}
      <TradeCrmCustomerConfigHistoryPanel configDraft={configDraft} />
    </TradeCrmCustomerWorkspaceLayout>
  );
};

const TradeCrmCustomerDetailWorkspace = () => {
  const { customerId = '' } = useParams();
  const workspaceData = useTradeCrmCustomerWorkspaceData(customerId);
  const enterpriseCustomerFields =
    useTradeCrmEnterpriseCustomerFields(customerId);

  if (workspaceData.customerDetailRedirectPath) {
    return <Navigate replace to={workspaceData.customerDetailRedirectPath} />;
  }

  return (
    <TradeCrmCustomerWorkspaceLayout
      title="Customers"
      heroTitle={workspaceData.customerDetail?.displayName ?? 'Customer detail'}
      heroDescription="This routed detail page is the stable customer-module handoff into company customer records. Customer timeline, public-pool state, import audit, and related commercial data surface together here."
      heroPills={[
        'Company customer',
        workspaceData.customerDetail?.countryLabel ?? 'Country pending',
        workspaceData.customerDetail?.ownerLabel ?? 'Owner pending',
        `${workspaceData.customerDetailOpportunityRecords.length} related deals`,
      ]}
      tabs={getTradeCrmCustomerPrimaryTabs('detail')}
      sidebarTitle="Customer Module"
      sidebarItems={getTradeCrmCustomerSidebarItems({
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
        customerOperationHistoryItems={
          workspaceData.customerOperationHistoryItems
        }
        customerOperationHistoryTotalCount={
          workspaceData.customerOperationHistoryTotalCount
        }
        customerDocumentItems={workspaceData.customerDocumentItems}
        customerDocumentTotalCount={workspaceData.customerDocumentTotalCount}
        customerAiInsight={workspaceData.customerAiInsight}
        createCustomerFollowUp={workspaceData.createCustomerFollowUp}
        createCustomerFollowUpLoading={
          workspaceData.createCustomerFollowUpLoading
        }
        createCustomerContact={workspaceData.createCustomerContact}
        createCustomerContactLoading={
          workspaceData.createCustomerContactLoading
        }
        updateCustomer={workspaceData.updateCustomer}
        updateCustomerLoading={workspaceData.updateCustomerLoading}
        updateCustomerContact={workspaceData.updateCustomerContact}
        updateCustomerContactLoading={
          workspaceData.updateCustomerContactLoading
        }
        refreshCustomerCommercialSummary={
          workspaceData.refreshCustomerCommercialSummary
        }
        refreshCustomerCommercialSummaryLoading={
          workspaceData.refreshCustomerCommercialSummaryLoading
        }
        enterpriseCustomerDetailFields={enterpriseCustomerFields.detailFields}
        enterpriseCustomerEditFields={enterpriseCustomerFields.editFields}
        enterpriseCustomerFieldDraftValues={enterpriseCustomerFields.draftValues}
        enterpriseCustomerFieldOptionsByFieldId={
          enterpriseCustomerFields.optionsByFieldId
        }
        enterpriseCustomerFieldsLoading={enterpriseCustomerFields.isLoading}
        enterpriseCustomerFieldsSaving={enterpriseCustomerFields.isSaving}
        onEnterpriseCustomerFieldDraftValueChange={
          enterpriseCustomerFields.updateDraftValue
        }
        onSaveEnterpriseCustomerFields={
          enterpriseCustomerFields.saveEnterpriseCustomerFields
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
        element={
          <TradeCrmCustomerConfigWorkspace activeSection="public-pool-rules" />
        }
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
