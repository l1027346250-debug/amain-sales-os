import { type TradeCrmCustomerConfigDraft } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigDraft';

export const CUSTOMER_CONFIG_SNAPSHOT_TYPE = 'customer-config';

export const CUSTOMER_CONFIG_SNAPSHOT_VERSION = 1;

export type CustomerConfigSnapshotConfigSummary = {
  groupCount: number;
  importFieldCount: number;
  matchingRuleCount: number;
  publicPoolScopeStageCount: number;
  sourceCount: number;
  tagCount: number;
};

export type CustomerConfigSnapshotSectionKey =
  keyof TradeCrmCustomerConfigDraft;

export type CustomerConfigSnapshotSectionDiff = {
  key: CustomerConfigSnapshotSectionKey;
  label: string;
  summary: string;
};

export type CustomerConfigSnapshotMetadata = {
  activeSection: string | null;
  compatibilityMessage: string;
  compatibilityStatus: 'verified' | 'legacy' | 'incompatible';
  exportedAt: string | null;
  hasUnsavedChanges: boolean | null;
  lastSavedAt: string | null;
  snapshotType: string | null;
  snapshotVersion: number | null;
  validationMessageCount: number;
};

export type CustomerConfigSnapshotPreview = {
  configSummary: CustomerConfigSnapshotConfigSummary | null;
  currentDraftDiffSections: CustomerConfigSnapshotSectionDiff[];
  currentDraftDiffSummaries: string[];
  error: string | null;
  impactWarnings: string[];
  pendingSectionSummaries: string[];
  sectionCount: number;
  snapshotConfigDraft: TradeCrmCustomerConfigDraft | null;
  snapshotMetadata: CustomerConfigSnapshotMetadata | null;
  validationMessages: string[];
};

export type CustomerConfigSnapshotApplyNotice = {
  appliedAt: string;
  impactWarningCount: number;
  mode: 'full' | 'selected' | 'single';
  sectionLabels: string[];
  warningsAcknowledged: boolean;
};

type CustomerConfigSnapshotExportDraft = {
  draft: TradeCrmCustomerConfigDraft;
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;
  pendingChangedSections: Array<{ key: string; summary: string }>;
  validationMessages: string[];
};

export const CUSTOMER_CONFIG_SNAPSHOT_DIFF_SECTIONS: Array<{
  key: CustomerConfigSnapshotSectionKey;
  label: string;
}> = [
  { key: 'publicPoolRule', label: 'Public Pool Rules' },
  { key: 'groups', label: 'Groups' },
  { key: 'tags', label: 'Tags' },
  { key: 'sources', label: 'Sources' },
  { key: 'matchingRules', label: 'Matching Rules' },
  { key: 'importConfig', label: 'Import Defaults' },
];

export const getCustomerConfigSnapshotSectionLabel = (
  sectionKey: CustomerConfigSnapshotSectionKey,
) =>
  CUSTOMER_CONFIG_SNAPSHOT_DIFF_SECTIONS.find(
    (section) => section.key === sectionKey,
  )?.label ?? sectionKey;

export const getCustomerConfigSnapshotConfigSummary = (
  config: TradeCrmCustomerConfigDraft,
): CustomerConfigSnapshotConfigSummary => ({
  groupCount: config.groups.length,
  importFieldCount: config.importConfig.selectedFields.length,
  matchingRuleCount: config.matchingRules.length,
  publicPoolScopeStageCount: config.publicPoolRule.scopeStages.length,
  sourceCount: config.sources.length,
  tagCount:
    config.tags.company.length +
    config.tags.mine.length +
    config.tags.subordinate.length,
});

