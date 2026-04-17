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

@Entity({ name: 'tradeCrmMailThreadState', schema: 'core' })
@ObjectType('TradeCrmMailThreadState')
@Index(
  'IDX_TRADE_CRM_MAIL_THREAD_STATE_WORKSPACE_THREAD',
  ['workspaceId', 'threadId'],
  {
    unique: true,
  },
)
@Index('IDX_TRADE_CRM_MAIL_THREAD_STATE_WORKSPACE_PENDING', [
  'workspaceId',
  'isPending',
  'updatedAt',
])
export class TradeCrmMailThreadStateEntity extends WorkspaceRelatedEntity {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'uuid' })
  threadId: string;

  @Field()
  @Column({ type: 'boolean', default: false })
  isPending: boolean;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  pendingReason: string | null;

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
