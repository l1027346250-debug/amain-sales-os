import { Field, ObjectType } from '@nestjs/graphql';

import { DevelopmentEmailListItemDTO } from 'src/engine/core-modules/messaging/dtos/development-email-list-item.dto';
import { DevelopmentEmailMetricDTO } from 'src/engine/core-modules/messaging/dtos/development-email-metric.dto';

@ObjectType('DevelopmentEmailWorkspace')
export class DevelopmentEmailWorkspaceDTO {
  @Field(() => [DevelopmentEmailMetricDTO])
  metrics: DevelopmentEmailMetricDTO[];

  @Field(() => [DevelopmentEmailListItemDTO])
  listItems: DevelopmentEmailListItemDTO[];
}
