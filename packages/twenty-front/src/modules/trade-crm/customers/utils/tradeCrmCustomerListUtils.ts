import {
  type TradeCrmEnterpriseCustomerField,
  type TradeCrmEnterpriseCustomerFieldDraftValue,
  type TradeCrmEnterpriseCustomerFieldOption,
  type TradeCrmEnterpriseCustomerFieldValuesByRecordId,
  getTradeCrmEnterpriseCustomerFieldDisplayValue,
} from '@/trade-crm/customers/hooks/useTradeCrmEnterpriseCustomerFields';
import { type TradeCrmCustomerEnterpriseFieldFilter } from '@/trade-crm/customers/hooks/useTradeCrmCustomerWorkspaceData';
import {
  type TradeCrmCustomerTableBadgeTone,
  type TradeCrmCustomerTableRow,
} from '@/trade-crm/customers/components/TradeCrmCustomerTable';
import {
  getTradeCrmCustomerCountryLabel,
  getTradeCrmCustomerEmailLabel,
  getTradeCrmCustomerGroupLabelForRecord,
  getTradeCrmCustomerLastTouchLabelForRecord,
  getTradeCrmCustomerOwnerLabel,
  getTradeCrmCustomerPhoneLabel,
  getTradeCrmCustomerRoutePath,
  getTradeCrmCustomerScoreLabelForRecord,
  getTradeCrmCustomerSourceLabelForRecord,
  getTradeCrmCustomerStageLabelForRecord,
  getTradeCrmCustomerStarLabelForRecord,
  getTradeCrmCustomerTagsForRecord,
  getTradeCrmCustomerWebsiteLabel,
  getTradeCrmRecordName,
  type TradeCrmCustomerPresentationRecord,
} from '@/trade-crm/customers/utils/tradeCrmCustomerPresentation';

export type CustomerFilterState = {
  searchTerm: string;
  source: string | null;
  stage: string | null;
  tag: string | null;
};

export type CustomerEnterpriseFieldFilterState = Record<string, string>;

type CustomerListEnterpriseColumnConfig = {
  fields: TradeCrmEnterpriseCustomerField[];
  optionsByFieldId: Record<string, TradeCrmEnterpriseCustomerFieldOption[]>;
  valuesByRecordId: TradeCrmEnterpriseCustomerFieldValuesByRecordId;
};

const getBadgeTone = (index: number): TradeCrmCustomerTableBadgeTone =>
  index % 4 === 0
    ? 'green'
    : index % 4 === 1
      ? 'blue'
      : index % 4 === 2
        ? 'amber'
        : 'red';

const recordMatchesSearchTerm = ({
  kind,
  record,
  searchTerm,
}: {
  kind: 'organization' | 'individual';
  record: TradeCrmCustomerPresentationRecord;
  searchTerm: string;
}) => {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  if (normalizedSearchTerm.length === 0) {
    return true;
  }

  const searchableValues = [
    getTradeCrmRecordName({ kind, record }),
    getTradeCrmCustomerWebsiteLabel(record),
    getTradeCrmCustomerOwnerLabel(record),
    getTradeCrmCustomerCountryLabel(record),
    getTradeCrmCustomerSourceLabelForRecord({ record }),
    getTradeCrmCustomerGroupLabelForRecord({ record }),
    getTradeCrmCustomerStageLabelForRecord({ record }),
    getTradeCrmCustomerEmailLabel(record),
    getTradeCrmCustomerPhoneLabel(record),
    ...getTradeCrmCustomerTagsForRecord({ record }),
  ]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.toLowerCase());

  return searchableValues.some((value) => value.includes(normalizedSearchTerm));
};

const getEnterpriseFieldSearchText = ({
  field,
  options,
  value,
}: {
  field: TradeCrmEnterpriseCustomerField;
  options: TradeCrmEnterpriseCustomerFieldOption[];
  value: TradeCrmEnterpriseCustomerFieldDraftValue | undefined;
}) => {
  const displayValue = getTradeCrmEnterpriseCustomerFieldDisplayValue({
    field,
    options,
    value,
  });
  const rawValue = Array.isArray(value) ? value.join(' ') : String(value ?? '');

  return `${displayValue} ${rawValue}`.toLowerCase();
};

export const buildCompanyRows = (
  companyRecords: TradeCrmCustomerPresentationRecord[] | undefined,
  enterpriseColumnConfig?: CustomerListEnterpriseColumnConfig,
): TradeCrmCustomerTableRow[] =>
  (companyRecords ?? []).slice(0, 8).map((record, index) => ({
    actionLabel: 'Open',
    actionTo: getTradeCrmCustomerRoutePath({
      kind: 'organization',
      record,
    }),
    cells: [
      {
        badgeLabel: getTradeCrmCustomerStageLabelForRecord({
          fallbackIndex: index,
          record,
        }),
        badgeTone: getBadgeTone(index),
        primary: getTradeCrmRecordName({
          kind: 'organization',
          record,
        }),
        secondary: getTradeCrmCustomerWebsiteLabel(record),
      },
      {
        primary: getTradeCrmCustomerOwnerLabel(record),
        secondary: getTradeCrmCustomerSourceLabelForRecord({
          fallbackIndex: index,
          record,
        }),
      },
      {
        primary: getTradeCrmCustomerCountryLabel(record),
        secondary: getTradeCrmCustomerGroupLabelForRecord({
          fallbackIndex: index,
          record,
        }),
      },
      {
        primary: getTradeCrmCustomerTagsForRecord({
          fallbackIndex: index,
          record,
        }).join(' / '),
        secondary: `${getTradeCrmCustomerStarLabelForRecord({
          fallbackIndex: index,
          record,
        })} / ${getTradeCrmCustomerScoreLabelForRecord({
          fallbackIndex: index,
          record,
        })}`,
      },
      {
        primary: getTradeCrmCustomerLastTouchLabelForRecord({
          fallbackIndex: index,
          record,
        }),
        secondary: `Next move: ${getTradeCrmCustomerStageLabelForRecord({
          fallbackIndex: index + 1,
          record,
        })}`,
      },
      ...(enterpriseColumnConfig?.fields ?? []).map((field) => ({
        primary:
          getTradeCrmEnterpriseCustomerFieldDisplayValue({
            field,
            options: enterpriseColumnConfig?.optionsByFieldId[field.id] ?? [],
            value:
              enterpriseColumnConfig?.valuesByRecordId[record.id]?.[field.id],
          }) || '--',
        secondary: field.fieldCode,
      })),
    ],
    id: record.id,
  }));

