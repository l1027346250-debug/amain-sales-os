import { Injectable } from '@nestjs/common';

import { type ObjectLiteral } from 'typeorm';

import {
  CustomerOperationHistoryArgs,
  CustomerOperationHistoryDTO,
  CustomerOperationHistoryItemDTO,
} from 'src/engine/core-modules/customer/dto/customer-operation-history.dto';
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

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
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
    }, authContext);
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
