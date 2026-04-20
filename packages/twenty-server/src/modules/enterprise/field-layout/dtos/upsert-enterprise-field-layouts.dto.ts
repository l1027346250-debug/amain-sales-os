import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { EnterpriseEntityType } from 'src/modules/enterprise/shared/types/enterprise-entity-type';
import { EnterprisePageScene } from 'src/modules/enterprise/shared/types/enterprise-page-scene';

export class EnterpriseFieldLayoutItemDto {
  @IsUUID()
  fieldDefinitionId: string;

  @IsOptional()
  @IsString()
  groupCode?: string;

  @IsBoolean()
  required: boolean;

  @IsBoolean()
  visible: boolean;

  @IsBoolean()
  readonly: boolean;

  @IsInt()
  sortOrder: number;
}

export class UpsertEnterpriseFieldLayoutsDto {
  @IsEnum(EnterpriseEntityType)
  entityType: EnterpriseEntityType;

  @IsEnum(EnterprisePageScene)
  pageScene: EnterprisePageScene;

  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnterpriseFieldLayoutItemDto)
  items: EnterpriseFieldLayoutItemDto[];
}
