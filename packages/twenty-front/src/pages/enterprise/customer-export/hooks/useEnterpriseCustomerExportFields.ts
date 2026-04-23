import { useCallback, useMemo, useState } from 'react';

import { useEnterpriseApiRequest } from '@/enterprise/shared/hooks/useEnterpriseApiRequest';
import { getTradeCrmEnterpriseCustomerFieldValidationMessage } from '@/trade-crm/customers/components/TradeCrmEnterpriseCustomerFieldInput';
import {
  type TradeCrmEnterpriseCustomerFieldDraftValue,
  type TradeCrmEnterpriseCustomerFieldOption,
} from '@/trade-crm/customers/hooks/useTradeCrmEnterpriseCustomerFields';
import {
  type EnterpriseCustomerExportEnterpriseField,
  type EnterpriseCustomerExportEnterpriseFieldFilter,
  type EnterpriseCustomerExportFieldOption,
  type EnterpriseCustomerExportFilterSummary,
} from '~/pages/enterprise/customer-export/types/enterprise-customer-export.types';

const baseCustomerExportFields: EnterpriseCustomerExportFieldOption[] = [
  { fieldCode: 'name', fieldName: '客户名称' },
  { fieldCode: 'domainName', fieldName: '网站域名' },
  { fieldCode: 'accountOwnerId', fieldName: '负责人' },
  { fieldCode: 'createdAt', fieldName: '创建时间' },
];

const selectFieldTypes = new Set(['select', 'multiSelect']);

const isEnterpriseFilterValueEmpty = (
  value: TradeCrmEnterpriseCustomerFieldDraftValue | undefined,
) => {
  if (value === undefined) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'string') {
    return value.trim().length === 0;
  }

  return false;
};

const getEnterpriseFilterValueLabel = ({
  field,
  options,
  value,
}: {
  field: EnterpriseCustomerExportEnterpriseField;
  options: TradeCrmEnterpriseCustomerFieldOption[];
  value: TradeCrmEnterpriseCustomerFieldDraftValue | undefined;
}) => {
  if (value === true) {
    return '是';
  }

  if (value === false) {
    return '否';
  }

  if (Array.isArray(value)) {
    return value
      .map(
        (entry) =>
          options.find((option) => option.optionCode === entry)?.optionLabel ??
          entry,
      )
      .join('、');
  }

  if (field.fieldType === 'select' && typeof value === 'string') {
    return (
      options.find((option) => option.optionCode === value)?.optionLabel ??
      value
    );
  }

  return typeof value === 'string' ? value.trim() : '';
};

const buildEnterpriseFieldFilters = (
  fields: EnterpriseCustomerExportEnterpriseField[],
  valuesByFieldId: Record<string, TradeCrmEnterpriseCustomerFieldDraftValue>,
): EnterpriseCustomerExportEnterpriseFieldFilter[] =>
  fields
    .map((field) => ({
      field,
      value: valuesByFieldId[field.id],
    }))
    .filter(({ value }) => !isEnterpriseFilterValueEmpty(value))
    .map(({ field, value }) => {
      const normalizedValue =
        typeof value === 'string' ? value.trim() : value;

      return {
        fieldDefinitionId: field.id,
        operator:
          field.fieldType === 'text' || field.fieldType === 'textarea'
            ? 'contains'
            : 'equals',
        value: normalizedValue as TradeCrmEnterpriseCustomerFieldDraftValue,
      };
    });

