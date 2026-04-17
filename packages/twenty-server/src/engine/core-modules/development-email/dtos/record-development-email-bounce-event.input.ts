import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class RecordDevelopmentEmailBounceEventInput {
  @Field()
  eventType: string;

  @Field()
  email: string;

  @Field(() => String, { nullable: true })
  audienceId?: string;

  @Field(() => String, { nullable: true })
  campaignId?: string;

  @Field(() => String, { nullable: true })
  sendTaskId?: string;

  @Field(() => String, { nullable: true })
  provider?: string;

  @Field(() => String, { nullable: true })
  reason?: string;

  @Field(() => Date, { nullable: true })
  occurredAt?: Date;
}
