import { Injectable } from '@nestjs/common';

import { type ObjectLiteral } from 'typeorm';

import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import {
  TRADE_CRM_CUSTOMER_GROUP_OPTIONS,
  TRADE_CRM_CUSTOMER_STAGE_OPTIONS,
  TRADE_CRM_CUSTOMER_TAG_OPTIONS,
  TRADE_CRM_PUBLIC_POOL_STATE_OPTIONS,
  TRADE_CRM_SOURCE_OPTIONS,
} from 'src/engine/workspace-manager/trade-crm-metadata/constants/trade-crm-select-options.constant';
import {
  CustomerWorkspaceListArgs,
  CustomerWorkspaceListDTO,
  CustomerWorkspaceListItemDTO,
  CustomerWorkspaceSummaryDTO,
} from 'src/engine/core-modules/customer/dto/customer-workspace-list.dto';

type TradeCrmSelectOption = {
  label: string;
  value: string;
};

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

const toLabelMap = (options: TradeCrmSelectOption[]) =>
  Object.fromEntries(options.map((option) => [option.value, option.label]));

const CUSTOMER_STAGE_LABELS_BY_VALUE = toLabelMap(TRADE_CRM_CUSTOMER_STAGE_OPTIONS);
const CUSTOMER_GROUP_LABELS_BY_VALUE = toLabelMap(TRADE_CRM_CUSTOMER_GROUP_OPTIONS);
const CUSTOMER_SOURCE_LABELS_BY_VALUE = toLabelMap(TRADE_CRM_SOURCE_OPTIONS);
const CUSTOMER_TAG_LABELS_BY_VALUE = toLabelMap(TRADE_CRM_CUSTOMER_TAG_OPTIONS);
const PUBLIC_POOL_STATE_LABELS_BY_VALUE = toLabelMap(
  TRADE_CRM_PUBLIC_POOL_STATE_OPTIONS,
);

const normalizeString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const normalizeDateString = (value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return typeof value === 'string' && value.length > 0 ? value : null;
};

const getSelectValue = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    const maybeValue = (value as { value?: unknown }).value;
    const maybeLabel = (value as { label?: unknown }).label;
    const maybeName = (value as { name?: unknown }).name;

    return (
      normalizeString(maybeValue) ??
      normalizeString(maybeLabel) ??
      normalizeString(maybeName)
    );
  }

  return null;
};

const getSelectLabel = ({
  value,
  labelsByValue,
}: {
  value: unknown;
  labelsByValue: Record<string, string>;
}) => {
  const resolvedValue = getSelectValue(value);

  return resolvedValue ? labelsByValue[resolvedValue] ?? resolvedValue : null;
};

const getMultiSelectLabels = ({
  value,
  labelsByValue,
}: {
  value: unknown;
  labelsByValue: Record<string, string>;
}) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => getSelectLabel({ value: entry, labelsByValue }))
    .filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
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

const getAddressCountry = (value: unknown) => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return normalizeString(
    (value as { addressCountry?: unknown }).addressCountry,
  );
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

const countLabels = (labels: string[]): CustomerWorkspaceSummaryDTO[] => {
  const countByLabel = labels.reduce<Record<string, number>>((accumulator, label) => {
    accumulator[label] = (accumulator[label] ?? 0) + 1;

    return accumulator;
  }, {});

  return Object.entries(countByLabel)
    .map(([label, count]) => ({
      label,
      count,
    }))
    .sort((left, right) =>
      right.count !== left.count
        ? right.count - left.count
        : left.label.localeCompare(right.label),
    );
};

const getSafeLimit = (limit: number | undefined) =>
  Math.max(1, Math.min(limit ?? 50, 200));

