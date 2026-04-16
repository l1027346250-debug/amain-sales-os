import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { DataSourceService } from 'src/engine/metadata-modules/data-source/data-source.service';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { TradeCrmWorkspaceInitializerService } from 'src/engine/workspace-manager/trade-crm-init/services/trade-crm-workspace-initializer.service';

describe('TradeCrmWorkspaceInitializerService', () => {
  let service: TradeCrmWorkspaceInitializerService;
  let mockInvalidateFlatEntityMaps: jest.Mock;
  let mockGetOrRecomputeManyOrAllFlatEntityMaps: jest.Mock;
  let mockUpdateOneObject: jest.Mock;
  let mockRepositoryFindOne: jest.Mock;
  let mockRepositoryUpdate: jest.Mock;

  const workspaceId = 'workspace-id';
  const leadObjectId = 'lead-object-id';
  const idFieldId = 'id-field-id';
  const leadNameFieldId = 'lead-name-field-id';

  beforeEach(async () => {
    mockInvalidateFlatEntityMaps = jest.fn();
    mockGetOrRecomputeManyOrAllFlatEntityMaps = jest.fn();
    mockUpdateOneObject = jest.fn();
    mockRepositoryFindOne = jest.fn();
    mockRepositoryUpdate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradeCrmWorkspaceInitializerService,
        {
          provide: DataSourceService,
          useValue: {},
        },
        {
          provide: ObjectMetadataService,
          useValue: {
            updateOneObject: mockUpdateOneObject,
          },
        },
        {
          provide: FieldMetadataService,
          useValue: {},
        },
        {
          provide: WorkspaceManyOrAllFlatEntityMapsCacheService,
          useValue: {
            invalidateFlatEntityMaps: mockInvalidateFlatEntityMaps,
            getOrRecomputeManyOrAllFlatEntityMaps:
              mockGetOrRecomputeManyOrAllFlatEntityMaps,
          },
        },
        {
          provide: getRepositoryToken(ObjectMetadataEntity),
          useValue: {
            findOne: mockRepositoryFindOne,
            update: mockRepositoryUpdate,
          },
        },
      ],
    }).compile();

    service = module.get(TradeCrmWorkspaceInitializerService);
  });

  it('should persist label identifier fallback when object metadata update does not stick', async () => {
    mockGetOrRecomputeManyOrAllFlatEntityMaps.mockResolvedValue({
      flatObjectMetadataMaps: {
        byUniversalIdentifier: {
          leadUid: {
            id: leadObjectId,
            universalIdentifier: 'leadUid',
            nameSingular: 'lead',
            fieldIds: [idFieldId, leadNameFieldId],
            labelIdentifierFieldMetadataId: idFieldId,
          },
        },
        universalIdentifierById: {
          [leadObjectId]: 'leadUid',
        },
        universalIdentifiersByApplicationId: {},
      },
      flatFieldMetadataMaps: {
        byUniversalIdentifier: {
          idUid: {
            id: idFieldId,
            universalIdentifier: 'idUid',
            name: 'id',
          },
          leadNameUid: {
            id: leadNameFieldId,
            universalIdentifier: 'leadNameUid',
            name: 'leadName',
          },
        },
        universalIdentifierById: {
          [idFieldId]: 'idUid',
          [leadNameFieldId]: 'leadNameUid',
        },
        universalIdentifiersByApplicationId: {},
      },
    });

    mockRepositoryFindOne.mockResolvedValue({
      id: leadObjectId,
      labelIdentifierFieldMetadataId: idFieldId,
    });

    await (service as any).ensureLabelIdentifierField({
      workspaceId,
      objectMetadataId: leadObjectId,
      objectNameSingular: 'lead',
      fieldName: 'leadName',
    });

    expect(mockUpdateOneObject).toHaveBeenCalledWith({
      workspaceId,
      updateObjectInput: {
        id: leadObjectId,
        update: {
          labelIdentifierFieldMetadataId: leadNameFieldId,
        },
      },
    });

    expect(mockRepositoryUpdate).toHaveBeenCalledWith(leadObjectId, {
      labelIdentifierFieldMetadataId: leadNameFieldId,
    });

    expect(mockInvalidateFlatEntityMaps).toHaveBeenLastCalledWith({
      workspaceId,
      flatMapsKeys: [
        'flatObjectMetadataMaps',
        'flatFieldMetadataMaps',
        'flatViewFieldMaps',
      ],
    });
  });
});
