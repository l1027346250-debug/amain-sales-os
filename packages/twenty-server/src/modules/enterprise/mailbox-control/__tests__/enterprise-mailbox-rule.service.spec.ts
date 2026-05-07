import { EnterpriseMailboxRuleService } from 'src/modules/enterprise/mailbox-control/services/enterprise-mailbox-rule.service';

describe('EnterpriseMailboxRuleService', () => {
  it('should return mailbox rules with the mailbox email address attached', async () => {
    const mailboxRuleRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'rule-id',
          workspaceId: 'workspace-id',
          mailboxProfileId: 'mailbox-profile-id',
          name: 'Pending reply triage',
          ruleType: 'pending-reply',
          enabled: true,
          priority: 100,
          updatedAt: new Date('2026-05-05T10:00:00.000Z'),
        },
      ]),
      findOneByOrFail: jest.fn(),
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

    const auditService = {
      createLog: jest.fn().mockResolvedValue(undefined),
    };

    const service = new EnterpriseMailboxRuleService(
      mailboxRuleRepository as never,
      mailboxProfileRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      auditService as never,
    );

    const result = await service.findMany('workspace-id');

    expect(result).toEqual([
      expect.objectContaining({
        id: 'rule-id',
        emailAddress: 'sales@company.com',
      }),
    ]);
  });

  it('should update mailbox rule enabled state and write an audit log', async () => {
    const mailboxRuleRepository = {
      find: jest.fn(),
      findOneByOrFail: jest.fn().mockResolvedValue({
        id: 'rule-id',
        workspaceId: 'workspace-id',
        mailboxProfileId: 'mailbox-profile-id',
        name: 'Pending reply triage',
        ruleType: 'pending-reply',
        enabled: true,
        priority: 100,
        actionsJson: null,
        conditionsJson: null,
      }),
      save: jest.fn(async (input) => input),
    };

    const mailboxProfileRepository = {
      find: jest.fn(),
      findOneByOrFail: jest.fn(),
    };

    const auditService = {
      createLog: jest.fn().mockResolvedValue(undefined),
    };

    const service = new EnterpriseMailboxRuleService(
      mailboxRuleRepository as never,
      mailboxProfileRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      auditService as never,
    );

    const result = await service.updateRule({
      id: 'rule-id',
      workspaceId: 'workspace-id',
      enabled: false,
      updatedByWorkspaceMemberId: 'workspace-member-id',
    });

    expect(result.enabled).toBe(false);
    expect(mailboxRuleRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'rule-id',
        enabled: false,
      }),
    );
    expect(auditService.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'enterprise_mailbox_rule.update',
        actorWorkspaceMemberId: 'workspace-member-id',
        resourceId: 'rule-id',
      }),
    );
  });

  it('should update mailbox rule conditions and actions json', async () => {
    const mailboxRuleRepository = {
      find: jest.fn(),
      findOneByOrFail: jest.fn().mockResolvedValue({
        id: 'rule-id',
        workspaceId: 'workspace-id',
        mailboxProfileId: 'mailbox-profile-id',
        name: 'Pending reply triage',
        ruleType: 'pending-reply',
        enabled: true,
        priority: 100,
        actionsJson: {
          createTask: true,
          escalateToManager: false,
        },
        conditionsJson: {
          folder: 'INBOX',
          maxReplyDelayHours: 24,
        },
      }),
      save: jest.fn(async (input) => input),
    };

    const mailboxProfileRepository = {
      find: jest.fn(),
      findOneByOrFail: jest.fn(),
    };

    const auditService = {
      createLog: jest.fn().mockResolvedValue(undefined),
    };

    const service = new EnterpriseMailboxRuleService(
      mailboxRuleRepository as never,
      mailboxProfileRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      auditService as never,
    );

    const result = await service.updateRule({
      id: 'rule-id',
      workspaceId: 'workspace-id',
      updatedByWorkspaceMemberId: 'workspace-member-id',
      conditionsJson: {
        folder: 'VIP',
        maxReplyDelayHours: 6,
      },
      actionsJson: {
        createTask: true,
        escalateToManager: true,
      },
    });

    expect(result.conditionsJson).toEqual({
      folder: 'VIP',
      maxReplyDelayHours: 6,
    });
    expect(result.actionsJson).toEqual({
      createTask: true,
      escalateToManager: true,
    });
    expect(mailboxRuleRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'rule-id',
        conditionsJson: {
          folder: 'VIP',
          maxReplyDelayHours: 6,
        },
        actionsJson: {
          createTask: true,
          escalateToManager: true,
        },
      }),
    );
    expect(auditService.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        contextJson: {
          actionsJson: {
            createTask: true,
            escalateToManager: true,
          },
          conditionsJson: {
            folder: 'VIP',
            maxReplyDelayHours: 6,
          },
        },
      }),
    );
  });

  it('should return recent mailbox rule activity with mailbox email and rule metadata', async () => {
    const mailboxRuleRepository = {
      find: jest.fn(),
      findOneByOrFail: jest.fn(),
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

    const auditService = {
      createLog: jest.fn().mockResolvedValue(undefined),
      findRecentLogsByResourceType: jest.fn().mockResolvedValue([
        {
          id: 'activity-id',
          action: 'enterprise_mailbox_rule.update',
          resourceId: 'rule-id',
          actorWorkspaceMemberId: 'workspace-member-id',
          createdAt: new Date('2026-05-07T09:00:00.000Z'),
          beforeJson: null,
          afterJson: {
            mailboxProfileId: 'mailbox-profile-id',
            name: 'Pending reply triage',
            ruleType: 'pending-reply',
          },
          contextJson: null,
        },
      ]),
    };

    const service = new EnterpriseMailboxRuleService(
      mailboxRuleRepository as never,
      mailboxProfileRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      auditService as never,
    );

    const result = await service.findRecentActivity('workspace-id');

    expect(result).toEqual([
      expect.objectContaining({
        id: 'activity-id',
        action: 'enterprise_mailbox_rule.update',
        emailAddress: 'sales@company.com',
        ruleName: 'Pending reply triage',
        ruleType: 'pending-reply',
      }),
    ]);
  });

  it('should return readiness preview with assignment and folder checks', async () => {
    const mailboxRuleRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'rule-id',
          workspaceId: 'workspace-id',
          mailboxProfileId: 'mailbox-profile-id',
          name: 'VIP folder routing',
          ruleType: 'folder-routing',
          enabled: true,
          priority: 20,
          conditionsJson: {
            sourceFolder: 'INBOX',
          },
          actionsJson: {
            targetFolder: 'VIP',
          },
          updatedAt: new Date('2026-05-07T10:00:00.000Z'),
        },
      ]),
      findOneByOrFail: jest.fn(),
      save: jest.fn(),
    };

    const mailboxProfileRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'mailbox-profile-id',
          emailAddress: 'sales@company.com',
          status: 'active',
          validationStatus: 'validated',
          messageChannelId: 'message-channel-id',
        },
      ]),
      findOneByOrFail: jest.fn(),
    };

    const mailboxAssignmentRepository = {
      find: jest.fn().mockResolvedValue([
        {
          mailboxProfileId: 'mailbox-profile-id',
          workspaceMemberId: 'workspace-member-id',
          assignmentStatus: 'active',
          isPrimaryMailbox: true,
        },
      ]),
    };

    const messageChannelDataAccessService = {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'message-channel-id',
          handle: 'sales@company.com',
          messageFolders: [
            { name: 'INBOX', externalId: 'INBOX' },
            { name: 'VIP', externalId: 'VIP' },
          ],
        },
      ]),
    };

    const auditService = {
      createLog: jest.fn().mockResolvedValue(undefined),
      findRecentLogsByResourceType: jest.fn(),
    };

    const service = new EnterpriseMailboxRuleService(
      mailboxRuleRepository as never,
      mailboxProfileRepository as never,
      mailboxAssignmentRepository as never,
      {} as never,
      {} as never,
      {} as never,
      messageChannelDataAccessService as never,
      {} as never,
      auditService as never,
    );

    const result = await service.findReadinessPreview('workspace-id');

    expect(result).toEqual([
      expect.objectContaining({
        ruleId: 'rule-id',
        status: 'ready',
        emailAddress: 'sales@company.com',
        activeAssignmentCount: 1,
        primaryAssignmentCount: 1,
        sourceFolderExists: true,
        targetFolderExists: true,
        warnings: [],
        blockers: [],
      }),
    ]);
  });

  it('should return dry-run preview candidates for a mailbox rule', async () => {
    const mailboxRuleRepository = {
      find: jest.fn(),
      findOneByOrFail: jest.fn().mockResolvedValue({
        id: 'rule-id',
        workspaceId: 'workspace-id',
        mailboxProfileId: 'mailbox-profile-id',
        name: 'Route RFQ mail',
        ruleType: 'folder-routing',
        enabled: true,
        priority: 10,
        conditionsJson: {
          sourceFolder: 'INBOX',
          senderDomain: 'buyer.example.com',
        },
        actionsJson: {
          targetFolder: 'VIP',
          markAsRead: true,
        },
      }),
      save: jest.fn(),
    };

    const mailboxProfileRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'mailbox-profile-id',
          emailAddress: 'sales@company.com',
          status: 'active',
          validationStatus: 'validated',
          messageChannelId: 'message-channel-id',
        },
      ]),
      findOneByOrFail: jest.fn(),
    };

    const mailboxAssignmentRepository = {
      find: jest.fn().mockResolvedValue([
        {
          mailboxProfileId: 'mailbox-profile-id',
          workspaceMemberId: 'workspace-member-id',
          assignmentStatus: 'active',
          isPrimaryMailbox: true,
        },
      ]),
    };

    const enterpriseMailThreadCrmLinkRepository = {
      find: jest.fn().mockResolvedValue([
        {
          threadId: 'thread-1',
          companyId: null,
          personId: null,
          opportunityId: null,
        },
      ]),
    };

    const tradeCrmMailThreadStateRepository = {
      find: jest.fn().mockResolvedValue([
        {
          threadId: 'thread-1',
          isPending: false,
        },
      ]),
    };

    const tradeCrmMailThreadTaskLinkRepository = {
      find: jest.fn().mockResolvedValue([
        {
          threadId: 'thread-1',
          taskId: 'task-1',
        },
      ]),
    };

    const messageChannelDataAccessService = {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'message-channel-id',
          handle: 'sales@company.com',
          messageFolders: [{ name: 'INBOX', externalId: 'INBOX' }],
        },
      ]),
    };

    const globalWorkspaceOrmManager = {
      executeInWorkspaceContext: jest.fn().mockImplementation(async (fn) => fn()),
      getRepository: jest.fn().mockResolvedValue({
        createQueryBuilder: jest.fn().mockReturnValue({
          distinctOn: jest.fn().mockReturnThis(),
          innerJoin: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          addOrderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([
            {
              threadId: 'thread-1',
              messageId: 'message-1',
              subject: 'RFQ from buyer',
              receivedAt: '2026-05-07T09:00:00.000Z',
              text: 'Need a quote',
              senderHandle: 'buyer@buyer.example.com',
              personId: null,
            },
          ]),
        }),
      }),
    };

    const auditService = {
      createLog: jest.fn().mockResolvedValue(undefined),
      findRecentLogsByResourceType: jest.fn(),
    };

    const service = new EnterpriseMailboxRuleService(
      mailboxRuleRepository as never,
      mailboxProfileRepository as never,
      mailboxAssignmentRepository as never,
      enterpriseMailThreadCrmLinkRepository as never,
      tradeCrmMailThreadStateRepository as never,
      tradeCrmMailThreadTaskLinkRepository as never,
      messageChannelDataAccessService as never,
      globalWorkspaceOrmManager as never,
      auditService as never,
    );

    const result = await service.findRuleDryRunPreview('workspace-id', 'rule-id');

    expect(result).toEqual(
      expect.objectContaining({
        ruleId: 'rule-id',
        candidateCount: 1,
        candidates: [
          expect.objectContaining({
            threadId: 'thread-1',
            senderHandle: 'buyer@buyer.example.com',
            taskLinked: true,
            plannedActions: ['Route to VIP', 'Mark as read'],
          }),
        ],
      }),
    );
  });
});
