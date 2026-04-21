import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'enterpriseSalesPlaybookItem', schema: 'core' })
@Index('IDX_ENTERPRISE_SALES_PLAYBOOK_ITEM_WORKSPACE_STAGE', [
  'workspaceId',
  'stageId',
])
@Index('IDX_ENTERPRISE_SALES_PLAYBOOK_ITEM_WORKSPACE_ENABLED', [
  'workspaceId',
  'enabled',
])
export class EnterpriseSalesPlaybookItemEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  stageId: string;

  @Column({ type: 'varchar', length: 40 })
  itemType: string;

  @Column({ type: 'varchar', length: 180 })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  attachmentIds: string[];

  @Column({ type: 'jsonb', default: {} })
  suggestionJson: Record<string, unknown>;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
