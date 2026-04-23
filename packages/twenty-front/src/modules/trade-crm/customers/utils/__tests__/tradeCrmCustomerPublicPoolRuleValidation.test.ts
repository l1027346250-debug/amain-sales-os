import {
  buildCustomerPublicPoolRuleExecutionPreview,
  canExecuteCustomerPublicPoolRuleScan,
  getCustomerPublicPoolRuleValidationMessages,
} from '@/trade-crm/customers/utils/tradeCrmCustomerPublicPoolRuleValidation';

const validPublicPoolRule = {
  inactivityDays: 30,
  notifyOwnersFirst: true,
  publicPoolGroup: 'Default Public Pool',
  ruleName: 'Recycle inactive customers',
  scopeStages: ['Potential Customer', 'Active Customer'],
};

describe('tradeCrmCustomerPublicPoolRuleValidation', () => {
  it('builds execution preview steps from the rule draft', () => {
    expect(
      buildCustomerPublicPoolRuleExecutionPreview({
        publicPoolRule: validPublicPoolRule,
      }),
    ).toEqual([
      {
        text: 'Move customers without contact in 30 days.',
        title: 'Condition scan',
      },
      {
        text: 'Potential Customer, Active Customer',
        title: 'Stage scope',
      },
      {
        text: 'Write the record into Default Public Pool and preserve original owner audit.',
        title: 'Public move',
      },
    ]);
  });

  it('blocks execution when required rule fields are invalid', () => {
    const validationMessages = getCustomerPublicPoolRuleValidationMessages({
      hasUnsavedChanges: false,
      publicPoolRule: {
        ...validPublicPoolRule,
        inactivityDays: 0,
        publicPoolGroup: ' ',
        ruleName: ' ',
        scopeStages: [],
      },
    });

    expect(validationMessages).toEqual([
      'Rule name is required before execution.',
      'Inactivity days must be at least 1.',
      'Public pool group is required.',
      'Select at least one customer stage.',
    ]);
    expect(canExecuteCustomerPublicPoolRuleScan(validationMessages)).toBe(
      false,
    );
  });

  it('blocks execution while the rule draft has unsaved changes', () => {
    const validationMessages = getCustomerPublicPoolRuleValidationMessages({
      hasUnsavedChanges: true,
      publicPoolRule: validPublicPoolRule,
    });

    expect(validationMessages).toEqual([
      'Save public-pool rules before running the execution scan.',
    ]);
    expect(canExecuteCustomerPublicPoolRuleScan(validationMessages)).toBe(
      false,
    );
  });

  it('allows execution for a saved valid rule', () => {
    const validationMessages = getCustomerPublicPoolRuleValidationMessages({
      hasUnsavedChanges: false,
      publicPoolRule: validPublicPoolRule,
    });

    expect(validationMessages).toEqual([]);
    expect(canExecuteCustomerPublicPoolRuleScan(validationMessages)).toBe(true);
  });
});
