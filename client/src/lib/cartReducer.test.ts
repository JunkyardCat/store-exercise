import { describe, it, expect } from 'vitest';
import { cartCount, cartReducer, cartTotalCents, type CartLine } from './cartReducer';
import type { Item } from './api';

const mug: Item = { id: 1, name: 'Mug', description: '', price_cents: 1000, stock: 2, image_url: '' };

describe('cartReducer', () => {
  it('adds an item and increases quantity on repeat adds', () => {
    let cart: CartLine[] = [];
    cart = cartReducer(cart, { type: 'add', item: mug });
    cart = cartReducer(cart, { type: 'add', item: mug });
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
    expect(cartTotalCents(cart)).toBe(2000);
    expect(cartCount(cart)).toBe(2);
  });

  it('never goes above stock', () => {
    let cart: CartLine[] = [];
    for (let i = 0; i < 5; i++) cart = cartReducer(cart, { type: 'add', item: mug });
    expect(cart[0].quantity).toBe(2);
  });

  it('does not add sold-out items', () => {
    expect(cartReducer([], { type: 'add', item: { ...mug, stock: 0 } })).toEqual([]);
  });

  it('removes a line when quantity is set to 0, and on remove/clear', () => {
    const start = cartReducer([], { type: 'add', item: mug });
    expect(cartReducer(start, { type: 'setQuantity', itemId: 1, quantity: 0 })).toEqual([]);
    expect(cartReducer(start, { type: 'remove', itemId: 1 })).toEqual([]);
    expect(cartReducer(start, { type: 'clear' })).toEqual([]);
  });
});
