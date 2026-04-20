import { createHmac, timingSafeEqual } from 'crypto';

import { type RecordDevelopmentEmailProviderCallbackInput } from 'src/engine/core-modules/development-email/dtos/record-development-email-provider-callback.input';

const getWebhookSecret = () =>
  process.env.DEVELOPMENT_EMAIL_WEBHOOK_SECRET ??
  process.env.DEVELOPMENT_EMAIL_TRACKING_SECRET ??
  process.env.APP_SECRET ??
  process.env.AUTH_SECRET ??
  'development-email-webhook-secret';

const buildWebhookPayload = (
  input: RecordDevelopmentEmailProviderCallbackInput,
  timestamp: string,
) =>
  [
    timestamp,
    input.workspaceId,
    input.eventType,
    input.email,
    input.campaignId ?? '',
    input.sendJobId ?? '',
    input.sendTaskId ?? '',
    input.provider ?? '',
    input.providerMessageId ?? '',
    input.targetUrl ?? '',
    input.reason ?? '',
    input.source ?? '',
    input.occurredAt?.toISOString?.() ?? '',
    JSON.stringify(input.metadata ?? {}),
  ].join('|');

export const signDevelopmentEmailWebhookPayload = (
  input: RecordDevelopmentEmailProviderCallbackInput,
  timestamp: string,
) =>
  createHmac('sha256', getWebhookSecret())
    .update(buildWebhookPayload(input, timestamp))
    .digest('hex');

export const verifyDevelopmentEmailWebhookSignature = ({
  input,
  timestamp,
  signature,
}: {
  input: RecordDevelopmentEmailProviderCallbackInput;
  timestamp: string;
  signature: string;
}) => {
  const expectedSignature = signDevelopmentEmailWebhookPayload(
    input,
    timestamp,
  );

  if (expectedSignature.length !== signature.length) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(expectedSignature, 'utf8'),
    Buffer.from(signature, 'utf8'),
  );
};
