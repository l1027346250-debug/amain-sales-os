import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ArgsType()
export class CustomerDocumentsArgs {
  @Field(() => UUIDScalarType)
  customerId: string;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  limit?: number;
}

@ObjectType('CustomerDocumentItem')
export class CustomerDocumentItemDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  fileCategory: string | null;

  @Field(() => String, { nullable: true })
  fullPath: string | null;

  @Field(() => String, { nullable: true })
  createdAt: string | null;
}

@ObjectType('CustomerDocuments')
export class CustomerDocumentsDTO {
  @Field(() => [CustomerDocumentItemDTO])
  items: CustomerDocumentItemDTO[];

  @Field(() => Int)
  totalCount: number;
}
