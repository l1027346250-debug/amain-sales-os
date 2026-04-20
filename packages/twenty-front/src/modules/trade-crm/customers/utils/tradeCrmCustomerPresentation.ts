import {
  buildTradeCrmCustomerRouteId,
  getTradeCrmCustomerDetailPath,
  type TradeCrmCustomerKind,
} from '@/trade-crm/customers/utils/tradeCrmCustomerRouting';

export type TradeCrmCustomerPresentationRecord = Record<string, unknown> & {
  id: string;
  __typename: string;
};

const CUSTOMER_STAGE_LABELS_BY_VALUE: Record<string, string> = {
  POTENTIAL_CUSTOMER: 'Potential Customer',
  ACTIVE_CUSTOMER: 'Active Customer',
  WON_CUSTOMER: 'Won Customer',
  AT_RISK_CUSTOMER: 'At-Risk Customer',
  DORMANT_CUSTOMER: 'Dormant Customer',
};

const CUSTOMER_STAGE_LABELS = [
  'Potential Customer',
  'Active Customer',
  'Key Account',
  'At-Risk Customer',
  'Won Customer',
] as const;

const CUSTOMER_GROUP_LABELS_BY_VALUE: Record<string, string> = {
  KEY_ACCOUNT: 'Key Account',
  GROWTH_ACCOUNT: 'Growth Account',
  NEEDS_FOLLOW_UP: 'Needs Follow-up',
  REACTIVATION: 'Reactivation',
  UNASSIGNED: 'Unassigned',
};

const CUSTOMER_GROUP_LABELS = [
  'A Segment',
  'High Intent',
  'Needs Follow-up',
  'Regional Expansion',
  'Reactivation',
] as const;

const CUSTOMER_SOURCE_LABELS_BY_VALUE: Record<string, string> = {
  ALIBABA_INQUIRY: 'Alibaba Inquiry',
  WEBSITE: 'Website',
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  TRADE_SHOW: 'Trade Show',
  REFERRAL: 'Referral',
  MANUAL_IMPORT: 'Manual Import',
};

const CUSTOMER_SOURCE_LABELS = [
  'Lead Conversion',
  'Website Inquiry',
  'Manual Prospecting',
  'Referral',
  'Exhibition',
] as const;

const CUSTOMER_TAG_LABELS_BY_VALUE: Record<string, string> = {
  VIP: 'VIP',
  REPEAT_BUYER: 'Repeat Buyer',
  NEEDS_SAMPLES: 'Needs Samples',
  NEGOTIATION: 'Negotiation',
  DORMANT: 'Dormant',
};

const CUSTOMER_TAGS = [
  ['VIP', 'Repeat Buyer'],
  ['Quote Pending', 'Negotiation'],
  ['Needs Samples', 'Factory Visit'],
  ['Dormant', 'Reactivation'],
  ['Strategic', 'Cross-Sell'],
] as const;

const PUBLIC_POOL_STATE_LABELS_BY_VALUE: Record<string, string> = {
  PRIVATE: 'Private',
  PUBLIC_POOL: 'Public Pool',
};

const PUBLIC_POOL_GROUP_LABELS_BY_VALUE: Record<string, string> = {
  GENERAL_PUBLIC_POOL: 'General Public Pool',
  REACTIVATION_POOL: 'Reactivation Pool',
  MANAGER_REVIEW_POOL: 'Manager Review Pool',
};

const getValueForLabel = ({
  label,
  labelsByValue,
}: {
  label: string;
  labelsByValue: Record<string, string>;
}) =>
  Object.entries(labelsByValue).find(
    ([, resolvedLabel]) => resolvedLabel === label,
  )?.[0] ?? null;

const PUBLIC_POOL_REASONS = [
  'No follow-up in 30 days',
  'Owner changed team',
  'Quote stalled without reply',
  'Account reactivation needed',
  'Regional reassignment',
] as const;

const getArrayLabel = <TLabel extends string>(
  values: readonly TLabel[],
  index: number,
) => values[index % values.length];

const getSelectValue = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    const maybeValue = (value as { value?: string | null }).value;
    const maybeLabel = (value as { label?: string | null }).label;
    const maybeName = (value as { name?: string | null }).name;

    return maybeValue ?? maybeLabel ?? maybeName ?? null;
  }

  return null;
};

const getSelectLabel = ({
  value,
  labelsByValue,
}: {
  value: unknown;
  labelsByValue: Record<string, string>;
}) => {
  const resolvedValue = getSelectValue(value);

  if (!resolvedValue) {
    return null;
  }

  return labelsByValue[resolvedValue] ?? resolvedValue;
};

