import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'enterpriseMailboxProfile', schema: 'core' })
@Unique('IDX_ENTERPRISE_MAILBOX_PROFILE_WORKSPACE_EMAIL_UNIQUE', [
  'workspaceId',
  'emailAddress',
])
@Index('IDX_ENTERPRISE_MAILBOX_PROFILE_WORKSPACE_PROVIDER', [
  'workspaceId',
  'provider',
])
export class EnterpriseMailboxProfileEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 320 })
  emailAddress: string;

  @Column({ type: 'varchar', length: 64, default: 'alibaba-mail' })
  provider: string;

  @Column({ type: 'varchar', length: 32, default: 'imap-smtp' })
  protocolMode: string;

  @Column({ type: 'varchar', length: 255 })
  imapHost: string;

  @Column({ type: 'int' })
  imapPort: number;

  @Column({ type: 'boolean', default: true })
  imapSecure: boolean;

  @Column({ type: 'varchar', length: 255 })
  smtpHost: string;

  @Column({ type: 'int' })
  smtpPort: number;

  @Column({ type: 'boolean', default: true })
  smtpSecure: boolean;

  @Column({ type: 'varchar', length: 320 })
  loginUsername: string;

  @Column({ type: 'varchar', length: 32, default: 'authorization-code' })
  credentialMode: string;

  @Column({ type: 'varchar', length: 500 })
  credentialRef: string;

  @Column({ type: 'varchar', length: 32, default: 'active' })
  status: string;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  validationStatus: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastValidatedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncAt: Date | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  lastSyncStatus: string | null;

  @Column({ type: 'uuid', nullable: true })
  connectedAccountId: string | null;

  @Column({ type: 'uuid', nullable: true })
  messageChannelId: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdByWorkspaceMemberId: string | null;

  @Column({ type: 'uuid', nullable: true })
  updatedByWorkspaceMemberId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
