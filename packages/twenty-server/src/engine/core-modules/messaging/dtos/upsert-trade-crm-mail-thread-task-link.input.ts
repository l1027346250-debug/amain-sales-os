import { Field, InputType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@InputType()
export class UpsertTradeCrmMailThreadTaskLinkInput {
  @Field(() => UUIDScalarType)
  threadId: string;

  @Field(() => UUIDScalarType)
  taskId: string;
}
