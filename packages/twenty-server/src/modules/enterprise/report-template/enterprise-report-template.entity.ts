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

@Entity({ name: 'enterpriseReportTemplate', schema: 'core' })
@Unique('IDX_ENTERPRISE_REPORT_TEMPLATE_WORKSPACE_CODE_UNIQUE', [
  'workspaceId',
  'templateCode',
])
@Index('IDX_ENTERPRISE_REPORT_TEMPLATE_WORKSPACE_TYPE', [
  'workspaceId',
  'reportType',
])
export class EnterpriseReportTemplateEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'uuid', nullable: true })
  currentVersionId: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdByWorkspaceMemberId: string | null;

  @Column({ type: 'uuid', nullable: true })
  updatedByWorkspaceMemberId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