@Injectable()
export class CustomerWorkspaceListService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly objectMetadataService: ObjectMetadataService,
  ) {}

  async getCustomerWorkspaceList(
    workspaceId: string,
    args: CustomerWorkspaceListArgs,
  ): Promise<CustomerWorkspaceListDTO> {
    const authContext = buildSystemAuthContext(workspaceId);
    const hasCompanyObject = await this.hasWorkspaceObject(workspaceId, 'company');

    if (!hasCompanyObject) {
      return {
        records: [],
        totalCount: 0,
        publicPoolCount: 0,
        stageSummary: [],
        groupSummary: [],
        sourceSummary: [],
        tagSummary: [],
      };
    }

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const repository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspaceCompanyRecord>(
          workspaceId,
          'company',
          { shouldBypassPermissionChecks: true },
        );

      const records = await repository.find({
        order: {
          updatedAt: 'DESC',
        },
        // Filter logic is domain-specific and runs after metadata mapping.
        // Fetch a wider window first so public-pool and tag filters do not miss
        // records just because they are not in the first visible page.
        take: 500,
        relations: ['accountOwner'],
      });

      const filteredRecords = records.filter((record) =>
        this.matchesFilters(record, args),
      );
      const visibleRecords = filteredRecords.slice(0, getSafeLimit(args.limit));

      return {
        records: visibleRecords.map((record) => this.mapRecord(record)),
        totalCount: filteredRecords.length,
        publicPoolCount: filteredRecords.filter(
          (record) =>
            getSelectLabel({
              value: record.publicPoolState,
              labelsByValue: PUBLIC_POOL_STATE_LABELS_BY_VALUE,
            }) === 'Public Pool',
        ).length,
        stageSummary: countLabels(
          filteredRecords
            .map((record) =>
              getSelectLabel({
                value: record.customerStage,
                labelsByValue: CUSTOMER_STAGE_LABELS_BY_VALUE,
              }),
            )
            .filter((label): label is string => label !== null),
        ),
        groupSummary: countLabels(
          filteredRecords
            .map((record) =>
              getSelectLabel({
                value: record.customerGroup,
                labelsByValue: CUSTOMER_GROUP_LABELS_BY_VALUE,
              }),
            )
            .filter((label): label is string => label !== null),
        ),
        sourceSummary: countLabels(
          filteredRecords
            .map((record) =>
              getSelectLabel({
                value: record.customerSource,
                labelsByValue: CUSTOMER_SOURCE_LABELS_BY_VALUE,
              }),
            )
            .filter((label): label is string => label !== null),
        ),
        tagSummary: countLabels(
          filteredRecords.flatMap((record) =>
            getMultiSelectLabels({
              value: record.customerTags,
              labelsByValue: CUSTOMER_TAG_LABELS_BY_VALUE,
            }),
          ),
        ),
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

  private matchesFilters(
    record: WorkspaceCompanyRecord,
    args: CustomerWorkspaceListArgs,
  ) {
    if (
      args.stageValue &&
      getSelectValue(record.customerStage) !== normalizeString(args.stageValue)
    ) {
      return false;
    }

    if (
      args.sourceValue &&
      getSelectValue(record.customerSource) !== normalizeString(args.sourceValue)
    ) {
      return false;
    }

    if (
      args.tagValue &&
      !getMultiSelectLabels({
        value: record.customerTags,
        labelsByValue: CUSTOMER_TAG_LABELS_BY_VALUE,
      }).includes(
        CUSTOMER_TAG_LABELS_BY_VALUE[normalizeString(args.tagValue) ?? ''] ??
          normalizeString(args.tagValue) ??
          '',
      )
    ) {
      const tagValue = normalizeString(args.tagValue);

      if (
        !Array.isArray(record.customerTags) ||
        !record.customerTags.some((entry) => getSelectValue(entry) === tagValue)
      ) {
        return false;
      }
    }

    if (
      args.publicPoolStateValue &&
      getSelectValue(record.publicPoolState) !==
        normalizeString(args.publicPoolStateValue)
    ) {
      return false;
    }

    const normalizedSearchTerm = normalizeString(args.searchTerm)?.toLowerCase() ?? '';

    if (normalizedSearchTerm.length === 0) {
      return true;
    }

    const searchableValues = [
      normalizeString(record.name),
      normalizeString(record.shortName),
      normalizeString(record.customerCode),
      normalizeString(record.country),
      getAddressCountry(record.address),
      getRelationName(record.accountOwner),
      getLinkLabel(record.website),
      getLinkLabel(record.domainName),
      getSelectLabel({
        value: record.customerStage,
        labelsByValue: CUSTOMER_STAGE_LABELS_BY_VALUE,
      }),
      getSelectLabel({
        value: record.customerGroup,
        labelsByValue: CUSTOMER_GROUP_LABELS_BY_VALUE,
      }),
      getSelectLabel({
        value: record.customerSource,
        labelsByValue: CUSTOMER_SOURCE_LABELS_BY_VALUE,
      }),
      ...getMultiSelectLabels({
        value: record.customerTags,
        labelsByValue: CUSTOMER_TAG_LABELS_BY_VALUE,
      }),
    ]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .map((value) => value.toLowerCase());

    return searchableValues.some((value) => value.includes(normalizedSearchTerm));
  }

  private mapRecord(record: WorkspaceCompanyRecord): CustomerWorkspaceListItemDTO {
    const accountOwnerName = getRelationName(record.accountOwner);

    return {
      id: record.id,
      name: normalizeString(record.name),
      shortName: normalizeString(record.shortName),
      country: normalizeString(record.country),
      address:
        record.address && typeof record.address === 'object' ? record.address : null,
      website:
        record.website && (typeof record.website === 'object' || typeof record.website === 'string')
          ? record.website
          : null,
      domainName: getLinkLabel(record.domainName),
      accountOwner: accountOwnerName ? { name: accountOwnerName } : null,
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
}
