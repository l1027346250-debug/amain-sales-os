import { type TradeCrmCustomerConfigDraft } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigDraft';

type CustomerPublicPoolRuleDraft =
  TradeCrmCustomerConfigDraft['publicPoolRule'];

type BuildCustomerPublicPoolRuleExecutionPreviewArgs = {
  publicPoolRule: CustomerPublicPoolRuleDraft;
};

type GetCustomerPublicPoolRuleValidationMessagesArgs = {
  hasUnsavedChanges: boolean;
  publicPoolRule: CustomerPublicPoolRuleDraft;
};

export type CustomerPublicPoolRuleExecutionStep = {
  title: string;
  text: string;
};

export const buildCustomerPublicPoolRuleExecutionPreview = ({
  publicPoolRule,
}: BuildCustomerPublicPoolRuleExecutionPreviewArgs): CustomerPublicPoolRuleExecutionStep[] => [
  {
    title: 'Condition scan',
    text: `Move customers without contact in ${publicPoolRule.inactivityDays} days.`,
  },
  {
    title: 'Stage scope',
    text:
      publicPoolRule.scopeStages.length > 0
        ? publicPoolRule.scopeStages.join(', ')
        : 'No customer stage selected yet.',
  },
  {
    title: 'Public move',
    text: `Write the record into ${publicPoolRule.publicPoolGroup} and preserve original owner audit.`,
  },
];

export const getCustomerPublicPoolRuleValidationMessages = ({
  hasUnsavedChanges,
  publicPoolRule,
}: GetCustomerPublicPoolRuleValidationMessagesArgs): string[] => {
  const validationMessages: string[] = [];

  if (publicPoolRule.ruleName.trim().length === 0) {
    validationMessages.push('Rule name is required before execution.');
  }

  if (!Number.isFinite(publicPoolRule.inactivityDays)) {
    validationMessages.push('Inactivity days must be a valid number.');
  } else if (publicPoolRule.inactivityDays < 1) {
    validationMessages.push('Inactivity days must be at least 1.');
  }

  if (publicPoolRule.publicPoolGroup.trim().length === 0) {
    validationMessages.push('Public pool group is required.');
  }

  if (publicPoolRule.scopeStages.length === 0) {
    validationMessages.push('Select at least one customer stage.');
  }

  if (hasUnsavedChanges) {
    validationMessages.push(
      'Save public-pool rules before running the execution scan.',
    );
  }

  return validationMessages;
};

export const canExecuteCustomerPublicPoolRuleScan = (
  validationMessages: string[],
) => validationMessages.length === 0;
