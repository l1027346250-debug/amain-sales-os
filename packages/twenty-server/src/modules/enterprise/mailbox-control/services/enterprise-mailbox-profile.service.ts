import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { EnterpriseConfigAuditService } from 'src/modules/enterprise/audit/services/enterprise-config-audit.service';
import { EnterpriseMailboxProfileEntity } from 'src/modules/enterprise/mailbox-control/entities/enterprise-mailbox-profile.entity';
import { EnterpriseMailboxCredentialService } from 'src/modules/enterprise/mailbox-control/services/enterprise-mailbox-credential.service';
import { ImapSmtpCaldavService } from 'src/engine/core-modules/imap-smtp-caldav-connection/services/imap-smtp-caldav-connection.service';

type CreateEnterpriseMailboxProfileInput = {
  workspaceId: string;
  createdByWorkspaceMemberId?: string | null;
  emailAddress: string;
  provider: string;
  credentialMode: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  loginUsername: string;
  secret: string;
};

@Injectable()
export class EnterpriseMailboxProfileService {
  constructor(
    @InjectRepository(EnterpriseMailboxProfileEntity)
    private readonly enterpriseMailboxProfileRepository: Repository<EnterpriseMailboxProfileEntity>,
    private readonly enterpriseMailboxCredentialService: EnterpriseMailboxCredentialService,
    private readonly enterpriseConfigAuditService: EnterpriseConfigAuditService,
    private readonly imapSmtpCaldavService: ImapSmtpCaldavService,
  ) {}

  async createMailboxProfile(input: CreateEnterpriseMailboxProfileInput) {
    const credentialRef =
      await this.enterpriseMailboxCredentialService.storeSecret({
        key: input.emailAddress,
        secret: input.secret,
        workspaceId: input.workspaceId,
      });

    const profile = this.enterpriseMailboxProfileRepository.create({
      workspaceId: input.workspaceId,
      emailAddress: input.emailAddress,
      provider: input.provider,
      protocolMode: 'imap-smtp',
      imapHost: input.imapHost,
      imapPort: input.imapPort,
      imapSecure: input.imapSecure,
      smtpHost: input.smtpHost,
      smtpPort: input.smtpPort,
      smtpSecure: input.smtpSecure,
      loginUsername: input.loginUsername,
      credentialMode: input.credentialMode,
      credentialRef,
      status: 'active',
      validationStatus: 'pending',
      lastValidatedAt: null,
      lastSyncAt: null,
      lastSyncStatus: null,
      connectedAccountId: null,
      messageChannelId: null,
      createdByWorkspaceMemberId: input.createdByWorkspaceMemberId ?? null,
      updatedByWorkspaceMemberId: input.createdByWorkspaceMemberId ?? null,
    });

    const savedProfile =
      await this.enterpriseMailboxProfileRepository.save(profile);

    await this.enterpriseConfigAuditService.createLog({
      workspaceId: input.workspaceId,
      action: 'enterprise_mailbox_profile.create',
      resourceType: 'enterpriseMailboxProfile',
      resourceId: savedProfile.id,
      actorWorkspaceMemberId: input.createdByWorkspaceMemberId ?? null,
      afterJson: {
        emailAddress: savedProfile.emailAddress,
        provider: savedProfile.provider,
        credentialMode: savedProfile.credentialMode,
      },
    });

    return savedProfile;
  }

  async findMany(workspaceId: string) {
    return this.enterpriseMailboxProfileRepository.find({
      order: { updatedAt: 'DESC' },
      where: { workspaceId },
    });
  }

  async validateMailboxProfile(workspaceId: string, mailboxProfileId: string) {
    const profile = await this.enterpriseMailboxProfileRepository.findOneByOrFail({
      id: mailboxProfileId,
      workspaceId,
    });
    const secret = await this.enterpriseMailboxCredentialService.resolveSecret(
      profile.credentialRef,
    );

    await this.imapSmtpCaldavService.testImapConnection(profile.emailAddress, {
      host: profile.imapHost,
      password: secret,
      port: profile.imapPort,
      secure: profile.imapSecure,
      username: profile.loginUsername,
    });

    await this.imapSmtpCaldavService.testSmtpConnection(profile.emailAddress, {
      host: profile.smtpHost,
      password: secret,
      port: profile.smtpPort,
      secure: profile.smtpSecure,
      username: profile.loginUsername,
    });

    profile.validationStatus = 'validated';
    profile.lastValidatedAt = new Date();

    return this.enterpriseMailboxProfileRepository.save(profile);
  }
}
