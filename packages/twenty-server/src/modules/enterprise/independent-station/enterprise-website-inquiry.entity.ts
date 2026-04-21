import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';
import { type EnterpriseWebsiteInquiryStatus } from 'src/modules/enterprise/independent-station/types/enterprise-website-inquiry-status';

@Entity({ name: 'enterpriseWebsiteInquiry', schema: 'core' })
@Index('IDX_ENTERPRISE_WEBSITE_INQUIRY_WORKSPACE_WEBSITE', [
  'workspaceId',
  'websiteBindingId',
])
@Index('IDX_ENTERPRISE_WEBSITE_INQUIRY_EXTERNAL_UNIQUE', [
  'workspaceId',
  'websiteBindingId',
  'externalInquiryId',
], { unique: true })
export class EnterpriseWebsiteInquiryEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  websiteBindingId: string;

  @Column({ type: 'varchar', length: 160 })
  externalInquiryId: string;

  @Column({ type: 'varchar', length: 40 })
  inquiryStatus: EnterpriseWebsiteInquiryStatus;

  @Column({ type: 'uuid', nullable: true })
  leadId: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  assignedTo: string | null;

  @Column({ type: 'jsonb', default: {} })
  payloadJson: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  decisionJson: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
