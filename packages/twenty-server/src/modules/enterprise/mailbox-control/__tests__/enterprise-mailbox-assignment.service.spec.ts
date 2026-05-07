import { EnterpriseMailboxAssignmentService } from 'src/modules/enterprise/mailbox-control/services/enterprise-mailbox-assignment.service';

describe('EnterpriseMailboxAssignmentService', () => {
  it('should validate substrate account linkage and assign mailbox permissions to a workspace member', async () => {
    const mailboxAssignmentRepository = {
      create: jest.fn((input) => ({
        id: 'assignment-id',
        ...input,
      })),
      find: jest.fn().mockResolvedValue([]),
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
      delete: jest.fn().mockResolvedValue(undefined),
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

  it('should return assignment snapshots with mailbox email and permission codes', async () => {
    const mailboxAssignmentRepository = {
      create: jest.fn(),
      find: jest.fn().mockResolvedValue([
        {
          id: 'assignment-id',
          workspaceId: 'workspace-id',
          mailboxProfileId: 'mailbox-profile-id',
          workspaceMemberId: 'workspace-member-id',
          assignmentStatus: 'active',
          canReceive: true,
          canSend: true,
          canManageRules: false,
          updatedAt: new Date('2026-04-30T10:00:00.000Z'),
        },
      ]),
      save: jest.fn(),
    };

    const mailboxProfileRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'mailbox-profile-id',
          emailAddress: 'sales@company.com',
        },
      ]),
      findOneByOrFail: jest.fn(),
    };

    const mailboxPermissionRepository = {
      create: jest.fn(),
      delete: jest.fn(),
      find: jest.fn().mockResolvedValue([
        {
          mailboxAssignmentId: 'assignment-id',
          permissionCode: 'mail.read',
          permissionValue: true,
        },
        {
          mailboxAssignmentId: 'assignment-id',
          permissionCode: 'mail.send',
          permissionValue: true,
        },
      ]),
      save: jest.fn(),
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

    const result = await service.findMany('workspace-id');

    expect(mailboxAssignmentRepository.find).toHaveBeenCalledWith({
      order: { updatedAt: 'DESC' },
      where: { workspaceId: 'workspace-id' },
    });
    expect(result).toEqual([
      expect.objectContaining({
        id: 'assignment-id',
        emailAddress: 'sales@company.com',
        permissionCodes: ['mail.read', 'mail.send'],
      }),
    ]);
  });

  it('should update assignment permissions and subordinate controls', async () => {
    const mailboxAssignmentRepository = {
      create: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      findOneByOrFail: jest.fn().mockResolvedValue({
        id: 'assignment-id',
        workspaceId: 'workspace-id',
        mailboxProfileId: 'mailbox-profile-id',
        workspaceMemberId: 'workspace-member-id',
        isPrimaryMailbox: false,
        canReceive: true,
        canSend: true,
        canViewSubordinates: false,
        canHandleSubordinates: false,
        canManageRules: false,
      }),
      save: jest.fn(async (input) => input),
    };

    const mailboxProfileRepository = {
      find: jest.fn(),
      findOneByOrFail: jest.fn(),
    };

    const mailboxPermissionRepository = {
      create: jest.fn((input) => input),
      delete: jest.fn().mockResolvedValue(undefined),
      find: jest.fn().mockResolvedValue([
        {
          mailboxAssignmentId: 'assignment-id',
          permissionCode: 'mail.read',
          permissionValue: true,
        },
      ]),
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

    const result = await service.updateMailboxAssignment({
      id: 'assignment-id',
      workspaceId: 'workspace-id',
      updatedByWorkspaceMemberId: 'admin-member-id',
      canViewSubordinates: true,
      canHandleSubordinates: true,
      canManageRules: true,
      permissionCodes: ['mail.read', 'mail.send', 'mail.forward'],
    });

    expect(result.canManageRules).toBe(true);
    expect(result.canViewSubordinates).toBe(true);
    expect(mailboxPermissionRepository.delete).toHaveBeenCalledWith({
      mailboxAssignmentId: 'assignment-id',
      workspaceId: 'workspace-id',
    });
    expect(mailboxPermissionRepository.save).toHaveBeenCalledTimes(3);
    expect(auditService.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'enterprise_mailbox_assignment.update',
        resourceId: 'assignment-id',
      }),
    );
  });

  it('should update assignment status between active and suspended', async () => {
    const mailboxAssignmentRepository = {
      create: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      findOneByOrFail: jest.fn().mockResolvedValue({
        id: 'assignment-id',
        workspaceId: 'workspace-id',
        mailboxProfileId: 'mailbox-profile-id',
        workspaceMemberId: 'workspace-member-id',
        assignmentStatus: 'active',
        isPrimaryMailbox: false,
        canReceive: true,
        canSend: true,
        canViewSubordinates: false,
        canHandleSubordinates: false,
        canManageRules: false,
      }),
      save: jest.fn(async (input) => input),
    };

    const mailboxProfileRepository = {
      find: jest.fn(),
      findOneByOrFail: jest.fn(),
    };

    const mailboxPermissionRepository = {
      create: jest.fn((input) => input),
      delete: jest.fn().mockResolvedValue(undefined),
      find: jest.fn().mockResolvedValue([]),
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

    const result = await service.updateMailboxAssignment({
      id: 'assignment-id',
      workspaceId: 'workspace-id',
      updatedByWorkspaceMemberId: 'admin-member-id',
      assignmentStatus: 'suspended',
    });

    expect(result.assignmentStatus).toBe('suspended');
    expect(mailboxAssignmentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        assignmentStatus: 'suspended',
      }),
    );
    expect(auditService.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'enterprise_mailbox_assignment.update',
        afterJson: expect.objectContaining({
          assignmentStatus: 'suspended',
        }),
      }),
    );
  });

  it('should reject assigning a second active primary mailbox to the same workspace member', async () => {
    const mailboxAssignmentRepository = {
      create: jest.fn(),
      find: jest.fn().mockResolvedValue([
        {
          id: 'assignment-existing',
          workspaceId: 'workspace-id',
          mailboxProfileId: 'mailbox-profile-existing',
          workspaceMemberId: 'workspace-member-id',
          assignmentStatus: 'active',
          isPrimaryMailbox: true,
        },
      ]),
      save: jest.fn(async (input) => input),
    };

    const mailboxProfileRepository = {
      findOneByOrFail: jest.fn().mockResolvedValue({
        id: 'mailbox-profile-id',
        workspaceId: 'workspace-id',
      }),
    };

    const mailboxPermissionRepository = {
      create: jest.fn((input) => input),
      delete: jest.fn().mockResolvedValue(undefined),
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

    await expect(
      service.assignMailbox({
        workspaceId: 'workspace-id',
        mailboxProfileId: 'mailbox-profile-id',
        workspaceMemberId: 'workspace-member-id',
        isPrimaryMailbox: true,
      }),
    ).rejects.toThrow(
      'Workspace member already has an active primary mailbox assignment',
    );

    expect(mailboxAssignmentRepository.save).not.toHaveBeenCalled();
  });

  it('should reject reactivating a suspended primary mailbox when another primary mailbox is active', async () => {
    const mailboxAssignmentRepository = {
      create: jest.fn(),
      find: jest.fn().mockResolvedValue([
        {
          id: 'assignment-active-primary',
          workspaceId: 'workspace-id',
          mailboxProfileId: 'mailbox-profile-id-2',
          workspaceMemberId: 'workspace-member-id',
          assignmentStatus: 'active',
          isPrimaryMailbox: true,
        },
      ]),
      findOneByOrFail: jest.fn().mockResolvedValue({
        id: 'assignment-id',
        workspaceId: 'workspace-id',
        mailboxProfileId: 'mailbox-profile-id-1',
        workspaceMemberId: 'workspace-member-id',
        assignmentStatus: 'suspended',
        isPrimaryMailbox: true,
        canReceive: true,
        canSend: true,
        canViewSubordinates: false,
        canHandleSubordinates: false,
        canManageRules: false,
      }),
      save: jest.fn(async (input) => input),
    };

    const mailboxProfileRepository = {
      find: jest.fn(),
      findOneByOrFail: jest.fn(),
    };

    const mailboxPermissionRepository = {
      create: jest.fn((input) => input),
      delete: jest.fn().mockResolvedValue(undefined),
      find: jest.fn().mockResolvedValue([]),
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

    await expect(
      service.updateMailboxAssignment({
        id: 'assignment-id',
        workspaceId: 'workspace-id',
        updatedByWorkspaceMemberId: 'admin-member-id',
        assignmentStatus: 'active',
      }),
    ).rejects.toThrow(
      'Workspace member already has an active primary mailbox assignment',
    );

    expect(mailboxAssignmentRepository.save).not.toHaveBeenCalled();
  });
});
