import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ExecuteDevelopmentEmailSendJobInput {
  @Field()
  sendJobId: string;
}
