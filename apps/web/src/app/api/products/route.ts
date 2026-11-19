import { NextRequest } from 'next/server';
import { db, route, requireUser, normalizeProduct, PRODUCT_SELECT, HttpError } from '@/lib/server/db';
import { saveProduct } from '@/lib/server/products';
import { colourGroup } from '@mm/shared';

// GET /api/products?q=&category=&minPrice=&maxPrice=&colour=&size=&scope=mine|admin
export const GET = route(async (req) => {
  const sp = req.nextUrl.searchParams;
  const scope = sp.get('scope');

  let query = db().from('products').select(PRODUCT_SELECT).order('created_at', { ascending: false });

  if (scope === 'mine') {
    const user = await requireUser(req, ['seller', 'admin']);
    query = query.eq('seller_id', user.id);
  } else if (scope === 'admin') {
    await requireUser(req, ['admin']);
  } else {
    query = query.eq('status', 'active');
  }

  const { data, error } = await query;
  if (error) throw new HttpError(500, error.message);
  let products = (data || []).map(normalizeProduct) as any[];

  if (!scope) products = products.filter((p) => p.seller?.status === 'approved');

  const q = sp.get('q')?.trim().toLowerCase();
  if (q) products = products.filter((p) => `${p.title} ${p.description ?? ''}`.toLowerCase().includes(q));

  const category = sp.get('category');
  if (category) {
    const { data: cats } = await db().from('categories').select('id,slug,parent_id');
    const root = cats?.find((c) => c.slug === category);
    const ids = new Set((cats || []).filter((c) => c.id === root?.id || c.parent_id === root?.id).map((c) => c.id));
    products = products.filter((p) => p.category_id && ids.has(p.category_id));
  }

  const min = sp.get('minPrice');
  const max = sp.get('maxPrice');
  if (min) products = products.filter((p) => p.base_price >= Number(min));
  if (max) products = products.filter((p) => p.base_price <= Number(max));

  const colour = sp.get('colour');
  if (colour) {
    products = products.filter((p) => colourGroup(p)?.values.some((v) => v.label.toLowerCase() === colour.toLowerCase()));
  }
  const size = sp.get('size');
  if (size) {
    products = products.filter((p) =>
      p.option_groups.some((g: any) => g.name.toLowerCase() === 'size' && g.values.some((v: any) => v.label === size)),
    );
  }

  return products;
});

// POST /api/products  (seller)
export const POST = route(async (req) => {
  const user = await requireUser(req, ['seller', 'admin']);
  const body = await req.json();
  return saveProduct(user.id, null, body);
});

