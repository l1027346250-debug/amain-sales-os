import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const TRADE_CRM_TASK_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.TEXT,
    name: 'result',
    label: 'Result',
    description: 'Outcome recorded after task completion',
    icon: 'IconChecklist',
    isActive: true,
    isNullable: true,
    isUnique: false,
  },
];

