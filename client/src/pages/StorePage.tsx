import { useEffect, useState } from 'react';
import ItemCard from '../components/ItemCard';
import { useCart } from '../context/CartContext';
import { api, type Item } from '../lib/api';

export default function StorePage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const { dispatch } = useCart();

  // Wait 250 ms after the last keystroke before asking the server
  useEffect(() => {
    const timer = setTimeout(() => {
      api<Item[]>(`/items?q=${encodeURIComponent(query)}`)
        .then((data) => {
          setItems(data);
          setError('');
        })
        .catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <section>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Shop</h1>
        <input
          type="search"
          aria-label="Search items"
          placeholder="Search items"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-56 rounded border border-ink/25 bg-white px-3 py-2"
        />
      </div>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {!items && !error && <p>Loading items…</p>}
      {items && items.length === 0 && <p>No items found{query ? ` for “${query}”` : ''}.</p>}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items?.map((item) => (
          <ItemCard key={item.id} item={item} onAdd={(i) => dispatch({ type: 'add', item: i })} />
        ))}
      </div>
    </section>
  );
}
