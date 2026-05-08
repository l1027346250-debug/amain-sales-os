import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConnectedAccountProvider,
  MessageParticipantRole,
  MessageChannelContactAutoCreationPolicy,
  MessageChannelPendingGroupEmailsAction,
  MessageChannelSyncStage,
  MessageChannelSyncStatus,
  MessageChannelType,
  MessageChannelVisibility,
  MessageFolderImportPolicy,
  MessageFolderPendingSyncAction,
} from 'twenty-shared/types';
import { v4 } from 'uuid';
import { type MessageChannelWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-channel.workspace-entity';
import { type MessageChannelMessageAssociationWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-channel-message-association.workspace-entity';
import { type MessageChannelMessageAssociationMessageFolderWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-channel-message-association-message-folder.workspace-entity';
import { type MessageParticipantWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-participant.workspace-entity';
import { type MessageThreadWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-thread.workspace-entity';
import { type MessageWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message.workspace-entity';
import { MessageDirection } from 'src/modules/messaging/common/enums/message-direction.enum';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';

import { In, Repository } from 'typeorm';

import { ConnectedAccountDataAccessService } from 'src/engine/metadata-modules/connected-account/data-access/services/connected-account-data-access.service';
import { MessageChannelDataAccessService } from 'src/engine/metadata-modules/message-channel/data-access/services/message-channel-data-access.service';
import { MessageFolderDataAccessService } from 'src/engine/metadata-modules/message-folder/data-access/services/message-folder-data-access.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { EnterpriseConfigAuditService } from 'src/modules/enterprise/audit/services/enterprise-config-audit.service';
import { EnterpriseMailboxProfileEntity } from 'src/modules/enterprise/mailbox-control/entities/enterprise-mailbox-profile.entity';
import { EnterpriseMailboxCredentialService } from 'src/modules/enterprise/mailbox-control/services/enterprise-mailbox-credential.service';
import { ImapSmtpCaldavService } from 'src/engine/core-modules/imap-smtp-caldav-connection/services/imap-smtp-caldav-connection.service';
import { ImapSmtpCalDavAPIService } from 'src/modules/connected-account/services/imap-smtp-caldav-apis.service';

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

const LOCAL_DEVELOPMENT_MAILBOX_DOMAIN = '@amaincrm.local';
const LOCAL_DEVELOPMENT_MAILBOX_THREAD_EXTERNAL_IDS = [
  'local-demo-thread-rfq-follow-up',
  'local-demo-thread-pi-shipment',
  'local-demo-thread-trade-show-inquiry',
] as const;

@Injectable()
export class EnterpriseMailboxProfileService {
  constructor(
    @InjectRepository(EnterpriseMailboxProfileEntity)
    private readonly enterpriseMailboxProfileRepository: Repository<EnterpriseMailboxProfileEntity>,
    private readonly enterpriseMailboxCredentialService: EnterpriseMailboxCredentialService,
    private readonly enterpriseConfigAuditService: EnterpriseConfigAuditService,
    private readonly imapSmtpCaldavService: ImapSmtpCaldavService,
    private readonly imapSmtpCalDavAPIService: ImapSmtpCalDavAPIService,
    private readonly connectedAccountDataAccessService: ConnectedAccountDataAccessService,
    private readonly messageChannelDataAccessService: MessageChannelDataAccessService,
    private readonly messageFolderDataAccessService: MessageFolderDataAccessService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
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

  async validateMailboxProfile(
    workspaceId: string,
    mailboxProfileId: string,
    validatedByWorkspaceMemberId?: string | null,
  ) {
    const profile = await this.enterpriseMailboxProfileRepository.findOneByOrFail({
      id: mailboxProfileId,
      workspaceId,
    });
    const secret = await this.enterpriseMailboxCredentialService.resolveSecret(
      profile.credentialRef,
    );
    const mailboxOwnerWorkspaceMemberId =
      validatedByWorkspaceMemberId ??
      profile.updatedByWorkspaceMemberId ??
      profile.createdByWorkspaceMemberId;

    try {
      const isLocalDevelopmentMailbox =
        this.isLocalDevelopmentMailboxProfile(profile);

      if (isLocalDevelopmentMailbox) {
        await this.provisionLocalDevelopmentMailboxProfile({
          workspaceId,
          mailboxOwnerWorkspaceMemberId,
          profile,
          secret,
        });
      } else {
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
      }

      if (mailboxOwnerWorkspaceMemberId) {
        const connectedAccountId = isLocalDevelopmentMailbox
          ? (profile.connectedAccountId ?? null)
          : await this.imapSmtpCalDavAPIService.processAccount({
              handle: profile.emailAddress,
              workspaceId,
              workspaceMemberId: mailboxOwnerWorkspaceMemberId,
              connectedAccountId: profile.connectedAccountId ?? undefined,
              connectionParameters: {
                IMAP: {
                  host: profile.imapHost,
                  port: profile.imapPort,
                  secure: profile.imapSecure,
                  username: profile.loginUsername,
                  password: secret,
                },
                SMTP: {
                  host: profile.smtpHost,
                  port: profile.smtpPort,
                  secure: profile.smtpSecure,
                  username: profile.loginUsername,
                  password: secret,
                },
              },
            });

        if (!isLocalDevelopmentMailbox && connectedAccountId) {
          const messageChannel = await this.messageChannelDataAccessService.findOne(
            workspaceId,
            {
              where: { connectedAccountId },
              relations: ['messageFolders'],
            },
          );

          this.applyMessagingLinkToProfile({
            connectedAccountId,
            messageChannel,
            profile,
          });
        }
      }

      profile.validationStatus = 'validated';
      profile.lastValidatedAt = new Date();
      profile.lastValidationError = null;
      profile.updatedByWorkspaceMemberId =
        validatedByWorkspaceMemberId ?? profile.updatedByWorkspaceMemberId;

      return this.enterpriseMailboxProfileRepository.save(profile);
    } catch (error) {
      profile.validationStatus = 'failed';
      profile.lastValidatedAt = new Date();
      profile.lastValidationError = this.normalizeValidationError(error);
      profile.updatedByWorkspaceMemberId =
        validatedByWorkspaceMemberId ?? profile.updatedByWorkspaceMemberId;

      await this.enterpriseMailboxProfileRepository.save(profile);

      throw error;
    }
  }

  private isLocalDevelopmentMailboxProfile(
    profile: EnterpriseMailboxProfileEntity,
  ) {
    return profile.emailAddress
      .trim()
      .toLowerCase()
      .endsWith(LOCAL_DEVELOPMENT_MAILBOX_DOMAIN);
  }

  private async provisionLocalDevelopmentMailboxProfile(input: {
    workspaceId: string;
    mailboxOwnerWorkspaceMemberId?: string | null;
    profile: EnterpriseMailboxProfileEntity;
    secret: string;
  }) {
    const { mailboxOwnerWorkspaceMemberId, profile, secret, workspaceId } = input;

    if (!mailboxOwnerWorkspaceMemberId) {
      throw new Error(
        'Local development mailbox provisioning requires a mailbox owner workspace member.',
      );
    }

    const messageChannel = await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const existingConnectedAccount =
          (profile.connectedAccountId
            ? await this.connectedAccountDataAccessService.findOne(workspaceId, {
                where: { id: profile.connectedAccountId },
              })
            : null) ??
          (await this.connectedAccountDataAccessService.findOne(workspaceId, {
            where: {
              handle: profile.emailAddress,
              accountOwnerId: mailboxOwnerWorkspaceMemberId,
            },
          }));

        const connectedAccountId = existingConnectedAccount?.id ?? v4();

        await this.connectedAccountDataAccessService.save(workspaceId, {
          id: connectedAccountId,
          handle: profile.emailAddress,
          provider: ConnectedAccountProvider.IMAP_SMTP_CALDAV,
          accountOwnerId: mailboxOwnerWorkspaceMemberId,
          connectionParameters: {
            IMAP: {
              host: profile.imapHost,
              port: profile.imapPort,
              secure: profile.imapSecure,
              username: profile.loginUsername,
              password: secret,
            },
            SMTP: {
              host: profile.smtpHost,
              port: profile.smtpPort,
              secure: profile.smtpSecure,
              username: profile.loginUsername,
              password: secret,
            },
          },
        });

        const existingMessageChannel =
          (profile.messageChannelId
            ? await this.messageChannelDataAccessService.findOne(workspaceId, {
                where: { id: profile.messageChannelId },
                relations: ['messageFolders'],
              })
            : null) ??
          (await this.messageChannelDataAccessService.findOne(workspaceId, {
            where: { connectedAccountId },
            relations: ['messageFolders'],
          }));

        const messageChannelId = existingMessageChannel?.id ?? v4();
        const syncedAt = new Date().toISOString();

        await this.messageChannelDataAccessService.save(workspaceId, {
          id: messageChannelId,
          connectedAccountId,
          type: MessageChannelType.EMAIL,
          handle: profile.emailAddress,
          visibility: MessageChannelVisibility.SHARE_EVERYTHING,
          isContactAutoCreationEnabled: true,
          contactAutoCreationPolicy: MessageChannelContactAutoCreationPolicy.SENT,
          messageFolderImportPolicy: MessageFolderImportPolicy.ALL_FOLDERS,
          excludeNonProfessionalEmails: false,
          excludeGroupEmails: false,
          pendingGroupEmailsAction: MessageChannelPendingGroupEmailsAction.NONE,
          isSyncEnabled: false,
          syncStatus: MessageChannelSyncStatus.ACTIVE,
          syncStage: MessageChannelSyncStage.MESSAGE_LIST_FETCH_PENDING,
          syncedAt,
          syncStageStartedAt: syncedAt,
          throttleFailureCount: 0,
          throttleRetryAfter: null,
        });

        const existingFolders =
          (await this.messageFolderDataAccessService.find(workspaceId, {
            messageChannelId,
          })) ?? [];
        const existingFolderTokens = new Set(
          existingFolders.flatMap((folder) => [
            folder.name?.trim().toLowerCase() ?? '',
            folder.externalId?.trim().toLowerCase() ?? '',
          ]),
        );

        for (const folderDefinition of [
          { externalId: 'inbox', isSentFolder: false, name: 'Inbox' },
          { externalId: 'pending', isSentFolder: false, name: 'Pending' },
          { externalId: 'drafts', isSentFolder: false, name: 'Drafts' },
          { externalId: 'sent', isSentFolder: true, name: 'Sent' },
          { externalId: 'archive', isSentFolder: false, name: 'Archive' },
        ]) {
          if (
            existingFolderTokens.has(folderDefinition.externalId) ||
            existingFolderTokens.has(folderDefinition.name.toLowerCase())
          ) {
            continue;
          }

          await this.messageFolderDataAccessService.save(workspaceId, {
            id: v4(),
            name: folderDefinition.name,
            syncCursor: null,
            isSentFolder: folderDefinition.isSentFolder,
            isSynced: true,
            parentFolderId: null,
            externalId: folderDefinition.externalId,
            pendingSyncAction: MessageFolderPendingSyncAction.NONE,
            messageChannelId,
          });
        }

        const hydratedMessageChannel =
          await this.messageChannelDataAccessService.findOne(workspaceId, {
            where: { id: messageChannelId },
            relations: ['messageFolders'],
          });

        await this.seedLocalDevelopmentMailboxDemoThreads({
          mailboxOwnerWorkspaceMemberId,
          messageChannel: hydratedMessageChannel,
          workspaceId,
        });

        return hydratedMessageChannel;
      },
      buildSystemAuthContext(workspaceId),
      { lite: true },
    );

    this.applyMessagingLinkToProfile({
      connectedAccountId: messageChannel?.connectedAccountId ?? profile.connectedAccountId ?? '',
      messageChannel,
      profile,
    });
  }

  private async seedLocalDevelopmentMailboxDemoThreads(input: {
    workspaceId: string;
    mailboxOwnerWorkspaceMemberId: string;
    messageChannel: MessageChannelWorkspaceEntity | null;
  }) {
    const { mailboxOwnerWorkspaceMemberId, messageChannel, workspaceId } = input;

    if (!messageChannel?.id) {
      return;
    }

    const inboxFolder =
      messageChannel.messageFolders?.find(
        (messageFolder) =>
          messageFolder.externalId?.trim().toLowerCase() === 'inbox' ||
          messageFolder.name?.trim().toLowerCase() === 'inbox',
      ) ?? null;

    if (!inboxFolder?.id) {
      return;
    }

    const associationRepository =
      await this.globalWorkspaceOrmManager.getRepository<MessageChannelMessageAssociationWorkspaceEntity>(
        workspaceId,
        'messageChannelMessageAssociation',
        { shouldBypassPermissionChecks: true },
      );

    const existingAssociations = await associationRepository.find({
      where: {
        messageChannelId: messageChannel.id,
        messageThreadExternalId: In([
          ...LOCAL_DEVELOPMENT_MAILBOX_THREAD_EXTERNAL_IDS,
        ]),
      },
      select: {
        messageThreadExternalId: true,
      },
    });

    const existingExternalIds = new Set(
      existingAssociations
        .map((association) => association.messageThreadExternalId)
        .filter(
          (messageThreadExternalId): messageThreadExternalId is string =>
            typeof messageThreadExternalId === 'string' &&
            messageThreadExternalId.length > 0,
        ),
    );

    const personRepository =
      await this.globalWorkspaceOrmManager.getRepository<PersonWorkspaceEntity>(
        workspaceId,
        'person',
        { shouldBypassPermissionChecks: true },
      );
    const messageThreadRepository =
      await this.globalWorkspaceOrmManager.getRepository<MessageThreadWorkspaceEntity>(
        workspaceId,
        'messageThread',
        { shouldBypassPermissionChecks: true },
      );
    const messageRepository =
      await this.globalWorkspaceOrmManager.getRepository<MessageWorkspaceEntity>(
        workspaceId,
        'message',
        { shouldBypassPermissionChecks: true },
      );
    const messageParticipantRepository =
      await this.globalWorkspaceOrmManager.getRepository<MessageParticipantWorkspaceEntity>(
        workspaceId,
        'messageParticipant',
        { shouldBypassPermissionChecks: true },
      );
    const associationFolderRepository =
      await this.globalWorkspaceOrmManager.getRepository<MessageChannelMessageAssociationMessageFolderWorkspaceEntity>(
        workspaceId,
        'messageChannelMessageAssociationMessageFolder',
        { shouldBypassPermissionChecks: true },
      );

    const people = await personRepository.find({
      order: {
        createdAt: 'ASC',
      },
      select: {
        companyId: true,
        id: true,
      },
      take: 3,
    });

    const linkedPeople = people.filter(
      (person) => typeof person.companyId === 'string' && person.companyId.length > 0,
    );

    const demoThreads = [
      {
        externalThreadId: LOCAL_DEVELOPMENT_MAILBOX_THREAD_EXTERNAL_IDS[0],
        hoursAgo: 72,
        messageExternalId: 'local-demo-message-rfq-follow-up',
        personId: linkedPeople[0]?.id ?? people[0]?.id ?? null,
        senderHandle: 'rfq@vista-manufacturing.example',
        subject: 'RFQ follow-up for surgical lights',
        text: [
          'Hello team,',
          '',
          'Could you send the updated quotation and lead time for the surgical light package we discussed last week?',
          '',
          'We need your reply before our internal procurement review tomorrow.',
          '',
          'Best regards,',
          'VISTA Manufacturing purchasing',
        ].join('\n'),
      },
      {
        externalThreadId: LOCAL_DEVELOPMENT_MAILBOX_THREAD_EXTERNAL_IDS[1],
        hoursAgo: 38,
        messageExternalId: 'local-demo-message-pi-shipment',
        personId: linkedPeople[1]?.id ?? people[1]?.id ?? null,
        senderHandle: 'buyer@eastern-medical.example',
        subject: 'Need PI before Friday shipment',
        text: [
          'Hi,',
          '',
          'Please send the PI and carton dimensions for the Friday shipment.',
          '',
          'We still need to confirm the final packing list before customs cut-off.',
          '',
          'Thanks,',
          'Eastern Medical buyer',
        ].join('\n'),
      },
      {
        externalThreadId: LOCAL_DEVELOPMENT_MAILBOX_THREAD_EXTERNAL_IDS[2],
        hoursAgo: 12,
        messageExternalId: 'local-demo-message-trade-show-inquiry',
        personId: null,
        senderHandle: 'hello@new-hospital-group.example',
        subject: 'New inquiry from Dubai trade show booth',
        text: [
          'Hello,',
          '',
          'We met your colleague at the Dubai trade show and would like the product catalog for ICU pendants.',
          '',
          'Please share your best contact for follow-up.',
          '',
          'Regards,',
          'New Hospital Group',
        ].join('\n'),
      },
    ].filter(
      (demoThread) =>
        !existingExternalIds.has(demoThread.externalThreadId),
    );

    for (const demoThread of demoThreads) {
      const receivedAt = new Date(Date.now() - demoThread.hoursAgo * 60 * 60 * 1000);
      const messageThread = await messageThreadRepository.save(
        messageThreadRepository.create({
          id: v4(),
        }),
      );
      const message = await messageRepository.save(
        messageRepository.create({
          headerMessageId: `<${demoThread.messageExternalId}@amaincrm.local>`,
          id: v4(),
          messageThreadId: messageThread.id,
          receivedAt,
          subject: demoThread.subject,
          text: demoThread.text,
        }),
      );

      await messageParticipantRepository.save(
        messageParticipantRepository.create({
          displayName: demoThread.senderHandle.split('@')[0],
          handle: demoThread.senderHandle,
          id: v4(),
          messageId: message.id,
          personId: demoThread.personId,
          role: MessageParticipantRole.FROM,
          workspaceMemberId: mailboxOwnerWorkspaceMemberId,
        }),
      );

      const association = await associationRepository.save(
        associationRepository.create({
          direction: MessageDirection.INCOMING,
          id: v4(),
          messageChannelId: messageChannel.id,
          messageExternalId: demoThread.messageExternalId,
          messageId: message.id,
          messageThreadExternalId: demoThread.externalThreadId,
        }),
      );

      await associationFolderRepository.save(
        associationFolderRepository.create({
          id: v4(),
          messageChannelMessageAssociationId: association.id,
          messageFolderId: inboxFolder.id,
        }),
      );
    }
  }

  private applyMessagingLinkToProfile({
    connectedAccountId,
    messageChannel,
    profile,
  }: {
    connectedAccountId: string;
    messageChannel: MessageChannelWorkspaceEntity | null;
    profile: EnterpriseMailboxProfileEntity;
  }) {
    profile.connectedAccountId = connectedAccountId;
    profile.messageChannelId = messageChannel?.id ?? null;
    profile.lastSyncStatus = messageChannel?.syncStatus ?? profile.lastSyncStatus;
    profile.lastSyncAt =
      typeof messageChannel?.syncedAt === 'string'
        ? new Date(messageChannel.syncedAt)
        : (messageChannel?.syncedAt ?? profile.lastSyncAt);
  }

  private normalizeValidationError(error: unknown) {
    const rawMessage =
      error instanceof Error ? error.message : String(error ?? 'Validation failed');

    return rawMessage.slice(0, 500);
  }
}
