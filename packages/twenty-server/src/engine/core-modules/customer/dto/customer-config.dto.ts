import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('CustomerConfigSelectOption')
export class CustomerConfigSelectOptionDTO {
  @Field()
  label: string;

  @Field()
  value: string;

  @Field(() => String, { nullable: true })
  color: string | null;

  @Field(() => Int, { nullable: true })
  position: number | null;
}

@ObjectType('CustomerConfigGroup')
export class CustomerConfigGroupDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field()
  label: string;

  @Field(() => UUIDScalarType, { nullable: true })
  parentId: string | null;

  @Field(() => Int)
  level: number;

  @Field(() => Int, { nullable: true })
  sortOrder: number | null;

  @Field()
  isEnabled: boolean;
}

@ObjectType('CustomerConfigTag')
export class CustomerConfigTagDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field()
  label: string;

  @Field(() => String, { nullable: true })
  color: string | null;

  @Field(() => String, { nullable: true })
  scope: string | null;

  @Field(() => String, { nullable: true })
  objectScope: string | null;

  @Field(() => Int, { nullable: true })
  sortOrder: number | null;

  @Field()
  isEnabled: boolean;
}

@ObjectType('CustomerConfigSource')
export class CustomerConfigSourceDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field()
  label: string;

  @Field(() => String, { nullable: true })
  code: string | null;

  @Field(() => Int, { nullable: true })
  sortOrder: number | null;

  @Field()
  isEnabled: boolean;
}

@ObjectType('CustomerConfigPublicPoolRule')
export class CustomerConfigPublicPoolRuleDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field()
  ruleName: string;

  @Field(() => Int, { nullable: true })
  inactivityDays: number | null;

  @Field()
  notifyOwnersFirst: boolean;

  @Field(() => [String])
  scopeStageValues: string[];

  @Field(() => String, { nullable: true })
  publicPoolGroupValue: string | null;

  @Field()
  isEnabled: boolean;
}

@ObjectType('CustomerConfigMatchingRule')
export class CustomerConfigMatchingRuleDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field()
  field: string;

  @Field(() => Int, { nullable: true })
  weight: number | null;

  @Field(() => Int, { nullable: true })
  priority: number | null;

  @Field()
  isEnabled: boolean;
}

@ObjectType('CustomerConfigImportDefaults')
export class CustomerConfigImportDefaultsDTO {
  @Field(() => UUIDScalarType, { nullable: true })
  id: string | null;

  @Field(() => String, { nullable: true })
  destinationValue: string | null;

  @Field()
  updateExistingContacts: boolean;

  @Field(() => [String])
  selectedFields: string[];

  @Field(() => String, { nullable: true })
  status: string | null;
}

@InputType('LogCustomerConfigChangeInput')
export class LogCustomerConfigChangeInput {
  @Field(() => String)
  summary: string;

  @Field(() => [String])
  sectionKeys: string[];
}

@ObjectType('CustomerConfigAggregate')
export class CustomerConfigAggregateDTO {
  @Field(() => [CustomerConfigGroupDTO])
  groups: CustomerConfigGroupDTO[];

  @Field(() => [CustomerConfigTagDTO])
  tags: CustomerConfigTagDTO[];

  @Field(() => [CustomerConfigSourceDTO])
  sources: CustomerConfigSourceDTO[];

  @Field(() => [CustomerConfigPublicPoolRuleDTO])
  publicPoolRules: CustomerConfigPublicPoolRuleDTO[];

  @Field(() => [CustomerConfigMatchingRuleDTO])
  matchingRules: CustomerConfigMatchingRuleDTO[];

  @Field(() => CustomerConfigImportDefaultsDTO)
  importDefaults: CustomerConfigImportDefaultsDTO;

  @Field(() => [CustomerConfigSelectOptionDTO])
  stageOptions: CustomerConfigSelectOptionDTO[];

  @Field(() => [CustomerConfigSelectOptionDTO])
  publicPoolGroupOptions: CustomerConfigSelectOptionDTO[];

  @Field(() => [CustomerConfigSelectOptionDTO])
  tagScopeOptions: CustomerConfigSelectOptionDTO[];

  @Field(() => [CustomerConfigSelectOptionDTO])
  tagObjectScopeOptions: CustomerConfigSelectOptionDTO[];

  @Field(() => [CustomerConfigSelectOptionDTO])
  importDestinationOptions: CustomerConfigSelectOptionDTO[];
}
