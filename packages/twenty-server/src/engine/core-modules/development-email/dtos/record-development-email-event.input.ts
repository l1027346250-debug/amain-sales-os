import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class RecordDevelopmentEmailEventInput {
  @Field()
  eventType: string;

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
  providerMessageId?: string;

  @Field(() => Date, { nullable: true })
  occurredAt?: Date;
}
