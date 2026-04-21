import { Injectable } from '@nestjs/common';

import { type ObjectLiteral } from 'typeorm';

import {
  CustomerDedupAppliedRuleDTO,
  CustomerDedupHitDTO,
  CustomerDedupSearchArgs,
  CustomerDedupSearchDTO,
} from 'src/engine/core-modules/customer/dto/customer-dedup-search.dto';
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
  publicPoolState?: Record<string, unknown> | string | null;
  publicPoolGroup?: Record<string, unknown> | string | null;
};

type WorkspacePersonRecord = ObjectLiteral & {
  id: string;
  updatedAt?: Date | string | null;
  companyId?: string | null;
  name?: Record<string, unknown> | null;
  nickname?: string | null;
  emails?: Record<string, unknown> | null;
  email?: string | null;
  phones?: Record<string, unknown> | null;
  phone?: string | null;
  mobile?: string | null;
  jobTitle?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  linkedIn?: string | null;
  customerSource?: Record<string, unknown> | string | null;
};

type WorkspaceMatchingRuleRecord = ObjectLiteral & {
  id: string;
  fieldName?: string | null;
  weight?: number | string | null;
  priority?: number | string | null;
  isEnabled?: boolean | null;
};

type MatchingRule = {
  field: string;
  weight: number;
};

type ScoredField = {
  field: string;
  score: number;
  value: string;
  contact?: WorkspacePersonRecord;
};

const DEFAULT_MATCHING_RULES: MatchingRule[] = [
  { field: 'companyName', weight: 35 },
  { field: 'shortName', weight: 20 },
  { field: 'customerCode', weight: 30 },
  { field: 'email', weight: 35 },
  { field: 'phone', weight: 30 },
  { field: 'contactName', weight: 18 },
  { field: 'social', weight: 18 },
  { field: 'country', weight: 10 },
];

const EMPTY_DEDUP_SEARCH: CustomerDedupSearchDTO = {
  hits: [],
  totalCount: 0,
  appliedRules: DEFAULT_MATCHING_RULES,
};

const getSafeLimit = (limit: number | undefined) =>
  Math.max(1, Math.min(limit ?? 20, 100));

const normalizeString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const normalizeDateString = (value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return typeof value === 'string' && value.length > 0 ? value : null;
};

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

