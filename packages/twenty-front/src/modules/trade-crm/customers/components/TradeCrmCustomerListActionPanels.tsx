import { styled } from '@linaria/react';

import { TradeCrmEnterpriseCustomerFieldInput } from '@/trade-crm/customers/components/TradeCrmEnterpriseCustomerFieldInput';
import {
  type TradeCrmEnterpriseCustomerFieldDraftValue,
  type TradeCrmEnterpriseCustomerFieldOption,
  type TradeCrmEnterpriseCustomerFieldWithLayout,
} from '@/trade-crm/customers/hooks/useTradeCrmEnterpriseCustomerFields';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type TradeCrmCustomerCreateCustomerActionPanelProps = {
  canCreateCustomer: boolean;
  createFields: TradeCrmEnterpriseCustomerFieldWithLayout[];
  hasInvalidCreateEnterpriseField: boolean;
  isCreatingCustomer: boolean;
  newCustomerEnterpriseFieldValues: Record<
    string,
    TradeCrmEnterpriseCustomerFieldDraftValue
  >;
  newCustomerName: string;
  onCreateCustomer: () => void;
  onNewCustomerNameChange: (value: string) => void;
  onUpdateEnterpriseFieldValue: (
    fieldDefinitionId: string,
    value: TradeCrmEnterpriseCustomerFieldDraftValue,
  ) => void;
  optionsByFieldId: Record<string, TradeCrmEnterpriseCustomerFieldOption[]>;
  validationMessagesByFieldId: Record<string, string | null>;
};

type TradeCrmCustomerLeadConversionActionPanelProps = {
  canConvertLead: boolean;
  isConvertingLead: boolean;
  leadIdToConvert: string;
  onConvertLead: () => void;
  onLeadIdToConvertChange: (value: string) => void;
};

type TradeCrmCustomerMoveVisibleToPublicPoolActionPanelProps = {
  canMoveVisibleCustomersToPublicPool: boolean;
  isMovingVisibleCustomersToPublicPool: boolean;
  onMoveVisibleCustomersToPublicPool: () => void;
  visibleCustomerCount: number;
};

const StyledActionBar = styled.div`
  align-items: flex-start;
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledActionMeta = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 560px;
`;

const StyledActionButtons = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledActionFieldGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  width: 100%;
`;

const StyledTextInput = styled.input`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  font: inherit;
  min-height: 40px;
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledControlButton = styled.button<{
  $tone?: 'primary' | 'neutral' | 'danger';
}>`
  background: ${({ $tone }) =>
    $tone === 'primary'
      ? tradeCrmUiTheme.colors.borderStrong
      : $tone === 'danger'
        ? tradeCrmUiTheme.colors.surfaceInteractive
        : tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'primary'
        ? tradeCrmUiTheme.colors.borderStrong
        : $tone === 'danger'
          ? tradeCrmUiTheme.colors.borderInteractive
          : tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${({ $tone }) =>
    $tone === 'primary'
      ? tradeCrmUiTheme.colors.surface
      : tradeCrmUiTheme.colors.ink};
  cursor: pointer;
  font: inherit;
  padding: 8px 14px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const StyledField = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledFieldLabel = styled.span`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledConfigNote = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