export const getCustomerConfigSnapshotImpactWarnings = ({
  currentConfig,
  snapshotConfig,
}: {
  currentConfig: TradeCrmCustomerConfigDraft;
  snapshotConfig: TradeCrmCustomerConfigDraft;
}) => {
  const currentSummary = getCustomerConfigSnapshotConfigSummary(currentConfig);
  const snapshotSummary = getCustomerConfigSnapshotConfigSummary(snapshotConfig);
  const warnings: string[] = [];

  if (snapshotSummary.groupCount < currentSummary.groupCount) {
    warnings.push(
      `Snapshot has fewer groups (${snapshotSummary.groupCount}) than the current draft (${currentSummary.groupCount}).`,
    );
  }

  if (snapshotSummary.tagCount < currentSummary.tagCount) {
    warnings.push(
      `Snapshot has fewer tags (${snapshotSummary.tagCount}) than the current draft (${currentSummary.tagCount}).`,
    );
  }

  if (snapshotSummary.sourceCount < currentSummary.sourceCount) {
    warnings.push(
      `Snapshot has fewer sources (${snapshotSummary.sourceCount}) than the current draft (${currentSummary.sourceCount}).`,
    );
  }

  if (snapshotSummary.matchingRuleCount < currentSummary.matchingRuleCount) {
    warnings.push(
      `Snapshot has fewer matching rules (${snapshotSummary.matchingRuleCount}) than the current draft (${currentSummary.matchingRuleCount}).`,
    );
  }

  if (snapshotSummary.importFieldCount < currentSummary.importFieldCount) {
    warnings.push(
      `Snapshot has fewer default import fields (${snapshotSummary.importFieldCount}) than the current draft (${currentSummary.importFieldCount}).`,
    );
  }

  if (
    snapshotSummary.publicPoolScopeStageCount <
    currentSummary.publicPoolScopeStageCount
  ) {
    warnings.push(
      `Snapshot public-pool rule covers fewer stages (${snapshotSummary.publicPoolScopeStageCount}) than the current draft (${currentSummary.publicPoolScopeStageCount}).`,
    );
  }

  if (
    snapshotConfig.importConfig.destination !==
    currentConfig.importConfig.destination
  ) {
    warnings.push(
      `Snapshot import destination is ${snapshotConfig.importConfig.destination}, current draft is ${currentConfig.importConfig.destination}.`,
    );
  }

  return warnings;
};

export const buildCustomerConfigSnapshotExport = ({
  activeSection,
  configDraft,
  exportedAt,
}: {
  activeSection: string;
  configDraft: CustomerConfigSnapshotExportDraft;
  exportedAt: string;
}) => ({
  activeSection,
  config: configDraft.draft,
  configSummary: getCustomerConfigSnapshotConfigSummary(configDraft.draft),
  exportedAt,
  hasUnsavedChanges: configDraft.hasUnsavedChanges,
  lastSavedAt: configDraft.lastSavedAt,
  pendingChangedSections: configDraft.pendingChangedSections,
  snapshotType: CUSTOMER_CONFIG_SNAPSHOT_TYPE,
  snapshotVersion: CUSTOMER_CONFIG_SNAPSHOT_VERSION,
  validationMessages: configDraft.validationMessages,
});

