import {
  getTradeCrmPublicPoolGroupLabelForRecord,
  type TradeCrmCustomerPresentationRecord,
} from '@/trade-crm/customers/utils/tradeCrmCustomerPresentation';
import { tradeCrmCustomerRouteLabels } from '@/trade-crm/customers/utils/tradeCrmCustomerRouting';

export const CUSTOMER_CONFIG_UNSAVED_CHANGES_MESSAGE =
  'Customer settings have unsaved changes. Leave without saving?';

export type CustomerConfigTagInputState = {
  company: string;
  mine: string;
  subordinate: string;
};

export type CustomerConfigEditorState = Record<string, string>;

export const getPublicPoolGroupLabels = (
  publicPoolRecords: TradeCrmCustomerPresentationRecord[] | undefined,
) => {
  const labels = (publicPoolRecords ?? [])
    .map((record) => getTradeCrmPublicPoolGroupLabelForRecord(record))
    .filter(
      (label): label is string => typeof label === 'string' && label.length > 0,
    );

  return labels.length > 0 ? [...new Set(labels)] : ['Default Public Pool'];
};

export const getCustomerConfigSectionLabel = (sectionKey: string) =>
  tradeCrmCustomerRouteLabels[
    `config-${sectionKey}` as keyof typeof tradeCrmCustomerRouteLabels
  ] ?? sectionKey;

export const hasPendingConfigSectionChange = (
  pendingChangedSections: Array<{ key: string }>,
  sectionKey: string,
) => pendingChangedSections.some((section) => section.key === sectionKey);
