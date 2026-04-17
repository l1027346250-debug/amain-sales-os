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

@Entity({ name: 'developmentEmailAudience', schema: 'core' })
@ObjectType('DevelopmentEmailAudience')
@Index('IDX_DEVELOPMENT_EMAIL_AUDIENCE_WORKSPACE_EMAIL', [
  'workspaceId',
  'email',
])
export class DevelopmentEmailAudienceEntity extends WorkspaceRelatedEntity {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  displayName: string;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  companyId: string | null;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  personId: string | null;

  @Field()
  @Column({ type: 'varchar', length: 64, default: 'subscribed' })
  subscriptionStatus: string;

  @Field()
  @Column({ type: 'varchar', length: 64, default: 'crm' })
  source: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  tags: string[] | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
