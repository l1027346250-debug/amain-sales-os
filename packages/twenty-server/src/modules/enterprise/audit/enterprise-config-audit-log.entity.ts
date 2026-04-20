import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'enterpriseConfigAuditLog', schema: 'core' })
@Index('IDX_ENTERPRISE_AUDIT_LOG_WORKSPACE_RESOURCE', [
  'workspaceId',
  'resourceType',
  'resourceId',
])
export class EnterpriseConfigAuditLogEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  action: string;

  @Column({ type: 'varchar', length: 120 })
  resourceType: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  resourceId: string | null;

  @Column({ type: 'uuid', nullable: true })
  actorWorkspaceMemberId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  beforeJson: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  afterJson: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  contextJson: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ip: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
