import { EnterpriseMailboxRuleService } from 'src/modules/enterprise/mailbox-control/services/enterprise-mailbox-rule.service';

describe('EnterpriseMailboxRuleService', () => {
  const buildGlobalWorkspaceOrmManagerMock = () => ({
    executeInWorkspaceContext: jest
      .fn()
      .mockImplementation(async (fn: () => unknown) => await fn()),
  });

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
    const globalWorkspaceOrmManager = buildGlobalWorkspaceOrmManagerMock();

    const service = new EnterpriseMailboxRuleService(
      mailboxRuleRepository as never,
      mailboxProfileRepository as never,
      mailboxAssignmentRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      messageChannelDataAccessService as never,
      globalWorkspaceOrmManager as never,
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

    const enterpriseMailboxRuleResultRepository = {
      save: jest.fn().mockImplementation(async (input) => input),
      create: jest.fn().mockImplementation((input) => input),
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
      {} as never,
      tradeCrmMailThreadTaskLinkRepository as never,
      enterpriseMailboxRuleResultRepository as never,
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

  it('should execute folder-routing runtime by moving associations to the target folder', async () => {
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

    const associationRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'association-1',
          messageChannelId: 'message-channel-id',
          message: {
            messageThreadId: 'thread-1',
          },
        },
      ]),
    };
    const associationFolderRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'folder-link-1',
          messageChannelMessageAssociationId: 'association-1',
          messageFolderId: 'folder-inbox-id',
        },
      ]),
      delete: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn().mockResolvedValue(undefined),
    };
    const globalWorkspaceOrmManager = {
      executeInWorkspaceContext: jest.fn().mockImplementation(async (fn) => fn()),
      getRepository: jest
        .fn()
        .mockImplementation(async (_workspaceId: string, objectName: string) => {
          if (objectName === 'messageChannelMessageAssociation') {
            return associationRepository;
          }

          if (objectName === 'messageChannelMessageAssociationMessageFolder') {
            return associationFolderRepository;
          }

          throw new Error(`Unexpected repository ${objectName}`);
        }),
    };

    const enterpriseMailboxRuleResultRepository = {
      save: jest.fn().mockImplementation(async (input) => input),
      create: jest.fn().mockImplementation((input) => input),
      find: jest.fn(),
    };

    const messageChannelDataAccessService = {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'message-channel-id',
          handle: 'sales@company.com',
          messageFolders: [
            {
              id: 'folder-inbox-id',
              name: 'INBOX',
              externalId: 'INBOX',
            },
            {
              id: 'folder-vip-id',
              name: 'VIP',
              externalId: 'VIP',
            },
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
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      enterpriseMailboxRuleResultRepository as never,
      messageChannelDataAccessService as never,
      globalWorkspaceOrmManager as never,
      auditService as never,
    );

    jest.spyOn(service, 'findRuleDryRunPreview').mockResolvedValue({
      ruleId: 'rule-id',
      ruleName: 'Route RFQ mail',
      ruleType: 'folder-routing',
      emailAddress: 'sales@company.com',
      status: 'ready',
      warnings: [],
      blockers: [],
      candidateCount: 1,
      candidates: [
        {
          threadId: 'thread-1',
          messageId: 'message-1',
          subject: 'RFQ from buyer',
          senderHandle: 'buyer@buyer.example.com',
          receivedAt: '2026-05-07T09:00:00.000Z',
          pending: false,
          taskLinked: false,
          crmLinked: false,
          matchedSignals: ['Matched folder INBOX'],
          plannedActions: ['Route to VIP', 'Mark as read'],
        },
      ],
    });

    const result = await service.runRuleNow('workspace-id', 'rule-id');

    expect(associationFolderRepository.delete).toHaveBeenCalledWith([
      'folder-link-1',
    ]);
    expect(associationFolderRepository.insert).toHaveBeenCalledWith([
      {
        messageChannelMessageAssociationId: 'association-1',
        messageFolderId: 'folder-vip-id',
      },
    ]);
    expect(enterpriseMailboxRuleResultRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        executionType: 'runtime',
        outcome: 'acted',
        threadId: 'thread-1',
        metadataJson: expect.objectContaining({
          targetFolderId: 'folder-vip-id',
          markAsReadApplied: false,
          unsupportedActions: ['markAsRead'],
        }),
      }),
    );
    expect(result).toEqual({
      executedCount: 1,
      skippedCount: 0,
      unsupported: false,
    });
  });

  it('should execute customer-auto-link runtime by linking thread to person company and latest opportunity', async () => {
    const mailboxRuleRepository = {
      find: jest.fn(),
      findOneByOrFail: jest.fn().mockResolvedValue({
        id: 'rule-id',
        workspaceId: 'workspace-id',
        mailboxProfileId: 'mailbox-profile-id',
        name: 'Auto link known customers',
        ruleType: 'customer-auto-link',
        enabled: true,
        priority: 20,
        conditionsJson: {
          senderDomain: 'buyer.example.com',
          requireKnownContact: true,
        },
        actionsJson: {
          linkToPerson: true,
          linkToCompany: true,
          attachToLatestOpportunity: true,
          createLeadWhenUnmatched: true,
        },
      }),
      save: jest.fn(),
    };

    const personRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'person-1',
          companyId: 'company-1',
        },
      ]),
    };
    const opportunityRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'opportunity-1',
          companyId: 'company-1',
          updatedAt: new Date('2026-05-07T09:00:00.000Z'),
        },
      ]),
    };
    const globalWorkspaceOrmManager = {
      executeInWorkspaceContext: jest.fn().mockImplementation(async (fn) => fn()),
      getRepository: jest
        .fn()
        .mockImplementation(async (_workspaceId: string, objectName: string) => {
          if (objectName === 'person') {
            return personRepository;
          }

          if (objectName === 'opportunity') {
            return opportunityRepository;
          }

          throw new Error(`Unexpected repository ${objectName}`);
        }),
    };

    const enterpriseMailThreadCrmLinkRepository = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockImplementation(async (input) => ({
        id: 'crm-link-1',
        ...input,
      })),
    };
    const enterpriseMailboxRuleResultRepository = {
      save: jest.fn().mockImplementation(async (input) => input),
      create: jest.fn().mockImplementation((input) => input),
      find: jest.fn(),
    };

    const auditService = {
      createLog: jest.fn().mockResolvedValue(undefined),
      findRecentLogsByResourceType: jest.fn(),
    };

    const service = new EnterpriseMailboxRuleService(
      mailboxRuleRepository as never,
      { find: jest.fn().mockResolvedValue([]), findOneByOrFail: jest.fn() } as never,
      {} as never,
      enterpriseMailThreadCrmLinkRepository as never,
      {} as never,
      {} as never,
      {} as never,
      enterpriseMailboxRuleResultRepository as never,
      {} as never,
      globalWorkspaceOrmManager as never,
      auditService as never,
    );

    jest.spyOn(service, 'findRuleDryRunPreview').mockResolvedValue({
      ruleId: 'rule-id',
      ruleName: 'Auto link known customers',
      ruleType: 'customer-auto-link',
      emailAddress: 'sales@company.com',
      status: 'ready',
      warnings: [],
      blockers: [],
      candidateCount: 1,
      candidates: [
        {
          threadId: 'thread-1',
          messageId: 'message-1',
          subject: 'Need quote update',
          senderHandle: 'buyer@buyer.example.com',
          receivedAt: '2026-05-07T09:00:00.000Z',
          pending: false,
          taskLinked: false,
          crmLinked: false,
          matchedSignals: [
            'Matched sender domain buyer.example.com',
            'Matched person person-1',
          ],
          plannedActions: [
            'Link to person',
            'Link to company',
            'Attach to latest opportunity',
            'Create lead when unmatched',
          ],
        },
      ],
    });

    const result = await service.runRuleNow('workspace-id', 'rule-id');

    expect(personRepository.find).toHaveBeenCalled();
    expect(opportunityRepository.find).toHaveBeenCalled();
    expect(enterpriseMailThreadCrmLinkRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'workspace-id',
        threadId: 'thread-1',
        personId: 'person-1',
        companyId: 'company-1',
        opportunityId: 'opportunity-1',
        source: 'rule:customer-auto-link',
      }),
    );
    expect(enterpriseMailboxRuleResultRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        executionType: 'runtime',
        outcome: 'acted',
        threadId: 'thread-1',
        metadataJson: expect.objectContaining({
          personId: 'person-1',
          companyId: 'company-1',
          opportunityId: 'opportunity-1',
          unsupportedActions: ['createLeadWhenUnmatched'],
        }),
      }),
    );
    expect(result).toEqual({
      executedCount: 1,
      skippedCount: 0,
      unsupported: false,
    });
  });

  it('should execute subordinate-escalation runtime by creating a task assigned to the manager handler', async () => {
    const mailboxRuleRepository = {
      find: jest.fn(),
      findOneByOrFail: jest.fn().mockResolvedValue({
        id: 'rule-id',
        workspaceId: 'workspace-id',
        mailboxProfileId: 'mailbox-profile-id',
        name: 'Escalate overdue subordinate mail',
        ruleType: 'subordinate-escalation',
        enabled: true,
        priority: 30,
        conditionsJson: {
          sourceFolder: 'INBOX',
          maxReplyDelayHours: 1,
          onlyAssignedThreads: false,
        },
        actionsJson: {
          createTask: true,
          notifyOwner: true,
          escalateToManager: true,
          reassignToPrimarySender: false,
        },
      }),
      save: jest.fn(),
    };

    const enterpriseMailboxAssignmentRepository = {
      find: jest.fn().mockResolvedValue([
        {
          workspaceMemberId: 'manager-member-id',
          mailboxProfileId: 'mailbox-profile-id',
          assignmentStatus: 'active',
          canHandleSubordinates: true,
          canViewSubordinates: true,
          isPrimaryMailbox: false,
          updatedAt: new Date('2026-05-07T08:00:00.000Z'),
        },
        {
          workspaceMemberId: 'primary-member-id',
          mailboxProfileId: 'mailbox-profile-id',
          assignmentStatus: 'active',
          canHandleSubordinates: false,
          canViewSubordinates: false,
          isPrimaryMailbox: true,
          updatedAt: new Date('2026-05-07T07:00:00.000Z'),
        },
      ]),
    };

    const enterpriseMailThreadCrmLinkRepository = {
      find: jest.fn().mockResolvedValue([
        {
          threadId: 'thread-1',
          companyId: 'company-1',
          personId: 'person-1',
          opportunityId: 'opportunity-1',
        },
      ]),
      save: jest.fn(),
    };
    const tradeCrmMailThreadStateRepository = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 'thread-state-1',
        workspaceId: 'workspace-id',
        threadId: 'thread-1',
        isPending: false,
      }),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const tradeCrmMailThreadTaskLinkRepository = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const taskRepository = {
      create: jest.fn().mockImplementation((input) => input),
      save: jest.fn().mockImplementation(async (input) => ({
        id: 'task-1',
        ...input,
      })),
      findOne: jest.fn(),
    };
    const taskTargetRepository = {
      create: jest.fn().mockImplementation((input) => input),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const globalWorkspaceOrmManager = {
      executeInWorkspaceContext: jest.fn().mockImplementation(async (fn) => fn()),
      getRepository: jest
        .fn()
        .mockImplementation(async (_workspaceId: string, objectName: string) => {
          if (objectName === 'task') {
            return taskRepository;
          }

          if (objectName === 'taskTarget') {
            return taskTargetRepository;
          }

          throw new Error(`Unexpected repository ${objectName}`);
        }),
    };

    const enterpriseMailboxRuleResultRepository = {
      save: jest.fn().mockImplementation(async (input) => input),
      create: jest.fn().mockImplementation((input) => input),
      find: jest.fn(),
    };

    const auditService = {
      createLog: jest.fn().mockResolvedValue(undefined),
      findRecentLogsByResourceType: jest.fn(),
    };

    const service = new EnterpriseMailboxRuleService(
      mailboxRuleRepository as never,
      { find: jest.fn().mockResolvedValue([]), findOneByOrFail: jest.fn() } as never,
      enterpriseMailboxAssignmentRepository as never,
      enterpriseMailThreadCrmLinkRepository as never,
      tradeCrmMailThreadStateRepository as never,
      {} as never,
      tradeCrmMailThreadTaskLinkRepository as never,
      enterpriseMailboxRuleResultRepository as never,
      {} as never,
      globalWorkspaceOrmManager as never,
      auditService as never,
    );

    jest.spyOn(service, 'findRuleDryRunPreview').mockResolvedValue({
      ruleId: 'rule-id',
      ruleName: 'Escalate overdue subordinate mail',
      ruleType: 'subordinate-escalation',
      emailAddress: 'sales@company.com',
      status: 'ready',
      warnings: [],
      blockers: [],
      candidateCount: 1,
      candidates: [
        {
          threadId: 'thread-1',
          messageId: 'message-1',
          subject: 'Escalation candidate',
          senderHandle: 'buyer@buyer.example.com',
          receivedAt: '2026-05-07T00:00:00.000Z',
          pending: false,
          taskLinked: false,
          crmLinked: true,
          matchedSignals: ['Matched folder INBOX'],
          plannedActions: [
            'Create escalation task',
            'Notify current owner',
            'Escalate to manager',
          ],
        },
      ],
    });

    const result = await service.runRuleNow('workspace-id', 'rule-id');

    expect(tradeCrmMailThreadStateRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'thread-state-1',
        workspaceId: 'workspace-id',
        threadId: 'thread-1',
        isPending: true,
      }),
    );
    expect(taskRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        assigneeId: 'manager-member-id',
        title: 'Reply follow-up: Escalation candidate',
      }),
    );
    expect(taskTargetRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task-1',
        targetCompanyId: 'company-1',
        targetPersonId: 'person-1',
        targetOpportunityId: 'opportunity-1',
      }),
    );
    expect(tradeCrmMailThreadTaskLinkRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'workspace-id',
        threadId: 'thread-1',
        taskId: 'task-1',
      }),
    );
    expect(enterpriseMailboxRuleResultRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        executionType: 'runtime',
        outcome: 'acted',
        threadId: 'thread-1',
        metadataJson: expect.objectContaining({
          taskId: 'task-1',
          managerAssigneeId: 'manager-member-id',
          escalationAssigneeId: 'manager-member-id',
          unsupportedActions: ['notifyOwner'],
        }),
      }),
    );
    expect(result).toEqual({
      executedCount: 1,
      skippedCount: 0,
      unsupported: false,
    });
  });
});
