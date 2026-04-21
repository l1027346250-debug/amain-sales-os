import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'enterpriseReportTemplateVersion', schema: 'core' })
@Unique('IDX_ENTERPRISE_REPORT_TEMPLATE_VERSION_TEMPLATE_NUMBER_UNIQUE', [
  'templateId',
  'versionNumber',
])
@Index('IDX_ENTERPRISE_REPORT_TEMPLATE_VERSION_TEMPLATE_CREATED_AT', [
  'templateId',
  'createdAt',
])
export class EnterpriseReportTemplateVersionEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  templateId: string;

  @Column({ type: 'int' })
  versionNumber: number;

  @Column({ type: 'varchar', length: 180 })
  templateName: string;

  @Column({ type: 'varchar', length: 120 })
  templateCode: string;

  @Column({ type: 'varchar', length: 40 })
  reportType: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  sectionKeys: string[];

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  recipientRoleCodes: string[];

  @Column({ type: 'varchar', length: 40, default: 'dashboard' })
  deliveryChannel: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'jsonb', nullable: true })
  previewJson: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true })
  createdByWorkspaceMemberId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

