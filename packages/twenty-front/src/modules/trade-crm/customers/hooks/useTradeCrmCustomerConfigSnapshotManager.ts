import { useEffect, useState } from 'react';

import type { useTradeCrmCustomerConfigDraft } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigDraft';
import {
  buildCustomerConfigDraftWithSnapshotSections,
  canApplyCustomerConfigSnapshotPreview,
  CUSTOMER_CONFIG_SNAPSHOT_DIFF_SECTIONS,
  getCustomerConfigSnapshotSectionLabel,
  previewCustomerConfigSnapshot,
  type CustomerConfigSnapshotApplyNotice,
  type CustomerConfigSnapshotPreview,
  type CustomerConfigSnapshotSectionKey,
} from '@/trade-crm/customers/utils/tradeCrmCustomerConfigSnapshot';

export const useTradeCrmCustomerConfigSnapshotManager = (
  configDraft: ReturnType<typeof useTradeCrmCustomerConfigDraft>,
) => {
  const [snapshotJsonInput, setSnapshotJsonInput] = useState('');
  const [snapshotPreview, setSnapshotPreview] =
    useState<CustomerConfigSnapshotPreview | null>(null);
  const [snapshotWarningsAcknowledged, setSnapshotWarningsAcknowledged] =
    useState(false);
  const [selectedSnapshotSectionKeys, setSelectedSnapshotSectionKeys] =
    useState<CustomerConfigSnapshotSectionKey[]>([]);
  const [snapshotApplyNotice, setSnapshotApplyNotice] =
    useState<CustomerConfigSnapshotApplyNotice | null>(null);

  useEffect(() => {
    if (configDraft.hasUnsavedChanges) {
      return;
    }

    setSnapshotJsonInput('');
    setSnapshotPreview(null);
    setSnapshotWarningsAcknowledged(false);
    setSelectedSnapshotSectionKeys([]);
    setSnapshotApplyNotice(null);
  }, [configDraft.hasUnsavedChanges]);

  const onSnapshotJsonInputChange = (value: string) => {
    setSnapshotJsonInput(value);
    setSnapshotPreview(null);
    setSnapshotWarningsAcknowledged(false);
    setSelectedSnapshotSectionKeys([]);
  };

  const onPreviewSnapshot = () => {
    const nextSnapshotPreview = previewCustomerConfigSnapshot({
      currentConfig: configDraft.draft,
      snapshotJsonInput,
    });

    setSnapshotPreview(nextSnapshotPreview);
    setSnapshotWarningsAcknowledged(
      nextSnapshotPreview.impactWarnings.length === 0,
    );
    setSelectedSnapshotSectionKeys(
      nextSnapshotPreview.currentDraftDiffSections.map((section) => section.key),
    );
  };

  const clearSelectionAndPreview = () => {
    setSnapshotPreview(null);
    setSnapshotWarningsAcknowledged(false);
    setSelectedSnapshotSectionKeys([]);
  };

  const onApplySnapshot = () => {
    const snapshotConfigDraft = snapshotPreview?.snapshotConfigDraft ?? null;

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
    clearSelectionAndPreview();
  };

  const onApplySelectedSnapshotSections = () => {
    const snapshotConfigDraft = snapshotPreview?.snapshotConfigDraft ?? null;

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
    clearSelectionAndPreview();
  };

  const onApplySnapshotSection = (
    sectionKey: CustomerConfigSnapshotSectionKey,
  ) => {
    const snapshotConfigDraft = snapshotPreview?.snapshotConfigDraft ?? null;

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
      sectionLabels: [getCustomerConfigSnapshotSectionLabel(sectionKey)],
      warningsAcknowledged: snapshotWarningsAcknowledged,
    });
    clearSelectionAndPreview();
  };

  const onClearSnapshotSectionSelection = () => {
    setSelectedSnapshotSectionKeys([]);
  };

  const onSelectAllSnapshotSections = () => {
    if (snapshotPreview === null) {
      return;
    }

    setSelectedSnapshotSectionKeys(
      snapshotPreview.currentDraftDiffSections.map((section) => section.key),
    );
  };

  const onToggleSnapshotSection = (
    sectionKey: CustomerConfigSnapshotSectionKey,
  ) => {
    setSelectedSnapshotSectionKeys((currentSectionKeys) =>
      currentSectionKeys.includes(sectionKey)
        ? currentSectionKeys.filter(
            (currentSectionKey) => currentSectionKey !== sectionKey,
          )
        : [...currentSectionKeys, sectionKey],
    );
  };

  return {
    onApplySelectedSnapshotSections,
    onApplySnapshot,
    onApplySnapshotSection,
    onClearSnapshotSectionSelection,
    onPreviewSnapshot,
    onSelectAllSnapshotSections,
    onSnapshotJsonInputChange,
    onToggleSnapshotSection,
    selectedSnapshotSectionKeys,
    setSnapshotWarningsAcknowledged,
    snapshotApplyNotice,
    snapshotJsonInput,
    snapshotPreview,
    snapshotWarningsAcknowledged,
  };
};
