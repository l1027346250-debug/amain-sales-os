import { act, renderHook } from '@testing-library/react';

import { useTradeCrmCustomerConfigEditorState } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigEditorState';

describe('useTradeCrmCustomerConfigEditorState', () => {
  it('should update config editor values through exposed handlers', () => {
    const { result } = renderHook(() =>
      useTradeCrmCustomerConfigEditorState(true),
    );

    act(() => {
      result.current.setNewGroupLabel('Key Accounts');
      result.current.setGroupParentId('group-1');
      result.current.onNewTagLabelChange('company', 'VIP');
      result.current.onTagEditorValueChange('tag-1', 'Priority');
      result.current.setNewSourceLabel('Referral');
      result.current.onSourceEditorValueChange('source-1', 'Expo');
      result.current.setImportFileName('customers.xlsx');
    });

    expect(result.current.newGroupLabel).toBe('Key Accounts');
    expect(result.current.groupParentId).toBe('group-1');
    expect(result.current.newTagLabels.company).toBe('VIP');
    expect(result.current.tagEditorValues['tag-1']).toBe('Priority');
    expect(result.current.newSourceLabel).toBe('Referral');
    expect(result.current.sourceEditorValues['source-1']).toBe('Expo');
    expect(result.current.importFileName).toBe('customers.xlsx');
  });

  it('should reset local editor state when config becomes saved', () => {
    const { result, rerender } = renderHook(
      ({ hasUnsavedChanges }) =>
        useTradeCrmCustomerConfigEditorState(hasUnsavedChanges),
      {
        initialProps: {
          hasUnsavedChanges: true,
        },
      },
    );

    act(() => {
      result.current.setNewGroupLabel('Key Accounts');
      result.current.setGroupParentId('group-1');
      result.current.onNewTagLabelChange('company', 'VIP');
      result.current.onTagEditorValueChange('tag-1', 'Priority');
      result.current.setNewSourceLabel('Referral');
      result.current.onSourceEditorValueChange('source-1', 'Expo');
      result.current.setImportFileName('customers.xlsx');
    });

    rerender({
      hasUnsavedChanges: false,
    });

    expect(result.current.newGroupLabel).toBe('');
    expect(result.current.groupParentId).toBeNull();
    expect(result.current.newTagLabels).toEqual({
      company: '',
      mine: '',
      subordinate: '',
    });
    expect(result.current.tagEditorValues).toEqual({});
    expect(result.current.newSourceLabel).toBe('');
    expect(result.current.sourceEditorValues).toEqual({});
    expect(result.current.importFileName).toBe('');
  });
});
