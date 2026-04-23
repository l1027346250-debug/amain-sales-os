import { act, renderHook, waitFor } from '@testing-library/react';

import { useEnterpriseApiRequest } from '@/enterprise/shared/hooks/useEnterpriseApiRequest';
import { useEnterpriseCustomerExportFields } from '~/pages/enterprise/customer-export/hooks/useEnterpriseCustomerExportFields';

jest.mock('@/enterprise/shared/hooks/useEnterpriseApiRequest', () => ({
  useEnterpriseApiRequest: jest.fn(),
}));

const createJsonResponse = (body: unknown, ok = true) =>
  ({
    ok,
    json: jest.fn(async () => body),
  }) as unknown as Response;

const customerFields = [
  {
    id: 'text-field',
    fieldCode: 'industry',
    fieldName: 'Industry',
    fieldType: 'text',
    enabled: true,
    exportable: true,
    groupCode: null,
    searchable: true,
    sortOrder: 1,
  },
  {
    id: 'select-field',
    fieldCode: 'segment',
    fieldName: 'Segment',
    fieldType: 'select',
    enabled: true,
    exportable: true,
    groupCode: null,
    searchable: true,
    sortOrder: 2,
  },
  {
    id: 'multi-select-field',
    fieldCode: 'certifications',
    fieldName: 'Certifications',
    fieldType: 'multiSelect',
    enabled: true,
    exportable: false,
    groupCode: null,
    searchable: true,
    sortOrder: 3,
  },
  {
    id: 'number-field',
    fieldCode: 'employeeCount',
    fieldName: 'Employee Count',
    fieldType: 'number',
    enabled: true,
    exportable: true,
    groupCode: null,
    searchable: true,
    sortOrder: 4,
  },
  {
    id: 'disabled-field',
    fieldCode: 'disabled',
    fieldName: 'Disabled',
    fieldType: 'text',
    enabled: false,
    exportable: true,
    groupCode: null,
    searchable: true,
    sortOrder: 5,
  },
];

describe('useEnterpriseCustomerExportFields', () => {
  const enterpriseApiRequestMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useEnterpriseApiRequest as jest.Mock).mockReturnValue(
      enterpriseApiRequestMock,
    );

    enterpriseApiRequestMock.mockImplementation(async (url: string) => {
      if (url === '/api/enterprise/fields?entityType=customer') {
        return createJsonResponse(customerFields);
      }

      if (url === '/api/enterprise/fields/select-field/options') {
        return createJsonResponse([
          {
            id: 'segment-b',
            fieldDefinitionId: 'select-field',
            optionCode: 'b',
            optionLabel: 'B label',
            enabled: true,
            sortOrder: 2,
          },
          {
            id: 'segment-disabled',
            fieldDefinitionId: 'select-field',
            optionCode: 'disabled',
            optionLabel: 'Disabled label',
            enabled: false,
            sortOrder: 1,
          },
          {
            id: 'segment-a',
            fieldDefinitionId: 'select-field',
            optionCode: 'a',
            optionLabel: 'A label',
            enabled: true,
            sortOrder: 1,
          },
        ]);
      }

      if (url === '/api/enterprise/fields/multi-select-field/options') {
        return createJsonResponse([
          {
            id: 'cert-x',
            fieldDefinitionId: 'multi-select-field',
            optionCode: 'x',
            optionLabel: 'X label',
            enabled: true,
            sortOrder: 1,
          },
        ]);
      }

      return createJsonResponse(null, false);
    });
  });

  it('loads exportable fields and searchable filter metadata', async () => {
    const { result } = renderHook(() => useEnterpriseCustomerExportFields());

    await act(async () => {
      await result.current.loadFieldOptions();
    });

    await waitFor(() => {
      expect(result.current.fieldOptions.map((field) => field.fieldCode)).toEqual(
        [
          'name',
          'domainName',
          'accountOwnerId',
          'createdAt',
          'industry',
          'segment',
          'employeeCount',
        ],
      );
    });

    expect(
      result.current.enterpriseFilterFields.map((field) => field.fieldCode),
    ).toEqual(['industry', 'segment', 'certifications', 'employeeCount']);
    expect(
      result.current.enterpriseFilterFieldOptionsByFieldId[
        'select-field'
      ].map((option) => option.optionCode),
    ).toEqual(['a', 'b']);
    expect(
      result.current.enterpriseFilterFieldOptionsByFieldId[
        'multi-select-field'
      ].map((option) => option.optionCode),
    ).toEqual(['x']);
  });

  it('builds summaries and payload from enterprise field filters', async () => {
    const { result } = renderHook(() => useEnterpriseCustomerExportFields());

    await act(async () => {
      await result.current.loadFieldOptions();
    });

    act(() => {
      result.current.updateEnterpriseFilterValue('text-field', '  ACME  ');
      result.current.updateEnterpriseFilterValue('select-field', 'a');
      result.current.updateEnterpriseFilterValue('multi-select-field', ['x']);
    });

    expect(result.current.activeEnterpriseFilterSummaries).toEqual([
      { fieldId: 'text-field', label: 'Industry: ACME' },
      { fieldId: 'select-field', label: 'Segment: A label' },
      { fieldId: 'multi-select-field', label: 'Certifications: X label' },
    ]);
    expect(result.current.getEnterpriseFieldFilters()).toEqual([
      {
        fieldDefinitionId: 'text-field',
        operator: 'contains',
        value: 'ACME',
      },
      {
        fieldDefinitionId: 'select-field',
        operator: 'equals',
        value: 'a',
      },
      {
        fieldDefinitionId: 'multi-select-field',
        operator: 'equals',
        value: ['x'],
      },
    ]);
  });

  it('reports validation errors and can clear filters', async () => {
    const { result } = renderHook(() => useEnterpriseCustomerExportFields());

    await act(async () => {
      await result.current.loadFieldOptions();
    });

    act(() => {
      result.current.updateEnterpriseFilterValue('number-field', 'not-a-number');
    });

    expect(result.current.hasEnterpriseFilterValidationErrors).toBe(true);
    expect(
      result.current.enterpriseFilterValidationMessages['number-field'],
    ).not.toBeNull();

    act(() => {
      result.current.clearEnterpriseFilterValues();
    });

    expect(result.current.getEnterpriseFieldFilters()).toEqual([]);
    expect(result.current.hasEnterpriseFilterValidationErrors).toBe(false);
  });
});
