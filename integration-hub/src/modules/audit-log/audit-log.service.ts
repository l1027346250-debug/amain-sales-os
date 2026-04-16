import { Injectable, Logger } from '@nestjs/common';

import { LeadIntakeAuditRecord } from 'src/modules/audit-log/types/lead-intake-audit-record.type';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  recordLeadIntake(record: Omit<LeadIntakeAuditRecord, 'recordedAt' | 'eventType'>) {
    const auditRecord: LeadIntakeAuditRecord = {
      eventType: 'lead_intake',
      recordedAt: new Date().toISOString(),
      ...record,
    };

    this.logger.log(
      JSON.stringify({
        audit: auditRecord,
      }),
    );

    return auditRecord;
  }
}
