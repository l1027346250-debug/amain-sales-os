import {
  enterprisePermissionCodes,
  type EnterprisePermissionCode,
} from '@/enterprise/shared/constants/enterprisePermissions';
import { AppPath } from 'twenty-shared/types';

export type EnterpriseMenuItem = {
  key: string;
  label: string;
  requiredPermission: EnterprisePermissionCode;
  to: string;
  children?: EnterpriseMenuItem[];
};

export const enterpriseMenuConfig: EnterpriseMenuItem[] = [
  {
    key: 'enterprise-management',
    label: '企业管理',
    requiredPermission: enterprisePermissionCodes.fieldRead,
    to: AppPath.EnterpriseCustomFields,
    children: [
      {
        key: 'custom-fields',
        label: '自定义字段',
        requiredPermission: enterprisePermissionCodes.fieldRead,
        to: AppPath.EnterpriseCustomFields,
      },
      {
        key: 'field-layouts',
        label: '字段显示',
        requiredPermission: enterprisePermissionCodes.fieldLayoutRead,
        to: AppPath.EnterpriseFieldDisplay.replace(':entityType', 'lead'),
      },
      {
        key: 'customer-export',
        label: '客户导出',
        requiredPermission: enterprisePermissionCodes.customerExportRead,
        to: AppPath.EnterpriseCustomerExport,
      },
      {
        key: 'recycle',
        label: '回收箱',
        requiredPermission: enterprisePermissionCodes.recycleRead,
        to: AppPath.EnterpriseRecycle.replace(':resourceType', 'email'),
      },
      {
        key: 'report-templates',
        label: '工作报告模板',
        requiredPermission: enterprisePermissionCodes.reportTemplateRead,
        to: AppPath.EnterpriseReportTemplates,
      },
      {
        key: 'source-convert',
        label: '获客来源流转',
        requiredPermission: enterprisePermissionCodes.sourceConvertRead,
        to: AppPath.EnterpriseSourceConvert,
      },
      {
        key: 'independent-station',
        label: '独立站管理',
        requiredPermission: enterprisePermissionCodes.independentStationRead,
        to: AppPath.EnterpriseIndependentStation,
      },
      {
        key: 'sales-playbook',
        label: '销售助手管理',
        requiredPermission: enterprisePermissionCodes.salesPlaybookRead,
        to: AppPath.EnterpriseSalesPlaybook,
      },
      {
        key: 'enterprise-permissions',
        label: '企业权限配置',
        requiredPermission: enterprisePermissionCodes.permissionsRead,
        to: AppPath.EnterprisePermissions,
      },
    ],
  },
];
