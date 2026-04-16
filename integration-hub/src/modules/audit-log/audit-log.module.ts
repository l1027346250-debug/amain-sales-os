import { Module } from '@nestjs/common';

import { AuditLogService } from 'src/modules/audit-log/audit-log.service';

@Module({
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
