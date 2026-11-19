import { db, route, requireUser, HttpError } from '@/lib/server/db';

// POST multipart/form-data { file } -> { url }   (seller)
export const POST = route(async (req) => {
  const user = await requireUser(req, ['seller', 'admin']);
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) throw new HttpError(400, 'No file');
  if (file.size > 5 * 1024 * 1024) throw new HttpError(400, 'Max 5MB');
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await db().storage.from('product-images').upload(path, await file.arrayBuffer(), { contentType: file.type });
  if (error) throw new HttpError(500, error.message);
  const { data } = db().storage.from('product-images').getPublicUrl(path);
  return { url: data.publicUrl };
});
