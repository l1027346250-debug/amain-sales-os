import { BadRequestException, Injectable } from '@nestjs/common';

import { type ObjectLiteral } from 'typeorm';
import { v4 } from 'uuid';

import {
  CustomerImportJobItemDTO,
  CustomerImportJobsArgs,
  CustomerImportJobsDTO,
  StartCustomerImportJobInput,
} from 'src/engine/core-modules/customer/dto/customer-import-job.dto';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

type WorkspaceCustomerImportJobRecord = ObjectLiteral & {
  id: string;
  fileName?: string | null;
  destination?: string | null;
  updateExistingContacts?: boolean | null;
  selectedFields?: string[] | null;
  status?: string | null;
  successCount?: number | string | null;
  failedCount?: number | string | null;
  executedAt?: Date | string | null;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_DESTINATION = 'CUSTOMER_LIST';
const DRAFT_STATUS = 'DRAFT';

const normalizeString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const normalizeNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  return 0;
};

const normalizeDateString = (value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return normalizeString(value);
};

const getSafeLimit = (limit: number | undefined) =>
  Math.max(1, Math.min(limit ?? DEFAULT_LIMIT, MAX_LIMIT));

@Injectable()
export class CustomerImportJobService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly objectMetadataService: ObjectMetadataService,
  ) {}

  async getCustomerImportJobs(
    workspaceId: string,
    args: CustomerImportJobsArgs,
  ): Promise<CustomerImportJobsDTO> {
    const hasImportJobObject = await this.hasWorkspaceObject(
      workspaceId,
      'customerImportJob',
    );

    if (!hasImportJobObject) {
      return {
        jobs: [],
        totalCount: 0,
      };
    }

    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const repository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspaceCustomerImportJobRecord>(
          workspaceId,
          'customerImportJob',
          { shouldBypassPermissionChecks: true },
        );
      const [records, totalCount] = await repository.findAndCount({
        order: {
          executedAt: 'DESC',
        },
        take: getSafeLimit(args.limit),
      });

      return {
        jobs: records.map((record) => this.mapImportJob(record)),
        totalCount,
      };
    }, authContext);
  }

  async startCustomerImportJob({
    workspaceId,
    input,
  }: {
    workspaceId: string;
    input: StartCustomerImportJobInput;
  }): Promise<CustomerImportJobItemDTO> {
    const fileName = normalizeString(input.fileName);

    if (!fileName) {
      throw new BadRequestException('Import file name is required.');
    }

    const hasImportJobObject = await this.hasWorkspaceObject(
      workspaceId,
      'customerImportJob',
    );

    if (!hasImportJobObject) {
      throw new BadRequestException('Customer import job object is not available.');
    }

    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const repository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspaceCustomerImportJobRecord>(
          workspaceId,
          'customerImportJob',
          { shouldBypassPermissionChecks: true },
        );
      const now = new Date().toISOString();
      const record: WorkspaceCustomerImportJobRecord = {
        id: v4(),
        fileName,
        destination: normalizeString(input.destination) ?? DEFAULT_DESTINATION,
        updateExistingContacts: input.updateExistingContacts,
        selectedFields: input.selectedFields.filter(
          (field) => normalizeString(field) !== null,
        ),
        status: DRAFT_STATUS,
        successCount: 0,
        failedCount: 0,
        executedAt: now,
      };

      await repository.insert(record);

      return this.mapImportJob(record);
    }, authContext);
  }

  private mapImportJob(
    record: WorkspaceCustomerImportJobRecord,
  ): CustomerImportJobItemDTO {
    return {
      id: record.id,
      fileName: normalizeString(record.fileName) ?? 'Customer import',
      destination: normalizeString(record.destination) ?? DEFAULT_DESTINATION,
      updateExistingContacts: record.updateExistingContacts === true,
      selectedFields: Array.isArray(record.selectedFields)
        ? record.selectedFields.filter((field) => normalizeString(field) !== null)
        : [],
      status: normalizeString(record.status) ?? DRAFT_STATUS,
      successCount: normalizeNumber(record.successCount),
      failedCount: normalizeNumber(record.failedCount),
      executedAt: normalizeDateString(record.executedAt),
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
