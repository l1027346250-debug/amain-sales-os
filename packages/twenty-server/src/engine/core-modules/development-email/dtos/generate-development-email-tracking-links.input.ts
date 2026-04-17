import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class GenerateDevelopmentEmailTrackingLinksInput {
  @Field()
  email: string;

  @Field({ nullable: true })
  campaignId?: string;

  @Field({ nullable: true })
  sendJobId?: string;

  @Field({ nullable: true })
  sendTaskId?: string;

  @Field({ nullable: true })
  provider?: string;

  @Field({ nullable: true })
  targetUrl?: string;
}
