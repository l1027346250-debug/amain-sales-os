import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateDevelopmentEmailAudienceInput {
  @Field()
  email: string;

  @Field()
  displayName: string;

  @Field(() => String, { nullable: true })
  companyId?: string;

  @Field(() => String, { nullable: true })
  personId?: string;

  @Field(() => String, { nullable: true })
  source?: string;

  @Field(() => [String], { nullable: true })
  tags?: string[];
}
