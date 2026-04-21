import { IsOptional, IsString, IsUUID } from 'class-validator';

export class PreviewEnterpriseCustomerExportCountDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsUUID()
  accountOwnerId?: string;
}
