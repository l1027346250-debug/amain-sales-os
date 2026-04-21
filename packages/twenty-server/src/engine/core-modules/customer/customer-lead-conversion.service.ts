import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { type ObjectLiteral } from 'typeorm';
import { type QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { v4 } from 'uuid';

import {
  ConvertLeadToCustomerInput,
  ConvertLeadToCustomerResultDTO,
} from 'src/engine/core-modules/customer/dto/customer-lead-conversion.dto';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

type WorkspaceLeadRecord = ObjectLiteral & {
  id: string;
  leadName?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  source?: string | null;
  assignedToId?: string | null;
  notes?: string | null;
};

type WorkspaceCompanyRecord = ObjectLiteral & {
  id: string;
  name?: string | null;
};

type WorkspacePersonRecord = ObjectLiteral & {
  id: string;
  companyId?: string | null;
};

type WorkspaceTimelineActivityRecord = ObjectLiteral & {
  id: string;
  name?: string | null;
  properties?: Record<string, unknown> | null;
  linkedRecordCachedName?: string | null;
  linkedRecordId?: string | null;
  targetCompanyId?: string | null;
  happensAt?: string | null;
};

type WorkspaceCustomerOperationLogRecord = ObjectLiteral & {
  id: string;
  operationSummary: string;
  customerId?: string | null;
  operationType?: string | null;
  operatorName?: string | null;
  operatedAt?: string | null;
};

const PRIVATE_PUBLIC_POOL_STATE = 'PRIVATE';
const CONVERTED_LEAD_STATUS = 'QUALIFIED';

const normalizeString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const buildEmailsValue = (email: string | null) =>
  email
    ? {
        additionalEmails: [],
        primaryEmail: email,
      }
    : undefined;

const buildPhonesValue = (phone: string | null) =>
  phone
    ? {
        additionalPhones: [],
        primaryPhoneCallingCode: '',
        primaryPhoneCountryCode: '',
        primaryPhoneNumber: phone,
      }
    : undefined;

const buildAddressValue = (country: string | null) =>
  country
    ? {
        addressCity: '',
        addressCountry: country,
        addressLat: null,
        addressLng: null,
        addressPostcode: '',
        addressState: '',
        addressStreet1: '',
        addressStreet2: '',
      }
    : undefined;

@Injectable()
export class CustomerLeadConversionService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly objectMetadataService: ObjectMetadataService,
  ) {}

  async convertLeadToCustomer({
    workspaceId,
    workspaceMemberId,
    input,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
    input: ConvertLeadToCustomerInput;
  }): Promise<ConvertLeadToCustomerResultDTO> {
    const leadId = input.leadId.trim();

    if (leadId.length === 0) {
      throw new BadRequestException('Lead id is required for conversion.');
    }

    await Promise.all([
      this.assertWorkspaceObject(workspaceId, 'lead'),
      this.assertWorkspaceObject(workspaceId, 'company'),
    ]);

    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const leadRepository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspaceLeadRecord>(
          workspaceId,
          'lead',
          { shouldBypassPermissionChecks: true },
        );
      const lead = await leadRepository.findOne({
        where: {
          id: leadId,
        },
      });

      if (!lead) {
        throw new NotFoundException('Lead was not found.');
      }

      const now = new Date().toISOString();
      const customerId = await this.createCustomerFromLead({
        workspaceId,
        workspaceMemberId,
        lead,
        now,
      });
      const contactId = await this.createContactFromLead({
        workspaceId,
        lead,
        customerId,
        now,
      });

      await leadRepository.update(
        leadId,
        {
          leadStatus: CONVERTED_LEAD_STATUS,
        } as unknown as QueryDeepPartialEntity<WorkspaceLeadRecord>,
      );
      await Promise.all([
        this.createTimelineEvent({
          workspaceId,
          workspaceMemberId,
          lead,
          customerId,
          contactId,
          now,
        }),
        this.createOperationLog({
          workspaceId,
          workspaceMemberId,
          customerId,
          leadId,
          now,
        }),
      ]);

      return {
        contactId,
        customerId,
        leadId,
      };
    }, authContext);
  }

  private async createCustomerFromLead({
    workspaceId,
    workspaceMemberId,
    lead,
    now,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
    lead: WorkspaceLeadRecord;
    now: string;
  }) {
    const companyRepository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceCompanyRecord>(
        workspaceId,
        'company',
        { shouldBypassPermissionChecks: true },
      );
    const country = normalizeString(lead.country);
    const address = buildAddressValue(country);
    const customerId = v4();

    await companyRepository.insert({
      id: customerId,
      accountOwnerId: normalizeString(lead.assignedToId) ?? workspaceMemberId ?? null,
      address,
      country,
      createdAt: now,
      customerSource: normalizeString(lead.source),
      lastContactAt: now,
      lastFollowUpAt: now,
      name: normalizeString(lead.leadName) ?? 'Converted lead customer',
      publicPoolState: PRIVATE_PUBLIC_POOL_STATE,
      updatedAt: now,
    });

    return customerId;
  }

  private async createContactFromLead({
    workspaceId,
    lead,
    customerId,
    now,
  }: {
    workspaceId: string;
    lead: WorkspaceLeadRecord;
    customerId: string;
    now: string;
  }) {
    const hasPersonObject = await this.hasWorkspaceObject(workspaceId, 'person');

    if (!hasPersonObject) {
      return null;
    }

    const contactName = normalizeString(lead.contactName);
    const email = normalizeString(lead.email);
    const phone = normalizeString(lead.phone);

    if (!contactName && !email && !phone) {
      return null;
    }

    const personRepository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspacePersonRecord>(
        workspaceId,
        'person',
        { shouldBypassPermissionChecks: true },
      );
    const contactId = v4();

    await personRepository.insert({
      id: contactId,
      companyId: customerId,
      contactNotes: normalizeString(lead.notes),
      createdAt: now,
      emails: buildEmailsValue(email),
      name: contactName ? { firstName: contactName, lastName: '' } : null,
      nickname: contactName,
      phone,
      phones: buildPhonesValue(phone),
      updatedAt: now,
    });

    return contactId;
  }

  private async createTimelineEvent({
    workspaceId,
    workspaceMemberId,
    lead,
    customerId,
    contactId,
    now,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
    lead: WorkspaceLeadRecord;
    customerId: string;
    contactId: string | null;
    now: string;
  }) {
    const hasTimelineObject = await this.hasWorkspaceObject(
      workspaceId,
      'timelineActivity',
    );

    if (!hasTimelineObject) {
      return;
    }

    const timelineRepository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceTimelineActivityRecord>(
        workspaceId,
        'timelineActivity',
        { shouldBypassPermissionChecks: true },
      );

    await timelineRepository.insert({
      id: v4(),
      happensAt: now,
      linkedRecordCachedName: normalizeString(lead.leadName),
      linkedRecordId: lead.id,
      name: 'lead.converted_to_customer',
      properties: {
        contactId,
        customerId,
        leadId: lead.id,
        source: normalizeString(lead.source),
      },
      targetCompanyId: customerId,
      workspaceMemberId: workspaceMemberId ?? null,
    });
  }

  private async createOperationLog({
    workspaceId,
    workspaceMemberId,
    customerId,
    leadId,
    now,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
    customerId: string;
    leadId: string;
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

    await operationLogRepository.insert({
      id: v4(),
      customerId,
      operatedAt: now,
      operationSummary: `Converted lead ${leadId} to customer ${customerId}`,
      operationType: 'CONVERT_LEAD_TO_CUSTOMER',
      operatorName: workspaceMemberId ?? 'system',
    });
  }

  private async assertWorkspaceObject(
    workspaceId: string,
    objectNameSingular: string,
  ) {
    const hasObject = await this.hasWorkspaceObject(workspaceId, objectNameSingular);

    if (!hasObject) {
      throw new BadRequestException(
        `Lead conversion requires ${objectNameSingular} object.`,
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
