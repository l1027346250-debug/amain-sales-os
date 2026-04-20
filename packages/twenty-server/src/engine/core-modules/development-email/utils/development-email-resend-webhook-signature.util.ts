import { createHmac, timingSafeEqual } from 'crypto';

const getResendWebhookSecret = () =>
  process.env.RESEND_WEBHOOK_SECRET ??
  process.env.DEVELOPMENT_EMAIL_WEBHOOK_SECRET ??
  '';

const decodeResendWebhookSecret = (secret: string) => {
  const normalizedSecret = secret.startsWith('whsec_')
    ? secret.slice('whsec_'.length)
    : secret;

  try {
    return Buffer.from(normalizedSecret, 'base64');
  } catch {
    return Buffer.from(secret, 'utf8');
  }
};

const parseSvixSignatures = (signatureHeader: string) =>
  signatureHeader
    .split(/\s+/)
    .flatMap((signatureChunk) => signatureChunk.split(' '))
    .map((signatureChunk) => signatureChunk.trim())
    .filter((signatureChunk) => signatureChunk.startsWith('v1,'))
    .map((signatureChunk) => signatureChunk.slice(3))
    .filter((signatureChunk) => signatureChunk.length > 0);

export const verifyDevelopmentEmailResendWebhookSignature = ({
  payload,
  svixId,
  svixTimestamp,
  svixSignature,
}: {
  payload: string;
  svixId: string;
  svixTimestamp: string;
  svixSignature: string;
}) => {
  const secret = getResendWebhookSecret();

  if (!secret || !svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  const signedContent = `${svixId}.${svixTimestamp}.${payload}`;
  const expectedSignature = createHmac(
    'sha256',
    decodeResendWebhookSecret(secret),
  )
    .update(signedContent)
    .digest('base64');
  const expectedSignatureBuffer = Buffer.from(expectedSignature, 'utf8');
  const providedSignatures = parseSvixSignatures(svixSignature);

  return providedSignatures.some((providedSignature) => {
    if (providedSignature.length !== expectedSignature.length) {
      return false;
    }

    return timingSafeEqual(
      expectedSignatureBuffer,
      Buffer.from(providedSignature, 'utf8'),
    );
  });
};
