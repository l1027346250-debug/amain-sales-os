import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@InputType()
export class ClaimPublicPoolCustomerInput {
  @Field(() => UUIDScalarType, { nullable: true })
  customerId?: string;

  @Field(() => [UUIDScalarType], { nullable: true })
  customerIds?: string[];
}

@InputType()
export class MoveCustomersToPublicPoolInput {
  @Field(() => [UUIDScalarType])
  customerIds: string[];

  @Field(() => String, { nullable: true })
  publicPoolGroup?: string;

  @Field(() => String, { nullable: true })
  reason?: string;
}

@ObjectType('CustomerPublicPoolActionResult')
export class CustomerPublicPoolActionResultDTO {
  @Field(() => [UUIDScalarType])
  customerIds: string[];

  @Field(() => Int)
  affectedCount: number;

  @Field(() => String)
  publicPoolState: string;
}
