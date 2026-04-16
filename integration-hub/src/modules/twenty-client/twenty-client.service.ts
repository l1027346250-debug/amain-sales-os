import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import axios, { AxiosError, AxiosInstance } from 'axios';

import { FirstResponseTaskCandidate } from 'src/modules/lead-monitoring/types/first-response-task-candidate.type';
import { FirstResponseTaskRequest } from 'src/modules/lead-monitoring/types/first-response-task-request.type';
import { OverdueLeadReminder } from 'src/modules/lead-monitoring/types/overdue-lead-reminder.type';
import { OverdueQuotationFollowUpOpportunity } from 'src/modules/opportunity-monitoring/types/overdue-quotation-follow-up-opportunity.type';
import { QuotationFollowUpTaskCandidate } from 'src/modules/opportunity-monitoring/types/quotation-follow-up-task-candidate.type';
import { QuotationFollowUpTaskRequest } from 'src/modules/opportunity-monitoring/types/quotation-follow-up-task-request.type';
import { StalledOpportunity } from 'src/modules/opportunity-monitoring/types/stalled-opportunity.type';
import { StalledTaskCandidate } from 'src/modules/opportunity-monitoring/types/stalled-task-candidate.type';
import { StalledTaskRequest } from 'src/modules/opportunity-monitoring/types/stalled-task-request.type';
import { TwentyClientRequestError } from 'src/modules/sync-jobs/errors/twenty-client-request.error';

@Injectable()
export class TwentyClientService {
  private readonly logger = new Logger(TwentyClientService.name);
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly basePath: string;
  private readonly apiKeyConfigured: boolean;
  private readonly workspaceIdConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.normalizeBaseUrl(
      this.configService.get<string>('TWENTY_BASE_URL') ?? 'http://localhost:3000',
    );
    const token =
      this.configService.get<string>('TWENTY_API_KEY') ?? 'replace-me';
    const workspaceId =
      this.configService.get<string>('TWENTY_WORKSPACE_ID') ?? null;

    this.baseUrl = baseURL;
    this.basePath = '/rest/leads';
    this.apiKeyConfigured = token !== 'replace-me';
    this.workspaceIdConfigured =
      typeof workspaceId === 'string' && workspaceId.trim().length > 0;

    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  getConfigurationStatus() {
    const blockingIssues = this.apiKeyConfigured
      ? []
      : ['TWENTY_API_KEY is not configured'];
    const warnings = this.workspaceIdConfigured
      ? []
      : ['TWENTY_WORKSPACE_ID is not configured'];

    return {
      status: blockingIssues.length === 0 ? ('configured' as const) : ('prepared' as const),
      operationMode: this.apiKeyConfigured ? ('remote' as const) : ('prepared' as const),
      baseUrl: this.baseUrl,
      apiKeyConfigured: this.apiKeyConfigured,
      workspaceIdConfigured: this.workspaceIdConfigured,
      leadEndpoint: this.basePath,
      opportunityEndpoint: '/rest/opportunities',
      taskEndpoint: '/rest/tasks',
      blockingIssues,
      warnings,
    };
  }

  async createOrUpdateLead(
    payload: Record<string, unknown>,
    options?: {
      preserveAssignmentOnUpdate?: boolean;
    },
  ) {
    if (!this.apiKeyConfigured) {
      this.logger.warn(
        'TWENTY_API_KEY is not configured; falling back to prepared mode',
      );

      return {
        mode: 'prepared',
        endpoint: this.basePath,
        payload,
      };
    }

    try {
      const existingLead = await this.findExistingLead(payload);

      if (existingLead?.id) {
        const updatePayload = this.compactUpdatePayload(payload);

        if (options?.preserveAssignmentOnUpdate === true) {
          delete updatePayload.assignedToId;
        }

        const response = await this.client.patch(
          `${this.basePath}/${existingLead.id}`,
          updatePayload,
        );
        const record = response.data?.data?.updateLead ?? response.data;

        this.logger.log(`Updated lead ${existingLead.id} in Twenty`);

        return {
          mode: 'remote',
          operation: 'updated',
          endpoint: `${this.basePath}/${existingLead.id}`,
          recordId: existingLead.id,
          match: existingLead.match,
          record,
        };
      }

      const response = await this.client.post(this.basePath, payload);
      const record = response.data?.data?.createLead ?? response.data;

      this.logger.log('Created lead in Twenty');

      return {
        mode: 'remote',
        operation: 'created',
        endpoint: this.basePath,
        recordId: record?.id ?? null,
        record,
      };
    } catch (error) {
      this.handleAxiosError(error, 'lead upsert');
    }
  }

  async acknowledgeWebhook(payload: Record<string, unknown>) {
    this.logger.log('Accepted Twenty webhook payload for downstream handling');

    return {
      mode: 'accepted',
      payload,
    };
  }

