import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateEnterpriseMailboxRuleDto {
  @IsUUID()
  mailboxProfileId: string;

  @IsString()
  name: string;

  @IsString()
  ruleType: string;

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
