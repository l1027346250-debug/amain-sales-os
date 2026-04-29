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

@Entity({ name: 'tradeCrmMailThreadTaskLink', schema: 'core' })
@ObjectType('TradeCrmMailThreadTaskLink')
@Index(
  'IDX_TRADE_CRM_MAIL_THREAD_TASK_LINK_WORKSPACE_THREAD',
  ['workspaceId', 'threadId'],
  {
    unique: true,
  },
)
@Index('IDX_TRADE_CRM_MAIL_THREAD_TASK_LINK_WORKSPACE_TASK', [
  'workspaceId',
  'taskId',
])
export class TradeCrmMailThreadTaskLinkEntity extends WorkspaceRelatedEntity {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'uuid' })
  threadId: string;

  @Field()
  @Column({ type: 'uuid' })
  taskId: string;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
