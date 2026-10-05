import { useEffect, useState, type FormEvent } from 'react';
import FormField from '../components/FormField';
import { api, type Item } from '../lib/api';
import { dollarsToCents, formatPrice } from '../lib/format';

const emptyForm = { name: '', description: '', price: '', stock: '0', image_url: '' };

export default function AdminPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () => api<Item[]>('/items').then(setItems).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const set = (key: keyof typeof emptyForm) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function startEdit(item: Item) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      price: (item.price_cents / 100).toFixed(2),
      stock: String(item.stock),
      image_url: item.image_url,
    });
    setMessage('');
    setError('');
  }

  function reset() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    const price_cents = dollarsToCents(form.price);
    if (price_cents === null) return setError('Enter a price like 12.50.');
    const body = {
      name: form.name,
      description: form.description,
      price_cents,
      stock: Number(form.stock),
      image_url: form.image_url,
    };
    try {
      if (editingId) {
        await api(`/items/${editingId}`, { method: 'PUT', body });
        setMessage('Item saved.');
      } else {
        await api('/items', { method: 'POST', body });
        setMessage('Item added.');
      }
      reset();
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function remove(item: Item) {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await api(`/items/${item.id}`, { method: 'DELETE' });
      setMessage('Item deleted.');
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <section className="grid gap-8 md:grid-cols-[1fr_20rem]">
      <div>
        <h1 className="mb-4 text-2xl font-bold">Manage items</h1>
        <div className="overflow-x-auto rounded-lg border border-ink/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 bg-ink/5">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b border-ink/5 last:border-0">
                  <td className="p-3 font-medium">{i.name}</td>
                  <td className="p-3">{formatPrice(i.price_cents)}</td>
                  <td className="p-3">{i.stock}</td>
                  <td className="space-x-3 p-3 text-right">
                    <button onClick={() => startEdit(i)} className="text-brand underline">Edit</button>
                    <button onClick={() => remove(i)} className="text-red-700 underline">Delete</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={4} className="p-3">No items yet. Add your first one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex h-fit flex-col gap-3 rounded-lg border border-ink/10 bg-white p-4">
        <h2 className="font-semibold">{editingId ? 'Edit item' : 'Add item'}</h2>
        <FormField label="Name" required value={form.name} onChange={set('name')} />
        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium">Description</label>
          <textarea id="description" rows={3} value={form.description} onChange={set('description')} className="rounded border border-ink/25 px-3 py-2" />
        </div>
        <FormField label="Price (USD)" inputMode="decimal" required value={form.price} onChange={set('price')} />
        <FormField label="Stock" type="number" min={0} required value={form.stock} onChange={set('stock')} />
        <FormField label="Image URL" placeholder="https://…" value={form.image_url} onChange={set('image_url')} />
        {error && <p role="alert" className="text-red-700">{error}</p>}
        {message && <p role="status" className="text-brand">{message}</p>}
        <div className="flex gap-2">
          <button className="rounded bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark">
            {editingId ? 'Save changes' : 'Add item'}
          </button>
          {editingId && (
            <button type="button" onClick={reset} className="rounded border border-ink/25 px-4 py-2">Cancel</button>
          )}
        </div>
      </form>
    </section>
  );
}
