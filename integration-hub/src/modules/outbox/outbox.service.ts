import * as path from 'node:path';
import { randomUUID } from 'crypto';

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

import { JsonFileStateRepository } from 'src/common/state/json-file-state.repository';
import { PostgresStateRepository } from 'src/common/state/postgres-state.repository';
import { StateRepository } from 'src/common/state/state.repository';
import { IntegrationHubEnv } from 'src/config/env';
import { OutboxEvent } from 'src/modules/outbox/types/outbox-event.type';

@Injectable()
export class OutboxService implements OnModuleInit {
  private readonly events = new Map<string, OutboxEvent>();
  private readonly stateRepository: StateRepository<OutboxEvent>;
  private persistPromise = Promise.resolve();

  constructor(
    private readonly configService: ConfigService<IntegrationHubEnv, true>,
  ) {
    const stateDirectory =
      this.configService.get('INTEGRATION_HUB_STATE_DIR', { infer: true }) ??
      path.join(process.cwd(), 'tmp', 'integration-hub-state');
    const stateBackend =
      this.configService.get('INTEGRATION_HUB_STATE_BACKEND', {
        infer: true,
      }) ?? 'file';

    if (stateBackend === 'postgres') {
      const connectionString =
        this.configService.get('INTEGRATION_HUB_STATE_PG_URL', {
          infer: true,
        }) ?? process.env.PG_DATABASE_URL;

      if (!connectionString) {
        throw new Error(
          'INTEGRATION_HUB_STATE_BACKEND=postgres requires INTEGRATION_HUB_STATE_PG_URL or PG_DATABASE_URL',
        );
      }

      this.stateRepository = new PostgresStateRepository<OutboxEvent>(
        new Pool({ connectionString }),
        'integration_hub_outbox_events',
      );

      return;
    }

    this.stateRepository = new JsonFileStateRepository<OutboxEvent>(
      path.join(stateDirectory, 'outbox-events.json'),
    );
  }

  async onModuleInit() {
    for (const event of await this.stateRepository.load()) {
      this.events.set(event.id, event);
    }
  }

  async recordEvent(input: Omit<OutboxEvent, 'id' | 'createdAt' | 'status'>) {
    const event: OutboxEvent = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      status: 'ready',
      processedAt: null,
      consumerName: null,
      ackedBy: null,
      ...input,
    };

    this.events.set(event.id, event);
    await this.persist();

    return event;
  }

  getSummary() {
    const events = [...this.events.values()];
    const processedByConsumer = events
      .filter(
        (event) => event.status === 'processed' && event.consumerName?.trim(),
      )
      .reduce<Record<string, number>>((accumulator, event) => {
        const consumerName = event.consumerName as string;

        accumulator[consumerName] = (accumulator[consumerName] ?? 0) + 1;

        return accumulator;
      }, {});

    return {
      total: events.length,
      ready: events.filter((event) => event.status === 'ready').length,
      processed: events.filter((event) => event.status === 'processed').length,
      processedByConsumer,
      byAggregateType: {
        lead: events.filter((event) => event.aggregateType === 'lead').length,
        opportunity: events.filter((event) => event.aggregateType === 'opportunity')
          .length,
      },
    };
  }

  getEvents(options?: {
    limit?: number;
    aggregateType?: OutboxEvent['aggregateType'];
    eventType?: string;
    status?: OutboxEvent['status'];
    consumerName?: string;
    since?: string;
  }) {
    const limit = options?.limit ?? 20;
    const sinceValue =
      options?.since && !Number.isNaN(Date.parse(options.since))
        ? new Date(options.since).toISOString()
        : null;

    return [...this.events.values()]
      .filter((event) => (options?.status ? event.status === options.status : true))
      .filter((event) =>
        options?.aggregateType ? event.aggregateType === options.aggregateType : true,
      )
      .filter((event) => (options?.eventType ? event.eventType === options.eventType : true))
      .filter((event) =>
        options?.consumerName ? event.consumerName === options.consumerName : true,
      )
      .filter((event) =>
        sinceValue ? event.createdAt > sinceValue : true,
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  getEventById(id: string) {
    return this.events.get(id) ?? null;
  }

  getConsumerBatch(options?: {
    limit?: number;
    aggregateType?: OutboxEvent['aggregateType'];
    eventType?: string;
    consumerName?: string;
    since?: string;
  }) {
    const events = this.getEvents({
      ...options,
      status: 'ready',
    });

    return {
      exportedAt: new Date().toISOString(),
      eventCount: events.length,
      aggregateType: options?.aggregateType ?? null,
      eventType: options?.eventType ?? null,
      since: options?.since ?? null,
      events,
    };
  }

  async markProcessed(
    id: string,
    metadata?: {
      consumerName?: string | null;
      ackedBy?: string | null;
    },
  ) {
    const event = this.events.get(id);

    if (!event) {
      return null;
    }

    if (event.status === 'processed') {
      return event;
    }

    const updatedEvent: OutboxEvent = {
      ...event,
      status: 'processed',
      processedAt: new Date().toISOString(),
      consumerName: metadata?.consumerName ?? event.consumerName ?? null,
      ackedBy: metadata?.ackedBy ?? event.ackedBy ?? null,
    };

    this.events.set(id, updatedEvent);
    await this.persist();

    return updatedEvent;
  }

  async markProcessedBatch(
    ids: string[],
    metadata?: {
      consumerName?: string | null;
      ackedBy?: string | null;
    },
  ) {
    const processedEvents: OutboxEvent[] = [];

    for (const id of ids) {
      const event = await this.markProcessed(id, metadata);

      if (event) {
        processedEvents.push(event);
      }
    }

    return {
      requestedCount: ids.length,
      processedCount: processedEvents.length,
      events: processedEvents,
    };
  }

  private persist() {
    this.persistPromise = this.persistPromise.then(() =>
      this.stateRepository.save([...this.events.values()]),
    );

    return this.persistPromise;
  }
}
