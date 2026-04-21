import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import { useSnackBarOnQueryError } from '@/apollo/hooks/useSnackBarOnQueryError';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import {
  getTradeCrmCustomerDetailPath,
  getTradeCrmCustomerPath,
  type TradeCrmCustomerKind,
  parseTradeCrmCustomerRouteId,
} from '@/trade-crm/customers/utils/tradeCrmCustomerRouting';
import {
  getTradeCrmCustomerAddressLabelForRecord,
  getTradeCrmCustomerCodeLabelForRecord,
  getTradeCrmCustomerEmailLabel,
  getTradeCrmCustomerGroupLabelForRecord,
  getTradeCrmCustomerLastContactLabelForRecord,
  getTradeCrmCustomerLastTouchLabelForRecord,
  getTradeCrmCustomerLastWonLabelForRecord,
  getTradeCrmCustomerPhoneLabel,
  getTradeCrmCustomerScoreLabelForRecord,
  getTradeCrmCustomerShortNameLabelForRecord,
  getTradeCrmCustomerSocialLabelsForRecord,
  getTradeCrmCustomerSourceValueForLabel,
  getTradeCrmCustomerSourceLabelForRecord,
  getTradeCrmCustomerStageValueForLabel,
  getTradeCrmCustomerStageLabelForRecord,
  getTradeCrmCustomerStarLabelForRecord,
  getTradeCrmCustomerTagValueForLabel,
  getTradeCrmCustomerTagsForRecord,
  getTradeCrmCustomerTotalWonAmountLabelForRecord,
  getTradeCrmPublicPoolGroupLabelForRecord,
  getTradeCrmPublicPoolStateValueForLabel,
  getTradeCrmPublicPoolStateLabelForRecord,
} from '@/trade-crm/customers/utils/tradeCrmCustomerPresentation';
import { useTradeCrmObjectViewLink } from '@/workbench/hooks/useTradeCrmObjectViewLink';
import { useTasksDueToday } from '@/workbench/hooks/useTasksDueToday';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import {
  GetTimelineCalendarEventsFromCompanyIdDocument,
  type GetTimelineCalendarEventsFromCompanyIdQuery,
  type GetTimelineCalendarEventsFromCompanyIdQueryVariables,
  GetTimelineCalendarEventsFromPersonIdDocument,
  type GetTimelineCalendarEventsFromPersonIdQuery,
  type GetTimelineCalendarEventsFromPersonIdQueryVariables,
  GetTimelineThreadsFromCompanyIdDocument,
  type GetTimelineThreadsFromCompanyIdQuery,
  type GetTimelineThreadsFromCompanyIdQueryVariables,
  GetTimelineThreadsFromPersonIdDocument,
  type GetTimelineThreadsFromPersonIdQuery,
  type GetTimelineThreadsFromPersonIdQueryVariables,
} from '~/generated/graphql';

type GenericRecord = Record<string, unknown> & {
  id: string;
  __typename: string;
};

type CustomerWorkspaceListRecord = Record<string, unknown> & {
  id: string;
};

type CustomerDetailRecord = Record<string, unknown> & {
  id: string;
};

export type TradeCrmCustomerSummaryItem = {
  label: string;
  count: number;
};

type TradeCrmTimelineThreadPreview = {
  id: string;
  subject: string;
  lastMessageReceivedAt: string;
  lastMessageBody: string;
  participantLabel: string;
  messageCountLabel: string;
};

type TradeCrmTimelineCalendarPreview = {
  id: string;
  title: string;
  startsAt: string;
  location: string;
  participantLabel: string;
};

export type TradeCrmCustomerTimelineItem = {
  id: string;
  occurredAt: string;
  type: string;
  title: string;
  description: string | null;
  actorName: string | null;
  sourceObjectName: string | null;
  sourceRecordId: string | null;
  metadata: Record<string, unknown> | null;
};

export type TradeCrmCustomerOperationHistoryItem = {
  id: string;
  operatedAt: string | null;
  operationSummary: string;
  operationType: string | null;
  operatorName: string | null;
};

export type TradeCrmCustomerDocumentItem = {
  id: string;
  name: string;
  fileCategory: string | null;
  fullPath: string | null;
  createdAt: string | null;
};

export type TradeCrmCustomerAiInsight = {
  customerId: string;
  status: string;
  summary: string;
  contactCount: number;
  opportunityCount: number;
  signals: Array<{
    label: string;
    value: string;
  }>;
};

export type TradeCrmCustomerWorkspaceFilters = {
  stageLabel?: string | null;
  sourceLabel?: string | null;
  publicPoolStateLabel?: string | null;
  searchTerm?: string;
  tagLabel?: string | null;
};

type CustomerWorkspaceListQuery = {
  customerWorkspaceList: {
    records: CustomerWorkspaceListRecord[];
    totalCount: number;
    publicPoolCount: number;
    stageSummary: TradeCrmCustomerSummaryItem[];
    groupSummary: TradeCrmCustomerSummaryItem[];
    sourceSummary: TradeCrmCustomerSummaryItem[];
    tagSummary: TradeCrmCustomerSummaryItem[];
  };
};

type CustomerPublicPoolListQuery = {
  customerPublicPoolList: {
    records: CustomerWorkspaceListRecord[];
    totalCount: number;
    stageSummary: TradeCrmCustomerSummaryItem[];
    groupSummary: TradeCrmCustomerSummaryItem[];
    sourceSummary: TradeCrmCustomerSummaryItem[];
    tagSummary: TradeCrmCustomerSummaryItem[];
  };
};

type CustomerWorkspaceListQueryVariables = {
  searchTerm?: string;
  sourceValue?: string;
  stageValue?: string;
  tagValue?: string;
  publicPoolStateValue?: string;
  limit?: number;
};

type CustomerPublicPoolListQueryVariables = {
  searchTerm?: string;
  sourceValue?: string;
  stageValue?: string;
  tagValue?: string;
  publicPoolGroupValue?: string;
  limit?: number;
};

type CustomerDetailQuery = {
  customerDetail: {
    customer: CustomerDetailRecord | null;
    contacts: CustomerDetailRecord[];
    opportunities: CustomerDetailRecord[];
    contactCount: number;
    opportunityCount: number;
  };
};

type CustomerTimelineQuery = {
  customerTimeline: {
    items: TradeCrmCustomerTimelineItem[];
    totalCount: number;
  };
};

type CustomerOperationHistoryQuery = {
  customerOperationHistory: {
    items: TradeCrmCustomerOperationHistoryItem[];
    totalCount: number;
  };
};

type CustomerDocumentsQuery = {
  customerDocuments: {
    items: TradeCrmCustomerDocumentItem[];
    totalCount: number;
  };
};

type CustomerAiInsightQuery = {
  customerAiInsight: TradeCrmCustomerAiInsight;
};

type CreateCustomerFollowUpMutation = {
  createCustomerFollowUp: {
    lastFollowUpAt: string;
    timelineItem: TradeCrmCustomerTimelineItem;
  };
};

type CreateCustomerContactMutation = {
  createCustomerContact: {
    record: Record<string, unknown> & {
      id: string;
    };
  };
};

type UpdateCustomerMutation = {
  updateCustomer: {
    record: Record<string, unknown> & {
      id: string;
    };
  };
};

type UpdateCustomerContactMutation = {
  updateCustomerContact: {
    record: Record<string, unknown> & {
      id: string;
    };
  };
};

type RefreshCustomerCommercialSummaryMutation = {
  refreshCustomerCommercialSummary: {
    customerId: string;
    totalWonAmount: number;
    lastWonAt: string | null;
    opportunityCount: number;
  };
};

