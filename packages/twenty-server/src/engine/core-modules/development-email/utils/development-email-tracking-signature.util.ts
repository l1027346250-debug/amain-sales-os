import { createHmac, timingSafeEqual } from 'crypto';

const getTrackingSecret = () =>
  process.env.DEVELOPMENT_EMAIL_TRACKING_SECRET ??
  process.env.APP_SECRET ??
  process.env.AUTH_SECRET ??
  'development-email-tracking-secret';

const buildTrackingPayload = ({
  workspaceId,
  email,
  eventType,
  campaignId,
  sendJobId,
  sendTaskId,
  provider,
  targetUrl,
  expiresAt,
}: {
  workspaceId: string;
  email: string;
  eventType: string;
  campaignId?: string;
  sendJobId?: string;
  sendTaskId?: string;
  provider?: string;
  targetUrl?: string;
  expiresAt: string;
}) =>
  [
    workspaceId,
    email,
    eventType,
    campaignId ?? '',
    sendJobId ?? '',
    sendTaskId ?? '',
    provider ?? '',
    targetUrl ?? '',
    expiresAt,
  ].join('|');

export const signDevelopmentEmailTrackingPayload = (input: {
  workspaceId: string;
  email: string;
  eventType: string;
  campaignId?: string;
  sendJobId?: string;
  sendTaskId?: string;
  provider?: string;
  targetUrl?: string;
  expiresAt: string;
}) =>
  createHmac('sha256', getTrackingSecret())
    .update(buildTrackingPayload(input))
    .digest('hex');

export const verifyDevelopmentEmailTrackingSignature = (
  input: {
    workspaceId: string;
    email: string;
    eventType: string;
    campaignId?: string;
    sendJobId?: string;
    sendTaskId?: string;
    provider?: string;
    targetUrl?: string;
    expiresAt: string;
  },
  signature: string,
) => {
  const expectedSignature = signDevelopmentEmailTrackingPayload(input);

  if (expectedSignature.length !== signature.length) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(expectedSignature, 'utf8'),
    Buffer.from(signature, 'utf8'),
  );
};
