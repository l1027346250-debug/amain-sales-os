import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateDevelopmentEmailCampaignInput {
  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  templateId?: string;

  @Field(() => Date, { nullable: true })
  scheduledAt?: Date;
}
