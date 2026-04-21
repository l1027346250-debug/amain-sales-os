import { BadRequestException, Injectable } from '@nestjs/common';

import { type ObjectLiteral } from 'typeorm';
import { type QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { v4 } from 'uuid';

import { ExecuteCustomerPublicPoolRulesResultDTO } from 'src/engine/core-modules/customer/dto/customer-public-pool-rule-execution.dto';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

type WorkspaceCompanyRecord = ObjectLiteral & {
  id: string;
  accountOwnerId?: string | null;
  customerStage?: string | null;
  lastContactAt?: Date | string | null;
  lastFollowUpAt?: Date | string | null;
  name?: string | null;
  publicPoolState?: string | null;
};

type WorkspacePublicPoolRuleRecord = ObjectLiteral & {
  id: string;
  ruleName?: string | null;
  inactivityDays?: number | string | null;
  scopeStages?: string[] | null;
  publicPoolGroup?: string | null;
  isEnabled?: boolean | null;
};

type WorkspaceCustomerOperationLogRecord = ObjectLiteral & {
  id: string;
  operationSummary: string;
  customerId?: string | null;
  operationType?: string | null;
  operatorName?: string | null;
  operatedAt?: string | null;
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
  workspaceMemberId?: string | null;
};

const PUBLIC_POOL_STATE = 'PUBLIC_POOL';
const DEFAULT_PUBLIC_POOL_GROUP = 'GENERAL_PUBLIC_POOL';
const DEFAULT_INACTIVITY_DAYS = 30;

const normalizeString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const normalizeNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
};

const normalizeDate = (value: unknown) => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' && value.length > 0) {
    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
};

const normalizeStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is string =>
          typeof entry === 'string' && entry.trim().length > 0,
      )
    : [];

