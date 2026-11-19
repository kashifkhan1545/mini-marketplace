'use client';
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import type { CartLine, Role } from '@mm/shared';
import { api, supabase } from '@/lib/client';

export interface Me {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  status: string;
}

interface AuthCtx {
  me: Me | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Me>;
  logout: () => Promise<void>;
}
const Auth = createContext<AuthCtx>(null as any);
export const useAuth = () => useContext(Auth);

interface CartCtx {
  lines: CartLine[];
  add: (line: CartLine) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  count: number;
  total: number;
}
const Cart = createContext<CartCtx>(null as any);
export const useCart = () => useContext(Cart);

export function Providers({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  const loadMe = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setMe(null);
      return null;
    }
    try {
      const m = await api<Me>('/api/me');
      setMe(m);
      return m;
    } catch {
      setMe(null);
      return null;
    }
  }, []);

  useEffect(() => {
    loadMe().finally(() => setLoading(false));
    const { data: sub } = supabase.auth.onAuthStateChange((evt) => {
      if (evt === 'SIGNED_OUT') setMe(null);
    });
    try {
      setLines(JSON.parse(localStorage.getItem('mm_cart') || '[]'));
    } catch {}
    setReady(true);
    return () => sub.subscription.unsubscribe();
  }, [loadMe]);

  useEffect(() => {
    if (ready) localStorage.setItem('mm_cart', JSON.stringify(lines));
  }, [lines, ready]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    const m = await loadMe();
    if (!m) throw new Error('No profile found for this account');
    return m;
  };
  const logout = async () => {
    await supabase.auth.signOut();
    setMe(null);
  };

  const add = (line: CartLine) =>
    setLines((ls) => {
      const existing = ls.find((l) => l.key === line.key);
      if (existing) return ls.map((l) => (l.key === line.key ? { ...l, qty: l.qty + line.qty } : l));
      return [...ls, line];
    });
  const setQty = (key: string, qty: number) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, qty: Math.max(1, qty) } : l)));
  const remove = (key: string) => setLines((ls) => ls.filter((l) => l.key !== key));
  const clear = () => setLines([]);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const total = Math.round(lines.reduce((s, l) => s + l.unitPrice * l.qty, 0) * 100) / 100;

  return (
    <Auth.Provider value={{ me, loading, login, logout }}>
      <Cart.Provider value={{ lines, add, setQty, remove, clear, count, total }}>{children}</Cart.Provider>
    </Auth.Provider>
  );
}
