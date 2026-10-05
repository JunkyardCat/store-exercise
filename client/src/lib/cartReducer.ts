import type { Item } from './api';

export interface CartLine {
  item: Item;
  quantity: number;
}

export type CartAction =
  | { type: 'add'; item: Item }
  | { type: 'setQuantity'; itemId: number; quantity: number }
  | { type: 'remove'; itemId: number }
  | { type: 'clear' };

export function cartReducer(state: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case 'add': {
      const existing = state.find((l) => l.item.id === action.item.id);
      if (existing) {
        // never allow more than what is in stock
        return state.map((l) =>
          l === existing ? { ...l, item: action.item, quantity: Math.min(l.quantity + 1, action.item.stock) } : l,
        );
      }
      return action.item.stock > 0 ? [...state, { item: action.item, quantity: 1 }] : state;
    }
    case 'setQuantity':
      return state
        .map((l) =>
          l.item.id === action.itemId ? { ...l, quantity: Math.min(action.quantity, l.item.stock) } : l,
        )
        .filter((l) => l.quantity > 0);
    case 'remove':
      return state.filter((l) => l.item.id !== action.itemId);
    case 'clear':
      return [];
  }
}

export const cartTotalCents = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + l.item.price_cents * l.quantity, 0);

export const cartCount = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.quantity, 0);
