import { AppPath } from 'twenty-shared/types';

export type EnterpriseMenuItem = {
  key: string;
  label: string;
  to: string;
  children?: EnterpriseMenuItem[];
};

export const enterpriseMenuConfig: EnterpriseMenuItem[] = [
  {
    key: 'fields',
    label: '企业管理',
    to: AppPath.EnterpriseCustomFields,
    children: [
      {
        key: 'custom-fields',
        label: '自定义字段',
        to: AppPath.EnterpriseCustomFields,
      },
      {
        key: 'field-layouts',
        label: '字段显示',
        to: AppPath.EnterpriseFieldDisplay.replace(':entityType', 'lead'),
      },
      {
        key: 'customer-export',
        label: '客户导出',
        to: AppPath.EnterpriseCustomerExport,
      },
      {
        key: 'recycle',
        label: '回收箱',
        to: AppPath.EnterpriseRecycle.replace(':resourceType', 'email'),
      },
      {
        key: 'report-templates',
        label: '工作报告模板',
        to: AppPath.EnterpriseReportTemplates,
      },
      {
        key: 'source-convert',
        label: '获客来源流转',
        to: AppPath.EnterpriseSourceConvert,
      },
      {
        key: 'independent-station',
        label: '独立站管理',
        to: AppPath.EnterpriseIndependentStation,
      },
      {
        key: 'sales-playbook',
        label: '销售助手管理',
        to: AppPath.EnterpriseSalesPlaybook,
      },
    ],
  },
];

