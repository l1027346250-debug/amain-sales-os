import { Field, Int, ObjectType } from '@nestjs/graphql';

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'developmentEmailSendTask', schema: 'core' })
@ObjectType('DevelopmentEmailSendTask')
@Index('IDX_DEVELOPMENT_EMAIL_SEND_TASK_WORKSPACE_STATUS', [
  'workspaceId',
  'status',
])
@Index('IDX_DEVELOPMENT_EMAIL_SEND_TASK_JOB_AUDIENCE', [
  'sendJobId',
  'audienceId',
])
export class DevelopmentEmailSendTaskEntity extends WorkspaceRelatedEntity {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  sendJobId: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  campaignId: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  audienceId: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  templateId: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  connectedAccountId: string | null;

  @Field()
  @Column({ type: 'varchar', length: 64, default: 'queued' })
  status: string;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 512, nullable: true })
  providerMessageId: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  lastError: string | null;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt: Date | null;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  trackingSnapshot: Record<string, unknown> | null;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
