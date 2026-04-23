import { styled } from '@linaria/react';
import { useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';

import { useEnterpriseApiRequest } from '@/enterprise/shared/hooks/useEnterpriseApiRequest';
import { TradeCrmCustomerConfigContent } from '@/trade-crm/customers/components/TradeCrmCustomerConfigContent';
import { TradeCrmCustomerConfigHistoryPanel } from '@/trade-crm/customers/components/TradeCrmCustomerConfigHistoryPanel';
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
import { useTradeCrmCustomerDedupSearch } from '@/trade-crm/customers/hooks/useTradeCrmCustomerDedupSearch';
import { useTradeCrmCustomerImportJobs } from '@/trade-crm/customers/hooks/useTradeCrmCustomerImportJobs';
import { useTradeCrmLeadConversion } from '@/trade-crm/customers/hooks/useTradeCrmLeadConversion';
import { useTradeCrmCustomerRecordMutations } from '@/trade-crm/customers/hooks/useTradeCrmCustomerRecordMutations';
import { useTradeCrmCustomerConfigEditorState } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigEditorState';
import { useTradeCrmCustomerConfigNavigationGuard } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigNavigationGuard';
import { useTradeCrmCustomerRuntimeConfig } from '@/trade-crm/customers/hooks/useTradeCrmCustomerRuntimeConfig';
import { useTradeCrmCustomerConfigSnapshotManager } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigSnapshotManager';
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
  type TradeCrmCustomerConfigSection,
} from '@/trade-crm/customers/utils/tradeCrmCustomerRouting';
import {
  getTradeCrmCustomerConfigTabs,
  getTradeCrmCustomerPrimaryTabs,
} from '@/trade-crm/customers/utils/tradeCrmCustomerNavigation';
import { getTradeCrmCustomerConfigLayoutData } from '@/trade-crm/customers/utils/tradeCrmCustomerConfigLayout';
import {
  downloadTradeCrmCustomerConfigSnapshot,
  downloadTradeCrmCustomerConfigSnapshotPreviewReport,
} from '@/trade-crm/customers/utils/tradeCrmCustomerConfigDownload';
import { getTradeCrmCustomerDedupLayoutData } from '@/trade-crm/customers/utils/tradeCrmCustomerDedupLayout';
import { getTradeCrmCustomerDetailLayoutData } from '@/trade-crm/customers/utils/tradeCrmCustomerDetailLayout';
import { getTradeCrmCustomerListLayoutData } from '@/trade-crm/customers/utils/tradeCrmCustomerListLayout';
import { getTradeCrmCustomerPublicPoolLayoutData } from '@/trade-crm/customers/utils/tradeCrmCustomerPublicPoolLayout';
import {
  CUSTOMER_CONFIG_UNSAVED_CHANGES_MESSAGE,
  getCustomerConfigSectionLabel,
} from '@/trade-crm/customers/utils/tradeCrmCustomerConfigWorkspace';
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
  const layoutData = getTradeCrmCustomerListLayoutData({
    companyTotalCount: workspaceData.companyTotalCount,
    filteredCompanyCount: filteredCompanyRecords.length,
    filteredPeopleCount: filteredPeopleRecords.length,
    materialAlignmentNotice: workspaceData.materialAlignmentNotice,
    peopleTotalCount: workspaceData.peopleTotalCount,
    publicPoolRuleInactivityDays:
      configDraft.draft.publicPoolRule.inactivityDays,
    publicPoolRuleName: configDraft.draft.publicPoolRule.ruleName,
    totalOpportunityCount: workspaceData.opportunityTotalCount,
    totalTaskCount: workspaceData.taskTotalCount,
    totalTasksDueTodayCount: workspaceData.totalTasksDueTodayCount,
  });
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
      heroTitle={layoutData.heroTitle}
      heroDescription={layoutData.heroDescription}
      heroPills={layoutData.heroPills}
      tabs={getTradeCrmCustomerPrimaryTabs('list')}
      sidebarTitle={layoutData.sidebarTitle}
      sidebarItems={layoutData.sidebarItems}
      insights={layoutData.insights}
      workspaceContext={layoutData.workspaceContext}
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
  const layoutData = getTradeCrmCustomerPublicPoolLayoutData({
    companyTotalCount: workspaceData.companyTotalCount,
    filteredPublicPoolCount: filteredPublicPoolRecords.length,
    notifyOwnersFirst: configDraft.draft.publicPoolRule.notifyOwnersFirst,
    peopleTotalCount: workspaceData.peopleTotalCount,
    publicPoolGroup: configDraft.draft.publicPoolRule.publicPoolGroup,
    publicPoolRuleInactivityDays: configDraft.draft.publicPoolRule.inactivityDays,
    publicPoolRuleName: configDraft.draft.publicPoolRule.ruleName,
    publicPoolStageScopeLabel,
    totalPublicPoolCount: workspaceData.publicPoolRecords.length,
  });
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
      heroTitle={layoutData.heroTitle}
      heroDescription={layoutData.heroDescription}
      heroPills={layoutData.heroPills}
      tabs={getTradeCrmCustomerPrimaryTabs('public')}
      sidebarTitle={layoutData.sidebarTitle}
      sidebarItems={layoutData.sidebarItems}
      insights={layoutData.insights}
      workspaceContext={layoutData.workspaceContext}
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
  const layoutData = getTradeCrmCustomerDedupLayoutData({
    companyTotalCount: workspaceData.companyTotalCount,
    importDestination: configDraft.draft.importConfig.destination,
    matchingRuleLabel,
    peopleTotalCount: workspaceData.peopleTotalCount,
    totalHitCount: dedupSearch.totalCount,
    totalMatchingWeight,
  });

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
        heroTitle={layoutData.heroTitle}
        heroDescription={layoutData.heroDescription}
        heroPills={layoutData.heroPills}
        tabs={getTradeCrmCustomerPrimaryTabs('dedup')}
        sidebarTitle={layoutData.sidebarTitle}
        sidebarItems={layoutData.sidebarItems}
        insights={layoutData.insights}
        workspaceContext={layoutData.workspaceContext}
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
  const pendingConfigSectionKeys = configDraft.pendingChangedSections.map(
    (section) => section.key,
  );
  const layoutData = getTradeCrmCustomerConfigLayoutData({
    activeSection,
    companyTotalCount: workspaceData.companyTotalCount,
    pendingConfigSectionKeys,
    peopleTotalCount: workspaceData.peopleTotalCount,
  });
  const editorState = useTradeCrmCustomerConfigEditorState(
    configDraft.hasUnsavedChanges,
  );
  const snapshotManager = useTradeCrmCustomerConfigSnapshotManager(configDraft);
  const navigationGuard = useTradeCrmCustomerConfigNavigationGuard({
    configDraft,
    unsavedChangesMessage: CUSTOMER_CONFIG_UNSAVED_CHANGES_MESSAGE,
  });

  return (
    <TradeCrmCustomerWorkspaceLayout
      title="Customers"
      heroTitle={layoutData.heroTitle}
      heroDescription={layoutData.heroDescription}
      heroPills={layoutData.heroPills}
      tabs={getTradeCrmCustomerPrimaryTabs('settings')}
      secondaryTabs={getTradeCrmCustomerConfigTabs(
        activeSection,
        pendingConfigSectionKeys,
      )}
      sidebarTitle={layoutData.sidebarTitle}
      sidebarItems={layoutData.sidebarItems}
      insights={layoutData.insights}
      workspaceContext={layoutData.workspaceContext}
    >
      <TradeCrmCustomerConfigStatusPanels
        blockedNavigationError={navigationGuard.blockedNavigationError}
        configDraft={configDraft}
        getSectionLabel={getCustomerConfigSectionLabel}
        isNavigationBlocked={navigationGuard.isNavigationBlocked}
        snapshotApplyNotice={snapshotManager.snapshotApplyNotice}
        unsavedChangesMessage={CUSTOMER_CONFIG_UNSAVED_CHANGES_MESSAGE}
        onDiscardAndProceed={navigationGuard.onDiscardAndProceed}
        onExportSnapshot={() =>
          downloadTradeCrmCustomerConfigSnapshot({
            activeSection,
            configDraft,
          })
        }
        onResetConfig={configDraft.resetDraft}
        onSaveAndProceed={navigationGuard.onSaveAndProceed}
        onSaveConfig={navigationGuard.onSaveConfig}
        onStayOnPage={navigationGuard.onStayOnPage}
      />
      <TradeCrmCustomerConfigContent
        activeSection={activeSection}
        clearSourceEditorValue={editorState.clearSourceEditorValue}
        clearTagEditorValue={editorState.clearTagEditorValue}
        configDraft={configDraft}
        groupParentId={editorState.groupParentId}
        importFileName={editorState.importFileName}
        importJobs={importJobs}
        newGroupLabel={editorState.newGroupLabel}
        newSourceLabel={editorState.newSourceLabel}
        newTagLabels={editorState.newTagLabels}
        onApplySelectedSnapshotSections={
          snapshotManager.onApplySelectedSnapshotSections
        }
        onApplySnapshot={snapshotManager.onApplySnapshot}
        onApplySnapshotSection={snapshotManager.onApplySnapshotSection}
        onClearSnapshotSectionSelection={
          snapshotManager.onClearSnapshotSectionSelection
        }
        onExportPreviewReport={() => {
          if (snapshotManager.snapshotPreview === null) {
            return;
          }

          downloadTradeCrmCustomerConfigSnapshotPreviewReport({
            applyNotice: snapshotManager.snapshotApplyNotice,
            selectedSectionKeys: snapshotManager.selectedSnapshotSectionKeys,
            snapshotPreview: snapshotManager.snapshotPreview,
            warningsAcknowledged:
              snapshotManager.snapshotWarningsAcknowledged,
          });
        }}
        onGroupParentIdChange={editorState.setGroupParentId}
        onImportFileNameChange={editorState.setImportFileName}
        onNewGroupLabelChange={editorState.setNewGroupLabel}
        onNewSourceLabelChange={editorState.setNewSourceLabel}
        onNewTagLabelChange={editorState.onNewTagLabelChange}
        onPreviewSnapshot={snapshotManager.onPreviewSnapshot}
        onSelectAllSnapshotSections={snapshotManager.onSelectAllSnapshotSections}
        onSnapshotJsonInputChange={snapshotManager.onSnapshotJsonInputChange}
        onSnapshotWarningsAcknowledgedChange={
          snapshotManager.setSnapshotWarningsAcknowledged
        }
        onSourceEditorValueChange={editorState.onSourceEditorValueChange}
        onTagEditorValueChange={editorState.onTagEditorValueChange}
        onToggleSnapshotSection={snapshotManager.onToggleSnapshotSection}
        publicPoolGroupLabels={publicPoolGroupLabels}
        selectedSnapshotSectionKeys={snapshotManager.selectedSnapshotSectionKeys}
        snapshotJsonInput={snapshotManager.snapshotJsonInput}
        snapshotPreview={snapshotManager.snapshotPreview}
        snapshotWarningsAcknowledged={
          snapshotManager.snapshotWarningsAcknowledged
        }
        sourceEditorValues={editorState.sourceEditorValues}
        tagEditorValues={editorState.tagEditorValues}
        workspaceData={workspaceData}
      />
      <TradeCrmCustomerConfigHistoryPanel configDraft={configDraft} />
    </TradeCrmCustomerWorkspaceLayout>
  );
};

