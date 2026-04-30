import { EnterpriseMailboxProfileService } from 'src/modules/enterprise/mailbox-control/services/enterprise-mailbox-profile.service';

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

    const service = new EnterpriseMailboxProfileService(
      mailboxProfileRepository as never,
      credentialService as never,
      auditService as never,
      imapSmtpCaldavService as never,
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
});
