import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { type ObjectLiteral } from 'typeorm';
import { type QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { v4 } from 'uuid';

import {
  CreateCustomerFollowUpInput,
  CreateCustomerFollowUpResultDTO,
} from 'src/engine/core-modules/customer/dto/customer-follow-up.dto';
import {
  CustomerTimelineArgs,
  CustomerTimelineDTO,
  CustomerTimelineItemDTO,
} from 'src/engine/core-modules/customer/dto/customer-timeline.dto';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

type WorkspaceTimelineActivityRecord = ObjectLiteral & {
  id: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  happensAt?: Date | string | null;
  name?: string | null;
  properties?: Record<string, unknown> | null;
  linkedRecordCachedName?: string | null;
  linkedRecordId?: string | null;
  linkedObjectMetadataId?: string | null;
  workspaceMember?: Record<string, unknown> | null;
  workspaceMemberId?: string | null;
  targetCompanyId?: string | null;
};

type WorkspaceCompanyRecord = ObjectLiteral & {
  id: string;
  name?: string | null;
  lastContactAt?: Date | string | null;
  lastFollowUpAt?: Date | string | null;
};

type WorkspaceOpportunityRecord = ObjectLiteral & {
  id: string;
  updatedAt?: Date | string | null;
  name?: string | null;
  amount?: Record<string, unknown> | null;
  closeDate?: Date | string | null;
  lastActivityDate?: Date | string | null;
  stage?: string | null;
  companyId?: string | null;
  owner?: Record<string, unknown> | null;
};

const EMPTY_CUSTOMER_TIMELINE: CustomerTimelineDTO = {
  items: [],
  totalCount: 0,
};

const getSafeLimit = (limit: number | undefined) =>
  Math.max(1, Math.min(limit ?? 20, 100));

const normalizeString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const normalizeDateString = (value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return typeof value === 'string' && value.length > 0 ? value : null;
};

const getRelationName = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const relation = value as {
    firstName?: unknown;
    lastName?: unknown;
    name?: unknown;
  };

  if (typeof relation.name === 'string' && relation.name.trim().length > 0) {
    return relation.name.trim();
  }

  const fullName = [relation.firstName, relation.lastName]
    .map(normalizeString)
    .filter((part): part is string => part !== null)
    .join(' ')
    .trim();

  return fullName.length > 0 ? fullName : null;
};

const getCurrencyLabel = (value: unknown) => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const amount = value as {
    amountMicros?: unknown;
    currencyCode?: unknown;
  };

  if (typeof amount.amountMicros !== 'number') {
    return null;
  }

  const currencyCode =
    typeof amount.currencyCode === 'string' && amount.currencyCode.length > 0
      ? amount.currencyCode
      : 'USD';

  return `${currencyCode} ${(amount.amountMicros / 1_000_000).toLocaleString(
    undefined,
    {
      maximumFractionDigits: 2,
    },
  )}`;
};

