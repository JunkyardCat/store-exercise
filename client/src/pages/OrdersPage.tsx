import { useEffect, useState } from 'react';
import { api, type Order } from '../lib/api';
import { formatPrice } from '../lib/format';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Order[]>('/orders').then(setOrders).catch((e) => setError(e.message));
  }, []);

  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold">My orders</h1>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {!orders && !error && <p>Loading orders…</p>}
      {orders?.length === 0 && <p>You have not placed any orders yet.</p>}
      <ul className="flex flex-col gap-4">
        {orders?.map((o) => (
          <li key={o.id} className="rounded-lg border border-ink/10 bg-white p-4">
            <div className="flex justify-between font-medium">
              <span>Order #{o.id}</span>
              <span>{formatPrice(o.total_cents)}</span>
            </div>
            <p className="mb-2 text-sm text-ink/60">{new Date(o.created_at).toLocaleString()}</p>
            <ul className="text-sm">
              {o.items.map((i, idx) => (
                <li key={idx}>
                  {i.quantity} × {i.item_name} at {formatPrice(i.unit_price_cents)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
