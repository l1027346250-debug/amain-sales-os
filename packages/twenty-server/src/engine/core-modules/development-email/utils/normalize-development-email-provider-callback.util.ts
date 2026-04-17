import { BadRequestException } from '@nestjs/common';

import { type RecordDevelopmentEmailProviderCallbackInput } from 'src/engine/core-modules/development-email/dtos/record-development-email-provider-callback.input';

const normalizeEventType = (value: string) => {
  const normalizedValue = value.toLowerCase();

  if (
    normalizedValue === 'sent' ||
    normalizedValue === 'delivered' ||
    normalizedValue === 'opened' ||
    normalizedValue === 'clicked' ||
    normalizedValue === 'replied' ||
    normalizedValue === 'complaint' ||
    normalizedValue === 'unsubscribed'
  ) {
    return normalizedValue;
  }

  if (
    normalizedValue === 'bounce' ||
    normalizedValue === 'hard_bounce' ||
    normalizedValue === 'hard bounce'
  ) {
    return 'hard_bounce';
  }

  if (normalizedValue === 'soft_bounce' || normalizedValue === 'soft bounce') {
    return 'soft_bounce';
  }

  return normalizedValue;
};

const ensureString = (value: unknown, fieldName: string) => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new BadRequestException(`${fieldName} is required`);
  }

  return value;
};

const getObjectValue = (value: unknown) =>
  value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined;

const normalizeUnifiedPayload = (
  payload: Record<string, unknown>,
): RecordDevelopmentEmailProviderCallbackInput => ({
  workspaceId: ensureString(payload.workspaceId, 'workspaceId'),
  eventType: normalizeEventType(ensureString(payload.eventType, 'eventType')),
  email: ensureString(payload.email, 'email'),
  campaignId:
    typeof payload.campaignId === 'string' ? payload.campaignId : undefined,
  sendJobId:
    typeof payload.sendJobId === 'string' ? payload.sendJobId : undefined,
  sendTaskId:
    typeof payload.sendTaskId === 'string' ? payload.sendTaskId : undefined,
  provider: typeof payload.provider === 'string' ? payload.provider : undefined,
  providerMessageId:
    typeof payload.providerMessageId === 'string'
      ? payload.providerMessageId
      : undefined,
  targetUrl:
    typeof payload.targetUrl === 'string' ? payload.targetUrl : undefined,
  reason: typeof payload.reason === 'string' ? payload.reason : undefined,
  source: typeof payload.source === 'string' ? payload.source : undefined,
  metadata:
    payload.metadata && typeof payload.metadata === 'object'
      ? (payload.metadata as Record<string, unknown>)
      : undefined,
  occurredAt:
    typeof payload.occurredAt === 'string'
      ? new Date(payload.occurredAt)
      : undefined,
});

const normalizeResendPayload = (
  payload: Record<string, unknown>,
): RecordDevelopmentEmailProviderCallbackInput => {
  const data =
    payload.data && typeof payload.data === 'object'
      ? (payload.data as Record<string, unknown>)
      : payload;
  const toValue = Array.isArray(data.to) ? data.to[0] : data.to;
  const bounce = getObjectValue(data.bounce);

  return {
    workspaceId: ensureString(
      typeof payload.workspaceId === 'string'
        ? payload.workspaceId
        : typeof data.workspaceId === 'string'
          ? data.workspaceId
          : '',
      'workspaceId',
    ),
    eventType: normalizeEventType(
      ensureString(
        typeof payload.type === 'string'
          ? payload.type.replace('email.', '')
          : typeof data.type === 'string'
            ? data.type.replace('email.', '')
            : '',
        'eventType',
      ),
    ),
    email: ensureString(toValue, 'email'),
    campaignId:
      typeof data.campaignId === 'string' ? data.campaignId : undefined,
    sendJobId: typeof data.sendJobId === 'string' ? data.sendJobId : undefined,
    sendTaskId:
      typeof data.sendTaskId === 'string' ? data.sendTaskId : undefined,
    provider: 'resend',
    providerMessageId:
      typeof data.email_id === 'string'
        ? data.email_id
        : typeof data.providerMessageId === 'string'
          ? data.providerMessageId
          : undefined,
    targetUrl: typeof data.targetUrl === 'string' ? data.targetUrl : undefined,
    reason:
      typeof data.reason === 'string'
        ? data.reason
        : typeof bounce?.type === 'string'
          ? String(bounce.type)
          : undefined,
    source: 'resend-webhook',
    metadata: data,
    occurredAt:
      typeof data.created_at === 'string'
        ? new Date(data.created_at)
        : typeof data.occurredAt === 'string'
          ? new Date(data.occurredAt)
          : undefined,
  };
};

