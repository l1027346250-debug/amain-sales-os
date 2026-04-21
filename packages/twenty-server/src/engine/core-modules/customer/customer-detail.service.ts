import { Injectable } from '@nestjs/common';

import { type ObjectLiteral } from 'typeorm';

import {
  CustomerDetailAggregateDTO,
  CustomerDetailArgs,
} from 'src/engine/core-modules/customer/dto/customer-detail.dto';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

type WorkspaceCompanyRecord = ObjectLiteral & {
  id: string;
  updatedAt?: Date | string | null;
  name?: string | null;
  shortName?: string | null;
  country?: string | null;
  address?: Record<string, unknown> | null;
  website?: Record<string, unknown> | string | null;
  domainName?: Record<string, unknown> | string | null;
  accountOwner?: Record<string, unknown> | null;
  customerStage?: Record<string, unknown> | string | null;
  customerGroup?: Record<string, unknown> | string | null;
  customerSource?: Record<string, unknown> | string | null;
  customerTags?: Array<Record<string, unknown> | string> | null;
  customerStar?: Record<string, unknown> | string | null;
  customerScore?: number | string | null;
  customerCode?: string | null;
  lastContactAt?: Date | string | null;
  lastFollowUpAt?: Date | string | null;
  lastWonAt?: Date | string | null;
  totalWonAmount?: number | string | null;
  publicPoolState?: Record<string, unknown> | string | null;
  publicPoolGroup?: Record<string, unknown> | string | null;
  publicPoolEnteredAt?: Date | string | null;
};

type WorkspacePersonRecord = ObjectLiteral & {
  id: string;
  updatedAt?: Date | string | null;
  companyId?: string | null;
  company?: Record<string, unknown> | null;
  name?: Record<string, unknown> | null;
  nickname?: string | null;
  emails?: Record<string, unknown> | null;
  email?: string | null;
  phones?: Record<string, unknown> | null;
  phone?: string | null;
  mobile?: string | null;
  jobTitle?: string | null;
  gender?: Record<string, unknown> | string | null;
  birthday?: Date | string | null;
  facebook?: string | null;
  twitter?: string | null;
  linkedIn?: string | null;
  customerSource?: Record<string, unknown> | string | null;
  contactNotes?: string | null;
};

type WorkspaceOpportunityRecord = ObjectLiteral & {
  id: string;
  updatedAt?: Date | string | null;
  name?: string | null;
  amount?: Record<string, unknown> | null;
  closeDate?: Date | string | null;
  lastActivityDate?: Date | string | null;
  stage?: string | null;
  companyId?: string | null;
  pointOfContactId?: string | null;
  pointOfContact?: Record<string, unknown> | null;
  company?: Record<string, unknown> | null;
  owner?: Record<string, unknown> | null;
  customerSource?: Record<string, unknown> | string | null;
};

const EMPTY_CUSTOMER_DETAIL: CustomerDetailAggregateDTO = {
  customer: null,
  contacts: [],
  opportunities: [],
  contactCount: 0,
  opportunityCount: 0,
};

const normalizeString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const normalizeDateString = (value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return typeof value === 'string' && value.length > 0 ? value : null;
};

const getRelationName = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const relation = value as {
    firstName?: unknown;
    lastName?: unknown;
    name?: unknown;
  };

  if (typeof relation.name === 'string' && relation.name.trim().length > 0) {
    return relation.name.trim();
  }

  const fullName = [relation.firstName, relation.lastName]
    .map(normalizeString)
    .filter((part): part is string => part !== null)
    .join(' ')
    .trim();

  return fullName.length > 0 ? fullName : null;
};

const getLinksValue = (value: unknown) => {
  if (
    value &&
    (typeof value === 'object' || typeof value === 'string')
  ) {
    return value;
  }

  return null;
};

const getPrimaryEmail = (value: unknown) => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return normalizeString((value as { primaryEmail?: unknown }).primaryEmail);
};

const getPrimaryPhone = (value: unknown) => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return normalizeString((value as { primaryPhone?: unknown }).primaryPhone);
};

const getCountryLabel = (record: WorkspaceCompanyRecord) =>
  normalizeString(record.country) ??
  normalizeString(
    (record.address as { addressCountry?: unknown } | null | undefined)
      ?.addressCountry,
  );

const getAccountOwner = (value: unknown) => {
  const name = getRelationName(value);

  return name ? { name } : null;
};

