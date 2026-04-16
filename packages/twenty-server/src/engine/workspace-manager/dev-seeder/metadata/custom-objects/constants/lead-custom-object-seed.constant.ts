import { type ObjectMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/object-metadata-seed.type';

export const LEAD_CUSTOM_OBJECT_SEED: ObjectMetadataSeed = {
  labelPlural: 'Leads',
  labelSingular: 'Lead',
  namePlural: 'leads',
  nameSingular: 'lead',
  icon: 'IconTargetArrow',
  description: 'Inbound trade leads for qualification and follow-up',
  isRemote: false,
  skipNameField: true,
  labelIdentifierFieldName: 'lead_name',
};
