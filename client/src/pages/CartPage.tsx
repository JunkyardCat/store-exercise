import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';
import { cartTotalCents } from '../lib/cartReducer';
import { formatPrice } from '../lib/format';

export default function CartPage() {
  const { lines, dispatch } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function placeOrder() {
    setBusy(true);
    setError('');
    try {
      await api('/orders', {
        method: 'POST',
        body: { items: lines.map((l) => ({ itemId: l.item.id, quantity: l.quantity })) },
      });
      dispatch({ type: 'clear' });
      navigate('/orders');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (lines.length === 0) {
    return (
      <section>
        <h1 className="mb-2 text-2xl font-bold">Your cart</h1>
        <p>
          Your cart is empty. <Link to="/" className="text-brand underline">Browse the shop</Link>
        </p>
      </section>
    );
  }

  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold">Your cart</h1>
      <ul className="divide-y divide-ink/10 rounded-lg border border-ink/10 bg-white">
        {lines.map(({ item, quantity }) => (
          <li key={item.id} className="flex items-center gap-4 p-4">
            <div className="mr-auto">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-ink/70">{formatPrice(item.price_cents)} each</p>
            </div>
            <label className="text-sm">
              <span className="sr-only">Quantity for {item.name}</span>
              <input
                type="number"
                min={0}
                max={item.stock}
                value={quantity}
                onChange={(e) => dispatch({ type: 'setQuantity', itemId: item.id, quantity: Number(e.target.value) })}
                className="w-16 rounded border border-ink/25 px-2 py-1"
              />
            </label>
            <p className="w-20 text-right font-medium">{formatPrice(item.price_cents * quantity)}</p>
            <button
              onClick={() => dispatch({ type: 'remove', itemId: item.id })}
              className="text-sm text-red-700 underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-lg font-semibold">Total: {formatPrice(cartTotalCents(lines))}</p>
        {user ? (
          <button
            onClick={placeOrder}
            disabled={busy}
            className="rounded bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? 'Placing order…' : 'Place order'}
          </button>
        ) : (
          <Link to="/login" state={{ from: '/cart' }} className="rounded bg-brand px-4 py-2 font-medium text-white">
            Log in to place your order
          </Link>
        )}
      </div>
      {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
      <p className="mt-6 text-sm text-ink/60">This demo store does not take payment. Orders are only recorded.</p>
    </section>
  );
}
