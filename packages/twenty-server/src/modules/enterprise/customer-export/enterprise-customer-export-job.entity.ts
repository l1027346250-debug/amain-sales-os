import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'enterpriseCustomerExportJob', schema: 'core' })
@Index('IDX_ENTERPRISE_CUSTOMER_EXPORT_JOB_WORKSPACE_CREATED_AT', [
  'workspaceId',
  'createdAt',
])
export class EnterpriseCustomerExportJobEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 180 })
  taskName: string;

  @Column({ type: 'jsonb' })
  filterJson: Record<string, unknown>;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  selectedFieldCodes: string[];

  @Column({ type: 'int', nullable: true })
  customerCount: number | null;

  @Column({ type: 'varchar', length: 30, default: 'pending' })
  status: string;

  @Column({ type: 'text', nullable: true })
  fileUrl: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  fileExpiresAt: Date | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdByWorkspaceMemberId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
