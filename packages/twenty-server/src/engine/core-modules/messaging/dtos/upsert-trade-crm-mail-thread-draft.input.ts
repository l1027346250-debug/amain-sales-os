import { Field, InputType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@InputType()
export class UpsertTradeCrmMailThreadDraftInput {
  @Field(() => UUIDScalarType, { nullable: true })
  id?: string | null;

  @Field(() => UUIDScalarType, { nullable: true })
  threadId?: string | null;

  @Field()
  mode: string;

  @Field()
  customerLabel: string;

  @Field()
  threadTitle: string;

  @Field()
  contextLabel: string;

  @Field()
  contextValue: string;

  @Field()
  recipients: string;

  @Field()
  ccRecipients: string;

  @Field()
  subject: string;

  @Field()
  body: string;
}
