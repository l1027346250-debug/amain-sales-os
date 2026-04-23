import type { useTradeCrmCustomerConfigDraft } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigDraft';
import {
  buildCustomerConfigSnapshotExport,
  buildCustomerConfigSnapshotPreviewReport,
  type CustomerConfigSnapshotApplyNotice,
  type CustomerConfigSnapshotPreview,
  type CustomerConfigSnapshotSectionKey,
} from '@/trade-crm/customers/utils/tradeCrmCustomerConfigSnapshot';
import type { TradeCrmCustomerConfigSection } from '@/trade-crm/customers/utils/tradeCrmCustomerRouting';

const downloadJsonFile = ({
  fileName,
  payload,
}: {
  fileName: string;
  payload: unknown;
}) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  const url = window.URL.createObjectURL(blob);
  const anchorElement = document.createElement('a');

  anchorElement.href = url;
  anchorElement.download = fileName;
  anchorElement.click();
  window.URL.revokeObjectURL(url);
};

export const downloadTradeCrmCustomerConfigSnapshot = ({
  activeSection,
  configDraft,
}: {
  activeSection: TradeCrmCustomerConfigSection;
  configDraft: ReturnType<typeof useTradeCrmCustomerConfigDraft>;
}) => {
  const exportedAt = new Date().toISOString();
  const snapshot = buildCustomerConfigSnapshotExport({
    activeSection,
    exportedAt,
    configDraft,
  });

  downloadJsonFile({
    fileName: `customer-config-${activeSection}-${exportedAt.slice(0, 10)}.json`,
    payload: snapshot,
  });
};

export const downloadTradeCrmCustomerConfigSnapshotPreviewReport = ({
  applyNotice,
  selectedSectionKeys,
  snapshotPreview,
  warningsAcknowledged,
}: {
  applyNotice: CustomerConfigSnapshotApplyNotice | null;
  selectedSectionKeys: CustomerConfigSnapshotSectionKey[];
  snapshotPreview: CustomerConfigSnapshotPreview;
  warningsAcknowledged: boolean;
}) => {
  const exportedAt = new Date().toISOString();
  const report = buildCustomerConfigSnapshotPreviewReport({
    applyNotice,
    exportedAt,
    selectedSectionKeys,
    snapshotPreview,
    warningsAcknowledged,
  });

  downloadJsonFile({
    fileName: `customer-config-preview-report-${exportedAt.slice(0, 10)}.json`,
    payload: report,
  });
};
