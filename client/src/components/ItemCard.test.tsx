import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ItemCard from './ItemCard';
import type { Item } from '../lib/api';

const item: Item = { id: 1, name: 'Ceramic Mug', description: 'A mug', price_cents: 1400, stock: 3, image_url: '' };

describe('ItemCard', () => {
  it('shows the name and price and adds to cart on click', async () => {
    const onAdd = vi.fn();
    render(<ItemCard item={item} onAdd={onAdd} />);
    expect(screen.getByText('Ceramic Mug')).toBeInTheDocument();
    expect(screen.getByText('$14.00')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    expect(onAdd).toHaveBeenCalledWith(item);
  });

  it('disables the button when sold out', () => {
    render(<ItemCard item={{ ...item, stock: 0 }} onAdd={() => {}} />);
    expect(screen.getByRole('button', { name: 'Sold out' })).toBeDisabled();
  });
});
