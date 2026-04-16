import { FieldMetadataType, RelationType } from 'twenty-shared/types';

import {
  TRADE_CRM_COUNTRY_OPTIONS,
  TRADE_CRM_CUSTOMER_TYPE_OPTIONS,
  TRADE_CRM_INDUSTRY_OPTIONS,
} from 'src/engine/workspace-manager/trade-crm-metadata/constants/trade-crm-select-options.constant';
import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const TRADE_CRM_COMPANY_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.SELECT,
    name: 'country',
    label: 'Country',
    description: "Company's main market country",
    icon: 'IconWorld',
    isActive: true,
    isNullable: true,
    isUnique: false,
    options: TRADE_CRM_COUNTRY_OPTIONS,
  },
  {
    type: FieldMetadataType.SELECT,
    name: 'customerType',
    label: 'Customer Type',
    description: "Company's customer type",
    icon: 'IconUsersGroup',
    isActive: true,
    isNullable: true,
    isUnique: false,
    options: TRADE_CRM_CUSTOMER_TYPE_OPTIONS,
  },
  {
    type: FieldMetadataType.SELECT,
    name: 'industry',
    label: 'Industry',
    description: "Company's industry segment",
    icon: 'IconBriefcase',
    isActive: true,
    isNullable: true,
    isUnique: false,
    options: TRADE_CRM_INDUSTRY_OPTIONS,
  },
  {
    type: FieldMetadataType.LINKS,
    name: 'website',
    label: 'Website',
    description: "Company's website",
    icon: 'IconWorldWww',
    isActive: true,
    isNullable: true,
    isUnique: false,
  },
  {
    type: FieldMetadataType.RELATION,
    name: 'owner',
    label: 'Owner',
    description: "Company's sales owner",
    icon: 'IconUserDollar',
    isActive: true,
    isNullable: true,
    isUnique: false,
    targetObjectMetadataNameSingular: 'workspaceMember',
    relationCreationPayload: {
      type: RelationType.MANY_TO_ONE,
      targetObjectMetadataId: 'to-be-resolved-later',
      targetFieldLabel: 'Owned Companies',
      targetFieldIcon: 'IconBuildingSkyscraper',
    },
  },
];
