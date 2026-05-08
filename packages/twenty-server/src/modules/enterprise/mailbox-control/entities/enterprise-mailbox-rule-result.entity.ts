import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'enterpriseMailboxRuleResult', schema: 'core' })
@Index('IDX_ENTERPRISE_MAILBOX_RULE_RESULT_WORKSPACE_RULE_CREATED_AT', [
  'workspaceId',
  'mailboxRuleId',
  'createdAt',
])
@Index('IDX_ENTERPRISE_MAILBOX_RULE_RESULT_WORKSPACE_MAILBOX_CREATED_AT', [
  'workspaceId',
  'mailboxProfileId',
  'createdAt',
])
export class EnterpriseMailboxRuleResultEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  mailboxRuleId: string;

  @Column({ type: 'uuid' })
  mailboxProfileId: string;

  @Column({ type: 'varchar', length: 32 })
  executionType: string;

  @Column({ type: 'varchar', length: 32 })
  outcome: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  threadId: string | null;

  @Column({ type: 'varchar', length: 500 })
  summary: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  failureReason: string | null;

  @Column({ type: 'jsonb', nullable: true })
  matchedSignalsJson: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  plannedActionsJson: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  metadataJson: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