export const filterCompanyRecords = ({
  filters,
  records,
}: {
  filters: CustomerFilterState;
  records: TradeCrmCustomerPresentationRecord[] | undefined;
}) =>
  (records ?? []).filter((record) => {
    if (
      filters.stage &&
      getTradeCrmCustomerStageLabelForRecord({ record }) !== filters.stage
    ) {
      return false;
    }

    if (
      filters.source &&
      getTradeCrmCustomerSourceLabelForRecord({ record }) !== filters.source
    ) {
      return false;
    }

    if (
      filters.tag &&
      !getTradeCrmCustomerTagsForRecord({ record }).includes(filters.tag)
    ) {
      return false;
    }

    return recordMatchesSearchTerm({
      kind: 'organization',
      record,
      searchTerm: filters.searchTerm,
    });
  });

export const filterPeopleRecords = ({
  filters,
  records,
}: {
  filters: CustomerFilterState;
  records: TradeCrmCustomerPresentationRecord[] | undefined;
}) =>
  (records ?? []).filter((record) => {
    if (
      filters.source &&
      getTradeCrmCustomerSourceLabelForRecord({ record }) !== filters.source
    ) {
      return false;
    }

    if (
      filters.tag &&
      !getTradeCrmCustomerTagsForRecord({ record }).includes(filters.tag)
    ) {
      return false;
    }

    return recordMatchesSearchTerm({
      kind: 'individual',
      record,
      searchTerm: filters.searchTerm,
    });
  });

export const filterCompanyRecordsByEnterpriseFields = ({
  fields,
  filters,
  optionsByFieldId,
  records,
  valuesByRecordId,
}: {
  fields: TradeCrmEnterpriseCustomerField[];
  filters: CustomerEnterpriseFieldFilterState;
  optionsByFieldId: Record<string, TradeCrmEnterpriseCustomerFieldOption[]>;
  records: TradeCrmCustomerPresentationRecord[];
  valuesByRecordId: TradeCrmEnterpriseCustomerFieldValuesByRecordId;
}) => {
  const activeFilterEntries = Object.entries(filters).filter(
    ([, value]) => value.trim().length > 0,
  );

  if (activeFilterEntries.length === 0) {
    return records;
  }

  const fieldById = new Map(fields.map((field) => [field.id, field]));

  return records.filter((record) =>
    activeFilterEntries.every(([fieldId, filterValue]) => {
      const field = fieldById.get(fieldId);

      if (!field) {
        return true;
      }

      const normalizedFilterValue = filterValue.trim().toLowerCase();
      const fieldValue = valuesByRecordId[record.id]?.[fieldId];
      const searchableText = getEnterpriseFieldSearchText({
        field,
        options: optionsByFieldId[fieldId] ?? [],
        value: fieldValue,
      });

      return searchableText.includes(normalizedFilterValue);
    }),
  );
};

export const buildCustomerListEnterpriseFieldFilters = ({
  fields,
  filters,
}: {
  fields: TradeCrmEnterpriseCustomerField[];
  filters: CustomerEnterpriseFieldFilterState;
}): TradeCrmCustomerEnterpriseFieldFilter[] =>
  fields.reduce<TradeCrmCustomerEnterpriseFieldFilter[]>(
    (filtersAccumulator, field) => {
      const filterValue = filters[field.id]?.trim();

      if (!filterValue) {
        return filtersAccumulator;
      }

      if (field.fieldType === 'boolean') {
        filtersAccumulator.push({
          fieldDefinitionId: field.id,
          operator: 'equals',
          value: filterValue === 'yes',
        });

        return filtersAccumulator;
      }

      if (field.fieldType === 'number' || field.fieldType === 'date') {
        filtersAccumulator.push({
          fieldDefinitionId: field.id,
          operator: 'equals',
          value: filterValue,
        });

        return filtersAccumulator;
      }

      if (field.fieldType === 'select' || field.fieldType === 'multiSelect') {
        filtersAccumulator.push({
          fieldDefinitionId: field.id,
          operator: 'equals',
          value: filterValue,
        });

        return filtersAccumulator;
      }

      filtersAccumulator.push({
        fieldDefinitionId: field.id,
        operator: 'contains',
        value: filterValue,
      });

      return filtersAccumulator;
    },
    [],
  );