type CustomerPublicPoolActionMutation = {
  claimPublicPoolCustomer?: {
    customerIds: string[];
    affectedCount: number;
    publicPoolState: string;
  };
  moveCustomersToPublicPool?: {
    customerIds: string[];
    affectedCount: number;
    publicPoolState: string;
  };
};

type ExecuteCustomerPublicPoolRulesMutation = {
  executeCustomerPublicPoolRules: {
    customerIds: string[];
    affectedCount: number;
    evaluatedRuleCount: number;
  };
};

type CustomerDetailQueryVariables = {
  customerId: string;
};

type CustomerTimelineQueryVariables = {
  customerId: string;
  limit?: number;
};

type CustomerOperationHistoryQueryVariables = {
  customerId: string;
  limit?: number;
};

type CustomerDocumentsQueryVariables = {
  customerId: string;
  limit?: number;
};

type CustomerAiInsightQueryVariables = {
  customerId: string;
};

type CreateCustomerFollowUpMutationVariables = {
  input: {
    customerId: string;
    body: string;
  };
};

type CreateCustomerContactMutationVariables = {
  input: {
    customerId: string;
    nickname?: string;
    email?: string;
    phone?: string;
  };
};

type UpdateCustomerMutationVariables = {
  input: {
    customerId: string;
    name?: string;
    shortName?: string;
    country?: string;
    websiteUrl?: string;
    addressLine?: string;
    customerStage?: string;
    customerGroup?: string;
    customerSource?: string;
    customerScore?: number;
  };
};

type UpdateCustomerContactMutationVariables = {
  input: {
    contactId: string;
    nickname?: string;
    email?: string;
    phone?: string;
    position?: string;
  };
};

type RefreshCustomerCommercialSummaryMutationVariables = {
  input: {
    customerId: string;
  };
};

type ClaimPublicPoolCustomerMutationVariables = {
  input: {
    customerId?: string;
    customerIds?: string[];
  };
};

type MoveCustomersToPublicPoolMutationVariables = {
  input: {
    customerIds: string[];
    publicPoolGroup?: string;
    reason?: string;
  };
};

const GET_CUSTOMER_WORKSPACE_LIST = gql`
  query GetCustomerWorkspaceList(
    $searchTerm: String
    $sourceValue: String
    $stageValue: String
    $tagValue: String
    $publicPoolStateValue: String
    $limit: Int
  ) {
    customerWorkspaceList(
      searchTerm: $searchTerm
      sourceValue: $sourceValue
      stageValue: $stageValue
      tagValue: $tagValue
      publicPoolStateValue: $publicPoolStateValue
      limit: $limit
    ) {
      totalCount
      publicPoolCount
      records {
        id
        name
        shortName
        country
        address
        website
        domainName
        accountOwner
        owner
        customerStage
        customerGroup
        customerSource
        customerTags
        customerStar
        customerScore
        customerCode
        lastContactAt
        lastFollowUpAt
        lastWonAt
        totalWonAmount
        publicPoolState
        publicPoolGroup
        publicPoolEnteredAt
      }
      stageSummary {
        label
        count
      }
      groupSummary {
        label
        count
      }
      sourceSummary {
        label
        count
      }
      tagSummary {
        label
        count
      }
    }
  }
`;

const GET_CUSTOMER_PUBLIC_POOL_LIST = gql`
  query GetCustomerPublicPoolList(
    $searchTerm: String
    $sourceValue: String
    $stageValue: String
    $tagValue: String
    $publicPoolGroupValue: String
    $limit: Int
  ) {
    customerPublicPoolList(
      searchTerm: $searchTerm
      sourceValue: $sourceValue
      stageValue: $stageValue
      tagValue: $tagValue
      publicPoolGroupValue: $publicPoolGroupValue
      limit: $limit
    ) {
      totalCount
      records {
        id
        name
        shortName
        country
        address
        website
        domainName
        accountOwner
        owner
        customerStage
        customerGroup
        customerSource
        customerTags
        customerStar
        customerScore
        customerCode
        lastContactAt
        lastFollowUpAt
        lastWonAt
        totalWonAmount
        publicPoolState
        publicPoolGroup
        publicPoolEnteredAt
      }
      stageSummary {
        label
        count
      }
      groupSummary {
        label
        count
      }
      sourceSummary {
        label
        count
      }
      tagSummary {
        label
        count
      }
    }
  }
`;

const GET_CUSTOMER_DETAIL = gql`
  query GetCustomerDetail($customerId: UUID!) {
    customerDetail(customerId: $customerId) {
      customer
      contacts
      opportunities
      contactCount
      opportunityCount
    }
  }
`;

const GET_CUSTOMER_TIMELINE = gql`
  query GetCustomerTimeline($customerId: UUID!, $limit: Int) {
    customerTimeline(customerId: $customerId, limit: $limit) {
      totalCount
      items {
        id
        occurredAt
        type
        title
        description
        actorName
        sourceObjectName
        sourceRecordId
        metadata
      }
    }
  }
`;

const GET_CUSTOMER_OPERATION_HISTORY = gql`
  query GetCustomerOperationHistory($customerId: UUID!, $limit: Int) {
    customerOperationHistory(customerId: $customerId, limit: $limit) {
      totalCount
      items {
        id
        operatedAt
        operationSummary
        operationType
        operatorName
      }
    }
  }
`;

const GET_CUSTOMER_DOCUMENTS = gql`
  query GetCustomerDocuments($customerId: UUID!, $limit: Int) {
    customerDocuments(customerId: $customerId, limit: $limit) {
      totalCount
      items {
        id
        name
        fileCategory
        fullPath
        createdAt
      }
    }
  }
`;

const GET_CUSTOMER_AI_INSIGHT = gql`
  query GetCustomerAiInsight($customerId: UUID!) {
    customerAiInsight(customerId: $customerId) {
      customerId
      status
      summary
      contactCount
      opportunityCount
      signals {
        label
        value
      }
    }
  }
`;

const CREATE_CUSTOMER_FOLLOW_UP = gql`
  mutation CreateCustomerFollowUp($input: CreateCustomerFollowUpInput!) {
    createCustomerFollowUp(input: $input) {
      lastFollowUpAt
      timelineItem {
        id
        occurredAt
        type
        title
        description
        actorName
        sourceObjectName
        sourceRecordId
        metadata
      }
    }
  }
`;

const CREATE_CUSTOMER_CONTACT = gql`
  mutation CreateCustomerContact($input: CreateCustomerContactInput!) {
    createCustomerContact(input: $input) {
      record
    }
  }
`;

const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      record
    }
  }
`;

const UPDATE_CUSTOMER_CONTACT = gql`
  mutation UpdateCustomerContact($input: UpdateCustomerContactInput!) {
    updateCustomerContact(input: $input) {
      record
    }
  }
`;

const REFRESH_CUSTOMER_COMMERCIAL_SUMMARY = gql`
  mutation RefreshCustomerCommercialSummary(
    $input: RefreshCustomerCommercialSummaryInput!
  ) {
    refreshCustomerCommercialSummary(input: $input) {
      customerId
      totalWonAmount
      lastWonAt
      opportunityCount
    }
  }
`;

const CLAIM_PUBLIC_POOL_CUSTOMER = gql`
  mutation ClaimPublicPoolCustomer($input: ClaimPublicPoolCustomerInput!) {
    claimPublicPoolCustomer(input: $input) {
      customerIds
      affectedCount
      publicPoolState
    }
  }
`;

const MOVE_CUSTOMERS_TO_PUBLIC_POOL = gql`
  mutation MoveCustomersToPublicPool($input: MoveCustomersToPublicPoolInput!) {
    moveCustomersToPublicPool(input: $input) {
      customerIds
      affectedCount
      publicPoolState
    }
  }
