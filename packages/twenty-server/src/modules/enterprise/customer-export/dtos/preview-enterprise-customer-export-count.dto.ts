import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class EnterpriseCustomerExportFieldFilterDto {
  @IsUUID()
  fieldDefinitionId: string;

  @IsIn(['contains', 'equals', 'isEmpty', 'isNotEmpty'])
  operator: 'contains' | 'equals' | 'isEmpty' | 'isNotEmpty';

  @IsOptional()
  value?: unknown;
}

export class PreviewEnterpriseCustomerExportCountDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsUUID()
  accountOwnerId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnterpriseCustomerExportFieldFilterDto)
  enterpriseFieldFilters?: EnterpriseCustomerExportFieldFilterDto[];
}
