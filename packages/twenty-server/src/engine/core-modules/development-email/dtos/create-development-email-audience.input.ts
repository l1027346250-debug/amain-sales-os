import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateDevelopmentEmailAudienceInput {
  @Field()
  email: string;

  @Field()
  displayName: string;

  @Field({ nullable: true })
  companyId?: string;

  @Field({ nullable: true })
  personId?: string;

  @Field({ nullable: true })
  source?: string;

  @Field(() => [String], { nullable: true })
  tags?: string[];
}
