export interface User {
  id: number;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}

export interface Item {
  id: number;
  name: string;
  description: string;
  price_cents: number;
  stock: number;
  image_url: string;
}

export interface Order {
  id: number;
  total_cents: number;
  created_at: string;
  items: { item_name: string; unit_price_cents: number; quantity: number }[];
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Small wrapper around fetch: sends cookies, parses JSON, throws readable errors. */
export async function api<T = unknown>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: options.method ?? 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'same-origin',
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? 'Something went wrong.', res.status);
  return data as T;
}
