import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useEffect, useMemo, useState } from 'react';

import { useSnackBarOnQueryError } from '@/apollo/hooks/useSnackBarOnQueryError';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { type TradeCrmCustomerSummaryItem } from '@/trade-crm/customers/hooks/useTradeCrmCustomerWorkspaceData';
import {
  getTradeCrmCustomerStageLabelForValue,
  getTradeCrmCustomerStageValueForLabel,
  getTradeCrmPublicPoolGroupLabelForValue,
  getTradeCrmPublicPoolGroupValueForLabel,
} from '@/trade-crm/customers/utils/tradeCrmCustomerPresentation';

type TradeCrmCustomerConfigTagScope = 'company' | 'mine' | 'subordinate';

type TradeCrmCustomerConfigGroupItem = {
  id: string;
  label: string;
  level: 1 | 2;
  parentId: string | null;
};

type TradeCrmCustomerConfigMatchingRule = {
  field: string;
  weight: number;
};

type TradeCrmCustomerConfigDraft = {
  publicPoolRule: {
    ruleName: string;
    inactivityDays: number;
    notifyOwnersFirst: boolean;
    scopeStages: string[];
    publicPoolGroup: string;
  };
  groups: TradeCrmCustomerConfigGroupItem[];
  tags: Record<TradeCrmCustomerConfigTagScope, string[]>;
  sources: string[];
  matchingRules: TradeCrmCustomerConfigMatchingRule[];
  importConfig: {
    destination: 'customer-list' | 'public-pool';
    updateExistingContacts: boolean;
    selectedFields: string[];
  };
};

type TradeCrmCustomerConfigOperationHistoryItem = {
  id: string;
  operatedAt: string | null;
  operationSummary: string;
  operationType: string | null;
  operatorName: string | null;
};

type UseTradeCrmCustomerConfigDraftOptions = {
  customerStageSummary: TradeCrmCustomerSummaryItem[];
  customerGroupSummary: TradeCrmCustomerSummaryItem[];
  customerTagSummary: TradeCrmCustomerSummaryItem[];
  customerSourceSummary: TradeCrmCustomerSummaryItem[];
  publicPoolGroupLabels: string[];
};

