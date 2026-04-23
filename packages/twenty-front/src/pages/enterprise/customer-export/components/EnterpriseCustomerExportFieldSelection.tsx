import { styled } from '@linaria/react';

import { type EnterpriseCustomerExportFieldOption } from '~/pages/enterprise/customer-export/types/enterprise-customer-export.types';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type EnterpriseCustomerExportFieldSelectionProps = {
  fieldOptions: EnterpriseCustomerExportFieldOption[];
  selectedFieldCodes: string[];
  onSelectedFieldCodesChange: (selectedFieldCodes: string[]) => void;
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

const StyledMultiSelect = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const StyledFieldOption = styled.label`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  display: inline-flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

export const EnterpriseCustomerExportFieldSelection = ({
  fieldOptions,
  selectedFieldCodes,
  onSelectedFieldCodesChange,
}: EnterpriseCustomerExportFieldSelectionProps) => {
  const selectedFieldCodeSet = new Set(selectedFieldCodes);

  const toggleFieldCode = (fieldCode: string, checked: boolean) => {
    if (checked) {
      onSelectedFieldCodesChange(
        Array.from(new Set([...selectedFieldCodes, fieldCode])),
      );

      return;
    }

    if (selectedFieldCodes.length <= 1) {
      return;
    }

    onSelectedFieldCodesChange(
      selectedFieldCodes.filter(
        (selectedFieldCode) => selectedFieldCode !== fieldCode,
      ),
    );
  };

  return (
    <>
      <div>
        <StyledTitle>导出字段</StyledTitle>
        <StyledHint>
          基础字段和企业管理自定义字段可以混合导出。至少保留一个字段。
        </StyledHint>
      </div>

      <StyledMultiSelect>
        {fieldOptions.map((field) => {
          const checked = selectedFieldCodeSet.has(field.fieldCode);

          return (
            <StyledFieldOption key={field.fieldCode}>
              <input
                checked={checked}
                disabled={checked && selectedFieldCodes.length <= 1}
                type="checkbox"
                onChange={(event) =>
                  toggleFieldCode(field.fieldCode, event.target.checked)
                }
              />
              <span>{field.fieldName}</span>
            </StyledFieldOption>
          );
        })}
      </StyledMultiSelect>
    </>
  );
};
