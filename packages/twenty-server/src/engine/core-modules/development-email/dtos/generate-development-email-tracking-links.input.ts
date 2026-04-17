import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class GenerateDevelopmentEmailTrackingLinksInput {
  @Field()
  email: string;

  @Field(() => String, { nullable: true })
  campaignId?: string;

  @Field(() => String, { nullable: true })
  sendJobId?: string;

  @Field(() => String, { nullable: true })
  sendTaskId?: string;

  @Field(() => String, { nullable: true })
  provider?: string;

  @Field(() => String, { nullable: true })
  targetUrl?: string;
}
