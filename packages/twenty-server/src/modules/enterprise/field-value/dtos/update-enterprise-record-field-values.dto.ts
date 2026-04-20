import { Type } from 'class-transformer';
import { IsArray, IsUUID, ValidateNested } from 'class-validator';

export class EnterpriseRecordFieldValueItemDto {
  @IsUUID()
  fieldDefinitionId: string;

  value: unknown;
}

export class UpdateEnterpriseRecordFieldValuesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnterpriseRecordFieldValueItemDto)
  values: EnterpriseRecordFieldValueItemDto[];
}
