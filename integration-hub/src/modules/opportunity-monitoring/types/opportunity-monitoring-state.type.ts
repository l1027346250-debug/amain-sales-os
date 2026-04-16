import { QuotationFollowUpTaskApplyRecord } from 'src/modules/opportunity-monitoring/types/quotation-follow-up-task-apply-record.type';
import { StalledTaskApplyRecord } from 'src/modules/opportunity-monitoring/types/stalled-task-apply-record.type';

export type OpportunityMonitoringState = {
  id: 'opportunity-monitoring';
  lastSweepAt: string | null;
  quoteFollowUpLastSweepAt: string | null;
  stalledLastSweepAt: string | null;
  quoteFollowUpDuplicateApplyBlockedCount: number;
  stalledDuplicateApplyBlockedCount: number;
  appliedQuotationFollowUpTaskRecords: QuotationFollowUpTaskApplyRecord[];
  appliedStalledTaskRecords: StalledTaskApplyRecord[];
};
