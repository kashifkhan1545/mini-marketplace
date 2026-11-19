import { db, route, HttpError } from '@/lib/server/db';

// POST /api/auth/signup { email, password, full_name, role: 'buyer' | 'seller' }
// New sellers start as "pending" until an admin approves them.
export const POST = route(async (req) => {
  const { email, password, full_name, role } = await req.json();
  if (!email || !password || String(password).length < 6) throw new HttpError(400, 'Email and a password of 6+ characters are required');
  const r = role === 'seller' ? 'seller' : 'buyer';
  const { data, error } = await db().auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new HttpError(400, error?.message || 'Could not create user');
  const { error: pErr } = await db()
    .from('profiles')
    .insert({ id: data.user.id, email, full_name: full_name || null, role: r, status: r === 'seller' ? 'pending' : 'approved' });
  if (pErr) {
    await db().auth.admin.deleteUser(data.user.id);
    throw new HttpError(500, pErr.message);
  }
  return { ok: true };
});
