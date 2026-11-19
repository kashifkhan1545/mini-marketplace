import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { Role } from '@mm/shared';

let _admin: SupabaseClient | null = null;
/** Service-role client. Server only — never import from client components. */
export function db(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new HttpError(500, 'Supabase env vars are not configured');
    _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return _admin;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface AuthedUser {
  id: string;
  email: string;
  role: Role;
  status: string;
  full_name: string | null;
}

export async function getUser(req: NextRequest): Promise<AuthedUser | null> {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const { data, error } = await db().auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile } = await db().from('profiles').select('*').eq('id', data.user.id).single();
  if (!profile) return null;
  return profile as AuthedUser;
}

export async function requireUser(req: NextRequest, roles?: Role[]): Promise<AuthedUser> {
  const user = await getUser(req);
  if (!user) throw new HttpError(401, 'Please log in');
  if (roles && !roles.includes(user.role)) throw new HttpError(403, 'Not allowed');
  return user;
}

type Ctx = { params: Promise<Record<string, string>> };
/** Wraps a route handler so thrown HttpErrors become JSON responses. */
export function route(fn: (req: NextRequest, ctx: Ctx) => Promise<unknown>) {
  return async (req: NextRequest, ctx: Ctx) => {
    try {
      const out = await fn(req, ctx);
      return out instanceof NextResponse ? out : NextResponse.json(out);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      console.error(e);
      return NextResponse.json({ error: (e as Error).message || 'Server error' }, { status: 500 });
    }
  };
}

export const PRODUCT_SELECT =
  '*, images:product_images(*), option_groups(*, values:option_values(*)), category:categories(id,name,slug,parent_id), seller:profiles!products_seller_id_fkey(id,full_name,status)';

/** Sort images / groups / values by position so the UI order is stable. */
export function normalizeProduct<T extends Record<string, any>>(p: T): T {
  const byPos = (a: any, b: any) => a.position - b.position;
  return {
    ...p,
    base_price: Number(p.base_price),
    compare_at_price: p.compare_at_price == null ? null : Number(p.compare_at_price),
    images: [...(p.images || [])].sort(byPos),
    option_groups: [...(p.option_groups || [])].sort(byPos).map((g: any) => ({
      ...g,
      values: [...(g.values || [])].sort(byPos).map((v: any) => ({ ...v, price_delta: Number(v.price_delta) })),
    })),
  };
}
