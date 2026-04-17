import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateDevelopmentEmailCampaignInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  templateId?: string;

  @Field({ nullable: true })
  scheduledAt?: Date;
}
