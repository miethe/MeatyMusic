import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { usePromptCardShortcuts } from '../hooks/usePromptCardShortcuts';

describe('usePromptCardShortcuts', () => {
  it('handles run shortcut', () => {
    const onRun = jest.fn();
    const { result } = renderHook(() => usePromptCardShortcuts({ onRun }));
    act(() => {
      result.current.onKeyDown({ key: 'Enter', preventDefault: jest.fn() } as any);
    });
    expect(onRun).toHaveBeenCalled();
  });
});