@Injectable()
export class CustomerDetailService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly objectMetadataService: ObjectMetadataService,
  ) {}

  async getCustomerDetail(
    workspaceId: string,
    args: CustomerDetailArgs,
  ): Promise<CustomerDetailAggregateDTO> {
    const authContext = buildSystemAuthContext(workspaceId);
    const [hasCompanyObject, hasPersonObject, hasOpportunityObject] =
      await Promise.all([
        this.hasWorkspaceObject(workspaceId, 'company'),
        this.hasWorkspaceObject(workspaceId, 'person'),
        this.hasWorkspaceObject(workspaceId, 'opportunity'),
      ]);

    if (!hasCompanyObject) {
      return EMPTY_CUSTOMER_DETAIL;
    }

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const companyRepository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspaceCompanyRecord>(
          workspaceId,
          'company',
          { shouldBypassPermissionChecks: true },
        );

      const customerRecord = await companyRepository.findOne({
        where: {
          id: args.customerId,
        },
        relations: ['accountOwner'],
      });

      if (!customerRecord) {
        return EMPTY_CUSTOMER_DETAIL;
      }

      const [contactRecords, opportunityRecords] = await Promise.all([
        hasPersonObject
          ? this.findContactRecords(workspaceId, args.customerId)
          : Promise.resolve([]),
        hasOpportunityObject
          ? this.findOpportunityRecords(workspaceId, args.customerId)
          : Promise.resolve([]),
      ]);

      return {
        customer: this.mapCustomerRecord(customerRecord),
        contacts: contactRecords.map((record) =>
          this.mapContactRecord(record, customerRecord),
        ),
        opportunities: opportunityRecords.map((record) =>
          this.mapOpportunityRecord(record, customerRecord),
        ),
        contactCount: contactRecords.length,
        opportunityCount: opportunityRecords.length,
      };
    }, authContext);
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

  private async findContactRecords(workspaceId: string, customerId: string) {
    const repository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspacePersonRecord>(
        workspaceId,
        'person',
        { shouldBypassPermissionChecks: true },
      );

    return repository.find({
      where: {
        companyId: customerId,
      },
      order: {
        updatedAt: 'DESC',
      },
      take: 12,
      relations: ['company'],
    });
  }

  private async findOpportunityRecords(workspaceId: string, customerId: string) {
    const repository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceOpportunityRecord>(
        workspaceId,
        'opportunity',
        { shouldBypassPermissionChecks: true },
      );

    return repository.find({
      where: {
        companyId: customerId,
      },
      order: {
        updatedAt: 'DESC',
      },
      take: 12,
      relations: ['owner', 'company', 'pointOfContact'],
    });
  }

  private mapCustomerRecord(record: WorkspaceCompanyRecord): Record<string, unknown> {
    return {
      id: record.id,
      name: normalizeString(record.name),
      shortName: normalizeString(record.shortName),
      country: getCountryLabel(record),
      address:
        record.address && typeof record.address === 'object' ? record.address : null,
      website: getLinksValue(record.website),
      domainName: getLinksValue(record.domainName),
      accountOwner: getAccountOwner(record.accountOwner),
      owner: null,
      customerStage:
        record.customerStage &&
        (typeof record.customerStage === 'object' ||
          typeof record.customerStage === 'string')
          ? record.customerStage
          : null,
      customerGroup:
        record.customerGroup &&
        (typeof record.customerGroup === 'object' ||
          typeof record.customerGroup === 'string')
          ? record.customerGroup
          : null,
      customerSource:
        record.customerSource &&
        (typeof record.customerSource === 'object' ||
          typeof record.customerSource === 'string')
          ? record.customerSource
          : null,
      customerTags: Array.isArray(record.customerTags) ? record.customerTags : null,
      customerStar:
        record.customerStar &&
        (typeof record.customerStar === 'object' ||
          typeof record.customerStar === 'string')
          ? record.customerStar
          : null,
      customerScore:
        typeof record.customerScore === 'number' ||
        typeof record.customerScore === 'string'
          ? record.customerScore
          : null,
      customerCode: normalizeString(record.customerCode),
      lastContactAt: normalizeDateString(record.lastContactAt),
      lastFollowUpAt: normalizeDateString(record.lastFollowUpAt),
      lastWonAt: normalizeDateString(record.lastWonAt),
      totalWonAmount:
        typeof record.totalWonAmount === 'number' ||
        typeof record.totalWonAmount === 'string'
          ? record.totalWonAmount
          : null,
      publicPoolState:
        record.publicPoolState &&
        (typeof record.publicPoolState === 'object' ||
          typeof record.publicPoolState === 'string')
          ? record.publicPoolState
          : null,
      publicPoolGroup:
        record.publicPoolGroup &&
        (typeof record.publicPoolGroup === 'object' ||
          typeof record.publicPoolGroup === 'string')
          ? record.publicPoolGroup
          : null,
      publicPoolEnteredAt: normalizeDateString(record.publicPoolEnteredAt),
    };
  }

  private mapContactRecord(
    record: WorkspacePersonRecord,
    customerRecord: WorkspaceCompanyRecord,
  ): Record<string, unknown> {
    return {
      id: record.id,
      name:
        record.name && typeof record.name === 'object'
          ? record.name
          : normalizeString(record.nickname)
            ? { firstName: normalizeString(record.nickname) }
            : null,
      nickname: normalizeString(record.nickname),
      emails:
        record.emails && typeof record.emails === 'object' ? record.emails : null,
      email: normalizeString(record.email) ?? getPrimaryEmail(record.emails),
      phones:
        record.phones && typeof record.phones === 'object' ? record.phones : null,
      phone:
        normalizeString(record.phone) ??
        normalizeString(record.mobile) ??
        getPrimaryPhone(record.phones),
      mobile: normalizeString(record.mobile),
      jobTitle: normalizeString(record.jobTitle),
      companyId: normalizeString(record.companyId) ?? customerRecord.id,
      company:
        record.company && typeof record.company === 'object'
          ? record.company
          : {
              id: customerRecord.id,
              name: normalizeString(customerRecord.name),
            },
      accountOwner: getAccountOwner(customerRecord.accountOwner),
      owner: getAccountOwner(customerRecord.accountOwner),
      country: getCountryLabel(customerRecord),
      customerStage: customerRecord.customerStage ?? null,
      customerGroup: customerRecord.customerGroup ?? null,
      customerSource: record.customerSource ?? customerRecord.customerSource ?? null,
      customerTags: Array.isArray(customerRecord.customerTags)
        ? customerRecord.customerTags
        : null,
      customerStar: customerRecord.customerStar ?? null,
      customerScore: customerRecord.customerScore ?? null,
      customerCode: normalizeString(customerRecord.customerCode),
      lastContactAt: normalizeDateString(record.updatedAt ?? customerRecord.lastContactAt),
      lastFollowUpAt: normalizeDateString(
        record.updatedAt ?? customerRecord.lastFollowUpAt,
      ),
      facebook: normalizeString(record.facebook),
      twitter: normalizeString(record.twitter),
      linkedIn: normalizeString(record.linkedIn),
      birthday: normalizeDateString(record.birthday),
      gender:
        record.gender &&
        (typeof record.gender === 'object' || typeof record.gender === 'string')
          ? record.gender
          : null,
      contactNotes: normalizeString(record.contactNotes),
    };
  }

  private mapOpportunityRecord(
    record: WorkspaceOpportunityRecord,
    customerRecord: WorkspaceCompanyRecord,
  ): Record<string, unknown> {
    return {
      id: record.id,
      name: normalizeString(record.name),
      owner: getAccountOwner(record.owner),
      accountOwner: getAccountOwner(customerRecord.accountOwner),
      companyId: normalizeString(record.companyId) ?? customerRecord.id,
      company:
        record.company && typeof record.company === 'object'
          ? record.company
          : {
              id: customerRecord.id,
              name: normalizeString(customerRecord.name),
            },
      pointOfContactId: normalizeString(record.pointOfContactId),
      pointOfContact:
        record.pointOfContact && typeof record.pointOfContact === 'object'
          ? record.pointOfContact
          : null,
      stage: normalizeString(record.stage),
      customerStage: normalizeString(record.stage),
      customerGroup: customerRecord.customerGroup ?? null,
      customerSource: record.customerSource ?? customerRecord.customerSource ?? null,
      amount:
        record.amount && typeof record.amount === 'object' ? record.amount : null,
      closeDate: normalizeDateString(record.closeDate),
      lastActivityDate: normalizeDateString(record.lastActivityDate),
      lastFollowUpAt: normalizeDateString(
        record.lastActivityDate ?? record.updatedAt,
      ),
      lastContactAt: normalizeDateString(record.lastActivityDate),
      country: getCountryLabel(customerRecord),
    };
  }
}
