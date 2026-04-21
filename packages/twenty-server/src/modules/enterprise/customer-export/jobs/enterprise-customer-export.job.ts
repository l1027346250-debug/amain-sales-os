import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import {
  EnterpriseCustomerExportJob,
  type EnterpriseCustomerExportJobData,
  EnterpriseCustomerExportService,
} from 'src/modules/enterprise/customer-export/services/enterprise-customer-export.service';

@Processor(MessageQueue.workspaceQueue)
export class EnterpriseCustomerExportQueueJob {
  constructor(
    private readonly enterpriseCustomerExportService: EnterpriseCustomerExportService,
  ) {}

  @Process(EnterpriseCustomerExportJob.name)
  async handle(data: EnterpriseCustomerExportJobData): Promise<void> {
    await this.enterpriseCustomerExportService.processJob(
      data.workspaceId,
      data.jobId,
      data.actorWorkspaceMemberId ?? null,
    );
  }
}
