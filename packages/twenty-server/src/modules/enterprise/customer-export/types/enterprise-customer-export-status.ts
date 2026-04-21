export const ENTERPRISE_CUSTOMER_EXPORT_STATUS = {
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  FAILED: 'failed',
  PENDING: 'pending',
  RUNNING: 'running',
} as const;

export type EnterpriseCustomerExportStatus =
  (typeof ENTERPRISE_CUSTOMER_EXPORT_STATUS)[keyof typeof ENTERPRISE_CUSTOMER_EXPORT_STATUS];