const getMultiSelectLabels = ({
  value,
  labelsByValue,
}: {
  value: unknown;
  labelsByValue: Record<string, string>;
}) => {
  if (!Array.isArray(value) || value.length === 0) {
    return [];
  }

  return value
    .map((entry) => getSelectLabel({ value: entry, labelsByValue }))
    .filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
};

const getDateLabel = (value: unknown) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  return value.slice(0, 10);
};

const getStringValue = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const formatCurrencyValue = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `USD ${value.toLocaleString()}`;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return value.includes('USD') ? value : `USD ${value}`;
  }

  return null;
};

export const getTradeCrmRecordName = ({
  kind,
  record,
}: {
  kind: TradeCrmCustomerKind;
  record: TradeCrmCustomerPresentationRecord | undefined;
}) => {
  if (!record) {
    return kind === 'organization' ? 'Unnamed company' : 'Unnamed contact';
  }

  if (kind === 'organization') {
    const name = record.name;

    return typeof name === 'string' && name.trim().length > 0
      ? name
      : 'Unnamed company';
  }

  const fullName = getTradeCrmRelationName(record.name);

  if (fullName) {
    return fullName;
  }

  return typeof record.email === 'string' && record.email.length > 0
    ? record.email
    : 'Unnamed contact';
};

export const getTradeCrmRelationName = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const relation = value as {
    name?: unknown;
    firstName?: unknown;
    lastName?: unknown;
  };

  if (typeof relation.name === 'string' && relation.name.trim().length > 0) {
    return relation.name;
  }

  const fullName = [relation.firstName, relation.lastName]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(' ')
    .trim();

  return fullName.length > 0 ? fullName : null;
};

export const getTradeCrmCustomerCountryLabel = (
  record: TradeCrmCustomerPresentationRecord | undefined,
) => {
  if (!record) {
    return 'Unknown region';
  }

  if (typeof record.country === 'string' && record.country.length > 0) {
    return record.country;
  }

  const address = record.address as
    | {
        addressCountry?: unknown;
      }
    | undefined;

  if (
    address &&
    typeof address.addressCountry === 'string' &&
    address.addressCountry.length > 0
  ) {
    return address.addressCountry;
  }

  return 'Unknown region';
};

export const getTradeCrmCustomerOwnerLabel = (
  record: TradeCrmCustomerPresentationRecord | undefined,
) => {
  if (!record) {
    return 'Unassigned';
  }

  return (
    getTradeCrmRelationName(record.accountOwner) ??
    getTradeCrmRelationName(record.owner) ??
    'Unassigned'
  );
};

export const getTradeCrmCustomerWebsiteLabel = (
  record: TradeCrmCustomerPresentationRecord | undefined,
) => {
  if (!record) {
    return 'No website';
  }

  const website = record.website as
    | {
        primaryLinkLabel?: unknown;
        primaryLinkUrl?: unknown;
      }
    | undefined;

  if (
    website &&
    typeof website.primaryLinkLabel === 'string' &&
    website.primaryLinkLabel.length > 0
  ) {
    return website.primaryLinkLabel;
  }

  if (
    website &&
    typeof website.primaryLinkUrl === 'string' &&
    website.primaryLinkUrl.length > 0
  ) {
    return website.primaryLinkUrl;
  }

  if (typeof record.domainName === 'string' && record.domainName.length > 0) {
    return record.domainName;
  }

  return 'No website';
};

export const getTradeCrmCustomerPhoneLabel = (
  record: TradeCrmCustomerPresentationRecord | undefined,
) => {
  if (!record) {
    return '--';
  }

  if (typeof record.phone === 'string' && record.phone.length > 0) {
    return record.phone;
  }

  if (typeof record.mobile === 'string' && record.mobile.length > 0) {
    return record.mobile;
  }

  return '--';
};

export const getTradeCrmCustomerEmailLabel = (
  record: TradeCrmCustomerPresentationRecord | undefined,
) => {
  if (!record) {
    return '--';
  }

  if (typeof record.email === 'string' && record.email.length > 0) {
    return record.email;
  }

  const emails = record.emails as
    | {
        primaryEmail?: unknown;
      }
    | undefined;

  if (
    emails &&
    typeof emails.primaryEmail === 'string' &&
    emails.primaryEmail.length > 0
  ) {
    return emails.primaryEmail;
  }

  return '--';
};

export const getTradeCrmCustomerJobTitle = (
  record: TradeCrmCustomerPresentationRecord | undefined,
) =>
  typeof record?.jobTitle === 'string' && record.jobTitle.length > 0
    ? record.jobTitle
    : 'Relationship owner pending';

