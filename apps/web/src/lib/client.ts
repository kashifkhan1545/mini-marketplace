'use client';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'missing',
);

/** Fetch our own API with the logged-in user's token. */
export async function api<T = any>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  if (data.session) headers.set('Authorization', `Bearer ${data.session.access_token}`);
  let body = init.body;
  if (init.json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(init.json);
  }
  const res = await fetch(path, { ...init, headers, body });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.error || `Request failed (${res.status})`);
  return out as T;
}
