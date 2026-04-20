import { EnterpriseEntityType } from 'src/modules/enterprise/shared/types/enterprise-entity-type';

export type EnterpriseEntityBindingConfig = {
  entityType: EnterpriseEntityType;
  label: string;
  metadataName: string | null;
};

export const ENTERPRISE_ENTITY_BINDINGS: EnterpriseEntityBindingConfig[] = [
  {
    entityType: EnterpriseEntityType.LEAD,
    label: 'Leads',
    metadataName: 'lead',
  },
  {
    entityType: EnterpriseEntityType.CUSTOMER,
    label: 'Customers',
    metadataName: 'company',
  },
  {
    entityType: EnterpriseEntityType.OPPORTUNITY,
    label: 'Opportunities',
    metadataName: 'opportunity',
  },
  {
    entityType: EnterpriseEntityType.QUOTE,
    label: 'Quotes',
    metadataName: null,
  },
  {
    entityType: EnterpriseEntityType.SALES_ORDER,
    label: 'Sales Orders',
    metadataName: null,
  },
];
