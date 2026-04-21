import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { type ObjectLiteral } from 'typeorm';
import { type QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { v4 } from 'uuid';

import {
  CommitCustomerImportJobInput,
  CustomerImportJobItemDTO,
  CustomerImportJobResultDTO,
  CustomerImportJobsArgs,
  CustomerImportJobsDTO,
  CustomerImportRowItemDTO,
  SaveCustomerImportMappingInput,
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

type WorkspaceCustomerImportRowRecord = ObjectLiteral & {
  id: string;
  rowLabel?: string | null;
  importJobId?: string | null;
  rowNumber?: number | string | null;
  companyName?: string | null;
  contactEmail?: string | null;
  status?: string | null;
  errorMessage?: string | null;
};

type WorkspaceCompanyRecord = ObjectLiteral & {
  id: string;
  name?: string | null;
};

type WorkspaceTimelineActivityRecord = ObjectLiteral & {
  id: string;
  createdAt?: string | null;
  happensAt?: string | null;
  linkedObjectMetadataId?: string | null;
  linkedRecordCachedName?: string | null;
  linkedRecordId?: string | null;
  name?: string | null;
  properties?: Record<string, unknown> | null;
  targetCompanyId?: string | null;
  updatedAt?: string | null;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_DESTINATION = 'CUSTOMER_LIST';
const DRAFT_STATUS = 'DRAFT';
const COMPLETED_STATUS = 'COMPLETED';
const FAILED_STATUS = 'FAILED';
const PRIVATE_PUBLIC_POOL_STATE = 'PRIVATE';
const PUBLIC_POOL_STATE = 'PUBLIC_POOL';
const DEFAULT_PUBLIC_POOL_GROUP = 'GENERAL_PUBLIC_POOL';
const COMPANY_NAME_MAPPING_ALIASES = new Set([
  'company name',
  'company_name',
  'companyname',
  '公司名称',
]);

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

const normalizeMappingKey = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

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

  async saveCustomerImportMapping({
    workspaceId,
    input,
  }: {
    workspaceId: string;
    input: SaveCustomerImportMappingInput;
  }): Promise<CustomerImportJobItemDTO> {
    await this.assertImportJobObject(workspaceId);

    const mappedFields = input.mappedFields
      .map(normalizeString)
      .filter((field): field is string => field !== null);

    if (mappedFields.length === 0) {
      throw new BadRequestException('At least one mapped field is required.');
    }

    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const repository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspaceCustomerImportJobRecord>(
          workspaceId,
          'customerImportJob',
          { shouldBypassPermissionChecks: true },
        );
      const job = await this.findImportJobOrThrow(repository, input.jobId);
      const updatePayload = {
        selectedFields: mappedFields,
        status: DRAFT_STATUS,
      } as unknown as QueryDeepPartialEntity<WorkspaceCustomerImportJobRecord>;

      await repository.update(input.jobId, updatePayload);

      return this.mapImportJob({
        ...job,
        selectedFields: mappedFields,
        status: DRAFT_STATUS,
      });
    }, authContext);
  }

  async commitCustomerImportJob({
    workspaceId,
    input,
  }: {
    workspaceId: string;
    input: CommitCustomerImportJobInput;
  }): Promise<CustomerImportJobResultDTO> {
    await this.assertImportJobObject(workspaceId);

    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const jobRepository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspaceCustomerImportJobRecord>(
          workspaceId,
          'customerImportJob',
          { shouldBypassPermissionChecks: true },
        );
      const job = await this.findImportJobOrThrow(jobRepository, input.jobId);
      const mappedFields = Array.isArray(job.selectedFields)
        ? job.selectedFields.filter((field) => normalizeString(field) !== null)
        : [];

      if (mappedFields.length === 0) {
        throw new BadRequestException('Import mapping must be saved before commit.');
      }

      const now = new Date().toISOString();
      const validationError = this.getImportValidationError({
        job,
        mappedFields,
      });
      const existingRows = await this.findImportRows(workspaceId, input.jobId);
      const importedCustomerCount =
        !validationError && existingRows.length === 0
          ? await this.createImportedCustomer({
              workspaceId,
              job,
              now,
            })
          : validationError
            ? 0
            : normalizeNumber(job.successCount);
      const failedCount = validationError ? 1 : 0;
      const updatedJob: WorkspaceCustomerImportJobRecord = {
        ...job,
        executedAt: now,
        failedCount,
        status: COMPLETED_STATUS,
        successCount: importedCustomerCount,
      };

      await jobRepository.update(
        input.jobId,
        {
          executedAt: now,
          failedCount,
          status: COMPLETED_STATUS,
          successCount: importedCustomerCount,
        } as unknown as QueryDeepPartialEntity<WorkspaceCustomerImportJobRecord>,
      );
      await this.createCommitResultRow({
        workspaceId,
        job: updatedJob,
        mappedFields,
        importedCustomerCount,
        validationError,
      });

      return this.getCustomerImportJobResult(workspaceId, {
        jobId: input.jobId,
      });
    }, authContext);
  }

  async getCustomerImportJobResult(
    workspaceId: string,
    args: {
      jobId: string;
    },
  ): Promise<CustomerImportJobResultDTO> {
    const hasImportJobObject = await this.hasWorkspaceObject(
      workspaceId,
      'customerImportJob',
    );

    if (!hasImportJobObject) {
      return {
        job: null,
        rows: [],
      };
    }

    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const jobRepository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspaceCustomerImportJobRecord>(
          workspaceId,
          'customerImportJob',
          { shouldBypassPermissionChecks: true },
        );
      const job = await jobRepository.findOne({
        where: {
          id: args.jobId,
        },
      });
      const rows = (await this.findImportRows(workspaceId, args.jobId)).map((row) =>
        this.mapImportRow(row),
      );

      return {
        job: job ? this.mapImportJob(job) : null,
        rows,
      };
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

  private mapImportRow(record: WorkspaceCustomerImportRowRecord): CustomerImportRowItemDTO {
    return {
      id: record.id,
      companyName: normalizeString(record.companyName),
      contactEmail: normalizeString(record.contactEmail),
      errorMessage: normalizeString(record.errorMessage),
      rowLabel: normalizeString(record.rowLabel) ?? 'Import row',
      rowNumber: normalizeNumber(record.rowNumber),
      status: normalizeString(record.status) ?? DRAFT_STATUS,
    };
  }

  private async findImportRows(workspaceId: string, jobId: string) {
    const hasImportRowObject = await this.hasWorkspaceObject(
      workspaceId,
      'customerImportRow',
    );

    if (!hasImportRowObject) {
      return [];
    }

    const repository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceCustomerImportRowRecord>(
        workspaceId,
        'customerImportRow',
        { shouldBypassPermissionChecks: true },
      );

    return repository.find({
      order: {
        rowNumber: 'ASC',
      },
      take: 50,
      where: {
        importJobId: jobId,
      },
    });
  }

  private async createCommitResultRow({
    workspaceId,
    job,
    mappedFields,
    importedCustomerCount,
    validationError,
  }: {
    workspaceId: string;
    job: WorkspaceCustomerImportJobRecord;
    mappedFields: string[];
    importedCustomerCount: number;
    validationError: string | null;
  }) {
    const hasImportRowObject = await this.hasWorkspaceObject(
      workspaceId,
      'customerImportRow',
    );

    if (!hasImportRowObject) {
      return;
    }

    const repository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceCustomerImportRowRecord>(
        workspaceId,
        'customerImportRow',
        { shouldBypassPermissionChecks: true },
      );
    const existingRows = await repository.count({
      where: {
        importJobId: job.id,
      },
    });

    if (existingRows > 0) {
      return;
    }

    await repository.insert({
      id: v4(),
      companyName: this.getImportCompanyName(job),
      contactEmail: null,
      errorMessage:
        validationError ??
        (importedCustomerCount > 0
          ? `Created ${importedCustomerCount} customer record(s). Mapping fields: ${mappedFields.join(', ')}`
          : `Mapping persisted for fields: ${mappedFields.join(', ')}`),
      importJobId: job.id,
      rowLabel: validationError ? 'Import row failed' : 'Import mapping committed',
      rowNumber: 1,
      status: validationError ? FAILED_STATUS : COMPLETED_STATUS,
    });
  }

  private async createImportedCustomer({
    workspaceId,
    job,
    now,
  }: {
    workspaceId: string;
    job: WorkspaceCustomerImportJobRecord;
    now: string;
  }) {
    const hasCompanyObject = await this.hasWorkspaceObject(workspaceId, 'company');

    if (!hasCompanyObject) {
      return 0;
    }

    const companyName = this.getImportCompanyName(job) ?? 'Imported customer';
    const companyRepository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceCompanyRecord>(
        workspaceId,
        'company',
        { shouldBypassPermissionChecks: true },
      );
    const customerId = v4();

    await companyRepository.insert({
      id: customerId,
      createdAt: now,
      name: companyName,
      publicPoolEnteredAt:
        normalizeString(job.destination) === PUBLIC_POOL_STATE ? now : null,
      publicPoolGroup:
        normalizeString(job.destination) === PUBLIC_POOL_STATE
          ? DEFAULT_PUBLIC_POOL_GROUP
          : null,
      publicPoolState:
        normalizeString(job.destination) === PUBLIC_POOL_STATE
          ? PUBLIC_POOL_STATE
          : PRIVATE_PUBLIC_POOL_STATE,
      updatedAt: now,
    });
    await this.createImportedCustomerTimelineEvent({
      workspaceId,
      customerId,
      companyName,
      job,
      now,
    });

    return 1;
  }

  private async createImportedCustomerTimelineEvent({
    workspaceId,
    customerId,
    companyName,
    job,
    now,
  }: {
    workspaceId: string;
    customerId: string;
    companyName: string;
    job: WorkspaceCustomerImportJobRecord;
    now: string;
  }) {
    const hasTimelineActivityObject = await this.hasWorkspaceObject(
      workspaceId,
      'timelineActivity',
    );

    if (!hasTimelineActivityObject) {
      return;
    }

    const timelineActivityRepository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceTimelineActivityRecord>(
        workspaceId,
        'timelineActivity',
        { shouldBypassPermissionChecks: true },
      );

    await timelineActivityRepository.insert({
      id: v4(),
      createdAt: now,
      happensAt: now,
      linkedObjectMetadataId: null,
      linkedRecordCachedName: `Customer imported from ${normalizeString(job.fileName) ?? 'import job'}`,
      linkedRecordId: customerId,
      name: 'customer.import.created',
      properties: {
        customerId,
        destination: normalizeString(job.destination) ?? DEFAULT_DESTINATION,
        fileName: normalizeString(job.fileName),
      },
      targetCompanyId: customerId,
      updatedAt: now,
    });
  }

  private getImportValidationError({
    job,
    mappedFields,
  }: {
    job: WorkspaceCustomerImportJobRecord;
    mappedFields: string[];
  }) {
    const hasCompanyNameMapping = mappedFields.some((field) =>
      COMPANY_NAME_MAPPING_ALIASES.has(normalizeMappingKey(field)),
    );

    if (!hasCompanyNameMapping) {
      return 'Company name mapping is required before committing a customer import.';
    }

    if (!this.getImportCompanyName(job)) {
      return 'Company name could not be inferred from the import file name.';
    }

    return null;
  }

  private getImportCompanyName(job: WorkspaceCustomerImportJobRecord) {
    return normalizeString(normalizeString(job.fileName)?.replace(/\.[^.]+$/, ''));
  }

  private async findImportJobOrThrow(
    repository: {
      findOne: (args: { where: { id: string } }) => Promise<WorkspaceCustomerImportJobRecord | null>;
    },
    jobId: string,
  ) {
    const job = await repository.findOne({
      where: {
        id: jobId,
      },
    });

    if (!job) {
      throw new NotFoundException('Customer import job was not found.');
    }

    return job;
  }

  private async assertImportJobObject(workspaceId: string) {
    const hasImportJobObject = await this.hasWorkspaceObject(
      workspaceId,
      'customerImportJob',
    );

    if (!hasImportJobObject) {
      throw new BadRequestException('Customer import job object is not available.');
    }
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
