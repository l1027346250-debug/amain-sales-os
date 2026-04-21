import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ILike, In, IsNull, Repository } from 'typeorm';
import { type LinksMetadata } from 'twenty-shared/types';

import { CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { EnterpriseConfigAuditService } from 'src/modules/enterprise/audit/services/enterprise-config-audit.service';
import { CreateEnterpriseCustomerExportJobDto } from 'src/modules/enterprise/customer-export/dtos/create-enterprise-customer-export-job.dto';
import { PreviewEnterpriseCustomerExportCountDto } from 'src/modules/enterprise/customer-export/dtos/preview-enterprise-customer-export-count.dto';
import { EnterpriseCustomerExportJobEntity } from 'src/modules/enterprise/customer-export/enterprise-customer-export-job.entity';
import { ENTERPRISE_CUSTOMER_EXPORT_STATUS } from 'src/modules/enterprise/customer-export/types/enterprise-customer-export-status';
import { EnterpriseEntityBindingService } from 'src/modules/enterprise/entity-binding/services/enterprise-entity-binding.service';
import { EnterpriseFieldDefinitionEntity } from 'src/modules/enterprise/field-definition/enterprise-field-definition.entity';
import { EnterpriseFieldDefinitionService } from 'src/modules/enterprise/field-definition/services/enterprise-field-definition.service';
import { EnterpriseFieldValueEntity } from 'src/modules/enterprise/field-value/enterprise-field-value.entity';
import { EnterpriseEntityType } from 'src/modules/enterprise/shared/types/enterprise-entity-type';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

const DEFAULT_CUSTOMER_EXPORT_FIELD_CODES = [
  'name',
  'domainName',
  'accountOwnerId',
  'createdAt',
];

@Injectable()
export class EnterpriseCustomerExportService {
  constructor(
    @InjectRepository(EnterpriseCustomerExportJobEntity)
    private readonly enterpriseCustomerExportJobRepository: Repository<EnterpriseCustomerExportJobEntity>,
    @InjectRepository(EnterpriseFieldValueEntity)
    private readonly enterpriseFieldValueRepository: Repository<EnterpriseFieldValueEntity>,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly workspaceQueueService: MessageQueueService,
    private readonly enterpriseConfigAuditService: EnterpriseConfigAuditService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly enterpriseEntityBindingService: EnterpriseEntityBindingService,
    private readonly enterpriseFieldDefinitionService: EnterpriseFieldDefinitionService,
  ) {}

  async previewCount(
    workspaceId: string,
    dto: PreviewEnterpriseCustomerExportCountDto,
  ) {
    const estimatedCustomerCount = await this.countCustomers(workspaceId, dto);

    return { estimatedCustomerCount };
  }

  async createJob(
    workspaceId: string,
    dto: CreateEnterpriseCustomerExportJobDto,
    actorWorkspaceMemberId?: string | null,
  ) {
    const customerCount = await this.countCustomers(workspaceId, dto.filter);
    const selectedFieldCodes = this.normalizeSelectedFieldCodes(
      dto.selectedFieldCodes,
    );
    const normalizedFilter = this.normalizeFilter(dto.filter);
    const jobToCreate: EnterpriseCustomerExportJobEntity =
      this.enterpriseCustomerExportJobRepository.create({
        workspaceId,
        taskName: dto.taskName.trim(),
        filterJson: normalizedFilter,
        selectedFieldCodes,
        customerCount,
        status: ENTERPRISE_CUSTOMER_EXPORT_STATUS.PENDING,
        fileUrl: null,
        fileExpiresAt: null,
        errorMessage: null,
        createdByWorkspaceMemberId: actorWorkspaceMemberId ?? null,
        startedAt: null,
        finishedAt: null,
      });

    const job: EnterpriseCustomerExportJobEntity =
      await this.enterpriseCustomerExportJobRepository.save(jobToCreate);

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.customerExport.create',
      resourceType: 'enterpriseCustomerExportJob',
      resourceId: job.id,
      actorWorkspaceMemberId,
      afterJson: {
        taskName: job.taskName,
        selectedFieldCodes,
        customerCount,
      },
      contextJson: {
        filter: normalizedFilter,
      },
    });

    await this.enqueueJob(workspaceId, job.id, actorWorkspaceMemberId);

    return this.findOneOrFail(workspaceId, job.id);
  }

  async enqueueJob(
    workspaceId: string,
    jobId: string,
    actorWorkspaceMemberId?: string | null,
  ) {
    const job = await this.findOneOrFail(workspaceId, jobId);

    await this.enterpriseCustomerExportJobRepository.save({
      ...job,
      status: ENTERPRISE_CUSTOMER_EXPORT_STATUS.PENDING,
      errorMessage: null,
      startedAt: null,
      finishedAt: null,
      fileUrl: null,
      fileExpiresAt: null,
    });

    await this.workspaceQueueService.add<EnterpriseCustomerExportJobData>(
      EnterpriseCustomerExportJob.name,
      {
        workspaceId,
        jobId,
        actorWorkspaceMemberId: actorWorkspaceMemberId ?? null,
      },
    );

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.customerExport.enqueue',
      resourceType: 'enterpriseCustomerExportJob',
      resourceId: job.id,
      actorWorkspaceMemberId,
      afterJson: {
        taskName: job.taskName,
        status: ENTERPRISE_CUSTOMER_EXPORT_STATUS.PENDING,
      },
    });

    return this.findOneOrFail(workspaceId, jobId);
  }

  async processJob(
    workspaceId: string,
    jobId: string,
    actorWorkspaceMemberId?: string | null,
  ) {
    const job = await this.findOneOrFail(workspaceId, jobId);

    await this.enterpriseCustomerExportJobRepository.save({
      ...job,
      status: ENTERPRISE_CUSTOMER_EXPORT_STATUS.RUNNING,
      startedAt: job.startedAt ?? new Date(),
      finishedAt: null,
      errorMessage: null,
    });

    try {
      const selectedFieldCodes = this.normalizeSelectedFieldCodes(
        job.selectedFieldCodes,
      );
      const customers = await this.findCustomersForExport(
        workspaceId,
        job.filterJson,
      );

      await this.enterpriseCustomerExportJobRepository.save({
        ...job,
        selectedFieldCodes,
        customerCount: customers.length,
        status: ENTERPRISE_CUSTOMER_EXPORT_STATUS.COMPLETED,
        fileUrl: `/api/enterprise/customer-export/jobs/${job.id}/download`,
        fileExpiresAt: null,
        errorMessage: null,
        finishedAt: new Date(),
      });

      await this.enterpriseConfigAuditService.createLog({
        workspaceId,
        action: 'enterprise.customerExport.complete',
        resourceType: 'enterpriseCustomerExportJob',
        resourceId: job.id,
        actorWorkspaceMemberId,
        afterJson: {
          taskName: job.taskName,
          rowCount: customers.length,
          fieldCount: selectedFieldCodes.length,
        },
      });

      return this.findOneOrFail(workspaceId, job.id);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown export error';

      await this.enterpriseCustomerExportJobRepository.save({
        ...job,
        status: ENTERPRISE_CUSTOMER_EXPORT_STATUS.FAILED,
        errorMessage,
        finishedAt: new Date(),
      });

      throw error;
    }
  }

  async downloadCsvExport(workspaceId: string, jobId: string) {
    const job = await this.findOneOrFail(workspaceId, jobId);

    if (job.status !== ENTERPRISE_CUSTOMER_EXPORT_STATUS.COMPLETED) {
      throw new BadRequestException(
        `Enterprise customer export job ${jobId} is not ready for download`,
      );
    }

    const selectedFieldCodes = this.normalizeSelectedFieldCodes(
      job.selectedFieldCodes,
    );
    const selectedFieldLabels = await this.buildSelectedFieldLabels(
      workspaceId,
      selectedFieldCodes,
    );
    const customers = await this.findCustomersForExport(workspaceId, job.filterJson);
    const customFieldValueMap = await this.buildCustomFieldValueMap(
      workspaceId,
      customers.map((customer) => customer.id),
      selectedFieldCodes,
    );
    const rows = customers.map((customer) =>
      selectedFieldCodes.map((fieldCode) =>
        this.resolveExportCellValue(
          customer,
          fieldCode,
          customFieldValueMap.get(`${customer.id}:${fieldCode}`),
        ),
      ),
    );

    return {
      fileName: this.buildExportFileName(job.taskName, job.id),
      csvContent: this.buildCsvContent([
        selectedFieldCodes.map(
          (fieldCode) => selectedFieldLabels.get(fieldCode) ?? fieldCode,
        ),
        ...rows,
      ]),
      rowCount: rows.length,
    };
  }

  async findMany(workspaceId: string) {
    return this.enterpriseCustomerExportJobRepository.find({
      where: { workspaceId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOneOrFail(workspaceId: string, jobId: string) {
    const job = await this.enterpriseCustomerExportJobRepository.findOne({
      where: {
        id: jobId,
        workspaceId,
      },
    });

    if (!job) {
      throw new NotFoundException(
        `Enterprise customer export job ${jobId} was not found`,
      );
    }

    return job;
  }

  private async countCustomers(
    workspaceId: string,
    filter?: PreviewEnterpriseCustomerExportCountDto,
  ) {
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const companyRepository =
          await this.globalWorkspaceOrmManager.getRepository<CompanyWorkspaceEntity>(
            workspaceId,
            'company',
            { shouldBypassPermissionChecks: true },
          );

        return companyRepository.count({
          where: {
            deletedAt: IsNull(),
            ...(filter?.keyword?.trim()
              ? {
                  name: ILike(`%${filter.keyword.trim()}%`),
                }
              : {}),
            ...(filter?.accountOwnerId
              ? {
                  accountOwnerId: filter.accountOwnerId,
                }
              : {}),
          },
        });
      },
      authContext,
    );
  }

  private async findCustomersForExport(
    workspaceId: string,
    filterJson?: Record<string, unknown> | null,
  ): Promise<CompanyWorkspaceEntity[]> {
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const companyRepository =
          await this.globalWorkspaceOrmManager.getRepository<CompanyWorkspaceEntity>(
            workspaceId,
            'company',
            { shouldBypassPermissionChecks: true },
          );

        return companyRepository.find({
          where: {
            deletedAt: IsNull(),
            ...this.buildCustomerWhereInput(filterJson),
          },
          order: {
            createdAt: 'DESC',
          },
        });
      },
      authContext,
    );
  }

  private normalizeSelectedFieldCodes(selectedFieldCodes: string[]) {
    const normalizedFieldCodes = selectedFieldCodes
      .map((fieldCode) => fieldCode.trim())
      .filter((fieldCode) => fieldCode.length > 0);

    if (normalizedFieldCodes.length === 0) {
      return DEFAULT_CUSTOMER_EXPORT_FIELD_CODES;
    }

    return [...new Set(normalizedFieldCodes)];
  }

  private async buildSelectedFieldLabels(
    workspaceId: string,
    selectedFieldCodes: string[],
  ) {
    const baseFieldLabels = new Map<string, string>([
      ['name', '客户名称'],
      ['domainName', '网站域名'],
      ['accountOwnerId', '负责人'],
      ['createdAt', '创建时间'],
    ]);
    const customFieldDefinitions =
      await this.enterpriseFieldDefinitionService.findMany(
        workspaceId,
        EnterpriseEntityType.CUSTOMER,
      );

    for (const fieldDefinition of customFieldDefinitions) {
      if (selectedFieldCodes.includes(fieldDefinition.fieldCode)) {
        baseFieldLabels.set(
          fieldDefinition.fieldCode,
          fieldDefinition.fieldName,
        );
      }
    }

    return baseFieldLabels;
  }

  private async buildCustomFieldValueMap(
    workspaceId: string,
    recordIds: string[],
    selectedFieldCodes: string[],
  ) {
    const customFieldDefinitions =
      await this.enterpriseFieldDefinitionService.findMany(
        workspaceId,
        EnterpriseEntityType.CUSTOMER,
      );
    const selectedCustomFields = customFieldDefinitions.filter((fieldDefinition) =>
      selectedFieldCodes.includes(fieldDefinition.fieldCode),
    );

    if (recordIds.length === 0 || selectedCustomFields.length === 0) {
      return new Map<string, unknown>();
    }

    const customerBinding =
      await this.enterpriseEntityBindingService.resolveBindingOrFail(
        workspaceId,
        EnterpriseEntityType.CUSTOMER,
      );
    const fieldDefinitionMap = new Map<string, EnterpriseFieldDefinitionEntity>(
      selectedCustomFields.map((fieldDefinition) => [
        fieldDefinition.id,
        fieldDefinition,
      ]),
    );
    const fieldValues = await this.enterpriseFieldValueRepository.find({
      where: {
        workspaceId,
        entityBindingId: customerBinding.id,
        recordId: In(recordIds),
        fieldDefinitionId: In(selectedCustomFields.map((field) => field.id)),
      },
    });
    const customFieldValueMap = new Map<string, unknown>();

    for (const fieldValue of fieldValues) {
      const fieldDefinition = fieldDefinitionMap.get(fieldValue.fieldDefinitionId);

      if (!fieldDefinition) {
        continue;
      }

      customFieldValueMap.set(
        `${fieldValue.recordId}:${fieldDefinition.fieldCode}`,
        this.resolveEnterpriseFieldValue(fieldValue),
      );
    }

    return customFieldValueMap;
  }

  private buildCustomerWhereInput(filterJson?: Record<string, unknown> | null) {
    const keyword =
      typeof filterJson?.keyword === 'string' ? filterJson.keyword.trim() : '';
    const accountOwnerId =
      typeof filterJson?.accountOwnerId === 'string'
        ? filterJson.accountOwnerId
        : '';

    return {
      ...(keyword
        ? {
            name: ILike(`%${keyword}%`),
          }
        : {}),
      ...(accountOwnerId
        ? {
            accountOwnerId,
          }
        : {}),
    };
  }

  private resolveExportCellValue(
    customer: CompanyWorkspaceEntity,
    fieldCode: string,
    customFieldValue?: unknown,
  ): string {
    if (customFieldValue !== undefined) {
      return this.stringifyExportValue(customFieldValue);
    }

    switch (fieldCode) {
      case 'name':
        return customer.name ?? '';
      case 'domainName':
        return this.resolvePrimaryLinkUrl(customer.domainName);
      case 'accountOwnerId':
        return customer.accountOwnerId ?? '';
      case 'createdAt':
        return customer.createdAt ?? '';
      default:
        return '';
    }
  }

  private resolveEnterpriseFieldValue(fieldValue: EnterpriseFieldValueEntity) {
    if (fieldValue.valueStringArray?.length) {
      return fieldValue.valueStringArray.join(' | ');
    }

    if (fieldValue.valueString !== null) {
      return fieldValue.valueString;
    }

    if (fieldValue.valueNumber !== null) {
      return fieldValue.valueNumber;
    }

    if (fieldValue.valueBoolean !== null) {
      return fieldValue.valueBoolean ? 'true' : 'false';
    }

    if (fieldValue.valueDate !== null) {
      return fieldValue.valueDate.toISOString();
    }

    return fieldValue.valueJson ?? '';
  }

  private resolvePrimaryLinkUrl(domainName: LinksMetadata | null | undefined) {
    return domainName?.primaryLinkUrl ?? '';
  }

  private buildCsvContent(rows: string[][]) {
    return rows
      .map((row) =>
        row
          .map((cell) =>
            `"${this.stringifyExportValue(cell).replace(/"/g, '""')}"`,
          )
          .join(','),
      )
      .join('\n');
  }

  private stringifyExportValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.stringifyExportValue(item)).join(' | ');
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  private buildExportFileName(taskName: string, jobId: string) {
    const normalizedTaskName = taskName
      .trim()
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, '-')
      .slice(0, 80);

    return `${normalizedTaskName || 'customer-export'}-${jobId.slice(0, 8)}.csv`;
  }

  private normalizeFilter(
    filter?: PreviewEnterpriseCustomerExportCountDto,
  ): Record<string, unknown> {
    return {
      ...(filter?.keyword?.trim()
        ? { keyword: filter.keyword.trim() }
        : {}),
      ...(filter?.accountOwnerId
        ? { accountOwnerId: filter.accountOwnerId }
        : {}),
    };
  }
}

export type EnterpriseCustomerExportJobData = {
  workspaceId: string;
  jobId: string;
  actorWorkspaceMemberId?: string | null;
};

export class EnterpriseCustomerExportJob {}
