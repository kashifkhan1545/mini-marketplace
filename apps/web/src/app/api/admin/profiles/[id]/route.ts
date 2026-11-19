import { db, route, requireUser, HttpError } from '@/lib/server/db';

// PATCH { status: 'approved' | 'hidden' | 'pending' }
export const PATCH = route(async (req, { params }) => {
  const { id } = await params;
  await requireUser(req, ['admin']);
  const { status } = await req.json();
  if (!['approved', 'hidden', 'pending'].includes(status)) throw new HttpError(400, 'Invalid status');
  const { error } = await db().from('profiles').update({ status }).eq('id', id).eq('role', 'seller');
  if (error) throw new HttpError(500, error.message);
  return { ok: true };
});
