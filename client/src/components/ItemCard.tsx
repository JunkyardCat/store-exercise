import type { Item } from '../lib/api';
import { formatPrice } from '../lib/format';

interface Props {
  item: Item;
  onAdd: (item: Item) => void;
}

export default function ItemCard({ item, onAdd }: Props) {
  const soldOut = item.stock <= 0;
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-ink/10 bg-white">
      {item.image_url ? (
        <img src={item.image_url} alt="" className="aspect-square w-full object-cover" />
      ) : (
        <div
          aria-hidden="true"
          className="flex aspect-square w-full items-center justify-center bg-brand/10 text-5xl font-bold text-brand"
        >
          {item.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h2 className="font-semibold">{item.name}</h2>
        <p className="line-clamp-2 text-sm text-ink/70">{item.description}</p>
        <p className="mt-auto pt-2 text-lg font-semibold">{formatPrice(item.price_cents)}</p>
        <button
          onClick={() => onAdd(item)}
          disabled={soldOut}
          className="mt-2 rounded bg-brand px-3 py-2 font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-ink/20"
        >
          {soldOut ? 'Sold out' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
}
