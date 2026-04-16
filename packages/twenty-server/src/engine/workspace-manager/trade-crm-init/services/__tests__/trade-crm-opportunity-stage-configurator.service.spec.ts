import { Test, type TestingModule } from '@nestjs/testing';

import { FieldMetadataType } from 'twenty-shared/types';

import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { TradeCrmOpportunityStageConfiguratorService } from 'src/engine/workspace-manager/trade-crm-init/services/trade-crm-opportunity-stage-configurator.service';

describe('TradeCrmOpportunityStageConfiguratorService', () => {
  let service: TradeCrmOpportunityStageConfiguratorService;
  let mockGetOrRecomputeManyOrAllFlatEntityMaps: jest.Mock;
  let mockUpdateOneField: jest.Mock;

  const workspaceId = 'workspace-id';
  const opportunityId = 'opportunity-id';
  const stageFieldId = 'stage-field-id';

  beforeEach(async () => {
    mockGetOrRecomputeManyOrAllFlatEntityMaps = jest.fn();
    mockUpdateOneField = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradeCrmOpportunityStageConfiguratorService,
        {
          provide: WorkspaceManyOrAllFlatEntityMapsCacheService,
          useValue: {
            getOrRecomputeManyOrAllFlatEntityMaps:
              mockGetOrRecomputeManyOrAllFlatEntityMaps,
          },
        },
        {
          provide: FieldMetadataService,
          useValue: {
            updateOneField: mockUpdateOneField,
          },
        },
      ],
    }).compile();

    service = module.get(TradeCrmOpportunityStageConfiguratorService);
  });

  it('should skip updating stage options when they already match trade crm defaults', async () => {
    mockGetOrRecomputeManyOrAllFlatEntityMaps.mockResolvedValue({
      flatObjectMetadataMaps: {
        byUniversalIdentifier: {
          opportunityUniversalId: {
            id: opportunityId,
            universalIdentifier: 'opportunityUniversalId',
            nameSingular: 'opportunity',
            fieldIds: [stageFieldId],
          },
        },
        universalIdentifierById: {
          [opportunityId]: 'opportunityUniversalId',
        },
        universalIdentifiersByApplicationId: {},
      },
      flatFieldMetadataMaps: {
        byUniversalIdentifier: {
          stageUniversalId: {
            id: stageFieldId,
            universalIdentifier: 'stageUniversalId',
            name: 'stage',
            type: FieldMetadataType.SELECT,
            options: [
              { value: 'NEW' },
              { value: 'REQUIREMENT_CONFIRMED' },
              { value: 'QUOTATION_SENT' },
              { value: 'WON' },
              { value: 'LOST' },
            ],
          },
        },
        universalIdentifierById: {
          [stageFieldId]: 'stageUniversalId',
        },
        universalIdentifiersByApplicationId: {},
      },
    });

    await service.configureOpportunityStageOptions(workspaceId);

    expect(mockUpdateOneField).not.toHaveBeenCalled();
  });

  it('should update stage options when current options do not match trade crm defaults', async () => {
    mockGetOrRecomputeManyOrAllFlatEntityMaps.mockResolvedValue({
      flatObjectMetadataMaps: {
        byUniversalIdentifier: {
          opportunityUniversalId: {
            id: opportunityId,
            universalIdentifier: 'opportunityUniversalId',
            nameSingular: 'opportunity',
            fieldIds: [stageFieldId],
          },
        },
        universalIdentifierById: {
          [opportunityId]: 'opportunityUniversalId',
        },
        universalIdentifiersByApplicationId: {},
      },
      flatFieldMetadataMaps: {
        byUniversalIdentifier: {
          stageUniversalId: {
            id: stageFieldId,
            universalIdentifier: 'stageUniversalId',
            name: 'stage',
            type: FieldMetadataType.SELECT,
            options: [{ value: 'OPEN' }],
          },
        },
        universalIdentifierById: {
          [stageFieldId]: 'stageUniversalId',
        },
        universalIdentifiersByApplicationId: {},
      },
    });

    await service.configureOpportunityStageOptions(workspaceId);

    expect(mockUpdateOneField).toHaveBeenCalledTimes(1);
    expect(mockUpdateOneField).toHaveBeenCalledWith({
      workspaceId,
      updateFieldInput: expect.objectContaining({
        id: stageFieldId,
        defaultValue: "'NEW'",
      }),
    });
  });
});
