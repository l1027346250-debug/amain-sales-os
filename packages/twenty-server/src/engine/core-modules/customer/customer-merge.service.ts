import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { In, type ObjectLiteral } from 'typeorm';
import { type QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { v4 } from 'uuid';

import {
  MergeCustomersInput,
  MergeCustomersResultDTO,
} from 'src/engine/core-modules/customer/dto/customer-merge.dto';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

type WorkspaceCompanyRecord = ObjectLiteral & {
  id: string;
  name?: string | null;
  accountOwnerId?: string | null;
};

type WorkspaceCustomerMergeLogRecord = ObjectLiteral & {
  id: string;
  mergeSummary: string;
  primaryCustomerId?: string | null;
  mergedCustomerIds?: string | null;
  mergedAt?: string | null;
};

type WorkspaceCustomerOperationLogRecord = ObjectLiteral & {
  id: string;
  operationSummary: string;
  customerId?: string | null;
  operationType?: string | null;
  operatorName?: string | null;
  operatedAt?: string | null;
};

type RelationMigrationConfig = {
  objectNameSingular: string;
  fieldName: string;
};

const RELATION_MIGRATION_CONFIGS: RelationMigrationConfig[] = [
  {
    objectNameSingular: 'person',
    fieldName: 'companyId',
  },
  {
    objectNameSingular: 'opportunity',
    fieldName: 'companyId',
  },
  {
    objectNameSingular: 'timelineActivity',
    fieldName: 'targetCompanyId',
  },
  {
    objectNameSingular: 'taskTarget',
    fieldName: 'targetCompanyId',
  },
  {
    objectNameSingular: 'noteTarget',
    fieldName: 'targetCompanyId',
  },
  {
    objectNameSingular: 'attachment',
    fieldName: 'targetCompanyId',
  },
];

const normalizeString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const dedupeIds = (ids: string[]) => [
  ...new Set(ids.map((id) => id.trim()).filter((id) => id.length > 0)),
];

@Injectable()
export class CustomerMergeService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly objectMetadataService: ObjectMetadataService,
  ) {}

  async mergeCustomers({
    workspaceId,
    workspaceMemberId,
    input,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
    input: MergeCustomersInput;
  }): Promise<MergeCustomersResultDTO> {
    const primaryCustomerId = input.primaryCustomerId.trim();
    const duplicateCustomerIds = dedupeIds(input.duplicateCustomerIds).filter(
      (customerId) => customerId !== primaryCustomerId,
    );

    if (primaryCustomerId.length === 0) {
      throw new BadRequestException('Primary customer is required for merge.');
    }

    if (duplicateCustomerIds.length === 0) {
      throw new BadRequestException(
        'At least one duplicate customer is required for merge.',
      );
    }

    const authContext = buildSystemAuthContext(workspaceId);
    const hasCompanyObject = await this.hasWorkspaceObject(workspaceId, 'company');

    if (!hasCompanyObject) {
      throw new BadRequestException('Customer merge requires company object.');
    }

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const companyRepository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspaceCompanyRecord>(
          workspaceId,
          'company',
          { shouldBypassPermissionChecks: true },
        );
      const [primaryCustomer, duplicateCustomers] = await Promise.all([
        companyRepository.findOne({
          where: {
            id: primaryCustomerId,
          },
        }),
        companyRepository.find({
          where: {
            id: In(duplicateCustomerIds),
          },
        }),
      ]);

      if (!primaryCustomer) {
        throw new NotFoundException('Primary customer was not found.');
      }

      if (duplicateCustomers.length !== duplicateCustomerIds.length) {
        throw new NotFoundException('One or more duplicate customers were not found.');
      }

      const migrationCounts = await this.migrateRelatedRecords({
        workspaceId,
        primaryCustomerId,
        duplicateCustomerIds,
      });
      const now = new Date().toISOString();

      await companyRepository.update(
        {
          id: In(duplicateCustomerIds),
        },
        {
          publicPoolState: 'MERGED',
          publicPoolGroup: 'MERGED_CUSTOMERS',
          publicPoolEnteredAt: now,
          publicPoolOriginalOwnerId: duplicateCustomers[0]?.accountOwnerId ?? null,
          customerStage: 'MERGED_CUSTOMER',
        } as unknown as QueryDeepPartialEntity<WorkspaceCompanyRecord>,
      );

      const mergeLogId = await this.createMergeLog({
        workspaceId,
        primaryCustomer,
        duplicateCustomerIds,
        now,
        reason: normalizeString(input.reason),
      });

      await this.createOperationLogs({
        workspaceId,
        workspaceMemberId,
        primaryCustomerId,
        duplicateCustomerIds,
        now,
      });

      return {
        primaryCustomerId,
        mergedCustomerIds: duplicateCustomerIds,
        migratedContactCount: migrationCounts.person,
        migratedOpportunityCount: migrationCounts.opportunity,
        migratedTimelineCount: migrationCounts.timelineActivity,
        migratedAttachmentCount:
          migrationCounts.attachment +
          migrationCounts.taskTarget +
          migrationCounts.noteTarget,
        mergeLogId,
      };
    }, authContext);
  }

  private async migrateRelatedRecords({
    workspaceId,
    primaryCustomerId,
    duplicateCustomerIds,
  }: {
    workspaceId: string;
    primaryCustomerId: string;
    duplicateCustomerIds: string[];
  }) {
    const migrationResults = await Promise.all(
      RELATION_MIGRATION_CONFIGS.map(async (config) => {
        const hasObject = await this.hasWorkspaceObject(
          workspaceId,
          config.objectNameSingular,
        );

        if (!hasObject) {
          return [config.objectNameSingular, 0] as const;
        }

        const repository =
          await this.globalWorkspaceOrmManager.getRepository<ObjectLiteral>(
            workspaceId,
            config.objectNameSingular,
            { shouldBypassPermissionChecks: true },
          );
        const updateResult = await repository.update(
          {
            [config.fieldName]: In(duplicateCustomerIds),
          },
          {
            [config.fieldName]: primaryCustomerId,
          },
        );

        return [config.objectNameSingular, updateResult.affected ?? 0] as const;
      }),
    );

    return migrationResults.reduce<Record<string, number>>(
      (accumulator, [objectNameSingular, affectedCount]) => ({
        ...accumulator,
        [objectNameSingular]: affectedCount,
      }),
      {
        attachment: 0,
        noteTarget: 0,
        opportunity: 0,
        person: 0,
        taskTarget: 0,
        timelineActivity: 0,
      },
    );
  }

  private async createMergeLog({
    workspaceId,
    primaryCustomer,
    duplicateCustomerIds,
    now,
    reason,
  }: {
    workspaceId: string;
    primaryCustomer: WorkspaceCompanyRecord;
    duplicateCustomerIds: string[];
    now: string;
    reason: string | null;
  }) {
    const hasMergeLogObject = await this.hasWorkspaceObject(
      workspaceId,
      'customerMergeLog',
    );

    if (!hasMergeLogObject) {
      return null;
    }

    const mergeLogRepository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceCustomerMergeLogRecord>(
        workspaceId,
        'customerMergeLog',
        { shouldBypassPermissionChecks: true },
      );
    const mergeLogId = v4();
    const mergeSummaryParts = [
      `Merged ${duplicateCustomerIds.length} customer(s) into ${
        normalizeString(primaryCustomer.name) ?? primaryCustomer.id
      }`,
      reason,
    ].filter((part): part is string => part !== null);

    await mergeLogRepository.insert({
      id: mergeLogId,
      mergeSummary: mergeSummaryParts.join(' - '),
      primaryCustomerId: primaryCustomer.id,
      mergedCustomerIds: JSON.stringify(duplicateCustomerIds),
      mergedAt: now,
    });

    return mergeLogId;
  }

  private async createOperationLogs({
    workspaceId,
    workspaceMemberId,
    primaryCustomerId,
    duplicateCustomerIds,
    now,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
    primaryCustomerId: string;
    duplicateCustomerIds: string[];
    now: string;
  }) {
    const hasOperationLogObject = await this.hasWorkspaceObject(
      workspaceId,
      'customerOperationLog',
    );

    if (!hasOperationLogObject) {
      return;
    }

    const operationLogRepository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceCustomerOperationLogRecord>(
        workspaceId,
        'customerOperationLog',
        { shouldBypassPermissionChecks: true },
      );
    const operatorName = workspaceMemberId ?? 'system';

    await operationLogRepository.insert([
      {
        id: v4(),
        operationSummary: `Merged ${duplicateCustomerIds.length} customer(s) into primary customer ${primaryCustomerId}`,
        customerId: primaryCustomerId,
        operationType: 'MERGE_CUSTOMERS_PRIMARY',
        operatorName,
        operatedAt: now,
      },
      ...duplicateCustomerIds.map((customerId) => ({
        id: v4(),
        operationSummary: `Customer ${customerId} merged into ${primaryCustomerId}`,
        customerId,
        operationType: 'MERGE_CUSTOMERS_DUPLICATE',
        operatorName,
        operatedAt: now,
      })),
    ]);
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
}
