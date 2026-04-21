import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@InputType()
export class MergeCustomersInput {
  @Field(() => UUIDScalarType)
  primaryCustomerId: string;

  @Field(() => [UUIDScalarType])
  duplicateCustomerIds: string[];

  @Field(() => String, { nullable: true })
  reason?: string;
}

@ObjectType('MergeCustomersResult')
export class MergeCustomersResultDTO {
  @Field(() => UUIDScalarType)
  primaryCustomerId: string;

  @Field(() => [UUIDScalarType])
  mergedCustomerIds: string[];

  @Field(() => Int)
  migratedContactCount: number;

  @Field(() => Int)
  migratedOpportunityCount: number;

  @Field(() => Int)
  migratedTimelineCount: number;

  @Field(() => Int)
  migratedAttachmentCount: number;

  @Field(() => UUIDScalarType, { nullable: true })
  mergeLogId: string | null;
}
