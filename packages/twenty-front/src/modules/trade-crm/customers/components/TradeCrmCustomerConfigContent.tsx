import {
  TradeCrmCustomerConfigSourcesPanel,
  TradeCrmCustomerConfigTagsPanel,
} from '@/trade-crm/customers/components/TradeCrmCustomerConfigDictionaryPanels';
import { TradeCrmCustomerConfigGroupTreeEditor } from '@/trade-crm/customers/components/TradeCrmCustomerConfigGroupTreeEditor';
import { TradeCrmCustomerConfigImportPanel } from '@/trade-crm/customers/components/TradeCrmCustomerConfigImportPanel';
import { TradeCrmCustomerConfigMatchingRulesPanel } from '@/trade-crm/customers/components/TradeCrmCustomerConfigMatchingRulesPanel';
import { TradeCrmCustomerConfigPublicPoolRulesPanel } from '@/trade-crm/customers/components/TradeCrmCustomerConfigPublicPoolRulesPanel';
import { TradeCrmCustomerConfigSnapshotImportPanel } from '@/trade-crm/customers/components/TradeCrmCustomerConfigSnapshotImportPanel';
import type { useTradeCrmCustomerConfigDraft } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigDraft';
import type { useTradeCrmCustomerImportJobs } from '@/trade-crm/customers/hooks/useTradeCrmCustomerImportJobs';
import type { useTradeCrmCustomerWorkspaceData } from '@/trade-crm/customers/hooks/useTradeCrmCustomerWorkspaceData';
import {
  getCustomerConfigSectionLabel,
  hasPendingConfigSectionChange,
  type CustomerConfigEditorState,
  type CustomerConfigTagInputState,
} from '@/trade-crm/customers/utils/tradeCrmCustomerConfigWorkspace';
import { type TradeCrmCustomerConfigSection } from '@/trade-crm/customers/utils/tradeCrmCustomerRouting';
import {
  type CustomerConfigSnapshotPreview,
  type CustomerConfigSnapshotSectionKey,
} from '@/trade-crm/customers/utils/tradeCrmCustomerConfigSnapshot';

type TradeCrmCustomerConfigContentProps = {
  activeSection: TradeCrmCustomerConfigSection;
  clearSourceEditorValue: (key: string) => void;
  clearTagEditorValue: (key: string) => void;
  configDraft: ReturnType<typeof useTradeCrmCustomerConfigDraft>;
  groupParentId: string | null;
  importFileName: string;
  importJobs: ReturnType<typeof useTradeCrmCustomerImportJobs>;
  newGroupLabel: string;
  newSourceLabel: string;
  newTagLabels: CustomerConfigTagInputState;
  onApplySelectedSnapshotSections: () => void;
  onApplySnapshot: () => void;
  onApplySnapshotSection: (
    sectionKey: CustomerConfigSnapshotSectionKey,
  ) => void;
  onClearSnapshotSectionSelection: () => void;
  onExportPreviewReport: () => void;
  onGroupParentIdChange: (value: string | null) => void;
  onImportFileNameChange: (value: string) => void;
  onNewGroupLabelChange: (value: string) => void;
  onNewSourceLabelChange: (value: string) => void;
  onNewTagLabelChange: (
    scope: keyof CustomerConfigTagInputState,
    value: string,
  ) => void;
  onPreviewSnapshot: () => void;
  onSelectAllSnapshotSections: () => void;
  onSnapshotJsonInputChange: (value: string) => void;
  onSnapshotWarningsAcknowledgedChange: (value: boolean) => void;
  onSourceEditorValueChange: (key: string, value: string) => void;
  onTagEditorValueChange: (key: string, value: string) => void;
  onToggleSnapshotSection: (
    sectionKey: CustomerConfigSnapshotSectionKey,
  ) => void;
  publicPoolGroupLabels: string[];
  selectedSnapshotSectionKeys: CustomerConfigSnapshotSectionKey[];
  snapshotJsonInput: string;
  snapshotPreview: CustomerConfigSnapshotPreview | null;
  snapshotWarningsAcknowledged: boolean;
  sourceEditorValues: CustomerConfigEditorState;
  tagEditorValues: CustomerConfigEditorState;
  workspaceData: ReturnType<typeof useTradeCrmCustomerWorkspaceData>;
};

