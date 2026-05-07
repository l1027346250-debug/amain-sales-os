import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { EnterpriseConfigAuditLogEntity } from 'src/modules/enterprise/audit/enterprise-config-audit-log.entity';

type CreateEnterpriseAuditLogInput = {
  workspaceId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  actorWorkspaceMemberId?: string | null;
  beforeJson?: Record<string, unknown> | null;
  afterJson?: Record<string, unknown> | null;
  contextJson?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class EnterpriseConfigAuditService {
  constructor(
    @InjectRepository(EnterpriseConfigAuditLogEntity)
    private readonly enterpriseConfigAuditLogRepository: Repository<EnterpriseConfigAuditLogEntity>,
  ) {}

  async createLog(input: CreateEnterpriseAuditLogInput) {
    const log = this.enterpriseConfigAuditLogRepository.create({
      workspaceId: input.workspaceId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      actorWorkspaceMemberId: input.actorWorkspaceMemberId ?? null,
      beforeJson: input.beforeJson ?? null,
      afterJson: input.afterJson ?? null,
      contextJson: input.contextJson ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    });

    return this.enterpriseConfigAuditLogRepository.save(log);
  }

  async findRecentLogsByResourceType(input: {
    workspaceId: string;
    resourceType: string;
    limit?: number;
  }) {
    return this.enterpriseConfigAuditLogRepository.find({
      where: {
        workspaceId: input.workspaceId,
        resourceType: input.resourceType,
      },
      order: {
        createdAt: 'DESC',
      },
      take: input.limit ?? 10,
    });
  }
}
