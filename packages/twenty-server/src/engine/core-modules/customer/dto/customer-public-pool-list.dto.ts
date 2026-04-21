import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';

import {
  CustomerWorkspaceListItemDTO,
  CustomerWorkspaceSummaryDTO,
} from 'src/engine/core-modules/customer/dto/customer-workspace-list.dto';

@ArgsType()
export class CustomerPublicPoolListArgs {
  @Field(() => String, { nullable: true })
  searchTerm?: string;

  @Field(() => String, { nullable: true })
  stageValue?: string;

  @Field(() => String, { nullable: true })
  sourceValue?: string;

  @Field(() => String, { nullable: true })
  tagValue?: string;

  @Field(() => String, { nullable: true })
  publicPoolGroupValue?: string;

  @Field(() => Int, { nullable: true, defaultValue: 50 })
  limit?: number;
}

@ObjectType('CustomerPublicPoolList')
export class CustomerPublicPoolListDTO {
  @Field(() => [CustomerWorkspaceListItemDTO])
  records: CustomerWorkspaceListItemDTO[];

  @Field(() => Int)
  totalCount: number;

  @Field(() => [CustomerWorkspaceSummaryDTO])
  stageSummary: CustomerWorkspaceSummaryDTO[];

  @Field(() => [CustomerWorkspaceSummaryDTO])
  groupSummary: CustomerWorkspaceSummaryDTO[];

  @Field(() => [CustomerWorkspaceSummaryDTO])
  sourceSummary: CustomerWorkspaceSummaryDTO[];

  @Field(() => [CustomerWorkspaceSummaryDTO])
  tagSummary: CustomerWorkspaceSummaryDTO[];
}
