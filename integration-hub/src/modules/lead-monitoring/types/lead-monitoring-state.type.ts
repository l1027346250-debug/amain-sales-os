import { FirstResponseTaskApplyRecord } from 'src/modules/lead-monitoring/types/first-response-task-apply-record.type';
import { LeadCreatedAutomationRecord } from 'src/modules/lead-monitoring/types/lead-created-automation-record.type';

export type LeadMonitoringState = {
  id: 'lead-monitoring';
  lastSweepAt: string | null;
  duplicateApplyBlockedCount: number;
  appliedFirstResponseTaskRecords: FirstResponseTaskApplyRecord[];
  recentLeadCreatedAutomationRecords: LeadCreatedAutomationRecord[];
};
