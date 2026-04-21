import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { EnterpriseConfigAuditService } from 'src/modules/enterprise/audit/services/enterprise-config-audit.service';
import { EnterpriseRecycleRecordEntity } from 'src/modules/enterprise/recycle/enterprise-recycle-record.entity';
import { ENTERPRISE_RECYCLE_RECORD_STATUS } from 'src/modules/enterprise/recycle/types/enterprise-recycle-record-status';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

type FindRecycleRecordsInput = {
  status?: string;
  page?: number;
  limit?: number;
};

@Injectable()
export class EnterpriseRecycleService {
  constructor(
    @InjectRepository(EnterpriseRecycleRecordEntity)
    private readonly enterpriseRecycleRecordRepository: Repository<EnterpriseRecycleRecordEntity>,
    private readonly enterpriseConfigAuditService: EnterpriseConfigAuditService,
  ) {}

  async findMany(
    workspaceId: string,
    resourceType: string,
    input: FindRecycleRecordsInput,
  ) {
    const page = Number.isFinite(input.page) && input.page ? input.page : 1;
    const limit =
      Number.isFinite(input.limit) && input.limit
        ? Math.min(input.limit, MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;
    const query = this.enterpriseRecycleRecordRepository
      .createQueryBuilder('record')
      .where('record.workspaceId = :workspaceId', { workspaceId })
      .andWhere('record.resourceType = :resourceType', { resourceType })
      .orderBy('record.deletedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (input.status) {
      query.andWhere('record.status = :status', { status: input.status });
    }

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      page,
      limit,
      total,
    };
  }

  async findOneOrFail(workspaceId: string, recordId: string) {
    const record = await this.enterpriseRecycleRecordRepository.findOne({
      where: {
        id: recordId,
        workspaceId,
      },
    });

    if (!record) {
      throw new NotFoundException(
        `Enterprise recycle record ${recordId} was not found`,
      );
    }

    return record;
  }

  async restore(
    workspaceId: string,
    recordId: string,
    actorWorkspaceMemberId?: string | null,
  ) {
    const record = await this.findOneOrFail(workspaceId, recordId);

    if (record.status !== ENTERPRISE_RECYCLE_RECORD_STATUS.deleted) {
      throw new BadRequestException('Only deleted records can be restored');
    }

    if (record.recoverableUntil && record.recoverableUntil < new Date()) {
      throw new BadRequestException('Recycle record is no longer recoverable');
    }

    const beforeJson = this.toAuditJson(record);

    record.status = ENTERPRISE_RECYCLE_RECORD_STATUS.restored;
    record.restoredByWorkspaceMemberId = actorWorkspaceMemberId ?? null;
    record.restoredAt = new Date();

    const restoredRecord =
      await this.enterpriseRecycleRecordRepository.save(record);

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.recycle.restore',
      resourceType: 'enterpriseRecycleRecord',
      resourceId: restoredRecord.id,
      actorWorkspaceMemberId,
      beforeJson,
      afterJson: this.toAuditJson(restoredRecord),
      contextJson: {
        resourceType: restoredRecord.resourceType,
        resourceId: restoredRecord.resourceId,
      },
    });

    return restoredRecord;
  }

  async purge(
    workspaceId: string,
    recordId: string,
    actorWorkspaceMemberId?: string | null,
  ) {
    const record = await this.findOneOrFail(workspaceId, recordId);

    if (record.status === ENTERPRISE_RECYCLE_RECORD_STATUS.purged) {
      return record;
    }

    const beforeJson = this.toAuditJson(record);

    record.status = ENTERPRISE_RECYCLE_RECORD_STATUS.purged;
    record.purgedByWorkspaceMemberId = actorWorkspaceMemberId ?? null;
    record.purgedAt = new Date();

    const purgedRecord =
      await this.enterpriseRecycleRecordRepository.save(record);

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.recycle.purge',
      resourceType: 'enterpriseRecycleRecord',
      resourceId: purgedRecord.id,
      actorWorkspaceMemberId,
      beforeJson,
      afterJson: this.toAuditJson(purgedRecord),
      contextJson: {
        resourceType: purgedRecord.resourceType,
        resourceId: purgedRecord.resourceId,
      },
    });

    return purgedRecord;
  }

  async purgeResourceType(
    workspaceId: string,
    resourceType: string,
    actorWorkspaceMemberId?: string | null,
  ) {
    const records = await this.enterpriseRecycleRecordRepository.find({
      where: {
        workspaceId,
        resourceType,
        status: ENTERPRISE_RECYCLE_RECORD_STATUS.deleted,
      },
      order: {
        deletedAt: 'DESC',
      },
    });

    const purgedAt = new Date();
    const recordIds = records.map((record) => record.id);

    if (recordIds.length > 0) {
      await this.enterpriseRecycleRecordRepository
        .createQueryBuilder()
        .update(EnterpriseRecycleRecordEntity)
        .set({
          status: ENTERPRISE_RECYCLE_RECORD_STATUS.purged,
          purgedAt,
          purgedByWorkspaceMemberId: actorWorkspaceMemberId ?? null,
        })
        .where('workspaceId = :workspaceId', { workspaceId })
        .andWhere('resourceType = :resourceType', { resourceType })
        .andWhere('status = :status', {
          status: ENTERPRISE_RECYCLE_RECORD_STATUS.deleted,
        })
        .execute();
    }

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.recycle.purgeResourceType',
      resourceType: 'enterpriseRecycleRecord',
      actorWorkspaceMemberId,
      beforeJson: {
        resourceType,
        count: recordIds.length,
        recordIds,
      },
      afterJson: {
        resourceType,
        count: recordIds.length,
        status: ENTERPRISE_RECYCLE_RECORD_STATUS.purged,
      },
    });

    return {
      purgedCount: recordIds.length,
      resourceType,
    };
  }

  private toAuditJson(record: EnterpriseRecycleRecordEntity) {
    return {
      id: record.id,
      resourceType: record.resourceType,
      resourceId: record.resourceId,
      resourceTitle: record.resourceTitle,
      status: record.status,
      deletedAt: record.deletedAt,
      restoredAt: record.restoredAt,
      purgedAt: record.purgedAt,
    };
  }
}

