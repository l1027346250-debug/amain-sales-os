import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';
import { type EnterpriseWebsiteBindingStatus } from 'src/modules/enterprise/independent-station/types/enterprise-website-binding-status';

@Entity({ name: 'enterpriseWebsiteBinding', schema: 'core' })
@Index('IDX_ENTERPRISE_WEBSITE_BINDING_WORKSPACE_STATUS', [
  'workspaceId',
  'status',
])
@Index('IDX_ENTERPRISE_WEBSITE_BINDING_WORKSPACE_URL_UNIQUE', [
  'workspaceId',
  'websiteUrl',
], { unique: true })
export class EnterpriseWebsiteBindingEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160 })
  websiteName: string;

  @Column({ type: 'text' })
  websiteUrl: string;

  @Column({ type: 'varchar', length: 60, default: 'okki_shops' })
  provider: string;

  @Column({ type: 'varchar', length: 30, default: 'bound' })
  status: EnterpriseWebsiteBindingStatus;

  @Column({ type: 'uuid', nullable: true })
  boundByWorkspaceMemberId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  boundAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  unboundAt: Date | null;

  @Column({ type: 'jsonb', default: {} })
  metadataJson: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
