import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('DevelopmentEmailListItem')
export class DevelopmentEmailListItemDTO {
  @Field()
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