export const getTradeCrmCustomerShortNameLabelForRecord = (
  record: TradeCrmCustomerPresentationRecord | undefined,
) => getStringValue(record?.shortName) ?? '--';

export const getTradeCrmCustomerAddressLabelForRecord = (
  record: TradeCrmCustomerPresentationRecord | undefined,
) => {
  if (!record) {
    return '--';
  }

  const address = record.address as
    | {
        addressStreet1?: unknown;
        addressStreet2?: unknown;
        addressCity?: unknown;
        addressState?: unknown;
        addressPostcode?: unknown;
        addressCountry?: unknown;
      }
    | undefined;

  if (!address) {
    return '--';
  }

  const parts = [
    address.addressStreet1,
    address.addressStreet2,
    address.addressCity,
    address.addressState,
    address.addressPostcode,
    address.addressCountry,
  ]
    .map(getStringValue)
    .filter((part): part is string => part !== null);

  return parts.length > 0 ? parts.join(', ') : '--';
};

export const getTradeCrmCustomerSocialLabelsForRecord = (
  record: TradeCrmCustomerPresentationRecord | undefined,
) =>
  [record?.facebook, record?.twitter, record?.linkedIn]
    .map(getStringValue)
    .filter((entry): entry is string => entry !== null);

export const getTradeCrmCustomerRoutePath = ({
  kind,
  record,
}: {
  kind: TradeCrmCustomerKind;
  record: TradeCrmCustomerPresentationRecord;
}) =>
  getTradeCrmCustomerDetailPath(
    buildTradeCrmCustomerRouteId({
      kind,
      recordId: record.id,
    }),
  );

export const getTradeCrmCustomerStageLabelForRecord = ({
  record,
  fallbackIndex = 0,
}: {
  record: TradeCrmCustomerPresentationRecord | undefined;
  fallbackIndex?: number;
}) =>
  getSelectLabel({
    value: record?.customerStage,
    labelsByValue: CUSTOMER_STAGE_LABELS_BY_VALUE,
  }) ?? getArrayLabel(CUSTOMER_STAGE_LABELS, fallbackIndex);

export const getTradeCrmCustomerStageLabel = (index: number) =>
  getArrayLabel(CUSTOMER_STAGE_LABELS, index);

export const getTradeCrmCustomerStageLabelForValue = (value: string | null) =>
  value ? CUSTOMER_STAGE_LABELS_BY_VALUE[value] ?? value : null;

export const getTradeCrmCustomerStageValueForLabel = (label: string) =>
  getValueForLabel({
    label,
    labelsByValue: CUSTOMER_STAGE_LABELS_BY_VALUE,
  });

export const getTradeCrmCustomerGroupLabelForRecord = ({
  record,
  fallbackIndex = 0,
}: {
  record: TradeCrmCustomerPresentationRecord | undefined;
  fallbackIndex?: number;
}) =>
  getSelectLabel({
    value: record?.customerGroup,
    labelsByValue: CUSTOMER_GROUP_LABELS_BY_VALUE,
  }) ?? getArrayLabel(CUSTOMER_GROUP_LABELS, fallbackIndex);

export const getTradeCrmCustomerGroupLabel = (index: number) =>
  getArrayLabel(CUSTOMER_GROUP_LABELS, index);

export const getTradeCrmCustomerSourceLabelForRecord = ({
  record,
  fallbackIndex = 0,
}: {
  record: TradeCrmCustomerPresentationRecord | undefined;
  fallbackIndex?: number;
}) =>
  getSelectLabel({
    value: record?.customerSource,
    labelsByValue: CUSTOMER_SOURCE_LABELS_BY_VALUE,
  }) ?? getArrayLabel(CUSTOMER_SOURCE_LABELS, fallbackIndex);

export const getTradeCrmCustomerSourceLabel = (index: number) =>
  getArrayLabel(CUSTOMER_SOURCE_LABELS, index);

export const getTradeCrmCustomerSourceValueForLabel = (label: string) =>
  getValueForLabel({
    label,
    labelsByValue: CUSTOMER_SOURCE_LABELS_BY_VALUE,
  });

export const getTradeCrmCustomerTagValueForLabel = (label: string) =>
  getValueForLabel({
    label,
    labelsByValue: CUSTOMER_TAG_LABELS_BY_VALUE,
  });

