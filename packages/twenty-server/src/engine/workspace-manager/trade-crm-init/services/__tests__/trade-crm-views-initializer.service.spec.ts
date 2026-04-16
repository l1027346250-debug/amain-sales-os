import { Test, type TestingModule } from '@nestjs/testing';

import {
  ViewFilterGroupLogicalOperator,
  ViewFilterOperand,
  ViewType,
  ViewVisibility,
} from 'twenty-shared/types';

import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { ViewFilterService } from 'src/engine/metadata-modules/view-filter/services/view-filter.service';
import { ViewFilterGroupService } from 'src/engine/metadata-modules/view-filter-group/services/view-filter-group.service';
import { ViewSortDirection } from 'src/engine/metadata-modules/view-sort/enums/view-sort-direction';
import { ViewSortService } from 'src/engine/metadata-modules/view-sort/services/view-sort.service';
import { ViewService } from 'src/engine/metadata-modules/view/services/view.service';
import { TradeCrmViewsInitializerService } from 'src/engine/workspace-manager/trade-crm-init/services/trade-crm-views-initializer.service';

describe('TradeCrmViewsInitializerService', () => {
  let service: TradeCrmViewsInitializerService;
  let mockInvalidateFlatEntityMaps: jest.Mock;
  let mockGetOrRecomputeManyOrAllFlatEntityMaps: jest.Mock;
  let mockCreateOne: jest.Mock;
  let mockFindByIdWithRelations: jest.Mock;
  let mockCreateFilterGroupOne: jest.Mock;
  let mockCreateFilterOne: jest.Mock;
  let mockCreateSortOne: jest.Mock;

  const workspaceId = 'workspace-id';
  const leadId = 'lead-id';
  const opportunityId = 'opportunity-id';
  const taskId = 'task-id';
  const leadStatusFieldId = 'lead-status-field-id';
  const stageFieldId = 'stage-field-id';
  const leadCreatedAtFieldId = 'lead-created-at-field-id';
  const taskAssigneeFieldId = 'task-assignee-field-id';
  const taskDueAtFieldId = 'task-due-at-field-id';
  const taskStatusFieldId = 'task-status-field-id';
  const opportunityOwnerFieldId = 'opportunity-owner-field-id';
  const opportunityNextActionFieldId = 'opportunity-next-action-field-id';
  const opportunityNextActionDateFieldId =
    'opportunity-next-action-date-field-id';
  const opportunityUpdatedAtFieldId = 'opportunity-updated-at-field-id';

  const makeViewWithRelations = (id: string) => ({
    id,
    viewFilters: [],
    viewFilterGroups: [],
    viewSorts: [],
  });

  beforeEach(async () => {
    mockInvalidateFlatEntityMaps = jest.fn();
    mockGetOrRecomputeManyOrAllFlatEntityMaps = jest.fn();
    mockCreateOne = jest.fn();
    mockFindByIdWithRelations = jest.fn();
    mockCreateFilterGroupOne = jest.fn();
    mockCreateFilterOne = jest.fn();
    mockCreateSortOne = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradeCrmViewsInitializerService,
        {
          provide: WorkspaceManyOrAllFlatEntityMapsCacheService,
          useValue: {
            invalidateFlatEntityMaps: mockInvalidateFlatEntityMaps,
            getOrRecomputeManyOrAllFlatEntityMaps:
              mockGetOrRecomputeManyOrAllFlatEntityMaps,
          },
        },
        {
          provide: ViewService,
          useValue: {
            createOne: mockCreateOne,
            findByIdWithRelations: mockFindByIdWithRelations,
          },
        },
        {
          provide: ViewFilterGroupService,
          useValue: {
            createOne: mockCreateFilterGroupOne,
          },
        },
        {
          provide: ViewFilterService,
          useValue: {
            createOne: mockCreateFilterOne,
          },
        },
        {
          provide: ViewSortService,
          useValue: {
            createOne: mockCreateSortOne,
          },
        },
      ],
    }).compile();

    service = module.get(TradeCrmViewsInitializerService);
  });

  it('should invalidate cache and create trade crm views when missing', async () => {
    mockGetOrRecomputeManyOrAllFlatEntityMaps.mockResolvedValue({
      flatObjectMetadataMaps: {
        byUniversalIdentifier: {
          leadUid: {
            id: leadId,
            universalIdentifier: 'leadUid',
            nameSingular: 'lead',
            fieldIds: [leadStatusFieldId, leadCreatedAtFieldId],
          },
          opportunityUid: {
            id: opportunityId,
            universalIdentifier: 'opportunityUid',
            nameSingular: 'opportunity',
            fieldIds: [
              stageFieldId,
              opportunityOwnerFieldId,
              opportunityNextActionFieldId,
              opportunityNextActionDateFieldId,
              opportunityUpdatedAtFieldId,
            ],
          },
          taskUid: {
            id: taskId,
            universalIdentifier: 'taskUid',
            nameSingular: 'task',
            fieldIds: [taskAssigneeFieldId, taskDueAtFieldId, taskStatusFieldId],
          },
        },
        universalIdentifierById: {
          [leadId]: 'leadUid',
          [opportunityId]: 'opportunityUid',
          [taskId]: 'taskUid',
        },
        universalIdentifiersByApplicationId: {},
      },
      flatFieldMetadataMaps: {
        byUniversalIdentifier: {
          leadStatusUid: {
            id: leadStatusFieldId,
            universalIdentifier: 'leadStatusUid',
            name: 'leadStatus',
          },
          leadCreatedAtUid: {
            id: leadCreatedAtFieldId,
            universalIdentifier: 'leadCreatedAtUid',
            name: 'createdAt',
          },
          stageUid: {
            id: stageFieldId,
            universalIdentifier: 'stageUid',
            name: 'stage',
          },
          taskAssigneeUid: {
            id: taskAssigneeFieldId,
            universalIdentifier: 'taskAssigneeUid',
            name: 'assignee',
          },
          taskDueAtUid: {
            id: taskDueAtFieldId,
            universalIdentifier: 'taskDueAtUid',
            name: 'dueAt',
          },
          taskStatusUid: {
            id: taskStatusFieldId,
            universalIdentifier: 'taskStatusUid',
            name: 'status',
          },
          opportunityOwnerUid: {
            id: opportunityOwnerFieldId,
            universalIdentifier: 'opportunityOwnerUid',
            name: 'owner',
          },
          opportunityNextActionUid: {
            id: opportunityNextActionFieldId,
            universalIdentifier: 'opportunityNextActionUid',
            name: 'nextAction',
          },
          opportunityNextActionDateUid: {
            id: opportunityNextActionDateFieldId,
            universalIdentifier: 'opportunityNextActionDateUid',
            name: 'nextActionDate',
          },
          opportunityUpdatedAtUid: {
            id: opportunityUpdatedAtFieldId,
            universalIdentifier: 'opportunityUpdatedAtUid',
            name: 'updatedAt',
          },
        },
        universalIdentifierById: {
          [leadStatusFieldId]: 'leadStatusUid',
          [leadCreatedAtFieldId]: 'leadCreatedAtUid',
          [stageFieldId]: 'stageUid',
          [taskAssigneeFieldId]: 'taskAssigneeUid',
          [taskDueAtFieldId]: 'taskDueAtUid',
          [taskStatusFieldId]: 'taskStatusUid',
          [opportunityOwnerFieldId]: 'opportunityOwnerUid',
          [opportunityNextActionFieldId]: 'opportunityNextActionUid',
          [opportunityNextActionDateFieldId]: 'opportunityNextActionDateUid',
          [opportunityUpdatedAtFieldId]: 'opportunityUpdatedAtUid',
        },
        universalIdentifiersByApplicationId: {},
      },
      flatViewMaps: {
        byUniversalIdentifier: {},
        universalIdentifierById: {},
        universalIdentifiersByApplicationId: {},
      },
    });

    mockCreateOne
      .mockResolvedValueOnce({ id: 'lead-view-id' })
      .mockResolvedValueOnce({ id: 'today-new-leads-view-id' })
      .mockResolvedValueOnce({ id: 'pipeline-view-id' })
      .mockResolvedValueOnce({ id: 'pipeline-next-action-view-id' })
      .mockResolvedValueOnce({ id: 'tasks-view-id' })
      .mockResolvedValueOnce({ id: 'tasks-due-today-view-id' });

    mockCreateFilterGroupOne.mockResolvedValue({
      id: 'pipeline-next-action-filter-group-id',
    });

    mockFindByIdWithRelations.mockImplementation(async (id: string) =>
      makeViewWithRelations(id),
    );

    await service.initializeViews(workspaceId);

    expect(mockInvalidateFlatEntityMaps).toHaveBeenCalledWith({
      workspaceId,
      flatMapsKeys: [
        'flatObjectMetadataMaps',
        'flatFieldMetadataMaps',
        'flatViewMaps',
      ],
    });

    expect(mockCreateOne).toHaveBeenCalledTimes(6);
    expect(mockCreateOne).toHaveBeenNthCalledWith(1, {
      workspaceId,
      createViewInput: {
        name: 'Leads (Trade CRM)',
        objectMetadataId: leadId,
        icon: 'IconTargetArrow',
        type: ViewType.TABLE,
        visibility: ViewVisibility.WORKSPACE,
        mainGroupByFieldMetadataId: leadStatusFieldId,
      },
    });
    expect(mockCreateOne).toHaveBeenNthCalledWith(2, {
      workspaceId,
      createViewInput: {
        name: 'Today New Leads',
        objectMetadataId: leadId,
        icon: 'IconClockHour4',
        type: ViewType.TABLE,
        visibility: ViewVisibility.WORKSPACE,
      },
    });
    expect(mockCreateOne).toHaveBeenNthCalledWith(3, {
      workspaceId,
      createViewInput: {
        name: 'Pipeline (Trade CRM)',
        objectMetadataId: opportunityId,
        icon: 'IconProgressCheck',
        type: ViewType.KANBAN,
        visibility: ViewVisibility.WORKSPACE,
        mainGroupByFieldMetadataId: stageFieldId,
      },
    });
    expect(mockCreateOne).toHaveBeenNthCalledWith(4, {
      workspaceId,
      createViewInput: {
        name: 'Pipeline Needs Next Action',
        objectMetadataId: opportunityId,
        icon: 'IconAlertCircle',
        type: ViewType.TABLE,
        visibility: ViewVisibility.WORKSPACE,
      },
    });
    expect(mockCreateOne).toHaveBeenNthCalledWith(5, {
      workspaceId,
      createViewInput: {
        name: 'Tasks (Trade CRM)',
        objectMetadataId: taskId,
        icon: 'IconChecklist',
        type: ViewType.TABLE,
        visibility: ViewVisibility.WORKSPACE,
      },
    });
    expect(mockCreateOne).toHaveBeenNthCalledWith(6, {
      workspaceId,
      createViewInput: {
        name: 'Tasks Due Today',
        objectMetadataId: taskId,
        icon: 'IconCalendarDue',
        type: ViewType.TABLE,
        visibility: ViewVisibility.WORKSPACE,
      },
    });

    expect(mockCreateFilterGroupOne).toHaveBeenCalledTimes(1);
    expect(mockCreateFilterOne).toHaveBeenCalledTimes(9);
    expect(mockCreateSortOne).toHaveBeenCalledTimes(3);
    expect(mockCreateFilterGroupOne).toHaveBeenCalledWith({
      workspaceId,
      createViewFilterGroupInput: {
        viewId: 'pipeline-next-action-view-id',
        logicalOperator: ViewFilterGroupLogicalOperator.OR,
      },
    });
    expect(mockCreateFilterOne).toHaveBeenCalledWith({
      workspaceId,
      createViewFilterInput: {
        viewId: 'today-new-leads-view-id',
        fieldMetadataId: leadCreatedAtFieldId,
        operand: ViewFilterOperand.IS_TODAY,
        value: '',
      },
    });
    expect(mockCreateSortOne).toHaveBeenCalledWith({
      workspaceId,
      createViewSortInput: {
        viewId: 'today-new-leads-view-id',
        fieldMetadataId: leadCreatedAtFieldId,
        direction: ViewSortDirection.DESC,
      },
    });
    expect(mockCreateFilterOne).toHaveBeenCalledWith({
      workspaceId,
      createViewFilterInput: {
        viewId: 'pipeline-next-action-view-id',
        viewFilterGroupId: 'pipeline-next-action-filter-group-id',
        fieldMetadataId: opportunityNextActionFieldId,
        operand: ViewFilterOperand.IS_EMPTY,
        value: '',
      },
    });
    expect(mockCreateFilterOne).toHaveBeenCalledWith({
      workspaceId,
      createViewFilterInput: {
        viewId: 'pipeline-next-action-view-id',
        viewFilterGroupId: 'pipeline-next-action-filter-group-id',
        fieldMetadataId: opportunityNextActionDateFieldId,
        operand: ViewFilterOperand.IS_EMPTY,
        value: '',
      },
    });
  });

  it('should not create duplicate queue views, filters, or sorts that already exist', async () => {
    mockGetOrRecomputeManyOrAllFlatEntityMaps.mockResolvedValue({
      flatObjectMetadataMaps: {
        byUniversalIdentifier: {
          leadUid: {
            id: leadId,
            universalIdentifier: 'leadUid',
            nameSingular: 'lead',
            fieldIds: [leadStatusFieldId, leadCreatedAtFieldId],
          },
        },
        universalIdentifierById: {
          [leadId]: 'leadUid',
        },
        universalIdentifiersByApplicationId: {},
      },
      flatFieldMetadataMaps: {
        byUniversalIdentifier: {
          leadStatusUid: {
            id: leadStatusFieldId,
            universalIdentifier: 'leadStatusUid',
            name: 'leadStatus',
          },
          leadCreatedAtUid: {
            id: leadCreatedAtFieldId,
            universalIdentifier: 'leadCreatedAtUid',
            name: 'createdAt',
          },
        },
        universalIdentifierById: {
          [leadStatusFieldId]: 'leadStatusUid',
          [leadCreatedAtFieldId]: 'leadCreatedAtUid',
        },
        universalIdentifiersByApplicationId: {},
      },
      flatViewMaps: {
        byUniversalIdentifier: {
          existingLeadView: {
            id: 'view-id',
            universalIdentifier: 'existingLeadView',
            name: 'Leads (Trade CRM)',
            objectMetadataId: leadId,
            deletedAt: null,
          },
          existingTodayLeadView: {
            id: 'today-view-id',
            universalIdentifier: 'existingTodayLeadView',
            name: 'Today New Leads',
            objectMetadataId: leadId,
            deletedAt: null,
          },
        },
        universalIdentifierById: {
          'view-id': 'existingLeadView',
          'today-view-id': 'existingTodayLeadView',
        },
        universalIdentifiersByApplicationId: {},
      },
    });

    mockFindByIdWithRelations.mockResolvedValue({
      id: 'today-view-id',
      viewFilters: [
        {
          fieldMetadataId: leadCreatedAtFieldId,
          operand: ViewFilterOperand.IS_TODAY,
          value: '',
        },
      ],
      viewFilterGroups: [],
      viewSorts: [
        {
          fieldMetadataId: leadCreatedAtFieldId,
          direction: ViewSortDirection.DESC,
        },
      ],
    });

    await service.initializeViews(workspaceId);

    expect(mockCreateOne).not.toHaveBeenCalled();
    expect(mockCreateFilterGroupOne).not.toHaveBeenCalled();
    expect(mockCreateFilterOne).not.toHaveBeenCalled();
    expect(mockCreateSortOne).not.toHaveBeenCalled();
  });
});
