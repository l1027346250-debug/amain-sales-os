import { useEffect, useMemo, useRef, useState } from 'react';

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
    const leftOrder = normalizeNumber(left[fieldName]) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = normalizeNumber(right[fieldName]) ?? Number.MAX_SAFE_INTEGER;

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

  const tags = tagRecords.reduce<Record<TradeCrmCustomerConfigTagScope, string[]>>(
    (accumulator, tagRecord) => {
      const scope =
        CUSTOMER_TAG_SCOPE_BY_VALUE[normalizeString(tagRecord.tagScope) ?? ''] ??
        null;
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

  const publicPoolRule = latestPublicPoolRuleRecord
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

  const importConfig = latestImportDefaultsRecord
    ? {
        destination:
          CUSTOMER_IMPORT_DESTINATION_BY_VALUE[
            normalizeString(latestImportDefaultsRecord.destination) ?? ''
          ] ?? fallbackDraft.importConfig.destination,
        updateExistingContacts:
          normalizeBoolean(latestImportDefaultsRecord.updateExistingContacts) ??
          fallbackDraft.importConfig.updateExistingContacts,
        selectedFields:
          normalizeStringArray(latestImportDefaultsRecord.selectedFields).length > 0
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

const dedupeLabels = (labels: string[]) => [...new Set(labels)];

export const useTradeCrmCustomerConfigDraft = (
  options: UseTradeCrmCustomerConfigDraftOptions,
) => {
  const fallbackDraft = useMemo(() => buildDefaultDraft(options), [options]);

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

  const hydratedDraft = useMemo(
    () =>
      buildDraftFromRecords({
        fallbackDraft,
        groupRecords: customerGroupRecords,
        tagRecords: sortByOptionalNumber(customerTagRecords, 'sortOrder'),
        sourceRecords: customerSourceRecords,
        publicPoolRuleRecords: customerPublicPoolRuleRecords,
        matchingRuleRecords: customerMatchingRuleRecords,
        importDefaultRecords: customerImportDefaultRecords,
      }),
    [
      customerGroupRecords,
      customerImportDefaultRecords,
      customerMatchingRuleRecords,
      customerPublicPoolRuleRecords,
      customerSourceRecords,
      customerTagRecords,
      fallbackDraft,
    ],
  );

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

  const hasUnsavedChanges =
    JSON.stringify(draft) !== JSON.stringify(savedDraft);
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (hasUnsavedChangesRef.current) {
      return;
    }

    setSavedDraft(hydratedDraft);
    setDraft(hydratedDraft);
    setLastSavedAt(hydratedLastSavedAt);
  }, [hydratedDraft, hydratedDraftKey, hydratedLastSavedAt]);

  const saveDraft = async () => {
    for (const customerGroupRecord of customerGroupRecords) {
      await deleteCustomerGroup(customerGroupRecord.id);
    }

    const persistedGroupsByLocalId = new Map<string, TradeCrmCustomerConfigGroupItem>();
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
        (group.parentId ? persistedGroupIdByLocalId.get(group.parentId) : null) ??
        null;
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

    for (const scope of Object.keys(draft.tags) as TradeCrmCustomerConfigTagScope[]) {
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
        .map((stageLabel) => getTradeCrmCustomerStageValueForLabel(stageLabel))
        .filter((stageValue): stageValue is string => typeof stageValue === 'string'),
      publicPoolGroup:
        getTradeCrmPublicPoolGroupValueForLabel(
          draft.publicPoolRule.publicPoolGroup,
        ) ?? 'GENERAL_PUBLIC_POOL',
      isEnabled: true,
    };

    if (latestPublicPoolRuleRecord) {
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

    if (latestImportDefaultsRecord) {
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

    setSavedDraft(nextSavedDraft);
    setDraft(nextSavedDraft);
    setLastSavedAt(savedAt);
  };

  const resetDraft = () => {
    setDraft(savedDraft);
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
      const hasStage = currentDraft.publicPoolRule.scopeStages.includes(stageLabel);

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

    setDraft((currentDraft) => ({
      ...currentDraft,
      groups: [
        ...currentDraft.groups,
        {
          id: `group-${Date.now()}-${currentDraft.groups.length + 1}`,
          label: normalizedLabel,
          level: parentId ? 2 : 1,
          parentId,
        },
      ],
    }));
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

  const moveGroup = (groupId: string, direction: 'up' | 'down') => {
    setDraft((currentDraft) => {
      const groupIndex = currentDraft.groups.findIndex((group) => group.id === groupId);

      if (groupIndex < 0) {
        return currentDraft;
      }

      const nextIndex = direction === 'up' ? groupIndex - 1 : groupIndex + 1;

      if (nextIndex < 0 || nextIndex >= currentDraft.groups.length) {
        return currentDraft;
      }

      const reorderedGroups = [...currentDraft.groups];
      const [groupItem] = reorderedGroups.splice(groupIndex, 1);

      reorderedGroups.splice(nextIndex, 0, groupItem);

      return {
        ...currentDraft,
        groups: reorderedGroups,
      };
    });
  };

  const addTag = (scope: TradeCrmCustomerConfigTagScope, label: string) => {
    const normalizedLabel = label.trim();

    if (normalizedLabel.length === 0) {
      return;
    }

    setDraft((currentDraft) => {
      if (currentDraft.tags[scope].includes(normalizedLabel)) {
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

  const addSource = (label: string) => {
    const normalizedLabel = label.trim();

    if (normalizedLabel.length === 0) {
      return;
    }

    setDraft((currentDraft) => {
      if (currentDraft.sources.includes(normalizedLabel)) {
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
      sources: currentDraft.sources.filter((currentLabel) => currentLabel !== label),
    }));
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
    lastSavedAt,
    saveDraft,
    resetDraft,
    setPublicPoolRule,
    togglePublicPoolStage,
    addGroup,
    renameGroup,
    moveGroup,
    addTag,
    removeTag,
    addSource,
    removeSource,
    setMatchingWeight,
    setImportDestination,
    setImportUpdateExistingContacts,
    toggleImportField,
  };
};

export type { TradeCrmCustomerConfigDraft, TradeCrmCustomerConfigTagScope };
