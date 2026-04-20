import { Field, ObjectType } from '@nestjs/graphql';

import { DevelopmentEmailListItemDTO } from 'src/engine/core-modules/messaging/dtos/development-email-list-item.dto';
import { DevelopmentEmailMetricDTO } from 'src/engine/core-modules/messaging/dtos/development-email-metric.dto';

@ObjectType('DevelopmentEmailSendJobSummary')
export class DevelopmentEmailSendJobSummaryDTO {
  @Field(() => [DevelopmentEmailMetricDTO])
  metrics: DevelopmentEmailMetricDTO[];

  @Field(() => [DevelopmentEmailListItemDTO])
  listItems: DevelopmentEmailListItemDTO[];
}
