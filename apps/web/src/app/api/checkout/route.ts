import { db, route, requireUser, normalizeProduct, PRODUCT_SELECT, HttpError } from '@/lib/server/db';
import { chosenOptions, computePrice, validateSelection, displayTitle, colourGroup, round2 } from '@mm/shared';

// POST /api/checkout { items: [{productId, qty, selection}], shipping: {name, address, phone} }
// Prices are RE-COMPUTED here from the database — the client's total is never trusted.
// One order is created per seller. No real payment.
export const POST = route(async (req) => {
  const user = await requireUser(req);
  const { items, shipping } = await req.json();
  if (!Array.isArray(items) || !items.length) throw new HttpError(400, 'Cart is empty');
  if (!shipping?.name?.trim() || !shipping?.address?.trim()) throw new HttpError(400, 'Name and address are required');

  const bySeller = new Map<string, any[]>();
  for (const it of items) {
    const { data } = await db().from('products').select(PRODUCT_SELECT).eq('id', it.productId).maybeSingle();
    if (!data) throw new HttpError(400, 'A product in your cart no longer exists');
    const p = normalizeProduct(data as any) as any;
    if (p.status !== 'active' || p.seller?.status !== 'approved') throw new HttpError(400, `${p.title} is no longer available`);
    const sel = it.selection || {};
    const err = validateSelection(p, sel);
    if (err) throw new HttpError(400, `${p.title}: ${err}`);
    const qty = Math.max(1, Math.min(20, Math.floor(Number(it.qty) || 1)));
    const options = chosenOptions(p, sel);
    const colour = colourGroup(p)?.values.find((v) => v.id === sel[colourGroup(p)!.id]);
    const row = {
      product_id: p.id,
      title: displayTitle(p.title, colour?.label),
      image_url: colour?.image_url || p.images[0]?.url || null,
      qty,
      unit_price: computePrice(p, sel),
      options,
    };
    const list = bySeller.get(p.seller_id) || [];
    list.push(row);
    bySeller.set(p.seller_id, list);
  }

  const orderIds: string[] = [];
  for (const [sellerId, rows] of bySeller) {
    const total = round2(rows.reduce((s, r) => s + r.unit_price * r.qty, 0));
    const { data: order, error } = await db()
      .from('orders')
      .insert({
        buyer_id: user.id,
        seller_id: sellerId,
        total,
        shipping_name: shipping.name.trim(),
        shipping_address: shipping.address.trim(),
        shipping_phone: shipping.phone || null,
      })
      .select('id')
      .single();
    if (error) throw new HttpError(500, error.message);
    const { error: e2 } = await db()
      .from('order_items')
      .insert(rows.map((r) => ({ ...r, order_id: order.id })));
    if (e2) throw new HttpError(500, e2.message);
    orderIds.push(order.id);
  }
  return { orderIds };
});
