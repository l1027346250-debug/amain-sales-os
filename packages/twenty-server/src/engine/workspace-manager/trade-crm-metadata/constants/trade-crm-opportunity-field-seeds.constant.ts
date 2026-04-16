import { FieldMetadataType } from 'twenty-shared/types';

import {
  TRADE_CRM_LOST_REASON_OPTIONS,
  TRADE_CRM_PRODUCT_CATEGORY_OPTIONS,
  TRADE_CRM_SOURCE_OPTIONS,
} from 'src/engine/workspace-manager/trade-crm-metadata/constants/trade-crm-select-options.constant';
import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const TRADE_CRM_OPPORTUNITY_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.SELECT,
    name: 'productCategory',
    label: 'Product Category',
    description: 'Product category tied to the opportunity',
    icon: 'IconCategory',
    isActive: true,
    isNullable: true,
    isUnique: false,
    options: TRADE_CRM_PRODUCT_CATEGORY_OPTIONS,
  },
  {
    type: FieldMetadataType.SELECT,
    name: 'source',
    label: 'Source',
    description: 'Lead source carried into the opportunity',
    icon: 'IconRoute',
    isActive: true,
    isNullable: true,
    isUnique: false,
    options: TRADE_CRM_SOURCE_OPTIONS,
  },
  {
    type: FieldMetadataType.TEXT,
    name: 'nextAction',
    label: 'Next Action',
    description: 'Next action to move the deal forward',
    icon: 'IconChecklist',
    isActive: true,
    isNullable: true,
    isUnique: false,
  },
  {
    type: FieldMetadataType.DATE,
    name: 'nextActionDate',
    label: 'Next Action Date',
    description: 'When the next action is due',
    icon: 'IconCalendarTime',
    isActive: true,
    isNullable: true,
    isUnique: false,
  },
  {
    type: FieldMetadataType.DATE_TIME,
    name: 'lastActivityDate',
    label: 'Last Activity Date',
    description: 'Most recent commercial activity timestamp',
    icon: 'IconClockHour8',
    isActive: true,
    isNullable: true,
    isUnique: false,
  },
  {
    type: FieldMetadataType.SELECT,
    name: 'lostReason',
    label: 'Lost Reason',
    description: 'Why the opportunity was lost',
    icon: 'IconMoodSad',
    isActive: true,
    isNullable: true,
    isUnique: false,
    options: TRADE_CRM_LOST_REASON_OPTIONS,
  },
];
