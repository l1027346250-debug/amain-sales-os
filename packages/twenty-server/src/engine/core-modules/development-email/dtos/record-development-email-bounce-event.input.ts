import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class RecordDevelopmentEmailBounceEventInput {
  @Field()
  eventType: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  audienceId?: string;

  @Field({ nullable: true })
  campaignId?: string;

  @Field({ nullable: true })
  sendTaskId?: string;

  @Field({ nullable: true })
  provider?: string;

  @Field({ nullable: true })
  reason?: string;

  @Field({ nullable: true })
  occurredAt?: Date;
}
