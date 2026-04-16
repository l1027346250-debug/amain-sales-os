import { Injectable, Logger } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { buildObjectIdByNameMaps } from 'src/engine/metadata-modules/flat-object-metadata/utils/build-object-id-by-name-maps.util';

const TRADE_OPPORTUNITY_STAGE_OPTIONS = [
  {
    id: 'b8d7d28e-02be-4c48-8f92-7c71c0a76b7f',
    value: 'NEW',
    label: 'New',
    position: 0,
    color: 'blue',
  },
  {
    id: 'b95d8cd2-5418-4c15-aad9-1f7f1f6aa6f9',
    value: 'REQUIREMENT_CONFIRMED',
    label: 'Requirement Confirmed',
    position: 1,
    color: 'sky',
  },
  {
    id: 'd20f7bd9-a1d6-427c-9b9b-109da2cf0f3b',
    value: 'QUOTATION_SENT',
    label: 'Quotation Sent',
    position: 2,
    color: 'yellow',
  },
  {
    id: '51d29c35-e647-40ad-97c2-a6b8551a9f5e',
    value: 'STALLED',
    label: 'Stalled',
    position: 3,
    color: 'orange',
  },
  {
    id: 'a69f62c5-27f8-49b8-9cbb-43dff9a3f13d',
    value: 'WON',
    label: 'Won',
    position: 4,
    color: 'green',
  },
  {
    id: '4c4f7b3f-95ae-4b64-9bc4-9f9f2d7f2f02',
    value: 'LOST',
    label: 'Lost',
    position: 5,
    color: 'red',
  },
];

@Injectable()
export class TradeCrmOpportunityStageConfiguratorService {
  private readonly logger = new Logger(
    TradeCrmOpportunityStageConfiguratorService.name,
  );

  constructor(
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
  ) {}

  async configureOpportunityStageOptions(workspaceId: string): Promise<void> {
    const { flatFieldMetadataMaps, flatObjectMetadataMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatFieldMetadataMaps', 'flatObjectMetadataMaps'],
        },
      );

    const { idByNameSingular } = buildObjectIdByNameMaps(flatObjectMetadataMaps);
    const opportunityObjectId = idByNameSingular['opportunity'];

    if (!isDefined(opportunityObjectId)) {
      throw new Error('Opportunity object metadata not found');
    }

    const opportunityObject = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: opportunityObjectId,
      flatEntityMaps: flatObjectMetadataMaps,
    });

    if (!opportunityObject) {
      throw new Error('Opportunity object metadata not found');
    }

    const stageFieldId = this.findFieldIdByName({
      objectMetadata: opportunityObject,
      flatFieldMetadataMaps,
      fieldName: 'stage',
    });

    const stageField = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: stageFieldId,
      flatEntityMaps: flatFieldMetadataMaps,
    });

    if (!stageField) {
      throw new Error('Opportunity.stage field not found');
    }

    const currentValues = Array.isArray(stageField.options)
      ? new Set(stageField.options.map((o: any) => o?.value).filter(Boolean))
      : new Set<string>();

    const desiredValues = new Set(
      TRADE_OPPORTUNITY_STAGE_OPTIONS.map((o) => o.value),
    );

    // If it already matches, keep as-is (idempotent).
    const matches =
      currentValues.size === desiredValues.size &&
      Array.from(desiredValues).every((v) => currentValues.has(v));

    if (matches) {
      this.logger.log(
        `Opportunity.stage options already configured for workspace ${workspaceId}`,
      );
      return;
    }

    await this.fieldMetadataService.updateOneField({
      workspaceId,
      updateFieldInput: {
        id: stageFieldId,
        options: TRADE_OPPORTUNITY_STAGE_OPTIONS,
        defaultValue: "'NEW'",
      },
    });

    this.logger.log(
      `Configured Opportunity.stage options for workspace ${workspaceId}`,
    );
  }

  private findFieldIdByName({
    objectMetadata,
    flatFieldMetadataMaps,
    fieldName,
  }: {
    objectMetadata: FlatObjectMetadata;
    flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
    fieldName: string;
  }): string {
    for (const fieldId of objectMetadata.fieldIds) {
      const field = findFlatEntityByIdInFlatEntityMaps({
        flatEntityId: fieldId,
        flatEntityMaps: flatFieldMetadataMaps,
      });

      if (field?.name === fieldName) {
        return fieldId;
      }
    }

    throw new Error(`Field not found: opportunity.${fieldName}`);
  }
}
