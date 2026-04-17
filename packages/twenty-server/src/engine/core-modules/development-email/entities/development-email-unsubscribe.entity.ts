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

@Entity({ name: 'developmentEmailUnsubscribe', schema: 'core' })
@ObjectType('DevelopmentEmailUnsubscribe')
@Index('IDX_DEVELOPMENT_EMAIL_UNSUBSCRIBE_WORKSPACE_EMAIL', [
  'workspaceId',
  'email',
])
export class DevelopmentEmailUnsubscribeEntity extends WorkspaceRelatedEntity {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  audienceId: string | null;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  campaignId: string | null;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  sendTaskId: string | null;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 128, nullable: true })
  source: string | null;

  @Field({ nullable: true })
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
