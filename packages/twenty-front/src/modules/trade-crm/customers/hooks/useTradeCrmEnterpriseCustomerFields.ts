import { useCallback, useEffect, useMemo, useState } from 'react';

import { useEnterpriseApiRequest } from '@/enterprise/shared/hooks/useEnterpriseApiRequest';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

export type TradeCrmEnterpriseCustomerField = {
  id: string;
  fieldCode: string;
  fieldName: string;
  fieldType: string;
  groupCode: string | null;
  enabled: boolean;
  searchable: boolean;
  exportable: boolean;
  sortOrder: number;
};

export type TradeCrmEnterpriseCustomerFieldOption = {
  id: string;
  fieldDefinitionId: string;
  optionCode: string;
  optionLabel: string;
  enabled: boolean;
  sortOrder: number;
};

type EnterpriseCustomerFieldValue = {
  fieldDefinitionId: string;
  valueJson: unknown;
  valueString: string | null;
  valueNumber: string | null;
  valueBoolean: boolean | null;
  valueDate: string | null;
  valueStringArray: string[] | null;
};

type EnterpriseCustomerBatchFieldValueResponse = {
  recordIds: string[];
  valuesByRecordId: Record<string, EnterpriseCustomerFieldValue[]>;
};

type EnterpriseCustomerFieldLayout = {
  fieldDefinitionId: string;
  readonly: boolean;
  required: boolean;
  visible: boolean;
  sortOrder: number;
};

export type TradeCrmEnterpriseCustomerFieldWithLayout =
  TradeCrmEnterpriseCustomerField & {
    readonly: boolean;
    required: boolean;
  };

export type TradeCrmEnterpriseCustomerFieldDraftValue =
  | boolean
  | string
  | string[];

export type TradeCrmEnterpriseCustomerFieldValuesByRecordId = Record<
  string,
  Record<string, TradeCrmEnterpriseCustomerFieldDraftValue>
>;

const selectFieldTypes = new Set(['select', 'multiSelect']);

const buildFieldsFromLayout = ({
  fields,
  layouts,
}: {
  fields: TradeCrmEnterpriseCustomerField[];
  layouts: EnterpriseCustomerFieldLayout[];
}): TradeCrmEnterpriseCustomerFieldWithLayout[] => {
  if (layouts.length === 0) {
    return fields.map((field) => ({
      ...field,
      readonly: false,
      required: false,
    }));
  }

  const fieldById = new Map(fields.map((field) => [field.id, field]));

  return layouts
    .filter((layout) => layout.visible)
    .sort((firstLayout, secondLayout) => {
      if (firstLayout.sortOrder !== secondLayout.sortOrder) {
        return firstLayout.sortOrder - secondLayout.sortOrder;
      }

      return firstLayout.fieldDefinitionId.localeCompare(
        secondLayout.fieldDefinitionId,
      );
    })
    .map((layout) => {
      const field = fieldById.get(layout.fieldDefinitionId);

      if (!field) {
        return null;
      }

      return {
        ...field,
        readonly: layout.readonly,
        required: layout.required,
      };
    })
    .filter(
      (field): field is TradeCrmEnterpriseCustomerFieldWithLayout =>
        field !== null,
    );
};

const getDraftValueFromRecordValue = (value: EnterpriseCustomerFieldValue) => {
  if (Array.isArray(value.valueStringArray)) {
    return value.valueStringArray;
  }

  if (typeof value.valueBoolean === 'boolean') {
    return value.valueBoolean;
  }

  if (typeof value.valueNumber === 'string') {
    return value.valueNumber;
  }

  if (typeof value.valueDate === 'string') {
    return value.valueDate.slice(0, 10);
  }

  if (typeof value.valueString === 'string') {
    return value.valueString;
  }

  if (
    typeof value.valueJson === 'string' ||
    typeof value.valueJson === 'number' ||
    typeof value.valueJson === 'boolean'
  ) {
    return String(value.valueJson);
  }

  return '';
};

export const normalizeTradeCrmEnterpriseCustomerFieldValueForSave = ({
  field,
  value,
}: {
  field: TradeCrmEnterpriseCustomerField;
  value: TradeCrmEnterpriseCustomerFieldDraftValue | undefined;
}) => {
  if (value === undefined) {
    return null;
  }

  if (value === '') {
    return null;
  }

  if (field.fieldType === 'boolean') {
    return value === true || value === 'true';
  }

  if (field.fieldType === 'number') {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return null;
    }

    return Number(value);
  }

  if (field.fieldType === 'multiSelect') {
    if (Array.isArray(value)) {
      return value;
    }

    return String(value)
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.trim().length > 0 ? value.trim() : null;
  }

  return value;
};