export const buildCustomerConfigSnapshotPreviewReport = ({
  applyNotice,
  exportedAt,
  selectedSectionKeys,
  snapshotPreview,
  warningsAcknowledged,
}: {
  applyNotice: CustomerConfigSnapshotApplyNotice | null;
  exportedAt: string;
  selectedSectionKeys: CustomerConfigSnapshotSectionKey[];
  snapshotPreview: CustomerConfigSnapshotPreview;
  warningsAcknowledged: boolean;
}) => {
  const selectedSectionKeySet = new Set(selectedSectionKeys);
  const hasImpactWarnings = snapshotPreview.impactWarnings.length > 0;

  return {
    canApply:
      snapshotPreview.error === null &&
      snapshotPreview.snapshotConfigDraft !== null &&
      (!hasImpactWarnings || warningsAcknowledged),
    latestApplyNotice: applyNotice,
    configSummary: snapshotPreview.configSummary,
    currentDraftDiffSections: snapshotPreview.currentDraftDiffSections.map(
      (section) => ({
        isSelectedForApply: selectedSectionKeySet.has(section.key),
        key: section.key,
        label: section.label,
        summary: section.summary,
      }),
    ),
    error: snapshotPreview.error,
    exportedAt,
    impactWarnings: snapshotPreview.impactWarnings,
    pendingSectionSummaries: snapshotPreview.pendingSectionSummaries,
    selectedSectionKeys,
    selectedSections: snapshotPreview.currentDraftDiffSections
      .filter((section) => selectedSectionKeySet.has(section.key))
      .map((section) => ({
        key: section.key,
        label: section.label,
      })),
    snapshotMetadata: snapshotPreview.snapshotMetadata,
    validationMessages: snapshotPreview.validationMessages,
    warningsAcknowledged,
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown) =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const validateCustomerConfigSnapshotConfig = (config: unknown) => {
  const validationMessages: string[] = [];

  if (!isRecord(config)) {
    return ['Snapshot config must be an object.'];
  }

  const publicPoolRule = config.publicPoolRule;

  if (!isRecord(publicPoolRule)) {
    validationMessages.push('Missing publicPoolRule object.');
  } else {
    if (typeof publicPoolRule.ruleName !== 'string') {
      validationMessages.push('publicPoolRule.ruleName must be a string.');
    }

    if (typeof publicPoolRule.inactivityDays !== 'number') {
      validationMessages.push(
        'publicPoolRule.inactivityDays must be a number.',
      );
    }

    if (typeof publicPoolRule.notifyOwnersFirst !== 'boolean') {
      validationMessages.push(
        'publicPoolRule.notifyOwnersFirst must be a boolean.',
      );
    }

    if (!isStringArray(publicPoolRule.scopeStages)) {
      validationMessages.push('publicPoolRule.scopeStages must be string[].');
    }

    if (typeof publicPoolRule.publicPoolGroup !== 'string') {
      validationMessages.push(
        'publicPoolRule.publicPoolGroup must be a string.',
      );
    }
  }

  if (!Array.isArray(config.groups)) {
    validationMessages.push('groups must be an array.');
  } else {
    for (const [index, group] of config.groups.entries()) {
      if (!isRecord(group)) {
        validationMessages.push(`groups[${index}] must be an object.`);
        continue;
      }

      if (typeof group.id !== 'string') {
        validationMessages.push(`groups[${index}].id must be a string.`);
      }

      if (typeof group.label !== 'string') {
        validationMessages.push(`groups[${index}].label must be a string.`);
      }

      if (group.level !== 1 && group.level !== 2) {
        validationMessages.push(`groups[${index}].level must be 1 or 2.`);
      }

      if (group.parentId !== null && typeof group.parentId !== 'string') {
        validationMessages.push(
          `groups[${index}].parentId must be string or null.`,
        );
      }
    }
  }

  const tags = config.tags;

  if (!isRecord(tags)) {
    validationMessages.push('tags must be an object.');
  } else {
    for (const scope of ['company', 'mine', 'subordinate']) {
      if (!isStringArray(tags[scope])) {
        validationMessages.push(`tags.${scope} must be string[].`);
      }
    }
  }

  if (!isStringArray(config.sources)) {
    validationMessages.push('sources must be string[].');
  }

  if (!Array.isArray(config.matchingRules)) {
    validationMessages.push('matchingRules must be an array.');
  } else {
    for (const [index, rule] of config.matchingRules.entries()) {
      if (!isRecord(rule)) {
        validationMessages.push(`matchingRules[${index}] must be an object.`);
        continue;
      }

      if (typeof rule.field !== 'string') {
        validationMessages.push(
          `matchingRules[${index}].field must be a string.`,
        );
      }

      if (typeof rule.weight !== 'number') {
        validationMessages.push(
          `matchingRules[${index}].weight must be a number.`,
        );
      }
    }
  }

  const importConfig = config.importConfig;

  if (!isRecord(importConfig)) {
    validationMessages.push('importConfig must be an object.');
  } else {
    if (
      importConfig.destination !== 'customer-list' &&
      importConfig.destination !== 'public-pool'
    ) {
      validationMessages.push(
        'importConfig.destination must be customer-list or public-pool.',
      );
    }

    if (typeof importConfig.updateExistingContacts !== 'boolean') {
      validationMessages.push(
        'importConfig.updateExistingContacts must be a boolean.',
      );
    }

    if (!isStringArray(importConfig.selectedFields)) {
      validationMessages.push('importConfig.selectedFields must be string[].');
    }
  }

  return validationMessages;
};

const getCustomerConfigSnapshotMetadata = (
  parsedSnapshot: Record<string, unknown>,
): CustomerConfigSnapshotMetadata => {
  const snapshotType =
    typeof parsedSnapshot.snapshotType === 'string'
      ? parsedSnapshot.snapshotType
      : null;
  const snapshotVersion =
    typeof parsedSnapshot.snapshotVersion === 'number'
      ? parsedSnapshot.snapshotVersion
      : null;
  const hasSnapshotIdentity =
    snapshotType !== null || snapshotVersion !== null;
  const isVerifiedSnapshot =
    snapshotType === CUSTOMER_CONFIG_SNAPSHOT_TYPE &&
    snapshotVersion === CUSTOMER_CONFIG_SNAPSHOT_VERSION;
  const compatibilityStatus = isVerifiedSnapshot
    ? 'verified'
    : hasSnapshotIdentity
      ? 'incompatible'
      : 'legacy';

  return {
    activeSection:
      typeof parsedSnapshot.activeSection === 'string'
        ? parsedSnapshot.activeSection
        : null,
    compatibilityMessage:
      compatibilityStatus === 'verified'
        ? 'Verified customer configuration snapshot.'
        : compatibilityStatus === 'legacy'
          ? 'Legacy snapshot without type/version metadata.'
          : 'Snapshot type or version is not compatible with customer configuration import.',
    compatibilityStatus,
    exportedAt:
      typeof parsedSnapshot.exportedAt === 'string'
        ? parsedSnapshot.exportedAt
        : null,
    hasUnsavedChanges:
      typeof parsedSnapshot.hasUnsavedChanges === 'boolean'
        ? parsedSnapshot.hasUnsavedChanges
        : null,
    lastSavedAt:
      typeof parsedSnapshot.lastSavedAt === 'string'
        ? parsedSnapshot.lastSavedAt
        : null,
    snapshotType,
    snapshotVersion,
    validationMessageCount: Array.isArray(parsedSnapshot.validationMessages)
      ? parsedSnapshot.validationMessages.length
      : 0,
  };
};

const getCustomerConfigSnapshotDiffSections = ({
  snapshotConfig,
  currentConfig,
}: {
  snapshotConfig: unknown;
  currentConfig: TradeCrmCustomerConfigDraft;
}): CustomerConfigSnapshotSectionDiff[] => {
  if (!isRecord(snapshotConfig)) {
    return [];
  }

  return CUSTOMER_CONFIG_SNAPSHOT_DIFF_SECTIONS.filter(
    (section) =>
      JSON.stringify(snapshotConfig[section.key]) !==
      JSON.stringify(currentConfig[section.key]),
  ).map((section) => ({
    ...section,
    summary: `${section.label} differ from current draft.`,
  }));
};

const buildCustomerConfigDraftFromSnapshotConfig = (
  snapshotConfig: unknown,
): TradeCrmCustomerConfigDraft | null => {
  if (
    validateCustomerConfigSnapshotConfig(snapshotConfig).length > 0 ||
    !isRecord(snapshotConfig)
  ) {
    return null;
  }

  const publicPoolRule = snapshotConfig.publicPoolRule;
  const tags = snapshotConfig.tags;
  const importConfig = snapshotConfig.importConfig;

  if (!isRecord(publicPoolRule) || !isRecord(tags) || !isRecord(importConfig)) {
    return null;
  }

  return {
    publicPoolRule: {
      inactivityDays: publicPoolRule.inactivityDays as number,
      notifyOwnersFirst: publicPoolRule.notifyOwnersFirst as boolean,
      publicPoolGroup: publicPoolRule.publicPoolGroup as string,
      ruleName: publicPoolRule.ruleName as string,
      scopeStages: publicPoolRule.scopeStages as string[],
    },
    groups: (snapshotConfig.groups as TradeCrmCustomerConfigDraft['groups']).map(
      (group) => ({
        id: group.id,
        label: group.label,
        level: group.level,
        parentId: group.parentId,
      }),
    ),
    importConfig: {
      destination: importConfig.destination as 'customer-list' | 'public-pool',
      selectedFields: importConfig.selectedFields as string[],
      updateExistingContacts: importConfig.updateExistingContacts as boolean,
    },
    matchingRules: (
      snapshotConfig.matchingRules as TradeCrmCustomerConfigDraft['matchingRules']
    ).map((rule) => ({
      field: rule.field,
      weight: rule.weight,
    })),
    sources: snapshotConfig.sources as string[],
    tags: {
      company: tags.company as string[],
      mine: tags.mine as string[],
      subordinate: tags.subordinate as string[],
    },
  };
};

export const buildCustomerConfigDraftWithSnapshotSections = ({
  currentConfig,
  sectionKeys,
  snapshotConfig,
}: {
  currentConfig: TradeCrmCustomerConfigDraft;
  sectionKeys: CustomerConfigSnapshotSectionKey[];
  snapshotConfig: TradeCrmCustomerConfigDraft;
}): TradeCrmCustomerConfigDraft => {
  const selectedSectionKeys = new Set(sectionKeys);
  let nextConfig = { ...currentConfig };

  if (selectedSectionKeys.has('publicPoolRule')) {
    nextConfig = {
      ...nextConfig,
      publicPoolRule: {
        ...snapshotConfig.publicPoolRule,
        scopeStages: [...snapshotConfig.publicPoolRule.scopeStages],
      },
    };
  }

  if (selectedSectionKeys.has('groups')) {
    nextConfig = {
      ...nextConfig,
      groups: snapshotConfig.groups.map((group) => ({ ...group })),
    };
  }

  if (selectedSectionKeys.has('tags')) {
    nextConfig = {
      ...nextConfig,
      tags: {
        company: [...snapshotConfig.tags.company],
        mine: [...snapshotConfig.tags.mine],
        subordinate: [...snapshotConfig.tags.subordinate],
      },
    };
  }

  if (selectedSectionKeys.has('sources')) {
    nextConfig = {
      ...nextConfig,
      sources: [...snapshotConfig.sources],
    };
  }

  if (selectedSectionKeys.has('matchingRules')) {
    nextConfig = {
      ...nextConfig,
      matchingRules: snapshotConfig.matchingRules.map((rule) => ({ ...rule })),
    };
  }

  if (selectedSectionKeys.has('importConfig')) {
    nextConfig = {
      ...nextConfig,
      importConfig: {
        ...snapshotConfig.importConfig,
        selectedFields: [...snapshotConfig.importConfig.selectedFields],
      },
    };
  }

  return nextConfig;
};

export const previewCustomerConfigSnapshot = ({
  snapshotJsonInput,
  currentConfig,
}: {
  snapshotJsonInput: string;
  currentConfig: TradeCrmCustomerConfigDraft;
}): CustomerConfigSnapshotPreview => {
  try {
    const parsedSnapshot = JSON.parse(snapshotJsonInput) as unknown;

    if (!isRecord(parsedSnapshot) || !('config' in parsedSnapshot)) {
      return {
        error: 'Snapshot JSON must contain a config object.',
        configSummary: null,
        currentDraftDiffSections: [],
        currentDraftDiffSummaries: [],
        impactWarnings: [],
        pendingSectionSummaries: [],
        sectionCount: 0,
        snapshotConfigDraft: null,
        snapshotMetadata: isRecord(parsedSnapshot)
          ? getCustomerConfigSnapshotMetadata(parsedSnapshot)
          : null,
        validationMessages: [],
      };
    }

    const snapshotMetadata = getCustomerConfigSnapshotMetadata(parsedSnapshot);

    const configValidationMessages = validateCustomerConfigSnapshotConfig(
      parsedSnapshot.config,
    );
    const isSnapshotCompatible =
      snapshotMetadata.compatibilityStatus !== 'incompatible';
    const currentDraftDiffSections =
      configValidationMessages.length === 0 && isSnapshotCompatible
        ? getCustomerConfigSnapshotDiffSections({
            snapshotConfig: parsedSnapshot.config,
            currentConfig,
          })
        : [];
    const snapshotConfigDraft =
      configValidationMessages.length === 0 && isSnapshotCompatible
        ? buildCustomerConfigDraftFromSnapshotConfig(parsedSnapshot.config)
        : null;
    const configSummary =
      snapshotConfigDraft !== null
        ? getCustomerConfigSnapshotConfigSummary(snapshotConfigDraft)
        : null;
    const impactWarnings =
      snapshotConfigDraft !== null
        ? getCustomerConfigSnapshotImpactWarnings({
            currentConfig,
            snapshotConfig: snapshotConfigDraft,
          })
        : [];

    const pendingChangedSections =
      'pendingChangedSections' in parsedSnapshot &&
      Array.isArray(parsedSnapshot.pendingChangedSections)
        ? parsedSnapshot.pendingChangedSections
            .map((section) => {
              if (
                typeof section !== 'object' ||
                section === null ||
                !('summary' in section) ||
                typeof section.summary !== 'string'
              ) {
                return null;
              }

              return section.summary;
            })
            .filter((summary): summary is string => summary !== null)
        : [];
    const previewError = !isSnapshotCompatible
      ? 'Snapshot metadata is incompatible.'
      : configValidationMessages.length > 0
        ? 'Snapshot config structure is invalid.'
        : null;

    return {
      error: previewError,
      configSummary,
      currentDraftDiffSections,
      currentDraftDiffSummaries: currentDraftDiffSections.map(
        (section) => section.summary,
      ),
      impactWarnings,
      pendingSectionSummaries: pendingChangedSections,
      sectionCount: pendingChangedSections.length,
      snapshotConfigDraft,
      snapshotMetadata,
      validationMessages: configValidationMessages,
    };
  } catch {
    return {
      error: 'Snapshot JSON is invalid and could not be parsed.',
      configSummary: null,
      currentDraftDiffSections: [],
      currentDraftDiffSummaries: [],
      impactWarnings: [],
      pendingSectionSummaries: [],
      sectionCount: 0,
      snapshotConfigDraft: null,
      snapshotMetadata: null,
      validationMessages: [],
    };
  }
};

export const canApplyCustomerConfigSnapshotPreview = ({
  snapshotPreview,
  warningsAcknowledged,
}: {
  snapshotPreview: CustomerConfigSnapshotPreview | null;
  warningsAcknowledged: boolean;
}) =>
  snapshotPreview !== null &&
  snapshotPreview.error === null &&
  snapshotPreview.snapshotConfigDraft !== null &&
  (snapshotPreview.impactWarnings.length === 0 || warningsAcknowledged);
