import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ArgsType()
export class CustomerWorkspaceListArgs {
  @Field(() => String, { nullable: true })
  searchTerm?: string;

  @Field(() => String, { nullable: true })
  stageValue?: string;

  @Field(() => String, { nullable: true })
  sourceValue?: string;

  @Field(() => String, { nullable: true })
  tagValue?: string;

  @Field(() => String, { nullable: true })
  publicPoolStateValue?: string;

  @Field(() => Int, { nullable: true, defaultValue: 50 })
  limit?: number;
}

@ObjectType('CustomerWorkspaceSummary')
export class CustomerWorkspaceSummaryDTO {
  @Field()
  label: string;

  @Field(() => Int)
  count: number;
}

@ObjectType('CustomerWorkspaceListItem')
export class CustomerWorkspaceListItemDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field(() => String, { nullable: true })
  name: string | null;

  @Field(() => String, { nullable: true })
  shortName: string | null;

  @Field(() => String, { nullable: true })
  country: string | null;

  @Field(() => GraphQLJSON, { nullable: true })
  address: Record<string, unknown> | null;

  @Field(() => GraphQLJSON, { nullable: true })
  website: Record<string, unknown> | string | null;

  @Field(() => String, { nullable: true })
  domainName: string | null;

  @Field(() => GraphQLJSON, { nullable: true })
  accountOwner: Record<string, unknown> | null;

  @Field(() => GraphQLJSON, { nullable: true })
  owner: Record<string, unknown> | null;

  @Field(() => GraphQLJSON, { nullable: true })
  customerStage: Record<string, unknown> | string | null;

  @Field(() => GraphQLJSON, { nullable: true })
  customerGroup: Record<string, unknown> | string | null;

  @Field(() => GraphQLJSON, { nullable: true })
  customerSource: Record<string, unknown> | string | null;

  @Field(() => GraphQLJSON, { nullable: true })
  customerTags: Array<Record<string, unknown> | string> | null;

  @Field(() => GraphQLJSON, { nullable: true })
  customerStar: Record<string, unknown> | string | null;

  @Field(() => GraphQLJSON, { nullable: true })
  customerScore: number | string | null;

  @Field(() => String, { nullable: true })
  customerCode: string | null;

  @Field(() => String, { nullable: true })
  lastContactAt: string | null;

  @Field(() => String, { nullable: true })
  lastFollowUpAt: string | null;

  @Field(() => String, { nullable: true })
  lastWonAt: string | null;

  @Field(() => GraphQLJSON, { nullable: true })
  totalWonAmount: number | string | null;

  @Field(() => GraphQLJSON, { nullable: true })
  publicPoolState: Record<string, unknown> | string | null;

  @Field(() => GraphQLJSON, { nullable: true })
  publicPoolGroup: Record<string, unknown> | string | null;

  @Field(() => String, { nullable: true })
  publicPoolEnteredAt: string | null;
}

@ObjectType('CustomerWorkspaceList')
export class CustomerWorkspaceListDTO {
  @Field(() => [CustomerWorkspaceListItemDTO])
  records: CustomerWorkspaceListItemDTO[];

  @Field(() => Int)
  totalCount: number;

  @Field(() => Int)
  publicPoolCount: number;

  @Field(() => [CustomerWorkspaceSummaryDTO])
  stageSummary: CustomerWorkspaceSummaryDTO[];

  @Field(() => [CustomerWorkspaceSummaryDTO])
  groupSummary: CustomerWorkspaceSummaryDTO[];

  @Field(() => [CustomerWorkspaceSummaryDTO])
  sourceSummary: CustomerWorkspaceSummaryDTO[];

  @Field(() => [CustomerWorkspaceSummaryDTO])
  tagSummary: CustomerWorkspaceSummaryDTO[];
}
