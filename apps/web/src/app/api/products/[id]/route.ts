import { db, route, getUser, requireUser, normalizeProduct, PRODUCT_SELECT, HttpError } from '@/lib/server/db';
import { saveProduct } from '@/lib/server/products';

export const GET = route(async (req, { params }) => {
  const { id } = await params;
  const { data } = await db().from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle();
  if (!data) throw new HttpError(404, 'Product not found');
  const p = normalizeProduct(data as any) as any;
  const user = await getUser(req);
  const isOwner = user && (user.id === p.seller_id || user.role === 'admin');
  if (!isOwner && (p.status !== 'active' || p.seller?.status !== 'approved')) throw new HttpError(404, 'Product not found');
  return p;
});

export const PUT = route(async (req, { params }) => {
  const { id } = await params;
  const user = await requireUser(req, ['seller', 'admin']);
  const { data } = await db().from('products').select('seller_id').eq('id', id).maybeSingle();
  if (!data) throw new HttpError(404, 'Product not found');
  if (user.role !== 'admin' && data.seller_id !== user.id) throw new HttpError(403, 'Not your product');
  return saveProduct(data.seller_id, id, await req.json());
});