export const TradeCrmCustomerCreateCustomerActionPanel = ({
  canCreateCustomer,
  createFields,
  hasInvalidCreateEnterpriseField,
  isCreatingCustomer,
  newCustomerEnterpriseFieldValues,
  newCustomerName,
  onCreateCustomer,
  onNewCustomerNameChange,
  onUpdateEnterpriseFieldValue,
  optionsByFieldId,
  validationMessagesByFieldId,
}: TradeCrmCustomerCreateCustomerActionPanelProps) => (
  <StyledActionBar>
    <StyledActionMeta>
      <span>Create company customer</span>
      <span>
        Company is the formal customer master; contacts stay subordinate and can
        be added from the detail workspace.
      </span>
    </StyledActionMeta>
    <StyledActionButtons>
      <StyledTextInput
        value={newCustomerName}
        onChange={(event) => onNewCustomerNameChange(event.target.value)}
        placeholder="Company name"
      />
      <StyledControlButton
        $tone="primary"
        disabled={!canCreateCustomer}
        type="button"
        onClick={onCreateCustomer}
      >
        {isCreatingCustomer ? 'Creating...' : 'Create Customer'}
      </StyledControlButton>
    </StyledActionButtons>
    {createFields.length > 0 ? (
      <StyledActionFieldGrid>
        {createFields.map((field) => {
          const value = newCustomerEnterpriseFieldValues[field.id];
          const options = optionsByFieldId[field.id] ?? [];
          const label = `${field.fieldName}${field.required ? ' *' : ''}`;

          return (
            <StyledField key={field.id}>
              <StyledFieldLabel>{label}</StyledFieldLabel>
              <TradeCrmEnterpriseCustomerFieldInput
                field={field}
                noOptionsFallback={
                  <StyledConfigNote>
                    No options configured for {field.fieldName}.
                  </StyledConfigNote>
                }
                options={options}
                selectEmptyLabel={
                  field.fieldType === 'select'
                    ? `Select ${field.fieldName}`
                    : 'Unset'
                }
                value={value}
                validationMessage={validationMessagesByFieldId[field.id]}
                onChange={(nextValue) =>
                  onUpdateEnterpriseFieldValue(field.id, nextValue)
                }
              />
            </StyledField>
          );
        })}
        {hasInvalidCreateEnterpriseField ? (
          <StyledConfigNote>
            Resolve enterprise field validation issues before creating the
            customer.
          </StyledConfigNote>
        ) : null}
      </StyledActionFieldGrid>
    ) : null}
  </StyledActionBar>
);

export const TradeCrmCustomerLeadConversionActionPanel = ({
  canConvertLead,
  isConvertingLead,
  leadIdToConvert,
  onConvertLead,
  onLeadIdToConvertChange,
}: TradeCrmCustomerLeadConversionActionPanelProps) => (
  <StyledActionBar>
    <StyledActionMeta>
      <span>Convert lead to customer</span>
      <span>
        Creates the company master and first contact from a lead, then writes
        the conversion into customer timeline and operation history.
      </span>
    </StyledActionMeta>
    <StyledActionButtons>
      <StyledTextInput
        value={leadIdToConvert}
        onChange={(event) => onLeadIdToConvertChange(event.target.value)}
        placeholder="Lead record ID"
      />
      <StyledControlButton
        $tone="primary"
        disabled={!canConvertLead}
        type="button"
        onClick={onConvertLead}
      >
        {isConvertingLead ? 'Converting...' : 'Convert Lead'}
      </StyledControlButton>
    </StyledActionButtons>
  </StyledActionBar>
);

export const TradeCrmCustomerMoveVisibleToPublicPoolActionPanel = ({
  canMoveVisibleCustomersToPublicPool,
  isMovingVisibleCustomersToPublicPool,
  onMoveVisibleCustomersToPublicPool,
  visibleCustomerCount,
}: TradeCrmCustomerMoveVisibleToPublicPoolActionPanelProps) => (
  <StyledActionBar>
    <StyledActionMeta>
      <span>Batch public-pool execution</span>
      <span>
        Move the first {visibleCustomerCount} visible customer(s) into the
        configured public-pool group and preserve owner audit fields.
      </span>
    </StyledActionMeta>
    <StyledActionButtons>
      <StyledControlButton
        $tone="danger"
        disabled={!canMoveVisibleCustomersToPublicPool}
        type="button"
        onClick={onMoveVisibleCustomersToPublicPool}
      >
        {isMovingVisibleCustomersToPublicPool
          ? 'Moving...'
          : 'Move Visible To Public Pool'}
      </StyledControlButton>
    </StyledActionButtons>
  </StyledActionBar>
);