  async findLeadsOverdueForFirstResponse({
    thresholdHours,
    limit,
  }: {
    thresholdHours: number;
    limit: number;
  }) {
    const thresholdIso = new Date(
      Date.now() - thresholdHours * 60 * 60 * 1000,
    ).toISOString();
    const filter = `and(firstResponseTime[is]:NULL,createdAt[lt]:\"${thresholdIso}\")`;

    if (!this.apiKeyConfigured) {
      this.logger.warn(
        'TWENTY_API_KEY is not configured; lead SLA sweep is returning prepared mode',
      );

      return {
        mode: 'prepared' as const,
        endpoint: this.basePath,
        filter,
        records: [] as OverdueLeadReminder[],
      };
    }

    try {
      const response = await this.client.get(this.basePath, {
        params: {
          filter,
          limit,
        },
      });
      const leads = Array.isArray(response.data?.data?.leads)
        ? response.data.data.leads
        : [];

      return {
        mode: 'remote' as const,
        endpoint: this.basePath,
        filter,
        records: leads.map((lead: Record<string, unknown>) =>
          this.mapLeadReminder(lead),
        ),
      };
    } catch (error) {
      this.handleAxiosError(error, 'lead first response SLA sweep');
    }
  }

  async findOpportunitiesNeedingQuoteFollowUp({
    followUpAfterDays,
    limit,
  }: {
    followUpAfterDays: number;
    limit: number;
  }) {
    const thresholdIso = new Date(
      Date.now() - followUpAfterDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    const endpoint = '/rest/opportunities';
    const filter = `and(stage[eq]:\"Quotation Sent\",updatedAt[lt]:\"${thresholdIso}\")`;

    if (!this.apiKeyConfigured) {
      this.logger.warn(
        'TWENTY_API_KEY is not configured; quotation follow-up sweep is returning prepared mode',
      );

      return {
        mode: 'prepared' as const,
        endpoint,
        filter,
        records: [] as OverdueQuotationFollowUpOpportunity[],
      };
    }

    try {
      const response = await this.client.get(endpoint, {
        params: {
          filter,
          limit,
        },
      });
      const opportunities = Array.isArray(response.data?.data?.opportunities)
        ? response.data.data.opportunities
        : [];

      return {
        mode: 'remote' as const,
        endpoint,
        filter,
        records: opportunities.map((opportunity: Record<string, unknown>) =>
          this.mapQuotationFollowUpOpportunity(opportunity),
        ),
      };
    } catch (error) {
      this.handleAxiosError(error, 'quotation follow-up sweep');
    }
  }

  async findStalledOpportunities({
    stalledAfterDays,
    limit,
  }: {
    stalledAfterDays: number;
    limit: number;
  }) {
    const thresholdIso = new Date(
      Date.now() - stalledAfterDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    const endpoint = '/rest/opportunities';
    const filter = `and(updatedAt[lt]:\"${thresholdIso}\")`;

    if (!this.apiKeyConfigured) {
      this.logger.warn(
        'TWENTY_API_KEY is not configured; stalled opportunity sweep is returning prepared mode',
      );

      return {
        mode: 'prepared' as const,
        endpoint,
        filter,
        records: [] as StalledOpportunity[],
      };
    }

    try {
      const response = await this.client.get(endpoint, {
        params: {
          filter,
          limit,
        },
      });
      const opportunities = Array.isArray(response.data?.data?.opportunities)
        ? response.data.data.opportunities
        : [];

      return {
        mode: 'remote' as const,
        endpoint,
        filter,
        records: opportunities.map((opportunity: Record<string, unknown>) =>
          this.mapStalledOpportunity(opportunity),
        ),
      };
    } catch (error) {
      this.handleAxiosError(error, 'stalled opportunity sweep');
    }
  }

  prepareFirstResponseReminderTask(
    candidate: FirstResponseTaskCandidate,
  ): FirstResponseTaskRequest {
    return {
      leadId: candidate.leadId,
      mode: 'prepared',
      endpoint: '/rest/tasks',
      payload: candidate.taskPayload,
      relationGap: {
        status: 'unlinked',
        reason:
          'lead-task relation is not available in current phase 1 task schema',
      },
    };
  }

  prepareQuotationFollowUpTask(
    candidate: QuotationFollowUpTaskCandidate,
  ): QuotationFollowUpTaskRequest {
    return {
      opportunityId: candidate.opportunityId,
      mode: 'prepared',
      endpoint: '/rest/tasks',
      payload: candidate.taskPayload,
      relationGap: {
        status: 'unlinked',
        reason:
          'opportunity-task relation is not available in current phase 1 task schema',
      },
    };
  }

  prepareStalledOpportunityTask(
    candidate: StalledTaskCandidate,
  ): StalledTaskRequest {
    return {
      opportunityId: candidate.opportunityId,
      mode: 'prepared',
      endpoint: '/rest/tasks',
      payload: candidate.taskPayload,
      relationGap: {
        status: 'unlinked',
        reason:
          'opportunity-task relation is not available in current phase 1 task schema',
      },
    };
  }

  async createFirstResponseReminderTask(
    request: FirstResponseTaskRequest,
    options?: { apply?: boolean },
  ) {
    const shouldApply = options?.apply === true;

    if (!shouldApply || !this.apiKeyConfigured) {
      if (shouldApply && !this.apiKeyConfigured) {
        this.logger.warn(
          'TWENTY_API_KEY is not configured; first response reminder task stayed in prepared mode',
        );
      }

      return {
        ...request,
        mode: 'prepared' as const,
        applyRequested: shouldApply,
      };
    }

    try {
      const response = await this.client.post(request.endpoint, request.payload);
      const record = response.data?.data?.createTask ?? response.data;

      this.logger.log(
        `Created first response reminder task for lead ${request.leadId} in Twenty`,
      );

      return {
        leadId: request.leadId,
        mode: 'remote' as const,
        endpoint: request.endpoint,
        applyRequested: true,
        recordId: record?.id ?? null,
        record,
        relationGap: request.relationGap,
      };
    } catch (error) {
      this.handleAxiosError(error, 'first response reminder task creation');
    }
  }

  async createQuotationFollowUpTask(
    request: QuotationFollowUpTaskRequest,
    options?: { apply?: boolean },
  ) {
    const shouldApply = options?.apply === true;

    if (!shouldApply || !this.apiKeyConfigured) {
      if (shouldApply && !this.apiKeyConfigured) {
        this.logger.warn(
          'TWENTY_API_KEY is not configured; quotation follow-up task stayed in prepared mode',
        );
      }

      return {
        ...request,
        mode: 'prepared' as const,
        applyRequested: shouldApply,
      };
    }

    try {
      const response = await this.client.post(request.endpoint, request.payload);
      const record = response.data?.data?.createTask ?? response.data;

      this.logger.log(
        `Created quotation follow-up task for opportunity ${request.opportunityId} in Twenty`,
      );

      return {
        opportunityId: request.opportunityId,
        mode: 'remote' as const,
        endpoint: request.endpoint,
        applyRequested: true,
        recordId: record?.id ?? null,
        record,
        relationGap: request.relationGap,
      };
    } catch (error) {
      this.handleAxiosError(error, 'quotation follow-up task creation');
    }
  }

  async createStalledOpportunityTask(
    request: StalledTaskRequest,
    options?: { apply?: boolean },
  ) {
    const shouldApply = options?.apply === true;

    if (!shouldApply || !this.apiKeyConfigured) {
      if (shouldApply && !this.apiKeyConfigured) {
        this.logger.warn(
          'TWENTY_API_KEY is not configured; stalled opportunity task stayed in prepared mode',
        );
      }

      return {
        ...request,
        mode: 'prepared' as const,
        applyRequested: shouldApply,
      };
    }

    try {
      const response = await this.client.post(request.endpoint, request.payload);
      const record = response.data?.data?.createTask ?? response.data;

      this.logger.log(
        `Created stalled opportunity task for opportunity ${request.opportunityId} in Twenty`,
      );

      return {
        opportunityId: request.opportunityId,
        mode: 'remote' as const,
        endpoint: request.endpoint,
        applyRequested: true,
        recordId: record?.id ?? null,
        record,
        relationGap: request.relationGap,
      };
    } catch (error) {
      this.handleAxiosError(error, 'stalled opportunity task creation');
    }
  }

  private async findExistingLead(payload: Record<string, unknown>) {
    const filter = this.buildLeadLookupFilter(payload);

    if (!filter) {
      return null;
    }

    const response = await this.client.get(this.basePath, {
      params: {
        filter,
        limit: 1,
      },
    });

    const leads = response.data?.data?.leads;

    if (!Array.isArray(leads) || leads.length === 0) {
      return null;
    }

    return {
      id: leads[0]?.id as string | undefined,
      match: {
        strategy: this.detectLookupStrategy(payload),
        filter,
      },
    };
  }

  private buildLeadLookupFilter(payload: Record<string, unknown>) {
    const email = this.asNonEmptyString(payload.email);
    const phone = this.asNonEmptyString(payload.phone);
    const conditions = [email && this.buildEqCondition('email', email)]
      .concat(phone ? [this.buildEqCondition('phone', phone)] : [])
      .filter((value): value is string => Boolean(value));

    if (conditions.length === 0) {
      return null;
    }

    if (conditions.length === 1) {
      return conditions[0];
    }

    return `or(${conditions.join(',')})`;
  }

  private buildEqCondition(field: string, value: string) {
    return `${field}[eq]:\"${this.escapeFilterValue(value)}\"`;
  }

  private compactUpdatePayload(payload: Record<string, unknown>) {
    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== null && value !== undefined),
    );
  }

