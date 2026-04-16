import * as path from 'node:path';
import { randomUUID } from 'crypto';

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

import { JsonFileStateRepository } from 'src/common/state/json-file-state.repository';
import { PostgresStateRepository } from 'src/common/state/postgres-state.repository';
import { StateRepository } from 'src/common/state/state.repository';
import { TwentyClientRequestError } from 'src/modules/sync-jobs/errors/twenty-client-request.error';
import { SyncJob } from 'src/modules/sync-jobs/types/sync-job.type';

const DEFAULT_MAX_RETRIES = 5;
const BASE_RETRY_DELAY_MINUTES = 15;

@Injectable()
export class SyncJobsService implements OnModuleInit {
  private readonly jobs = new Map<string, SyncJob>();
  private readonly stateRepository: StateRepository<SyncJob>;
  private persistPromise = Promise.resolve();

  constructor(private readonly configService: ConfigService) {
    const stateDir =
      this.configService.get<string>('INTEGRATION_HUB_STATE_DIR') ??
      path.join(process.cwd(), 'tmp', 'integration-hub-state');
    const stateBackend =
      this.configService.get<'file' | 'postgres'>(
        'INTEGRATION_HUB_STATE_BACKEND',
      ) ?? 'file';

    if (stateBackend === 'postgres') {
      const connectionString =
        this.configService.get<string>('INTEGRATION_HUB_STATE_PG_URL') ??
        this.configService.get<string>('PG_DATABASE_URL');

      if (!connectionString) {
        throw new Error(
          'INTEGRATION_HUB_STATE_BACKEND=postgres requires INTEGRATION_HUB_STATE_PG_URL or PG_DATABASE_URL',
        );
      }

      this.stateRepository = new PostgresStateRepository<SyncJob>(
        new Pool({ connectionString }),
        'integration_hub_sync_jobs',
      );
      return;
    }

    this.stateRepository = new JsonFileStateRepository<SyncJob>(
      path.join(stateDir, 'sync-jobs.json'),
    );
  }

  async onModuleInit() {
    for (const job of await this.stateRepository.load()) {
      this.jobs.set(job.id, job);
    }
  }

  async enqueueLeadUpsertRetry(
    payload: Record<string, unknown>,
    error: TwentyClientRequestError,
  ) {
    const now = new Date();
    const job: SyncJob = {
      id: randomUUID(),
      source: 'alibaba',
      target: 'twenty.leads',
      operation: 'upsert',
      status: 'pending',
      payload,
      retryCount: 0,
      maxRetries: DEFAULT_MAX_RETRIES,
      nextRetryAt: this.computeNextRetryAt(0, now).toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      lastErrorCategory: error.category,
      lastErrorMessage: error.message,
      lastStatusCode: error.statusCode ?? null,
    };

    this.jobs.set(job.id, job);
    await this.persist();

    return job;
  }

  getRetryableLeadUpserts(
    now = new Date(),
    options?: {
      force?: boolean;
    },
  ) {
    return [...this.jobs.values()].filter(
      (job) =>
        job.status === 'pending' &&
        job.target === 'twenty.leads' &&
        (options?.force === true || new Date(job.nextRetryAt) <= now),
    );
  }

  getJobs(options?: {
    limit?: number;
    status?: SyncJob['status'];
    target?: SyncJob['target'];
  }) {
    const limit = options?.limit ?? 20;

    return [...this.jobs.values()]
      .filter((job) => (options?.status ? job.status === options.status : true))
      .filter((job) => (options?.target ? job.target === options.target : true))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, limit);
  }

  getJobById(id: string) {
    return this.jobs.get(id) ?? null;
  }

  async markSucceeded(id: string) {
    const job = this.jobs.get(id);

    if (!job) {
      return null;
    }

    const updatedJob: SyncJob = {
      ...job,
      status: 'succeeded',
      updatedAt: new Date().toISOString(),
      lastErrorCategory: null,
      lastErrorMessage: null,
      lastStatusCode: null,
    };

    this.jobs.set(id, updatedJob);
    await this.persist();

    return updatedJob;
  }

  async markRetryFailed(id: string, error: TwentyClientRequestError) {
    const job = this.jobs.get(id);

    if (!job) {
      return null;
    }

    const retryCount = job.retryCount + 1;
    const exhausted = retryCount >= job.maxRetries;
    const now = new Date();
    const updatedJob: SyncJob = {
      ...job,
      retryCount,
      status: exhausted ? 'failed' : 'pending',
      nextRetryAt: exhausted
        ? job.nextRetryAt
        : this.computeNextRetryAt(retryCount, now).toISOString(),
      updatedAt: now.toISOString(),
      lastErrorCategory: error.category,
      lastErrorMessage: error.message,
      lastStatusCode: error.statusCode ?? null,
    };

    this.jobs.set(id, updatedJob);
    await this.persist();

    return updatedJob;
  }

  getSummary() {
    const jobs = [...this.jobs.values()];

    return {
      total: jobs.length,
      pending: jobs.filter((job) => job.status === 'pending').length,
      succeeded: jobs.filter((job) => job.status === 'succeeded').length,
      failed: jobs.filter((job) => job.status === 'failed').length,
    };
  }

  private computeNextRetryAt(retryCount: number, now: Date) {
    const retryDelayMinutes = BASE_RETRY_DELAY_MINUTES * (retryCount + 1);

    return new Date(now.getTime() + retryDelayMinutes * 60 * 1000);
  }

  private persist() {
    this.persistPromise = this.persistPromise.then(() =>
      this.stateRepository.save([...this.jobs.values()]),
    );

    return this.persistPromise;
  }
}
