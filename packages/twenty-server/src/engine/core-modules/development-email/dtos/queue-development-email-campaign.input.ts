import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class QueueDevelopmentEmailCampaignInput {
  @Field()
  campaignId: string;
}
