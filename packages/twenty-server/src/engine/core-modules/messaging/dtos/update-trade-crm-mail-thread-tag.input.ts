import { Field, InputType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@InputType()
export class UpdateTradeCrmMailThreadTagInput {
  @Field(() => UUIDScalarType)
  threadId: string;

  @Field()
  mode: string;

  @Field({ nullable: true })
  tag?: string;
}
