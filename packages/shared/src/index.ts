// Shared types + pricing logic used by the web app, API and mobile app.

export type Role = 'buyer' | 'seller' | 'admin';
export type OptionType = 'swatch' | 'select' | 'checkbox';
export type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'delivered';
export const ORDER_STATUSES: OrderStatus[] = ['new', 'confirmed', 'shipped', 'delivered'];

export interface OptionValue {
  id: string;
  group_id: string;
  label: string;
  price_delta: number;
  color_hex: string | null;
  image_url: string | null;
  position: number;
}
export interface OptionGroup {
  id: string;
  product_id: string;
  name: string;
  type: OptionType;
  required: boolean;
  position: number;
  values: OptionValue[];
}
export interface ProductImage {
  id: string;
  url: string;
  position: number;
}
export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}
export interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  base_price: number;
  compare_at_price: number | null;
  status: 'active' | 'hidden';
  category_id: string | null;
  category?: Category | null;
  seller?: { id: string; full_name: string | null; status: string } | null;
  images: ProductImage[];
  option_groups: OptionGroup[];
}

/** groupId -> valueId. A checkbox group that is unticked is simply absent. */
export type Selection = Record<string, string>;

export interface ChosenOption {
  group: string;
  label: string;
  price_delta: number;
}

export interface CartLine {
  key: string;
  productId: string;
  title: string;
  image: string | null;
  qty: number;
  selection: Selection;
  options: ChosenOption[];
  unitPrice: number;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;
export const money = (n: number) => `£${n.toFixed(2)}`;

export function discountPercent(base: number, compareAt: number | null): number | null {
  if (!compareAt || compareAt <= base) return null;
  return Math.round(((compareAt - base) / compareAt) * 100);
}

/** First value of each required group (and nothing for optional ones). */
export function defaultSelection(p: Pick<Product, 'option_groups'>): Selection {
  const sel: Selection = {};
  for (const g of p.option_groups) {
    if (g.required && g.values.length) sel[g.id] = g.values[0].id;
  }
  return sel;
}

export function chosenOptions(p: Pick<Product, 'option_groups'>, sel: Selection): ChosenOption[] {
  const out: ChosenOption[] = [];
  for (const g of p.option_groups) {
    const v = g.values.find((x) => x.id === sel[g.id]);
    if (v) out.push({ group: g.name, label: v.label, price_delta: v.price_delta });
  }
  return out;
}

/** Base price + the price delta of every chosen option value. */
export function computePrice(p: Pick<Product, 'base_price' | 'option_groups'>, sel: Selection): number {
  let total = Number(p.base_price);
  for (const o of chosenOptions(p, sel)) total += Number(o.price_delta);
  return round2(total);
}

/** Two different option combos of the same product must be different cart lines. */
export function selectionKey(productId: string, sel: Selection): string {
  const parts = Object.entries(sel)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([g, v]) => `${g}:${v}`);
  return `${productId}|${parts.join(',')}`;
}

/** "Prague Divan Bed – Cream Naples" + colour "Grey Naples" => "Prague Divan Bed – Grey Naples" */
export function displayTitle(title: string, colourLabel?: string | null): string {
  if (!colourLabel) return title;
  const i = title.indexOf(' – ');
  const stem = i >= 0 ? title.slice(0, i) : title;
  return `${stem} – ${colourLabel}`;
}

export function colourGroup(p: Pick<Product, 'option_groups'>): OptionGroup | undefined {
  return p.option_groups.find((g) => g.type === 'swatch');
}

/** Validates a selection against the product definition. Returns an error string or null. */
export function validateSelection(p: Pick<Product, 'option_groups'>, sel: Selection): string | null {
  const groupIds = new Set(p.option_groups.map((g) => g.id));
  for (const gid of Object.keys(sel)) if (!groupIds.has(gid)) return 'Unknown option group';
  for (const g of p.option_groups) {
    const vid = sel[g.id];
    if (!vid) {
      if (g.required) return `Please choose ${g.name}`;
      continue;
    }
    if (!g.values.some((v) => v.id === vid)) return `Invalid value for ${g.name}`;
  }
  return null;
}
