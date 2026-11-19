import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'missing',
  { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } },
);

/** Same backend as the web app: calls the Next.js API with the user's token. */
export async function api<T = any>(path: string, json?: unknown, method?: string): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;
  if (json !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(API_URL + path, {
    method: method || (json !== undefined ? 'POST' : 'GET'),
    headers,
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.error || `Request failed (${res.status})`);
  return out as T;
}

/** Image URLs from the API may be relative (placeholders). */
export const img = (u?: string | null) => (u ? (u.startsWith('http') ? u : API_URL + u) : undefined);
