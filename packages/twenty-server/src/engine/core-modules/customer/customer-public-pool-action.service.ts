import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { In, type ObjectLiteral } from 'typeorm';
import { type QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { v4 } from 'uuid';

import {
  ClaimPublicPoolCustomerInput,
  CustomerPublicPoolActionResultDTO,
  MoveCustomersToPublicPoolInput,
} from 'src/engine/core-modules/customer/dto/customer-public-pool-action.dto';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

type WorkspaceCompanyRecord = ObjectLiteral & {
  id: string;
  accountOwnerId?: string | null;
};

type WorkspaceCustomerOperationLogRecord = ObjectLiteral & {
  id: string;
  operationSummary: string;
  customerId?: string | null;
  operationType?: string | null;
  operatorName?: string | null;
  operatedAt?: string | null;
};

const PRIVATE_STATE = 'PRIVATE';
const PUBLIC_POOL_STATE = 'PUBLIC_POOL';
const DEFAULT_PUBLIC_POOL_GROUP = 'GENERAL_PUBLIC_POOL';

const dedupeIds = (ids: string[]) => [
  ...new Set(ids.map((id) => id.trim()).filter((id) => id.length > 0)),
];

const normalizeString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

@Injectable()
export class CustomerPublicPoolActionService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly objectMetadataService: ObjectMetadataService,
  ) {}

  async claimPublicPoolCustomer({
    workspaceId,
    workspaceMemberId,
    input,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
    input: ClaimPublicPoolCustomerInput;
  }): Promise<CustomerPublicPoolActionResultDTO> {
    const customerId = input.customerId.trim();

    if (customerId.length === 0) {
      throw new BadRequestException('Customer is required for public-pool claim.');
    }

    return this.updatePublicPoolState({
      workspaceId,
      workspaceMemberId,
      customerIds: [customerId],
      publicPoolState: PRIVATE_STATE,
      publicPoolGroup: null,
      operationType: 'CLAIM_PUBLIC_POOL_CUSTOMER',
      reason: null,
    });
  }

  async moveCustomersToPublicPool({
    workspaceId,
    workspaceMemberId,
    input,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
    input: MoveCustomersToPublicPoolInput;
  }): Promise<CustomerPublicPoolActionResultDTO> {
    const customerIds = dedupeIds(input.customerIds);

    if (customerIds.length === 0) {
      throw new BadRequestException(
        'At least one customer is required to move to public pool.',
      );
    }

    return this.updatePublicPoolState({
      workspaceId,
      workspaceMemberId,
      customerIds,
      publicPoolState: PUBLIC_POOL_STATE,
      publicPoolGroup:
        normalizeString(input.publicPoolGroup) ?? DEFAULT_PUBLIC_POOL_GROUP,
      operationType: 'MOVE_CUSTOMERS_TO_PUBLIC_POOL',
      reason: normalizeString(input.reason),
    });
  }

  private async updatePublicPoolState({
    workspaceId,
    workspaceMemberId,
    customerIds,
    publicPoolState,
    publicPoolGroup,
    operationType,
    reason,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
    customerIds: string[];
    publicPoolState: string;
    publicPoolGroup: string | null;
    operationType: string;
    reason: string | null;
  }): Promise<CustomerPublicPoolActionResultDTO> {
    const hasCompanyObject = await this.hasWorkspaceObject(workspaceId, 'company');

    if (!hasCompanyObject) {
      throw new BadRequestException('Public-pool actions require company object.');
    }

    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const companyRepository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspaceCompanyRecord>(
          workspaceId,
          'company',
          { shouldBypassPermissionChecks: true },
        );
      const companyRecords = await companyRepository.find({
        where: {
          id: In(customerIds),
        },
      });

      if (companyRecords.length !== customerIds.length) {
        throw new NotFoundException('One or more customers were not found.');
      }

      const now = new Date().toISOString();
      const updatePayload =
        publicPoolState === PUBLIC_POOL_STATE
          ? {
              publicPoolState,
              publicPoolGroup,
              publicPoolEnteredAt: now,
              publicPoolOriginalOwnerId: companyRecords[0]?.accountOwnerId ?? null,
            }
          : {
              publicPoolState,
              publicPoolGroup: null,
              publicPoolEnteredAt: null,
              ...(workspaceMemberId ? { accountOwnerId: workspaceMemberId } : {}),
            };
      const updateResult = await companyRepository.update(
        {
          id: In(customerIds),
        },
        updatePayload as unknown as QueryDeepPartialEntity<WorkspaceCompanyRecord>,
      );

      await this.createOperationLogs({
        workspaceId,
        workspaceMemberId,
        customerIds,
        operationType,
        reason,
        now,
      });

      return {
        customerIds,
        affectedCount: updateResult.affected ?? 0,
        publicPoolState,
      };
    }, authContext);
  }

  private async createOperationLogs({
    workspaceId,
    workspaceMemberId,
    customerIds,
    operationType,
    reason,
    now,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
    customerIds: string[];
    operationType: string;
    reason: string | null;
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
    const operationSummarySuffix = reason ? ` - ${reason}` : '';

    await operationLogRepository.insert(
      customerIds.map((customerId) => ({
        id: v4(),
        operationSummary: `${operationType} for ${customerId}${operationSummarySuffix}`,
        customerId,
        operationType,
        operatorName: workspaceMemberId ?? 'system',
        operatedAt: now,
      })),
    );
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
