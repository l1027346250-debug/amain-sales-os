import { createHmac, timingSafeEqual } from 'crypto';

export type SignatureVerificationResult =
  | {
      status: 'verified';
      algorithm: 'sha256';
    }
  | {
      status: 'bypassed';
      reason: 'secret-not-configured';
    };

export const verifyHmacSha256Signature = ({
  payload,
  providedSignature,
  secret,
}: {
  payload: unknown;
  providedSignature?: string;
  secret: string;
}): SignatureVerificationResult => {
  if (!secret || secret === 'replace-me') {
    return {
      status: 'bypassed',
      reason: 'secret-not-configured',
    };
  }

  const normalizedProvidedSignature = normalizeSignature(providedSignature);
  const expectedSignature = createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const providedBuffer = Buffer.from(normalizedProvidedSignature, 'utf8');

  if (
    expectedBuffer.length === 0 ||
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    throw new Error('Invalid signature');
  }

  return {
    status: 'verified',
    algorithm: 'sha256',
  };
};

const normalizeSignature = (signature?: string) => {
  if (!signature) {
    throw new Error('Missing signature');
  }

  return signature.startsWith('sha256=')
    ? signature.slice('sha256='.length)
    : signature;
};
