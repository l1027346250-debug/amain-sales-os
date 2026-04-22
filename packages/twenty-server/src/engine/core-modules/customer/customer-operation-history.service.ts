import { Injectable } from '@nestjs/common';

import { IsNull, type ObjectLiteral } from 'typeorm';
import { v4 } from 'uuid';

import {
  CustomerOperationHistoryArgs,
  CustomerOperationHistoryDTO,
  CustomerOperationHistoryItemDTO,
} from 'src/engine/core-modules/customer/dto/customer-operation-history.dto';
import { LogCustomerConfigChangeInput } from 'src/engine/core-modules/customer/dto/customer-config.dto';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

type WorkspaceCustomerOperationLogRecord = ObjectLiteral & {
  id: string;
  operationSummary?: string | null;
  customerId?: string | null;
  operationType?: string | null;
  operatorName?: string | null;
  operatedAt?: Date | string | null;
};

const EMPTY_OPERATION_HISTORY: CustomerOperationHistoryDTO = {
  items: [],
  totalCount: 0,
};
const CUSTOMER_CONFIG_OPERATION_TYPE = 'UPDATE_CUSTOMER_CONFIG';

const getSafeLimit = (limit: number | undefined) =>
  Math.max(1, Math.min(limit ?? 20, 100));

const normalizeString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const normalizeDateString = (value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return normalizeString(value);
};

@Injectable()
export class CustomerOperationHistoryService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly objectMetadataService: ObjectMetadataService,
  ) {}

  async getCustomerOperationHistory(
    workspaceId: string,
    args: CustomerOperationHistoryArgs,
  ): Promise<CustomerOperationHistoryDTO> {
    const hasOperationLogObject = await this.hasWorkspaceObject(
      workspaceId,
      'customerOperationLog',
    );

    if (!hasOperationLogObject) {
      return EMPTY_OPERATION_HISTORY;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const repository =
          await this.globalWorkspaceOrmManager.getRepository<WorkspaceCustomerOperationLogRecord>(
            workspaceId,
            'customerOperationLog',
            { shouldBypassPermissionChecks: true },
          );
        const [records, totalCount] = await repository.findAndCount({
          order: {
            operatedAt: 'DESC',
          },
          take: getSafeLimit(args.limit),
          where: {
            customerId: args.customerId,
          },
        });

        return {
          items: records.map((record) => this.mapOperationLog(record)),
          totalCount,
        };
      },
      authContext,
    );
  }

  async getCustomerConfigOperationHistory(
    workspaceId: string,
    limit: number | undefined,
  ): Promise<CustomerOperationHistoryDTO> {
    const hasOperationLogObject = await this.hasWorkspaceObject(
      workspaceId,
      'customerOperationLog',
    );

    if (!hasOperationLogObject) {
      return EMPTY_OPERATION_HISTORY;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const repository =
          await this.globalWorkspaceOrmManager.getRepository<WorkspaceCustomerOperationLogRecord>(
            workspaceId,
            'customerOperationLog',
            { shouldBypassPermissionChecks: true },
          );
        const [records, totalCount] = await repository.findAndCount({
          order: {
            operatedAt: 'DESC',
          },
          take: getSafeLimit(limit),
          where: {
            customerId: IsNull(),
            operationType: CUSTOMER_CONFIG_OPERATION_TYPE,
          },
        });

        return {
          items: records.map((record) => this.mapOperationLog(record)),
          totalCount,
        };
      },
      authContext,
    );
  }

  async logCustomerConfigChange({
    workspaceId,
    workspaceMemberId,
    input,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
    input: LogCustomerConfigChangeInput;
  }): Promise<CustomerOperationHistoryItemDTO> {
    const hasOperationLogObject = await this.hasWorkspaceObject(
      workspaceId,
      'customerOperationLog',
    );

    const summary =
      normalizeString(input.summary) ?? 'Updated customer settings';
    const sectionKeys = input.sectionKeys
      .map((sectionKey) => normalizeString(sectionKey))
      .filter((sectionKey): sectionKey is string => sectionKey !== null);
    const operatedAt = new Date().toISOString();

    if (!hasOperationLogObject) {
      return {
        id: v4(),
        operatedAt,
        operationSummary: this.buildConfigOperationSummary(
          summary,
          sectionKeys,
        ),
        operationType: CUSTOMER_CONFIG_OPERATION_TYPE,
        operatorName: normalizeString(workspaceMemberId) ?? 'system',
      };
    }

    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const repository =
          await this.globalWorkspaceOrmManager.getRepository<WorkspaceCustomerOperationLogRecord>(
            workspaceId,
            'customerOperationLog',
            { shouldBypassPermissionChecks: true },
          );

        const record: WorkspaceCustomerOperationLogRecord = {
          id: v4(),
          customerId: null,
          operatedAt,
          operationSummary: this.buildConfigOperationSummary(
            summary,
            sectionKeys,
          ),
          operationType: CUSTOMER_CONFIG_OPERATION_TYPE,
          operatorName: normalizeString(workspaceMemberId) ?? 'system',
        };

        await repository.insert(record);

        return this.mapOperationLog(record);
      },
      authContext,
    );
  }

  private mapOperationLog(
    record: WorkspaceCustomerOperationLogRecord,
  ): CustomerOperationHistoryItemDTO {
    return {
      id: record.id,
      operatedAt: normalizeDateString(record.operatedAt),
      operationSummary:
        normalizeString(record.operationSummary) ?? 'Customer operation',
      operationType: normalizeString(record.operationType),
      operatorName: normalizeString(record.operatorName),
    };
  }

  private buildConfigOperationSummary(summary: string, sectionKeys: string[]) {
    if (sectionKeys.length === 0) {
      return summary;
    }

    return `${summary} (${sectionKeys.join(', ')})`;
  }

  private async hasWorkspaceObject(
    workspaceId: string,
    objectNameSingular: string,
  ): Promise<boolean> {
    const objectMetadata =
      await this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
        where: {
          nameSingular: objectNameSingular,
        },
      });

    return objectMetadata !== null;
  }
}
