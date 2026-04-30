import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { EnterpriseMailboxProfileEntity } from 'src/modules/enterprise/mailbox-control/entities/enterprise-mailbox-profile.entity';

@Injectable()
export class EnterpriseMailboxHealthService {
  constructor(
    @InjectRepository(EnterpriseMailboxProfileEntity)
    private readonly enterpriseMailboxProfileRepository: Repository<EnterpriseMailboxProfileEntity>,
  ) {}

  async listMailboxHealth(workspaceId: string) {
    const profiles = await this.enterpriseMailboxProfileRepository.find({
      order: { updatedAt: 'DESC' },
      where: { workspaceId },
    });

    return profiles.map((profile) => ({
      emailAddress: profile.emailAddress,
      lastSyncAt: profile.lastSyncAt,
      lastSyncStatus: profile.lastSyncStatus,
      mailboxProfileId: profile.id,
      provider: profile.provider,
      status: profile.status,
      validationStatus: profile.validationStatus,
    }));
  }
}
