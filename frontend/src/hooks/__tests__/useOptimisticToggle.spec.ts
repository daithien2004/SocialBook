import { renderHook, act } from '@testing-library/react';
import { useOptimisticToggle, type UseOptimisticToggleOptions } from '../useOptimisticToggle';

describe('useOptimisticToggle', () => {
  it('should initialize with provided state', () => {
    const { result } = renderHook(() =>
      useOptimisticToggle({
        initialCount: 5,
        initialState: false,
        onToggle: jest.fn(),
      })
    );

    expect(result.current.count).toBe(5);
    expect(result.current.isActive).toBe(false);
  });

  it('should optimistically update state on toggle', async () => {
    const mockOnToggle = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useOptimisticToggle({
        initialCount: 5,
        initialState: false,
        onToggle: mockOnToggle,
      })
    );

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.count).toBe(6);
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('should revert state if onToggle fails', async () => {
    const error = new Error('API failed');
    const mockOnToggle = jest.fn().mockRejectedValue(error);
    const mockOnError = jest.fn();

    const { result } = renderHook(() =>
      useOptimisticToggle({
        initialCount: 5,
        initialState: false,
        onToggle: mockOnToggle,
        onError: mockOnError,
      })
    );

    // Initial expectations
    expect(result.current.isActive).toBe(false);
    expect(result.current.count).toBe(5);

    // We don't await act here because the toggle is async but we want to see the immediate optimistic update
    act(() => {
      result.current.toggle().catch(() => {});
    });

    // Optimistic state
    expect(result.current.isActive).toBe(true);
    expect(result.current.count).toBe(6);

    // Let the promise reject
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Reverted state
    expect(result.current.isActive).toBe(false);
    expect(result.current.count).toBe(5);
    expect(mockOnError).toHaveBeenCalledWith(error);
  });

  it('should reset internal state when initial values change', () => {
    const { result, rerender } = renderHook(
      (props: UseOptimisticToggleOptions) => useOptimisticToggle(props),
      {
        initialProps: {
          initialCount: 5,
          initialState: false,
          onToggle: jest.fn(),
        },
      }
    );

    expect(result.current.count).toBe(5);

    rerender({
      initialCount: 10,
      initialState: true,
      onToggle: jest.fn(),
    });

    expect(result.current.count).toBe(10);
    expect(result.current.isActive).toBe(true);
  });
});
