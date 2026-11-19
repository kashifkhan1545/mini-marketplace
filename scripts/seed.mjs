// Seeds demo users + the Prague Divan Bed. Run AFTER the SQL migration:
//   npm run seed       (reads apps/web/.env.local)
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in apps/web/.env.local');
const db = createClient(url, key, { auth: { persistSession: false } });
const PASSWORD = process.env.DEMO_PASSWORD;
if (!PASSWORD) throw new Error('Set DEMO_PASSWORD in apps/web/.env.local (password for the demo accounts)');

async function user(email, role, full_name) {
  const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
  let u = list.users.find((x) => x.email === email);
  if (!u) {
    const { data, error } = await db.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
    if (error) throw error;
    u = data.user;
  }
  await db.from('profiles').upsert({ id: u.id, email, role, full_name, status: 'approved' });
  return u.id;
}

await user('buyer@demo.test', 'buyer', 'Demo Buyer');
const sellerId = await user('seller@demo.test', 'seller', 'Demo Seller');
await user('admin@demo.test', 'admin', 'Demo Admin');

const { data: cat } = await db.from('categories').select('id').eq('slug', 'divan-beds').single();

await db.from('products').delete().eq('seller_id', sellerId).eq('title', 'Prague Divan Bed – Cream Naples');
const { data: product, error } = await db
  .from('products')
  .insert({
    seller_id: sellerId,
    category_id: cat.id,
    title: 'Prague Divan Bed – Cream Naples',
    description: 'A button-tufted divan bed in soft Naples fabric. Choose your colour, size, storage, headboard and base.',
    base_price: 269.99,
    compare_at_price: 539.98,
  })
  .select('id')
  .single();
if (error) throw error;

// NOTE: colour names/hex are approximations of the reference page's swatch list — adjust in the seller form.
const colours = [
  ['Cream Naples', 'E8DCC4'], ['Grey Naples', '8E9094'], ['Silver Naples', 'C4C7CA'], ['Black Naples', '2B2B2D'],
  ['Mink Naples', 'A08C7D'], ['Steel Naples', '5F6B76'], ['Teal Naples', '2F7F86'], ['Pink Naples', 'D9A5B3'],
];
const ph = (c, t) => `/api/placeholder?c=${c}&t=${encodeURIComponent(t)}`;

await db.from('product_images').insert(
  ['Front', 'Side', 'Headboard', 'Drawers', 'Detail'].map((t, i) => ({ product_id: product.id, url: ph('E8DCC4', t), position: i })),
);

const groups = [
  { name: 'Colour', type: 'swatch', required: true, values: colours.map(([label, hex]) => ({ label, price_delta: 0, color_hex: '#' + hex, image_url: ph(hex, label) })) },
  { name: 'Size', type: 'select', required: true, values: [
    ['Small Single 2FT6', 90], ['Single 3FT', 95], ['Small Double 4FT', 100], ['Double 4FT6', 110], ['King 5FT', 125], ['Super King 6FT', 150],
  ].map(([label, price_delta]) => ({ label, price_delta })) },
  { name: 'Storage', type: 'select', required: true, values: [
    ['No Storage', 0], ['2 Drawers Left Side', 50], ['2 Drawers Right Side', 45], ['2 Drawers Foot End', 155], ['4 Drawers', 210],
  ].map(([label, price_delta]) => ({ label, price_delta })) },
  { name: 'Headboard', type: 'select', required: true, values: [
    ['FREE 26" Headboard', 0], ['54" Floor Standing Headboard', 10],
  ].map(([label, price_delta]) => ({ label, price_delta })) },
  { name: 'Base', type: 'select', required: true, values: [
    ['Standard Base (holds 50 stone)', 0], ['Reinforced Base (holds 100 stone)', 25],
  ].map(([label, price_delta]) => ({ label, price_delta })) },
  { name: 'Assembly', type: 'checkbox', required: false, values: [{ label: 'Professional Assembly', price_delta: 39.99 }] },
];

for (const [gi, g] of groups.entries()) {
  const { data: grp, error: e1 } = await db
    .from('option_groups').insert({ product_id: product.id, name: g.name, type: g.type, required: g.required, position: gi }).select('id').single();
  if (e1) throw e1;
  const { error: e2 } = await db.from('option_values').insert(
    g.values.map((v, vi) => ({ group_id: grp.id, label: v.label, price_delta: v.price_delta, color_hex: v.color_hex ?? null, image_url: v.image_url ?? null, position: vi })),
  );
  if (e2) throw e2;
}
console.log('Seeded demo accounts: buyer@demo.test / seller@demo.test / admin@demo.test');
