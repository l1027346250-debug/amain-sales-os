import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'enterpriseFieldValue', schema: 'core' })
@Index('IDX_ENTERPRISE_FIELD_VALUE_WORKSPACE_ENTITY_RECORD_FIELD', [
  'workspaceId',
  'entityBindingId',
  'recordId',
  'fieldDefinitionId',
], { unique: true })
@Index('IDX_ENTERPRISE_FIELD_VALUE_WORKSPACE_ENTITY_RECORD', [
  'workspaceId',
  'entityBindingId',
  'recordId',
])
@Index('IDX_ENTERPRISE_FIELD_VALUE_WORKSPACE_FIELD_STRING', [
  'workspaceId',
  'fieldDefinitionId',
  'valueString',
])
@Index('IDX_ENTERPRISE_FIELD_VALUE_WORKSPACE_FIELD_NUMBER', [
  'workspaceId',
  'fieldDefinitionId',
  'valueNumber',
])
@Index('IDX_ENTERPRISE_FIELD_VALUE_WORKSPACE_FIELD_DATE', [
  'workspaceId',
  'fieldDefinitionId',
  'valueDate',
])
export class EnterpriseFieldValueEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  entityBindingId: string;

  @Column({ type: 'uuid' })
  recordId: string;

  @Column({ type: 'uuid' })
  fieldDefinitionId: string;

  @Column({ type: 'jsonb', nullable: true })
  valueJson: unknown;

  @Column({ type: 'text', nullable: true })
  valueString: string | null;

  @Column({ type: 'numeric', nullable: true })
  valueNumber: string | null;

  @Column({ type: 'boolean', nullable: true })
  valueBoolean: boolean | null;

  @Column({ type: 'timestamptz', nullable: true })
  valueDate: Date | null;

  @Column({ type: 'text', array: true, nullable: true })
  valueStringArray: string[] | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
