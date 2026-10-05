import { describe, it, expect } from 'vitest';
import { dollarsToCents, formatPrice } from './format';

describe('format', () => {
  it('formats cents as dollars', () => {
    expect(formatPrice(1250)).toBe('$12.50');
  });

  it('converts dollar input to cents', () => {
    expect(dollarsToCents('12.50')).toBe(1250);
    expect(dollarsToCents('0.1')).toBe(10);
  });

  it('rejects bad input', () => {
    expect(dollarsToCents('')).toBeNull();
    expect(dollarsToCents('abc')).toBeNull();
    expect(dollarsToCents('-3')).toBeNull();
  });
});
