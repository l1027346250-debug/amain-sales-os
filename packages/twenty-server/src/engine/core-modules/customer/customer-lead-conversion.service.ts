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
  accountOwnerId?: string | null;
  id: string;
  name?: string | null;
};

type WorkspacePersonRecord = ObjectLiteral & {
  emails?: {
    primaryEmail?: string | null;
  } | null;
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

type ExistingLeadConversionResult = {
  alreadyConverted: boolean;
  contactId: string | null;
  contactReused: boolean;
  customerId: string;
  customerReused: boolean;
  ownerId: string | null;
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

      const existingConversionResult =
        await this.findExistingLeadConversionResult({
          leadId,
          workspaceId,
        });

      if (existingConversionResult) {
        await leadRepository.update(
          leadId,
          {
            leadStatus: CONVERTED_LEAD_STATUS,
          } as unknown as QueryDeepPartialEntity<WorkspaceLeadRecord>,
        );

        return {
          alreadyConverted: existingConversionResult.alreadyConverted,
          contactId: existingConversionResult.contactId,
          contactReused: existingConversionResult.contactReused,
          customerId: existingConversionResult.customerId,
          customerReused: existingConversionResult.customerReused,
          leadId,
          ownerId:
            existingConversionResult.ownerId ??
            normalizeString(lead.assignedToId) ??
            workspaceMemberId ??
            null,
        };
      }

      const now = new Date().toISOString();
      const contactEmail = normalizeString(lead.email);
      const existingContact = await this.findPersonByPrimaryEmail({
        email: contactEmail,
        workspaceId,
      });
      const customerConversionResult = await this.createOrReuseCustomerFromLead({
        workspaceId,
        workspaceMemberId,
        existingCompanyId: normalizeString(existingContact?.companyId),
        lead,
        now,
      });
      const contactConversionResult = await this.createOrReuseContactFromLead({
        workspaceId,
        existingContactId: existingContact?.id ?? null,
        lead,
        customerId: customerConversionResult.customerId,
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
          customerId: customerConversionResult.customerId,
          contactId: contactConversionResult.contactId,
          now,
        }),
        this.createOperationLog({
          workspaceId,
          workspaceMemberId,
          customerId: customerConversionResult.customerId,
          leadId,
          now,
        }),
      ]);

      return {
        alreadyConverted: false,
        contactId: contactConversionResult.contactId,
        contactReused: contactConversionResult.contactReused,
        customerId: customerConversionResult.customerId,
        customerReused: customerConversionResult.customerReused,
        leadId,
        ownerId:
          normalizeString(lead.assignedToId) ?? workspaceMemberId ?? null,
      };
    }, authContext);
  }

  private async createOrReuseCustomerFromLead({
    workspaceId,
    workspaceMemberId,
    existingCompanyId,
    lead,
    now,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
    existingCompanyId: string | null;
    lead: WorkspaceLeadRecord;
    now: string;
  }): Promise<{
    customerId: string;
    customerReused: boolean;
  }> {
    const companyRepository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceCompanyRecord>(
        workspaceId,
        'company',
        { shouldBypassPermissionChecks: true },
      );

    if (existingCompanyId) {
      return {
        customerId: existingCompanyId,
        customerReused: true,
      };
    }

    const existingCompany = await this.findCompanyByName({
      companyName: normalizeString(lead.leadName),
      workspaceId,
    });

    if (existingCompany) {
      return {
        customerId: existingCompany.id,
        customerReused: true,
      };
    }

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

    return {
      customerId,
      customerReused: false,
    };
  }

  private async createOrReuseContactFromLead({
    workspaceId,
    existingContactId,
    lead,
    customerId,
    now,
  }: {
    workspaceId: string;
    existingContactId: string | null;
    lead: WorkspaceLeadRecord;
    customerId: string;
    now: string;
  }): Promise<{
    contactId: string | null;
    contactReused: boolean;
  }> {
    const hasPersonObject = await this.hasWorkspaceObject(workspaceId, 'person');

    if (!hasPersonObject) {
      return {
        contactId: null,
        contactReused: false,
      };
    }

    const contactName = normalizeString(lead.contactName);
    const email = normalizeString(lead.email);
    const phone = normalizeString(lead.phone);

    if (!contactName && !email && !phone) {
      return {
        contactId: null,
        contactReused: false,
      };
    }

    const personRepository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspacePersonRecord>(
        workspaceId,
        'person',
        { shouldBypassPermissionChecks: true },
      );

    if (existingContactId) {
      await personRepository.update(existingContactId, {
        companyId: customerId,
        contactNotes: normalizeString(lead.notes),
        phones: buildPhonesValue(phone),
        updatedAt: now,
      } as unknown as QueryDeepPartialEntity<WorkspacePersonRecord>);

      return {
        contactId: existingContactId,
        contactReused: true,
      };
    }

    const contactId = v4();

    await personRepository.insert({
      id: contactId,
      companyId: customerId,
      contactNotes: normalizeString(lead.notes),
      createdAt: now,
      emails: buildEmailsValue(email),
      name: contactName ? { firstName: contactName, lastName: '' } : null,
      nickname: contactName,
      phones: buildPhonesValue(phone),
      updatedAt: now,
    });

    return {
      contactId,
      contactReused: false,
    };
  }

  private async findExistingLeadConversionResult({
    leadId,
    workspaceId,
  }: {
    leadId: string;
    workspaceId: string;
  }): Promise<ExistingLeadConversionResult | null> {
    const hasTimelineObject = await this.hasWorkspaceObject(
      workspaceId,
      'timelineActivity',
    );

    if (!hasTimelineObject) {
      return null;
    }

    const timelineRepository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceTimelineActivityRecord>(
        workspaceId,
        'timelineActivity',
        { shouldBypassPermissionChecks: true },
      );

    const existingTimelineEvent = await timelineRepository
      .createQueryBuilder('timelineActivity')
      .where('timelineActivity.name = :name', {
        name: 'lead.converted_to_customer',
      })
      .andWhere(`timelineActivity.properties ->> 'leadId' = :leadId`, {
        leadId,
      })
      .orderBy('timelineActivity.happensAt', 'DESC')
      .getOne();

    const customerId =
      normalizeString(existingTimelineEvent?.targetCompanyId) ??
      normalizeString(existingTimelineEvent?.properties?.customerId);

    if (!customerId) {
      return null;
    }

    const companyRepository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceCompanyRecord>(
        workspaceId,
        'company',
        { shouldBypassPermissionChecks: true },
      );
    const existingCompany = await companyRepository.findOne({
      where: {
        id: customerId,
      },
    });

    if (!existingCompany) {
      return null;
    }

    return {
      alreadyConverted: true,
      contactId:
        normalizeString(existingTimelineEvent?.properties?.contactId) ?? null,
      contactReused: true,
      customerId,
      customerReused: true,
      ownerId: normalizeString(existingCompany.accountOwnerId) ?? null,
    };
  }

  private async findPersonByPrimaryEmail({
    email,
    workspaceId,
  }: {
    email: string | null;
    workspaceId: string;
  }): Promise<WorkspacePersonRecord | null> {
    if (!email) {
      return null;
    }

    const hasPersonObject = await this.hasWorkspaceObject(workspaceId, 'person');

    if (!hasPersonObject) {
      return null;
    }

    const personRepository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspacePersonRecord>(
        workspaceId,
        'person',
        { shouldBypassPermissionChecks: true },
      );

    return personRepository
      .createQueryBuilder('person')
      .where(`LOWER(person.emails ->> 'primaryEmail') = LOWER(:email)`, {
        email,
      })
      .getOne();
  }

  private async findCompanyByName({
    companyName,
    workspaceId,
  }: {
    companyName: string | null;
    workspaceId: string;
  }): Promise<WorkspaceCompanyRecord | null> {
    if (!companyName) {
      return null;
    }

    const companyRepository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceCompanyRecord>(
        workspaceId,
        'company',
        { shouldBypassPermissionChecks: true },
      );

    return companyRepository
      .createQueryBuilder('company')
      .where('LOWER(company.name) = LOWER(:companyName)', {
        companyName,
      })
      .getOne();
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
