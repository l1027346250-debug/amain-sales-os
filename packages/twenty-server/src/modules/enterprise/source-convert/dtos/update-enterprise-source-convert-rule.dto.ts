export class UpdateEnterpriseSourceConvertRuleDto {
  depositEntityType?: string;
  targetLeadStatus?: string | null;
  targetCustomerStage?: string | null;
  autoTagIds?: string[];
  includeFunnelStats?: boolean;
  enabled?: boolean;
  ruleJson?: Record<string, unknown> | null;
}

