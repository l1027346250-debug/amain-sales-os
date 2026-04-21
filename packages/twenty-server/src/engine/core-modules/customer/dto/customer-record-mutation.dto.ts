import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@InputType()
export class CustomerRecordInput {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  shortName?: string;

  @Field(() => String, { nullable: true })
  customerCode?: string;

  @Field(() => String, { nullable: true })
  country?: string;

  @Field(() => String, { nullable: true })
  websiteUrl?: string;

  @Field(() => String, { nullable: true })
  addressLine?: string;

  @Field(() => String, { nullable: true })
  customerStage?: string;

  @Field(() => String, { nullable: true })
  customerGroup?: string;

  @Field(() => String, { nullable: true })
  customerSource?: string;

  @Field(() => String, { nullable: true })
  customerStar?: string;

  @Field(() => Float, { nullable: true })
  customerScore?: number;
}

@InputType()
export class CreateCustomerInput extends CustomerRecordInput {
  @Field(() => String)
  name: string;
}

@InputType()
export class UpdateCustomerInput extends CustomerRecordInput {
  @Field(() => UUIDScalarType)
  customerId: string;
}

@InputType()
export class CustomerContactInput {
  @Field(() => String, { nullable: true })
  nickname?: string;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => String, { nullable: true })
  phone?: string;

  @Field(() => String, { nullable: true })
  position?: string;

  @Field(() => String, { nullable: true })
  gender?: string;

  @Field(() => String, { nullable: true })
  birthday?: string;

  @Field(() => String, { nullable: true })
  facebook?: string;

  @Field(() => String, { nullable: true })
  twitter?: string;

  @Field(() => String, { nullable: true })
  linkedIn?: string;

  @Field(() => String, { nullable: true })
  contactNotes?: string;
}

@InputType()
export class CreateCustomerContactInput extends CustomerContactInput {
  @Field(() => UUIDScalarType)
  customerId: string;
}

@InputType()
export class UpdateCustomerContactInput extends CustomerContactInput {
  @Field(() => UUIDScalarType)
  contactId: string;
}

@ObjectType('CustomerRecordMutationResult')
export class CustomerRecordMutationResultDTO {
  @Field(() => GraphQLJSON)
  record: Record<string, unknown>;
}
