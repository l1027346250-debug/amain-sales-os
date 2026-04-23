import { PermissionFlagType } from '~/generated-metadata/graphql';

export const enterprisePermissionCodes = {
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
  [enterprisePermissionCodes.customerExportCreate]: '创建客户导出任务',
  [enterprisePermissionCodes.customerExportDownload]: '下载客户导出文件',
  [enterprisePermissionCodes.customerExportRead]: '查看客户导出',
  [enterprisePermissionCodes.fieldCreate]: '新增字段',
  [enterprisePermissionCodes.fieldDelete]: '删除字段',
  [enterprisePermissionCodes.fieldLayoutRead]: '查看字段显示',
  [enterprisePermissionCodes.fieldLayoutUpdate]: '更新字段显示',
  [enterprisePermissionCodes.fieldRead]: '查看字段',
  [enterprisePermissionCodes.fieldUpdate]: '编辑字段',
  [enterprisePermissionCodes.independentStationBind]: '绑定独立站',
  [enterprisePermissionCodes.independentStationRead]: '查看独立站',
  [enterprisePermissionCodes.independentStationUnbind]: '解绑独立站',
  [enterprisePermissionCodes.independentStationUpdate]: '更新独立站',
  [enterprisePermissionCodes.permissionsRead]: '查看企业管理权限',
  [enterprisePermissionCodes.permissionsUpdate]: '更新企业管理权限',
  [enterprisePermissionCodes.recyclePurge]: '永久清空回收箱',
  [enterprisePermissionCodes.recycleRead]: '查看回收箱',
  [enterprisePermissionCodes.recycleRestore]: '恢复回收记录',
  [enterprisePermissionCodes.reportTemplateCreate]: '创建报告模板',
  [enterprisePermissionCodes.reportTemplateDelete]: '删除报告模板',
  [enterprisePermissionCodes.reportTemplateRead]: '查看报告模板',
  [enterprisePermissionCodes.reportTemplateUpdate]: '更新报告模板',
  [enterprisePermissionCodes.salesPlaybookCreate]: '创建销售助手流程',
  [enterprisePermissionCodes.salesPlaybookRead]: '查看销售助手',
  [enterprisePermissionCodes.salesPlaybookUpdate]: '更新销售助手',
  [enterprisePermissionCodes.sourceConvertBlacklistRead]: '查看来源黑名单',
  [enterprisePermissionCodes.sourceConvertBlacklistUpdate]: '更新来源黑名单',
  [enterprisePermissionCodes.sourceConvertRead]: '查看来源流转',
  [enterprisePermissionCodes.sourceConvertUpdate]: '更新来源流转',
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
