import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'enterpriseSourceConvertRule', schema: 'core' })
@Index('IDX_ENTERPRISE_SOURCE_CONVERT_RULE_WORKSPACE_CHANNEL', [
  'workspaceId',
  'sourceChannelId',
])
export class EnterpriseSourceConvertRuleEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sourceChannelId: string;

  @Column({ type: 'varchar', length: 30 })
  depositEntityType: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  targetLeadStatus: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  targetCustomerStage: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  autoTagIds: string[];

  @Column({ type: 'boolean', default: true })
  includeFunnelStats: boolean;

  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @Column({ type: 'jsonb', nullable: true })
  ruleJson: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true })
  ruleEditedByWorkspaceMemberId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  ruleEditedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  dataSyncedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