export const useEnterpriseCustomerExportFields = () => {
  const enterpriseApiRequest = useEnterpriseApiRequest();
  const [fieldOptions, setFieldOptions] = useState(baseCustomerExportFields);
  const [enterpriseFilterFields, setEnterpriseFilterFields] = useState<
    EnterpriseCustomerExportEnterpriseField[]
  >([]);
  const [
    enterpriseFilterFieldOptionsByFieldId,
    setEnterpriseFilterFieldOptionsByFieldId,
  ] = useState<Record<string, TradeCrmEnterpriseCustomerFieldOption[]>>({});
  const [enterpriseFilterValues, setEnterpriseFilterValues] = useState<
    Record<string, TradeCrmEnterpriseCustomerFieldDraftValue>
  >({});
  const [selectedFieldCodes, setSelectedFieldCodes] = useState<string[]>(
    baseCustomerExportFields.map((field) => field.fieldCode),
  );

  const activeEnterpriseFilterSummaries = useMemo<
    EnterpriseCustomerExportFilterSummary[]
  >(
    () =>
      enterpriseFilterFields
        .map((field) => ({
          field,
          options: enterpriseFilterFieldOptionsByFieldId[field.id] ?? [],
          value: enterpriseFilterValues[field.id],
        }))
        .filter(({ value }) => !isEnterpriseFilterValueEmpty(value))
        .map(({ field, options, value }) => ({
          fieldId: field.id,
          label: `${field.fieldName}: ${getEnterpriseFilterValueLabel({
            field,
            options,
            value,
          })}`,
        })),
    [
      enterpriseFilterFieldOptionsByFieldId,
      enterpriseFilterFields,
      enterpriseFilterValues,
    ],
  );

  const enterpriseFilterValidationMessages = useMemo(
    () =>
      Object.fromEntries(
        enterpriseFilterFields.map((field) => [
          field.id,
          getTradeCrmEnterpriseCustomerFieldValidationMessage({
            field: {
              ...field,
              readonly: false,
              required: false,
            },
            options: enterpriseFilterFieldOptionsByFieldId[field.id] ?? [],
            value: enterpriseFilterValues[field.id],
          }),
        ]),
      ),
    [
      enterpriseFilterFieldOptionsByFieldId,
      enterpriseFilterFields,
      enterpriseFilterValues,
    ],
  );

  const hasEnterpriseFilterValidationErrors = Object.values(
    enterpriseFilterValidationMessages,
  ).some((message) => message !== null);

  const updateEnterpriseFilterValue = useCallback(
    (fieldId: string, value: TradeCrmEnterpriseCustomerFieldDraftValue) => {
      setEnterpriseFilterValues((currentValues) => ({
        ...currentValues,
        [fieldId]: value,
      }));
    },
    [],
  );

  const clearEnterpriseFilterValues = useCallback(() => {
    setEnterpriseFilterValues({});
  }, []);

  const getEnterpriseFieldFilters = useCallback(
    () =>
      buildEnterpriseFieldFilters(
        enterpriseFilterFields,
        enterpriseFilterValues,
      ),
    [enterpriseFilterFields, enterpriseFilterValues],
  );

  const loadFieldOptions = useCallback(async () => {
    const response = await enterpriseApiRequest(
      '/api/enterprise/fields?entityType=customer',
      {
        credentials: 'include',
      },
    );

    if (!response.ok) {
      throw new Error('Failed to load customer export fields');
    }

    const customFields =
      (await response.json()) as EnterpriseCustomerExportEnterpriseField[];
    const enabledCustomFields = customFields.filter((field) => field.enabled);
    const searchableCustomFields = enabledCustomFields.filter(
      (field) => field.searchable,
    );
    const mergedFieldOptions = [
      ...baseCustomerExportFields,
      ...enabledCustomFields
        .filter((field) => field.exportable)
        .map((field) => ({
          fieldCode: field.fieldCode,
          fieldName: field.fieldName,
        })),
    ];
    const optionEntries = await Promise.all(
      searchableCustomFields
        .filter((field) => selectFieldTypes.has(field.fieldType))
        .map(async (field) => {
          const optionsResponse = await enterpriseApiRequest(
            `/api/enterprise/fields/${field.id}/options`,
            { credentials: 'include' },
          );

          if (!optionsResponse.ok) {
            return [field.id, []] as const;
          }

          const options =
            (await optionsResponse.json()) as TradeCrmEnterpriseCustomerFieldOption[];

          return [
            field.id,
            options
              .filter((option) => option.enabled)
              .sort((firstOption, secondOption) => {
                if (firstOption.sortOrder !== secondOption.sortOrder) {
                  return firstOption.sortOrder - secondOption.sortOrder;
                }

                return firstOption.optionLabel.localeCompare(
                  secondOption.optionLabel,
                );
              }),
          ] as const;
        }),
    );

    setEnterpriseFilterFields(searchableCustomFields);
    setEnterpriseFilterFieldOptionsByFieldId(Object.fromEntries(optionEntries));
    setFieldOptions(mergedFieldOptions);
    setSelectedFieldCodes((currentFieldCodes) => {
      if (currentFieldCodes.length > 0) {
        return currentFieldCodes;
      }

      return mergedFieldOptions.map((field) => field.fieldCode);
    });
  }, [enterpriseApiRequest]);

  return {
    activeEnterpriseFilterSummaries,
    clearEnterpriseFilterValues,
    enterpriseFilterFieldOptionsByFieldId,
    enterpriseFilterFields,
    enterpriseFilterValidationMessages,
    enterpriseFilterValues,
    fieldOptions,
    getEnterpriseFieldFilters,
    hasEnterpriseFilterValidationErrors,
    loadFieldOptions,
    selectedFieldCodes,
    setSelectedFieldCodes,
    updateEnterpriseFilterValue,
  };
};