const getLinkLabel = (value: unknown) => {
  if (!value || typeof value !== 'object') {
    return normalizeString(value);
  }

  return (
    normalizeString((value as { primaryLinkLabel?: unknown }).primaryLinkLabel) ??
    normalizeString((value as { primaryLinkUrl?: unknown }).primaryLinkUrl)
  );
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

const normalizeFieldName = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toLowerCase();

const getCanonicalFieldName = (value: string) => {
  const normalizedValue = normalizeFieldName(value);
  const fieldMap: Record<string, string> = {
    company: 'companyName',
    companyname: 'companyName',
    name: 'companyName',
    shortname: 'shortName',
    customername: 'companyName',
    customercode: 'customerCode',
    customerno: 'customerCode',
    code: 'customerCode',
    email: 'email',
    customeremail: 'email',
    contactemail: 'email',
    phone: 'phone',
    customerphone: 'phone',
    contactphone: 'phone',
    contact: 'contactName',
    contactname: 'contactName',
    social: 'social',
    socialaccount: 'social',
    country: 'country',
    countryregion: 'country',
    region: 'country',
  };

  return fieldMap[normalizedValue] ?? normalizedValue;
};

const getMatchScore = ({
  candidateValue,
  normalizedSearchTerm,
  weight,
}: {
  candidateValue: string | null;
  normalizedSearchTerm: string;
  weight: number;
}) => {
  if (!candidateValue) {
    return 0;
  }

  const normalizedCandidateValue = candidateValue.toLowerCase();

  if (normalizedCandidateValue === normalizedSearchTerm) {
    return weight;
  }

  if (normalizedCandidateValue.includes(normalizedSearchTerm)) {
    return Math.ceil(weight * 0.74);
  }

  if (normalizedSearchTerm.includes(normalizedCandidateValue)) {
    return Math.ceil(weight * 0.62);
  }

  const searchTokens = normalizedSearchTerm
    .split(/\s+/)
    .filter((token) => token.length > 1);

  if (
    searchTokens.length > 0 &&
    searchTokens.some((token) => normalizedCandidateValue.includes(token))
  ) {
    return Math.ceil(weight * 0.42);
  }

  return 0;
};

@Injectable()
export class CustomerDedupSearchService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly objectMetadataService: ObjectMetadataService,
  ) {}

  async searchCustomerDuplicates(
    workspaceId: string,
    args: CustomerDedupSearchArgs,
  ): Promise<CustomerDedupSearchDTO> {
    const normalizedSearchTerm = normalizeString(args.searchTerm)?.toLowerCase();

    if (!normalizedSearchTerm) {
      return EMPTY_DEDUP_SEARCH;
    }

    const authContext = buildSystemAuthContext(workspaceId);
    const [hasCompanyObject, hasPersonObject, hasMatchingRuleObject] =
      await Promise.all([
        this.hasWorkspaceObject(workspaceId, 'company'),
        this.hasWorkspaceObject(workspaceId, 'person'),
        this.hasWorkspaceObject(workspaceId, 'customerMatchingRule'),
      ]);

    if (!hasCompanyObject) {
      return EMPTY_DEDUP_SEARCH;
    }

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const [companyRecords, personRecords, matchingRules] = await Promise.all([
        this.findCompanyRecords(workspaceId),
        hasPersonObject ? this.findPersonRecords(workspaceId) : Promise.resolve([]),
        hasMatchingRuleObject
          ? this.findMatchingRules(workspaceId)
          : Promise.resolve(DEFAULT_MATCHING_RULES),
      ]);
      const peopleByCompanyId = this.groupPeopleByCompanyId(personRecords);
      const appliedRules =
        matchingRules.length > 0 ? matchingRules : DEFAULT_MATCHING_RULES;
      const hits = companyRecords
        .map((companyRecord) =>
          this.scoreCompanyRecord({
            companyRecord,
            contactRecords: peopleByCompanyId.get(companyRecord.id) ?? [],
            normalizedSearchTerm,
            rules: appliedRules,
          }),
        )
        .filter((hit): hit is CustomerDedupHitDTO => hit !== null)
        .sort(
          (left, right) =>
            right.matchScore - left.matchScore ||
            String(left.customer.name ?? '').localeCompare(
              String(right.customer.name ?? ''),
            ),
        );

      return {
        hits: hits.slice(0, getSafeLimit(args.limit)),
        totalCount: hits.length,
        appliedRules,
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

  private async findCompanyRecords(workspaceId: string) {
    const repository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceCompanyRecord>(
        workspaceId,
        'company',
        { shouldBypassPermissionChecks: true },
      );

    return repository.find({
      order: {
        updatedAt: 'DESC',
      },
      take: 500,
      relations: ['accountOwner'],
    });
  }

  private async findPersonRecords(workspaceId: string) {
    const repository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspacePersonRecord>(
        workspaceId,
        'person',
        { shouldBypassPermissionChecks: true },
      );

    return repository.find({
      order: {
        updatedAt: 'DESC',
      },
      take: 1000,
    });
  }

  private async findMatchingRules(workspaceId: string): Promise<MatchingRule[]> {
    const repository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceMatchingRuleRecord>(
        workspaceId,
        'customerMatchingRule',
        { shouldBypassPermissionChecks: true },
      );

    const records = await repository.find({
      order: {
        priority: 'ASC',
      },
      take: 50,
    });

    return records
      .filter((record) => record.isEnabled !== false)
      .map((record) => ({
        field: getCanonicalFieldName(
          normalizeString(record.fieldName) ?? 'companyName',
        ),
        weight: normalizeNumber(record.weight) ?? 10,
      }))
      .filter((rule) => rule.weight > 0);
  }

  private groupPeopleByCompanyId(records: WorkspacePersonRecord[]) {
    return records.reduce<Map<string, WorkspacePersonRecord[]>>(
      (accumulator, record) => {
        const companyId = normalizeString(record.companyId);

        if (!companyId) {
          return accumulator;
        }

        accumulator.set(companyId, [...(accumulator.get(companyId) ?? []), record]);

        return accumulator;
      },
      new Map(),
    );
  }

  private scoreCompanyRecord({
    companyRecord,
    contactRecords,
    normalizedSearchTerm,
    rules,
  }: {
    companyRecord: WorkspaceCompanyRecord;
    contactRecords: WorkspacePersonRecord[];
    normalizedSearchTerm: string;
    rules: MatchingRule[];
  }): CustomerDedupHitDTO | null {
    const scoredFields = rules.flatMap((rule) =>
      this.scoreField({
        companyRecord,
        contactRecords,
        normalizedSearchTerm,
        rule,
      }),
    );
    const bestScoreByField = scoredFields.reduce<Map<string, ScoredField>>(
      (accumulator, scoredField) => {
        const currentValue = accumulator.get(scoredField.field);

        if (!currentValue || currentValue.score < scoredField.score) {
          accumulator.set(scoredField.field, scoredField);
        }

        return accumulator;
      },
      new Map(),
    );
    const matchedFields = [...bestScoreByField.values()].filter(
      (field) => field.score > 0,
    );
    const matchScore = Math.min(
      100,
      matchedFields.reduce((totalScore, field) => totalScore + field.score, 0),
    );

    if (matchScore === 0) {
      return null;
    }

    const primaryMatch =
      matchedFields.sort((left, right) => right.score - left.score)[0] ?? null;

    return {
      customer: this.mapCustomerRecord(companyRecord),
      matchedContact: primaryMatch?.contact
        ? this.mapContactRecord(primaryMatch.contact)
        : contactRecords[0]
          ? this.mapContactRecord(contactRecords[0])
          : null,
      matchScore,
      matchedFields: matchedFields.map((field) => field.field),
      primaryMatch: primaryMatch
        ? `${primaryMatch.field}: ${primaryMatch.value}`
        : null,
    };
  }

  private scoreField({
    companyRecord,
    contactRecords,
    normalizedSearchTerm,
    rule,
  }: {
    companyRecord: WorkspaceCompanyRecord;
    contactRecords: WorkspacePersonRecord[];
    normalizedSearchTerm: string;
    rule: MatchingRule;
  }): ScoredField[] {
    if (rule.field === 'companyName') {
      return [
        this.toScoredField({
          field: 'companyName',
          value: normalizeString(companyRecord.name),
          normalizedSearchTerm,
          weight: rule.weight,
        }),
      ];
    }

    if (rule.field === 'shortName') {
      return [
        this.toScoredField({
          field: 'shortName',
          value: normalizeString(companyRecord.shortName),
          normalizedSearchTerm,
          weight: rule.weight,
        }),
      ];
    }

    if (rule.field === 'customerCode') {
      return [
        this.toScoredField({
          field: 'customerCode',
          value: normalizeString(companyRecord.customerCode),
          normalizedSearchTerm,
          weight: rule.weight,
        }),
      ];
    }

    if (rule.field === 'country') {
      return [
        this.toScoredField({
          field: 'country',
          value:
            normalizeString(companyRecord.country) ??
            normalizeString(
              (companyRecord.address as { addressCountry?: unknown } | null)
                ?.addressCountry,
            ),
          normalizedSearchTerm,
          weight: rule.weight,
        }),
      ];
    }

    if (rule.field === 'email') {
      return contactRecords.map((contactRecord) =>
        this.toScoredField({
          field: 'email',
          value:
            normalizeString(contactRecord.email) ??
            getPrimaryEmail(contactRecord.emails),
          normalizedSearchTerm,
          weight: rule.weight,
          contact: contactRecord,
        }),
      );
    }

    if (rule.field === 'phone') {
      return contactRecords.map((contactRecord) =>
        this.toScoredField({
          field: 'phone',
          value:
            normalizeString(contactRecord.phone) ??
            normalizeString(contactRecord.mobile) ??
            getPrimaryPhone(contactRecord.phones),
          normalizedSearchTerm,
          weight: rule.weight,
          contact: contactRecord,
        }),
      );
    }

    if (rule.field === 'contactName') {
      return contactRecords.map((contactRecord) =>
        this.toScoredField({
          field: 'contactName',
          value:
            getRelationName(contactRecord.name) ??
            normalizeString(contactRecord.nickname),
          normalizedSearchTerm,
          weight: rule.weight,
          contact: contactRecord,
        }),
      );
    }

    if (rule.field === 'social') {
      return contactRecords.flatMap((contactRecord) =>
        [contactRecord.facebook, contactRecord.twitter, contactRecord.linkedIn].map(
          (value) =>
            this.toScoredField({
              field: 'social',
              value: normalizeString(value),
              normalizedSearchTerm,
              weight: rule.weight,
              contact: contactRecord,
            }),
        ),
      );
    }

    return [];
  }

  private toScoredField({
    field,
    value,
    normalizedSearchTerm,
    weight,
    contact,
  }: {
    field: string;
    value: string | null;
    normalizedSearchTerm: string;
    weight: number;
    contact?: WorkspacePersonRecord;
  }): ScoredField {
    return {
      field,
      value: value ?? '',
      score: getMatchScore({
        candidateValue: value,
        normalizedSearchTerm,
        weight,
      }),
      contact,
    };
  }

  private mapCustomerRecord(record: WorkspaceCompanyRecord): Record<string, unknown> {
    const accountOwnerName = getRelationName(record.accountOwner);

    return {
      id: record.id,
      name: normalizeString(record.name),
      shortName: normalizeString(record.shortName),
      country: normalizeString(record.country),
      address:
        record.address && typeof record.address === 'object' ? record.address : null,
      website:
        record.website &&
        (typeof record.website === 'object' || typeof record.website === 'string')
          ? record.website
          : null,
      domainName: getLinkLabel(record.domainName),
      accountOwner: accountOwnerName ? { name: accountOwnerName } : null,
      owner: null,
      customerStage: record.customerStage ?? null,
      customerGroup: record.customerGroup ?? null,
      customerSource: record.customerSource ?? null,
      customerTags: Array.isArray(record.customerTags) ? record.customerTags : null,
      customerStar: record.customerStar ?? null,
      customerScore: record.customerScore ?? null,
      customerCode: normalizeString(record.customerCode),
      lastContactAt: normalizeDateString(record.lastContactAt),
      lastFollowUpAt: normalizeDateString(record.lastFollowUpAt),
      publicPoolState: record.publicPoolState ?? null,
      publicPoolGroup: record.publicPoolGroup ?? null,
    };
  }

  private mapContactRecord(record: WorkspacePersonRecord): Record<string, unknown> {
    return {
      id: record.id,
      name: record.name ?? null,
      nickname: normalizeString(record.nickname),
      email: normalizeString(record.email) ?? getPrimaryEmail(record.emails),
      phone:
        normalizeString(record.phone) ??
        normalizeString(record.mobile) ??
        getPrimaryPhone(record.phones),
      emails: record.emails ?? null,
      phones: record.phones ?? null,
      jobTitle: normalizeString(record.jobTitle),
      companyId: normalizeString(record.companyId),
      customerSource: record.customerSource ?? null,
      facebook: normalizeString(record.facebook),
      twitter: normalizeString(record.twitter),
      linkedIn: normalizeString(record.linkedIn),
      lastFollowUpAt: normalizeDateString(record.updatedAt),
    };
  }
}
