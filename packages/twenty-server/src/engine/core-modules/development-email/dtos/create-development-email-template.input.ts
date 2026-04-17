import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateDevelopmentEmailTemplateInput {
  @Field()
  name: string;

  @Field()
  subject: string;

  @Field()
  bodyHtml: string;

  @Field({ nullable: true })
  bodyText?: string;
}
