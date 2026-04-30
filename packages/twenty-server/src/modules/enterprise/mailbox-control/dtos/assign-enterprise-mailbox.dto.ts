export class AssignEnterpriseMailboxDto {
  mailboxProfileId: string;
  workspaceMemberId: string;
  isPrimaryMailbox?: boolean;
  canReceive?: boolean;
  canSend?: boolean;
  canViewSubordinates?: boolean;
  canHandleSubordinates?: boolean;
  canManageRules?: boolean;
  permissionCodes?: string[];
}
