import { Injectable, Logger } from '@nestjs/common';

import {
  ViewFilterGroupLogicalOperator,
  ViewFilterOperand,
  ViewType,
  ViewVisibility,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import { type ViewFilterDTO } from 'src/engine/metadata-modules/view-filter/dtos/view-filter.dto';
import { type ViewFilterGroupDTO } from 'src/engine/metadata-modules/view-filter-group/dtos/view-filter-group.dto';
import { ViewFilterGroupService } from 'src/engine/metadata-modules/view-filter-group/services/view-filter-group.service';
import { ViewFilterService } from 'src/engine/metadata-modules/view-filter/services/view-filter.service';
import { type ViewFilterValue } from 'src/engine/metadata-modules/view-filter/types/view-filter-value.type';
import { ViewSortDirection } from 'src/engine/metadata-modules/view-sort/enums/view-sort-direction';
import { type ViewSortDTO } from 'src/engine/metadata-modules/view-sort/dtos/view-sort.dto';
import { ViewSortService } from 'src/engine/metadata-modules/view-sort/services/view-sort.service';
import { ViewService } from 'src/engine/metadata-modules/view/services/view.service';
import { buildObjectIdByNameMaps } from 'src/engine/metadata-modules/flat-object-metadata/utils/build-object-id-by-name-maps.util';

@Injectable()
export class TradeCrmViewsInitializerService {
  private readonly logger = new Logger(TradeCrmViewsInitializerService.name);

  constructor(
    private readonly viewService: ViewService,
    private readonly viewFilterGroupService: ViewFilterGroupService,
    private readonly viewFilterService: ViewFilterService,
    private readonly viewSortService: ViewSortService,
    private readonly flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
  ) {}

  async initializeViews(workspaceId: string): Promise<void> {
    await this.flatEntityMapsCacheService.invalidateFlatEntityMaps({
      workspaceId,
      flatMapsKeys: [
        'flatObjectMetadataMaps',
        'flatFieldMetadataMaps',
        'flatViewMaps',
      ],
    });

    const {
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
      flatViewMaps,
    } = await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
      {
        workspaceId,
        flatMapsKeys: [
          'flatObjectMetadataMaps',
          'flatFieldMetadataMaps',
          'flatViewMaps',
        ],
      },
    );

    const { idByNameSingular } = buildObjectIdByNameMaps(flatObjectMetadataMaps);

    const leadObjectId = idByNameSingular['lead'];
    const opportunityObjectId = idByNameSingular['opportunity'];
    const taskObjectId = idByNameSingular['task'];

    if (!leadObjectId) {
      this.logger.warn(
        `Lead object not found for workspace ${workspaceId}, skipping views init`,
      );
      return;
    }

    await this.ensureView({
      workspaceId,
      flatViewMaps,
      objectMetadataId: leadObjectId,
      viewName: 'Leads (Trade CRM)',
      icon: 'IconTargetArrow',
      type: ViewType.TABLE,
      mainGroupByFieldMetadataId: this.findFieldIdByName({
        objectMetadataId: leadObjectId,
        fieldName: 'leadStatus',
        flatObjectMetadataMaps,
        flatFieldMetadataMaps,
      }),
    });

    await this.ensureQueueView({
      workspaceId,
      flatViewMaps,
      objectMetadataId: leadObjectId,
      viewName: 'Today New Leads',
      icon: 'IconClockHour4',
      type: ViewType.TABLE,
      filters: [
        {
          fieldMetadataId: this.findFieldIdByName({
            objectMetadataId: leadObjectId,
            fieldName: 'createdAt',
            flatObjectMetadataMaps,
            flatFieldMetadataMaps,
          }),
          operand: ViewFilterOperand.IS_TODAY,
          value: '',
        },
      ],
      sorts: [
        {
          fieldMetadataId: this.findFieldIdByName({
            objectMetadataId: leadObjectId,
            fieldName: 'createdAt',
            flatObjectMetadataMaps,
            flatFieldMetadataMaps,
          }),
          direction: ViewSortDirection.DESC,
        },
      ],
    });

    if (opportunityObjectId) {
      await this.ensureView({
        workspaceId,
        flatViewMaps,
        objectMetadataId: opportunityObjectId,
        viewName: 'Pipeline (Trade CRM)',
        icon: 'IconProgressCheck',
        type: ViewType.KANBAN,
        mainGroupByFieldMetadataId: this.findFieldIdByName({
          objectMetadataId: opportunityObjectId,
          fieldName: 'stage',
          flatObjectMetadataMaps,
          flatFieldMetadataMaps,
        }),
      });

      await this.ensureQueueView({
        workspaceId,
        flatViewMaps,
        objectMetadataId: opportunityObjectId,
        viewName: 'Pipeline Needs Next Action',
        icon: 'IconAlertCircle',
        type: ViewType.TABLE,
        filters: [
          {
            fieldMetadataId: this.findFieldIdByName({
              objectMetadataId: opportunityObjectId,
              fieldName: 'owner',
              flatObjectMetadataMaps,
              flatFieldMetadataMaps,
            }),
            operand: ViewFilterOperand.IS,
            value: {
              isCurrentWorkspaceMemberSelected: true,
              selectedRecordIds: [],
            },
          },
          {
            fieldMetadataId: this.findFieldIdByName({
              objectMetadataId: opportunityObjectId,
              fieldName: 'stage',
              flatObjectMetadataMaps,
              flatFieldMetadataMaps,
            }),
            operand: ViewFilterOperand.IS_NOT,
            value: 'WON',
          },
          {
            fieldMetadataId: this.findFieldIdByName({
              objectMetadataId: opportunityObjectId,
              fieldName: 'stage',
              flatObjectMetadataMaps,
              flatFieldMetadataMaps,
            }),
            operand: ViewFilterOperand.IS_NOT,
            value: 'LOST',
          },
        ],
        filterGroups: [
          {
            logicalOperator: ViewFilterGroupLogicalOperator.OR,
            filters: [
              {
                fieldMetadataId: this.findFieldIdByName({
                  objectMetadataId: opportunityObjectId,
                  fieldName: 'nextAction',
                  flatObjectMetadataMaps,
                  flatFieldMetadataMaps,
                }),
                operand: ViewFilterOperand.IS_EMPTY,
                value: '',
              },
              {
                fieldMetadataId: this.findFieldIdByName({
                  objectMetadataId: opportunityObjectId,
                  fieldName: 'nextActionDate',
                  flatObjectMetadataMaps,
                  flatFieldMetadataMaps,
                }),
                operand: ViewFilterOperand.IS_EMPTY,
                value: '',
              },
            ],
          },
        ],
        sorts: [
          {
            fieldMetadataId: this.findFieldIdByName({
              objectMetadataId: opportunityObjectId,
              fieldName: 'updatedAt',
              flatObjectMetadataMaps,
              flatFieldMetadataMaps,
            }),
            direction: ViewSortDirection.ASC,
          },
        ],
      });
    }

    if (taskObjectId) {
      await this.ensureView({
        workspaceId,
        flatViewMaps,
        objectMetadataId: taskObjectId,
        viewName: 'Tasks (Trade CRM)',
        icon: 'IconChecklist',
        type: ViewType.TABLE,
      });

      await this.ensureQueueView({
        workspaceId,
        flatViewMaps,
        objectMetadataId: taskObjectId,
        viewName: 'Tasks Due Today',
        icon: 'IconCalendarDue',
        type: ViewType.TABLE,
        filters: [
          {
            fieldMetadataId: this.findFieldIdByName({
              objectMetadataId: taskObjectId,
              fieldName: 'assignee',
              flatObjectMetadataMaps,
              flatFieldMetadataMaps,
            }),
            operand: ViewFilterOperand.IS,
            value: {
              isCurrentWorkspaceMemberSelected: true,
              selectedRecordIds: [],
            },
          },
          {
            fieldMetadataId: this.findFieldIdByName({
              objectMetadataId: taskObjectId,
              fieldName: 'dueAt',
              flatObjectMetadataMaps,
              flatFieldMetadataMaps,
            }),
            operand: ViewFilterOperand.IS_TODAY,
            value: '',
          },
          {
            fieldMetadataId: this.findFieldIdByName({
              objectMetadataId: taskObjectId,
              fieldName: 'status',
              flatObjectMetadataMaps,
              flatFieldMetadataMaps,
            }),
            operand: ViewFilterOperand.IS_NOT,
            value: 'DONE',
          },
        ],
        sorts: [
          {
            fieldMetadataId: this.findFieldIdByName({
              objectMetadataId: taskObjectId,
              fieldName: 'dueAt',
              flatObjectMetadataMaps,
              flatFieldMetadataMaps,
            }),
            direction: ViewSortDirection.ASC,
          },
        ],
      });
    }

    this.logger.log(`Trade CRM views init completed for workspace ${workspaceId}`);
  }

  private async ensureView({
    workspaceId,
    flatViewMaps,
    objectMetadataId,
    viewName,
    icon,
    type,
    mainGroupByFieldMetadataId,
  }: {
    workspaceId: string;
    flatViewMaps: FlatEntityMaps<FlatView>;
    objectMetadataId: string;
    viewName: string;
    icon: string;
    type: ViewType;
    mainGroupByFieldMetadataId?: string;
  }): Promise<void> {
    const exists = Object.values(flatViewMaps.byUniversalIdentifier)
      .filter((v): v is FlatView => isDefined(v) && !isDefined(v.deletedAt))
      .some((v) => v.name === viewName && v.objectMetadataId === objectMetadataId);

    if (exists) {
      return;
    }

    await this.viewService.createOne({
      workspaceId,
      createViewInput: {
        name: viewName,
        objectMetadataId,
        icon,
        type,
        visibility: ViewVisibility.WORKSPACE,
        ...(mainGroupByFieldMetadataId
          ? { mainGroupByFieldMetadataId }
          : {}),
      },
    });
  }

  private async ensureQueueView({
    workspaceId,
    flatViewMaps,
    objectMetadataId,
    viewName,
    icon,
    type,
    filters,
    filterGroups = [],
    sorts,
  }: {
    workspaceId: string;
    flatViewMaps: FlatEntityMaps<FlatView>;
    objectMetadataId: string;
    viewName: string;
    icon: string;
    type: ViewType;
    filters: Array<{
      fieldMetadataId: string;
      operand: ViewFilterOperand;
      value: ViewFilterValue;
    }>;
    filterGroups?: Array<{
      logicalOperator: ViewFilterGroupLogicalOperator;
      filters: Array<{
        fieldMetadataId: string;
        operand: ViewFilterOperand;
        value: ViewFilterValue;
      }>;
    }>;
    sorts: Array<{
      fieldMetadataId: string;
      direction: ViewSortDirection;
    }>;
  }): Promise<void> {
    const existingViewId = Object.values(flatViewMaps.byUniversalIdentifier)
      .filter((view): view is FlatView => isDefined(view) && !isDefined(view.deletedAt))
      .find(
        (view) =>
          view.name === viewName && view.objectMetadataId === objectMetadataId,
      )?.id;

    let viewId = existingViewId;

    if (!viewId) {
      const createdView = await this.viewService.createOne({
        workspaceId,
        createViewInput: {
          name: viewName,
          objectMetadataId,
          icon,
          type,
          visibility: ViewVisibility.WORKSPACE,
        },
      });

      viewId = createdView.id;
    }

    const view = await this.viewService.findByIdWithRelations(viewId, workspaceId);

    if (!view) {
      throw new Error(`View not found after ensuring: ${viewName}`);
    }

    for (const filterGroup of filterGroups) {
      const matchingGroup = this.findMatchingFilterGroup(
        view.viewFilterGroups ?? [],
        view.viewFilters ?? [],
        filterGroup,
      );

      if (matchingGroup) {
        continue;
      }

      const createdFilterGroup = await this.viewFilterGroupService.createOne({
        workspaceId,
        createViewFilterGroupInput: {
          viewId: view.id,
          logicalOperator: filterGroup.logicalOperator,
        },
      });

      for (const filter of filterGroup.filters) {
        await this.viewFilterService.createOne({
          workspaceId,
          createViewFilterInput: {
            viewId: view.id,
            viewFilterGroupId: createdFilterGroup.id,
            fieldMetadataId: filter.fieldMetadataId,
            operand: filter.operand,
            value: filter.value,
          },
        });
      }
    }

    const viewAfterGroups =
      await this.viewService.findByIdWithRelations(view.id, workspaceId);

    if (!viewAfterGroups) {
      throw new Error(`View not found after seeding filter groups: ${viewName}`);
    }

    for (const filter of filters) {
      if (this.hasMatchingFilter(viewAfterGroups.viewFilters ?? [], filter)) {
        continue;
      }

      await this.viewFilterService.createOne({
        workspaceId,
        createViewFilterInput: {
          viewId: viewAfterGroups.id,
          fieldMetadataId: filter.fieldMetadataId,
          operand: filter.operand,
          value: filter.value,
        },
      });
    }

    const refreshedView =
      await this.viewService.findByIdWithRelations(viewAfterGroups.id, workspaceId);

    if (!refreshedView) {
      throw new Error(`View not found after seeding filters: ${viewName}`);
    }

    for (const sort of sorts) {
      if (this.hasMatchingSort(refreshedView.viewSorts ?? [], sort)) {
        continue;
      }

      await this.viewSortService.createOne({
        workspaceId,
        createViewSortInput: {
          viewId: refreshedView.id,
          fieldMetadataId: sort.fieldMetadataId,
          direction: sort.direction,
        },
      });
    }
  }

  private hasMatchingFilter(
    existingFilters: ViewFilterDTO[],
    candidate: {
      fieldMetadataId: string;
      operand: ViewFilterOperand;
      value: ViewFilterValue;
    },
  ): boolean {
    const normalizedCandidateValue = this.normalizeFilterValue(candidate.value);

    return existingFilters.some(
      (filter) =>
        filter.fieldMetadataId === candidate.fieldMetadataId &&
        filter.operand === candidate.operand &&
        this.normalizeFilterValue(filter.value) === normalizedCandidateValue,
    );
  }

  private findMatchingFilterGroup(
    existingFilterGroups: ViewFilterGroupDTO[],
    existingFilters: ViewFilterDTO[],
    candidate: {
      logicalOperator: ViewFilterGroupLogicalOperator;
      filters: Array<{
        fieldMetadataId: string;
        operand: ViewFilterOperand;
        value: ViewFilterValue;
      }>;
    },
  ): ViewFilterGroupDTO | null {
    const normalizedCandidateFilters = candidate.filters
      .map((filter) => this.getNormalizedFilterSignature(filter))
      .sort();

    return (
      existingFilterGroups.find((group) => {
        if (group.logicalOperator !== candidate.logicalOperator) {
          return false;
        }

        const groupFilters = existingFilters.filter(
          (filter) => filter.viewFilterGroupId === group.id,
        );

        if (groupFilters.length !== candidate.filters.length) {
          return false;
        }

        const normalizedGroupFilters = groupFilters
          .map((filter) => this.getNormalizedFilterSignature(filter))
          .sort();

        return (
          JSON.stringify(normalizedGroupFilters) ===
          JSON.stringify(normalizedCandidateFilters)
        );
      }) ?? null
    );
  }

  private hasMatchingSort(
    existingSorts: ViewSortDTO[],
    candidate: {
      fieldMetadataId: string;
      direction: ViewSortDirection;
    },
  ): boolean {
    return existingSorts.some(
      (sort) =>
        sort.fieldMetadataId === candidate.fieldMetadataId &&
        sort.direction === candidate.direction,
    );
  }

  private normalizeFilterValue(value: ViewFilterValue): string {
    if (typeof value === 'string') {
      return value;
    }

    return JSON.stringify(value);
  }

  private getNormalizedFilterSignature(filter: {
    fieldMetadataId: string;
    operand: ViewFilterOperand;
    value: ViewFilterValue;
  }): string {
    return JSON.stringify({
      fieldMetadataId: filter.fieldMetadataId,
      operand: filter.operand,
      value: this.normalizeFilterValue(filter.value),
    });
  }

  private findFieldIdByName({
    objectMetadataId,
    fieldName,
    flatObjectMetadataMaps,
    flatFieldMetadataMaps,
  }: {
    objectMetadataId: string;
    fieldName: string;
    flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
    flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
  }): string {
    const objectMetadata = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: objectMetadataId,
      flatEntityMaps: flatObjectMetadataMaps,
    });

    if (!objectMetadata) {
      throw new Error('Object metadata not found');
    }

    for (const fieldId of objectMetadata.fieldIds) {
      const field = findFlatEntityByIdInFlatEntityMaps({
        flatEntityId: fieldId,
        flatEntityMaps: flatFieldMetadataMaps,
      });

      if (field?.name === fieldName) {
        return fieldId;
      }
    }

    throw new Error(`Field not found on object: ${objectMetadataId}.${fieldName}`);
  }
}
