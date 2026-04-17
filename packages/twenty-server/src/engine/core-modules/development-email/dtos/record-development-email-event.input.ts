import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class RecordDevelopmentEmailEventInput {
  @Field()
  eventType: string;

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
  providerMessageId?: string;

  @Field({ nullable: true })
  occurredAt?: Date;
}
