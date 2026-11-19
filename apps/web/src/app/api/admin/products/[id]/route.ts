import { db, route, requireUser, HttpError } from '@/lib/server/db';

// PATCH { status: 'active' | 'hidden' }
export const PATCH = route(async (req, { params }) => {
  const { id } = await params;
  await requireUser(req, ['admin']);
  const { status } = await req.json();
  if (!['active', 'hidden'].includes(status)) throw new HttpError(400, 'Invalid status');
  const { error } = await db().from('products').update({ status }).eq('id', id);
  if (error) throw new HttpError(500, error.message);
  return { ok: true };
});
