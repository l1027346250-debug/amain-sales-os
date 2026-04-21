import { ArgsType, Field, InputType, Int, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ArgsType()
export class CustomerImportJobsArgs {
  @Field(() => Int, { nullable: true, defaultValue: 20 })
  limit?: number;
}

@ArgsType()
export class CustomerImportJobResultArgs {
  @Field(() => UUIDScalarType)
  jobId: string;
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

@InputType()
export class SaveCustomerImportMappingInput {
  @Field(() => UUIDScalarType)
  jobId: string;

  @Field(() => [String])
  mappedFields: string[];
}

@InputType()
export class CommitCustomerImportJobInput {
  @Field(() => UUIDScalarType)
  jobId: string;
}

@ObjectType('CustomerImportRowItem')
export class CustomerImportRowItemDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field(() => String)
  rowLabel: string;

  @Field(() => Int)
  rowNumber: number;

  @Field(() => String, { nullable: true })
  companyName: string | null;

  @Field(() => String, { nullable: true })
  contactEmail: string | null;

  @Field(() => String)
  status: string;

  @Field(() => String, { nullable: true })
  errorMessage: string | null;
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

@ObjectType('CustomerImportJobResult')
export class CustomerImportJobResultDTO {
  @Field(() => CustomerImportJobItemDTO, { nullable: true })
  job: CustomerImportJobItemDTO | null;

  @Field(() => [CustomerImportRowItemDTO])
  rows: CustomerImportRowItemDTO[];
}
