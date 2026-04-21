import { ArgsType, Field, InputType, Int, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ArgsType()
export class CustomerImportJobsArgs {
  @Field(() => Int, { nullable: true, defaultValue: 20 })
  limit?: number;
}

@InputType()
export class StartCustomerImportJobInput {
  @Field(() => String)
  fileName: string;

  @Field(() => String)
  destination: string;

  @Field(() => Boolean)
  updateExistingContacts: boolean;

  @Field(() => [String])
  selectedFields: string[];
}

@ObjectType('CustomerImportJobItem')
export class CustomerImportJobItemDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field(() => String)
  fileName: string;

  @Field(() => String)
  destination: string;

  @Field(() => Boolean)
  updateExistingContacts: boolean;

  @Field(() => [String])
  selectedFields: string[];

  @Field(() => String)
  status: string;

  @Field(() => Int)
  successCount: number;

  @Field(() => Int)
  failedCount: number;

  @Field(() => String, { nullable: true })
  executedAt: string | null;
}

@ObjectType('CustomerImportJobs')
export class CustomerImportJobsDTO {
  @Field(() => [CustomerImportJobItemDTO])
  jobs: CustomerImportJobItemDTO[];

  @Field(() => Int)
  totalCount: number;
}
