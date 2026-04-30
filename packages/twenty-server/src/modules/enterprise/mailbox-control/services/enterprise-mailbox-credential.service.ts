import { Injectable } from '@nestjs/common';

@Injectable()
export class EnterpriseMailboxCredentialService {
  async storeSecret({
    key,
    secret,
    workspaceId,
  }: {
    key: string;
    secret: string;
    workspaceId: string;
  }) {
    const encodedSecret = Buffer.from(secret, 'utf8').toString('base64');

    return `mailbox:${workspaceId}:${key}:${encodedSecret}`;
  }

  async resolveSecret(credentialRef: string) {
    const parts = credentialRef.split(':');
    const encodedSecret = parts.at(-1);

    if (!encodedSecret) {
      return '';
    }

    return Buffer.from(encodedSecret, 'base64').toString('utf8');
  }
}