export const useTradeCrmEnterpriseCustomerFields = (recordId: string) => {
  const enterpriseApiRequest = useEnterpriseApiRequest();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const [fields, setFields] = useState<TradeCrmEnterpriseCustomerField[]>([]);
  const [detailFields, setDetailFields] = useState<
    TradeCrmEnterpriseCustomerFieldWithLayout[]
  >([]);
  const [editFields, setEditFields] = useState<
    TradeCrmEnterpriseCustomerFieldWithLayout[]
  >([]);
  const [optionsByFieldId, setOptionsByFieldId] = useState<
    Record<string, TradeCrmEnterpriseCustomerFieldOption[]>
  >({});
  const [draftValues, setDraftValues] = useState<
    Record<string, TradeCrmEnterpriseCustomerFieldDraftValue>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const enabledFields = useMemo(
    () => fields.filter((field) => field.enabled),
    [fields],
  );

  const loadEnterpriseCustomerFields = useCallback(async () => {
    if (recordId.trim().length === 0) {
      setFields([]);
      setDetailFields([]);
      setEditFields([]);
      setOptionsByFieldId({});
      setDraftValues({});

      return;
    }

    setIsLoading(true);

    try {
      const [fieldsResponse, detailLayoutResponse, editLayoutResponse] =
        await Promise.all([
          enterpriseApiRequest('/api/enterprise/fields?entityType=customer', {
            credentials: 'include',
          }),
          enterpriseApiRequest(
            `/api/enterprise/field-layouts?${new URLSearchParams({
              entityType: 'customer',
              pageScene: 'detail',
            }).toString()}`,
            { credentials: 'include' },
          ),
          enterpriseApiRequest(
            `/api/enterprise/field-layouts?${new URLSearchParams({
              entityType: 'customer',
              pageScene: 'edit',
            }).toString()}`,
            { credentials: 'include' },
          ),
        ]);

      if (!fieldsResponse.ok) {
        throw new Error('Failed to load enterprise customer fields');
      }

      const loadedFields =
        (await fieldsResponse.json()) as TradeCrmEnterpriseCustomerField[];
      const detailLayouts = detailLayoutResponse.ok
        ? ((await detailLayoutResponse.json()) as EnterpriseCustomerFieldLayout[])
        : [];
      const editLayouts = editLayoutResponse.ok
        ? ((await editLayoutResponse.json()) as EnterpriseCustomerFieldLayout[])
        : [];
      const activeFields = loadedFields.filter((field) => field.enabled);
      const optionEntries = await Promise.all(
        activeFields
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
      const valuesResponse = await enterpriseApiRequest(
        `/api/enterprise/records/customer/${recordId}/field-values`,
        { credentials: 'include' },
      );

      if (!valuesResponse.ok) {
        throw new Error('Failed to load enterprise customer field values');
      }

      const loadedValues =
        (await valuesResponse.json()) as EnterpriseCustomerFieldValue[];

      setFields(activeFields);
      setDetailFields(
        buildFieldsFromLayout({
          fields: activeFields,
          layouts: detailLayouts,
        }),
      );
      setEditFields(
        buildFieldsFromLayout({
          fields: activeFields,
          layouts: editLayouts,
        }),
      );
      setOptionsByFieldId(Object.fromEntries(optionEntries));
      setDraftValues(
        Object.fromEntries(
          loadedValues.map((value) => [
            value.fieldDefinitionId,
            getDraftValueFromRecordValue(value),
          ]),
        ),
      );
    } catch {
      enqueueErrorSnackBar({ message: '无法加载企业自定义字段值' });
    } finally {
      setIsLoading(false);
    }
  }, [enqueueErrorSnackBar, enterpriseApiRequest, recordId]);

  useEffect(() => {
    void loadEnterpriseCustomerFields();
  }, [loadEnterpriseCustomerFields]);

  const updateDraftValue = useCallback(
    (
      fieldDefinitionId: string,
      value: TradeCrmEnterpriseCustomerFieldDraftValue,
    ) => {
      setDraftValues((currentDraftValues) => ({
        ...currentDraftValues,
        [fieldDefinitionId]: value,
      }));
    },
    [],
  );

  const saveEnterpriseCustomerFields = useCallback(async () => {
    setIsSaving(true);

    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/records/customer/${recordId}/field-values`,
        {
          body: JSON.stringify({
            values: enabledFields.map((field) => ({
              fieldDefinitionId: field.id,
              value: normalizeTradeCrmEnterpriseCustomerFieldValueForSave({
                field,
                value: draftValues[field.id],
              }),
            })),
          }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'PUT',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to save enterprise customer field values');
      }

      enqueueSuccessSnackBar({ message: '企业自定义字段已保存' });
      await loadEnterpriseCustomerFields();
    } catch {
      enqueueErrorSnackBar({ message: '保存企业自定义字段失败' });
    } finally {
      setIsSaving(false);
    }
  }, [
    draftValues,
    enabledFields,
    enqueueErrorSnackBar,
    enqueueSuccessSnackBar,
    enterpriseApiRequest,
    loadEnterpriseCustomerFields,
    recordId,
  ]);

  return {
    detailFields,
    draftValues,
    editFields,
    fields: enabledFields,
    isLoading,
    isSaving,
    optionsByFieldId,
    refresh: loadEnterpriseCustomerFields,
    saveEnterpriseCustomerFields,
    updateDraftValue,
  };
};

export const useTradeCrmEnterpriseCustomerFieldDefinitions = () => {
  const enterpriseApiRequest = useEnterpriseApiRequest();
  const { enqueueErrorSnackBar } = useSnackBar();
  const [fields, setFields] = useState<TradeCrmEnterpriseCustomerField[]>([]);
  const [listLayoutFields, setListLayoutFields] = useState<
    TradeCrmEnterpriseCustomerField[]
  >([]);
  const [createLayoutFields, setCreateLayoutFields] = useState<
    TradeCrmEnterpriseCustomerFieldWithLayout[]
  >([]);
  const [optionsByFieldId, setOptionsByFieldId] = useState<
    Record<string, TradeCrmEnterpriseCustomerFieldOption[]>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  const loadEnterpriseCustomerFieldDefinitions = useCallback(async () => {
    setIsLoading(true);

    try {
      const [fieldsResponse, listLayoutResponse, createLayoutResponse] =
        await Promise.all([
          enterpriseApiRequest('/api/enterprise/fields?entityType=customer', {
            credentials: 'include',
          }),
          enterpriseApiRequest(
            `/api/enterprise/field-layouts?${new URLSearchParams({
              entityType: 'customer',
              pageScene: 'list',
            }).toString()}`,
            { credentials: 'include' },
          ),
          enterpriseApiRequest(
            `/api/enterprise/field-layouts?${new URLSearchParams({
              entityType: 'customer',
              pageScene: 'create',
            }).toString()}`,
            { credentials: 'include' },
          ),
        ]);

      if (!fieldsResponse.ok) {
        throw new Error('Failed to load enterprise customer fields');
      }

      const loadedFields =
        (await fieldsResponse.json()) as TradeCrmEnterpriseCustomerField[];
      const listLayouts = listLayoutResponse.ok
        ? ((await listLayoutResponse.json()) as EnterpriseCustomerFieldLayout[])
        : [];
      const createLayouts = createLayoutResponse.ok
        ? ((await createLayoutResponse.json()) as EnterpriseCustomerFieldLayout[])
        : [];
      const activeFields = loadedFields.filter((field) => field.enabled);
      const activeFieldById = new Map(
        activeFields.map((field) => [field.id, field]),
      );
      const visibleListLayoutFields = listLayouts
        .filter((layout) => layout.visible)
        .sort((firstLayout, secondLayout) => {
          if (firstLayout.sortOrder !== secondLayout.sortOrder) {
            return firstLayout.sortOrder - secondLayout.sortOrder;
          }

          return firstLayout.fieldDefinitionId.localeCompare(
            secondLayout.fieldDefinitionId,
          );
        })
        .map((layout) => activeFieldById.get(layout.fieldDefinitionId))
        .filter(
          (field): field is TradeCrmEnterpriseCustomerField =>
            field !== undefined,
        );
      const optionEntries = await Promise.all(
        activeFields
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

      setFields(activeFields);
      setListLayoutFields(visibleListLayoutFields);
      setCreateLayoutFields(
        buildFieldsFromLayout({
          fields: activeFields,
          layouts: createLayouts,
        }),
      );
      setOptionsByFieldId(Object.fromEntries(optionEntries));
    } catch {
      enqueueErrorSnackBar({ message: '鏃犳硶鍔犺浇瀹㈡埛浼佷笟瀛楁瀹氫箟' });
    } finally {
      setIsLoading(false);
    }
  }, [enqueueErrorSnackBar, enterpriseApiRequest]);

  useEffect(() => {
    void loadEnterpriseCustomerFieldDefinitions();
  }, [loadEnterpriseCustomerFieldDefinitions]);

  return {
    createFields: createLayoutFields,
    fields,
    isLoading,
    listFields:
      listLayoutFields.length > 0
        ? listLayoutFields
        : fields.filter((field) => field.searchable).slice(0, 2),
    optionsByFieldId,
    refresh: loadEnterpriseCustomerFieldDefinitions,
    searchableFields: fields.filter((field) => field.searchable),
  };
};

export const getTradeCrmEnterpriseCustomerFieldDisplayValue = ({
  field,
  options,
  value,
}: {
  field: TradeCrmEnterpriseCustomerField;
  options: TradeCrmEnterpriseCustomerFieldOption[];
  value: TradeCrmEnterpriseCustomerFieldDraftValue | undefined;
}) => {
  if (value === undefined || value === '') {
    return '';
  }

  if (field.fieldType === 'boolean') {
    return value === true || value === 'true' ? 'Yes' : 'No';
  }

  if (field.fieldType === 'multiSelect') {
    const values = Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean);

    return values
      .map(
        (entry) =>
          options.find((option) => option.optionCode === entry)?.optionLabel ??
          entry,
      )
      .join(', ');
  }

  if (field.fieldType === 'select') {
    return (
      options.find((option) => option.optionCode === value)?.optionLabel ??
      String(value)
    );
  }

  return String(getDraftValueFromRecordValue({
    fieldDefinitionId: field.id,
    valueBoolean: typeof value === 'boolean' ? value : null,
    valueDate: null,
    valueJson: value,
    valueNumber: null,
    valueString: typeof value === 'string' ? value : null,
    valueStringArray: Array.isArray(value) ? value : null,
  }));
};

export const useTradeCrmEnterpriseCustomerListFields = (recordIds: string[]) => {
  const enterpriseApiRequest = useEnterpriseApiRequest();
  const { enqueueErrorSnackBar } = useSnackBar();
  const [fields, setFields] = useState<TradeCrmEnterpriseCustomerField[]>([]);
  const [optionsByFieldId, setOptionsByFieldId] = useState<
    Record<string, TradeCrmEnterpriseCustomerFieldOption[]>
  >({});
  const [valuesByRecordId, setValuesByRecordId] =
    useState<TradeCrmEnterpriseCustomerFieldValuesByRecordId>({});
  const [isLoading, setIsLoading] = useState(false);
  const recordIdKey = useMemo(
    () => recordIds.filter(Boolean).slice(0, 50).sort().join('|'),
    [recordIds],
  );

  const loadEnterpriseCustomerListFields = useCallback(async () => {
    const targetRecordIds = recordIdKey.length > 0 ? recordIdKey.split('|') : [];

    if (targetRecordIds.length === 0) {
      setFields([]);
      setOptionsByFieldId({});
      setValuesByRecordId({});

      return;
    }

    setIsLoading(true);

    try {
      const fieldsResponse = await enterpriseApiRequest(
        '/api/enterprise/fields?entityType=customer',
        { credentials: 'include' },
      );

      if (!fieldsResponse.ok) {
        throw new Error('Failed to load enterprise customer fields');
      }

      const loadedFields =
        (await fieldsResponse.json()) as TradeCrmEnterpriseCustomerField[];
      const activeFields = loadedFields.filter((field) => field.enabled);
      const optionEntries = await Promise.all(
        activeFields
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
      const recordIdParams = new URLSearchParams();

      recordIdParams.set('recordIds', targetRecordIds.join(','));

      const valuesResponse = await enterpriseApiRequest(
        `/api/enterprise/records/customer/field-values?${recordIdParams.toString()}`,
        { credentials: 'include' },
      );

      if (!valuesResponse.ok) {
        throw new Error('Failed to load enterprise customer field values');
      }

      const batchValues =
        (await valuesResponse.json()) as EnterpriseCustomerBatchFieldValueResponse;

      setFields(activeFields);
      setOptionsByFieldId(Object.fromEntries(optionEntries));
      setValuesByRecordId(
        Object.fromEntries(
          targetRecordIds.map((recordId) => [
            recordId,
            Object.fromEntries(
              (batchValues.valuesByRecordId[recordId] ?? []).map((value) => [
                value.fieldDefinitionId,
                getDraftValueFromRecordValue(value),
              ]),
            ),
          ]),
        ),
      );
    } catch {
      enqueueErrorSnackBar({ message: '无法加载客户列表企业字段' });
    } finally {
      setIsLoading(false);
    }
  }, [enqueueErrorSnackBar, enterpriseApiRequest, recordIdKey]);

  useEffect(() => {
    void loadEnterpriseCustomerListFields();
  }, [loadEnterpriseCustomerListFields]);

  return {
    fields,
    isLoading,
    optionsByFieldId,
    refresh: loadEnterpriseCustomerListFields,
    searchableFields: fields.filter((field) => field.searchable),
    valuesByRecordId,
  };
};
