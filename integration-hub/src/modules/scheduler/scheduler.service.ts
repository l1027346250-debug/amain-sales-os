import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { LeadMonitoringService } from 'src/modules/lead-monitoring/lead-monitoring.service';
import { OpportunityMonitoringService } from 'src/modules/opportunity-monitoring/opportunity-monitoring.service';
import { TwentyClientRequestError } from 'src/modules/sync-jobs/errors/twenty-client-request.error';
import { SyncJobsService } from 'src/modules/sync-jobs/sync-jobs.service';
import { TwentyClientService } from 'src/modules/twenty-client/twenty-client.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private retrySweepState = {
    lastStartedAt: null as string | null,
    lastFinishedAt: null as string | null,
    lastSummary: null as
      | {
          scannedJobs: number;
          succeededJobs: number;
          failedJobs: number;
          exhaustedJobs: number;
        }
      | null,
  };
  private healthCheckState = {
    lastStartedAt: null as string | null,
    lastFinishedAt: null as string | null,
    lastSummary: null as
      | {
          syncJobs: ReturnType<SyncJobsService['getSummary']>;
          leadMonitoring: ReturnType<LeadMonitoringService['getSummary']>;
          opportunityMonitoring: ReturnType<
            OpportunityMonitoringService['getSummary']
          >;
        }
      | null,
  };

  constructor(
    private readonly leadMonitoringService: LeadMonitoringService,
    private readonly opportunityMonitoringService: OpportunityMonitoringService,
    private readonly syncJobsService: SyncJobsService,
    private readonly twentyClientService: TwentyClientService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async runRetrySweep() {
    await this.runRetrySweepOnce();
  }

  async runRetrySweepOnce(options?: { force?: boolean }) {
    const startedAt = new Date().toISOString();
    const pendingJobs = this.syncJobsService.getRetryableLeadUpserts(
      new Date(),
      {
        force: options?.force === true,
      },
    );
    let succeededJobs = 0;
    let failedJobs = 0;
    let exhaustedJobs = 0;

    this.retrySweepState.lastStartedAt = startedAt;

    if (pendingJobs.length === 0) {
      this.logger.log('Retry sweep found no pending lead sync jobs');

      const summary = {
        scannedJobs: 0,
        succeededJobs: 0,
        failedJobs: 0,
        exhaustedJobs: 0,
      };
      this.retrySweepState.lastFinishedAt = new Date().toISOString();
      this.retrySweepState.lastSummary = summary;

      return {
        status: 'ok',
        startedAt,
        finishedAt: this.retrySweepState.lastFinishedAt,
        force: options?.force === true,
        ...summary,
      };
    }

    this.logger.log(`Retry sweep processing ${pendingJobs.length} lead sync job(s)`);

    for (const job of pendingJobs) {
      try {
        await this.twentyClientService.createOrUpdateLead(job.payload);
        await this.syncJobsService.markSucceeded(job.id);
        succeededJobs += 1;
        this.logger.log(`Lead sync retry succeeded for job ${job.id}`);
      } catch (error) {
        if (error instanceof TwentyClientRequestError && error.retryable) {
          const updatedJob = await this.syncJobsService.markRetryFailed(
            job.id,
            error,
          );
          failedJobs += 1;
          if (updatedJob?.status === 'failed') {
            exhaustedJobs += 1;
          }
          this.logger.warn(
            `Lead sync retry failed for job ${job.id}; next status=${updatedJob?.status ?? 'missing'}`,
          );

          continue;
        }

        throw error;
      }
    }

    const finishedAt = new Date().toISOString();
    const summary = {
      scannedJobs: pendingJobs.length,
      succeededJobs,
      failedJobs,
      exhaustedJobs,
    };

    this.retrySweepState.lastFinishedAt = finishedAt;
    this.retrySweepState.lastSummary = summary;

    return {
      status: 'ok',
      startedAt,
      finishedAt,
      force: options?.force === true,
      ...summary,
    };
  }

  @Cron(CronExpression.EVERY_HOUR)
  async runSyncHealthCheck() {
    await this.runSyncHealthCheckOnce();
  }

  async runSyncHealthCheckOnce() {
    const startedAt = new Date().toISOString();
    this.healthCheckState.lastStartedAt = startedAt;

    await this.leadMonitoringService.sweepOverdueFirstResponses();
    await this.opportunityMonitoringService.sweepQuotationFollowUpOpportunities();
    await this.opportunityMonitoringService.sweepStalledOpportunities();

    const syncJobsSummary = this.syncJobsService.getSummary();
    const leadMonitoringSummary = this.leadMonitoringService.getSummary();
    const opportunityMonitoringSummary =
      this.opportunityMonitoringService.getSummary();
    const finishedAt = new Date().toISOString();

    this.logger.log(
      `Sync health check: ${JSON.stringify({
        syncJobs: syncJobsSummary,
        leadMonitoring: leadMonitoringSummary,
        opportunityMonitoring: opportunityMonitoringSummary,
      })}`,
    );

    this.healthCheckState.lastFinishedAt = finishedAt;
    this.healthCheckState.lastSummary = {
      syncJobs: syncJobsSummary,
      leadMonitoring: leadMonitoringSummary,
      opportunityMonitoring: opportunityMonitoringSummary,
    };

    return {
      status: 'ok',
      startedAt,
      finishedAt,
      syncJobs: syncJobsSummary,
      leadMonitoring: leadMonitoringSummary,
      opportunityMonitoring: opportunityMonitoringSummary,
    };
  }

  getStatus() {
    return {
      retrySweep: this.retrySweepState,
      healthCheck: this.healthCheckState,
    };
  }
}
