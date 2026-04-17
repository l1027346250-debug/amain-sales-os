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

@Entity({ name: 'developmentEmailCampaign', schema: 'core' })
@ObjectType('DevelopmentEmailCampaign')
@Index('IDX_DEVELOPMENT_EMAIL_CAMPAIGN_WORKSPACE_STATUS', [
  'workspaceId',
  'status',
])
export class DevelopmentEmailCampaignEntity extends WorkspaceRelatedEntity {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  templateId: string | null;

  @Field()
  @Column({ type: 'varchar', length: 64, default: 'draft' })
  status: string;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt: Date | null;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  audienceFilter: Record<string, unknown> | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  sendingPolicy: Record<string, unknown> | null;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
