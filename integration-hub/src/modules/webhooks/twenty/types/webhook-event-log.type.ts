export type WebhookProcessingStatus = 'processed' | 'ignored' | 'failed';

export type WebhookEventLog = {
  id: string;
  event: string;
  objectName: string | null;
  status: WebhookProcessingStatus;
  handler: string;
  summary: string;
  receivedAt: string;
  processedAt: string;
};
