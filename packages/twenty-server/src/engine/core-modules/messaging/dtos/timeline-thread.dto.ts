import { Field, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { TimelineThreadParticipantDTO } from 'src/engine/core-modules/messaging/dtos/timeline-thread-participant.dto';
import { MessageChannelVisibility } from 'src/modules/messaging/common/standard-objects/message-channel.workspace-entity';

@ObjectType('TimelineThread')
export class TimelineThreadDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field()
  read: boolean;

  @Field()
  isPending: boolean;

  @Field(() => String, { nullable: true })
  pendingReason: string | null;

  @Field(() => Date, { nullable: true })
  pendingUpdatedAt: Date | null;

  @Field(() => MessageChannelVisibility)
  visibility: MessageChannelVisibility;

  @Field()
  firstParticipant: TimelineThreadParticipantDTO;

  @Field(() => [TimelineThreadParticipantDTO])
  lastTwoParticipants: TimelineThreadParticipantDTO[];

  @Field()
  lastMessageReceivedAt: Date;

  @Field()
  lastMessageBody: string;

  @Field()
  subject: string;

  @Field()
  numberOfMessagesInThread: number;

  @Field()
  participantCount: number;

  @Field(() => [String])
  tags: string[];
}
