import { EnterpriseMailboxAssignmentService } from 'src/modules/enterprise/mailbox-control/services/enterprise-mailbox-assignment.service';

describe('EnterpriseMailboxAssignmentService', () => {
  it('should validate substrate account linkage and assign mailbox permissions to a workspace member', async () => {
    const mailboxAssignmentRepository = {
      create: jest.fn((input) => ({
        id: 'assignment-id',
        ...input,
      })),
      save: jest.fn(async (input) => input),
    };

    const mailboxProfileRepository = {
      findOneByOrFail: jest.fn().mockResolvedValue({
        id: 'mailbox-profile-id',
        workspaceId: 'workspace-id',
        emailAddress: 'sales@company.com',
        connectedAccountId: 'connected-account-id',
      }),
    };

    const mailboxPermissionRepository = {
      create: jest.fn((input) => input),
      save: jest.fn(async (input) => input),
    };

    const auditService = {
      createLog: jest.fn().mockResolvedValue(undefined),
    };

    const service = new EnterpriseMailboxAssignmentService(
      mailboxAssignmentRepository as never,
      mailboxProfileRepository as never,
      mailboxPermissionRepository as never,
      auditService as never,
    );

    const result = await service.assignMailbox({
      workspaceId: 'workspace-id',
      mailboxProfileId: 'mailbox-profile-id',
      workspaceMemberId: 'workspace-member-id',
      assignedByWorkspaceMemberId: 'admin-member-id',
      isPrimaryMailbox: true,
      canReceive: true,
      canSend: true,
      canViewSubordinates: false,
      canHandleSubordinates: false,
      canManageRules: true,
      permissionCodes: ['mail.read', 'mail.send', 'mail.manage_rules'],
    });

    expect(mailboxProfileRepository.findOneByOrFail).toHaveBeenCalledWith({
      id: 'mailbox-profile-id',
      workspaceId: 'workspace-id',
    });
    expect(result.mailboxProfileId).toBe('mailbox-profile-id');
    expect(result.canManageRules).toBe(true);
    expect(mailboxPermissionRepository.save).toHaveBeenCalledTimes(3);
  });
});