@Injectable()
export class CustomerTimelineService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly objectMetadataService: ObjectMetadataService,
  ) {}

  async getCustomerTimeline(
    workspaceId: string,
    args: CustomerTimelineArgs,
  ): Promise<CustomerTimelineDTO> {
    const authContext = buildSystemAuthContext(workspaceId);
    const [hasTimelineActivityObject, hasOpportunityObject] = await Promise.all([
      this.hasWorkspaceObject(workspaceId, 'timelineActivity'),
      this.hasWorkspaceObject(workspaceId, 'opportunity'),
    ]);

    if (!hasTimelineActivityObject && !hasOpportunityObject) {
      return EMPTY_CUSTOMER_TIMELINE;
    }

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const [timelineActivityItems, opportunityItems] = await Promise.all([
        hasTimelineActivityObject
          ? this.findTimelineActivityItems(workspaceId, args.customerId)
          : Promise.resolve([]),
        hasOpportunityObject
          ? this.findOpportunityItems(workspaceId, args.customerId)
          : Promise.resolve([]),
      ]);

      const items = [...timelineActivityItems, ...opportunityItems]
        .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
        .slice(0, getSafeLimit(args.limit));

      return {
        items,
        totalCount: timelineActivityItems.length + opportunityItems.length,
      };
    }, authContext);
  }

  async createCustomerFollowUp({
    workspaceId,
    workspaceMemberId,
    input,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
    input: CreateCustomerFollowUpInput;
  }): Promise<CreateCustomerFollowUpResultDTO> {
    const body = input.body.trim();

    if (body.length === 0) {
      throw new BadRequestException('Follow-up body cannot be empty.');
    }

    const authContext = buildSystemAuthContext(workspaceId);
    const [hasCompanyObject, hasTimelineActivityObject] = await Promise.all([
      this.hasWorkspaceObject(workspaceId, 'company'),
      this.hasWorkspaceObject(workspaceId, 'timelineActivity'),
    ]);

    if (!hasCompanyObject || !hasTimelineActivityObject) {
      throw new BadRequestException(
        'Customer follow-up requires company and timelineActivity objects.',
      );
    }

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const companyRepository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspaceCompanyRecord>(
          workspaceId,
          'company',
          { shouldBypassPermissionChecks: true },
        );
      const timelineActivityRepository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspaceTimelineActivityRecord>(
          workspaceId,
          'timelineActivity',
          { shouldBypassPermissionChecks: true },
        );

      const customerRecord = await companyRepository.findOne({
        where: {
          id: input.customerId,
        },
      });

      if (!customerRecord) {
        throw new NotFoundException('Customer was not found.');
      }

      const now = new Date().toISOString();
      const timelineActivityRecord: WorkspaceTimelineActivityRecord = {
        id: v4(),
        name: 'customer.follow_up.created',
        properties: {
          body,
          customerId: input.customerId,
        },
        linkedRecordCachedName: body.slice(0, 140),
        linkedRecordId: input.customerId,
        linkedObjectMetadataId: null,
        workspaceMemberId: workspaceMemberId ?? null,
        targetCompanyId: input.customerId,
        happensAt: now,
        createdAt: now,
        updatedAt: now,
      };

      await timelineActivityRepository.insert(timelineActivityRecord);
      const companyUpdate = {
        lastContactAt: now,
        lastFollowUpAt: now,
      } as unknown as QueryDeepPartialEntity<WorkspaceCompanyRecord>;

      await companyRepository.update(input.customerId, companyUpdate);

      return {
        timelineItem: this.mapTimelineActivityRecord(timelineActivityRecord),
        lastFollowUpAt: now,
      };
    }, authContext);
  }

  private async hasWorkspaceObject(
    workspaceId: string,
    objectNameSingular: string,
  ): Promise<boolean> {
    const objectMetadata = await this.objectMetadataService.findOneWithinWorkspace(
      workspaceId,
      {
        where: {
          nameSingular: objectNameSingular,
        },
      },
    );

    return objectMetadata !== null;
  }

  private async findTimelineActivityItems(
    workspaceId: string,
    customerId: string,
  ): Promise<CustomerTimelineItemDTO[]> {
    const repository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceTimelineActivityRecord>(
        workspaceId,
        'timelineActivity',
        { shouldBypassPermissionChecks: true },
      );

    const records = await repository.find({
      where: {
        targetCompanyId: customerId,
      },
      order: {
        happensAt: 'DESC',
      },
      take: 50,
      relations: ['workspaceMember'],
    });

    return records.map((record) => this.mapTimelineActivityRecord(record));
  }

  private async findOpportunityItems(
    workspaceId: string,
    customerId: string,
  ): Promise<CustomerTimelineItemDTO[]> {
    const repository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceOpportunityRecord>(
        workspaceId,
        'opportunity',
        { shouldBypassPermissionChecks: true },
      );

    const records = await repository.find({
      where: {
        companyId: customerId,
      },
      order: {
        updatedAt: 'DESC',
      },
      take: 20,
      relations: ['owner'],
    });

    return records.map((record) => this.mapOpportunityRecord(record));
  }

  private mapTimelineActivityRecord(
    record: WorkspaceTimelineActivityRecord,
  ): CustomerTimelineItemDTO {
    const occurredAt =
      normalizeDateString(record.happensAt) ??
      new Date(0).toISOString();
    const title =
      normalizeString(record.name) ??
      normalizeString(record.linkedRecordCachedName) ??
      'Customer activity';

    return {
      id: record.id,
      occurredAt,
      type: 'activity',
      title,
      description: normalizeString(record.linkedRecordCachedName),
      actorName: getRelationName(record.workspaceMember),
      sourceObjectName: 'timelineActivity',
      sourceRecordId: normalizeString(record.linkedRecordId) ?? record.id,
      metadata:
        record.properties && typeof record.properties === 'object'
          ? record.properties
          : null,
    };
  }

  private mapOpportunityRecord(
    record: WorkspaceOpportunityRecord,
  ): CustomerTimelineItemDTO {
    const occurredAt =
      normalizeDateString(record.lastActivityDate) ??
      normalizeDateString(record.updatedAt) ??
      new Date(0).toISOString();
    const amountLabel = getCurrencyLabel(record.amount);
    const stageLabel = normalizeString(record.stage);
    const detailParts = [stageLabel, amountLabel]
      .filter((value): value is string => value !== null)
      .join(' / ');

    return {
      id: `opportunity-${record.id}`,
      occurredAt,
      type: 'opportunity',
      title: normalizeString(record.name) ?? 'Opportunity updated',
      description: detailParts.length > 0 ? detailParts : 'Commercial activity updated',
      actorName: getRelationName(record.owner),
      sourceObjectName: 'opportunity',
      sourceRecordId: record.id,
      metadata: {
        stage: stageLabel,
        amount: record.amount ?? null,
        closeDate: normalizeDateString(record.closeDate),
      },
    };
  }
}
