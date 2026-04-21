import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@InputType()
export class RefreshCustomerCommercialSummaryInput {
  @Field(() => UUIDScalarType)
  customerId: string;
}

@ObjectType('RefreshCustomerCommercialSummaryResult')
export class RefreshCustomerCommercialSummaryResultDTO {
  @Field(() => UUIDScalarType)
  customerId: string;

  @Field(() => Float)
  totalWonAmount: number;

  @Field(() => String, { nullable: true })
  lastWonAt: string | null;

  @Field(() => Int)
  opportunityCount: number;
}
