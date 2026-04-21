import { Injectable } from '@nestjs/common';

import { type ObjectLiteral } from 'typeorm';

import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import {
  TRADE_CRM_CUSTOMER_STAGE_OPTIONS,
  TRADE_CRM_IMPORT_DESTINATION_OPTIONS,
  TRADE_CRM_PUBLIC_POOL_GROUP_OPTIONS,
  TRADE_CRM_TAG_OBJECT_SCOPE_OPTIONS,
  TRADE_CRM_TAG_SCOPE_OPTIONS,
} from 'src/engine/workspace-manager/trade-crm-metadata/constants/trade-crm-select-options.constant';
import {
  CustomerConfigAggregateDTO,
  CustomerConfigGroupDTO,
  CustomerConfigImportDefaultsDTO,
  CustomerConfigMatchingRuleDTO,
  CustomerConfigPublicPoolRuleDTO,
  CustomerConfigSelectOptionDTO,
  CustomerConfigSourceDTO,
  CustomerConfigTagDTO,
} from 'src/engine/core-modules/customer/dto/customer-config.dto';

type WorkspaceConfigRecord = ObjectLiteral & {
  id: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  groupName?: string | null;
  parentGroupId?: string | null;
  sortOrder?: number | null;
  level?: number | null;
  isEnabled?: boolean | null;
  tagName?: string | null;
  tagColor?: string | null;
  tagScope?: string | null;
  objectScope?: string | null;
  sourceName?: string | null;
  sourceCode?: string | null;
  ruleName?: string | null;
  inactivityDays?: number | null;
  notifyOwnersFirst?: boolean | null;
  scopeStages?: string[] | null;
  publicPoolGroup?: string | null;
  fieldName?: string | null;
  weight?: number | null;
  priority?: number | null;
  fileName?: string | null;
  destination?: string | null;
  updateExistingContacts?: boolean | null;
  selectedFields?: string[] | null;
  status?: string | null;
};

type TradeCrmSelectOption = {
  color?: string | null;
  label: string;
  position?: number | null;
  value: string;
};

const CUSTOMER_IMPORT_DEFAULT_CONFIG_FILE_NAME = '__CUSTOMER_IMPORT_DEFAULTS__';

const normalizeString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const normalizeNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const normalizeBoolean = (value: unknown) =>
  typeof value === 'boolean' ? value : false;

const normalizeStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is string =>
          typeof entry === 'string' && entry.trim().length > 0,
      )
    : [];

const normalizeTimestamp = (value: Date | string | null | undefined) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return typeof value === 'string' ? value : '';
};

const sortByPosition = <TRecord extends { position?: number | null }>(
  records: TRecord[],
) =>
  [...records].sort(
    (left, right) =>
      (left.position ?? Number.MAX_SAFE_INTEGER) -
      (right.position ?? Number.MAX_SAFE_INTEGER),
  );

const sortByOptionalNumber = <
  TRecord extends {
    createdAt?: Date | string | null;
    priority?: number | null;
    sortOrder?: number | null;
    updatedAt?: Date | string | null;
  },
>(
  records: TRecord[],
  fieldName: 'sortOrder' | 'priority',
) =>
  [...records].sort((left, right) => {
    const leftOrder = normalizeNumber(left[fieldName]) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = normalizeNumber(right[fieldName]) ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return normalizeTimestamp(left.updatedAt ?? left.createdAt).localeCompare(
      normalizeTimestamp(right.updatedAt ?? right.createdAt),
    );
  });

const sortByLatestTimestamp = <
  TRecord extends {
    createdAt?: Date | string | null;
    updatedAt?: Date | string | null;
  },
>(
  records: TRecord[],
) =>
  [...records].sort((left, right) =>
    normalizeTimestamp(right.updatedAt ?? right.createdAt).localeCompare(
      normalizeTimestamp(left.updatedAt ?? left.createdAt),
    ),
  );

