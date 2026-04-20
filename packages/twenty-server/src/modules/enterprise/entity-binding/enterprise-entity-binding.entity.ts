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

@Entity({ name: 'enterpriseEntityBinding', schema: 'core' })
@Unique('IDX_ENTERPRISE_ENTITY_BINDING_WORKSPACE_ENTITY_UNIQUE', [
  'workspaceId',
  'entityType',
])
@Index('IDX_ENTERPRISE_ENTITY_BINDING_WORKSPACE_OBJECT', [
  'workspaceId',
  'objectMetadataId',
])
export class EnterpriseEntityBindingEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  entityType: string;

  @Column({ type: 'uuid' })
  objectMetadataId: string;

  @Column({ type: 'varchar', length: 120 })
  objectNameSingular: string;

  @Column({ type: 'varchar', length: 160 })
  objectNamePlural: string;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
