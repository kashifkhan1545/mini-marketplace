import { db, route } from '@/lib/server/db';

export const GET = route(async () => {
  const { data } = await db().from('categories').select('*').order('name');
  return data || [];
});
