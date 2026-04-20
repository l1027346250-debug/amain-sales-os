export enum AppPath {
  // Not logged-in
  Verify = '/verify',
  VerifyEmail = '/verify-email',
  SignInUp = '/welcome',
  Invite = '/invite/:workspaceInviteHash',
  ResetPassword = '/reset-password/:passwordResetToken',

  // Onboarding
  CreateWorkspace = '/create/workspace',
  CreateProfile = '/create/profile',
  SyncEmails = '/sync/emails',
  InviteTeam = '/invite-team',
  PlanRequired = '/plan-required',
  PlanRequiredSuccess = '/plan-required/payment-success',
  BookCallDecision = '/book-call-decision',
  BookCall = '/book-call',

  // Onboarded
  Index = '/',
  SalesWorkbench = '/sales-workbench',
  TradeCrmWorkbench = '/trade-crm/workbench',
  TradeCrmProspecting = '/trade-crm/prospecting',
  TradeCrmMail = '/trade-crm/mail',
  TradeCrmCustomers = '/trade-crm/customers',
  TradeCrmOpportunities = '/trade-crm/opportunities',
  TradeCrmCollaboration = '/trade-crm/collaboration',
  TradeCrmAnalytics = '/trade-crm/analytics',
  EnterpriseCustomFields = '/enterprise/fields/custom',
  EnterpriseFieldDisplay = '/enterprise/fields/display/:entityType',
  EnterpriseCustomerExport = '/enterprise/data/customer-export',
  EnterpriseRecycle = '/enterprise/data/recycle/:resourceType',
  EnterpriseReportTemplates = '/enterprise/reports/templates',
  EnterpriseSourceConvert = '/enterprise/flow/source-convert',
  EnterpriseIndependentStation = '/enterprise/integrations/independent-station',
  EnterpriseSalesPlaybook = '/enterprise/sales/playbook',
  TasksPage = '/objects/tasks',
  OpportunitiesPage = '/objects/opportunities',

  RecordIndexPage = '/objects/:objectNamePlural',
  RecordShowPage = '/object/:objectNameSingular/:objectRecordId',

  Settings = `settings`,
  SettingsCatchAll = `/${Settings}/*`,
  Developers = `developers`,
  DevelopersCatchAll = `/${Developers}/*`,

  Authorize = '/authorize',

  // 404 page not found
  NotFoundWildcard = '*',
  NotFound = '/not-found',
}
