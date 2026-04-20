import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'enterpriseFieldOption', schema: 'core' })
@Unique('IDX_ENTERPRISE_FIELD_OPTION_WORKSPACE_FIELD_CODE_UNIQUE', [
  'workspaceId',
  'fieldDefinitionId',
  'optionCode',
])
export class EnterpriseFieldOptionEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  fieldDefinitionId: string;

  @Column({ type: 'varchar', length: 80 })
  optionCode: string;

  @Column({ type: 'varchar', length: 160 })
  optionLabel: string;

  @Column({ type: 'varchar', length: 24, nullable: true })
  color: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