export const TradeCrmCustomerConfigContent = ({
  activeSection,
  clearSourceEditorValue,
  clearTagEditorValue,
  configDraft,
  groupParentId,
  importFileName,
  importJobs,
  newGroupLabel,
  newSourceLabel,
  newTagLabels,
  onApplySelectedSnapshotSections,
  onApplySnapshot,
  onApplySnapshotSection,
  onClearSnapshotSectionSelection,
  onExportPreviewReport,
  onGroupParentIdChange,
  onImportFileNameChange,
  onNewGroupLabelChange,
  onNewSourceLabelChange,
  onNewTagLabelChange,
  onPreviewSnapshot,
  onSelectAllSnapshotSections,
  onSnapshotJsonInputChange,
  onSnapshotWarningsAcknowledgedChange,
  onSourceEditorValueChange,
  onTagEditorValueChange,
  onToggleSnapshotSection,
  publicPoolGroupLabels,
  selectedSnapshotSectionKeys,
  snapshotJsonInput,
  snapshotPreview,
  snapshotWarningsAcknowledged,
  sourceEditorValues,
  tagEditorValues,
  workspaceData,
}: TradeCrmCustomerConfigContentProps) => {
  if (activeSection === 'public-pool-rules') {
    return (
      <TradeCrmCustomerConfigPublicPoolRulesPanel
        configDraft={configDraft}
        currentPublicPoolRecordCount={workspaceData.publicPoolRecords.length}
        hasUnsavedPublicPoolRules={hasPendingConfigSectionChange(
          configDraft.pendingChangedSections,
          'public-pool-rules',
        )}
        isExecutingPublicPoolRules={
          workspaceData.executeCustomerPublicPoolRulesLoading
        }
        onExecutePublicPoolRules={() => {
          void workspaceData.executeCustomerPublicPoolRules();
        }}
        publicPoolGroupLabels={publicPoolGroupLabels}
        stageLabels={workspaceData.customerStageSummary.map(
          (item) => item.label,
        )}
      />
    );
  }

  if (activeSection === 'groups') {
    return (
      <TradeCrmCustomerConfigGroupTreeEditor
        configDraft={configDraft}
        groupParentId={groupParentId}
        hasUnsavedGroups={hasPendingConfigSectionChange(
          configDraft.pendingChangedSections,
          'groups',
        )}
        newGroupLabel={newGroupLabel}
        onGroupParentIdChange={onGroupParentIdChange}
        onNewGroupLabelChange={onNewGroupLabelChange}
      />
    );
  }

  if (activeSection === 'tags') {
    return (
      <TradeCrmCustomerConfigTagsPanel
        clearTagEditorValue={clearTagEditorValue}
        configDraft={configDraft}
        hasUnsavedTags={hasPendingConfigSectionChange(
          configDraft.pendingChangedSections,
          'tags',
        )}
        newTagLabels={newTagLabels}
        onNewTagLabelChange={onNewTagLabelChange}
        onTagEditorValueChange={onTagEditorValueChange}
        tagEditorValues={tagEditorValues}
      />
    );
  }

  if (activeSection === 'sources') {
    return (
      <TradeCrmCustomerConfigSourcesPanel
        clearSourceEditorValue={clearSourceEditorValue}
        configDraft={configDraft}
        hasUnsavedSources={hasPendingConfigSectionChange(
          configDraft.pendingChangedSections,
          'sources',
        )}
        newSourceLabel={newSourceLabel}
        onNewSourceLabelChange={onNewSourceLabelChange}
        onSourceEditorValueChange={onSourceEditorValueChange}
        sourceEditorValues={sourceEditorValues}
      />
    );
  }

  if (activeSection === 'matching') {
    return (
      <TradeCrmCustomerConfigMatchingRulesPanel
        configDraft={configDraft}
        hasUnsavedMatchingRules={hasPendingConfigSectionChange(
          configDraft.pendingChangedSections,
          'matching',
        )}
      />
    );
  }

  return (
    <>
      <TradeCrmCustomerConfigImportPanel
        configDraft={configDraft}
        hasUnsavedImportConfig={hasPendingConfigSectionChange(
          configDraft.pendingChangedSections,
          'import',
        )}
        importFileName={importFileName}
        importJobs={importJobs}
        onImportFileNameChange={onImportFileNameChange}
      />
      <TradeCrmCustomerConfigSnapshotImportPanel
        getSectionLabel={getCustomerConfigSectionLabel}
        onApplySelectedSnapshotSections={onApplySelectedSnapshotSections}
        onApplySnapshot={onApplySnapshot}
        onApplySnapshotSection={onApplySnapshotSection}
        onClearSnapshotSectionSelection={onClearSnapshotSectionSelection}
        onExportPreviewReport={onExportPreviewReport}
        onPreviewSnapshot={onPreviewSnapshot}
        onSelectAllSnapshotSections={onSelectAllSnapshotSections}
        onSnapshotJsonInputChange={onSnapshotJsonInputChange}
        onSnapshotWarningsAcknowledgedChange={
          onSnapshotWarningsAcknowledgedChange
        }
        onToggleSnapshotSection={onToggleSnapshotSection}
        selectedSnapshotSectionKeys={selectedSnapshotSectionKeys}
        snapshotJsonInput={snapshotJsonInput}
        snapshotPreview={snapshotPreview}
        snapshotWarningsAcknowledged={snapshotWarningsAcknowledged}
      />
    </>
  );
};
