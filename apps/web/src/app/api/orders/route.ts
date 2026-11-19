import { db, route, requireUser, HttpError } from '@/lib/server/db';

// GET /api/orders — buyers get their orders, sellers get incoming orders, admin gets all.
export const GET = route(async (req) => {
  const user = await requireUser(req);
  let q = db()
    .from('orders')
    .select('*, items:order_items(*), buyer:profiles!orders_buyer_id_fkey(full_name,email)')
    .order('created_at', { ascending: false });
  if (user.role === 'seller') q = q.eq('seller_id', user.id);
  else if (user.role === 'buyer') q = q.eq('buyer_id', user.id);
  const { data, error } = await q;
  if (error) throw new HttpError(500, error.message);
  return (data || []).map((o: any) => ({
    ...o,
    total: Number(o.total),
    items: o.items.map((i: any) => ({ ...i, unit_price: Number(i.unit_price) })),
  }));
});
