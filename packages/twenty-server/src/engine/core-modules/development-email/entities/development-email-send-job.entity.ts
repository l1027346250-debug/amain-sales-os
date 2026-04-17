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

@Entity({ name: 'developmentEmailSendJob', schema: 'core' })
@ObjectType('DevelopmentEmailSendJob')
@Index('IDX_DEVELOPMENT_EMAIL_SEND_JOB_WORKSPACE_STATUS', [
  'workspaceId',
  'status',
])
export class DevelopmentEmailSendJobEntity extends WorkspaceRelatedEntity {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  campaignId: string | null;

  @Field()
  @Column({ type: 'varchar', length: 64, default: 'draft' })
  status: string;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  queuedCount: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  sentCount: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  failedCount: number;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  executionSummary: Record<string, unknown> | null;

  @Field(() => String, { nullable: true })
  get executionMode(): string | null {
    const executionMode = this.executionSummary?.executionMode;

    return typeof executionMode === 'string' ? executionMode : null;
  }

  @Field(() => String, { nullable: true })
  get senderPoolMode(): string | null {
    const senderPoolMode = this.executionSummary?.senderPoolMode;
    const executionMode = this.executionSummary?.executionMode;

    if (typeof senderPoolMode === 'string') {
      return senderPoolMode;
    }

    if (executionMode === 'internal-simulation-fallback') {
      return 'fallback-only';
    }

    if (typeof executionMode === 'string' && executionMode.length > 0) {
      return 'live-capable';
    }

    return null;
  }

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
