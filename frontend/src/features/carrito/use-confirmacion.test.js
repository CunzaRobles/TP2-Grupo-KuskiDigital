import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DURACION_CONFIRMACION_MS, useConfirmacion } from './use-confirmacion';

describe('useConfirmacion', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('confirma durante 1.5 s y vuelve solo al estado normal', () => {
    const { result } = renderHook(() => useConfirmacion());
    expect(result.current[0]).toBe(false);

    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);

    act(() => vi.advanceTimersByTime(DURACION_CONFIRMACION_MS - 1));
    expect(result.current[0]).toBe(true);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current[0]).toBe(false);
  });

  it('una nueva confirmación reinicia la espera', () => {
    const { result } = renderHook(() => useConfirmacion());

    act(() => result.current[1]());
    act(() => vi.advanceTimersByTime(1000));
    act(() => result.current[1]());
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current[0]).toBe(true);
    act(() => vi.advanceTimersByTime(500));
    expect(result.current[0]).toBe(false);
  });
});
