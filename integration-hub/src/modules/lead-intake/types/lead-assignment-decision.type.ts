export type LeadAssignmentDecision = {
  status: 'assigned' | 'unassigned';
  strategy: 'product_category' | 'country' | 'default' | 'unassigned';
  assigneeId: string | null;
  ruleId: string | null;
  matchedField: 'productCategory' | 'country' | null;
  matchedValue: string | null;
  reason: string;
};
