export type EnterpriseMailboxProfile = {
  id: string;
  emailAddress: string;
  provider: string;
  protocolMode?: string;
  imapHost: string;
  imapPort: number;
  imapSecure?: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure?: boolean;
  loginUsername?: string;
  credentialMode?: string;
  status: string;
  validationStatus: string;
  lastValidatedAt?: string | null;
  lastValidationError?: string | null;
  lastSyncAt?: string | null;
  lastSyncStatus?: string | null;
  connectedAccountId?: string | null;
  messageChannelId?: string | null;
};

export type EnterpriseMailboxHealthSnapshot = {
  mailboxProfileId: string;
  emailAddress: string;
  provider: string;
  status: string;
  validationStatus: string;
  lastValidationError?: string | null;
  lastSyncStatus: string | null;
  lastSyncAt: string | null;
  messageChannelId?: string | null;
};

export type EnterpriseMailboxWorkspaceMember = {
  id: string;
  userEmail: string;
  avatarUrl: string | null;
  name: {
    firstName: string | null;
    lastName: string | null;
  };
};

export type EnterpriseMailboxAssignmentSnapshot = {
  id: string;
  mailboxProfileId: string;
  workspaceMemberId: string;
  assignmentStatus: string;
  isPrimaryMailbox?: boolean;
  canReceive: boolean;
  canSend: boolean;
  canViewSubordinates?: boolean;
  canHandleSubordinates?: boolean;
  canManageRules: boolean;
  updatedAt?: string;
  emailAddress: string | null;
  permissionCodes: string[];
};

export type EnterpriseMailboxRule = {
  id: string;
  mailboxProfileId: string;
  emailAddress?: string | null;
  name: string;
  ruleType: string;
  conditionsJson?: Record<string, unknown> | null;
  actionsJson?: Record<string, unknown> | null;
  enabled: boolean;
  priority: number;
  updatedAt: string;
};

export type EnterpriseMailboxRuleActivity = {
  id: string;
  action: string;
  resourceId: string | null;
  actorWorkspaceMemberId: string | null;
  createdAt: string;
  beforeJson?: Record<string, unknown> | null;
  afterJson?: Record<string, unknown> | null;
  contextJson?: Record<string, unknown> | null;
  emailAddress?: string | null;
  ruleName?: string | null;
  ruleType?: string | null;
};

export type EnterpriseMailboxRuleReadinessPreview = {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  emailAddress: string | null;
  mailboxStatus: string;
  validationStatus: string;
  activeAssignmentCount: number;
  primaryAssignmentCount: number;
  messageChannelDetected: boolean;
  sourceFolder: string | null;
  sourceFolderExists: boolean | null;
  targetFolder: string | null;
  targetFolderExists: boolean | null;
  warnings: string[];
  blockers: string[];
  status: 'ready' | 'warning' | 'blocked';
};

export type EnterpriseMailboxRulePreviewCandidate = {
  threadId: string;
  messageId: string;
  subject: string;
  senderHandle: string | null;
  receivedAt: string | null;
  pending: boolean;
  taskLinked: boolean;
  crmLinked: boolean;
  matchedSignals: string[];
  plannedActions: string[];
};

export type EnterpriseMailboxRuleDryRunPreview = {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  emailAddress: string | null;
  status: 'ready' | 'warning' | 'blocked';
  warnings: string[];
  blockers: string[];
  candidateCount: number;
  candidates: EnterpriseMailboxRulePreviewCandidate[];
};

export type EnterpriseMailboxRuleExecutionResult = {
  id: string;
  mailboxRuleId: string;
  mailboxProfileId: string;
  executionType: string;
  outcome: string;
  threadId: string | null;
  summary: string;
  failureReason: string | null;
  matchedSignalsJson: string[] | null;
  plannedActionsJson: string[] | null;
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
  emailAddress: string | null;
  ruleName: string | null;
  ruleType: string | null;
};
