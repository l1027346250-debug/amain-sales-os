import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { ENTERPRISE_CUSTOMER_EXPORT_EXPIRY_CLEANUP_CRON_PATTERN } from 'src/modules/enterprise/customer-export/constants/enterprise-customer-export-expiry-cleanup-cron-pattern.constant';
import { EnterpriseCustomerExportExpiryCleanupCronJob } from 'src/modules/enterprise/customer-export/jobs/enterprise-customer-export-expiry-cleanup.job';

@Command({
  name: 'cron:enterprise-customer-export-expiry-cleanup',
  description: 'Starts the cron job that cleans expired enterprise customer exports',
})
export class EnterpriseCustomerExportExpiryCleanupCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: EnterpriseCustomerExportExpiryCleanupCronJob.name,
      data: undefined,
      options: {
        repeat: {
          pattern: ENTERPRISE_CUSTOMER_EXPORT_EXPIRY_CLEANUP_CRON_PATTERN,
        },
      },
    });
  }
}