export const getTradeCrmCustomerTagsForRecord = ({
  record,
  fallbackIndex = 0,
}: {
  record: TradeCrmCustomerPresentationRecord | undefined;
  fallbackIndex?: number;
}) => {
  const labels = getMultiSelectLabels({
    value: record?.customerTags,
    labelsByValue: CUSTOMER_TAG_LABELS_BY_VALUE,
  });

  if (labels.length > 0) {
    return labels;
  }

  return [...CUSTOMER_TAGS[fallbackIndex % CUSTOMER_TAGS.length]];
};

export const getTradeCrmCustomerTags = (index: number) =>
  [...CUSTOMER_TAGS[index % CUSTOMER_TAGS.length]];

export const getTradeCrmPublicPoolReason = (index: number) =>
  getArrayLabel(PUBLIC_POOL_REASONS, index);

export const getTradeCrmPublicPoolStateLabelForRecord = (
  record: TradeCrmCustomerPresentationRecord | undefined,
) =>
  getSelectLabel({
    value: record?.publicPoolState,
    labelsByValue: PUBLIC_POOL_STATE_LABELS_BY_VALUE,
  }) ?? 'Private';

export const getTradeCrmPublicPoolStateValueForLabel = (label: string) =>
  getValueForLabel({
    label,
    labelsByValue: PUBLIC_POOL_STATE_LABELS_BY_VALUE,
  });

export const getTradeCrmPublicPoolGroupLabelForRecord = (
  record: TradeCrmCustomerPresentationRecord | undefined,
) =>
  getSelectLabel({
    value: record?.publicPoolGroup,
    labelsByValue: PUBLIC_POOL_GROUP_LABELS_BY_VALUE,
  }) ?? 'General Public Pool';

export const getTradeCrmPublicPoolGroupLabelForValue = (
  value: string | null,
) =>
  value ? PUBLIC_POOL_GROUP_LABELS_BY_VALUE[value] ?? value : 'General Public Pool';

export const getTradeCrmPublicPoolGroupValueForLabel = (label: string) =>
  getValueForLabel({
    label,
    labelsByValue: PUBLIC_POOL_GROUP_LABELS_BY_VALUE,
  });

export const getTradeCrmCustomerCodeLabelForRecord = (
  record: TradeCrmCustomerPresentationRecord | undefined,
) =>
  typeof record?.customerCode === 'string' && record.customerCode.length > 0
    ? record.customerCode
    : '--';

export const getTradeCrmCustomerStarLabelForRecord = ({
  record,
  fallbackIndex = 0,
}: {
  record: TradeCrmCustomerPresentationRecord | undefined;
  fallbackIndex?: number;
}) => {
  const resolvedValue = getSelectValue(record?.customerStar);

  if (resolvedValue && resolvedValue.startsWith('RATING_')) {
    return `${resolvedValue.replace('RATING_', '')} Stars`;
  }

  return `${(fallbackIndex % 5) + 1} Stars`;
};

export const getTradeCrmCustomerStarLabel = (index: number) =>
  `${(index % 5) + 1} Stars`;

export const getTradeCrmCustomerLastTouchLabelForRecord = ({
  record,
  fallbackIndex = 0,
}: {
  record: TradeCrmCustomerPresentationRecord | undefined;
  fallbackIndex?: number;
}) =>
  getDateLabel(record?.lastFollowUpAt) ??
  getDateLabel(record?.lastContactAt) ??
  getDateLabel(record?.publicPoolEnteredAt) ??
  `${(fallbackIndex % 6) + 1} days ago`;

export const getTradeCrmCustomerLastTouchLabel = (index: number) =>
  `${(index % 6) + 1} days ago`;

export const getTradeCrmCustomerLastContactLabelForRecord = (
  record: TradeCrmCustomerPresentationRecord | undefined,
) => getDateLabel(record?.lastContactAt) ?? '--';

export const getTradeCrmCustomerLastWonLabelForRecord = (
  record: TradeCrmCustomerPresentationRecord | undefined,
) => getDateLabel(record?.lastWonAt) ?? '--';

export const getTradeCrmCustomerScoreLabelForRecord = ({
  record,
  fallbackIndex = 0,
}: {
  record: TradeCrmCustomerPresentationRecord | undefined;
  fallbackIndex?: number;
}) =>
  typeof record?.customerScore === 'number' || typeof record?.customerScore === 'string'
    ? `${record.customerScore}`
    : `${58 + ((fallbackIndex * 7) % 31)}`;

export const getTradeCrmCustomerScoreLabel = (index: number) =>
  `${58 + ((index * 7) % 31)}`;

export const getTradeCrmCustomerTotalWonAmountLabelForRecord = (
  record: TradeCrmCustomerPresentationRecord | undefined,
) => formatCurrencyValue(record?.totalWonAmount) ?? '--';
