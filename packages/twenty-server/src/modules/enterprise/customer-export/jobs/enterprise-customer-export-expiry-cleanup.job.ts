import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { WorkspaceActivationStatus } from 'twenty-shared/workspace';

import { SentryCronMonitor } from 'src/engine/core-modules/cron/sentry-cron-monitor.decorator';
import { ExceptionHandlerService } from 'src/engine/core-modules/exception-handler/exception-handler.service';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { ENTERPRISE_CUSTOMER_EXPORT_EXPIRY_CLEANUP_CRON_PATTERN } from 'src/modules/enterprise/customer-export/constants/enterprise-customer-export-expiry-cleanup-cron-pattern.constant';
import { EnterpriseCustomerExportService } from 'src/modules/enterprise/customer-export/services/enterprise-customer-export.service';

export type EnterpriseCustomerExportExpiryCleanupJobData = {
  workspaceId: string;
};

@Injectable()
@Processor(MessageQueue.workspaceQueue)
export class EnterpriseCustomerExportExpiryCleanupJob {
  private readonly logger = new Logger(
    EnterpriseCustomerExportExpiryCleanupJob.name,
  );

  constructor(
    private readonly enterpriseCustomerExportService: EnterpriseCustomerExportService,
  ) {}

  @Process(EnterpriseCustomerExportExpiryCleanupJob.name)
  async handle(
    data: EnterpriseCustomerExportExpiryCleanupJobData,
  ): Promise<void> {
    const cleanedCount =
      await this.enterpriseCustomerExportService.cleanupExpiredJobs(
        data.workspaceId,
      );

    if (cleanedCount > 0) {
      this.logger.log(
        `Expired enterprise customer export cleanup removed ${cleanedCount} file(s) for workspace ${data.workspaceId}`,
      );
    }
  }
}

@Injectable()
@Processor(MessageQueue.cronQueue)
export class EnterpriseCustomerExportExpiryCleanupCronJob {
  private readonly logger = new Logger(
    EnterpriseCustomerExportExpiryCleanupCronJob.name,
  );

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly workspaceQueueService: MessageQueueService,
    private readonly exceptionHandlerService: ExceptionHandlerService,
  ) {}

  @Process(EnterpriseCustomerExportExpiryCleanupCronJob.name)
  @SentryCronMonitor(
    EnterpriseCustomerExportExpiryCleanupCronJob.name,
    ENTERPRISE_CUSTOMER_EXPORT_EXPIRY_CLEANUP_CRON_PATTERN,
  )
  async handle(): Promise<void> {
    const workspaces = await this.workspaceRepository.find({
      where: {
        activationStatus: WorkspaceActivationStatus.ACTIVE,
      },
      select: ['id'],
      order: { id: 'ASC' },
    });

    for (const workspace of workspaces) {
      try {
        await this.workspaceQueueService.add<EnterpriseCustomerExportExpiryCleanupJobData>(
          EnterpriseCustomerExportExpiryCleanupJob.name,
          {
            workspaceId: workspace.id,
          },
        );
      } catch (error) {
        this.exceptionHandlerService.captureExceptions([error], {
          workspace: { id: workspace.id },
        });
      }
    }

    this.logger.log(
      `Enqueued enterprise customer export expiry cleanup for ${workspaces.length} workspace(s)`,
    );
  }
}
