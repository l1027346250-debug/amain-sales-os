import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class StartDevelopmentEmailSendJobInput {
  @Field()
  sendJobId: string;
}
