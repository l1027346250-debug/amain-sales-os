import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('DevelopmentEmailMetric')
export class DevelopmentEmailMetricDTO {
  @Field()
  label: string;

  @Field()
  value: string;

  @Field()
  description: string;
}