  private detectLookupStrategy(payload: Record<string, unknown>) {
    if (this.asNonEmptyString(payload.email)) {
      return 'email';
    }

    if (this.asNonEmptyString(payload.phone)) {
      return 'phone';
    }

    return 'none';
  }

  private asNonEmptyString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private escapeFilterValue(value: string) {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  private normalizeBaseUrl(value: string) {
    return value.replace(/\/+$/, '');
  }

  private handleAxiosError(error: unknown, operation: string): never {
    if (axios.isAxiosError(error)) {
      const responseBody =
        typeof error.response?.data === 'string'
          ? error.response.data
          : JSON.stringify(error.response?.data ?? {});
      const status = error.response?.status ?? 'NO_RESPONSE';

      this.logger.error(
        `Twenty API ${operation} failed with status ${status}: ${responseBody}`,
      );

      throw new TwentyClientRequestError(
        `Twenty API ${operation} failed with status ${status}`,
        this.classifyAxiosError(error),
        this.isRetryableAxiosError(error),
        error.response?.status,
      );
    }

    if (error instanceof Error) {
      this.logger.error(`Twenty API ${operation} failed: ${error.message}`);
    }

    throw error;
  }

  private classifyAxiosError(error: AxiosError) {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      return 'auth_error' as const;
    }

    if (status === 400 || status === 404 || status === 422) {
      return 'validation_error' as const;
    }

    if (status === 429) {
      return 'rate_limit' as const;
    }

    if (typeof status === 'number' && status >= 500) {
      return 'server_error' as const;
    }

    if (!status) {
      return 'network_error' as const;
    }

    return 'unknown' as const;
  }

