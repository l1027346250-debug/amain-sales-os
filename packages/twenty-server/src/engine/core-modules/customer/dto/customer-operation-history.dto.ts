import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ArgsType()
export class CustomerOperationHistoryArgs {
  @Field(() => UUIDScalarType)
  customerId: string;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  limit?: number;
}

@ObjectType('CustomerOperationHistoryItem')
export class CustomerOperationHistoryItemDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field(() => String)
  operationSummary: string;

  @Field(() => String, { nullable: true })
  operationType: string | null;

  @Field(() => String, { nullable: true })
  operatorName: string | null;

  @Field(() => String, { nullable: true })
  operatedAt: string | null;
}

@ObjectType('CustomerOperationHistory')
export class CustomerOperationHistoryDTO {
  @Field(() => [CustomerOperationHistoryItemDTO])
  items: CustomerOperationHistoryItemDTO[];

  @Field(() => Int)
  totalCount: number;
}