const TradeCrmCustomerDetailWorkspace = () => {
  const { customerId = '' } = useParams();
  const workspaceData = useTradeCrmCustomerWorkspaceData(customerId);
  const enterpriseCustomerFields =
    useTradeCrmEnterpriseCustomerFields(customerId);
  const layoutData = getTradeCrmCustomerDetailLayoutData({
    companyTotalCount: workspaceData.companyTotalCount,
    countryLabel: workspaceData.customerDetail?.countryLabel,
    customerId,
    displayName: workspaceData.customerDetail?.displayName,
    opportunityCount: workspaceData.customerDetailOpportunityRecords.length,
    ownerLabel: workspaceData.customerDetail?.ownerLabel,
    peopleCount: workspaceData.customerDetailPeopleRecords.length,
    peopleTotalCount: workspaceData.peopleTotalCount,
    taskCount: workspaceData.customerDetailTaskRecords.length,
  });

  if (workspaceData.customerDetailRedirectPath) {
    return <Navigate replace to={workspaceData.customerDetailRedirectPath} />;
  }

  return (
    <TradeCrmCustomerWorkspaceLayout
      title="Customers"
      heroTitle={layoutData.heroTitle}
      heroDescription={layoutData.heroDescription}
      heroPills={layoutData.heroPills}
      tabs={getTradeCrmCustomerPrimaryTabs('detail')}
      sidebarTitle={layoutData.sidebarTitle}
      sidebarItems={layoutData.sidebarItems}
      insights={layoutData.insights}
      workspaceContext={layoutData.workspaceContext}
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
