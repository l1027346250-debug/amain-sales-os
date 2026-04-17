import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('DevelopmentEmailReportExport')
export class DevelopmentEmailReportExportDTO {
  @Field()
  fileName: string;

  @Field()
  csvContent: string;

  @Field(() => Int)
  rowCount: number;
}
