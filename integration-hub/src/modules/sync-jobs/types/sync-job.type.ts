export type SyncJobStatus = 'pending' | 'succeeded' | 'failed';

export type SyncJobErrorCategory =
  | 'auth_error'
  | 'validation_error'
  | 'rate_limit'
  | 'network_error'
  | 'server_error'
  | 'unknown';

export type SyncJob = {
  id: string;
  source: 'alibaba';
  target: 'twenty.leads';
  operation: 'upsert';
  status: SyncJobStatus;
  payload: Record<string, unknown>;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: string;
  createdAt: string;
  updatedAt: string;
  lastErrorCategory: SyncJobErrorCategory | null;
  lastErrorMessage: string | null;
  lastStatusCode: number | null;
};
