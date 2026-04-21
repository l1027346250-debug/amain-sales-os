import { Field, Int, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('ExecuteCustomerPublicPoolRulesResult')
export class ExecuteCustomerPublicPoolRulesResultDTO {
  @Field(() => [UUIDScalarType])
  customerIds: string[];

  @Field(() => Int)
  affectedCount: number;

  @Field(() => Int)
  evaluatedRuleCount: number;
}
