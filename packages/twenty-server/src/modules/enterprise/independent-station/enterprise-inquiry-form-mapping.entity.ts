import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'enterpriseInquiryFormMapping', schema: 'core' })
@Index('IDX_ENTERPRISE_INQUIRY_FORM_MAPPING_WORKSPACE_WEBSITE', [
  'workspaceId',
  'websiteBindingId',
])
@Index('IDX_ENTERPRISE_INQUIRY_FORM_MAPPING_FIELD_UNIQUE', [
  'workspaceId',
  'websiteBindingId',
  'externalFieldCode',
], { unique: true })
export class EnterpriseInquiryFormMappingEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  websiteBindingId: string;

  @Column({ type: 'varchar', length: 120 })
  externalFieldCode: string;

  @Column({ type: 'varchar', length: 120 })
  crmFieldCode: string;

  @Column({ type: 'boolean', default: false })
  required: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
