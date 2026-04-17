import { Field, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('DevelopmentEmailListItem')
export class DevelopmentEmailListItemDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field()
  primary: string;

  @Field()
  secondary: string;

  @Field()
  tertiary: string;

  @Field()
  meta: string;

  @Field()
  status: string;
}
