export type EnterprisePermissionCode =
  | 'enterprise.mailbox.assign'
  | 'enterprise.mailbox.create'
  | 'enterprise.mailbox.read'
  | 'enterprise.mailbox.update'
  | 'enterprise.customerExport.create'
  | 'enterprise.customerExport.download'
  | 'enterprise.customerExport.read'
  | 'enterprise.field.create'
  | 'enterprise.field.delete'
  | 'enterprise.field.read'
  | 'enterprise.field.update'
  | 'enterprise.fieldLayout.read'
  | 'enterprise.fieldLayout.update'
  | 'enterprise.independentStation.bind'
  | 'enterprise.independentStation.read'
  | 'enterprise.independentStation.unbind'
  | 'enterprise.independentStation.update'
  | 'enterprise.permissions.read'
  | 'enterprise.permissions.update'
  | 'enterprise.recycle.purge'
  | 'enterprise.recycle.read'
  | 'enterprise.recycle.restore'
  | 'enterprise.reportTemplate.create'
  | 'enterprise.reportTemplate.delete'
  | 'enterprise.reportTemplate.read'
  | 'enterprise.reportTemplate.update'
  | 'enterprise.salesPlaybook.create'
  | 'enterprise.salesPlaybook.read'
  | 'enterprise.salesPlaybook.update'
  | 'enterprise.sourceConvert.blacklist.read'
  | 'enterprise.sourceConvert.blacklist.update'
  | 'enterprise.sourceConvert.read'
  | 'enterprise.sourceConvert.update';

export const ENTERPRISE_PERMISSION_CODES = [
  'enterprise.mailbox.assign',
  'enterprise.mailbox.create',
  'enterprise.mailbox.read',
  'enterprise.mailbox.update',
  'enterprise.customerExport.create',
  'enterprise.customerExport.download',
  'enterprise.customerExport.read',
  'enterprise.field.create',
  'enterprise.field.delete',
  'enterprise.field.read',
  'enterprise.field.update',
  'enterprise.fieldLayout.read',
  'enterprise.fieldLayout.update',
  'enterprise.independentStation.bind',
  'enterprise.independentStation.read',
  'enterprise.independentStation.unbind',
  'enterprise.independentStation.update',
  'enterprise.permissions.read',
  'enterprise.permissions.update',
  'enterprise.recycle.purge',
  'enterprise.recycle.read',
  'enterprise.recycle.restore',
  'enterprise.reportTemplate.create',
  'enterprise.reportTemplate.delete',
  'enterprise.reportTemplate.read',
  'enterprise.reportTemplate.update',
  'enterprise.salesPlaybook.create',
  'enterprise.salesPlaybook.read',
  'enterprise.salesPlaybook.update',
  'enterprise.sourceConvert.blacklist.read',
  'enterprise.sourceConvert.blacklist.update',
  'enterprise.sourceConvert.read',
  'enterprise.sourceConvert.update',
] as const satisfies readonly EnterprisePermissionCode[];

export const isEnterprisePermissionCode = (
  value: string,
): value is EnterprisePermissionCode =>
  (ENTERPRISE_PERMISSION_CODES as readonly string[]).includes(value);
