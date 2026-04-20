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

@Entity({ name: 'tradeCrmMailThreadTag', schema: 'core' })
@ObjectType('TradeCrmMailThreadTag')
@Index('IDX_TRADE_CRM_MAIL_THREAD_TAG_WORKSPACE_THREAD', [
  'workspaceId',
  'threadId',
])
@Index('IDX_TRADE_CRM_MAIL_THREAD_TAG_WORKSPACE_TAG', ['workspaceId', 'tag'])
@Index(
  'IDX_TRADE_CRM_MAIL_THREAD_TAG_WORKSPACE_THREAD_TAG',
  ['workspaceId', 'threadId', 'tag'],
  { unique: true },
)
export class TradeCrmMailThreadTagEntity extends WorkspaceRelatedEntity {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'uuid' })
  threadId: string;

  @Field()
  @Column({ type: 'varchar', length: 120 })
  tag: string;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