type TimestampedObjectRecord = ObjectRecord & {
  id: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type CustomerGroupRecord = TimestampedObjectRecord & {
  groupName?: string | null;
  parentGroupId?: string | null;
  sortOrder?: number | null;
  level?: number | null;
  isEnabled?: boolean | null;
};

type CustomerTagRecord = TimestampedObjectRecord & {
  tagName?: string | null;
  tagColor?: string | null;
  tagScope?: string | null;
  objectScope?: string | null;
  sortOrder?: number | null;
  isEnabled?: boolean | null;
};

type CustomerSourceRecord = TimestampedObjectRecord & {
  sourceName?: string | null;
  sourceCode?: string | null;
  sortOrder?: number | null;
  isEnabled?: boolean | null;
};

type CustomerPublicPoolRuleRecord = TimestampedObjectRecord & {
  ruleName?: string | null;
  inactivityDays?: number | null;
  notifyOwnersFirst?: boolean | null;
  scopeStages?: string[] | null;
  publicPoolGroup?: string | null;
  isEnabled?: boolean | null;
};

type CustomerMatchingRuleRecord = TimestampedObjectRecord & {
  fieldName?: string | null;
  weight?: number | null;
  priority?: number | null;
  isEnabled?: boolean | null;
};

type CustomerImportJobRecord = TimestampedObjectRecord & {
  fileName?: string | null;
  destination?: string | null;
  updateExistingContacts?: boolean | null;
  selectedFields?: string[] | null;
  status?: string | null;
};

type CustomerConfigAggregateQuery = {
  customerConfig: {
    groups: Array<{
      id: string;
      label: string;
      parentId: string | null;
      level: number;
      sortOrder: number | null;
      isEnabled: boolean;
    }>;
    tags: Array<{
      id: string;
      label: string;
      color: string | null;
      scope: string | null;
      objectScope: string | null;
      sortOrder: number | null;
      isEnabled: boolean;
    }>;
    sources: Array<{
      id: string;
      label: string;
      code: string | null;
      sortOrder: number | null;
      isEnabled: boolean;
    }>;
    publicPoolRules: Array<{
      id: string;
      ruleName: string;
      inactivityDays: number | null;
      notifyOwnersFirst: boolean;
      scopeStageValues: string[];
      publicPoolGroupValue: string | null;
      isEnabled: boolean;
    }>;
    matchingRules: Array<{
      id: string;
      field: string;
      weight: number | null;
      priority: number | null;
      isEnabled: boolean;
    }>;
    importDefaults: {
      id: string | null;
      destinationValue: string | null;
      updateExistingContacts: boolean;
      selectedFields: string[];
      status: string | null;
    };
  };
};

type CustomerConfigOperationHistoryQuery = {
  customerConfigOperationHistory: {
    items: TradeCrmCustomerConfigOperationHistoryItem[];
    totalCount: number;
  };
};

type CustomerConfigOperationHistoryQueryVariables = {
  limit?: number;
};

type LogCustomerConfigChangeMutation = {
  logCustomerConfigChange: TradeCrmCustomerConfigOperationHistoryItem;
};

type LogCustomerConfigChangeMutationVariables = {
  input: {
    sectionKeys: string[];
    summary: string;
  };
};

const GET_CUSTOMER_CONFIG_AGGREGATE = gql`
  query GetCustomerConfigAggregate {
    customerConfig {
      groups {
        id
        label
        parentId
        level
        sortOrder
        isEnabled
      }
      tags {
        id
        label
        color
        scope
        objectScope
        sortOrder
        isEnabled
      }
      sources {
        id
        label
        code
        sortOrder
        isEnabled
      }
      publicPoolRules {
        id
        ruleName
        inactivityDays
        notifyOwnersFirst
        scopeStageValues
        publicPoolGroupValue
        isEnabled
      }
      matchingRules {
        id
        field
        weight
        priority
        isEnabled
      }
      importDefaults {
        id
        destinationValue
        updateExistingContacts
        selectedFields
        status
      }
    }
  }
`;

const GET_CUSTOMER_CONFIG_OPERATION_HISTORY = gql`
  query GetCustomerConfigOperationHistory($limit: Int) {
    customerConfigOperationHistory(limit: $limit) {
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

const LOG_CUSTOMER_CONFIG_CHANGE = gql`
  mutation LogCustomerConfigChange($input: LogCustomerConfigChangeInput!) {
    logCustomerConfigChange(input: $input) {
      id
      operatedAt
      operationSummary
      operationType
      operatorName
    }
  }
`;

const CUSTOMER_IMPORT_DEFAULT_CONFIG_FILE_NAME = '__CUSTOMER_IMPORT_DEFAULTS__';

const DEFAULT_TEMPLATE_FIELDS = [
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
];

const DEFAULT_MATCHING_RULES: TradeCrmCustomerConfigMatchingRule[] = [
  {
    field: 'Company Name',
    weight: 35,
  },
  {
    field: 'Contact Email',
    weight: 20,
  },
  {
    field: 'Phone',
    weight: 15,
  },
  {
    field: 'Social Profiles',
    weight: 15,
  },
  {
    field: 'Country and Region',
    weight: 15,
  },
];

const CUSTOMER_TAG_SCOPE_VALUE_BY_SCOPE: Record<
  TradeCrmCustomerConfigTagScope,
  string
> = {
  company: 'COMPANY',
  mine: 'MINE',
  subordinate: 'SUBORDINATE',
};

const CUSTOMER_TAG_SCOPE_BY_VALUE: Record<
  string,
  TradeCrmCustomerConfigTagScope
> = {
  COMPANY: 'company',
  MINE: 'mine',
  SUBORDINATE: 'subordinate',
};

const CUSTOMER_IMPORT_DESTINATION_VALUE_BY_CONFIG: Record<
  TradeCrmCustomerConfigDraft['importConfig']['destination'],
  string
> = {
  'customer-list': 'CUSTOMER_LIST',
  'public-pool': 'PUBLIC_POOL',
};

const CUSTOMER_IMPORT_DESTINATION_BY_VALUE: Record<
  string,
  TradeCrmCustomerConfigDraft['importConfig']['destination']
> = {
  CUSTOMER_LIST: 'customer-list',
  PUBLIC_POOL: 'public-pool',
};

const CUSTOMER_TAG_COLORS = [
  'green',
  'blue',
  'yellow',
  'orange',
  'red',
  'purple',
  'sky',
  'gray',
];

const normalizeString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const normalizeNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const normalizeBoolean = (value: unknown) =>
  typeof value === 'boolean' ? value : null;

const normalizeStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is string =>
          typeof entry === 'string' && entry.trim().length > 0,
      )
    : [];

const getLatestTimestamp = (records: TimestampedObjectRecord[]) =>
  records
    .map((record) => record.updatedAt ?? record.createdAt ?? null)
    .filter((value): value is string => typeof value === 'string')
    .sort((left, right) => right.localeCompare(left))[0] ?? null;

const sortByOptionalNumber = <
  TRecord extends {
    sortOrder?: number | null;
    priority?: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  },
>(
  records: TRecord[],
  fieldName: 'sortOrder' | 'priority',
) =>
  [...records].sort((left, right) => {
    const leftOrder =
      normalizeNumber(left[fieldName]) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder =
      normalizeNumber(right[fieldName]) ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    const leftTimestamp = left.updatedAt ?? left.createdAt ?? '';
    const rightTimestamp = right.updatedAt ?? right.createdAt ?? '';

    return leftTimestamp.localeCompare(rightTimestamp);
  });

const buildDefaultDraft = ({
  customerStageSummary,
  customerGroupSummary,
  customerTagSummary,
  customerSourceSummary,
  publicPoolGroupLabels,
}: UseTradeCrmCustomerConfigDraftOptions): TradeCrmCustomerConfigDraft => {
  const groupLabels =
    customerGroupSummary.length > 0
      ? customerGroupSummary.slice(0, 4).map((item) => item.label)
      : ['Strategic Accounts', 'Growth Accounts', 'Recovery Lane'];
  const companyTags =
    customerTagSummary.length > 0
      ? customerTagSummary.slice(0, 6).map((item) => item.label)
      : ['Priority Buyer', 'Large RFQ', 'Dormant Revival'];
  const sourceLabels =
    customerSourceSummary.length > 0
      ? customerSourceSummary.slice(0, 6).map((item) => item.label)
      : ['Lead Conversion', 'Referral', 'Website Inquiry', 'Manual Import'];
  const stageLabels =
    customerStageSummary.length > 0
      ? customerStageSummary.slice(0, 3).map((item) => item.label)
      : ['Potential Customer', 'Active Customer', 'Won Customer'];

  return {
    publicPoolRule: {
      ruleName: 'Default Public Pool Rule',
      inactivityDays: 15,
      notifyOwnersFirst: true,
      scopeStages: stageLabels,
      publicPoolGroup: publicPoolGroupLabels[0] ?? 'Default Public Pool',
    },
    groups: groupLabels.flatMap((label, index) => {
      const rootId = `group-root-${index + 1}`;

      return [
        {
          id: rootId,
          label,
          level: 1 as const,
          parentId: null,
        },
        {
          id: `${rootId}-child-1`,
          label: `${label} / Focus`,
          level: 2 as const,
          parentId: rootId,
        },
      ];
    }),
    tags: {
      company: companyTags,
      mine: ['High Response', 'Waiting For PI', 'Review Next Week'],
      subordinate: ['Team Transfer', 'Needs Manager', 'Risky Pricing'],
    },
    sources: sourceLabels,
    matchingRules: DEFAULT_MATCHING_RULES,
    importConfig: {
      destination: 'customer-list',
      updateExistingContacts: false,
      selectedFields: DEFAULT_TEMPLATE_FIELDS,
    },
  };
};

const buildDraftFromRecords = ({
  fallbackDraft,
  groupRecords,
  tagRecords,
  sourceRecords,
  publicPoolRuleRecords,
  matchingRuleRecords,
  importDefaultRecords,
}: {
  fallbackDraft: TradeCrmCustomerConfigDraft;
  groupRecords: CustomerGroupRecord[];
  tagRecords: CustomerTagRecord[];
  sourceRecords: CustomerSourceRecord[];
  publicPoolRuleRecords: CustomerPublicPoolRuleRecord[];
  matchingRuleRecords: CustomerMatchingRuleRecord[];
  importDefaultRecords: CustomerImportJobRecord[];
}): TradeCrmCustomerConfigDraft => {
  const hasPersistedConfig =
    groupRecords.length > 0 ||
    tagRecords.length > 0 ||
    sourceRecords.length > 0 ||
    publicPoolRuleRecords.length > 0 ||
    matchingRuleRecords.length > 0 ||
    importDefaultRecords.length > 0;

  if (!hasPersistedConfig) {
    return fallbackDraft;
  }

  const sortedGroupRecords = sortByOptionalNumber(groupRecords, 'sortOrder');
  const groups =
    sortedGroupRecords.length > 0
      ? sortedGroupRecords.map((groupRecord) => ({
          id: groupRecord.id,
          label: normalizeString(groupRecord.groupName) ?? 'Unnamed Group',
          level:
            normalizeNumber(groupRecord.level) === 2 ||
            normalizeString(groupRecord.parentGroupId)
              ? (2 as const)
              : (1 as const),
          parentId: normalizeString(groupRecord.parentGroupId),
        }))
      : [];

  const tags = tagRecords.reduce<
    Record<TradeCrmCustomerConfigTagScope, string[]>
  >(
    (accumulator, tagRecord) => {
      const scope =
        CUSTOMER_TAG_SCOPE_BY_VALUE[
          normalizeString(tagRecord.tagScope) ?? ''
        ] ?? null;
      const tagName = normalizeString(tagRecord.tagName);

      if (!scope || !tagName) {
        return accumulator;
      }

      accumulator[scope].push(tagName);

      return accumulator;
    },
    {
      company: [],
      mine: [],
      subordinate: [],
    },
  );

  const sortedSourceRecords = sortByOptionalNumber(sourceRecords, 'sortOrder');
  const sources = sortedSourceRecords
    .map((sourceRecord) => normalizeString(sourceRecord.sourceName))
    .filter((sourceName): sourceName is string => sourceName !== null);

  const latestPublicPoolRuleRecord =
    [...publicPoolRuleRecords].sort((left, right) =>
      (right.updatedAt ?? right.createdAt ?? '').localeCompare(
        left.updatedAt ?? left.createdAt ?? '',
      ),
    )[0] ?? null;

  const publicPoolRule =
    latestPublicPoolRuleRecord !== null
      ? {
          ruleName:
            normalizeString(latestPublicPoolRuleRecord.ruleName) ??
            fallbackDraft.publicPoolRule.ruleName,
          inactivityDays:
            normalizeNumber(latestPublicPoolRuleRecord.inactivityDays) ??
            fallbackDraft.publicPoolRule.inactivityDays,
          notifyOwnersFirst:
            normalizeBoolean(latestPublicPoolRuleRecord.notifyOwnersFirst) ??
            fallbackDraft.publicPoolRule.notifyOwnersFirst,
          scopeStages:
            normalizeStringArray(latestPublicPoolRuleRecord.scopeStages).map(
              (stageValue) =>
                getTradeCrmCustomerStageLabelForValue(stageValue) ?? stageValue,
            ) ?? fallbackDraft.publicPoolRule.scopeStages,
          publicPoolGroup:
            getTradeCrmPublicPoolGroupLabelForValue(
              normalizeString(latestPublicPoolRuleRecord.publicPoolGroup),
            ) ?? fallbackDraft.publicPoolRule.publicPoolGroup,
        }
      : fallbackDraft.publicPoolRule;

  const sortedMatchingRuleRecords = sortByOptionalNumber(
    matchingRuleRecords,
    'priority',
  );
  const matchingRules = sortedMatchingRuleRecords.map((matchingRuleRecord) => ({
    field: normalizeString(matchingRuleRecord.fieldName) ?? 'Unnamed Field',
    weight: normalizeNumber(matchingRuleRecord.weight) ?? 0,
  }));

  const latestImportDefaultsRecord =
    [...importDefaultRecords].sort((left, right) =>
      (right.updatedAt ?? right.createdAt ?? '').localeCompare(
        left.updatedAt ?? left.createdAt ?? '',
      ),
    )[0] ?? null;

  const importConfig =
    latestImportDefaultsRecord !== null
      ? {
          destination:
            CUSTOMER_IMPORT_DESTINATION_BY_VALUE[
              normalizeString(latestImportDefaultsRecord.destination) ?? ''
            ] ?? fallbackDraft.importConfig.destination,
          updateExistingContacts:
            normalizeBoolean(
              latestImportDefaultsRecord.updateExistingContacts,
            ) ?? fallbackDraft.importConfig.updateExistingContacts,
          selectedFields:
            normalizeStringArray(latestImportDefaultsRecord.selectedFields)
              .length > 0
              ? normalizeStringArray(latestImportDefaultsRecord.selectedFields)
              : fallbackDraft.importConfig.selectedFields,
        }
      : fallbackDraft.importConfig;

  return {
    publicPoolRule,
    groups,
    tags,
    sources,
    matchingRules,
    importConfig,
  };
};

const buildDraftFromAggregate = ({
  aggregate,
  fallbackDraft,
}: {
  aggregate: CustomerConfigAggregateQuery['customerConfig'];
  fallbackDraft: TradeCrmCustomerConfigDraft;
}): TradeCrmCustomerConfigDraft => {
  const hasPersistedConfig =
    aggregate.groups.length > 0 ||
    aggregate.tags.length > 0 ||
    aggregate.sources.length > 0 ||
    aggregate.publicPoolRules.length > 0 ||
    aggregate.matchingRules.length > 0 ||
    aggregate.importDefaults.id !== null;

  if (!hasPersistedConfig) {
    return fallbackDraft;
  }

  const groups = [...aggregate.groups]
    .sort((left, right) => {
      const leftOrder =
        normalizeNumber(left.sortOrder) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder =
        normalizeNumber(right.sortOrder) ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.label.localeCompare(right.label);
    })
    .map((group) => ({
      id: group.id,
      label: normalizeString(group.label) ?? 'Unnamed Group',
      level:
        normalizeNumber(group.level) === 2 || normalizeString(group.parentId)
          ? (2 as const)
          : (1 as const),
      parentId: normalizeString(group.parentId),
    }));

  const tags = aggregate.tags.reduce<
    Record<TradeCrmCustomerConfigTagScope, string[]>
  >(
    (accumulator, tag) => {
      const scope =
        CUSTOMER_TAG_SCOPE_BY_VALUE[normalizeString(tag.scope) ?? ''] ?? null;
      const tagLabel = normalizeString(tag.label);

      if (!scope || !tagLabel) {
        return accumulator;
      }

      accumulator[scope].push(tagLabel);

      return accumulator;
    },
    {
      company: [],
      mine: [],
      subordinate: [],
    },
  );

  const sources = [...aggregate.sources]
    .sort((left, right) => {
      const leftOrder =
        normalizeNumber(left.sortOrder) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder =
        normalizeNumber(right.sortOrder) ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.label.localeCompare(right.label);
    })
    .map((source) => normalizeString(source.label))
    .filter((source): source is string => source !== null);

  const latestPublicPoolRule = aggregate.publicPoolRules[0] ?? null;
  const publicPoolRule =
    latestPublicPoolRule !== null
      ? {
          ruleName:
            normalizeString(latestPublicPoolRule.ruleName) ??
            fallbackDraft.publicPoolRule.ruleName,
          inactivityDays:
            normalizeNumber(latestPublicPoolRule.inactivityDays) ??
            fallbackDraft.publicPoolRule.inactivityDays,
          notifyOwnersFirst:
            latestPublicPoolRule.notifyOwnersFirst ??
            fallbackDraft.publicPoolRule.notifyOwnersFirst,
          scopeStages:
            latestPublicPoolRule.scopeStageValues.length > 0
              ? latestPublicPoolRule.scopeStageValues.map(
                  (stageValue) =>
                    getTradeCrmCustomerStageLabelForValue(stageValue) ??
                    stageValue,
                )
              : fallbackDraft.publicPoolRule.scopeStages,
          publicPoolGroup:
            getTradeCrmPublicPoolGroupLabelForValue(
              normalizeString(latestPublicPoolRule.publicPoolGroupValue),
            ) ?? fallbackDraft.publicPoolRule.publicPoolGroup,
        }
      : fallbackDraft.publicPoolRule;

  const matchingRules = [...aggregate.matchingRules]
    .sort((left, right) => {
      const leftOrder =
        normalizeNumber(left.priority) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder =
        normalizeNumber(right.priority) ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.field.localeCompare(right.field);
    })
    .map((rule) => ({
      field: normalizeString(rule.field) ?? 'Unnamed Field',
      weight: normalizeNumber(rule.weight) ?? 0,
    }));

  const importConfig = {
    destination:
      CUSTOMER_IMPORT_DESTINATION_BY_VALUE[
        normalizeString(aggregate.importDefaults.destinationValue) ?? ''
      ] ?? fallbackDraft.importConfig.destination,
    updateExistingContacts:
      aggregate.importDefaults.updateExistingContacts ??
      fallbackDraft.importConfig.updateExistingContacts,
    selectedFields:
      aggregate.importDefaults.selectedFields.length > 0
        ? aggregate.importDefaults.selectedFields
        : fallbackDraft.importConfig.selectedFields,
  };

  return {
    publicPoolRule,
    groups,
    tags,
    sources,
    matchingRules,
    importConfig,
  };
};

const dedupeLabels = (labels: string[]) => [...new Set(labels)];

const normalizeLabelKey = (label: string) => label.trim().toLocaleLowerCase();

const formatSummaryList = (items: string[], maxItems = 3) => {
  if (items.length === 0) {
    return '';
  }

  const visibleItems = items.slice(0, maxItems).join(', ');

  return items.length > maxItems
    ? `${visibleItems}, +${items.length - maxItems} more`
    : visibleItems;
};

const haveSameNormalizedLabels = (
  nextItems: string[],
  previousItems: string[],
) => {
  if (nextItems.length !== previousItems.length) {
    return false;
  }

  const nextKeys = [...nextItems].map(normalizeLabelKey).sort();
  const previousKeys = [...previousItems].map(normalizeLabelKey).sort();

  return nextKeys.every((key, index) => key === previousKeys[index]);
};

const hasSameNormalizedOrder = (nextItems: string[], previousItems: string[]) =>
  nextItems.length === previousItems.length &&
  nextItems.every(
    (item, index) => normalizeLabelKey(item) === normalizeLabelKey(previousItems[index] ?? ''),
  );

const getAddedLabels = (nextItems: string[], previousItems: string[]) => {
  const previousItemKeys = new Set(
    previousItems.map((item) => normalizeLabelKey(item)),
  );

  return nextItems.filter(
    (item) => !previousItemKeys.has(normalizeLabelKey(item)),
  );
};

const getRemovedLabels = (nextItems: string[], previousItems: string[]) => {
  const nextItemKeys = new Set(
    nextItems.map((item) => normalizeLabelKey(item)),
  );

  return previousItems.filter(
    (item) => !nextItemKeys.has(normalizeLabelKey(item)),
  );
};

const getChangedConfigSections = ({
  draft,
  savedDraft,
}: {
  draft: TradeCrmCustomerConfigDraft;
  savedDraft: TradeCrmCustomerConfigDraft;
}) => {
  const changedSections: Array<{
    key: string;
    summary: string;
  }> = [];

  if (
    JSON.stringify(draft.publicPoolRule) !==
    JSON.stringify(savedDraft.publicPoolRule)
  ) {
    const publicPoolRuleChanges: string[] = [];

    if (
      draft.publicPoolRule.inactivityDays !==
      savedDraft.publicPoolRule.inactivityDays
    ) {
      publicPoolRuleChanges.push(
        `inactivity ${savedDraft.publicPoolRule.inactivityDays}d -> ${draft.publicPoolRule.inactivityDays}d`,
      );
    }

    if (draft.publicPoolRule.ruleName !== savedDraft.publicPoolRule.ruleName) {
      publicPoolRuleChanges.push(
        `rule ${savedDraft.publicPoolRule.ruleName} -> ${draft.publicPoolRule.ruleName}`,
      );
    }

    if (
      draft.publicPoolRule.publicPoolGroup !==
      savedDraft.publicPoolRule.publicPoolGroup
    ) {
      publicPoolRuleChanges.push(
        `pool ${draft.publicPoolRule.publicPoolGroup}`,
      );
    }

    if (
      draft.publicPoolRule.notifyOwnersFirst !==
      savedDraft.publicPoolRule.notifyOwnersFirst
    ) {
      publicPoolRuleChanges.push(
        draft.publicPoolRule.notifyOwnersFirst
          ? 'owner warning enabled'
          : 'direct recycle enabled',
      );
    }

    const addedStages = getAddedLabels(
      draft.publicPoolRule.scopeStages,
      savedDraft.publicPoolRule.scopeStages,
    );
    const removedStages = getRemovedLabels(
      draft.publicPoolRule.scopeStages,
      savedDraft.publicPoolRule.scopeStages,
    );

    if (addedStages.length > 0) {
      publicPoolRuleChanges.push(`stage + ${formatSummaryList(addedStages)}`);
    }

    if (removedStages.length > 0) {
      publicPoolRuleChanges.push(`stage - ${formatSummaryList(removedStages)}`);
    }

    if (
      addedStages.length === 0 &&
      removedStages.length === 0 &&
      !hasSameNormalizedOrder(
        draft.publicPoolRule.scopeStages,
        savedDraft.publicPoolRule.scopeStages,
      )
    ) {
      publicPoolRuleChanges.push('stage order updated');
    }

    changedSections.push({
      key: 'public-pool-rules',
      summary:
        publicPoolRuleChanges.length > 0
          ? `Public pool rules: ${publicPoolRuleChanges.join('; ')}`
          : 'Public pool rules updated',
    });
  }

  if (JSON.stringify(draft.groups) !== JSON.stringify(savedDraft.groups)) {
    const previousGroupById = new Map(
      savedDraft.groups.map((group) => [group.id, group]),
    );
    const nextGroupById = new Map(
      draft.groups.map((group) => [group.id, group]),
    );
    const addedGroups = draft.groups
      .filter((group) => !previousGroupById.has(group.id))
      .map((group) => group.label);
    const removedGroups = savedDraft.groups
      .filter((group) => !nextGroupById.has(group.id))
      .map((group) => group.label);
    const renamedGroups = draft.groups
      .filter((group) => {
        const previousGroup = previousGroupById.get(group.id);

        return (
          previousGroup !== undefined && previousGroup.label !== group.label
        );
      })
      .map((group) => {
        const previousGroup = previousGroupById.get(group.id);

        return `${previousGroup?.label ?? group.label} -> ${group.label}`;
      });
    const movedGroups = draft.groups
      .filter((group) => {
        const previousGroup = previousGroupById.get(group.id);

        return (
          previousGroup !== undefined && previousGroup.parentId !== group.parentId
        );
      })
      .map((group) => {
        const previousGroup = previousGroupById.get(group.id);

        if (previousGroup === undefined) {
          return `${group.label} parent updated`;
        }

        const previousParentLabel =
          previousGroup.parentId === null
            ? 'root'
            : savedDraft.groups.find(
                (candidateGroup) => candidateGroup.id === previousGroup.parentId,
              )?.label ?? 'unknown';
        const nextParentLabel =
          group.parentId === null
            ? 'root'
            : draft.groups.find(
                (candidateGroup) => candidateGroup.id === group.parentId,
              )?.label ?? 'unknown';

        return `${group.label} ${previousParentLabel} -> ${nextParentLabel}`;
      });
    const previousRootOrder = savedDraft.groups
      .filter((group) => group.level === 1)
      .map((group) => group.id);
    const nextRootOrder = draft.groups
      .filter((group) => group.level === 1)
      .map((group) => group.id);
    const rootOrderChanged =
      previousRootOrder.length === nextRootOrder.length &&
      previousRootOrder.some(
        (groupId, index) => groupId !== nextRootOrder[index],
      );
    const childOrderChanged = draft.groups.some((group) => {
      if (group.level !== 1) {
        return false;
      }

      const previousChildOrder = savedDraft.groups
        .filter((candidateGroup) => candidateGroup.parentId === group.id)
        .map((candidateGroup) => candidateGroup.id);
      const nextChildOrder = draft.groups
        .filter((candidateGroup) => candidateGroup.parentId === group.id)
        .map((candidateGroup) => candidateGroup.id);

      return (
        previousChildOrder.length === nextChildOrder.length &&
        previousChildOrder.some(
          (groupId, index) => groupId !== nextChildOrder[index],
        )
      );
    });
    const groupChanges = [
      addedGroups.length > 0 ? `+ ${formatSummaryList(addedGroups)}` : null,
      removedGroups.length > 0 ? `- ${formatSummaryList(removedGroups)}` : null,
      renamedGroups.length > 0
        ? `rename ${formatSummaryList(renamedGroups, 2)}`
        : null,
      movedGroups.length > 0
        ? `parent ${formatSummaryList(movedGroups, 2)}`
        : null,
      rootOrderChanged ? 'root order updated' : null,
      childOrderChanged ? 'child order updated' : null,
    ].filter((change): change is string => change !== null);

    changedSections.push({
      key: 'groups',
      summary:
        groupChanges.length > 0
          ? `Groups: ${groupChanges.join('; ')}`
          : 'Groups updated',
    });
  }

  if (JSON.stringify(draft.tags) !== JSON.stringify(savedDraft.tags)) {
    const tagScopeSummaries = (
      Object.keys(draft.tags) as TradeCrmCustomerConfigTagScope[]
    )
      .map((scope) => {
        const addedTags = getAddedLabels(
          draft.tags[scope],
          savedDraft.tags[scope],
        );
        const removedTags = getRemovedLabels(
          draft.tags[scope],
          savedDraft.tags[scope],
        );
        const scopeChanges = [
          addedTags.length > 0 ? `+ ${formatSummaryList(addedTags)}` : null,
          removedTags.length > 0 ? `- ${formatSummaryList(removedTags)}` : null,
          addedTags.length === 0 &&
          removedTags.length === 0 &&
          haveSameNormalizedLabels(draft.tags[scope], savedDraft.tags[scope]) &&
          !hasSameNormalizedOrder(draft.tags[scope], savedDraft.tags[scope])
            ? 'order updated'
            : null,
        ].filter((change): change is string => change !== null);

        if (scopeChanges.length === 0) {
          return null;
        }

        return `${scope}: ${scopeChanges.join('; ')}`;
      })
      .filter((scopeSummary): scopeSummary is string => scopeSummary !== null);

    changedSections.push({
      key: 'tags',
      summary:
        tagScopeSummaries.length > 0
          ? `Tags: ${tagScopeSummaries.join(' / ')}`
          : 'Tags updated',
    });
  }

  if (JSON.stringify(draft.sources) !== JSON.stringify(savedDraft.sources)) {
    const addedSources = getAddedLabels(draft.sources, savedDraft.sources);
    const removedSources = getRemovedLabels(draft.sources, savedDraft.sources);
    const sourceChanges = [
      addedSources.length > 0 ? `+ ${formatSummaryList(addedSources)}` : null,
      removedSources.length > 0
        ? `- ${formatSummaryList(removedSources)}`
        : null,
      addedSources.length === 0 &&
      removedSources.length === 0 &&
      haveSameNormalizedLabels(draft.sources, savedDraft.sources) &&
      !hasSameNormalizedOrder(draft.sources, savedDraft.sources)
        ? 'order updated'
        : null,
    ].filter((change): change is string => change !== null);

    changedSections.push({
      key: 'sources',
      summary:
        sourceChanges.length > 0
          ? `Sources: ${sourceChanges.join('; ')}`
          : 'Sources updated',
    });
  }

  if (
    JSON.stringify(draft.matchingRules) !==
    JSON.stringify(savedDraft.matchingRules)
  ) {
    const matchingChanges = draft.matchingRules
      .map((rule) => {
        const previousRule = savedDraft.matchingRules.find(
          (savedRule) => savedRule.field === rule.field,
        );

        if (previousRule === undefined || previousRule.weight === rule.weight) {
          return null;
        }

        return `${rule.field} ${previousRule.weight}% -> ${rule.weight}%`;
      })
      .filter((change): change is string => change !== null);

    changedSections.push({
      key: 'matching',
      summary:
        matchingChanges.length > 0
          ? `Matching: ${formatSummaryList(matchingChanges, 2)}`
          : 'Matching rules updated',
    });
  }

  if (
    JSON.stringify(draft.importConfig) !==
    JSON.stringify(savedDraft.importConfig)
  ) {
    const importChanges: string[] = [];

    if (
      draft.importConfig.destination !== savedDraft.importConfig.destination
    ) {
      importChanges.push(`destination ${draft.importConfig.destination}`);
    }

    if (
      draft.importConfig.updateExistingContacts !==
      savedDraft.importConfig.updateExistingContacts
    ) {
      importChanges.push(
        draft.importConfig.updateExistingContacts
          ? 'contact update enabled'
          : 'contact update disabled',
      );
    }

    const addedImportFields = getAddedLabels(
      draft.importConfig.selectedFields,
      savedDraft.importConfig.selectedFields,
    );
    const removedImportFields = getRemovedLabels(
      draft.importConfig.selectedFields,
      savedDraft.importConfig.selectedFields,
    );

    if (addedImportFields.length > 0) {
      importChanges.push(`field + ${formatSummaryList(addedImportFields)}`);
    }

    if (removedImportFields.length > 0) {
      importChanges.push(`field - ${formatSummaryList(removedImportFields)}`);
    }

    if (
      addedImportFields.length === 0 &&
      removedImportFields.length === 0 &&
      haveSameNormalizedLabels(
        draft.importConfig.selectedFields,
        savedDraft.importConfig.selectedFields,
      ) &&
      !hasSameNormalizedOrder(
        draft.importConfig.selectedFields,
        savedDraft.importConfig.selectedFields,
      )
    ) {
      importChanges.push('field order updated');
    }

    changedSections.push({
      key: 'import',
      summary:
        importChanges.length > 0
          ? `Import defaults: ${importChanges.join('; ')}`
          : 'Import defaults updated',
    });
  }

  return changedSections;
};

const createEmptyTagScopeRecord = () => ({
  company: [] as string[],
  mine: [] as string[],
  subordinate: [] as string[],
});

const getGroupValidationMessages = (
  groups: TradeCrmCustomerConfigDraft['groups'],
) => {
  const messages: string[] = [];
  const seenGroupKeys = new Set<string>();

  for (const group of groups) {
    const trimmedLabel = group.label.trim();

    if (trimmedLabel.length === 0) {
      messages.push('Customer groups cannot use an empty label.');
      continue;
    }

    if (
      group.level === 2 &&
      (group.parentId === null ||
        !groups.some(
          (candidateGroup) =>
            candidateGroup.id === group.parentId && candidateGroup.level === 1,
        ))
    ) {
      messages.push(
        `Second-level group "${trimmedLabel}" is missing a root group.`,
      );
    }

    const groupKey = `${group.parentId ?? 'root'}:${normalizeLabelKey(trimmedLabel)}`;

    if (seenGroupKeys.has(groupKey)) {
      messages.push(
        `Duplicate customer group "${trimmedLabel}" exists in the same level.`,
      );
      continue;
    }

    seenGroupKeys.add(groupKey);
  }

  return [...new Set(messages)];
};

const getTagValidationMessages = (
  tags: TradeCrmCustomerConfigDraft['tags'],
): Record<TradeCrmCustomerConfigTagScope, string[]> => {
  const messagesByScope = createEmptyTagScopeRecord();

  for (const scope of Object.keys(tags) as TradeCrmCustomerConfigTagScope[]) {
    const seenTagKeys = new Set<string>();

    for (const label of tags[scope]) {
      const trimmedLabel = label.trim();

      if (trimmedLabel.length === 0) {
        messagesByScope[scope].push('Tags cannot use an empty label.');
        continue;
      }

      const tagKey = normalizeLabelKey(trimmedLabel);

      if (seenTagKeys.has(tagKey)) {
        messagesByScope[scope].push(
          `Duplicate tag "${trimmedLabel}" already exists.`,
        );
        continue;
      }

      seenTagKeys.add(tagKey);
    }
  }

  return {
    company: [...new Set(messagesByScope.company)],
    mine: [...new Set(messagesByScope.mine)],
    subordinate: [...new Set(messagesByScope.subordinate)],
  };
};

const getSourceValidationMessages = (
  sources: TradeCrmCustomerConfigDraft['sources'],
) => {
  const messages: string[] = [];
  const seenSourceKeys = new Set<string>();

  for (const label of sources) {
    const trimmedLabel = label.trim();

    if (trimmedLabel.length === 0) {
      messages.push('Customer sources cannot use an empty label.');
      continue;
    }

    const sourceKey = normalizeLabelKey(trimmedLabel);

    if (seenSourceKeys.has(sourceKey)) {
      messages.push(`Duplicate source "${trimmedLabel}" already exists.`);
      continue;
    }

    seenSourceKeys.add(sourceKey);
  }

  return [...new Set(messages)];
};

const getNewGroupValidationMessage = ({
  groups,
  label,
  parentId,
}: {
  groups: TradeCrmCustomerConfigDraft['groups'];
  label: string;
  parentId: string | null;
}) => {
  const trimmedLabel = label.trim();

  if (trimmedLabel.length === 0) {
    return 'Enter a group label before adding it.';
  }

  if (
    parentId !== null &&
    !groups.some((group) => group.id === parentId && group.level === 1)
  ) {
    return 'Second-level groups must be attached to a root group.';
  }

  const candidateKey = `${parentId ?? 'root'}:${normalizeLabelKey(trimmedLabel)}`;
  const hasDuplicate = groups.some(
    (group) =>
      `${group.parentId ?? 'root'}:${normalizeLabelKey(group.label)}` ===
      candidateKey,
  );

  return hasDuplicate
    ? 'A group with the same label already exists at this level.'
    : null;
};

const getChangeGroupParentValidationMessage = ({
  groups,
  groupId,
  nextParentId,
}: {
  groups: TradeCrmCustomerConfigDraft['groups'];
  groupId: string;
  nextParentId: string;
}) => {
  const targetGroup = groups.find((group) => group.id === groupId) ?? null;

  if (targetGroup === null) {
    return 'Select a valid group before changing its parent.';
  }

  if (targetGroup.level !== 2) {
    return 'Only second-level groups can change parent.';
  }

  const nextParentGroup =
    groups.find((group) => group.id === nextParentId && group.level === 1) ??
    null;

  if (nextParentGroup === null) {
    return 'Second-level groups must be attached to a root group.';
  }

  if (targetGroup.parentId === nextParentId) {
    return null;
  }

  const hasDuplicate = groups.some(
    (group) =>
      group.id !== groupId &&
      group.parentId === nextParentId &&
      normalizeLabelKey(group.label) === normalizeLabelKey(targetGroup.label),
  );

  return hasDuplicate
    ? 'A group with the same label already exists under the selected root.'
    : null;
};

const getNewTagValidationMessage = ({
  tags,
  scope,
  label,
}: {
  tags: TradeCrmCustomerConfigDraft['tags'];
  scope: TradeCrmCustomerConfigTagScope;
  label: string;
}) => {
  const trimmedLabel = label.trim();

  if (trimmedLabel.length === 0) {
    return 'Enter a tag label before adding it.';
  }

  const candidateKey = normalizeLabelKey(trimmedLabel);
  const hasDuplicate = tags[scope].some(
    (tagLabel) => normalizeLabelKey(tagLabel) === candidateKey,
  );

  return hasDuplicate ? 'This tag already exists in the current scope.' : null;
};

const getRenameTagValidationMessage = ({
  tags,
  scope,
  currentLabel,
  nextLabel,
}: {
  tags: TradeCrmCustomerConfigDraft['tags'];
  scope: TradeCrmCustomerConfigTagScope;
  currentLabel: string;
  nextLabel: string;
}) => {
  if (normalizeLabelKey(currentLabel) === normalizeLabelKey(nextLabel)) {
    return null;
  }

  return getNewTagValidationMessage({
    tags: {
      ...tags,
      [scope]: tags[scope].filter(
        (tagLabel) => normalizeLabelKey(tagLabel) !== normalizeLabelKey(currentLabel),
      ),
    },
    scope,
    label: nextLabel,
  });
};

const getNewSourceValidationMessage = ({
  sources,
  label,
}: {
  sources: TradeCrmCustomerConfigDraft['sources'];
  label: string;
}) => {
  const trimmedLabel = label.trim();

  if (trimmedLabel.length === 0) {
    return 'Enter a source label before adding it.';
  }

  const candidateKey = normalizeLabelKey(trimmedLabel);
  const hasDuplicate = sources.some(
    (sourceLabel) => normalizeLabelKey(sourceLabel) === candidateKey,
  );

  return hasDuplicate ? 'This source already exists.' : null;
};

const getRenameSourceValidationMessage = ({
  sources,
  currentLabel,
  nextLabel,
}: {
  sources: TradeCrmCustomerConfigDraft['sources'];
  currentLabel: string;
  nextLabel: string;
}) => {
  if (normalizeLabelKey(currentLabel) === normalizeLabelKey(nextLabel)) {
    return null;
  }

  return getNewSourceValidationMessage({
    sources: sources.filter(
      (sourceLabel) =>
        normalizeLabelKey(sourceLabel) !== normalizeLabelKey(currentLabel),
    ),
    label: nextLabel,
  });
};

const getRootGroupIds = (
  groups: TradeCrmCustomerConfigDraft['groups'],
): string[] =>
  groups.filter((group) => group.level === 1).map((group) => group.id);

const getRootGroupBounds = (
  groups: TradeCrmCustomerConfigDraft['groups'],
  rootGroupId: string,
) => {
  const startIndex = groups.findIndex((group) => group.id === rootGroupId);

  if (startIndex < 0) {
    return null;
  }

  let endIndex = startIndex;

  for (let index = startIndex + 1; index < groups.length; index += 1) {
    if (groups[index].level === 1) {
      break;
    }

    endIndex = index;
  }

  return {
    startIndex,
    endIndex,
  };
};

const moveGroupSlice = <TItem>(
  items: TItem[],
  startIndex: number,
  endIndex: number,
  nextStartIndex: number,
) => {
  const movingItems = items.slice(startIndex, endIndex + 1);
  const remainingItems = [
    ...items.slice(0, startIndex),
    ...items.slice(endIndex + 1),
  ];

  return [
    ...remainingItems.slice(0, nextStartIndex),
    ...movingItems,
    ...remainingItems.slice(nextStartIndex),
  ];
};

const moveListItem = <TItem>(
  items: TItem[],
  currentIndex: number,
  direction: 'up' | 'down',
) => {
  const adjacentIndex =
    direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || adjacentIndex < 0 || adjacentIndex >= items.length) {
    return items;
  }

  return moveGroupSlice(items, currentIndex, currentIndex, adjacentIndex);
};

const getGroupOrderIndex = (
  groups: TradeCrmCustomerConfigDraft['groups'],
  targetGroup: TradeCrmCustomerConfigGroupItem,
) => {
  const siblingGroupIds =
    targetGroup.level === 1
      ? groups.filter((group) => group.level === 1).map((group) => group.id)
      : groups
          .filter(
            (group) =>
              group.level === 2 && group.parentId === targetGroup.parentId,
          )
          .map((group) => group.id);

  return siblingGroupIds.findIndex((groupId) => groupId === targetGroup.id);
};

export const useTradeCrmCustomerConfigDraft = (
  options: UseTradeCrmCustomerConfigDraftOptions,
) => {
  const apolloCoreClient = useApolloCoreClient();
  const fallbackDraft = useMemo(() => buildDefaultDraft(options), [options]);
  const {
    data: customerConfigAggregateData,
    error: customerConfigAggregateError,
    refetch: refetchCustomerConfigAggregate,
  } = useQuery<CustomerConfigAggregateQuery>(GET_CUSTOMER_CONFIG_AGGREGATE, {
    client: apolloCoreClient,
    errorPolicy: 'all',
  });

  useSnackBarOnQueryError(customerConfigAggregateError);

  const {
    data: customerConfigOperationHistoryData,
    error: customerConfigOperationHistoryError,
    refetch: refetchCustomerConfigOperationHistory,
  } = useQuery<
    CustomerConfigOperationHistoryQuery,
    CustomerConfigOperationHistoryQueryVariables
  >(GET_CUSTOMER_CONFIG_OPERATION_HISTORY, {
    client: apolloCoreClient,
    errorPolicy: 'all',
    variables: {
      limit: 6,
    },
  });

  useSnackBarOnQueryError(customerConfigOperationHistoryError);

  const [logCustomerConfigChangeMutation] = useMutation<
    LogCustomerConfigChangeMutation,
    LogCustomerConfigChangeMutationVariables
  >(LOG_CUSTOMER_CONFIG_CHANGE, {
    client: apolloCoreClient,
    errorPolicy: 'all',
  });

  const { records: customerGroupRecords = [] } =
    useFindManyRecords<CustomerGroupRecord>({
      objectNameSingular: 'customerGroup',
      limit: 200,
    });
  const { records: customerTagRecords = [] } =
    useFindManyRecords<CustomerTagRecord>({
      objectNameSingular: 'customerTag',
      limit: 200,
    });
  const { records: customerSourceRecords = [] } =
    useFindManyRecords<CustomerSourceRecord>({
      objectNameSingular: 'customerSource',
      limit: 200,
    });
  const { records: customerPublicPoolRuleRecords = [] } =
    useFindManyRecords<CustomerPublicPoolRuleRecord>({
      objectNameSingular: 'customerPublicPoolRule',
      limit: 20,
    });
  const { records: customerMatchingRuleRecords = [] } =
    useFindManyRecords<CustomerMatchingRuleRecord>({
      objectNameSingular: 'customerMatchingRule',
      limit: 50,
    });
  const { records: customerImportDefaultRecords = [] } =
    useFindManyRecords<CustomerImportJobRecord>({
      objectNameSingular: 'customerImportJob',
      filter: {
        fileName: {
          eq: CUSTOMER_IMPORT_DEFAULT_CONFIG_FILE_NAME,
        },
      },
      limit: 5,
    });

  const { createOneRecord: createCustomerGroup } =
    useCreateOneRecord<CustomerGroupRecord>({
      objectNameSingular: 'customerGroup',
    });
  const { createOneRecord: createCustomerTag } =
    useCreateOneRecord<CustomerTagRecord>({
      objectNameSingular: 'customerTag',
    });
  const { createOneRecord: createCustomerSource } =
    useCreateOneRecord<CustomerSourceRecord>({
      objectNameSingular: 'customerSource',
    });
  const { createOneRecord: createCustomerPublicPoolRule } =
    useCreateOneRecord<CustomerPublicPoolRuleRecord>({
      objectNameSingular: 'customerPublicPoolRule',
    });
  const { createOneRecord: createCustomerMatchingRule } =
    useCreateOneRecord<CustomerMatchingRuleRecord>({
      objectNameSingular: 'customerMatchingRule',
    });
  const { createOneRecord: createCustomerImportJob } =
    useCreateOneRecord<CustomerImportJobRecord>({
      objectNameSingular: 'customerImportJob',
    });

  const { deleteOneRecord: deleteCustomerGroup } = useDeleteOneRecord({
    objectNameSingular: 'customerGroup',
  });
  const { deleteOneRecord: deleteCustomerTag } = useDeleteOneRecord({
    objectNameSingular: 'customerTag',
  });
  const { deleteOneRecord: deleteCustomerSource } = useDeleteOneRecord({
    objectNameSingular: 'customerSource',
  });
  const { deleteOneRecord: deleteCustomerMatchingRule } = useDeleteOneRecord({
    objectNameSingular: 'customerMatchingRule',
  });

  const { updateOneRecord } = useUpdateOneRecord();

  const hydratedDraft = useMemo(() => {
    const customerConfigAggregate = customerConfigAggregateData?.customerConfig;

    if (customerConfigAggregate) {
      return buildDraftFromAggregate({
        aggregate: customerConfigAggregate,
        fallbackDraft,
      });
    }

    return buildDraftFromRecords({
      fallbackDraft,
      groupRecords: customerGroupRecords,
      tagRecords: sortByOptionalNumber(customerTagRecords, 'sortOrder'),
      sourceRecords: customerSourceRecords,
      publicPoolRuleRecords: customerPublicPoolRuleRecords,
      matchingRuleRecords: customerMatchingRuleRecords,
      importDefaultRecords: customerImportDefaultRecords,
    });
  }, [
    customerConfigAggregateData,
    customerGroupRecords,
    customerImportDefaultRecords,
    customerMatchingRuleRecords,
    customerPublicPoolRuleRecords,
    customerSourceRecords,
    customerTagRecords,
    fallbackDraft,
  ]);

  const hydratedLastSavedAt = useMemo(
    () =>
      getLatestTimestamp([
        ...customerGroupRecords,
        ...customerTagRecords,
        ...customerSourceRecords,
        ...customerPublicPoolRuleRecords,
        ...customerMatchingRuleRecords,
        ...customerImportDefaultRecords,
      ]),
    [
      customerGroupRecords,
      customerImportDefaultRecords,
      customerMatchingRuleRecords,
      customerPublicPoolRuleRecords,
      customerSourceRecords,
      customerTagRecords,
    ],
  );

  const hydratedDraftKey = useMemo(
    () => JSON.stringify(hydratedDraft),
    [hydratedDraft],
  );

  const [savedDraft, setSavedDraft] = useState(hydratedDraft);
  const [draft, setDraft] = useState(hydratedDraft);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    hydratedLastSavedAt,
  );
  const [lastSavedConfigOperationId, setLastSavedConfigOperationId] = useState<
    string | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const hasUnsavedChanges =
    JSON.stringify(draft) !== JSON.stringify(savedDraft);
  const groupValidationMessages = useMemo(
    () => getGroupValidationMessages(draft.groups),
    [draft.groups],
  );
  const tagValidationMessages = useMemo(
    () => getTagValidationMessages(draft.tags),
    [draft.tags],
  );
  const sourceValidationMessages = useMemo(
    () => getSourceValidationMessages(draft.sources),
    [draft.sources],
  );
  const validationMessages = useMemo(
    () => [
      ...groupValidationMessages,
      ...tagValidationMessages.company,
      ...tagValidationMessages.mine,
      ...tagValidationMessages.subordinate,
      ...sourceValidationMessages,
    ],
    [
      groupValidationMessages,
      sourceValidationMessages,
      tagValidationMessages.company,
      tagValidationMessages.mine,
      tagValidationMessages.subordinate,
    ],
  );
  const hasValidationErrors = validationMessages.length > 0;
  const pendingChangedSections = useMemo(
    () =>
      getChangedConfigSections({
        draft,
        savedDraft,
      }),
    [draft, savedDraft],
  );

  useEffect(() => {
    if (hasUnsavedChanges) {
      setLastSavedConfigOperationId(null);

      return;
    }

    setSavedDraft(hydratedDraft);
    setDraft(hydratedDraft);
    setLastSavedAt(hydratedLastSavedAt);
  }, [hasUnsavedChanges, hydratedDraft, hydratedDraftKey, hydratedLastSavedAt]);

  const saveDraft = async () => {
    if (hasValidationErrors) {
      setSaveError(
        validationMessages[0] ?? 'Customer settings contain invalid data.',
      );

      return false;
    }

    const changedSections = getChangedConfigSections({
      draft,
      savedDraft,
    });

    setIsSaving(true);
    setSaveError(null);

    try {
      for (const customerGroupRecord of customerGroupRecords) {
        await deleteCustomerGroup(customerGroupRecord.id);
      }

      const persistedGroupsByLocalId = new Map<
        string,
        TradeCrmCustomerConfigGroupItem
      >();
      const persistedGroupIdByLocalId = new Map<string, string>();

      for (const [index, group] of draft.groups.entries()) {
        if (group.level !== 1) {
          continue;
        }

        const createdGroup = await createCustomerGroup({
          groupName: group.label,
          parentGroupId: null,
          sortOrder: index,
          level: 1,
          isEnabled: true,
        });

        persistedGroupIdByLocalId.set(group.id, createdGroup.id);
        persistedGroupsByLocalId.set(group.id, {
          ...group,
          id: createdGroup.id,
        });
      }

      for (const [index, group] of draft.groups.entries()) {
        if (group.level !== 2) {
          continue;
        }

        const parentGroupId =
          (group.parentId
            ? persistedGroupIdByLocalId.get(group.parentId)
            : null) ?? null;
        const createdGroup = await createCustomerGroup({
          groupName: group.label,
          parentGroupId,
          sortOrder: index,
          level: 2,
          isEnabled: true,
        });

        persistedGroupIdByLocalId.set(group.id, createdGroup.id);
        persistedGroupsByLocalId.set(group.id, {
          ...group,
          id: createdGroup.id,
          parentId: parentGroupId,
        });
      }

      for (const customerTagRecord of customerTagRecords) {
        await deleteCustomerTag(customerTagRecord.id);
      }

      for (const scope of Object.keys(
        draft.tags,
      ) as TradeCrmCustomerConfigTagScope[]) {
        for (const [index, tagLabel] of draft.tags[scope].entries()) {
          await createCustomerTag({
            tagName: tagLabel,
            tagColor: CUSTOMER_TAG_COLORS[index % CUSTOMER_TAG_COLORS.length],
            sortOrder: index,
            tagScope: CUSTOMER_TAG_SCOPE_VALUE_BY_SCOPE[scope],
            objectScope: 'MULTIPLE',
            isEnabled: true,
          });
        }
      }

      for (const customerSourceRecord of customerSourceRecords) {
        await deleteCustomerSource(customerSourceRecord.id);
      }

      for (const [index, sourceLabel] of draft.sources.entries()) {
        await createCustomerSource({
          sourceName: sourceLabel,
          sourceCode: sourceLabel.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
          sortOrder: index,
          isEnabled: true,
        });
      }

      const latestPublicPoolRuleRecord =
        [...customerPublicPoolRuleRecords].sort((left, right) =>
          (right.updatedAt ?? right.createdAt ?? '').localeCompare(
            left.updatedAt ?? left.createdAt ?? '',
          ),
        )[0] ?? null;

      const publicPoolRuleInput = {
        ruleName: draft.publicPoolRule.ruleName,
        inactivityDays: draft.publicPoolRule.inactivityDays,
        notifyOwnersFirst: draft.publicPoolRule.notifyOwnersFirst,
        scopeStages: dedupeLabels(draft.publicPoolRule.scopeStages)
          .map((stageLabel) =>
            getTradeCrmCustomerStageValueForLabel(stageLabel),
          )
          .filter(
            (stageValue): stageValue is string =>
              typeof stageValue === 'string',
          ),
        publicPoolGroup:
          getTradeCrmPublicPoolGroupValueForLabel(
            draft.publicPoolRule.publicPoolGroup,
          ) ?? 'GENERAL_PUBLIC_POOL',
        isEnabled: true,
      };

      if (latestPublicPoolRuleRecord !== null) {
        await updateOneRecord<CustomerPublicPoolRuleRecord>({
          objectNameSingular: 'customerPublicPoolRule',
          idToUpdate: latestPublicPoolRuleRecord.id,
          updateOneRecordInput: publicPoolRuleInput,
        });
      } else {
        await createCustomerPublicPoolRule(publicPoolRuleInput);
      }

      for (const customerMatchingRuleRecord of customerMatchingRuleRecords) {
        await deleteCustomerMatchingRule(customerMatchingRuleRecord.id);
      }

      for (const [index, matchingRule] of draft.matchingRules.entries()) {
        await createCustomerMatchingRule({
          fieldName: matchingRule.field,
          weight: matchingRule.weight,
          priority: index,
          isEnabled: true,
        });
      }

      const latestImportDefaultsRecord =
        [...customerImportDefaultRecords].sort((left, right) =>
          (right.updatedAt ?? right.createdAt ?? '').localeCompare(
            left.updatedAt ?? left.createdAt ?? '',
          ),
        )[0] ?? null;

      const importDefaultsInput = {
        fileName: CUSTOMER_IMPORT_DEFAULT_CONFIG_FILE_NAME,
        destination:
          CUSTOMER_IMPORT_DESTINATION_VALUE_BY_CONFIG[
            draft.importConfig.destination
          ],
        updateExistingContacts: draft.importConfig.updateExistingContacts,
        selectedFields: dedupeLabels(draft.importConfig.selectedFields),
        status: 'DRAFT',
      };

      if (latestImportDefaultsRecord !== null) {
        await updateOneRecord<CustomerImportJobRecord>({
          objectNameSingular: 'customerImportJob',
          idToUpdate: latestImportDefaultsRecord.id,
          updateOneRecordInput: importDefaultsInput,
        });
      } else {
        await createCustomerImportJob(importDefaultsInput);
      }

      const savedAt = new Date().toISOString();
      const persistedGroups = draft.groups.map(
        (group) => persistedGroupsByLocalId.get(group.id) ?? group,
      );
      const nextSavedDraft = {
        ...draft,
        groups: persistedGroups,
      };

      await refetchCustomerConfigAggregate();
      if (changedSections.length > 0) {
        const logCustomerConfigChangeResult =
          await logCustomerConfigChangeMutation({
            variables: {
              input: {
                sectionKeys: changedSections.map((section) => section.key),
                summary: changedSections
                  .map((section) => section.summary)
                  .join(' | '),
              },
            },
          });

        setLastSavedConfigOperationId(
          logCustomerConfigChangeResult.data?.logCustomerConfigChange.id ?? null,
        );
        await refetchCustomerConfigOperationHistory();
      } else {
        setLastSavedConfigOperationId(null);
      }

      setSavedDraft(nextSavedDraft);
      setDraft(nextSavedDraft);
      setLastSavedAt(savedAt);

      return true;
    } catch {
      setSaveError(
        'Saving customer settings failed. Refresh the page state and retry.',
      );

      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const resetDraft = () => {
    setDraft(savedDraft);
  };

  const replaceDraft = (nextDraft: TradeCrmCustomerConfigDraft) => {
    setDraft(nextDraft);
  };

  const setPublicPoolRule = <
    TFieldName extends keyof TradeCrmCustomerConfigDraft['publicPoolRule'],
  >(
    fieldName: TFieldName,
    value: TradeCrmCustomerConfigDraft['publicPoolRule'][TFieldName],
  ) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      publicPoolRule: {
        ...currentDraft.publicPoolRule,
        [fieldName]: value,
      },
    }));
  };

  const togglePublicPoolStage = (stageLabel: string) => {
    setDraft((currentDraft) => {
      const hasStage =
        currentDraft.publicPoolRule.scopeStages.includes(stageLabel);

      return {
        ...currentDraft,
        publicPoolRule: {
          ...currentDraft.publicPoolRule,
          scopeStages: hasStage
            ? currentDraft.publicPoolRule.scopeStages.filter(
                (currentStageLabel) => currentStageLabel !== stageLabel,
              )
            : [...currentDraft.publicPoolRule.scopeStages, stageLabel],
        },
      };
    });
  };

  const addGroup = (label: string, parentId: string | null = null) => {
    const normalizedLabel = label.trim();

    if (normalizedLabel.length === 0) {
      return;
    }

    setDraft((currentDraft) => {
      const normalizedParentId =
        parentId === null
          ? null
          : currentDraft.groups.some(
                (group) => group.id === parentId && group.level === 1,
              )
            ? parentId
            : null;

      if (
        getNewGroupValidationMessage({
          groups: currentDraft.groups,
          label: normalizedLabel,
          parentId: normalizedParentId,
        }) !== null
      ) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        groups: [
          ...currentDraft.groups,
          {
            id: `group-${Date.now()}-${currentDraft.groups.length + 1}`,
            label: normalizedLabel,
            level: normalizedParentId ? 2 : 1,
            parentId: normalizedParentId,
          },
        ],
      };
    });
  };

  const renameGroup = (groupId: string, label: string) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      groups: currentDraft.groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              label,
            }
          : group,
      ),
    }));
  };

  const removeGroup = (groupId: string) => {
    setDraft((currentDraft) => {
      const targetGroup =
        currentDraft.groups.find((group) => group.id === groupId) ?? null;

      if (targetGroup === null) {
        return currentDraft;
      }

      const groupIdsToRemove = new Set<string>([groupId]);

      if (targetGroup.level === 1) {
        for (const group of currentDraft.groups) {
          if (group.parentId === groupId) {
            groupIdsToRemove.add(group.id);
          }
        }
      }

      return {
        ...currentDraft,
        groups: currentDraft.groups.filter(
          (group) => !groupIdsToRemove.has(group.id),
        ),
      };
    });
  };

  const changeGroupParent = (groupId: string, nextParentId: string) => {
    setDraft((currentDraft) => {
      if (
        getChangeGroupParentValidationMessage({
          groups: currentDraft.groups,
          groupId,
          nextParentId,
        }) !== null
      ) {
        return currentDraft;
      }

      const targetGroup =
        currentDraft.groups.find((group) => group.id === groupId) ?? null;

      if (targetGroup === null || targetGroup.level !== 2) {
        return currentDraft;
      }

      const remainingGroups = currentDraft.groups.filter(
        (group) => group.id !== groupId,
      );
      const nextParentIndex = remainingGroups.findIndex(
        (group) => group.id === nextParentId,
      );

      if (nextParentIndex < 0) {
        return currentDraft;
      }

      let nextInsertIndex = nextParentIndex + 1;

      while (
        nextInsertIndex < remainingGroups.length &&
        remainingGroups[nextInsertIndex]?.level === 2 &&
        remainingGroups[nextInsertIndex]?.parentId === nextParentId
      ) {
        nextInsertIndex += 1;
      }

      const nextGroups = [...remainingGroups];

      nextGroups.splice(nextInsertIndex, 0, {
        ...targetGroup,
        parentId: nextParentId,
      });

      return {
        ...currentDraft,
        groups: nextGroups,
      };
    });
  };

  const moveGroup = (groupId: string, direction: 'up' | 'down') => {
    setDraft((currentDraft) => {
      const targetGroup =
        currentDraft.groups.find((group) => group.id === groupId) ?? null;

      if (targetGroup === null) {
        return currentDraft;
      }

      if (targetGroup.level === 1) {
        const rootGroupIds = getRootGroupIds(currentDraft.groups);
        const currentRootIndex = rootGroupIds.findIndex(
          (rootGroupId) => rootGroupId === groupId,
        );

        if (currentRootIndex < 0) {
          return currentDraft;
        }

        const adjacentRootIndex =
          direction === 'up' ? currentRootIndex - 1 : currentRootIndex + 1;

        if (adjacentRootIndex < 0 || adjacentRootIndex >= rootGroupIds.length) {
          return currentDraft;
        }

        const currentBounds = getRootGroupBounds(currentDraft.groups, groupId);
        const adjacentBounds = getRootGroupBounds(
          currentDraft.groups,
          rootGroupIds[adjacentRootIndex],
        );

        if (currentBounds === null || adjacentBounds === null) {
          return currentDraft;
        }

        const nextStartIndex =
          direction === 'up'
            ? adjacentBounds.startIndex
            : adjacentBounds.endIndex -
              (currentBounds.endIndex - currentBounds.startIndex + 1) +
              1;

        return {
          ...currentDraft,
          groups: moveGroupSlice(
            currentDraft.groups,
            currentBounds.startIndex,
            currentBounds.endIndex,
            nextStartIndex,
          ),
        };
      }

      const siblingGroupIds = currentDraft.groups
        .filter(
          (group) =>
            group.level === 2 && group.parentId === targetGroup.parentId,
        )
        .map((group) => group.id);
      const currentSiblingIndex = siblingGroupIds.findIndex(
        (siblingGroupId) => siblingGroupId === groupId,
      );

      if (currentSiblingIndex < 0) {
        return currentDraft;
      }

      const adjacentSiblingIndex =
        direction === 'up' ? currentSiblingIndex - 1 : currentSiblingIndex + 1;

      if (
        adjacentSiblingIndex < 0 ||
        adjacentSiblingIndex >= siblingGroupIds.length
      ) {
        return currentDraft;
      }

      const currentIndex = currentDraft.groups.findIndex(
        (group) => group.id === groupId,
      );
      const adjacentIndex = currentDraft.groups.findIndex(
        (group) => group.id === siblingGroupIds[adjacentSiblingIndex],
      );

      if (currentIndex < 0 || adjacentIndex < 0) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        groups: moveGroupSlice(
          currentDraft.groups,
          currentIndex,
          currentIndex,
          adjacentIndex,
        ),
      };
    });
  };

  const canMoveGroup = (groupId: string, direction: 'up' | 'down') => {
    const targetGroup =
      draft.groups.find((group) => group.id === groupId) ?? null;

    if (targetGroup === null) {
      return false;
    }

    if (targetGroup.level === 1) {
      const rootGroupIds = getRootGroupIds(draft.groups);
      const rootIndex = rootGroupIds.findIndex(
        (rootGroupId) => rootGroupId === groupId,
      );

      return direction === 'up'
        ? rootIndex > 0
        : rootIndex >= 0 && rootIndex < rootGroupIds.length - 1;
    }

    const siblingGroupIds = draft.groups
      .filter(
        (group) => group.level === 2 && group.parentId === targetGroup.parentId,
      )
      .map((group) => group.id);
    const siblingIndex = siblingGroupIds.findIndex(
      (siblingGroupId) => siblingGroupId === groupId,
    );

    return direction === 'up'
      ? siblingIndex > 0
      : siblingIndex >= 0 && siblingIndex < siblingGroupIds.length - 1;
  };

  const addTag = (scope: TradeCrmCustomerConfigTagScope, label: string) => {
    const normalizedLabel = label.trim();

    if (normalizedLabel.length === 0) {
      return;
    }

    setDraft((currentDraft) => {
      if (
        getNewTagValidationMessage({
          tags: currentDraft.tags,
          scope,
          label: normalizedLabel,
        }) !== null
      ) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        tags: {
          ...currentDraft.tags,
          [scope]: [...currentDraft.tags[scope], normalizedLabel],
        },
      };
    });
  };

  const removeTag = (scope: TradeCrmCustomerConfigTagScope, label: string) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      tags: {
        ...currentDraft.tags,
        [scope]: currentDraft.tags[scope].filter(
          (currentLabel) => currentLabel !== label,
        ),
      },
    }));
  };

  const renameTag = (
    scope: TradeCrmCustomerConfigTagScope,
    currentLabel: string,
    nextLabel: string,
  ) => {
    const normalizedLabel = nextLabel.trim();

    if (
      getRenameTagValidationMessage({
        tags: draft.tags,
        scope,
        currentLabel,
        nextLabel: normalizedLabel,
      }) !== null
    ) {
      return;
    }

    setDraft((currentDraft) => ({
      ...currentDraft,
      tags: {
        ...currentDraft.tags,
        [scope]: currentDraft.tags[scope].map((tagLabel) =>
          tagLabel === currentLabel ? normalizedLabel : tagLabel,
        ),
      },
    }));
  };

  const moveTag = (
    scope: TradeCrmCustomerConfigTagScope,
    label: string,
    direction: 'up' | 'down',
  ) => {
    setDraft((currentDraft) => {
      const currentIndex = currentDraft.tags[scope].findIndex(
        (tagLabel) => tagLabel === label,
      );

      if (currentIndex < 0) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        tags: {
          ...currentDraft.tags,
          [scope]: moveListItem(
            currentDraft.tags[scope],
            currentIndex,
            direction,
          ),
        },
      };
    });
  };

  const canMoveTag = (
    scope: TradeCrmCustomerConfigTagScope,
    label: string,
    direction: 'up' | 'down',
  ) => {
    const currentIndex = draft.tags[scope].findIndex(
      (tagLabel) => tagLabel === label,
    );

    return direction === 'up'
      ? currentIndex > 0
      : currentIndex >= 0 && currentIndex < draft.tags[scope].length - 1;
  };

  const addSource = (label: string) => {
    const normalizedLabel = label.trim();

    if (normalizedLabel.length === 0) {
      return;
    }

    setDraft((currentDraft) => {
      if (
        getNewSourceValidationMessage({
          sources: currentDraft.sources,
          label: normalizedLabel,
        }) !== null
      ) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        sources: [...currentDraft.sources, normalizedLabel],
      };
    });
  };

  const removeSource = (label: string) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      sources: currentDraft.sources.filter(
        (currentLabel) => currentLabel !== label,
      ),
    }));
  };

  const renameSource = (currentLabel: string, nextLabel: string) => {
    const normalizedLabel = nextLabel.trim();

    if (
      getRenameSourceValidationMessage({
        sources: draft.sources,
        currentLabel,
        nextLabel: normalizedLabel,
      }) !== null
    ) {
      return;
    }

    setDraft((currentDraft) => ({
      ...currentDraft,
      sources: currentDraft.sources.map((sourceLabel) =>
        sourceLabel === currentLabel ? normalizedLabel : sourceLabel,
      ),
    }));
  };

  const moveSource = (label: string, direction: 'up' | 'down') => {
    setDraft((currentDraft) => {
      const currentIndex = currentDraft.sources.findIndex(
        (sourceLabel) => sourceLabel === label,
      );

      if (currentIndex < 0) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        sources: moveListItem(currentDraft.sources, currentIndex, direction),
      };
    });
  };

  const canMoveSource = (label: string, direction: 'up' | 'down') => {
    const currentIndex = draft.sources.findIndex(
      (sourceLabel) => sourceLabel === label,
    );

    return direction === 'up'
      ? currentIndex > 0
      : currentIndex >= 0 && currentIndex < draft.sources.length - 1;
  };

  const getGroupPendingChangeMessage = (groupId: string) => {
    const draftGroup = draft.groups.find((group) => group.id === groupId) ?? null;

    if (draftGroup === null) {
      return null;
    }

    const savedGroup =
      savedDraft.groups.find((group) => group.id === groupId) ?? null;

    if (savedGroup === null) {
      return 'New pending save';
    }

    const pendingChanges: string[] = [];

    if (
      normalizeLabelKey(savedGroup.label) !== normalizeLabelKey(draftGroup.label)
    ) {
      pendingChanges.push('Rename pending');
    }

    if (savedGroup.parentId !== draftGroup.parentId) {
      pendingChanges.push('Parent pending');
    }

    if (savedGroup.parentId === draftGroup.parentId) {
      const savedOrderIndex = getGroupOrderIndex(savedDraft.groups, savedGroup);
      const draftOrderIndex = getGroupOrderIndex(draft.groups, draftGroup);

      if (
        savedOrderIndex >= 0 &&
        draftOrderIndex >= 0 &&
        savedOrderIndex !== draftOrderIndex
      ) {
        pendingChanges.push(
          draftGroup.level === 1 ? 'Root order pending' : 'Order pending',
        );
      }
    }

    return pendingChanges.length > 0 ? pendingChanges.join(' / ') : null;
  };

  const setMatchingWeight = (field: string, weight: number) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      matchingRules: currentDraft.matchingRules.map((rule) =>
        rule.field === field
          ? {
              ...rule,
              weight,
            }
          : rule,
      ),
    }));
  };

  const setImportDestination = (
    destination: TradeCrmCustomerConfigDraft['importConfig']['destination'],
  ) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      importConfig: {
        ...currentDraft.importConfig,
        destination,
      },
    }));
  };

  const setImportUpdateExistingContacts = (updateExistingContacts: boolean) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      importConfig: {
        ...currentDraft.importConfig,
        updateExistingContacts,
      },
    }));
  };

  const toggleImportField = (field: string) => {
    setDraft((currentDraft) => {
      const hasField = currentDraft.importConfig.selectedFields.includes(field);

      return {
        ...currentDraft,
        importConfig: {
          ...currentDraft.importConfig,
          selectedFields: hasField
            ? currentDraft.importConfig.selectedFields.filter(
                (currentField) => currentField !== field,
              )
            : [...currentDraft.importConfig.selectedFields, field],
        },
      };
    });
  };

  return {
    draft,
    hasUnsavedChanges,
    hasValidationErrors,
    isSaving,
    lastSavedAt,
    saveError,
    validationMessages,
    pendingChangedSections,
    groupValidationMessages,
    tagValidationMessages,
    sourceValidationMessages,
    configOperationHistoryItems:
      customerConfigOperationHistoryData?.customerConfigOperationHistory
        .items ?? [],
    configOperationHistoryTotalCount:
      customerConfigOperationHistoryData?.customerConfigOperationHistory
        .totalCount ?? 0,
    lastSavedConfigOperationId,
    saveDraft,
    resetDraft,
    replaceDraft,
    setPublicPoolRule,
    togglePublicPoolStage,
    addGroup,
    renameGroup,
    removeGroup,
    changeGroupParent,
    moveGroup,
    canMoveGroup,
    getNewGroupValidationMessage: (label: string, parentId: string | null) =>
      getNewGroupValidationMessage({
        groups: draft.groups,
        label,
        parentId,
      }),
    getChangeGroupParentValidationMessage: (
      groupId: string,
      nextParentId: string,
    ) =>
      getChangeGroupParentValidationMessage({
        groups: draft.groups,
        groupId,
        nextParentId,
      }),
    addTag,
    removeTag,
    renameTag,
    moveTag,
    canMoveTag,
    getNewTagValidationMessage: (
      scope: TradeCrmCustomerConfigTagScope,
      label: string,
    ) =>
      getNewTagValidationMessage({
        tags: draft.tags,
        scope,
        label,
      }),
    getRenameTagValidationMessage: (
      scope: TradeCrmCustomerConfigTagScope,
      currentLabel: string,
      nextLabel: string,
    ) =>
      getRenameTagValidationMessage({
        tags: draft.tags,
        scope,
        currentLabel,
        nextLabel,
      }),
    addSource,
    removeSource,
    renameSource,
    moveSource,
    canMoveSource,
    getGroupPendingChangeMessage,
    getNewSourceValidationMessage: (label: string) =>
      getNewSourceValidationMessage({
        sources: draft.sources,
        label,
      }),
    getRenameSourceValidationMessage: (
      currentLabel: string,
      nextLabel: string,
    ) =>
      getRenameSourceValidationMessage({
        sources: draft.sources,
        currentLabel,
        nextLabel,
      }),
    setMatchingWeight,
    setImportDestination,
    setImportUpdateExistingContacts,
    toggleImportField,
  };
};

export type { TradeCrmCustomerConfigDraft, TradeCrmCustomerConfigTagScope };
