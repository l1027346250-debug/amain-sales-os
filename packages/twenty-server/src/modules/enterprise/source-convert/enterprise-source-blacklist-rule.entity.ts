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

@Entity({ name: 'enterpriseSourceBlacklistRule', schema: 'core' })
@Unique('IDX_ENTERPRISE_SOURCE_BLACKLIST_WORKSPACE_TYPE_VALUE_UNIQUE', [
  'workspaceId',
  'ruleType',
  'ruleValue',
])
@Index('IDX_ENTERPRISE_SOURCE_BLACKLIST_WORKSPACE_ENABLED', [
  'workspaceId',
  'enabled',
])
export class EnterpriseSourceBlacklistRuleEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 40 })
  ruleType: string;

  @Column({ type: 'varchar', length: 255 })
  ruleValue: string;

  @Column({ type: 'varchar', length: 40, default: 'reject' })
  action: string;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'uuid', nullable: true })
  createdByWorkspaceMemberId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

