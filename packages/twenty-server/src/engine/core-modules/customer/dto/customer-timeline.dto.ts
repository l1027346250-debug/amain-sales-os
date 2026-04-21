import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ArgsType()
export class CustomerTimelineArgs {
  @Field(() => UUIDScalarType)
  customerId: string;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  limit?: number;
}

@ObjectType('CustomerTimelineItem')
export class CustomerTimelineItemDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field(() => String)
  occurredAt: string;

  @Field(() => String)
  type: string;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => String, { nullable: true })
  actorName: string | null;

  @Field(() => String, { nullable: true })
  sourceObjectName: string | null;

  @Field(() => UUIDScalarType, { nullable: true })
  sourceRecordId: string | null;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata: Record<string, unknown> | null;
}

@ObjectType('CustomerTimeline')
export class CustomerTimelineDTO {
  @Field(() => [CustomerTimelineItemDTO])
  items: CustomerTimelineItemDTO[];

  @Field(() => Int)
  totalCount: number;
}
