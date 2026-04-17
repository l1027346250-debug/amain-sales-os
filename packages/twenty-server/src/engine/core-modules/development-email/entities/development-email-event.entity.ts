import { Field, ObjectType } from '@nestjs/graphql';

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'developmentEmailEvent', schema: 'core' })
@ObjectType('DevelopmentEmailEvent')
@Index('IDX_DEVELOPMENT_EMAIL_EVENT_WORKSPACE_TYPE', [
  'workspaceId',
  'eventType',
])
@Index('IDX_DEVELOPMENT_EMAIL_EVENT_WORKSPACE_CAMPAIGN', [
  'workspaceId',
  'campaignId',
])
export class DevelopmentEmailEventEntity extends WorkspaceRelatedEntity {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'varchar', length: 64 })
  eventType: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  campaignId: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  sendJobId: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  sendTaskId: string | null;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  provider: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 512, nullable: true })
  providerMessageId: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Field()
  @Column({ type: 'timestamptz' })
  occurredAt: Date;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
