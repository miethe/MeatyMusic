import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { usePromptCardState } from '../hooks/usePromptCardState';

describe('usePromptCardState', () => {
  it('determines running state', () => {
    const { result } = renderHook(() =>
      usePromptCardState({ title: 'Test', isRunning: true })
    );
    expect(result.current.currentCardState).toBe('running');
  });

  it('notifies on state changes', () => {
    jest.useFakeTimers();
    const onStateChange = jest.fn();
    const { rerender } = renderHook((props) => usePromptCardState(props), {
      initialProps: { title: 'Test', isRunning: true, onStateChange },
    });
    rerender({ title: 'Test', isRunning: false, onStateChange });
    act(() => {
      jest.runAllTimers();
    });
    expect(onStateChange).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
