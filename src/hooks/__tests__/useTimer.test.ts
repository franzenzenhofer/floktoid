import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTimer } from '../useTimer';

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call callback every second when running', () => {
    const callback = vi.fn();
    
    renderHook(() => useTimer(true, callback));
    
    expect(callback).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
    
    vi.advanceTimersByTime(3000);
    expect(callback).toHaveBeenCalledTimes(4);
  });

  it('should not call callback when not running', () => {
    const callback = vi.fn();
    
    renderHook(() => useTimer(false, callback));
    
    vi.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should start and stop timer based on running prop', () => {
    const callback = vi.fn();
    
    const { rerender } = renderHook(
      ({ running }) => useTimer(running, callback),
      { initialProps: { running: false } }
    );
    
    vi.advanceTimersByTime(2000);
    expect(callback).not.toHaveBeenCalled();
    
    // Start timer
    rerender({ running: true });
    vi.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(2);
    
    // Stop timer
    rerender({ running: false });
    vi.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(2); // No new calls
  });

  it('should cleanup interval on unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useTimer(true, callback));
    
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
    
    unmount();
    
    vi.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(1); // No new calls after unmount
  });
});