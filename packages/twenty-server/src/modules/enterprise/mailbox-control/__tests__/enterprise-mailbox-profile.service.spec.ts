import { EnterpriseMailboxProfileService } from 'src/modules/enterprise/mailbox-control/services/enterprise-mailbox-profile.service';

jest.mock(
  'src/engine/metadata-modules/message-channel/data-access/services/message-channel-data-access.service',
  () => ({
    MessageChannelDataAccessService: class MessageChannelDataAccessService {},
  }),
);
jest.mock(
  'src/engine/core-modules/imap-smtp-caldav-connection/services/imap-smtp-caldav-connection.service',
  () => ({
    ImapSmtpCaldavService: class ImapSmtpCaldavService {},
  }),
);
jest.mock('src/modules/connected-account/services/imap-smtp-caldav-apis.service', () => ({
  ImapSmtpCalDavAPIService: class ImapSmtpCalDavAPIService {},
}));

describe('EnterpriseMailboxProfileService', () => {
  it('should persist an Alibaba mailbox profile with a credential reference and no plaintext secret in the response', async () => {
    const mailboxProfileRepository = {
      create: jest.fn((input) => ({
        id: 'mailbox-profile-id',
        ...input,
      })),
      save: jest.fn(async (input) => input),
    };

    const credentialService = {
      storeSecret: jest.fn().mockResolvedValue('credential-ref-1'),
    };

    const auditService = {
      createLog: jest.fn().mockResolvedValue(undefined),
    };

    const imapSmtpCaldavService = {
      testImapConnection: jest.fn(),
      testSmtpConnection: jest.fn(),
    };
    const imapSmtpCalDavAPIService = {
      processAccount: jest.fn(),
    };
    const messageChannelDataAccessService = {
      findOne: jest.fn(),
    };
    const connectedAccountDataAccessService = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    const messageFolderDataAccessService = {
      find: jest.fn(),
      save: jest.fn(),
    };
    const globalWorkspaceOrmManager = {
      executeInWorkspaceContext: jest.fn(async (callback) => callback()),
    };

    const service = new EnterpriseMailboxProfileService(
      mailboxProfileRepository as never,
      credentialService as never,
      auditService as never,
      imapSmtpCaldavService as never,
      imapSmtpCalDavAPIService as never,
      connectedAccountDataAccessService as never,
      messageChannelDataAccessService as never,
      messageFolderDataAccessService as never,
      globalWorkspaceOrmManager as never,
    );

    const result = await service.createMailboxProfile({
      workspaceId: 'workspace-id',
      createdByWorkspaceMemberId: 'workspace-member-id',
      emailAddress: 'sales@company.com',
      provider: 'alibaba-mail',
      credentialMode: 'authorization-code',
      imapHost: 'imap.qiye.aliyun.com',
      imapPort: 993,
      imapSecure: true,
      smtpHost: 'smtp.qiye.aliyun.com',
      smtpPort: 465,
      smtpSecure: true,
      loginUsername: 'sales@company.com',
      secret: 'top-secret',
    });

    expect(credentialService.storeSecret).toHaveBeenCalledWith({
      key: 'sales@company.com',
      secret: 'top-secret',
      workspaceId: 'workspace-id',
    });
    expect(result.provider).toBe('alibaba-mail');
    expect(result.credentialRef).toBe('credential-ref-1');
    expect(result).not.toHaveProperty('secret');
  });

  it('should validate mailbox profile and attach connected account plus message channel ids', async () => {
    const profile = {
      id: 'mailbox-profile-id',
      workspaceId: 'workspace-id',
      emailAddress: 'sales@company.com',
      loginUsername: 'sales@company.com',
      credentialRef: 'credential-ref-1',
      imapHost: 'imap.qiye.aliyun.com',
      imapPort: 993,
      imapSecure: true,
      smtpHost: 'smtp.qiye.aliyun.com',
      smtpPort: 465,
      smtpSecure: true,
      createdByWorkspaceMemberId: 'workspace-member-id',
      updatedByWorkspaceMemberId: null,
      connectedAccountId: null,
      messageChannelId: null,
      lastSyncAt: null,
      lastSyncStatus: null,
      lastValidationError: null,
      validationStatus: 'pending',
      lastValidatedAt: null,
    };
    const mailboxProfileRepository = {
      create: jest.fn(),
      save: jest.fn(async (input) => input),
      findOneByOrFail: jest.fn().mockResolvedValue(profile),
    };
    const credentialService = {
      storeSecret: jest.fn(),
      resolveSecret: jest.fn().mockResolvedValue('top-secret'),
    };
    const auditService = {
      createLog: jest.fn().mockResolvedValue(undefined),
    };
    const imapSmtpCaldavService = {
      testImapConnection: jest.fn().mockResolvedValue(undefined),
      testSmtpConnection: jest.fn().mockResolvedValue(undefined),
    };
    const imapSmtpCalDavAPIService = {
      processAccount: jest.fn().mockResolvedValue('connected-account-id'),
    };
    const messageChannelDataAccessService = {
      findOne: jest.fn().mockResolvedValue({
        id: 'message-channel-id',
        syncStatus: 'ACTIVE',
        syncedAt: new Date('2026-05-07T12:00:00.000Z'),
      }),
    };
    const connectedAccountDataAccessService = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    const messageFolderDataAccessService = {
      find: jest.fn(),
      save: jest.fn(),
    };
    const globalWorkspaceOrmManager = {
      executeInWorkspaceContext: jest.fn(async (callback) => callback()),
    };

    const service = new EnterpriseMailboxProfileService(
      mailboxProfileRepository as never,
      credentialService as never,
      auditService as never,
      imapSmtpCaldavService as never,
      imapSmtpCalDavAPIService as never,
      connectedAccountDataAccessService as never,
      messageChannelDataAccessService as never,
      messageFolderDataAccessService as never,
      globalWorkspaceOrmManager as never,
    );

    const result = await service.validateMailboxProfile(
      'workspace-id',
      'mailbox-profile-id',
      'workspace-member-id',
    );

    expect(credentialService.resolveSecret).toHaveBeenCalledWith(
      'credential-ref-1',
    );
    expect(imapSmtpCalDavAPIService.processAccount).toHaveBeenCalledWith({
      handle: 'sales@company.com',
      workspaceId: 'workspace-id',
      workspaceMemberId: 'workspace-member-id',
      connectedAccountId: undefined,
      connectionParameters: {
        IMAP: {
          host: 'imap.qiye.aliyun.com',
          port: 993,
          secure: true,
          username: 'sales@company.com',
          password: 'top-secret',
        },
        SMTP: {
          host: 'smtp.qiye.aliyun.com',
          port: 465,
          secure: true,
          username: 'sales@company.com',
          password: 'top-secret',
        },
      },
    });
    expect(messageChannelDataAccessService.findOne).toHaveBeenCalledWith(
      'workspace-id',
      {
        where: { connectedAccountId: 'connected-account-id' },
        relations: ['messageFolders'],
      },
    );
    expect(result.connectedAccountId).toBe('connected-account-id');
    expect(result.messageChannelId).toBe('message-channel-id');
    expect(result.lastSyncStatus).toBe('ACTIVE');
    expect(result.validationStatus).toBe('validated');
    expect(result.lastValidationError).toBeNull();
  });

  it('should persist validation failure diagnostics when mailbox verification fails', async () => {
    const profile = {
      id: 'mailbox-profile-id',
      workspaceId: 'workspace-id',
      emailAddress: 'sales@company.com',
      loginUsername: 'sales@company.com',
      credentialRef: 'credential-ref-1',
      imapHost: 'imap.qiye.aliyun.com',
      imapPort: 993,
      imapSecure: true,
      smtpHost: 'smtp.qiye.aliyun.com',
      smtpPort: 465,
      smtpSecure: true,
      createdByWorkspaceMemberId: 'workspace-member-id',
      updatedByWorkspaceMemberId: null,
      connectedAccountId: null,
      messageChannelId: null,
      lastSyncAt: null,
      lastSyncStatus: null,
      lastValidationError: null,
      validationStatus: 'pending',
      lastValidatedAt: null,
    };
    const mailboxProfileRepository = {
      create: jest.fn(),
      save: jest.fn(async (input) => input),
      findOneByOrFail: jest.fn().mockResolvedValue(profile),
    };
    const credentialService = {
      storeSecret: jest.fn(),
      resolveSecret: jest.fn().mockResolvedValue('top-secret'),
    };
    const auditService = {
      createLog: jest.fn().mockResolvedValue(undefined),
    };
    const imapSmtpCaldavService = {
      testImapConnection: jest
        .fn()
        .mockRejectedValue(new Error('Invalid Alibaba IMAP authorization code')),
      testSmtpConnection: jest.fn(),
    };
    const imapSmtpCalDavAPIService = {
      processAccount: jest.fn(),
    };
    const messageChannelDataAccessService = {
      findOne: jest.fn(),
    };
    const connectedAccountDataAccessService = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    const messageFolderDataAccessService = {
      find: jest.fn(),
      save: jest.fn(),
    };
    const globalWorkspaceOrmManager = {
      executeInWorkspaceContext: jest.fn(async (callback) => callback()),
    };

    const service = new EnterpriseMailboxProfileService(
      mailboxProfileRepository as never,
      credentialService as never,
      auditService as never,
      imapSmtpCaldavService as never,
      imapSmtpCalDavAPIService as never,
      connectedAccountDataAccessService as never,
      messageChannelDataAccessService as never,
      messageFolderDataAccessService as never,
      globalWorkspaceOrmManager as never,
    );

    await expect(
      service.validateMailboxProfile(
        'workspace-id',
        'mailbox-profile-id',
        'workspace-member-id',
      ),
    ).rejects.toThrow('Invalid Alibaba IMAP authorization code');

    expect(mailboxProfileRepository.save).toHaveBeenCalled();
    expect(profile.validationStatus).toBe('failed');
    expect(profile.lastValidationError).toBe(
      'Invalid Alibaba IMAP authorization code',
    );
    expect(imapSmtpCalDavAPIService.processAccount).not.toHaveBeenCalled();
  });

  it('should provision a local development mailbox without external IMAP or SMTP checks', async () => {
    const profile = {
      id: 'mailbox-profile-id',
      workspaceId: 'workspace-id',
      emailAddress: 'sales.alibaba.demo@amaincrm.local',
      loginUsername: 'sales.alibaba.demo@amaincrm.local',
      credentialRef: 'credential-ref-1',
      imapHost: 'imap.qiye.aliyun.com',
      imapPort: 993,
      imapSecure: true,
      smtpHost: 'smtp.qiye.aliyun.com',
      smtpPort: 465,
      smtpSecure: true,
      createdByWorkspaceMemberId: 'workspace-member-id',
      updatedByWorkspaceMemberId: null,
      connectedAccountId: null,
      messageChannelId: null,
      lastSyncAt: null,
      lastSyncStatus: null,
      lastValidationError: null,
      validationStatus: 'pending',
      lastValidatedAt: null,
    };
    const mailboxProfileRepository = {
      create: jest.fn(),
      save: jest.fn(async (input) => input),
      findOneByOrFail: jest.fn().mockResolvedValue(profile),
    };
    const credentialService = {
      storeSecret: jest.fn(),
      resolveSecret: jest.fn().mockResolvedValue('top-secret'),
    };
    const auditService = {
      createLog: jest.fn().mockResolvedValue(undefined),
    };
    const imapSmtpCaldavService = {
      testImapConnection: jest.fn(),
      testSmtpConnection: jest.fn(),
    };
    const imapSmtpCalDavAPIService = {
      processAccount: jest.fn(),
    };
    const connectedAccountDataAccessService = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const messageChannelDataAccessService = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'message-channel-id',
          syncStatus: 'ACTIVE',
          syncedAt: '2026-05-08T08:00:00.000Z',
          messageFolders: [],
        })
        .mockResolvedValueOnce({
          id: 'message-channel-id',
          syncStatus: 'ACTIVE',
          syncedAt: '2026-05-08T08:00:00.000Z',
          messageFolders: [
            {
              externalId: 'inbox',
              id: 'folder-inbox-id',
              name: 'Inbox',
            },
          ],
        }),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const messageFolderDataAccessService = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const associationRepository = {
      create: jest.fn((input) => input),
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(async (input) => ({
        id: input.id ?? 'association-id',
        ...input,
      })),
    };
    const associationFolderRepository = {
      create: jest.fn((input) => input),
      save: jest.fn(async (input) => input),
    };
    const messageParticipantRepository = {
      create: jest.fn((input) => input),
      save: jest.fn(async (input) => input),
    };
    const messageRepository = {
      create: jest.fn((input) => input),
      save: jest.fn(async (input) => ({
        id: input.id ?? 'message-id',
        ...input,
      })),
    };
    const messageThreadRepository = {
      create: jest.fn((input) => input),
      save: jest.fn(async (input) => ({
        id: input.id ?? 'thread-id',
        ...input,
      })),
    };
    const personRepository = {
      find: jest.fn().mockResolvedValue([
        {
          companyId: 'company-1',
          id: 'person-1',
        },
        {
          companyId: 'company-2',
          id: 'person-2',
        },
      ]),
    };
    const globalWorkspaceOrmManager = {
      executeInWorkspaceContext: jest.fn(async (callback) => callback()),
      getRepository: jest.fn(async (_workspaceId, objectMetadataName) => {
        switch (objectMetadataName) {
          case 'messageChannelMessageAssociation':
            return associationRepository;
          case 'messageChannelMessageAssociationMessageFolder':
            return associationFolderRepository;
          case 'messageParticipant':
            return messageParticipantRepository;
          case 'message':
            return messageRepository;
          case 'messageThread':
            return messageThreadRepository;
          case 'person':
            return personRepository;
          default:
            throw new Error(`Unexpected repository request: ${objectMetadataName}`);
        }
      }),
    };

    const service = new EnterpriseMailboxProfileService(
      mailboxProfileRepository as never,
      credentialService as never,
      auditService as never,
      imapSmtpCaldavService as never,
      imapSmtpCalDavAPIService as never,
      connectedAccountDataAccessService as never,
      messageChannelDataAccessService as never,
      messageFolderDataAccessService as never,
      globalWorkspaceOrmManager as never,
    );

    const result = await service.validateMailboxProfile(
      'workspace-id',
      'mailbox-profile-id',
      'workspace-member-id',
    );

    expect(imapSmtpCaldavService.testImapConnection).not.toHaveBeenCalled();
    expect(imapSmtpCaldavService.testSmtpConnection).not.toHaveBeenCalled();
    expect(imapSmtpCalDavAPIService.processAccount).not.toHaveBeenCalled();
    expect(connectedAccountDataAccessService.save).toHaveBeenCalled();
    expect(messageChannelDataAccessService.save).toHaveBeenCalled();
    expect(messageFolderDataAccessService.save).toHaveBeenCalledTimes(5);
    expect(result.messageChannelId).toBe('message-channel-id');
    expect(result.validationStatus).toBe('validated');
    expect(result.lastValidationError).toBeNull();
  });
});
