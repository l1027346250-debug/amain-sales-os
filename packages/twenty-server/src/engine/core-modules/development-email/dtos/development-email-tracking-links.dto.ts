import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('DevelopmentEmailTrackingLinks')
export class DevelopmentEmailTrackingLinksDTO {
  @Field()
  openTrackingUrl: string;

  @Field()
  clickTrackingUrl: string;

  @Field()
  expiresAt: string;
}
