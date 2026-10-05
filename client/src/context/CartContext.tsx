import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';
import { cartReducer, type CartAction, type CartLine } from '../lib/cartReducer';

const STORAGE_KEY = 'store-cart';

const CartContext = createContext<{ lines: CartLine[]; dispatch: Dispatch<CartAction> } | null>(null);

function loadCart(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(cartReducer, undefined, loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  return <CartContext.Provider value={{ lines, dispatch }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
