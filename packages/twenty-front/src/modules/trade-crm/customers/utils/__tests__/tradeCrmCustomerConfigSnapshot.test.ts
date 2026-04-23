import { type TradeCrmCustomerConfigDraft } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigDraft';
import {
  buildCustomerConfigDraftWithSnapshotSections,
  buildCustomerConfigSnapshotExport,
  buildCustomerConfigSnapshotPreviewReport,
  canApplyCustomerConfigSnapshotPreview,
  CUSTOMER_CONFIG_SNAPSHOT_TYPE,
  CUSTOMER_CONFIG_SNAPSHOT_VERSION,
  getCustomerConfigSnapshotConfigSummary,
  previewCustomerConfigSnapshot,
} from '@/trade-crm/customers/utils/tradeCrmCustomerConfigSnapshot';

const buildCustomerConfigDraft = (
  overrides: Partial<TradeCrmCustomerConfigDraft> = {},
): TradeCrmCustomerConfigDraft => ({
  publicPoolRule: {
    inactivityDays: 90,
    notifyOwnersFirst: true,
    publicPoolGroup: 'Recovery Pool',
    ruleName: 'Move inactive customers',
    scopeStages: ['Potential', 'Active'],
  },
  groups: [
    {
      id: 'root-strategic',
      label: 'Strategic Accounts',
      level: 1,
      parentId: null,
    },
    {
      id: 'child-vip',
      label: 'VIP',
      level: 2,
      parentId: 'root-strategic',
    },
  ],
  importConfig: {
    destination: 'customer-list',
    selectedFields: ['Company Name', 'Contact Email', 'Phone'],
    updateExistingContacts: true,
  },
  matchingRules: [
    {
      field: 'companyName',
      weight: 60,
    },
    {
      field: 'email',
      weight: 40,
    },
  ],
  sources: ['Website', 'Trade Show'],
  tags: {
    company: ['Key Account'],
    mine: ['Follow Weekly'],
    subordinate: ['Team Watch'],
  },
  ...overrides,
});

const buildSnapshotJson = ({
  currentDraft,
  snapshotDraft,
}: {
  currentDraft?: TradeCrmCustomerConfigDraft;
  snapshotDraft?: TradeCrmCustomerConfigDraft;
} = {}) =>
  JSON.stringify(
    buildCustomerConfigSnapshotExport({
      activeSection: 'import',
      configDraft: {
        draft: snapshotDraft ?? currentDraft ?? buildCustomerConfigDraft(),
        hasUnsavedChanges: false,
        lastSavedAt: '2026-04-23T09:30:00.000Z',
        pendingChangedSections: [],
        validationMessages: [],
      },
      exportedAt: '2026-04-23T10:00:00.000Z',
    }),
  );