@Injectable()
export class CustomerConfigService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly objectMetadataService: ObjectMetadataService,
  ) {}

  async getCustomerConfig(
    workspaceId: string,
  ): Promise<CustomerConfigAggregateDTO> {
    const authContext = buildSystemAuthContext(workspaceId);

    const [
      hasCustomerGroupObject,
      hasCustomerTagObject,
      hasCustomerSourceObject,
      hasCustomerPublicPoolRuleObject,
      hasCustomerMatchingRuleObject,
      hasCustomerImportJobObject,
    ] = await Promise.all([
      this.hasWorkspaceObject(workspaceId, 'customerGroup'),
      this.hasWorkspaceObject(workspaceId, 'customerTag'),
      this.hasWorkspaceObject(workspaceId, 'customerSource'),
      this.hasWorkspaceObject(workspaceId, 'customerPublicPoolRule'),
      this.hasWorkspaceObject(workspaceId, 'customerMatchingRule'),
      this.hasWorkspaceObject(workspaceId, 'customerImportJob'),
    ]);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const [
        groupRecords,
        tagRecords,
        sourceRecords,
        publicPoolRuleRecords,
        matchingRuleRecords,
        importDefaultRecords,
      ] = await Promise.all([
        hasCustomerGroupObject
          ? this.findWorkspaceRecords(workspaceId, 'customerGroup')
          : Promise.resolve([]),
        hasCustomerTagObject
          ? this.findWorkspaceRecords(workspaceId, 'customerTag')
          : Promise.resolve([]),
        hasCustomerSourceObject
          ? this.findWorkspaceRecords(workspaceId, 'customerSource')
          : Promise.resolve([]),
        hasCustomerPublicPoolRuleObject
          ? this.findWorkspaceRecords(workspaceId, 'customerPublicPoolRule')
          : Promise.resolve([]),
        hasCustomerMatchingRuleObject
          ? this.findWorkspaceRecords(workspaceId, 'customerMatchingRule')
          : Promise.resolve([]),
        hasCustomerImportJobObject
          ? this.findWorkspaceRecords(workspaceId, 'customerImportJob', {
              fileName: CUSTOMER_IMPORT_DEFAULT_CONFIG_FILE_NAME,
            })
          : Promise.resolve([]),
      ]);

      return {
        groups: this.mapGroupRecords(groupRecords),
        tags: this.mapTagRecords(tagRecords),
        sources: this.mapSourceRecords(sourceRecords),
        publicPoolRules: this.mapPublicPoolRuleRecords(publicPoolRuleRecords),
        matchingRules: this.mapMatchingRuleRecords(matchingRuleRecords),
        importDefaults: this.mapImportDefaults(importDefaultRecords),
        stageOptions: this.mapSelectOptions(TRADE_CRM_CUSTOMER_STAGE_OPTIONS),
        publicPoolGroupOptions: this.mapSelectOptions(
          TRADE_CRM_PUBLIC_POOL_GROUP_OPTIONS,
        ),
        tagScopeOptions: this.mapSelectOptions(TRADE_CRM_TAG_SCOPE_OPTIONS),
        tagObjectScopeOptions: this.mapSelectOptions(
          TRADE_CRM_TAG_OBJECT_SCOPE_OPTIONS,
        ),
        importDestinationOptions: this.mapSelectOptions(
          TRADE_CRM_IMPORT_DESTINATION_OPTIONS,
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

  private async findWorkspaceRecords(
    workspaceId: string,
    objectNameSingular: string,
    where: Record<string, unknown> = {},
  ): Promise<WorkspaceConfigRecord[]> {
    const repository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceConfigRecord>(
        workspaceId,
        objectNameSingular,
        { shouldBypassPermissionChecks: true },
      );

    return repository.find({
      where,
    });
  }

  private mapGroupRecords(
    records: WorkspaceConfigRecord[],
  ): CustomerConfigGroupDTO[] {
    return sortByOptionalNumber(records, 'sortOrder').map((record) => ({
      id: record.id,
      label: normalizeString(record.groupName) ?? 'Unnamed Group',
      parentId: normalizeString(record.parentGroupId),
      level: normalizeNumber(record.level) ?? 1,
      sortOrder: normalizeNumber(record.sortOrder),
      isEnabled: record.isEnabled !== false,
    }));
  }

  private mapTagRecords(records: WorkspaceConfigRecord[]): CustomerConfigTagDTO[] {
    return sortByOptionalNumber(records, 'sortOrder').map((record) => ({
      id: record.id,
      label: normalizeString(record.tagName) ?? 'Unnamed Tag',
      color: normalizeString(record.tagColor),
      scope: normalizeString(record.tagScope),
      objectScope: normalizeString(record.objectScope),
      sortOrder: normalizeNumber(record.sortOrder),
      isEnabled: record.isEnabled !== false,
    }));
  }

  private mapSourceRecords(
    records: WorkspaceConfigRecord[],
  ): CustomerConfigSourceDTO[] {
    return sortByOptionalNumber(records, 'sortOrder').map((record) => ({
      id: record.id,
      label: normalizeString(record.sourceName) ?? 'Unnamed Source',
      code: normalizeString(record.sourceCode),
      sortOrder: normalizeNumber(record.sortOrder),
      isEnabled: record.isEnabled !== false,
    }));
  }

  private mapPublicPoolRuleRecords(
    records: WorkspaceConfigRecord[],
  ): CustomerConfigPublicPoolRuleDTO[] {
    return sortByLatestTimestamp(records).map((record) => ({
      id: record.id,
      ruleName: normalizeString(record.ruleName) ?? 'Unnamed Rule',
      inactivityDays: normalizeNumber(record.inactivityDays),
      notifyOwnersFirst: normalizeBoolean(record.notifyOwnersFirst),
      scopeStageValues: normalizeStringArray(record.scopeStages),
      publicPoolGroupValue: normalizeString(record.publicPoolGroup),
      isEnabled: record.isEnabled !== false,
    }));
  }

  private mapMatchingRuleRecords(
    records: WorkspaceConfigRecord[],
  ): CustomerConfigMatchingRuleDTO[] {
    return sortByOptionalNumber(records, 'priority').map((record) => ({
      id: record.id,
      field: normalizeString(record.fieldName) ?? 'Unnamed Field',
      weight: normalizeNumber(record.weight),
      priority: normalizeNumber(record.priority),
      isEnabled: record.isEnabled !== false,
    }));
  }

  private mapImportDefaults(
    records: WorkspaceConfigRecord[],
  ): CustomerConfigImportDefaultsDTO {
    const record = sortByLatestTimestamp(records)[0] ?? null;

    if (!record) {
      return {
        id: null,
        destinationValue: null,
        updateExistingContacts: false,
        selectedFields: [],
        status: null,
      };
    }

    return {
      id: record.id,
      destinationValue: normalizeString(record.destination),
      updateExistingContacts: normalizeBoolean(record.updateExistingContacts),
      selectedFields: normalizeStringArray(record.selectedFields),
      status: normalizeString(record.status),
    };
  }

  private mapSelectOptions(
    options: TradeCrmSelectOption[],
  ): CustomerConfigSelectOptionDTO[] {
    return sortByPosition(options).map((option) => ({
      label: option.label,
      value: option.value,
      color: normalizeString(option.color),
      position: normalizeNumber(option.position),
    }));
  }
}
