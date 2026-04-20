import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { Repository } from 'typeorm';

import { DataSourceService } from 'src/engine/metadata-modules/data-source/data-source.service';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { buildObjectIdByNameMaps } from 'src/engine/metadata-modules/flat-object-metadata/utils/build-object-id-by-name-maps.util';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';
import { type ObjectMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/object-metadata-seed.type';
import { TRADE_CRM_COMPANY_FIELD_SEEDS } from 'src/engine/workspace-manager/trade-crm-metadata/constants/trade-crm-company-field-seeds.constant';
import { TRADE_CRM_LEAD_FIELD_SEEDS } from 'src/engine/workspace-manager/trade-crm-metadata/constants/trade-crm-lead-field-seeds.constant';
import { TRADE_CRM_LEAD_OBJECT_SEED } from 'src/engine/workspace-manager/trade-crm-metadata/constants/trade-crm-lead-object-seed.constant';
import { TRADE_CRM_OPPORTUNITY_FIELD_SEEDS } from 'src/engine/workspace-manager/trade-crm-metadata/constants/trade-crm-opportunity-field-seeds.constant';
import { TRADE_CRM_PERSON_FIELD_SEEDS } from 'src/engine/workspace-manager/trade-crm-metadata/constants/trade-crm-person-field-seeds.constant';
import { TRADE_CRM_TASK_FIELD_SEEDS } from 'src/engine/workspace-manager/trade-crm-metadata/constants/trade-crm-task-field-seeds.constant';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

@Injectable()
export class TradeCrmWorkspaceInitializerService {
  private readonly logger = new Logger(TradeCrmWorkspaceInitializerService.name);

  constructor(
    private readonly dataSourceService: DataSourceService,
    private readonly objectMetadataService: ObjectMetadataService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
    @InjectRepository(ObjectMetadataEntity)
    private readonly objectMetadataRepository: Repository<ObjectMetadataEntity>,
  ) {}

  async initializeWorkspace(workspaceId: string): Promise<void> {
    const dataSourceMetadata =
      (await this.dataSourceService.getLastDataSourceMetadataFromWorkspaceId(
        workspaceId,
      )) ??
      (await this.dataSourceService.createDataSourceMetadata(
        workspaceId,
        getWorkspaceSchemaName(workspaceId),
      ));

    // 1) Lead custom object + fields
    const leadObjectMetadata = await this.ensureCustomObject({
      workspaceId,
      dataSourceId: dataSourceMetadata.id,
      objectSeed: TRADE_CRM_LEAD_OBJECT_SEED,
    });

    await this.ensureCustomFields({
      workspaceId,
      objectNameSingular: TRADE_CRM_LEAD_OBJECT_SEED.nameSingular,
      fieldSeeds: TRADE_CRM_LEAD_FIELD_SEEDS,
    });

    if (TRADE_CRM_LEAD_OBJECT_SEED.labelIdentifierFieldName) {
      await this.ensureLabelIdentifierField({
        workspaceId,
        objectMetadataId: leadObjectMetadata.id,
        objectNameSingular: TRADE_CRM_LEAD_OBJECT_SEED.nameSingular,
        fieldName: TRADE_CRM_LEAD_OBJECT_SEED.labelIdentifierFieldName,
      });
    }

    // 2) Standard objects: only add missing trade CRM fields
    await this.ensureCustomFields({
      workspaceId,
      objectNameSingular: 'company',
      fieldSeeds: TRADE_CRM_COMPANY_FIELD_SEEDS,
    });

    await this.ensureCustomFields({
      workspaceId,
      objectNameSingular: 'person',
      fieldSeeds: TRADE_CRM_PERSON_FIELD_SEEDS,
    });

    await this.ensureCustomFields({
      workspaceId,
      objectNameSingular: 'opportunity',
      fieldSeeds: TRADE_CRM_OPPORTUNITY_FIELD_SEEDS,
    });

    await this.ensureCustomFields({
      workspaceId,
      objectNameSingular: 'task',
      fieldSeeds: TRADE_CRM_TASK_FIELD_SEEDS,
    });

    this.logger.log(`Trade CRM init completed for workspace ${workspaceId}`);
  }

  private async ensureCustomObject({
    workspaceId,
    dataSourceId,
    objectSeed,
  }: {
    workspaceId: string;
    dataSourceId: string;
    objectSeed: ObjectMetadataSeed;
  }): Promise<{ id: string }> {
    const existing = await this.objectMetadataService.findOneWithinWorkspace(
      workspaceId,
      {
        where: { nameSingular: objectSeed.nameSingular },
      },
    );

    if (existing) {
      return existing;
    }

    const { labelIdentifierFieldName: _labelIdentifierFieldName, ...createInput } =
      objectSeed;

    await this.flatEntityMapsCacheService.invalidateFlatEntityMaps({
      workspaceId,
      flatMapsKeys: ['flatObjectMetadataMaps'],
    });

    return this.objectMetadataService.createOneObject({
      workspaceId,
      createObjectInput: {
        ...createInput,
        dataSourceId,
      },
    });
  }

  private async ensureCustomFields({
    workspaceId,
    objectNameSingular,
    fieldSeeds,
  }: {
    workspaceId: string;
    objectNameSingular: string;
    fieldSeeds: FieldMetadataSeed[];
  }): Promise<void> {
    const objectMetadata = await this.objectMetadataService.findOneWithinWorkspace(
      workspaceId,
      {
        where: { nameSingular: objectNameSingular },
      },
    );

    if (!isDefined(objectMetadata)) {
      throw new Error(`Object metadata not found for: ${objectNameSingular}`);
    }

    const flatMaps = await this.getFreshFlatMaps(workspaceId);
    const objectIdByNameSingular = buildObjectIdByNameMaps(
      flatMaps.flatObjectMetadataMaps,
    ).idByNameSingular;

    const existingFieldNames = this.getExistingFieldNamesOnObject({
      objectMetadataId: objectMetadata.id,
      flatObjectMetadataMaps: flatMaps.flatObjectMetadataMaps,
      flatFieldMetadataMaps: flatMaps.flatFieldMetadataMaps,
    });

    const createFieldInputs = fieldSeeds
      .filter((seed) => !existingFieldNames.has(seed.name))
      .map((seed) => this.toCreateFieldInput(seed, objectMetadata.id, objectIdByNameSingular));

    if (createFieldInputs.length === 0) {
      return;
    }

    await this.fieldMetadataService.createManyFields({
      workspaceId,
      createFieldInputs,
    });
  }

  private toCreateFieldInput(
    seed: FieldMetadataSeed,
    objectMetadataId: string,
    objectIdByNameSingular: Record<string, string>,
  ) {
    const {
      targetObjectMetadataNameSingular,
      relationCreationPayload,
      ...rest
    } = seed;

    if (targetObjectMetadataNameSingular && relationCreationPayload) {
      const targetObjectMetadataId =
        objectIdByNameSingular[targetObjectMetadataNameSingular];

      if (!isDefined(targetObjectMetadataId)) {
        throw new Error(
          `Target object metadata not found for: ${targetObjectMetadataNameSingular}`,
        );
      }

      return {
        ...rest,
        objectMetadataId,
        relationCreationPayload: {
          ...relationCreationPayload,
          targetObjectMetadataId,
        },
      };
    }

    return {
      ...rest,
      objectMetadataId,
      relationCreationPayload,
    };
  }

  private async ensureLabelIdentifierField({
    workspaceId,
    objectMetadataId,
    objectNameSingular,
    fieldName,
  }: {
    workspaceId: string;
    objectMetadataId: string;
    objectNameSingular: string;
    fieldName: string;
  }): Promise<void> {
    const flatMaps = await this.getFreshFlatMaps(workspaceId);

    const flatObjectMetadata = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: objectMetadataId,
      flatEntityMaps: flatMaps.flatObjectMetadataMaps,
    });

    if (!flatObjectMetadata) {
      return;
    }

    const objectIdByNameSingular = buildObjectIdByNameMaps(
      flatMaps.flatObjectMetadataMaps,
    ).idByNameSingular;

    const fieldId = this.findFieldId({
      objectNameSingular,
      fieldName,
      objectIdByNameSingular,
      flatObjectMetadataMaps: flatMaps.flatObjectMetadataMaps,
      flatFieldMetadataMaps: flatMaps.flatFieldMetadataMaps,
    });

    if (flatObjectMetadata.labelIdentifierFieldMetadataId === fieldId) {
      return;
    }

    await this.objectMetadataService.updateOneObject({
      workspaceId,
      updateObjectInput: {
        id: objectMetadataId,
        update: {
          labelIdentifierFieldMetadataId: fieldId,
        },
      },
    });

    const persistedObjectMetadata = await this.objectMetadataRepository.findOne({
      where: {
        id: objectMetadataId,
        workspaceId,
      },
      select: {
        id: true,
        labelIdentifierFieldMetadataId: true,
      },
    });

    if (persistedObjectMetadata?.labelIdentifierFieldMetadataId === fieldId) {
      return;
    }

    await this.objectMetadataRepository.update(objectMetadataId, {
      labelIdentifierFieldMetadataId: fieldId,
    });

    await this.flatEntityMapsCacheService.invalidateFlatEntityMaps({
      workspaceId,
      flatMapsKeys: [
        'flatObjectMetadataMaps',
        'flatFieldMetadataMaps',
        'flatViewFieldMaps',
      ],
    });
  }

  private async getFreshFlatMaps(workspaceId: string): Promise<{
    flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
    flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
  }> {
    await this.flatEntityMapsCacheService.invalidateFlatEntityMaps({
      workspaceId,
      flatMapsKeys: ['flatObjectMetadataMaps', 'flatFieldMetadataMaps'],
    });

    return this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
      {
        workspaceId,
        flatMapsKeys: ['flatObjectMetadataMaps', 'flatFieldMetadataMaps'],
      },
    );
  }

  private getExistingFieldNamesOnObject({
    objectMetadataId,
    flatObjectMetadataMaps,
    flatFieldMetadataMaps,
  }: {
    objectMetadataId: string;
    flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
    flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
  }): Set<string> {
    const objectMetadata = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: objectMetadataId,
      flatEntityMaps: flatObjectMetadataMaps,
    });

    const names = new Set<string>();
    if (!objectMetadata) {
      return names;
    }

    for (const fieldId of objectMetadata.fieldIds) {
      const field = findFlatEntityByIdInFlatEntityMaps({
        flatEntityId: fieldId,
        flatEntityMaps: flatFieldMetadataMaps,
      });

      if (field?.name) {
        names.add(field.name);
      }
    }

    return names;
  }

  private findFieldId({
    objectNameSingular,
    fieldName,
    objectIdByNameSingular,
    flatObjectMetadataMaps,
    flatFieldMetadataMaps,
  }: {
    objectNameSingular: string;
    fieldName: string;
    objectIdByNameSingular: Record<string, string>;
    flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
    flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
  }): string {
    const objectId = objectIdByNameSingular[objectNameSingular];

    if (!isDefined(objectId)) {
      throw new Error(`Object not found: ${objectNameSingular}`);
    }

    const objectMetadata = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: objectId,
      flatEntityMaps: flatObjectMetadataMaps,
    });

    if (!isDefined(objectMetadata)) {
      throw new Error(`Object metadata not found: ${objectNameSingular}`);
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

    throw new Error(`Field not found: ${objectNameSingular}.${fieldName}`);
  }
}
