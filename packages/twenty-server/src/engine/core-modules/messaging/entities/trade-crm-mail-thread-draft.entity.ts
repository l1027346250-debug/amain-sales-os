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

@Entity({ name: 'tradeCrmMailThreadDraft', schema: 'core' })
@ObjectType('TradeCrmMailThreadDraft')
@Index('IDX_TRADE_CRM_MAIL_THREAD_DRAFT_WORKSPACE_SAVED_AT', [
  'workspaceId',
  'savedAt',
])
@Index('IDX_TRADE_CRM_MAIL_THREAD_DRAFT_WORKSPACE_THREAD', [
  'workspaceId',
  'threadId',
])
export class TradeCrmMailThreadDraftEntity extends WorkspaceRelatedEntity {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  threadId: string | null;

  @Field()
  @Column({ type: 'varchar', length: 32 })
  mode: string;

  @Field()
  @Column({ type: 'varchar', length: 255, default: '' })
  customerLabel: string;

  @Field()
  @Column({ type: 'varchar', length: 255, default: '' })
  threadTitle: string;

  @Field()
  @Column({ type: 'varchar', length: 255, default: '' })
  contextLabel: string;

  @Field()
  @Column({ type: 'varchar', length: 255, default: '' })
  contextValue: string;

  @Field()
  @Column({ type: 'text', default: '' })
  recipients: string;

  @Field()
  @Column({ type: 'text', default: '' })
  ccRecipients: string;

  @Field()
  @Column({ type: 'text', default: '' })
  subject: string;

  @Field()
  @Column({ type: 'text', default: '' })
  body: string;

  @Field()
  @Column({ type: 'timestamptz', default: () => 'now()' })
  savedAt: Date;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
