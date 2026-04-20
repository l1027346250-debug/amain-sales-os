import { Field, InputType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@InputType()
export class UpdateTradeCrmMailThreadStateInput {
  @Field(() => UUIDScalarType)
  threadId: string;

  @Field()
  isPending: boolean;

  @Field(() => String, { nullable: true })
  pendingReason?: string;
}