`;

const EXECUTE_CUSTOMER_PUBLIC_POOL_RULES = gql`
  mutation ExecuteCustomerPublicPoolRules {
    executeCustomerPublicPoolRules {
      customerIds
      affectedCount
      evaluatedRuleCount
    }
  }
`;

const TIMELINE_PREVIEW_PAGE_SIZE = 3;

const getLinkValue = (value: unknown) => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const linkValue = value as {
    primaryLinkLabel?: string | null;
    primaryLinkUrl?: string | null;
  };

  return linkValue.primaryLinkLabel ?? linkValue.primaryLinkUrl ?? null;
};

const getDisplayName = ({
  kind,
  record,
}: {
  kind: TradeCrmCustomerKind;
  record: GenericRecord | undefined;
}) => {
  if (!record) {
    return kind === 'organization' ? 'Customer record' : 'Customer contact';
  }

  if (kind === 'organization') {
    return typeof record.name === 'string' && record.name.trim().length > 0
      ? record.name
      : 'Unnamed company';
  }

  const name = record.name as
    | {
        firstName?: unknown;
        lastName?: unknown;
      }
    | undefined;

  if (name && typeof name === 'object') {
    const fullName = [name.firstName, name.lastName]
      .filter((part): part is string => typeof part === 'string' && part.length > 0)
      .join(' ')
      .trim();

    if (fullName.length > 0) {
      return fullName;
    }
  }

  return typeof record.email === 'string' && record.email.length > 0
    ? record.email
    : 'Unnamed contact';
};

const getCountryLabel = (record: GenericRecord | undefined) => {
  if (!record) {
    return null;
  }

  if (typeof record.country === 'string') {
    return record.country;
  }

  if (
    typeof record.address === 'object' &&
    record.address &&
    typeof (record.address as { addressCountry?: unknown }).addressCountry ===
      'string'
  ) {
    return (record.address as { addressCountry: string }).addressCountry;
  }

  return null;
};

const countLabels = (labels: string[]): TradeCrmCustomerSummaryItem[] =>
  Object.entries(
    labels.reduce<Record<string, number>>((accumulator, label) => {
      accumulator[label] = (accumulator[label] ?? 0) + 1;

      return accumulator;
    }, {}),
  )
    .map(([label, count]) => ({
      label,
      count,
    }))
    .sort(
      (left, right) => right.count - left.count || left.label.localeCompare(right.label),
    );

const getTimelinePreviewDate = (value: string) => value.slice(0, 10);

const getRelationId = (value: unknown) => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return typeof (value as { id?: unknown }).id === 'string'
    ? ((value as { id: string }).id ?? null)
    : null;
};

const getTaskTargets = (record: GenericRecord | undefined) => {
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

const buildCompanyFilter = (
  filters: TradeCrmCustomerWorkspaceFilters | undefined,
): RecordGqlOperationFilter | undefined => {
  if (!filters) {
    return undefined;
  }

  const customerStageValue =
    filters.stageLabel ? getTradeCrmCustomerStageValueForLabel(filters.stageLabel) : null;
  const customerSourceValue =
    filters.sourceLabel
      ? getTradeCrmCustomerSourceValueForLabel(filters.sourceLabel)
      : null;
  const customerTagValue =
    filters.tagLabel ? getTradeCrmCustomerTagValueForLabel(filters.tagLabel) : null;
  const publicPoolStateValue =
    filters.publicPoolStateLabel
      ? getTradeCrmPublicPoolStateValueForLabel(filters.publicPoolStateLabel)
      : null;
  const normalizedSearchTerm = filters.searchTerm?.trim() ?? '';

  const andFilters: RecordGqlOperationFilter[] = [
    ...(customerStageValue
      ? [
          {
            customerStage: {
              eq: customerStageValue,
            },
          },
        ]
      : []),
    ...(customerSourceValue
      ? [
          {
            customerSource: {
              eq: customerSourceValue,
            },
          },
        ]
      : []),
    ...(customerTagValue
      ? [
          {
            customerTags: {
              containsAny: [customerTagValue],
            },
          } as RecordGqlOperationFilter,
        ]
      : []),
    ...(publicPoolStateValue
      ? [
          {
            publicPoolState: {
              eq: publicPoolStateValue,
            },
          },
        ]
      : []),
    ...(normalizedSearchTerm.length > 0
      ? [
          {
            or: [
              {
                name: {
                  ilike: `%${normalizedSearchTerm}%`,
                },
              },
              {
                shortName: {
                  ilike: `%${normalizedSearchTerm}%`,
                },
              },
              {
                customerCode: {
                  ilike: `%${normalizedSearchTerm}%`,
                },
              },
              {
                country: {
                  ilike: `%${normalizedSearchTerm}%`,
                },
              },
              {
                address: {
                  addressCountry: {
                    ilike: `%${normalizedSearchTerm}%`,
                  },
                },
              },
            ],
          },
        ]
      : []),
  ];

  if (andFilters.length === 0) {
    return undefined;
  }

  return andFilters.length === 1 ? andFilters[0] : { and: andFilters };
};

const buildPeopleFilter = (
  filters: TradeCrmCustomerWorkspaceFilters | undefined,
): RecordGqlOperationFilter | undefined => {
  if (!filters?.sourceLabel) {
    return undefined;
  }

  const customerSourceValue = getTradeCrmCustomerSourceValueForLabel(
    filters.sourceLabel,
  );
  const normalizedSearchTerm = filters.searchTerm?.trim() ?? '';

  const andFilters: RecordGqlOperationFilter[] = [
    ...(customerSourceValue
      ? [
          {
            customerSource: {
              eq: customerSourceValue,
            },
          },
        ]
      : []),
    ...(normalizedSearchTerm.length > 0
      ? [
          {
            or: [
              {
                name: {
                  firstName: {
                    ilike: `%${normalizedSearchTerm}%`,
                  },
                },
              },
              {
                name: {
                  lastName: {
                    ilike: `%${normalizedSearchTerm}%`,
                  },
                },
              },
              {
                email: {
                  ilike: `%${normalizedSearchTerm}%`,
                },
              },
              {
                phone: {
                  ilike: `%${normalizedSearchTerm}%`,
                },
              },
              {
                jobTitle: {
                  ilike: `%${normalizedSearchTerm}%`,
                },
              },
            ],
          },
        ]
      : []),
  ];

  if (andFilters.length === 0) {
    return undefined;
  }

  return andFilters.length === 1 ? andFilters[0] : { and: andFilters };
};

export const useTradeCrmCustomerWorkspaceData = (
  customerRouteId?: string,
  filters?: TradeCrmCustomerWorkspaceFilters,
) => {
  const apolloCoreClient = useApolloCoreClient();
  const { objectMetadataItems } = useObjectMetadataItems();
  const hasCompanyObject = objectMetadataItems.some(
    (item) => item.nameSingular === CoreObjectNameSingular.Company,
  );
  const hasPersonObject = objectMetadataItems.some(
    (item) => item.nameSingular === CoreObjectNameSingular.Person,
  );
  const hasOpportunityObject = objectMetadataItems.some(
    (item) => item.nameSingular === CoreObjectNameSingular.Opportunity,
  );
  const hasTaskObject = objectMetadataItems.some(
    (item) => item.nameSingular === CoreObjectNameSingular.Task,
  );

  const companyFilter = buildCompanyFilter(filters);
  const peopleFilter = buildPeopleFilter(filters);
  const shouldUseCustomerPublicPoolList =
    !customerRouteId && filters?.publicPoolStateLabel === 'Public Pool';
  const shouldUseCustomerWorkspaceList =
    !customerRouteId && !shouldUseCustomerPublicPoolList;
  const customerStageValue = filters?.stageLabel
    ? getTradeCrmCustomerStageValueForLabel(filters.stageLabel)
    : null;
  const customerSourceValue = filters?.sourceLabel
    ? getTradeCrmCustomerSourceValueForLabel(filters.sourceLabel)
    : null;
  const customerTagValue = filters?.tagLabel
    ? getTradeCrmCustomerTagValueForLabel(filters.tagLabel)
    : null;
  const publicPoolStateValue = filters?.publicPoolStateLabel
    ? getTradeCrmPublicPoolStateValueForLabel(filters.publicPoolStateLabel)
    : null;
  const customerWorkspaceListVariables = {
    limit: 50,
    publicPoolStateValue: publicPoolStateValue ?? undefined,
    searchTerm: filters?.searchTerm?.trim() || undefined,
    sourceValue: customerSourceValue ?? undefined,
    stageValue: customerStageValue ?? undefined,
    tagValue: customerTagValue ?? undefined,
  };
  const customerPublicPoolListVariables = {
    limit: 50,
    searchTerm: filters?.searchTerm?.trim() || undefined,
    sourceValue: customerSourceValue ?? undefined,
    stageValue: customerStageValue ?? undefined,
    tagValue: customerTagValue ?? undefined,
  };

  const {
    data: customerWorkspaceListData,
    error: customerWorkspaceListError,
  } = useQuery<
    CustomerWorkspaceListQuery,
    CustomerWorkspaceListQueryVariables
  >(GET_CUSTOMER_WORKSPACE_LIST, {
    client: apolloCoreClient,
    errorPolicy: 'all',
    skip: !shouldUseCustomerWorkspaceList,
    variables: customerWorkspaceListVariables,
  });

  useSnackBarOnQueryError(customerWorkspaceListError);

  const {
    data: customerPublicPoolListData,
    error: customerPublicPoolListError,
  } = useQuery<
    CustomerPublicPoolListQuery,
    CustomerPublicPoolListQueryVariables
  >(GET_CUSTOMER_PUBLIC_POOL_LIST, {
    client: apolloCoreClient,
    errorPolicy: 'all',
    skip: !shouldUseCustomerPublicPoolList,
    variables: customerPublicPoolListVariables,
  });

  useSnackBarOnQueryError(customerPublicPoolListError);

  const { records: companyRecordsFallback, totalCount: companyTotalCountFallback } =
    useFindManyRecords<GenericRecord>({
      objectNameSingular: CoreObjectNameSingular.Company,
      filter: companyFilter,
      limit: 8,
      skip:
        !hasCompanyObject ||
        shouldUseCustomerWorkspaceList ||
        shouldUseCustomerPublicPoolList,
    });

  const { records: peopleRecords, totalCount: peopleTotalCount } =
    useFindManyRecords<GenericRecord>({
      objectNameSingular: CoreObjectNameSingular.Person,
      filter: peopleFilter,
      limit: 8,
      skip: !hasPersonObject,
    });

  const { records: opportunityRecords, totalCount: opportunityTotalCount } =
    useFindManyRecords<GenericRecord>({
      objectNameSingular: CoreObjectNameSingular.Opportunity,
      limit: 4,
      skip: !hasOpportunityObject,
    });

  const { records: taskRecords, totalCount: taskTotalCount } =
    useFindManyRecords<GenericRecord>({
      objectNameSingular: CoreObjectNameSingular.Task,
      limit: 12,
      skip: !hasTaskObject,
    });

  const {
    totalTasksDueTodayCount,
    loading: tasksDueTodayLoading,
    hasError: tasksDueTodayError,
  } = useTasksDueToday();

  const companyListLink = useTradeCrmObjectViewLink({
    objectNameSingular: CoreObjectNameSingular.Company,
  });
  const customerWorkspaceViewLink = useTradeCrmObjectViewLink({
    objectNameSingular: CoreObjectNameSingular.Company,
    preferredViewName: 'Customers (Trade CRM)',
  });
  const publicPoolWorkspaceViewLink = useTradeCrmObjectViewLink({
    objectNameSingular: CoreObjectNameSingular.Company,
    preferredViewName: 'Public Pool Customers',
  });
  const followUpWorkspaceViewLink = useTradeCrmObjectViewLink({
    objectNameSingular: CoreObjectNameSingular.Company,
    preferredViewName: 'Customers Need Follow-up',
  });
  const peopleListLink = useTradeCrmObjectViewLink({
    objectNameSingular: CoreObjectNameSingular.Person,
  });
  const opportunityListLink = useTradeCrmObjectViewLink({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
  });
  const taskListLink = useTradeCrmObjectViewLink({
    objectNameSingular: CoreObjectNameSingular.Task,
  });
  const companyRecords =
    (
      customerPublicPoolListData?.customerPublicPoolList.records ??
      customerWorkspaceListData?.customerWorkspaceList.records
    )?.map((record) => ({
      ...record,
      __typename: 'Company',
    })) ?? companyRecordsFallback;
  const companyTotalCount =
    customerPublicPoolListData?.customerPublicPoolList.totalCount ??
    customerWorkspaceListData?.customerWorkspaceList.totalCount ??
    companyTotalCountFallback ??
    0;

  const firstCompanyCustomerPath = companyRecords?.[0]?.id
    ? getTradeCrmCustomerDetailPath(companyRecords[0].id)
    : undefined;

  const resolvedCustomerRoute = parseTradeCrmCustomerRouteId(customerRouteId ?? '');
  const shouldUseCustomerDetailAggregate =
    resolvedCustomerRoute?.kind === 'organization' && hasCompanyObject;

  const {
    data: customerDetailAggregateData,
    error: customerDetailAggregateError,
    loading: customerDetailAggregateLoading,
  } = useQuery<CustomerDetailQuery, CustomerDetailQueryVariables>(
    GET_CUSTOMER_DETAIL,
    {
      client: apolloCoreClient,
      errorPolicy: 'all',
      skip:
        !shouldUseCustomerDetailAggregate || !resolvedCustomerRoute?.recordId,
      variables: {
        customerId: resolvedCustomerRoute?.recordId ?? '',
      },
    },
  );

  useSnackBarOnQueryError(customerDetailAggregateError);

  const {
    data: customerTimelineData,
    error: customerTimelineError,
  } = useQuery<CustomerTimelineQuery, CustomerTimelineQueryVariables>(
    GET_CUSTOMER_TIMELINE,
    {
      client: apolloCoreClient,
      errorPolicy: 'all',
      skip:
        !shouldUseCustomerDetailAggregate || !resolvedCustomerRoute?.recordId,
      variables: {
        customerId: resolvedCustomerRoute?.recordId ?? '',
        limit: 20,
      },
    },
  );

  useSnackBarOnQueryError(customerTimelineError);

  const {
    data: customerOperationHistoryData,
    error: customerOperationHistoryError,
  } = useQuery<
    CustomerOperationHistoryQuery,
    CustomerOperationHistoryQueryVariables
  >(GET_CUSTOMER_OPERATION_HISTORY, {
    client: apolloCoreClient,
    errorPolicy: 'all',
    skip:
      resolvedCustomerRoute?.kind !== 'organization' ||
      !resolvedCustomerRoute.recordId,
    variables: {
      customerId: resolvedCustomerRoute?.recordId ?? '',
      limit: 20,
    },
  });

  useSnackBarOnQueryError(customerOperationHistoryError);

  const {
    data: customerDocumentsData,
    error: customerDocumentsError,
  } = useQuery<CustomerDocumentsQuery, CustomerDocumentsQueryVariables>(
    GET_CUSTOMER_DOCUMENTS,
    {
      client: apolloCoreClient,
      errorPolicy: 'all',
      skip:
        resolvedCustomerRoute?.kind !== 'organization' ||
        !resolvedCustomerRoute.recordId,
      variables: {
        customerId: resolvedCustomerRoute?.recordId ?? '',
        limit: 20,
      },
    },
  );

  useSnackBarOnQueryError(customerDocumentsError);

  const {
    data: customerAiInsightData,
    error: customerAiInsightError,
  } = useQuery<CustomerAiInsightQuery, CustomerAiInsightQueryVariables>(
    GET_CUSTOMER_AI_INSIGHT,
    {
      client: apolloCoreClient,
      errorPolicy: 'all',
      skip:
        resolvedCustomerRoute?.kind !== 'organization' ||
        !resolvedCustomerRoute.recordId,
      variables: {
        customerId: resolvedCustomerRoute?.recordId ?? '',
      },
    },
  );

  useSnackBarOnQueryError(customerAiInsightError);

  const [
    createCustomerFollowUpMutation,
    { loading: createCustomerFollowUpLoading },
  ] = useMutation<
    CreateCustomerFollowUpMutation,
    CreateCustomerFollowUpMutationVariables
  >(CREATE_CUSTOMER_FOLLOW_UP, {
      client: apolloCoreClient,
    });
  const [
    createCustomerContactMutation,
    { error: createCustomerContactError, loading: createCustomerContactLoading },
  ] = useMutation<
    CreateCustomerContactMutation,
    CreateCustomerContactMutationVariables
  >(CREATE_CUSTOMER_CONTACT, {
    client: apolloCoreClient,
  });
  const [
    updateCustomerMutation,
    { error: updateCustomerError, loading: updateCustomerLoading },
  ] = useMutation<UpdateCustomerMutation, UpdateCustomerMutationVariables>(
    UPDATE_CUSTOMER,
    {
      client: apolloCoreClient,
    },
  );
  const [
    updateCustomerContactMutation,
    {
      error: updateCustomerContactError,
      loading: updateCustomerContactLoading,
    },
  ] = useMutation<
    UpdateCustomerContactMutation,
    UpdateCustomerContactMutationVariables
  >(UPDATE_CUSTOMER_CONTACT, {
    client: apolloCoreClient,
  });
  const [
    refreshCustomerCommercialSummaryMutation,
    {
      error: refreshCustomerCommercialSummaryError,
      loading: refreshCustomerCommercialSummaryLoading,
    },
  ] = useMutation<
    RefreshCustomerCommercialSummaryMutation,
    RefreshCustomerCommercialSummaryMutationVariables
  >(REFRESH_CUSTOMER_COMMERCIAL_SUMMARY, {
    client: apolloCoreClient,
  });

  useSnackBarOnQueryError(createCustomerContactError);
  useSnackBarOnQueryError(updateCustomerError);
  useSnackBarOnQueryError(updateCustomerContactError);
  useSnackBarOnQueryError(refreshCustomerCommercialSummaryError);
  const [
    claimPublicPoolCustomerMutation,
    {
      error: claimPublicPoolCustomerError,
      loading: claimPublicPoolCustomerLoading,
    },
  ] = useMutation<
    CustomerPublicPoolActionMutation,
    ClaimPublicPoolCustomerMutationVariables
  >(CLAIM_PUBLIC_POOL_CUSTOMER, {
    client: apolloCoreClient,
  });
  const [
    moveCustomersToPublicPoolMutation,
    {
      error: moveCustomersToPublicPoolError,
      loading: moveCustomersToPublicPoolLoading,
    },
  ] = useMutation<
    CustomerPublicPoolActionMutation,
    MoveCustomersToPublicPoolMutationVariables
  >(MOVE_CUSTOMERS_TO_PUBLIC_POOL, {
    client: apolloCoreClient,
  });
  const [
    executeCustomerPublicPoolRulesMutation,
    {
      error: executeCustomerPublicPoolRulesError,
      loading: executeCustomerPublicPoolRulesLoading,
    },
  ] = useMutation<ExecuteCustomerPublicPoolRulesMutation>(
    EXECUTE_CUSTOMER_PUBLIC_POOL_RULES,
    {
      client: apolloCoreClient,
    },
  );

  useSnackBarOnQueryError(claimPublicPoolCustomerError);
  useSnackBarOnQueryError(moveCustomersToPublicPoolError);
  useSnackBarOnQueryError(executeCustomerPublicPoolRulesError);

  const { record: companyRecord, loading: companyRecordLoading } =
    useFindOneRecord<GenericRecord>({
      objectNameSingular: CoreObjectNameSingular.Company,
      objectRecordId:
        resolvedCustomerRoute?.kind === 'organization'
          ? resolvedCustomerRoute.recordId
          : '',
      skip: resolvedCustomerRoute?.kind !== 'organization' || !hasCompanyObject,
    });

  const { record: personRecord, loading: personRecordLoading } =
    useFindOneRecord<GenericRecord>({
      objectNameSingular: CoreObjectNameSingular.Person,
      objectRecordId:
        resolvedCustomerRoute?.kind === 'individual'
          ? resolvedCustomerRoute.recordId
          : '',
      skip: resolvedCustomerRoute?.kind !== 'individual' || !hasPersonObject,
    });

  const customerDetailAggregateRecord = useMemo<GenericRecord | null>(() => {
    const customerRecord = customerDetailAggregateData?.customerDetail.customer;

    if (!customerRecord) {
      return null;
    }

    return {
      ...customerRecord,
      __typename: 'Company',
    };
  }, [customerDetailAggregateData]);

  const customerDetailAggregatePeopleRecords = useMemo<GenericRecord[]>(
    () =>
      (customerDetailAggregateData?.customerDetail.contacts ?? []).map((record) => ({
        ...record,
        __typename: 'Person',
      })),
    [customerDetailAggregateData],
  );

  const customerDetailAggregateOpportunityRecords = useMemo<GenericRecord[]>(
    () =>
      (customerDetailAggregateData?.customerDetail.opportunities ?? []).map(
        (record) => ({
          ...record,
          __typename: 'Opportunity',
        }),
      ),
    [customerDetailAggregateData],
  );

  const customerDetailRecord =
    resolvedCustomerRoute?.kind === 'individual'
      ? personRecord
      : customerDetailAggregateRecord ?? companyRecord;

  const customerDetailCompanyId =
    resolvedCustomerRoute?.kind === 'organization'
      ? resolvedCustomerRoute.recordId
      : (typeof personRecord?.companyId === 'string' ? personRecord.companyId : null) ??
        getRelationId(personRecord?.company);

  const customerDetailPersonId =
    resolvedCustomerRoute?.kind === 'individual'
      ? resolvedCustomerRoute.recordId
      : null;

  const customerDetailRedirectPath = useMemo(() => {
    if (!resolvedCustomerRoute) {
      return null;
    }

    if (
      resolvedCustomerRoute.kind === 'organization' &&
      customerRouteId?.startsWith('org_')
    ) {
      return getTradeCrmCustomerDetailPath(resolvedCustomerRoute.recordId);
    }

    if (resolvedCustomerRoute.kind !== 'individual') {
      return null;
    }

    if (!hasPersonObject) {
      return getTradeCrmCustomerPath('list');
    }

    if (personRecordLoading) {
      return null;
    }

    const linkedCompanyId =
      (typeof personRecord?.companyId === 'string' ? personRecord.companyId : null) ??
      getRelationId(personRecord?.company);

    if (linkedCompanyId) {
      return getTradeCrmCustomerDetailPath(linkedCompanyId);
    }

    return getTradeCrmCustomerPath('list');
  }, [
    customerRouteId,
    hasPersonObject,
    personRecord,
    personRecordLoading,
    resolvedCustomerRoute,
  ]);

  const { records: customerDetailPeopleRecordsFallback } =
    useFindManyRecords<GenericRecord>({
      objectNameSingular: CoreObjectNameSingular.Person,
      filter: customerDetailCompanyId
        ? {
            companyId: {
              eq: customerDetailCompanyId,
            },
          }
        : customerDetailPersonId
          ? {
              id: {
                eq: customerDetailPersonId,
              },
            }
          : undefined,
      limit: 6,
      skip:
        !resolvedCustomerRoute ||
        !hasPersonObject ||
        (!customerDetailCompanyId && !customerDetailPersonId),
    });

  const { records: customerDetailOpportunityRecordsFallback } =
    useFindManyRecords<GenericRecord>({
      objectNameSingular: CoreObjectNameSingular.Opportunity,
      filter: customerDetailCompanyId || customerDetailPersonId
        ? {
            or: [
              ...(customerDetailCompanyId
                ? [
                    {
                      companyId: {
                        eq: customerDetailCompanyId,
                      },
                    },
                  ]
                : []),
              ...(customerDetailPersonId
                ? [
                    {
                      pointOfContactId: {
                        eq: customerDetailPersonId,
                      },
                    },
                    {
                      personId: {
                        eq: customerDetailPersonId,
                      },
                    },
                  ]
                : []),
            ],
          }
        : undefined,
      limit: 6,
      skip:
        !resolvedCustomerRoute ||
        !hasOpportunityObject ||
        (!customerDetailCompanyId && !customerDetailPersonId),
    });

  const customerDetailPeopleRecords = useMemo(() => {
    if (customerDetailAggregateData?.customerDetail) {
      return customerDetailAggregatePeopleRecords;
    }

    if ((customerDetailPeopleRecordsFallback?.length ?? 0) > 0) {
      return customerDetailPeopleRecordsFallback;
    }

    if (customerDetailPersonId && personRecord) {
      return [personRecord];
    }

    if (customerDetailCompanyId && peopleRecords) {
      return peopleRecords.filter(
        (record) =>
          (typeof record.companyId === 'string' &&
            record.companyId === customerDetailCompanyId) ||
          getRelationId(record.company) === customerDetailCompanyId,
      );
    }

    return [];
  }, [
    customerDetailAggregateData,
    customerDetailAggregatePeopleRecords,
    customerDetailCompanyId,
    customerDetailPeopleRecordsFallback,
    customerDetailPersonId,
    peopleRecords,
    personRecord,
  ]);

  const customerDetailOpportunityRecords = useMemo(() => {
    if (customerDetailAggregateData?.customerDetail) {
      return customerDetailAggregateOpportunityRecords;
    }

    return customerDetailOpportunityRecordsFallback ?? [];
  }, [
    customerDetailAggregateData,
    customerDetailAggregateOpportunityRecords,
    customerDetailOpportunityRecordsFallback,
  ]);

  const { data: companyTimelineThreadsData } = useQuery<
    GetTimelineThreadsFromCompanyIdQuery,
    GetTimelineThreadsFromCompanyIdQueryVariables
  >(GetTimelineThreadsFromCompanyIdDocument, {
    errorPolicy: 'all',
    skip:
      resolvedCustomerRoute?.kind !== 'organization' ||
      !hasCompanyObject ||
      !resolvedCustomerRoute?.recordId,
    variables: {
      companyId: resolvedCustomerRoute?.recordId ?? '',
      page: 1,
      pageSize: TIMELINE_PREVIEW_PAGE_SIZE,
    },
  });

  const { data: personTimelineThreadsData } = useQuery<
    GetTimelineThreadsFromPersonIdQuery,
    GetTimelineThreadsFromPersonIdQueryVariables
  >(GetTimelineThreadsFromPersonIdDocument, {
    errorPolicy: 'all',
    skip:
      resolvedCustomerRoute?.kind !== 'individual' ||
      !hasPersonObject ||
      !resolvedCustomerRoute?.recordId,
    variables: {
      personId: resolvedCustomerRoute?.recordId ?? '',
      page: 1,
      pageSize: TIMELINE_PREVIEW_PAGE_SIZE,
    },
  });

  const { data: companyTimelineCalendarData } = useQuery<
    GetTimelineCalendarEventsFromCompanyIdQuery,
    GetTimelineCalendarEventsFromCompanyIdQueryVariables
  >(GetTimelineCalendarEventsFromCompanyIdDocument, {
    errorPolicy: 'all',
    skip:
      resolvedCustomerRoute?.kind !== 'organization' ||
      !hasCompanyObject ||
      !resolvedCustomerRoute?.recordId,
    variables: {
      companyId: resolvedCustomerRoute?.recordId ?? '',
      page: 1,
      pageSize: TIMELINE_PREVIEW_PAGE_SIZE,
    },
  });

  const { data: personTimelineCalendarData } = useQuery<
    GetTimelineCalendarEventsFromPersonIdQuery,
    GetTimelineCalendarEventsFromPersonIdQueryVariables
  >(GetTimelineCalendarEventsFromPersonIdDocument, {
    errorPolicy: 'all',
    skip:
      resolvedCustomerRoute?.kind !== 'individual' ||
      !hasPersonObject ||
      !resolvedCustomerRoute?.recordId,
    variables: {
      personId: resolvedCustomerRoute?.recordId ?? '',
      page: 1,
      pageSize: TIMELINE_PREVIEW_PAGE_SIZE,
    },
  });

  const timelineThreadPreviews = useMemo<TradeCrmTimelineThreadPreview[]>(() => {
    const timelineThreads =
      resolvedCustomerRoute?.kind === 'individual'
        ? personTimelineThreadsData?.getTimelineThreadsFromPersonId.timelineThreads
        : companyTimelineThreadsData?.getTimelineThreadsFromCompanyId.timelineThreads;

    return (timelineThreads ?? []).map((thread) => ({
      id: thread.id,
      subject: thread.subject,
      lastMessageReceivedAt: getTimelinePreviewDate(thread.lastMessageReceivedAt),
      lastMessageBody: thread.lastMessageBody,
      participantLabel:
        thread.firstParticipant.displayName ||
        `${thread.firstParticipant.firstName} ${thread.firstParticipant.lastName}`.trim() ||
        'Participant pending',
      messageCountLabel: `${thread.numberOfMessagesInThread} messages`,
    }));
  }, [
    companyTimelineThreadsData,
    personTimelineThreadsData,
    resolvedCustomerRoute?.kind,
  ]);

  const timelineThreadTotalCount =
    resolvedCustomerRoute?.kind === 'individual'
      ? personTimelineThreadsData?.getTimelineThreadsFromPersonId.totalNumberOfThreads ??
        0
      : companyTimelineThreadsData?.getTimelineThreadsFromCompanyId.totalNumberOfThreads ??
        0;

  const timelineCalendarPreviews = useMemo<TradeCrmTimelineCalendarPreview[]>(
    () => {
      const timelineCalendarEvents =
        resolvedCustomerRoute?.kind === 'individual'
          ? personTimelineCalendarData?.getTimelineCalendarEventsFromPersonId
              .timelineCalendarEvents
          : companyTimelineCalendarData?.getTimelineCalendarEventsFromCompanyId
              .timelineCalendarEvents;

      return (timelineCalendarEvents ?? []).map((event) => ({
        id: event.id,
        title: event.title,
        startsAt: getTimelinePreviewDate(event.startsAt),
        location: event.location || 'Location pending',
        participantLabel:
          event.participants[0]?.displayName ||
          `${event.participants[0]?.firstName ?? ''} ${
            event.participants[0]?.lastName ?? ''
          }`.trim() ||
          'Participants pending',
      }));
    },
    [
      companyTimelineCalendarData,
      personTimelineCalendarData,
      resolvedCustomerRoute?.kind,
    ],
  );

  const timelineCalendarTotalCount =
    resolvedCustomerRoute?.kind === 'individual'
      ? personTimelineCalendarData?.getTimelineCalendarEventsFromPersonId
          .totalNumberOfCalendarEvents ?? 0
      : companyTimelineCalendarData?.getTimelineCalendarEventsFromCompanyId
          .totalNumberOfCalendarEvents ?? 0;

  const customerStageSummary = useMemo<TradeCrmCustomerSummaryItem[]>(
    () =>
      customerPublicPoolListData?.customerPublicPoolList.stageSummary ??
      customerWorkspaceListData?.customerWorkspaceList.stageSummary ??
      countLabels(
        (companyRecords ?? []).map((record, index) =>
          getTradeCrmCustomerStageLabelForRecord({
            record,
            fallbackIndex: index,
          }),
        ),
      ),
    [companyRecords, customerPublicPoolListData, customerWorkspaceListData],
  );

  const customerGroupSummary = useMemo<TradeCrmCustomerSummaryItem[]>(
    () =>
      customerPublicPoolListData?.customerPublicPoolList.groupSummary ??
      customerWorkspaceListData?.customerWorkspaceList.groupSummary ??
      countLabels(
        (companyRecords ?? []).map((record, index) =>
          getTradeCrmCustomerGroupLabelForRecord({
            record,
            fallbackIndex: index,
          }),
        ),
      ),
    [companyRecords, customerPublicPoolListData, customerWorkspaceListData],
  );

  const customerSourceSummary = useMemo<TradeCrmCustomerSummaryItem[]>(
    () =>
      customerPublicPoolListData?.customerPublicPoolList.sourceSummary ??
      customerWorkspaceListData?.customerWorkspaceList.sourceSummary ??
      countLabels(
        (companyRecords ?? []).map((record, index) =>
          getTradeCrmCustomerSourceLabelForRecord({
            record,
            fallbackIndex: index,
          }),
        ),
      ),
    [companyRecords, customerPublicPoolListData, customerWorkspaceListData],
  );

  const customerTagSummary = useMemo<TradeCrmCustomerSummaryItem[]>(
    () =>
      customerPublicPoolListData?.customerPublicPoolList.tagSummary ??
      customerWorkspaceListData?.customerWorkspaceList.tagSummary ??
      countLabels(
        (companyRecords ?? []).flatMap((record, index) =>
          getTradeCrmCustomerTagsForRecord({
            record,
            fallbackIndex: index,
          }),
        ),
      ),
    [companyRecords, customerPublicPoolListData, customerWorkspaceListData],
  );

  const publicPoolRecords = useMemo(
    () =>
      (companyRecords ?? []).filter(
        (record) => getTradeCrmPublicPoolStateLabelForRecord(record) === 'Public Pool',
      ),
    [companyRecords],
  );

  const customerDetailTaskRecords = useMemo(() => {
    if (!resolvedCustomerRoute) {
      return [];
    }

    const filteredTaskRecords = (taskRecords ?? []).filter((record) => {
      const taskTargets = getTaskTargets(record);

      return taskTargets.some((taskTarget) => {
        const targetCompanyId =
          (typeof (taskTarget as { targetCompanyId?: unknown }).targetCompanyId ===
          'string'
            ? (taskTarget as { targetCompanyId: string }).targetCompanyId
            : null) ??
          (typeof (taskTarget as { companyId?: unknown }).companyId === 'string'
            ? (taskTarget as { companyId: string }).companyId
            : null);

        const targetPersonId =
          (typeof (taskTarget as { targetPersonId?: unknown }).targetPersonId ===
          'string'
            ? (taskTarget as { targetPersonId: string }).targetPersonId
            : null) ??
          (typeof (taskTarget as { personId?: unknown }).personId === 'string'
            ? (taskTarget as { personId: string }).personId
            : null);

        return (
          (customerDetailCompanyId !== null &&
            targetCompanyId === customerDetailCompanyId) ||
          (customerDetailPersonId !== null && targetPersonId === customerDetailPersonId)
        );
      });
    });

    return filteredTaskRecords;
  }, [
    customerDetailCompanyId,
    customerDetailPersonId,
    resolvedCustomerRoute,
    taskRecords,
  ]);

  const customerDetail = useMemo(() => {
    if (!resolvedCustomerRoute) {
      return null;
    }

    return {
      ...resolvedCustomerRoute,
      displayName: getDisplayName({
        kind: resolvedCustomerRoute.kind,
        record: customerDetailRecord,
      }),
      countryLabel: getCountryLabel(customerDetailRecord),
      ownerLabel:
        (typeof customerDetailRecord?.accountOwner === 'object' &&
        customerDetailRecord.accountOwner &&
        typeof (
          customerDetailRecord.accountOwner as { name?: unknown }
        ).name === 'string'
          ? (customerDetailRecord.accountOwner as { name: string }).name
          : null) ??
        (typeof customerDetailRecord?.owner === 'object' &&
        customerDetailRecord.owner &&
        typeof (customerDetailRecord.owner as { name?: unknown }).name === 'string'
          ? (customerDetailRecord.owner as { name: string }).name
          : null),
      websiteLabel:
        getLinkValue(customerDetailRecord?.website) ??
        getLinkValue(customerDetailRecord?.domainName),
      shortNameLabel: getTradeCrmCustomerShortNameLabelForRecord(customerDetailRecord),
      jobTitle:
        typeof customerDetailRecord?.jobTitle === 'string'
          ? customerDetailRecord.jobTitle
          : null,
      phoneLabel: getTradeCrmCustomerPhoneLabel(customerDetailRecord),
      emailLabel: getTradeCrmCustomerEmailLabel(customerDetailRecord),
      addressLabel: getTradeCrmCustomerAddressLabelForRecord(customerDetailRecord),
      socialLabels: getTradeCrmCustomerSocialLabelsForRecord(customerDetailRecord),
      customerStageLabel: getTradeCrmCustomerStageLabelForRecord({
        record: customerDetailRecord,
      }),
      customerGroupLabel: getTradeCrmCustomerGroupLabelForRecord({
        record: customerDetailRecord,
      }),
      customerSourceLabel: getTradeCrmCustomerSourceLabelForRecord({
        record: customerDetailRecord,
      }),
      customerTags: getTradeCrmCustomerTagsForRecord({
        record: customerDetailRecord,
      }),
      customerStarLabel: getTradeCrmCustomerStarLabelForRecord({
        record: customerDetailRecord,
      }),
      customerScoreLabel: getTradeCrmCustomerScoreLabelForRecord({
        record: customerDetailRecord,
      }),
      publicPoolStateLabel: getTradeCrmPublicPoolStateLabelForRecord(
        customerDetailRecord,
      ),
      publicPoolGroupLabel: getTradeCrmPublicPoolGroupLabelForRecord(
        customerDetailRecord,
      ),
      customerCodeLabel: getTradeCrmCustomerCodeLabelForRecord(customerDetailRecord),
      lastContactLabel: getTradeCrmCustomerLastContactLabelForRecord(
        customerDetailRecord,
      ),
      lastTouchLabel: getTradeCrmCustomerLastTouchLabelForRecord({
        record: customerDetailRecord,
      }),
      lastWonLabel: getTradeCrmCustomerLastWonLabelForRecord(customerDetailRecord),
      totalWonAmountLabel: getTradeCrmCustomerTotalWonAmountLabelForRecord(
        customerDetailRecord,
      ),
    };
  }, [customerDetailRecord, resolvedCustomerRoute]);

  const createCustomerFollowUp = async (body: string) => {
    if (
      resolvedCustomerRoute?.kind !== 'organization' ||
      !resolvedCustomerRoute.recordId
    ) {
      return;
    }

    const customerId = resolvedCustomerRoute.recordId;

    await createCustomerFollowUpMutation({
      variables: {
        input: {
          customerId,
          body,
        },
      },
      refetchQueries: [
        {
          query: GET_CUSTOMER_TIMELINE,
          variables: {
            customerId,
            limit: 20,
          },
        },
        {
          query: GET_CUSTOMER_DETAIL,
          variables: {
            customerId,
          },
        },
        {
          query: GET_CUSTOMER_OPERATION_HISTORY,
          variables: {
            customerId,
            limit: 20,
          },
        },
      ],
    });
  };

  const createCustomerContact = async ({
    email,
    nickname,
    phone,
  }: Omit<CreateCustomerContactMutationVariables['input'], 'customerId'>) => {
    if (
      resolvedCustomerRoute?.kind !== 'organization' ||
      !resolvedCustomerRoute.recordId
    ) {
      return;
    }

    const customerId = resolvedCustomerRoute.recordId;

    await createCustomerContactMutation({
      refetchQueries: [
        {
          query: GET_CUSTOMER_DETAIL,
          variables: {
            customerId,
          },
        },
      ],
      variables: {
        input: {
          customerId,
          email,
          nickname,
          phone,
        },
      },
    });
  };

  const updateCustomer = async (
    input: Omit<UpdateCustomerMutationVariables['input'], 'customerId'>,
  ) => {
    if (
      resolvedCustomerRoute?.kind !== 'organization' ||
      !resolvedCustomerRoute.recordId
    ) {
      return;
    }

    const customerId = resolvedCustomerRoute.recordId;

    await updateCustomerMutation({
      refetchQueries: [
        {
          query: GET_CUSTOMER_DETAIL,
          variables: {
            customerId,
          },
        },
        {
          query: GET_CUSTOMER_OPERATION_HISTORY,
          variables: {
            customerId,
            limit: 20,
          },
        },
      ],
      variables: {
        input: {
          ...input,
          customerId,
        },
      },
    });
  };

  const updateCustomerContact = async (
    input: UpdateCustomerContactMutationVariables['input'],
  ) => {
    if (
      resolvedCustomerRoute?.kind !== 'organization' ||
      !resolvedCustomerRoute.recordId
    ) {
      return;
    }

    const customerId = resolvedCustomerRoute.recordId;

    await updateCustomerContactMutation({
      refetchQueries: [
        {
          query: GET_CUSTOMER_DETAIL,
          variables: {
            customerId,
          },
        },
        {
          query: GET_CUSTOMER_OPERATION_HISTORY,
          variables: {
            customerId,
            limit: 20,
          },
        },
      ],
      variables: {
        input,
      },
    });
  };

  const refreshCustomerCommercialSummary = async () => {
    if (
      resolvedCustomerRoute?.kind !== 'organization' ||
      !resolvedCustomerRoute.recordId
    ) {
      return;
    }

    const customerId = resolvedCustomerRoute.recordId;

    await refreshCustomerCommercialSummaryMutation({
      refetchQueries: [
        {
          query: GET_CUSTOMER_DETAIL,
          variables: {
            customerId,
          },
        },
      ],
      variables: {
        input: {
          customerId,
        },
      },
    });
  };

  const claimPublicPoolCustomer = async (customerId: string) => {
    await claimPublicPoolCustomerMutation({
      refetchQueries: [
        {
          query: GET_CUSTOMER_PUBLIC_POOL_LIST,
          variables: customerPublicPoolListVariables,
        },
        {
          query: GET_CUSTOMER_WORKSPACE_LIST,
          variables: customerWorkspaceListVariables,
        },
      ],
      variables: {
        input: {
          customerId,
        },
      },
    });
  };

  const claimPublicPoolCustomers = async (customerIds: string[]) => {
    await claimPublicPoolCustomerMutation({
      refetchQueries: [
        {
          query: GET_CUSTOMER_PUBLIC_POOL_LIST,
          variables: customerPublicPoolListVariables,
        },
        {
          query: GET_CUSTOMER_WORKSPACE_LIST,
          variables: customerWorkspaceListVariables,
        },
      ],
      variables: {
        input: {
          customerIds,
        },
      },
    });
  };

  const moveCustomersToPublicPool = async ({
    customerIds,
    publicPoolGroup,
    reason,
  }: MoveCustomersToPublicPoolMutationVariables['input']) => {
    await moveCustomersToPublicPoolMutation({
      refetchQueries: [
        {
          query: GET_CUSTOMER_PUBLIC_POOL_LIST,
          variables: customerPublicPoolListVariables,
        },
        {
          query: GET_CUSTOMER_WORKSPACE_LIST,
          variables: customerWorkspaceListVariables,
        },
      ],
      variables: {
        input: {
          customerIds,
          publicPoolGroup,
          reason,
        },
      },
    });
  };

  const executeCustomerPublicPoolRules = async () => {
    await executeCustomerPublicPoolRulesMutation({
      refetchQueries: [
        {
          query: GET_CUSTOMER_PUBLIC_POOL_LIST,
          variables: customerPublicPoolListVariables,
        },
        {
          query: GET_CUSTOMER_WORKSPACE_LIST,
          variables: customerWorkspaceListVariables,
        },
      ],
    });
  };

  return {
    companyRecords,
    peopleRecords,
    opportunityRecords,
    taskRecords,
    customerDetailPeopleRecords,
    customerDetailOpportunityRecords,
    customerDetailTaskRecords,
    companyTotalCount: companyTotalCount ?? 0,
    peopleTotalCount: peopleTotalCount ?? 0,
    opportunityTotalCount: opportunityTotalCount ?? 0,
    taskTotalCount: taskTotalCount ?? 0,
    totalTasksDueTodayCount,
    tasksDueTodayLoading,
    tasksDueTodayError,
    hasCompanyObject,
    hasPersonObject,
    hasOpportunityObject,
    hasTaskObject,
    companyListLink,
    customerWorkspaceViewLink,
    publicPoolWorkspaceViewLink,
    followUpWorkspaceViewLink,
    peopleListLink,
    opportunityListLink,
    taskListLink,
    customerStageSummary,
    customerGroupSummary,
    customerSourceSummary,
    customerTagSummary,
    publicPoolRecords,
    firstCompanyCustomerPath,
    customerDetailRedirectPath,
    customerDetail,
    customerDetailLoading:
      companyRecordLoading ||
      personRecordLoading ||
      customerDetailAggregateLoading,
    timelineThreadPreviews,
    timelineThreadTotalCount,
    timelineCalendarPreviews,
    timelineCalendarTotalCount,
    customerTimelineItems: customerTimelineData?.customerTimeline.items ?? [],
    customerTimelineTotalCount:
      customerTimelineData?.customerTimeline.totalCount ?? 0,
    customerOperationHistoryItems:
      customerOperationHistoryData?.customerOperationHistory.items ?? [],
    customerOperationHistoryTotalCount:
      customerOperationHistoryData?.customerOperationHistory.totalCount ?? 0,
    customerDocumentItems: customerDocumentsData?.customerDocuments.items ?? [],
    customerDocumentTotalCount:
      customerDocumentsData?.customerDocuments.totalCount ?? 0,
    customerAiInsight: customerAiInsightData?.customerAiInsight ?? null,
    createCustomerFollowUp,
    createCustomerFollowUpLoading,
    createCustomerContact,
    createCustomerContactLoading,
    updateCustomer,
    updateCustomerLoading,
    updateCustomerContact,
    updateCustomerContactLoading,
    refreshCustomerCommercialSummary,
    refreshCustomerCommercialSummaryLoading,
    claimPublicPoolCustomer,
    claimPublicPoolCustomers,
    claimPublicPoolCustomerLoading,
    moveCustomersToPublicPool,
    moveCustomersToPublicPoolLoading,
    executeCustomerPublicPoolRules,
    executeCustomerPublicPoolRulesLoading,
    materialAlignmentNotice:
      'Source HTML filenames are unreliable. Build against the screenshots first and validate against the saved OKKI URLs second.',
  };
};
