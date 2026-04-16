export type LeadIntakeAuditRecord = {
  eventType: 'lead_intake';
  recordedAt: string;
  source: string;
  externalId: string | null;
  strategy: string;
  summary: string;
};
