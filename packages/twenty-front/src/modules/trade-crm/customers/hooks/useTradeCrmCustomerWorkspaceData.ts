import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import {
  buildTradeCrmCustomerRouteId,
  getTradeCrmCustomerDetailPath,
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

export type TradeCrmCustomerWorkspaceFilters = {
  stageLabel?: string | null;
  sourceLabel?: string | null;
  publicPoolStateLabel?: string | null;
  searchTerm?: string;
  tagLabel?: string | null;
};

const TIMELINE_PREVIEW_PAGE_SIZE = 3;

const getLinkValue = (value: unknown) => {
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
    return kind === 'organization' ? 'Customer record' : 'Individual customer';
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

  const { records: companyRecords, totalCount: companyTotalCount } =
    useFindManyRecords<GenericRecord>({
      objectNameSingular: CoreObjectNameSingular.Company,
      filter: companyFilter,
      limit: 8,
      skip: !hasCompanyObject,
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

  const firstCompanyCustomerPath = companyRecords?.[0]?.id
    ? getTradeCrmCustomerDetailPath(
        buildTradeCrmCustomerRouteId({
          kind: 'organization',
          recordId: companyRecords[0].id,
        }),
      )
    : undefined;

  const firstIndividualCustomerPath = peopleRecords?.[0]?.id
    ? getTradeCrmCustomerDetailPath(
        buildTradeCrmCustomerRouteId({
          kind: 'individual',
          recordId: peopleRecords[0].id,
        }),
      )
    : undefined;

  const resolvedCustomerRoute = parseTradeCrmCustomerRouteId(customerRouteId ?? '');

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

  const customerDetailRecord =
    resolvedCustomerRoute?.kind === 'individual' ? personRecord : companyRecord;

  const customerDetailCompanyId =
    resolvedCustomerRoute?.kind === 'organization'
      ? resolvedCustomerRoute.recordId
      : (typeof personRecord?.companyId === 'string' ? personRecord.companyId : null) ??
        getRelationId(personRecord?.company);

  const customerDetailPersonId =
    resolvedCustomerRoute?.kind === 'individual'
      ? resolvedCustomerRoute.recordId
      : null;

  const { records: customerDetailPeopleRecords } = useFindManyRecords<GenericRecord>({
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

  const { records: customerDetailOpportunityRecords } =
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
      countLabels(
        (companyRecords ?? []).map((record, index) =>
          getTradeCrmCustomerStageLabelForRecord({
            record,
            fallbackIndex: index,
          }),
        ),
      ),
    [companyRecords],
  );

  const customerGroupSummary = useMemo<TradeCrmCustomerSummaryItem[]>(
    () =>
      countLabels(
        (companyRecords ?? []).map((record, index) =>
          getTradeCrmCustomerGroupLabelForRecord({
            record,
            fallbackIndex: index,
          }),
        ),
      ),
    [companyRecords],
  );

  const customerSourceSummary = useMemo<TradeCrmCustomerSummaryItem[]>(
    () =>
      countLabels(
        (companyRecords ?? []).map((record, index) =>
          getTradeCrmCustomerSourceLabelForRecord({
            record,
            fallbackIndex: index,
          }),
        ),
      ),
    [companyRecords],
  );

  const customerTagSummary = useMemo<TradeCrmCustomerSummaryItem[]>(
    () =>
      countLabels(
        (companyRecords ?? []).flatMap((record, index) =>
          getTradeCrmCustomerTagsForRecord({
            record,
            fallbackIndex: index,
          }),
        ),
      ),
    [companyRecords],
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

  return {
    companyRecords,
    peopleRecords,
    opportunityRecords,
    taskRecords,
    customerDetailPeopleRecords:
      customerDetailPeopleRecords.length > 0
        ? customerDetailPeopleRecords
        : customerDetailPersonId && personRecord
          ? [personRecord]
          : customerDetailCompanyId && peopleRecords
            ? peopleRecords.filter(
                (record) =>
                  (typeof record.companyId === 'string' &&
                    record.companyId === customerDetailCompanyId) ||
                  getRelationId(record.company) === customerDetailCompanyId,
              )
            : [],
    customerDetailOpportunityRecords: customerDetailOpportunityRecords ?? [],
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
    firstIndividualCustomerPath,
    customerDetail,
    customerDetailLoading: companyRecordLoading || personRecordLoading,
    timelineThreadPreviews,
    timelineThreadTotalCount,
    timelineCalendarPreviews,
    timelineCalendarTotalCount,
    materialAlignmentNotice:
      'Source HTML filenames are unreliable. Build against the screenshots first and validate against the saved OKKI URLs second.',
  };
};
