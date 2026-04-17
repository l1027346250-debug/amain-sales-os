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

@Entity({ name: 'developmentEmailTemplate', schema: 'core' })
@ObjectType('DevelopmentEmailTemplate')
@Index('IDX_DEVELOPMENT_EMAIL_TEMPLATE_WORKSPACE_NAME', ['workspaceId', 'name'])
export class DevelopmentEmailTemplateEntity extends WorkspaceRelatedEntity {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Field()
  @Column({ type: 'varchar', length: 512 })
  subject: string;

  @Field()
  @Column({ type: 'text' })
  bodyHtml: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  bodyText: string | null;

  @Field()
  @Column({ type: 'int', default: 1 })
  version: number;

  @Field()
  @Column({ type: 'varchar', length: 64, default: 'draft' })
  status: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  variableSchema: Record<string, unknown> | null;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
