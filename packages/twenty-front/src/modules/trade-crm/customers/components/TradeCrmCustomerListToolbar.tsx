import { styled } from '@linaria/react';

import {
  type TradeCrmEnterpriseCustomerField,
  type TradeCrmEnterpriseCustomerFieldOption,
} from '@/trade-crm/customers/hooks/useTradeCrmEnterpriseCustomerFields';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type CustomerFilterState = {
  searchTerm: string;
  source: string | null;
  stage: string | null;
  tag: string | null;
};

type CustomerSummaryItem = {
  count: number;
  label: string;
};

type TradeCrmCustomerListToolbarProps = {
  customerSourceSummary: CustomerSummaryItem[];
  customerStageSummary: CustomerSummaryItem[];
  customerTagSummary: CustomerSummaryItem[];
  enterpriseFieldFilters: Record<string, string>;
  filteredCompanyCount: number;
  filteredPeopleCount: number;
  filters: CustomerFilterState;
  isEnterpriseFieldDefinitionLoading: boolean;
  isEnterpriseListFieldLoading: boolean;
  onEnterpriseFieldFiltersChange: (filters: Record<string, string>) => void;
  onFiltersChange: (filters: CustomerFilterState) => void;
  optionsByFieldId: Record<string, TradeCrmEnterpriseCustomerFieldOption[]>;
  searchableEnterpriseFields: TradeCrmEnterpriseCustomerField[];
};

const StyledToolbar = styled.div`
  align-items: center;
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledSearchInput = styled.input`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  flex: 1 1 260px;
  font: inherit;
  min-height: 40px;
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledFilterButton = styled.button<{ $active?: boolean }>`
  background: ${({ $active }) =>
    $active
      ? tradeCrmUiTheme.colors.surfaceInteractive
      : tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid
    ${({ $active }) =>
      $active
        ? tradeCrmUiTheme.colors.borderInteractive
        : tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${tradeCrmUiTheme.colors.ink};
  cursor: pointer;
  font: inherit;
  padding: 7px 12px;
`;

const StyledSelect = styled.select`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  font: inherit;
  min-height: 40px;
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledFilterSummary = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  margin-left: auto;
`;

export const TradeCrmCustomerListToolbar = ({
  customerSourceSummary,
  customerStageSummary,
  customerTagSummary,
  enterpriseFieldFilters,
  filteredCompanyCount,
  filteredPeopleCount,
  filters,
  isEnterpriseFieldDefinitionLoading,
  isEnterpriseListFieldLoading,
  onEnterpriseFieldFiltersChange,
  onFiltersChange,
  optionsByFieldId,
  searchableEnterpriseFields,
}: TradeCrmCustomerListToolbarProps) => (
  <StyledToolbar>
    <StyledSearchInput
      value={filters.searchTerm}
      onChange={(event) =>
        onFiltersChange({
          ...filters,
          searchTerm: event.target.value,
        })
      }
      placeholder="Search company, owner, email, phone, country, or tags"
    />
    <StyledFilterButton
      $active={filters.stage === null}
      type="button"
      onClick={() =>
        onFiltersChange({
          ...filters,
          stage: null,
        })
      }
    >
      All stages
    </StyledFilterButton>
    {customerStageSummary.slice(0, 3).map((item) => (
      <StyledFilterButton
        key={item.label}
        $active={filters.stage === item.label}
        type="button"
        onClick={() =>
          onFiltersChange({
            ...filters,
            stage: filters.stage === item.label ? null : item.label,
          })
        }
      >
        {item.label}
      </StyledFilterButton>
    ))}
    {customerSourceSummary.slice(0, 2).map((item) => (
      <StyledFilterButton
        key={item.label}
        $active={filters.source === item.label}
        type="button"
        onClick={() =>
          onFiltersChange({
            ...filters,
            source: filters.source === item.label ? null : item.label,
          })
        }
      >
        {item.label}
      </StyledFilterButton>
    ))}
    {customerTagSummary.slice(0, 2).map((item) => (
      <StyledFilterButton
        key={item.label}
        $active={filters.tag === item.label}
        type="button"
        onClick={() =>
          onFiltersChange({
            ...filters,
            tag: filters.tag === item.label ? null : item.label,
          })
        }
      >
        {item.label}
      </StyledFilterButton>
    ))}
    {searchableEnterpriseFields.slice(0, 4).map((field) => {
      const options = optionsByFieldId[field.id] ?? [];
      const value = enterpriseFieldFilters[field.id] ?? '';

      if (field.fieldType === 'select' || field.fieldType === 'boolean') {
        return (
          <StyledSelect
            key={field.id}
            value={value}
            onChange={(event) =>
              onEnterpriseFieldFiltersChange({
                ...enterpriseFieldFilters,
                [field.id]: event.target.value,
              })
            }
          >
            <option value="">{field.fieldName}: All</option>
            {field.fieldType === 'boolean' ? (
              <>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </>
            ) : (
              options.map((option) => (
                <option key={option.optionCode} value={option.optionCode}>
                  {option.optionLabel}
                </option>
              ))
            )}
          </StyledSelect>
        );
      }

      return (
        <StyledSearchInput
          key={field.id}
          value={value}
          onChange={(event) =>
            onEnterpriseFieldFiltersChange({
              ...enterpriseFieldFilters,
              [field.id]: event.target.value,
            })
          }
          placeholder={`${field.fieldName} filter`}
        />
      );
    })}
    {Object.values(enterpriseFieldFilters).some(
      (value) => value.trim().length > 0,
    ) ? (
      <StyledFilterButton
        $active
        type="button"
        onClick={() => onEnterpriseFieldFiltersChange({})}
      >
        Clear enterprise fields
      </StyledFilterButton>
    ) : null}
    <StyledFilterSummary>
      {filteredCompanyCount} companies / {filteredPeopleCount} contacts visible
      {isEnterpriseFieldDefinitionLoading || isEnterpriseListFieldLoading
        ? ' / enterprise fields loading'
        : ''}
    </StyledFilterSummary>
  </StyledToolbar>
);
