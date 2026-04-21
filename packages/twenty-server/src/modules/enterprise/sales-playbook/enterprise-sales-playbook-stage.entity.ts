import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'enterpriseSalesPlaybookStage', schema: 'core' })
@Index('IDX_ENTERPRISE_SALES_PLAYBOOK_STAGE_WORKSPACE_PLAYBOOK', [
  'workspaceId',
  'playbookId',
])
@Index('IDX_ENTERPRISE_SALES_PLAYBOOK_STAGE_CODE_UNIQUE', [
  'workspaceId',
  'playbookId',
  'stageCode',
], { unique: true })
export class EnterpriseSalesPlaybookStageEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  playbookId: string;

  @Column({ type: 'varchar', length: 160 })
  stageName: string;

  @Column({ type: 'varchar', length: 120 })
  stageCode: string;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
