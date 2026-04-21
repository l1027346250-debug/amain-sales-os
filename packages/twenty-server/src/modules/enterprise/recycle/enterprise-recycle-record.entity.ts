import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';
import { ENTERPRISE_RECYCLE_RECORD_STATUS } from 'src/modules/enterprise/recycle/types/enterprise-recycle-record-status';

@Entity({ name: 'enterpriseRecycleRecord', schema: 'core' })
@Index('IDX_ENTERPRISE_RECYCLE_RECORD_RESOURCE', [
  'workspaceId',
  'resourceType',
  'status',
  'deletedAt',
])
export class EnterpriseRecycleRecordEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 60 })
  resourceType: string;

  @Column({ type: 'uuid' })
  resourceId: string;

  @Column({ type: 'text', nullable: true })
  resourceTitle: string | null;

  @Column({ type: 'jsonb' })
  deletedPayload: Record<string, unknown>;

  @Column({ type: 'uuid', nullable: true })
  deletedByWorkspaceMemberId: string | null;

  @Column({ type: 'timestamptz' })
  deletedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  recoverableUntil: Date | null;

  @Column({ type: 'uuid', nullable: true })
  restoredByWorkspaceMemberId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  restoredAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  purgedByWorkspaceMemberId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  purgedAt: Date | null;

  @Column({
    type: 'varchar',
    length: 30,
    default: ENTERPRISE_RECYCLE_RECORD_STATUS.deleted,
  })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

