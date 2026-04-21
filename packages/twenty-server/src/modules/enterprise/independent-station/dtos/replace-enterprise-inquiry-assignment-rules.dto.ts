export type EnterpriseInquiryAssignmentRuleInput = {
  id?: string;
  ruleName?: string;
  assignmentType?: string;
  assigneeIds?: string[];
  departmentIds?: string[];
  conditionJson?: Record<string, unknown> | null;
  enabled?: boolean;
  sortOrder?: number;
};

export class ReplaceEnterpriseInquiryAssignmentRulesDto {
  rules?: EnterpriseInquiryAssignmentRuleInput[];
}
