export type OutboxEventStatus = 'ready' | 'processed';

export type OutboxEvent = {
  id: string;
  source: 'twenty-webhook';
  eventType: string;
  aggregateType: 'lead' | 'opportunity';
  aggregateId: string;
  status: OutboxEventStatus;
  payload: Record<string, unknown>;
  createdAt: string;
  processedAt?: string | null;
  consumerName?: string | null;
  ackedBy?: string | null;
};
