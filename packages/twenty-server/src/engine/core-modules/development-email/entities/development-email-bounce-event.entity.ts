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

@Entity({ name: 'developmentEmailBounceEvent', schema: 'core' })
@ObjectType('DevelopmentEmailBounceEvent')
@Index('IDX_DEVELOPMENT_EMAIL_BOUNCE_EVENT_WORKSPACE_TYPE', [
  'workspaceId',
  'eventType',
])
@Index('IDX_DEVELOPMENT_EMAIL_BOUNCE_EVENT_WORKSPACE_EMAIL', [
  'workspaceId',
  'email',
])
export class DevelopmentEmailBounceEventEntity extends WorkspaceRelatedEntity {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'varchar', length: 64 })
  eventType: string;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  audienceId: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  campaignId: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  sendTaskId: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  provider: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  reason: string | null;

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
