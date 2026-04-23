import { IsArray, IsString } from 'class-validator';

export class ReplaceEnterpriseRolePermissionsDto {
  @IsArray()
  @IsString({ each: true })
  permissionCodes: string[];
}
