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

@Entity({ name: 'enterpriseMailThreadCrmLink', schema: 'core' })
@Unique('IDX_ENTERPRISE_MAIL_THREAD_CRM_LINK_WORKSPACE_THREAD_UNIQUE', [
  'workspaceId',
  'threadId',
])
@Index('IDX_ENTERPRISE_MAIL_THREAD_CRM_LINK_WORKSPACE_COMPANY', [
  'workspaceId',
  'companyId',
])
export class EnterpriseMailThreadCrmLinkEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  threadId: string;

  @Column({ type: 'uuid', nullable: true })
  companyId: string | null;

  @Column({ type: 'uuid', nullable: true })
  personId: string | null;

  @Column({ type: 'uuid', nullable: true })
  opportunityId: string | null;

  @Column({ type: 'uuid', nullable: true })
  taskId: string | null;

  @Column({ type: 'varchar', length: 64, default: 'manual' })
  source: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 1 })
  confidence: number;

  @Column({ type: 'uuid', nullable: true })
  linkedByWorkspaceMemberId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
