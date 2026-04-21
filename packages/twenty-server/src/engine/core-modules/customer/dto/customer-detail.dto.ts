import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ArgsType()
export class CustomerDetailArgs {
  @Field(() => UUIDScalarType)
  customerId: string;
}

@ObjectType('CustomerDetailAggregate')
export class CustomerDetailAggregateDTO {
  @Field(() => GraphQLJSON, { nullable: true })
  customer: Record<string, unknown> | null;

  @Field(() => [GraphQLJSON])
  contacts: Record<string, unknown>[];

  @Field(() => [GraphQLJSON])
  opportunities: Record<string, unknown>[];

  @Field(() => Int)
  contactCount: number;

  @Field(() => Int)
  opportunityCount: number;
}
