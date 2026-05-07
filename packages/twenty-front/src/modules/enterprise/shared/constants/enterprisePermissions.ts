import { PermissionFlagType } from '~/generated-metadata/graphql';

export const enterprisePermissionCodes = {
  mailboxAssign: 'enterprise.mailbox.assign',
  mailboxCreate: 'enterprise.mailbox.create',
  mailboxRead: 'enterprise.mailbox.read',
  mailboxUpdate: 'enterprise.mailbox.update',
  customerExportCreate: 'enterprise.customerExport.create',
  customerExportDownload: 'enterprise.customerExport.download',
  customerExportRead: 'enterprise.customerExport.read',
  fieldCreate: 'enterprise.field.create',
  fieldDelete: 'enterprise.field.delete',
  fieldLayoutRead: 'enterprise.fieldLayout.read',
  fieldLayoutUpdate: 'enterprise.fieldLayout.update',
  fieldRead: 'enterprise.field.read',
  fieldUpdate: 'enterprise.field.update',
  independentStationBind: 'enterprise.independentStation.bind',
  independentStationRead: 'enterprise.independentStation.read',
  independentStationUnbind: 'enterprise.independentStation.unbind',
  independentStationUpdate: 'enterprise.independentStation.update',
  permissionsRead: 'enterprise.permissions.read',
  permissionsUpdate: 'enterprise.permissions.update',
  recyclePurge: 'enterprise.recycle.purge',
  recycleRead: 'enterprise.recycle.read',
  recycleRestore: 'enterprise.recycle.restore',
  reportTemplateCreate: 'enterprise.reportTemplate.create',
  reportTemplateDelete: 'enterprise.reportTemplate.delete',
  reportTemplateRead: 'enterprise.reportTemplate.read',
  reportTemplateUpdate: 'enterprise.reportTemplate.update',
  salesPlaybookCreate: 'enterprise.salesPlaybook.create',
  salesPlaybookRead: 'enterprise.salesPlaybook.read',
  salesPlaybookUpdate: 'enterprise.salesPlaybook.update',
  sourceConvertBlacklistRead: 'enterprise.sourceConvert.blacklist.read',
  sourceConvertBlacklistUpdate: 'enterprise.sourceConvert.blacklist.update',
  sourceConvertRead: 'enterprise.sourceConvert.read',
  sourceConvertUpdate: 'enterprise.sourceConvert.update',
} as const;

export type EnterprisePermissionCode =
  (typeof enterprisePermissionCodes)[keyof typeof enterprisePermissionCodes];

export const enterprisePermissionLabels: Record<EnterprisePermissionCode, string> = {
  [enterprisePermissionCodes.mailboxAssign]: 'Assign mailbox accounts',
  [enterprisePermissionCodes.mailboxCreate]: 'Create mailbox accounts',
  [enterprisePermissionCodes.mailboxRead]: 'Read mailbox control',
  [enterprisePermissionCodes.mailboxUpdate]: 'Update mailbox control',
  [enterprisePermissionCodes.customerExportCreate]: 'Create customer export jobs',
  [enterprisePermissionCodes.customerExportDownload]: 'Download customer export files',
  [enterprisePermissionCodes.customerExportRead]: 'Read customer export data',
  [enterprisePermissionCodes.fieldCreate]: 'Create custom fields',
  [enterprisePermissionCodes.fieldDelete]: 'Delete custom fields',
  [enterprisePermissionCodes.fieldLayoutRead]: 'Read field layouts',
  [enterprisePermissionCodes.fieldLayoutUpdate]: 'Update field layouts',
  [enterprisePermissionCodes.fieldRead]: 'Read custom fields',
  [enterprisePermissionCodes.fieldUpdate]: 'Update custom fields',
  [enterprisePermissionCodes.independentStationBind]: 'Bind independent stations',
  [enterprisePermissionCodes.independentStationRead]: 'Read independent stations',
  [enterprisePermissionCodes.independentStationUnbind]: 'Unbind independent stations',
  [enterprisePermissionCodes.independentStationUpdate]: 'Update independent stations',
  [enterprisePermissionCodes.permissionsRead]: 'Read enterprise permissions',
  [enterprisePermissionCodes.permissionsUpdate]: 'Update enterprise permissions',
  [enterprisePermissionCodes.recyclePurge]: 'Purge recycle bin records',
  [enterprisePermissionCodes.recycleRead]: 'Read recycle bin records',
  [enterprisePermissionCodes.recycleRestore]: 'Restore recycle bin records',
  [enterprisePermissionCodes.reportTemplateCreate]: 'Create report templates',
  [enterprisePermissionCodes.reportTemplateDelete]: 'Delete report templates',
  [enterprisePermissionCodes.reportTemplateRead]: 'Read report templates',
  [enterprisePermissionCodes.reportTemplateUpdate]: 'Update report templates',
  [enterprisePermissionCodes.salesPlaybookCreate]: 'Create sales playbooks',
  [enterprisePermissionCodes.salesPlaybookRead]: 'Read sales playbooks',
  [enterprisePermissionCodes.salesPlaybookUpdate]: 'Update sales playbooks',
  [enterprisePermissionCodes.sourceConvertBlacklistRead]:
    'Read source convert blacklists',
  [enterprisePermissionCodes.sourceConvertBlacklistUpdate]:
    'Update source convert blacklists',
  [enterprisePermissionCodes.sourceConvertRead]: 'Read source convert rules',
  [enterprisePermissionCodes.sourceConvertUpdate]: 'Update source convert rules',
};

export const enterprisePermissionFlagFallbacks: Record<
  EnterprisePermissionCode,
  PermissionFlagType[]
> = Object.fromEntries(
  Object.values(enterprisePermissionCodes).map((permissionCode) => [
    permissionCode,
    [PermissionFlagType.ENTERPRISE],
  ]),
) as Record<EnterprisePermissionCode, PermissionFlagType[]>;
