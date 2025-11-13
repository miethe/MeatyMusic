import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useAriaAnnouncements } from '../hooks/useAriaAnnouncements';

describe('useAriaAnnouncements', () => {
  it('announces messages and clears them', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useAriaAnnouncements());
    act(() => {
      result.current.announce('Hello');
    });
    expect(result.current.message).toBe('Hello');
    act(() => {
      jest.runAllTimers();
    });
    expect(result.current.message).toBe('');
    jest.useRealTimers();
  });
});