  private isRetryableAxiosError(error: AxiosError) {
    const status = error.response?.status;

    if (!status) {
      return true;
    }

    return status === 429 || status >= 500;
  }

  private mapLeadReminder(lead: Record<string, unknown>): OverdueLeadReminder {
    const createdAt =
      typeof lead.createdAt === 'string' ? lead.createdAt : null;
    const overdueHours = createdAt
      ? Math.max(
          0,
          Math.floor((Date.now() - new Date(createdAt).getTime()) / 3600000),
        )
      : null;

    return {
      leadId: typeof lead.id === 'string' ? lead.id : 'unknown',
      leadName: typeof lead.leadName === 'string' ? lead.leadName : null,
      email: typeof lead.email === 'string' ? lead.email : null,
      assignedToId:
        typeof lead.assignedToId === 'string' ? lead.assignedToId : null,
      createdAt,
      overdueHours,
    };
  }

  private mapQuotationFollowUpOpportunity(
    opportunity: Record<string, unknown>,
  ): OverdueQuotationFollowUpOpportunity {
    const updatedAt =
      typeof opportunity.updatedAt === 'string' ? opportunity.updatedAt : null;
    const overdueDays = updatedAt
      ? Math.max(
          0,
          Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86400000),
        )
      : null;
    const accountOwner = opportunity.accountOwner as
      | Record<string, unknown>
      | undefined;
    const company = opportunity.company as Record<string, unknown> | undefined;

    return {
      opportunityId:
        typeof opportunity.id === 'string' ? opportunity.id : 'unknown',
      opportunityName:
        typeof opportunity.name === 'string' ? opportunity.name : null,
      stage:
        typeof opportunity.stage === 'string' ? opportunity.stage : null,
      assignedToId:
        typeof opportunity.assignedToId === 'string'
          ? opportunity.assignedToId
          : typeof opportunity.assigneeId === 'string'
            ? opportunity.assigneeId
            : typeof opportunity.salesOwnerId === 'string'
              ? opportunity.salesOwnerId
              : typeof opportunity.accountOwnerId === 'string'
                ? opportunity.accountOwnerId
                : typeof accountOwner?.id === 'string'
                  ? (accountOwner.id as string)
                  : null,
      companyName:
        typeof company?.name === 'string'
          ? (company.name as string)
          : typeof opportunity.companyName === 'string'
            ? opportunity.companyName
            : null,
      updatedAt,
      overdueDays,
    };
  }

  private mapStalledOpportunity(
    opportunity: Record<string, unknown>,
  ): StalledOpportunity {
    const mappedBase = this.mapQuotationFollowUpOpportunity(opportunity);

    return {
      opportunityId: mappedBase.opportunityId,
      opportunityName: mappedBase.opportunityName,
      stage: mappedBase.stage,
      assignedToId: mappedBase.assignedToId,
      companyName: mappedBase.companyName,
      updatedAt: mappedBase.updatedAt,
      stalledDays:
        typeof mappedBase.overdueDays === 'number' ? mappedBase.overdueDays : null,
    };
  }
}
