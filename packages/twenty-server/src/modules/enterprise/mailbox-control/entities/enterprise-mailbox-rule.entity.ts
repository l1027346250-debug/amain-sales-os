import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'enterpriseMailboxRule', schema: 'core' })
@Index('IDX_ENTERPRISE_MAILBOX_RULE_WORKSPACE_PROFILE', [
  'workspaceId',
  'mailboxProfileId',
])
export class EnterpriseMailboxRuleEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  mailboxProfileId: string;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'varchar', length: 64 })
  ruleType: string;

  @Column({ type: 'jsonb', nullable: true })
  conditionsJson: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  actionsJson: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'uuid', nullable: true })
  createdByWorkspaceMemberId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
