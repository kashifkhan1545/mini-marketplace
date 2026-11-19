import { db, route, requireUser } from '@/lib/server/db';

export const GET = route(async (req) => {
  await requireUser(req, ['admin']);
  const { data: sellers } = await db().from('profiles').select('*').eq('role', 'seller').order('created_at', { ascending: false });
  const { data: products } = await db()
    .from('products')
    .select('id,title,status,base_price,seller:profiles!products_seller_id_fkey(full_name,email)')
    .order('created_at', { ascending: false });
  return { sellers: sellers || [], products: products || [] };
});
