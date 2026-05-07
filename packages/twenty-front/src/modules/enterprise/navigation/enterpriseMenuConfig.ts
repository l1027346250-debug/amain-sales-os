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
    label: 'Admin',
    requiredPermission: enterprisePermissionCodes.fieldRead,
    to: AppPath.EnterpriseCustomFields,
    children: [
      {
        key: 'custom-fields',
        label: 'Custom Fields',
        requiredPermission: enterprisePermissionCodes.fieldRead,
        to: AppPath.EnterpriseCustomFields,
      },
      {
        key: 'field-layouts',
        label: 'Field Layout',
        requiredPermission: enterprisePermissionCodes.fieldLayoutRead,
        to: AppPath.EnterpriseFieldDisplay.replace(':entityType', 'lead'),
      },
      {
        key: 'customer-export',
        label: 'Export Center',
        requiredPermission: enterprisePermissionCodes.customerExportRead,
        to: AppPath.EnterpriseCustomerExport,
      },
      {
        key: 'recycle',
        label: 'Recycle Bin',
        requiredPermission: enterprisePermissionCodes.recycleRead,
        to: AppPath.EnterpriseRecycle.replace(':resourceType', 'email'),
      },
      {
        key: 'report-templates',
        label: 'Report Templates',
        requiredPermission: enterprisePermissionCodes.reportTemplateRead,
        to: AppPath.EnterpriseReportTemplates,
      },
      {
        key: 'source-convert',
        label: 'Source Convert',
        requiredPermission: enterprisePermissionCodes.sourceConvertRead,
        to: AppPath.EnterpriseSourceConvert,
      },
      {
        key: 'independent-station',
        label: 'Independent Station',
        requiredPermission: enterprisePermissionCodes.independentStationRead,
        to: AppPath.EnterpriseIndependentStation,
      },
      {
        key: 'sales-playbook',
        label: 'Sales Playbook',
        requiredPermission: enterprisePermissionCodes.salesPlaybookRead,
        to: AppPath.EnterpriseSalesPlaybook,
      },
      {
        key: 'mailbox-accounts',
        label: 'Mailbox Accounts',
        requiredPermission: enterprisePermissionCodes.mailboxRead,
        to: AppPath.EnterpriseMailboxAccounts,
      },
      {
        key: 'mailbox-assignments',
        label: 'Mailbox Assignments',
        requiredPermission: enterprisePermissionCodes.mailboxAssign,
        to: AppPath.EnterpriseMailboxAssignments,
      },
      {
        key: 'mailbox-rules',
        label: 'Mailbox Rules',
        requiredPermission: enterprisePermissionCodes.mailboxUpdate,
        to: AppPath.EnterpriseMailboxRules,
      },
      {
        key: 'mailbox-health',
        label: 'Mailbox Health',
        requiredPermission: enterprisePermissionCodes.mailboxRead,
        to: AppPath.EnterpriseMailboxHealth,
      },
      {
        key: 'enterprise-permissions',
        label: 'Permissions',
        requiredPermission: enterprisePermissionCodes.permissionsRead,
        to: AppPath.EnterprisePermissions,
      },
    ],
  },
];
