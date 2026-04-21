export const ENTERPRISE_RECYCLE_RECORD_STATUS = {
  deleted: 'deleted',
  purged: 'purged',
  restored: 'restored',
} as const;

export type EnterpriseRecycleRecordStatus =
  (typeof ENTERPRISE_RECYCLE_RECORD_STATUS)[keyof typeof ENTERPRISE_RECYCLE_RECORD_STATUS];

