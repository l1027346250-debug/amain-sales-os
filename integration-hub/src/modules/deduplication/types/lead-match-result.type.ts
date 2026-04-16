export type LeadMatchResult = {
  strategy: 'email' | 'phone' | 'company-contact' | 'none';
  score: number;
  confidence: 'high' | 'medium' | 'low' | 'none';
  recommendedAction: 'merge_or_update' | 'review_before_merge' | 'create_new';
  inputProfile: {
    hasEmail: boolean;
    hasPhone: boolean;
    hasCompanyContact: boolean;
    primaryKey: 'email' | 'phone' | 'company-contact' | 'none';
  };
  matchedOn: Array<{
    field: 'email' | 'phone' | 'company-contact';
    normalizedValue: string;
  }>;
  matchedLeadId?: string;
  matchedCompanyId?: string;
  reason: string;
  reviewSummary: string;
};
