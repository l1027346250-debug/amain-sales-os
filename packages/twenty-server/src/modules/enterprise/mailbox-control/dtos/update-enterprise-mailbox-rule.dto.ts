import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class UpdateEnterpriseMailboxRuleDto {
  @IsOptional()
  @IsUUID()
  mailboxProfileId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  ruleType?: string;

  @IsOptional()
  conditionsJson?: Record<string, unknown>;

  @IsOptional()
  actionsJson?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  priority?: number;
}
