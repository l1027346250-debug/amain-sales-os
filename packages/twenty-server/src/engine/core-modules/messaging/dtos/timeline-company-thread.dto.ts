import { Field, Int, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('TimelineCompanyThread')
export class TimelineCompanyThreadDTO {
  @Field(() => UUIDScalarType)
  companyId: string;

  @Field(() => UUIDScalarType)
  latestThreadId: string;

  @Field()
  companyName: string;

  @Field()
  latestMessageReceivedAt: Date;

  @Field()
  latestMessageBody: string;

  @Field()
  subject: string;

  @Field(() => Int)
  totalNumberOfThreads: number;
}
