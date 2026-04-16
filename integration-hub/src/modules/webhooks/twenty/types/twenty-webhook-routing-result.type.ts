export type TwentyWebhookRoutingResult = {
  status: 'processed' | 'ignored';
  handler: string;
  summary: string;
  eventLogId: string;
  outboxEventId: string | null;
  downstreamAction: string | null;
};