describe('tradeCrmCustomerConfigSnapshot', () => {
  it('builds customer config snapshot export metadata and summary', () => {
    const draft = buildCustomerConfigDraft();

    const snapshot = buildCustomerConfigSnapshotExport({
      activeSection: 'groups',
      configDraft: {
        draft,
        hasUnsavedChanges: true,
        lastSavedAt: '2026-04-23T09:30:00.000Z',
        pendingChangedSections: [{ key: 'groups', summary: 'Groups changed' }],
        validationMessages: ['Review group labels'],
      },
      exportedAt: '2026-04-23T10:00:00.000Z',
    });

    expect(snapshot).toMatchObject({
      activeSection: 'groups',
      configSummary: {
        groupCount: 2,
        importFieldCount: 3,
        matchingRuleCount: 2,
        publicPoolScopeStageCount: 2,
        sourceCount: 2,
        tagCount: 3,
      },
      hasUnsavedChanges: true,
      snapshotType: CUSTOMER_CONFIG_SNAPSHOT_TYPE,
      snapshotVersion: CUSTOMER_CONFIG_SNAPSHOT_VERSION,
    });
  });

  it('previews verified snapshots with diffs and impact warnings', () => {
    const currentDraft = buildCustomerConfigDraft();
    const snapshotDraft = buildCustomerConfigDraft({
      groups: [
        {
          id: 'root-growth',
          label: 'Growth Accounts',
          level: 1,
          parentId: null,
        },
      ],
      importConfig: {
        destination: 'public-pool',
        selectedFields: ['Company Name'],
        updateExistingContacts: false,
      },
      matchingRules: [
        {
          field: 'companyName',
          weight: 80,
        },
      ],
      publicPoolRule: {
        inactivityDays: 30,
        notifyOwnersFirst: false,
        publicPoolGroup: 'General Pool',
        ruleName: 'Fast recycle',
        scopeStages: ['Potential'],
      },
      sources: ['Website'],
      tags: {
        company: [],
        mine: [],
        subordinate: [],
      },
    });

    const preview = previewCustomerConfigSnapshot({
      currentConfig: currentDraft,
      snapshotJsonInput: buildSnapshotJson({ currentDraft, snapshotDraft }),
    });

    expect(preview.error).toBeNull();
    expect(preview.snapshotConfigDraft).not.toBeNull();
    expect(preview.snapshotMetadata?.compatibilityStatus).toBe('verified');
    expect(preview.configSummary).toEqual(
      getCustomerConfigSnapshotConfigSummary(snapshotDraft),
    );
    expect(preview.currentDraftDiffSections.map((section) => section.key)).toEqual(
      [
        'publicPoolRule',
        'groups',
        'tags',
        'sources',
        'matchingRules',
        'importConfig',
      ],
    );
    expect(preview.impactWarnings).toEqual(
      expect.arrayContaining([
        'Snapshot has fewer groups (1) than the current draft (2).',
        'Snapshot has fewer default import fields (1) than the current draft (3).',
        'Snapshot import destination is public-pool, current draft is customer-list.',
      ]),
    );
    expect(
      canApplyCustomerConfigSnapshotPreview({
        snapshotPreview: preview,
        warningsAcknowledged: false,
      }),
    ).toBe(false);
    expect(
      canApplyCustomerConfigSnapshotPreview({
        snapshotPreview: preview,
        warningsAcknowledged: true,
      }),
    ).toBe(true);
  });

  it('allows legacy snapshots but blocks incompatible typed snapshots', () => {
    const currentDraft = buildCustomerConfigDraft();
    const legacyPreview = previewCustomerConfigSnapshot({
      currentConfig: currentDraft,
      snapshotJsonInput: JSON.stringify({
        config: currentDraft,
      }),
    });
    const incompatiblePreview = previewCustomerConfigSnapshot({
      currentConfig: currentDraft,
      snapshotJsonInput: JSON.stringify({
        config: currentDraft,
        snapshotType: 'other-config',
        snapshotVersion: CUSTOMER_CONFIG_SNAPSHOT_VERSION,
      }),
    });

    expect(legacyPreview.error).toBeNull();
    expect(legacyPreview.snapshotMetadata?.compatibilityStatus).toBe('legacy');
    expect(
      canApplyCustomerConfigSnapshotPreview({
        snapshotPreview: legacyPreview,
        warningsAcknowledged: true,
      }),
    ).toBe(true);
    expect(incompatiblePreview.error).toBe(
      'Snapshot metadata is incompatible.',
    );
    expect(incompatiblePreview.snapshotConfigDraft).toBeNull();
    expect(incompatiblePreview.snapshotMetadata?.compatibilityStatus).toBe(
      'incompatible',
    );
  });

  it('applies only selected snapshot sections to the current draft', () => {
    const currentDraft = buildCustomerConfigDraft();
    const snapshotDraft = buildCustomerConfigDraft({
      groups: [
        {
          id: 'root-new',
          label: 'New Group',
          level: 1,
          parentId: null,
        },
      ],
      sources: ['Partner'],
      tags: {
        company: ['Imported'],
        mine: [],
        subordinate: [],
      },
    });

    const nextDraft = buildCustomerConfigDraftWithSnapshotSections({
      currentConfig: currentDraft,
      sectionKeys: ['groups', 'sources'],
      snapshotConfig: snapshotDraft,
    });

    expect(nextDraft.groups).toEqual(snapshotDraft.groups);
    expect(nextDraft.sources).toEqual(snapshotDraft.sources);
    expect(nextDraft.tags).toEqual(currentDraft.tags);
    expect(nextDraft.importConfig).toEqual(currentDraft.importConfig);
  });

  it('builds preview reports with selected sections and apply notice', () => {
    const currentDraft = buildCustomerConfigDraft();
    const snapshotDraft = buildCustomerConfigDraft({
      groups: [
        {
          id: 'root-new',
          label: 'New Group',
          level: 1,
          parentId: null,
        },
      ],
      sources: ['Partner'],
    });
    const preview = previewCustomerConfigSnapshot({
      currentConfig: currentDraft,
      snapshotJsonInput: buildSnapshotJson({ currentDraft, snapshotDraft }),
    });

    const report = buildCustomerConfigSnapshotPreviewReport({
      applyNotice: {
        appliedAt: '2026-04-23T10:10:00.000Z',
        impactWarningCount: preview.impactWarnings.length,
        mode: 'selected',
        sectionLabels: ['Groups'],
        warningsAcknowledged: true,
      },
      exportedAt: '2026-04-23T10:20:00.000Z',
      selectedSectionKeys: ['groups'],
      snapshotPreview: preview,
      warningsAcknowledged: true,
    });

    expect(report.canApply).toBe(true);
    expect(report.latestApplyNotice?.mode).toBe('selected');
    expect(report.selectedSections).toEqual([
      {
        key: 'groups',
        label: 'Groups',
      },
    ]);
    expect(
      report.currentDraftDiffSections.find(
        (section) => section.key === 'groups',
      )?.isSelectedForApply,
    ).toBe(true);
    expect(
      report.currentDraftDiffSections.find(
        (section) => section.key === 'sources',
      )?.isSelectedForApply,
    ).toBe(false);
  });
});
