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

@Entity({ name: 'enterpriseMailboxAssignment', schema: 'core' })
@Unique('IDX_ENTERPRISE_MAILBOX_ASSIGNMENT_WORKSPACE_PROFILE_MEMBER_UNIQUE', [
  'workspaceId',
  'mailboxProfileId',
  'workspaceMemberId',
])
@Index('IDX_ENTERPRISE_MAILBOX_ASSIGNMENT_WORKSPACE_MEMBER', [
  'workspaceId',
  'workspaceMemberId',
])
export class EnterpriseMailboxAssignmentEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  mailboxProfileId: string;

  @Column({ type: 'uuid' })
  workspaceMemberId: string;

  @Column({ type: 'uuid', nullable: true })
  assignedByWorkspaceMemberId: string | null;

  @Column({ type: 'varchar', length: 32, default: 'active' })
  assignmentStatus: string;

  @Column({ type: 'boolean', default: false })
  isPrimaryMailbox: boolean;

  @Column({ type: 'boolean', default: true })
  canReceive: boolean;

  @Column({ type: 'boolean', default: true })
  canSend: boolean;

  @Column({ type: 'boolean', default: false })
  canViewSubordinates: boolean;

  @Column({ type: 'boolean', default: false })
  canHandleSubordinates: boolean;

  @Column({ type: 'boolean', default: false })
  canManageRules: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
