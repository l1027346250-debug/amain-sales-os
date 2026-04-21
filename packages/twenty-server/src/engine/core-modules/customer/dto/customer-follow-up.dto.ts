import { Field, InputType, ObjectType } from '@nestjs/graphql';

import {
  CustomerTimelineItemDTO,
} from 'src/engine/core-modules/customer/dto/customer-timeline.dto';
import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@InputType()
export class CreateCustomerFollowUpInput {
  @Field(() => UUIDScalarType)
  customerId: string;

  @Field(() => String)
  body: string;
}

@ObjectType('CreateCustomerFollowUpResult')
export class CreateCustomerFollowUpResultDTO {
  @Field(() => CustomerTimelineItemDTO)
  timelineItem: CustomerTimelineItemDTO;

  @Field(() => String)
  lastFollowUpAt: string;
}
