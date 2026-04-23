import { act, renderHook } from '@testing-library/react';

import { useTradeCrmCustomerConfigNavigationGuard } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigNavigationGuard';
import type {
  useTradeCrmCustomerConfigDraft,
} from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigDraft';

const mockProceed = jest.fn();
const mockReset = jest.fn();
const mockUseBeforeUnload = jest.fn();

let mockBlockerState: 'blocked' | 'unblocked' = 'unblocked';

jest.mock('react-router-dom', () => ({
  useBeforeUnload: (...args: unknown[]) => mockUseBeforeUnload(...args),
  useBlocker: () => ({
    proceed: mockProceed,
    reset: mockReset,
    state: mockBlockerState,
  }),
}));

const createConfigDraft = ({
  hasUnsavedChanges,
  saveDraft,
  saveError = null,
}: {
  hasUnsavedChanges: boolean;
  saveDraft: jest.Mock<Promise<boolean>>;
  saveError?: string | null;
}) =>
  ({
    hasUnsavedChanges,
    resetDraft: jest.fn(),
    saveDraft,
    saveError,
  }) as unknown as ReturnType<typeof useTradeCrmCustomerConfigDraft>;

describe('useTradeCrmCustomerConfigNavigationGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBlockerState = 'unblocked';
  });

  it('should proceed with blocked navigation after a successful save', async () => {
    mockBlockerState = 'blocked';
    const configDraft = createConfigDraft({
      hasUnsavedChanges: true,
      saveDraft: jest.fn().mockResolvedValue(true),
    });
    const { result } = renderHook(() =>
      useTradeCrmCustomerConfigNavigationGuard({
        configDraft,
        unsavedChangesMessage: 'Unsaved changes',
      }),
    );

    await act(async () => {
      result.current.onSaveAndProceed();
      await Promise.resolve();
    });

    expect(configDraft.saveDraft).toHaveBeenCalledTimes(1);
    expect(mockProceed).toHaveBeenCalledTimes(1);
    expect(result.current.blockedNavigationError).toBeNull();
  });

  it('should expose a save error when save and continue fails', async () => {
    mockBlockerState = 'blocked';
    const configDraft = createConfigDraft({
      hasUnsavedChanges: true,
      saveDraft: jest.fn().mockResolvedValue(false),
      saveError: 'Validation failed',
    });
    const { result } = renderHook(() =>
      useTradeCrmCustomerConfigNavigationGuard({
        configDraft,
        unsavedChangesMessage: 'Unsaved changes',
      }),
    );

    await act(async () => {
      result.current.onSaveAndProceed();
      await Promise.resolve();
    });

    expect(mockProceed).not.toHaveBeenCalled();
    expect(result.current.blockedNavigationError).toBe('Validation failed');
  });

  it('should reset the blocker when staying on the page', () => {
    mockBlockerState = 'blocked';
    const configDraft = createConfigDraft({
      hasUnsavedChanges: true,
      saveDraft: jest.fn().mockResolvedValue(true),
    });
    const { result } = renderHook(() =>
      useTradeCrmCustomerConfigNavigationGuard({
        configDraft,
        unsavedChangesMessage: 'Unsaved changes',
      }),
    );

    act(() => {
      result.current.onStayOnPage();
    });

    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(result.current.blockedNavigationError).toBeNull();
  });
});
