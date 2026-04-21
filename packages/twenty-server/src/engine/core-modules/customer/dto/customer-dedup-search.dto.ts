import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';

@ArgsType()
export class CustomerDedupSearchArgs {
  @Field(() => String, { nullable: true })
  searchTerm?: string;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  limit?: number;
}

@ObjectType('CustomerDedupAppliedRule')
export class CustomerDedupAppliedRuleDTO {
  @Field(() => String)
  field: string;

  @Field(() => Int)
  weight: number;
}

@ObjectType('CustomerDedupHit')
export class CustomerDedupHitDTO {
  @Field(() => GraphQLJSON)
  customer: Record<string, unknown>;

  @Field(() => GraphQLJSON, { nullable: true })
  matchedContact: Record<string, unknown> | null;

  @Field(() => Int)
  matchScore: number;

  @Field(() => [String])
  matchedFields: string[];

  @Field(() => String, { nullable: true })
  primaryMatch: string | null;
}

@ObjectType('CustomerDedupSearch')
export class CustomerDedupSearchDTO {
  @Field(() => [CustomerDedupHitDTO])
  hits: CustomerDedupHitDTO[];

  @Field(() => Int)
  totalCount: number;

  @Field(() => [CustomerDedupAppliedRuleDTO])
  appliedRules: CustomerDedupAppliedRuleDTO[];
}
