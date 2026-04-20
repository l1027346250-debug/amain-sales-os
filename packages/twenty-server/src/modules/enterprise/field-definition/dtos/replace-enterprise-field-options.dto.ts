import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { EnterpriseFieldOptionInputDto } from 'src/modules/enterprise/field-definition/dtos/create-enterprise-field.dto';

export class ReplaceEnterpriseFieldOptionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnterpriseFieldOptionInputDto)
  options: EnterpriseFieldOptionInputDto[];
}
