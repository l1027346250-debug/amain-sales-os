import * as path from 'node:path';
import { randomUUID } from 'crypto';

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

import { JsonFileStateRepository } from 'src/common/state/json-file-state.repository';
import { PostgresStateRepository } from 'src/common/state/postgres-state.repository';
import { StateRepository } from 'src/common/state/state.repository';
import { TwentyWebhookDto } from 'src/modules/webhooks/twenty/dto/twenty-webhook.dto';
import { WebhookEventLog } from 'src/modules/webhooks/twenty/types/webhook-event-log.type';

@Injectable()
export class TwentyWebhookEventsService implements OnModuleInit {
  private readonly logs = new Map<string, WebhookEventLog>();
  private readonly stateRepository: StateRepository<WebhookEventLog>;
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

      this.stateRepository = new PostgresStateRepository<WebhookEventLog>(
        new Pool({ connectionString }),
        'integration_hub_twenty_webhook_events',
      );
      return;
    }

    this.stateRepository = new JsonFileStateRepository<WebhookEventLog>(
      path.join(stateDir, 'twenty-webhook-events.json'),
    );
  }

  async onModuleInit() {
    for (const log of await this.stateRepository.load()) {
      this.logs.set(log.id, log);
    }
  }

  async recordProcessedEvent(
    payload: TwentyWebhookDto,
    handler: string,
    summary: string,
  ) {
    const log = this.buildLog(payload, 'processed', handler, summary);

    this.logs.set(log.id, log);
    await this.persist();

    return log;
  }

  async recordIgnoredEvent(payload: TwentyWebhookDto, reason: string) {
    const log = this.buildLog(payload, 'ignored', 'ignored', reason);

    this.logs.set(log.id, log);
    await this.persist();

    return log;
  }

  async recordFailedEvent(
    payload: TwentyWebhookDto,
    handler: string,
    summary: string,
  ) {
    const log = this.buildLog(payload, 'failed', handler, summary);

    this.logs.set(log.id, log);
    await this.persist();

    return log;
  }

  getSummary() {
    const logs = [...this.logs.values()];

    return {
      total: logs.length,
      processed: logs.filter((log) => log.status === 'processed').length,
      ignored: logs.filter((log) => log.status === 'ignored').length,
      failed: logs.filter((log) => log.status === 'failed').length,
    };
  }

  getLogs(options?: {
    limit?: number;
    status?: WebhookEventLog['status'];
    event?: string;
  }) {
    const limit = options?.limit ?? 20;

    return [...this.logs.values()]
      .filter((log) => (options?.status ? log.status === options.status : true))
      .filter((log) => (options?.event ? log.event === options.event : true))
      .sort((left, right) => right.receivedAt.localeCompare(left.receivedAt))
      .slice(0, limit);
  }

  getLogById(id: string) {
    return this.logs.get(id) ?? null;
  }

  private buildLog(
    payload: TwentyWebhookDto,
    status: WebhookEventLog['status'],
    handler: string,
    summary: string,
  ): WebhookEventLog {
    const now = new Date().toISOString();

    return {
      id: randomUUID(),
      event: payload.event,
      objectName: payload.objectName ?? null,
      status,
      handler,
      summary,
      receivedAt: now,
      processedAt: now,
    };
  }

  private persist() {
    this.persistPromise = this.persistPromise.then(() =>
      this.stateRepository.save([...this.logs.values()]),
    );

    return this.persistPromise;
  }
}
