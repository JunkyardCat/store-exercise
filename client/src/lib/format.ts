export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

/** "12.50" -> 1250. Returns null if it isn't a valid non-negative amount. */
export function dollarsToCents(input: string): number | null {
  const value = Number(input);
  if (input.trim() === '' || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}
