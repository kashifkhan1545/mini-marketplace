import { db, normalizeProduct, PRODUCT_SELECT, HttpError } from './db';

export async function saveProduct(sellerId: string, productId: string | null, body: any) {
  const title = String(body.title || '').trim();
  const base = Number(body.base_price);
  if (!title) throw new HttpError(400, 'Title is required');
  if (!Number.isFinite(base) || base < 0) throw new HttpError(400, 'Base price must be a number');
  const compare = body.compare_at_price === '' || body.compare_at_price == null ? null : Number(body.compare_at_price);
  if (compare != null && !Number.isFinite(compare)) throw new HttpError(400, 'Compare-at price must be a number');

  const row = {
    title,
    description: body.description || null,
    base_price: base,
    compare_at_price: compare,
    category_id: body.category_id || null,
  };

  let id = productId;
  if (id) {
    const { error } = await db().from('products').update(row).eq('id', id);
    if (error) throw new HttpError(500, error.message);
    // replace children (order_items keep their own snapshot, so this is safe)
    await db().from('product_images').delete().eq('product_id', id);
    await db().from('option_groups').delete().eq('product_id', id);
  } else {
    const { data, error } = await db().from('products').insert({ ...row, seller_id: sellerId }).select('id').single();
    if (error) throw new HttpError(500, error.message);
    id = data.id as string;
  }

  const images = (body.images || []).filter((i: any) => i.url);
  if (images.length) {
    const { error } = await db()
      .from('product_images')
      .insert(images.map((i: any, idx: number) => ({ product_id: id, url: i.url, position: idx })));
    if (error) throw new HttpError(500, error.message);
  }

  for (const [gi, g] of (body.option_groups || []).entries()) {
    if (!g.name?.trim()) continue;
    const { data: grp, error } = await db()
      .from('option_groups')
      .insert({ product_id: id, name: g.name.trim(), type: g.type || 'select', required: !!g.required, position: gi })
      .select('id')
      .single();
    if (error) throw new HttpError(500, error.message);
    const values = (g.values || []).filter((v: any) => v.label?.trim());
    if (values.length) {
      const { error: e2 } = await db()
        .from('option_values')
        .insert(
          values.map((v: any, vi: number) => ({
            group_id: grp.id,
            label: v.label.trim(),
            price_delta: Number(v.price_delta) || 0,
            color_hex: v.color_hex || null,
            image_url: v.image_url || null,
            position: vi,
          })),
        );
      if (e2) throw new HttpError(500, e2.message);
    }
  }

  const { data: full } = await db().from('products').select(PRODUCT_SELECT).eq('id', id!).single();
  return normalizeProduct(full as any);
}
