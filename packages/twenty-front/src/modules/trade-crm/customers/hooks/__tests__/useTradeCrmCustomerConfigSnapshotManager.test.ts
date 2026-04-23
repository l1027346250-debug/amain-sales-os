import { act, renderHook } from '@testing-library/react';

import { useTradeCrmCustomerConfigSnapshotManager } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigSnapshotManager';
import type {
  TradeCrmCustomerConfigDraft,
  useTradeCrmCustomerConfigDraft,
} from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigDraft';
import { buildCustomerConfigSnapshotExport } from '@/trade-crm/customers/utils/tradeCrmCustomerConfigSnapshot';

const createDraft = (
  overrides?: Partial<TradeCrmCustomerConfigDraft>,
): TradeCrmCustomerConfigDraft => ({
  groups: [],
  importConfig: {
    destination: 'customer-list',
    selectedFields: ['company_name'],
    updateExistingContacts: true,
  },
  matchingRules: [{ field: 'company_name', weight: 10 }],
  publicPoolRule: {
    inactivityDays: 90,
    notifyOwnersFirst: true,
    publicPoolGroup: 'Default Public Pool',
    ruleName: 'Default recycle rule',
    scopeStages: ['New'],
  },
  sources: ['Website'],
  tags: {
    company: ['VIP'],
    mine: [],
    subordinate: [],
  },
  ...overrides,
});

const createConfigDraftState = ({
  draft,
  hasUnsavedChanges,
}: {
  draft: TradeCrmCustomerConfigDraft;
  hasUnsavedChanges: boolean;
}) =>
  ({
    draft,
    hasUnsavedChanges,
    replaceDraft: jest.fn(),
  }) as unknown as ReturnType<typeof useTradeCrmCustomerConfigDraft>;

describe('useTradeCrmCustomerConfigSnapshotManager', () => {
  it('should build a preview and select changed sections from snapshot json', () => {
    const currentDraft = createDraft();
    const snapshotDraft = createDraft({
      sources: ['Referral'],
      tags: {
        company: ['Priority'],
        mine: [],
        subordinate: [],
      },
    });
    const configDraft = createConfigDraftState({
      draft: currentDraft,
      hasUnsavedChanges: true,
    });
    const snapshotJson = JSON.stringify(
      buildCustomerConfigSnapshotExport({
        activeSection: 'sources',
        configDraft: {
          draft: snapshotDraft,
          hasUnsavedChanges: false,
          lastSavedAt: null,
          pendingChangedSections: [],
          validationMessages: [],
        },
        exportedAt: '2026-04-23T00:00:00.000Z',
      }),
    );
    const { result } = renderHook(() =>
      useTradeCrmCustomerConfigSnapshotManager(configDraft),
    );

    act(() => {
      result.current.onSnapshotJsonInputChange(snapshotJson);
    });

    act(() => {
      result.current.onPreviewSnapshot();
    });

    expect(result.current.snapshotPreview?.error).toBeNull();
    expect(result.current.selectedSnapshotSectionKeys).toEqual(
      expect.arrayContaining(['sources', 'tags']),
    );
    expect(result.current.snapshotWarningsAcknowledged).toBe(true);
  });

  it('should reset snapshot state when config draft becomes saved', () => {
    const configDraft = createConfigDraftState({
      draft: createDraft(),
      hasUnsavedChanges: true,
    });
    const { result, rerender } = renderHook(
      ({ currentConfigDraft }) =>
        useTradeCrmCustomerConfigSnapshotManager(currentConfigDraft),
      {
        initialProps: {
          currentConfigDraft: configDraft,
        },
      },
    );

    act(() => {
      result.current.onSnapshotJsonInputChange('{"snapshotType":"customer-config"}');
      result.current.setSnapshotWarningsAcknowledged(true);
    });

    rerender({
      currentConfigDraft: createConfigDraftState({
        draft: createDraft(),
        hasUnsavedChanges: false,
      }),
    });

    expect(result.current.snapshotJsonInput).toBe('');
    expect(result.current.snapshotPreview).toBeNull();
    expect(result.current.snapshotWarningsAcknowledged).toBe(false);
    expect(result.current.selectedSnapshotSectionKeys).toEqual([]);
    expect(result.current.snapshotApplyNotice).toBeNull();
  });
});
