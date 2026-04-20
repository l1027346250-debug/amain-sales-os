import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

import { EnterpriseEntityType } from 'src/modules/enterprise/shared/types/enterprise-entity-type';
import { EnterpriseFieldType } from 'src/modules/enterprise/shared/types/enterprise-field-type';

export class EnterpriseFieldOptionInputDto {
  @IsString()
  @Matches(/^[A-Za-z][A-Za-z0-9_]*$/)
  optionCode: string;

  @IsString()
  optionLabel: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class CreateEnterpriseFieldDto {
  @IsEnum(EnterpriseEntityType)
  entityType: EnterpriseEntityType;

  @IsString()
  fieldName: string;

  @IsString()
  @Matches(/^[A-Za-z][A-Za-z0-9_]*$/)
  fieldCode: string;

  @IsEnum(EnterpriseFieldType)
  fieldType: EnterpriseFieldType;

  @IsOptional()
  @IsString()
  groupCode?: string;

  @IsOptional()
  @IsArray()
  visibleInModules?: string[];

  @IsOptional()
  validation?: Record<string, unknown>;

  @IsOptional()
  defaultValue?: unknown;

  @IsOptional()
  @IsBoolean()
  searchable?: boolean;

  @IsOptional()
  @IsBoolean()
  exportable?: boolean;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnterpriseFieldOptionInputDto)
  options?: EnterpriseFieldOptionInputDto[];
}
