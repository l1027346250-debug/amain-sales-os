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

@Entity({ name: 'enterpriseSourceChannel', schema: 'core' })
@Unique('IDX_ENTERPRISE_SOURCE_CHANNEL_WORKSPACE_CATEGORY_CODE_UNIQUE', [
  'workspaceId',
  'categoryCode',
  'sourceCode',
])
@Index('IDX_ENTERPRISE_SOURCE_CHANNEL_WORKSPACE_CATEGORY', [
  'workspaceId',
  'categoryCode',
])
export class EnterpriseSourceChannelEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 80 })
  categoryCode: string;

  @Column({ type: 'varchar', length: 120 })
  sourceCode: string;

  @Column({ type: 'varchar', length: 160 })
  sourceName: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  secondSourceName: string | null;

  @Column({ type: 'boolean', default: true })
  systemSource: boolean;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

