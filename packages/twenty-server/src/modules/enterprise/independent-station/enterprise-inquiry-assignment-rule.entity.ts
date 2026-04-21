import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'enterpriseInquiryAssignmentRule', schema: 'core' })
@Index('IDX_ENTERPRISE_INQUIRY_ASSIGNMENT_RULE_WORKSPACE_WEBSITE', [
  'workspaceId',
  'websiteBindingId',
])
@Index('IDX_ENTERPRISE_INQUIRY_ASSIGNMENT_RULE_WORKSPACE_ENABLED', [
  'workspaceId',
  'enabled',
])
export class EnterpriseInquiryAssignmentRuleEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  websiteBindingId: string | null;

  @Column({ type: 'varchar', length: 160 })
  ruleName: string;

  @Column({ type: 'varchar', length: 40 })
  assignmentType: string;

  @Column({ type: 'text', array: true, default: '{}' })
  assigneeIds: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  departmentIds: string[];

  @Column({ type: 'jsonb', default: {} })
  conditionJson: Record<string, unknown>;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
