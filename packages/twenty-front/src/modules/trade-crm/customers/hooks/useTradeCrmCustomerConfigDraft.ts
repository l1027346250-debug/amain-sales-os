import { useMemo, useState } from 'react';

import { type TradeCrmCustomerSummaryItem } from '@/trade-crm/customers/hooks/useTradeCrmCustomerWorkspaceData';

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

type TradeCrmCustomerConfigStoragePayload = {
  savedAt: string | null;
  draft: TradeCrmCustomerConfigDraft;
};

type UseTradeCrmCustomerConfigDraftOptions = {
  customerStageSummary: TradeCrmCustomerSummaryItem[];
  customerGroupSummary: TradeCrmCustomerSummaryItem[];
  customerTagSummary: TradeCrmCustomerSummaryItem[];
  customerSourceSummary: TradeCrmCustomerSummaryItem[];
  publicPoolGroupLabels: string[];
};

const STORAGE_KEY = 'trade-crm-customer-config-draft-v1';

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

const readStoredDraft = (
  options: UseTradeCrmCustomerConfigDraftOptions,
): TradeCrmCustomerConfigStoragePayload => {
  const defaultDraft = buildDefaultDraft(options);

  if (typeof window === 'undefined') {
    return {
      savedAt: null,
      draft: defaultDraft,
    };
  }

  const rawPayload = window.localStorage.getItem(STORAGE_KEY);

  if (!rawPayload) {
    return {
      savedAt: null,
      draft: defaultDraft,
    };
  }

  try {
    const parsedPayload = JSON.parse(rawPayload) as Partial<TradeCrmCustomerConfigStoragePayload>;

    if (!parsedPayload.draft) {
      return {
        savedAt: null,
        draft: defaultDraft,
      };
    }

    return {
      savedAt:
        typeof parsedPayload.savedAt === 'string' ? parsedPayload.savedAt : null,
      draft: parsedPayload.draft as TradeCrmCustomerConfigDraft,
    };
  } catch {
    return {
      savedAt: null,
      draft: defaultDraft,
    };
  }
};

const persistDraft = (payload: TradeCrmCustomerConfigStoragePayload) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export const useTradeCrmCustomerConfigDraft = (
  options: UseTradeCrmCustomerConfigDraftOptions,
) => {
  const initialState = useMemo(() => readStoredDraft(options), [options]);
  const [savedDraft, setSavedDraft] = useState(initialState.draft);
  const [draft, setDraft] = useState(initialState.draft);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialState.savedAt);

  const hasUnsavedChanges =
    JSON.stringify(draft) !== JSON.stringify(savedDraft);

  const saveDraft = () => {
    const savedAt = new Date().toISOString();
    const nextPayload = {
      savedAt,
      draft,
    };

    persistDraft(nextPayload);
    setSavedDraft(draft);
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
