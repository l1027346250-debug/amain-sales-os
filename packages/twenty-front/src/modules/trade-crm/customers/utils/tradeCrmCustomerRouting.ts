import { tradeCrmRouteMap } from '@/trade-crm/navigation/tradeCrmRouteMap';

export type TradeCrmCustomerKind = 'organization' | 'individual';

export type TradeCrmCustomerConfigSection =
  | 'public-pool-rules'
  | 'groups'
  | 'tags'
  | 'sources'
  | 'matching'
  | 'import';

export type TradeCrmCustomerRouteKey =
  | 'list'
  | 'public'
  | 'dedup'
  | 'detail'
  | 'config-public-pool-rules'
  | 'config-groups'
  | 'config-tags'
  | 'config-sources'
  | 'config-matching'
  | 'config-import';

const tradeCrmCustomerBasePath = tradeCrmRouteMap.customers;

export const tradeCrmCustomerRouteLabels: Record<
  TradeCrmCustomerRouteKey,
  string
> = {
  list: 'Active Customers',
  public: 'Public Pool',
  dedup: 'Dedup Center',
  detail: 'Customer Detail',
  'config-public-pool-rules': 'Public Pool Rules',
  'config-groups': 'Groups',
  'config-tags': 'Tags',
  'config-sources': 'Sources',
  'config-matching': 'Matching',
  'config-import': 'Import',
};

const configPathBySection: Record<TradeCrmCustomerConfigSection, string> = {
  'public-pool-rules': 'config/public-pool-rules',
  groups: 'config/groups',
  tags: 'config/tags',
  sources: 'config/sources',
  matching: 'config/matching',
  import: 'config/import',
};

export const tradeCrmCustomerConfigSections: TradeCrmCustomerConfigSection[] = [
  'public-pool-rules',
  'groups',
  'tags',
  'sources',
  'matching',
  'import',
];

export const buildTradeCrmCustomerRouteId = ({
  kind,
  recordId,
}: {
  kind: TradeCrmCustomerKind;
  recordId: string;
}) => `${kind === 'organization' ? 'org' : 'person'}_${recordId}`;

export const parseTradeCrmCustomerRouteId = (
  customerId: string,
):
  | {
      kind: TradeCrmCustomerKind;
      recordId: string;
    }
  | null => {
  if (!customerId) {
    return null;
  }

  if (customerId.startsWith('org_')) {
    return {
      kind: 'organization',
      recordId: customerId.slice(4),
    };
  }

  if (customerId.startsWith('person_')) {
    return {
      kind: 'individual',
      recordId: customerId.slice(7),
    };
  }

  return {
    kind: 'organization',
    recordId: customerId,
  };
};

export const getTradeCrmCustomerPath = (
  routeKey: Exclude<TradeCrmCustomerRouteKey, 'detail'>,
) => {
  switch (routeKey) {
    case 'list':
      return `${tradeCrmCustomerBasePath}/list`;
    case 'public':
      return `${tradeCrmCustomerBasePath}/public`;
    case 'dedup':
      return `${tradeCrmCustomerBasePath}/dedup`;
    case 'config-public-pool-rules':
      return `${tradeCrmCustomerBasePath}/${configPathBySection['public-pool-rules']}`;
    case 'config-groups':
      return `${tradeCrmCustomerBasePath}/${configPathBySection.groups}`;
    case 'config-tags':
      return `${tradeCrmCustomerBasePath}/${configPathBySection.tags}`;
    case 'config-sources':
      return `${tradeCrmCustomerBasePath}/${configPathBySection.sources}`;
    case 'config-matching':
      return `${tradeCrmCustomerBasePath}/${configPathBySection.matching}`;
    case 'config-import':
      return `${tradeCrmCustomerBasePath}/${configPathBySection.import}`;
  }
};

export const getTradeCrmCustomerConfigPath = (
  section: TradeCrmCustomerConfigSection,
) => `${tradeCrmCustomerBasePath}/${configPathBySection[section]}`;

export const getTradeCrmCustomerDetailPath = (customerId: string) =>
  `${tradeCrmCustomerBasePath}/${customerId}`;

export const getTradeCrmCustomerLegacyViewRedirectPath = (
  requestedView: string | null,
) => {
  switch (requestedView) {
    case 'customer-list':
    case 'contacts':
    case 'segmentation':
    case 'customer-360':
      return getTradeCrmCustomerPath('list');
    case 'public-pool':
      return getTradeCrmCustomerPath('public');
    default:
      return null;
  }
};

export const getTradeCrmCustomerRouteContext = (pathname: string) =>
  pathname.startsWith(tradeCrmCustomerBasePath)
    ? 'trade-customers'
    : undefined;