const normalizeSesSnsPayload = (
  payload: Record<string, unknown>,
): RecordDevelopmentEmailProviderCallbackInput => {
  const message =
    typeof payload.Message === 'string'
      ? (JSON.parse(payload.Message) as Record<string, unknown>)
      : payload;
  const mail =
    message.mail && typeof message.mail === 'object'
      ? (message.mail as Record<string, unknown>)
      : {};
  const commonHeaders =
    mail.commonHeaders && typeof mail.commonHeaders === 'object'
      ? (mail.commonHeaders as Record<string, unknown>)
      : {};
  const bounce = getObjectValue(message.bounce);
  const complaint = getObjectValue(message.complaint);
  const destination = Array.isArray(mail.destination)
    ? mail.destination[0]
    : '';
  const eventType = ensureString(
    typeof message.notificationType === 'string'
      ? message.notificationType
      : typeof message.eventType === 'string'
        ? message.eventType
        : '',
    'eventType',
  );

  return {
    workspaceId: ensureString(
      typeof payload.workspaceId === 'string'
        ? payload.workspaceId
        : typeof commonHeaders['X-Workspace-Id'] === 'string'
          ? String(commonHeaders['X-Workspace-Id'])
          : '',
      'workspaceId',
    ),
    eventType: normalizeEventType(eventType),
    email: ensureString(destination, 'email'),
    campaignId:
      typeof commonHeaders['X-Campaign-Id'] === 'string'
        ? String(commonHeaders['X-Campaign-Id'])
        : undefined,
    sendJobId:
      typeof commonHeaders['X-Send-Job-Id'] === 'string'
        ? String(commonHeaders['X-Send-Job-Id'])
        : undefined,
    sendTaskId:
      typeof commonHeaders['X-Send-Task-Id'] === 'string'
        ? String(commonHeaders['X-Send-Task-Id'])
        : undefined,
    provider: 'ses',
    providerMessageId:
      typeof mail.messageId === 'string' ? mail.messageId : undefined,
    reason:
      typeof bounce?.bounceType === 'string'
        ? String(bounce.bounceType)
        : typeof complaint?.complaintFeedbackType === 'string'
          ? String(complaint.complaintFeedbackType)
          : undefined,
    source: 'ses-sns',
    metadata: message,
    occurredAt:
      typeof mail.timestamp === 'string' ? new Date(mail.timestamp) : undefined,
  };
};

export const normalizeDevelopmentEmailProviderCallback = ({
  providerFormat,
  payload,
}: {
  providerFormat?: string;
  payload: Record<string, unknown>;
}): RecordDevelopmentEmailProviderCallbackInput => {
  const normalizedProviderFormat = providerFormat?.toLowerCase() ?? 'unified';

  if (
    normalizedProviderFormat === 'unified' ||
    normalizedProviderFormat === 'development-email'
  ) {
    return normalizeUnifiedPayload(payload);
  }

  if (normalizedProviderFormat === 'resend') {
    return normalizeResendPayload(payload);
  }

  if (
    normalizedProviderFormat === 'ses-sns' ||
    normalizedProviderFormat === 'ses'
  ) {
    return normalizeSesSnsPayload(payload);
  }

  throw new BadRequestException(
    `Unsupported development email webhook provider format: ${providerFormat}`,
  );
};
