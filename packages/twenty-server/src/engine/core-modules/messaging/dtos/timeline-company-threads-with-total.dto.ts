import { Field, Int, ObjectType } from '@nestjs/graphql';

import { TimelineCompanyThreadDTO } from 'src/engine/core-modules/messaging/dtos/timeline-company-thread.dto';

@ObjectType('TimelineCompanyThreadsWithTotal')
export class TimelineCompanyThreadsWithTotalDTO {
  @Field(() => Int)
  totalNumberOfCompanies: number;

  @Field(() => [TimelineCompanyThreadDTO])
  timelineCompanyThreads: TimelineCompanyThreadDTO[];
}
