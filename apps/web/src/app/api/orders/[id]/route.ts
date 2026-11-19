import { db, route, requireUser, HttpError } from '@/lib/server/db';
import { ORDER_STATUSES } from '@mm/shared';

// PATCH /api/orders/:id { status } — seller (owner) or admin
export const PATCH = route(async (req, { params }) => {
  const { id } = await params;
  const user = await requireUser(req, ['seller', 'admin']);
  const { status } = await req.json();
  if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Invalid status');
  const { data: order } = await db().from('orders').select('seller_id').eq('id', id).maybeSingle();
  if (!order) throw new HttpError(404, 'Order not found');
  if (user.role !== 'admin' && order.seller_id !== user.id) throw new HttpError(403, 'Not your order');
  const { error } = await db().from('orders').update({ status }).eq('id', id);
  if (error) throw new HttpError(500, error.message);
  return { ok: true };
});
