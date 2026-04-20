import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'enterpriseFieldLayoutConfig', schema: 'core' })
@Index('IDX_ENTERPRISE_FIELD_LAYOUT_WORKSPACE_ENTITY_SCENE_ROLE_FIELD', [
  'workspaceId',
  'entityBindingId',
  'pageScene',
  'roleId',
  'fieldDefinitionId',
], { unique: true })
export class EnterpriseFieldLayoutConfigEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  entityBindingId: string;

  @Column({ type: 'varchar', length: 40 })
  pageScene: string;

  @Column({ type: 'uuid' })
  fieldDefinitionId: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  groupCode: string | null;

  @Column({ type: 'boolean', default: false })
  required: boolean;

  @Column({ type: 'boolean', default: true })
  visible: boolean;

  @Column({ type: 'boolean', default: false })
  readonly: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'uuid', nullable: true })
  roleId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
