import { styled } from '@linaria/react';

import { TradeCrmEnterpriseCustomerFieldInput } from '@/trade-crm/customers/components/TradeCrmEnterpriseCustomerFieldInput';
import {
  type TradeCrmEnterpriseCustomerFieldDraftValue,
  type TradeCrmEnterpriseCustomerFieldOption,
} from '@/trade-crm/customers/hooks/useTradeCrmEnterpriseCustomerFields';
import {
  type EnterpriseCustomerExportEnterpriseField,
  type EnterpriseCustomerExportFilterSummary,
} from '~/pages/enterprise/customer-export/types/enterprise-customer-export.types';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type EnterpriseCustomerExportEnterpriseFilterSectionProps = {
  activeFilterSummaries: EnterpriseCustomerExportFilterSummary[];
  fields: EnterpriseCustomerExportEnterpriseField[];
  fieldOptionsByFieldId: Record<string, TradeCrmEnterpriseCustomerFieldOption[]>;
  filterValues: Record<string, TradeCrmEnterpriseCustomerFieldDraftValue>;
  validationMessages: Record<string, string | null>;
  onClearFilters: () => void;
  onFilterValueChange: (
    fieldId: string,
    value: TradeCrmEnterpriseCustomerFieldDraftValue,
  ) => void;
};

const StyledTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledSectionHeader = styled.div`
  align-items: flex-start;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
`;

const StyledFilterSummary = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledFilterChip = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledFormGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: 1fr 280px 220px auto;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const StyledField = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledLabel = styled.span`
  color: ${themeCssVariables.font.color.light};
  font-size: ${themeCssVariables.font.size.sm};
`;

export const EnterpriseCustomerExportEnterpriseFilterSection = ({
  activeFilterSummaries,
  fields,
  fieldOptionsByFieldId,
  filterValues,
  validationMessages,
  onClearFilters,
  onFilterValueChange,
}: EnterpriseCustomerExportEnterpriseFilterSectionProps) => {
  if (fields.length === 0) {
    return null;
  }

  return (
    <>
      <StyledSectionHeader>
        <div>
          <StyledTitle>企业字段筛选</StyledTitle>
          <StyledHint>
            这些条件会同时影响数量预估和后台导出范围，仅展示 searchable=true 的企业字段。
          </StyledHint>
        </div>
        <Button
          disabled={activeFilterSummaries.length === 0}
          title="清空企业字段筛选"
          onClick={onClearFilters}
        />
      </StyledSectionHeader>

      {activeFilterSummaries.length > 0 ? (
        <StyledFilterSummary>
          {activeFilterSummaries.map((summary) => (
            <StyledFilterChip key={summary.fieldId}>
              {summary.label}
            </StyledFilterChip>
          ))}
        </StyledFilterSummary>
      ) : (
        <StyledHint>当前未启用企业字段筛选。</StyledHint>
      )}

      <StyledFormGrid>
        {fields.slice(0, 6).map((field) => {
          const value = filterValues[field.id];
          const options = fieldOptionsByFieldId[field.id] ?? [];

          return (
            <StyledField key={field.id}>
              <StyledLabel>{field.fieldName}</StyledLabel>
              <TradeCrmEnterpriseCustomerFieldInput
                field={{
                  ...field,
                  readonly: false,
                  required: false,
                }}
                noOptionsFallback={
                  <StyledHint>
                    此字段还没有配置选项，请先到字段中心维护选项。
                  </StyledHint>
                }
                options={options}
                selectEmptyLabel="全部"
                value={value}
                validationMessage={validationMessages[field.id]}
                onChange={(nextValue) =>
                  onFilterValueChange(field.id, nextValue)
                }
              />
            </StyledField>
          );
        })}
      </StyledFormGrid>
    </>
  );
};
