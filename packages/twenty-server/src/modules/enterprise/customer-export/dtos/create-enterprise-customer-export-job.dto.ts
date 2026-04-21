import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { PreviewEnterpriseCustomerExportCountDto } from 'src/modules/enterprise/customer-export/dtos/preview-enterprise-customer-export-count.dto';

export class CreateEnterpriseCustomerExportJobDto {
  @IsString()
  taskName: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PreviewEnterpriseCustomerExportCountDto)
  filter?: PreviewEnterpriseCustomerExportCountDto;

  @IsArray()
  @IsString({ each: true })
  selectedFieldCodes: string[];
}
