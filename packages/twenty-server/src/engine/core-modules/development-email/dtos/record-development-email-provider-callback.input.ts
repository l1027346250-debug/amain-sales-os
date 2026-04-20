export class RecordDevelopmentEmailProviderCallbackInput {
  workspaceId: string;

  eventType: string;

  email: string;

  campaignId?: string;

  sendJobId?: string;

  sendTaskId?: string;

  provider?: string;

  providerMessageId?: string;

  targetUrl?: string;

  reason?: string;

  source?: string;

  metadata?: Record<string, unknown>;

  occurredAt?: Date;
}
