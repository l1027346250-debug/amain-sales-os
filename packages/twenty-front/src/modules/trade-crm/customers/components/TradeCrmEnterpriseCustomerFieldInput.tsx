import { styled } from '@linaria/react';
import { type ReactNode } from 'react';

import {
  type TradeCrmEnterpriseCustomerFieldDraftValue,
  type TradeCrmEnterpriseCustomerFieldOption,
  type TradeCrmEnterpriseCustomerFieldWithLayout,
} from '@/trade-crm/customers/hooks/useTradeCrmEnterpriseCustomerFields';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type TradeCrmEnterpriseCustomerFieldInputProps = {
  field: TradeCrmEnterpriseCustomerFieldWithLayout;
  noOptionsFallback?: ReactNode;
  onChange: (value: TradeCrmEnterpriseCustomerFieldDraftValue) => void;
  options: TradeCrmEnterpriseCustomerFieldOption[];
  selectEmptyLabel?: string;
  value: TradeCrmEnterpriseCustomerFieldDraftValue | undefined;
  validationMessage?: ReactNode;
};

const StyledFieldTextArea = styled.textarea`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  font: inherit;
  min-height: 82px;
  padding: ${themeCssVariables.spacing[3]};
  resize: vertical;
  width: 100%;
`;

const StyledFieldInput = styled.input`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  font: inherit;
  min-height: 40px;
  padding: 0 ${themeCssVariables.spacing[3]};
  width: 100%;
`;

const StyledFieldSelect = styled.select`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  font: inherit;
  min-height: 40px;
  padding: 0 ${themeCssVariables.spacing[3]};
  width: 100%;
`;

const StyledOptionChecklist = styled.div`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  min-height: 40px;
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledOptionCheckbox = styled.label`
  align-items: center;
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${tradeCrmUiTheme.colors.ink};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: 6px;
  padding: 5px 10px;
`;

const StyledFieldHint = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
`;

const StyledValidationMessage = styled.div`
  color: #b42318;
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
  margin-top: ${themeCssVariables.spacing[1]};
`;

const renderValidationMessage = (validationMessage: ReactNode) =>
  validationMessage ? (
    <StyledValidationMessage>{validationMessage}</StyledValidationMessage>
  ) : null;

const getDraftText = (
  value: TradeCrmEnterpriseCustomerFieldDraftValue | undefined,
) => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  return value ?? '';
};

const getDraftStringArray = (
  value: TradeCrmEnterpriseCustomerFieldDraftValue | undefined,
) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
};

export const isTradeCrmEnterpriseCustomerFieldDraftValueEmpty = (
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

export const getTradeCrmEnterpriseCustomerFieldValidationMessage = ({
  field,
  options,
  value,
}: {
  field: TradeCrmEnterpriseCustomerFieldWithLayout;
  options: TradeCrmEnterpriseCustomerFieldOption[];
  value: TradeCrmEnterpriseCustomerFieldDraftValue | undefined;
}) => {
  if (field.readonly) {
    return null;
  }

  if (
    field.required &&
    isTradeCrmEnterpriseCustomerFieldDraftValueEmpty(value)
  ) {
    return `${field.fieldName} is required.`;
  }

  if (isTradeCrmEnterpriseCustomerFieldDraftValueEmpty(value)) {
    return null;
  }

  if (
    field.fieldType === 'multiSelect' &&
    options.length === 0
  ) {
    return `${field.fieldName} has no configured options.`;
  }

  if (field.fieldType === 'number' && typeof value === 'string') {
    const normalizedValue = value.trim();

    if (Number.isNaN(Number(normalizedValue))) {
      return `${field.fieldName} must be a valid number.`;
    }
  }

  if (field.fieldType === 'date' && typeof value === 'string') {
    const normalizedValue = value.trim();
    const dateValue = new Date(`${normalizedValue}T00:00:00`);

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue) ||
      Number.isNaN(dateValue.getTime())
    ) {
      return `${field.fieldName} must be a valid date.`;
    }
  }

  return null;
};

export const TradeCrmEnterpriseCustomerFieldInput = ({
  field,
  noOptionsFallback,
  onChange,
  options,
  selectEmptyLabel = 'Unselected',
  value,
  validationMessage,
}: TradeCrmEnterpriseCustomerFieldInputProps) => {
  const hasValidationError = Boolean(validationMessage);

  if (field.fieldType === 'textarea') {
    return (
      <>
        <StyledFieldTextArea
          aria-invalid={hasValidationError}
          disabled={field.readonly}
          required={field.required}
          value={getDraftText(value)}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.fieldName}
        />
        {renderValidationMessage(validationMessage)}
      </>
    );
  }

  if (field.fieldType === 'select') {
    return (
      <>
        <StyledFieldSelect
          aria-invalid={hasValidationError}
          disabled={field.readonly}
          required={field.required}
          value={getDraftText(value)}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{selectEmptyLabel}</option>
          {options.map((option) => (
            <option key={option.optionCode} value={option.optionCode}>
              {option.optionLabel}
            </option>
          ))}
        </StyledFieldSelect>
        {renderValidationMessage(validationMessage)}
      </>
    );
  }

  if (field.fieldType === 'boolean') {
    return (
      <>
        <StyledFieldSelect
          aria-invalid={hasValidationError}
          disabled={field.readonly}
          required={field.required}
          value={getDraftText(value)}
          onChange={(event) =>
            onChange(
              event.target.value === '' ? '' : event.target.value === 'true',
            )
          }
        >
          <option value="">{selectEmptyLabel}</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </StyledFieldSelect>
        {renderValidationMessage(validationMessage)}
      </>
    );
  }

  if (field.fieldType === 'multiSelect') {
    const selectedOptionCodes = getDraftStringArray(value);

    return (
      <>
        <StyledOptionChecklist aria-invalid={hasValidationError}>
          {options.length > 0
            ? options.map((option) => {
                const isChecked = selectedOptionCodes.includes(
                  option.optionCode,
                );

                return (
                  <StyledOptionCheckbox key={option.optionCode}>
                    <input
                      checked={isChecked}
                      disabled={field.readonly}
                      type="checkbox"
                      onChange={(event) => {
                        const nextOptionCodes = event.target.checked
                          ? [...selectedOptionCodes, option.optionCode]
                          : selectedOptionCodes.filter(
                              (selectedOptionCode) =>
                                selectedOptionCode !== option.optionCode,
                            );

                        onChange(nextOptionCodes);
                      }}
                    />
                    <span>{option.optionLabel}</span>
                  </StyledOptionCheckbox>
                );
              })
            : (noOptionsFallback ?? (
                <StyledFieldHint>
                  No options configured for {field.fieldName}.
                </StyledFieldHint>
              ))}
        </StyledOptionChecklist>
        {renderValidationMessage(validationMessage)}
      </>
    );
  }

  return (
    <>
      <StyledFieldInput
        aria-invalid={hasValidationError}
        disabled={field.readonly}
        required={field.required}
        type={
          field.fieldType === 'number'
            ? 'number'
            : field.fieldType === 'date'
              ? 'date'
              : 'text'
        }
        value={getDraftText(value)}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.fieldName}
      />
      {renderValidationMessage(validationMessage)}
    </>
  );
};
