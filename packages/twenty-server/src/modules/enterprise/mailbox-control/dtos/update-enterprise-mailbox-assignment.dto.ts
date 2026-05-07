export class UpdateEnterpriseMailboxAssignmentDto {
  assignmentStatus?: string;
  isPrimaryMailbox?: boolean;
  canReceive?: boolean;
  canSend?: boolean;
  canViewSubordinates?: boolean;
  canHandleSubordinates?: boolean;
  canManageRules?: boolean;
  permissionCodes?: string[];
}
