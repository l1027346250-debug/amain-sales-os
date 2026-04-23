import { type TradeCrmEnterpriseCustomerFieldDraftValue } from '@/trade-crm/customers/hooks/useTradeCrmEnterpriseCustomerFields';

export type EnterpriseCustomerExportFieldOption = {
  fieldCode: string;
  fieldName: string;
};

export type EnterpriseCustomerExportEnterpriseField = {
  id: string;
  fieldCode: string;
  fieldName: string;
  fieldType: string;
  enabled: boolean;
  exportable: boolean;
  groupCode: string | null;
  searchable: boolean;
  sortOrder: number;
};

export type EnterpriseCustomerExportFilterSummary = {
  fieldId: string;
  label: string;
};

export type EnterpriseCustomerExportEnterpriseFieldFilter = {
  fieldDefinitionId: string;
  operator: 'contains' | 'equals';
  value: TradeCrmEnterpriseCustomerFieldDraftValue;
};

export type EnterpriseCustomerExportJob = {
  id: string;
  taskName: string;
  selectedFieldCodes: string[];
  customerCount: number | null;
  status: string;
  fileUrl: string | null;
  fileExpiresAt: string | null;
  retryCount: number;
  errorMessage: string | null;
  createdAt: string;
};

export type EnterpriseCustomerExportStatusTone =
  | 'neutral'
  | 'danger'
  | 'success'
  | 'warning';