@Injectable()
export class CustomerPublicPoolRuleExecutionService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly objectMetadataService: ObjectMetadataService,
  ) {}

  async executeCustomerPublicPoolRules({
    workspaceId,
    workspaceMemberId,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
  }): Promise<ExecuteCustomerPublicPoolRulesResultDTO> {
    await Promise.all([
      this.assertWorkspaceObject(workspaceId, 'company'),
      this.assertWorkspaceObject(workspaceId, 'customerPublicPoolRule'),
    ]);

    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const ruleRepository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspacePublicPoolRuleRecord>(
          workspaceId,
          'customerPublicPoolRule',
          { shouldBypassPermissionChecks: true },
        );
      const companyRepository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspaceCompanyRecord>(
          workspaceId,
          'company',
          { shouldBypassPermissionChecks: true },
        );
      const [ruleRecords, companyRecords] = await Promise.all([
        ruleRepository.find({
          where: {
            isEnabled: true,
          },
        }),
        companyRepository.find({
          take: 1000,
        }),
      ]);
      const enabledRules = ruleRecords.filter((rule) => rule.isEnabled !== false);
      const eligibleCustomers = this.findEligibleCustomers({
        companyRecords,
        rules: enabledRules,
      });

      if (eligibleCustomers.length === 0) {
        return {
          affectedCount: 0,
          customerIds: [],
          evaluatedRuleCount: enabledRules.length,
        };
      }

      const now = new Date().toISOString();

      for (const eligibleCustomer of eligibleCustomers) {
        await companyRepository.update(
          eligibleCustomer.customer.id,
          {
            publicPoolEnteredAt: now,
            publicPoolGroup:
              normalizeString(eligibleCustomer.rule.publicPoolGroup) ??
              DEFAULT_PUBLIC_POOL_GROUP,
            publicPoolOriginalOwnerId: eligibleCustomer.customer.accountOwnerId ?? null,
            publicPoolState: PUBLIC_POOL_STATE,
          } as unknown as QueryDeepPartialEntity<WorkspaceCompanyRecord>,
        );
      }

      await this.createOperationLogs({
        workspaceId,
        workspaceMemberId,
        movedCustomers: eligibleCustomers,
        now,
      });
      await this.createTimelineEvents({
        workspaceId,
        workspaceMemberId,
        movedCustomers: eligibleCustomers,
        now,
      });

      return {
        affectedCount: eligibleCustomers.length,
        customerIds: eligibleCustomers.map(({ customer }) => customer.id),
        evaluatedRuleCount: enabledRules.length,
      };
    }, authContext);
  }

  private findEligibleCustomers({
    companyRecords,
    rules,
  }: {
    companyRecords: WorkspaceCompanyRecord[];
    rules: WorkspacePublicPoolRuleRecord[];
  }) {
    const now = Date.now();

    return companyRecords.flatMap((customer) => {
      if (customer.publicPoolState === PUBLIC_POOL_STATE) {
        return [];
      }

      const matchedRule = rules.find((rule) =>
        this.customerMatchesRule({
          customer,
          now,
          rule,
        }),
      );

      return matchedRule ? [{ customer, rule: matchedRule }] : [];
    });
  }

  private customerMatchesRule({
    customer,
    now,
    rule,
  }: {
    customer: WorkspaceCompanyRecord;
    now: number;
    rule: WorkspacePublicPoolRuleRecord;
  }) {
    const inactivityDays =
      normalizeNumber(rule.inactivityDays) ?? DEFAULT_INACTIVITY_DAYS;
    const thresholdMs = inactivityDays * 24 * 60 * 60 * 1000;
    const lastTouchAt =
      normalizeDate(customer.lastFollowUpAt) ??
      normalizeDate(customer.lastContactAt) ??
      new Date(0);
    const scopeStages = normalizeStringArray(rule.scopeStages);

    if (
      scopeStages.length > 0 &&
      !scopeStages.includes(normalizeString(customer.customerStage) ?? '')
    ) {
      return false;
    }

    return now - lastTouchAt.getTime() >= thresholdMs;
  }

  private async createOperationLogs({
    workspaceId,
    workspaceMemberId,
    movedCustomers,
    now,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
    movedCustomers: Array<{
      customer: WorkspaceCompanyRecord;
      rule: WorkspacePublicPoolRuleRecord;
    }>;
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

    await operationLogRepository.insert(
      movedCustomers.map(({ customer, rule }) => ({
        id: v4(),
        customerId: customer.id,
        operatedAt: now,
        operationSummary: `Moved customer to public pool by rule ${
          normalizeString(rule.ruleName) ?? rule.id
        }`,
        operationType: 'EXECUTE_PUBLIC_POOL_RULE',
        operatorName: workspaceMemberId ?? 'system',
      })),
    );
  }

  private async createTimelineEvents({
    workspaceId,
    workspaceMemberId,
    movedCustomers,
    now,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
    movedCustomers: Array<{
      customer: WorkspaceCompanyRecord;
      rule: WorkspacePublicPoolRuleRecord;
    }>;
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

    await timelineActivityRepository.insert(
      movedCustomers.map(({ customer, rule }) => ({
        id: v4(),
        createdAt: now,
        happensAt: now,
        linkedObjectMetadataId: null,
        linkedRecordCachedName: `Customer moved to public pool by rule ${
          normalizeString(rule.ruleName) ?? rule.id
        }: ${normalizeString(customer.name) ?? customer.id}`,
        linkedRecordId: customer.id,
        name: 'customer.public_pool.rule_executed',
        properties: {
          customerId: customer.id,
          publicPoolGroup:
            normalizeString(rule.publicPoolGroup) ?? DEFAULT_PUBLIC_POOL_GROUP,
          publicPoolState: PUBLIC_POOL_STATE,
          ruleId: rule.id,
          ruleName: normalizeString(rule.ruleName),
        },
        targetCompanyId: customer.id,
        updatedAt: now,
        workspaceMemberId: workspaceMemberId ?? null,
      })),
    );
  }

  private async assertWorkspaceObject(
    workspaceId: string,
    objectNameSingular: string,
  ) {
    const hasObject = await this.hasWorkspaceObject(workspaceId, objectNameSingular);

    if (!hasObject) {
      throw new BadRequestException(
        `Public pool rule execution requires ${objectNameSingular} object.`,
      );
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
