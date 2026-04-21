import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ArgsType()
export class CustomerAiInsightArgs {
  @Field(() => UUIDScalarType)
  customerId: string;
}

@ObjectType('CustomerAiInsightSignal')
export class CustomerAiInsightSignalDTO {
  @Field(() => String)
  label: string;

  @Field(() => String)
  value: string;
}

@ObjectType('CustomerAiInsight')
export class CustomerAiInsightDTO {
  @Field(() => UUIDScalarType)
  customerId: string;

  @Field(() => String)
  status: string;

  @Field(() => String)
  summary: string;

  @Field(() => Int)
  contactCount: number;

  @Field(() => Int)
  opportunityCount: number;

  @Field(() => [CustomerAiInsightSignalDTO])
  signals: CustomerAiInsightSignalDTO[];
}
