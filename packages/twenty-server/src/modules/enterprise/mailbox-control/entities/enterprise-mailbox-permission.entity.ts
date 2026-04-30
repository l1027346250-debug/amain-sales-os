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

@Entity({ name: 'enterpriseMailboxPermission', schema: 'core' })
@Unique('IDX_ENTERPRISE_MAILBOX_PERMISSION_ASSIGNMENT_CODE_UNIQUE', [
  'workspaceId',
  'mailboxAssignmentId',
  'permissionCode',
])
@Index('IDX_ENTERPRISE_MAILBOX_PERMISSION_ASSIGNMENT', [
  'workspaceId',
  'mailboxAssignmentId',
])
export class EnterpriseMailboxPermissionEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  mailboxAssignmentId: string;

  @Column({ type: 'varchar', length: 120 })
  permissionCode: string;

  @Column({ type: 'boolean', default: true })
  permissionValue: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
