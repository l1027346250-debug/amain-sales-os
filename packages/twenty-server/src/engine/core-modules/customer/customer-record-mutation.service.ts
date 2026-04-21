import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { type ObjectLiteral } from 'typeorm';
import { type QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { v4 } from 'uuid';

import {
  CreateCustomerContactInput,
  CreateCustomerInput,
  CustomerContactInput,
  CustomerRecordInput,
  CustomerRecordMutationResultDTO,
  UpdateCustomerContactInput,
  UpdateCustomerInput,
} from 'src/engine/core-modules/customer/dto/customer-record-mutation.dto';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

type WorkspaceCompanyRecord = ObjectLiteral & {
  id: string;
  name?: string | null;
};

type WorkspacePersonRecord = ObjectLiteral & {
  id: string;
  name?: Record<string, unknown> | null;
  nickname?: string | null;
  companyId?: string | null;
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

const normalizeString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const buildLinksValue = (url: string | null) =>
  url
    ? {
        primaryLinkLabel: url,
        primaryLinkUrl: url,
        secondaryLinks: [],
      }
    : undefined;

const buildAddressValue = ({
  addressLine,
  country,
}: {
  addressLine: string | null;
  country: string | null;
}) =>
  addressLine || country
    ? {
        addressCity: '',
        addressCountry: country ?? '',
        addressLat: null,
        addressLng: null,
        addressPostcode: '',
        addressState: '',
        addressStreet1: addressLine ?? '',
        addressStreet2: '',
      }
    : undefined;

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

@Injectable()
export class CustomerRecordMutationService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly objectMetadataService: ObjectMetadataService,
  ) {}

  async createCustomer({
    workspaceId,
    workspaceMemberId,
    input,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
    input: CreateCustomerInput;
  }): Promise<CustomerRecordMutationResultDTO> {
    const customerName = normalizeString(input.name);

    if (!customerName) {
      throw new BadRequestException('Customer name is required.');
    }

    await this.assertWorkspaceObject(workspaceId, 'company');

    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const companyRepository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspaceCompanyRecord>(
          workspaceId,
          'company',
          { shouldBypassPermissionChecks: true },
        );
      const now = new Date().toISOString();
      const record: WorkspaceCompanyRecord = {
        id: v4(),
        ...this.buildCompanyPayload(input),
        accountOwnerId: workspaceMemberId ?? null,
        createdAt: now,
        name: customerName,
        publicPoolState: PRIVATE_PUBLIC_POOL_STATE,
        updatedAt: now,
      };

      await companyRepository.insert(record);
      await this.createOperationLog({
        workspaceId,
        workspaceMemberId,
        customerId: record.id,
        operationType: 'CREATE_CUSTOMER',
        operationSummary: `Created customer ${customerName}`,
      });

      return {
        record,
      };
    }, authContext);
  }

  async updateCustomer({
    workspaceId,
    workspaceMemberId,
    input,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
    input: UpdateCustomerInput;
  }): Promise<CustomerRecordMutationResultDTO> {
    await this.assertWorkspaceObject(workspaceId, 'company');

    const customerId = input.customerId.trim();
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const companyRepository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspaceCompanyRecord>(
          workspaceId,
          'company',
          { shouldBypassPermissionChecks: true },
        );
      const existingRecord = await companyRepository.findOne({
        where: {
          id: customerId,
        },
      });

      if (!existingRecord) {
        throw new NotFoundException('Customer was not found.');
      }

      const updatePayload = this.buildCompanyPayload(input);

      await companyRepository.update(
        customerId,
        updatePayload as unknown as QueryDeepPartialEntity<WorkspaceCompanyRecord>,
      );
      await this.createOperationLog({
        workspaceId,
        workspaceMemberId,
        customerId,
        operationType: 'UPDATE_CUSTOMER',
        operationSummary: `Updated customer ${customerId}`,
      });

      return {
        record: {
          ...existingRecord,
          ...updatePayload,
          id: customerId,
        },
      };
    }, authContext);
  }

  async createCustomerContact({
    workspaceId,
    workspaceMemberId,
    input,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
    input: CreateCustomerContactInput;
  }): Promise<CustomerRecordMutationResultDTO> {
    await this.assertWorkspaceObject(workspaceId, 'company');
    await this.assertWorkspaceObject(workspaceId, 'person');

    const customerId = input.customerId.trim();
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      await this.assertCustomerExists(workspaceId, customerId);

      const personRepository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspacePersonRecord>(
          workspaceId,
          'person',
          { shouldBypassPermissionChecks: true },
        );
      const now = new Date().toISOString();
      const record: WorkspacePersonRecord = {
        id: v4(),
        ...this.buildContactPayload(input),
        companyId: customerId,
        createdAt: now,
        updatedAt: now,
      };

      await personRepository.insert(record);
      await this.createOperationLog({
        workspaceId,
        workspaceMemberId,
        customerId,
        operationType: 'CREATE_CUSTOMER_CONTACT',
        operationSummary: `Created contact for customer ${customerId}`,
      });

      return {
        record,
      };
    }, authContext);
  }

  async updateCustomerContact({
    workspaceId,
    workspaceMemberId,
    input,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
    input: UpdateCustomerContactInput;
  }): Promise<CustomerRecordMutationResultDTO> {
    await this.assertWorkspaceObject(workspaceId, 'person');

    const contactId = input.contactId.trim();
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const personRepository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspacePersonRecord>(
          workspaceId,
          'person',
          { shouldBypassPermissionChecks: true },
        );
      const existingRecord = await personRepository.findOne({
        where: {
          id: contactId,
        },
      });

      if (!existingRecord) {
        throw new NotFoundException('Customer contact was not found.');
      }

      const updatePayload = this.buildContactPayload(input);

      await personRepository.update(
        contactId,
        updatePayload as unknown as QueryDeepPartialEntity<WorkspacePersonRecord>,
      );
      await this.createOperationLog({
        workspaceId,
        workspaceMemberId,
        customerId: normalizeString(existingRecord.companyId),
        operationType: 'UPDATE_CUSTOMER_CONTACT',
        operationSummary: `Updated customer contact ${contactId}`,
      });

      return {
        record: {
          ...existingRecord,
          ...updatePayload,
          id: contactId,
        },
      };
    }, authContext);
  }

  private buildCompanyPayload(input: CustomerRecordInput): Record<string, unknown> {
    const websiteUrl = normalizeString(input.websiteUrl);
    const addressLine = normalizeString(input.addressLine);
    const country = normalizeString(input.country);
    const payload: Record<string, unknown> = {
      ...(normalizeString(input.name) ? { name: normalizeString(input.name) } : {}),
      ...(normalizeString(input.shortName)
        ? { shortName: normalizeString(input.shortName) }
        : {}),
      ...(normalizeString(input.customerCode)
        ? { customerCode: normalizeString(input.customerCode) }
        : {}),
      ...(country ? { country } : {}),
      ...(normalizeString(input.customerStage)
        ? { customerStage: normalizeString(input.customerStage) }
        : {}),
      ...(normalizeString(input.customerGroup)
        ? { customerGroup: normalizeString(input.customerGroup) }
        : {}),
      ...(normalizeString(input.customerSource)
        ? { customerSource: normalizeString(input.customerSource) }
        : {}),
      ...(normalizeString(input.customerStar)
        ? { customerStar: normalizeString(input.customerStar) }
        : {}),
      ...(typeof input.customerScore === 'number'
        ? { customerScore: input.customerScore }
        : {}),
    };
    const website = buildLinksValue(websiteUrl);
    const address = buildAddressValue({
      addressLine,
      country,
    });

    return {
      ...payload,
      ...(website ? { website } : {}),
      ...(address ? { address } : {}),
    };
  }

  private buildContactPayload(input: CustomerContactInput): Record<string, unknown> {
    const nickname = normalizeString(input.nickname);
    const email = normalizeString(input.email);
    const phone = normalizeString(input.phone);
    const emails = buildEmailsValue(email);
    const phones = buildPhonesValue(phone);

    return {
      ...(nickname ? { name: { firstName: nickname, lastName: '' }, nickname } : {}),
      ...(emails ? { emails } : {}),
      ...(phones ? { phone, phones } : {}),
      ...(normalizeString(input.position)
        ? { jobTitle: normalizeString(input.position) }
        : {}),
      ...(normalizeString(input.gender) ? { gender: normalizeString(input.gender) } : {}),
      ...(normalizeString(input.birthday)
        ? { birthday: normalizeString(input.birthday) }
        : {}),
      ...(normalizeString(input.facebook)
        ? { facebook: normalizeString(input.facebook) }
        : {}),
      ...(normalizeString(input.twitter)
        ? { twitter: normalizeString(input.twitter) }
        : {}),
      ...(normalizeString(input.linkedIn)
        ? { linkedIn: normalizeString(input.linkedIn) }
        : {}),
      ...(normalizeString(input.contactNotes)
        ? { contactNotes: normalizeString(input.contactNotes) }
        : {}),
    };
  }

  private async assertCustomerExists(workspaceId: string, customerId: string) {
    const companyRepository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceCompanyRecord>(
        workspaceId,
        'company',
        { shouldBypassPermissionChecks: true },
      );
    const customer = await companyRepository.findOne({
      where: {
        id: customerId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer was not found.');
    }
  }

  private async createOperationLog({
    workspaceId,
    workspaceMemberId,
    customerId,
    operationType,
    operationSummary,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
    customerId: string | null;
    operationType: string;
    operationSummary: string;
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
      operatedAt: new Date().toISOString(),
      operationSummary,
      operationType,
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
        `Customer mutation requires ${objectNameSingular} object.`,
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
