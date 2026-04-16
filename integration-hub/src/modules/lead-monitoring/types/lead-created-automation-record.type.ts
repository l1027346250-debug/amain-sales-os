export type LeadCreatedAutomationRecord = {
  id: string;
  leadRecordId: string | null;
  externalId: string | null;
  leadName: string | null;
  assignedToId: string | null;
  assignmentStatus: 'assigned' | 'unassigned';
  assignmentStrategy: string;
  firstResponseTaskStatus:
    | 'created'
    | 'prepared'
    | 'prepared_only'
    | 'skipped';
  firstResponseTaskMode: 'remote' | 'prepared' | 'none';
  firstResponseTaskRecordId: string | null;
  recordedAt: string;
  reason: string;
};
