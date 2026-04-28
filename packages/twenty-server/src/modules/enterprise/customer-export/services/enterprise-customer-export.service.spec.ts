import { EnterpriseCustomerExportService } from 'src/modules/enterprise/customer-export/services/enterprise-customer-export.service';
import { EnterpriseFieldDefinitionEntity } from 'src/modules/enterprise/field-definition/enterprise-field-definition.entity';
import { EnterpriseFieldType } from 'src/modules/enterprise/shared/types/enterprise-field-type';

type EnterpriseCustomerExportServiceAccessor = {
  findCustomerIdsByEnterpriseFieldFilters: (
    workspaceId: string,
    filters: Array<{
      fieldDefinitionId: string;
      operator: 'contains' | 'equals' | 'isEmpty' | 'isNotEmpty';
      value?: unknown;
    }>,
  ) => Promise<string[] | null>;
};

const workspaceId = '20202020-0000-4000-8000-000000000000';
const entityBindingId = '30303030-0000-4000-8000-000000000000';

const createFieldDefinition = ({
  fieldType,
  id,
  searchable = true,
}: {
  fieldType: EnterpriseFieldType;
  id: string;
  searchable?: boolean;
}) =>
  ({
    id,
    entityBindingId,
    fieldCode: id,
    fieldName: id,
    fieldType,
    searchable,
    enabled: true,
    exportable: true,
    deletedAt: null,
  }) as EnterpriseFieldDefinitionEntity;

const createQueryBuilderMock = () => {
  const queryBuilder = {
    andWhere: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([{ recordId: 'record-1' }]),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
  };

  return queryBuilder;
};

const createService = ({
  fields,
  queryBuilder,
}: {
  fields: EnterpriseFieldDefinitionEntity[];
  queryBuilder?: ReturnType<typeof createQueryBuilderMock>;
}) => {
  const enterpriseFieldValueRepository = {
    createQueryBuilder: jest.fn(() => queryBuilder ?? createQueryBuilderMock()),
  };
  const enterpriseEntityBindingService = {
    resolveBindingOrFail: jest.fn().mockResolvedValue({ id: entityBindingId }),
  };
  const enterpriseFieldDefinitionService = {
    findMany: jest.fn().mockResolvedValue(fields),
  };

  const service = new EnterpriseCustomerExportService(
    {} as never,
    enterpriseFieldValueRepository as never,
    {} as never,
    {} as never,
    {} as never,
    enterpriseEntityBindingService as never,
    enterpriseFieldDefinitionService as never,
    {} as never,
    {} as never,
    {} as never,
  ) as unknown as EnterpriseCustomerExportServiceAccessor;

  return {
    enterpriseEntityBindingService,
    enterpriseFieldDefinitionService,
    enterpriseFieldValueRepository,
    service,
  };
};

describe('EnterpriseCustomerExportService enterprise field filters', () => {
  it.each([
    {
      fieldType: EnterpriseFieldType.TEXT,
      operator: 'contains' as const,
      sql: 'fieldValue.valueString ILIKE :stringValue',
      value: 'Acme',
      params: { stringValue: '%Acme%' },
    },
    {
      fieldType: EnterpriseFieldType.SELECT,
      operator: 'equals' as const,
      sql: 'fieldValue.valueString = :stringValue',
      value: 'vip',
      params: { stringValue: 'vip' },
    },
    {
      fieldType: EnterpriseFieldType.NUMBER,
      operator: 'equals' as const,
      sql: 'fieldValue.valueNumber = :numberValue',
      value: '42',
      params: { numberValue: 42 },
    },
    {
      fieldType: EnterpriseFieldType.BOOLEAN,
      operator: 'equals' as const,
      sql: 'fieldValue.valueBoolean = :booleanValue',
      value: 'true',
      params: { booleanValue: true },
    },
    {
      fieldType: EnterpriseFieldType.DATE,
      operator: 'equals' as const,
      sql: 'fieldValue.valueDate::date = :dateValue::date',
      value: '2026-04-22',
      params: { dateValue: '2026-04-22' },
    },
    {
      fieldType: EnterpriseFieldType.MULTI_SELECT,
      operator: 'equals' as const,
      sql: 'fieldValue.valueStringArray && :arrayValue',
      value: ['vip', 'north-america'],
      params: { arrayValue: ['vip', 'north-america'] },
    },
  ])(
    'should apply $fieldType enterprise field filter to customer export scope',
    async ({ fieldType, operator, params, sql, value }) => {
      const fieldDefinitionId = `${fieldType}-field`;
      const queryBuilder = createQueryBuilderMock();
      const { service } = createService({
        fields: [
          createFieldDefinition({
            fieldType,
            id: fieldDefinitionId,
          }),
        ],
        queryBuilder,
      });

      const recordIds =
        await service.findCustomerIdsByEnterpriseFieldFilters(workspaceId, [
          {
            fieldDefinitionId,
            operator,
            value,
          },
        ]);

      expect(recordIds).toEqual(['record-1']);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(sql, params);
    },
  );

  it('should reject non-searchable enterprise field filters by returning no matching customer ids', async () => {
    const queryBuilder = createQueryBuilderMock();
    const { enterpriseFieldValueRepository, service } = createService({
      fields: [
        createFieldDefinition({
          fieldType: EnterpriseFieldType.TEXT,
          id: 'internal-score-field',
          searchable: false,
        }),
      ],
      queryBuilder,
    });

    const recordIds =
      await service.findCustomerIdsByEnterpriseFieldFilters(workspaceId, [
        {
          fieldDefinitionId: 'internal-score-field',
          operator: 'contains',
          value: 'secret',
        },
      ]);

    expect(recordIds).toEqual([]);
    expect(enterpriseFieldValueRepository.createQueryBuilder).not.toHaveBeenCalled();
  });
});
