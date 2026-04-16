export type StalledOpportunity = {
  opportunityId: string;
  opportunityName: string | null;
  stage: string | null;
  assignedToId: string | null;
  companyName: string | null;
  updatedAt: string | null;
  stalledDays: number | null;
};
