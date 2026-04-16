import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AlibabaLeadDto {
  @IsString()
  @IsNotEmpty()
  inquiryId!: string;

  @IsString()
  @IsNotEmpty()
  leadName!: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  productCategory?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
