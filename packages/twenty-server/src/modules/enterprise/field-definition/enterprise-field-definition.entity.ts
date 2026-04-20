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

@Entity({ name: 'enterpriseFieldDefinition', schema: 'core' })
@Unique('IDX_ENTERPRISE_FIELD_DEFINITION_WORKSPACE_ENTITY_CODE_UNIQUE', [
  'workspaceId',
  'entityBindingId',
  'fieldCode',
])
@Index('IDX_ENTERPRISE_FIELD_DEFINITION_WORKSPACE_ENTITY', [
  'workspaceId',
  'entityBindingId',
])
export class EnterpriseFieldDefinitionEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  entityBindingId: string;

  @Column({ type: 'varchar', length: 80 })
  fieldCode: string;

  @Column({ type: 'varchar', length: 160 })
  fieldName: string;

  @Column({ type: 'varchar', length: 40 })
  fieldType: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  groupCode: string | null;

  @Column({ type: 'jsonb', nullable: true })
  visibleInModules: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  validationJson: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  defaultValueJson: unknown;

  @Column({ type: 'boolean', default: false })
  searchable: boolean;

  @Column({ type: 'boolean', default: false })
  exportable: boolean;

  @Column({ type: 'boolean', default: false })
  systemField: boolean;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'varchar', length: 40, default: 'enterprise_eav' })
  storageStrategy: string;

  @Column({ type: 'uuid', nullable: true })
  metadataFieldId: string | null;

  @Column({ type: 'varchar', length: 24, default: 'pending' })
  syncStatus: string;

  @Column({ type: 'text', nullable: true })
  syncErrorMessage: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdByWorkspaceMemberId: string | null;

  @Column({ type: 'uuid', nullable: true })
  updatedByWorkspaceMemberId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
