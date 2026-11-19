import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, supabase } from './api';

export interface Me { id: string; email: string; full_name: string | null; role: 'buyer' | 'seller' | 'admin'; status: string }
interface Ctx { me: Me | null; ready: boolean; logout: () => Promise<void> }
const A = createContext<Ctx>({ me: null, ready: false, logout: async () => {} });
export const useAuth = () => useContext(A);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);

  const load = useCallback(async (hasSession: boolean) => {
    if (!hasSession) { setMe(null); setReady(true); return; }
    try { setMe(await api<Me>('/api/me')); } catch { setMe(null); }
    setReady(true);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => load(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => { load(!!session); });
    return () => data.subscription.unsubscribe();
  }, [load]);

  return <A.Provider value={{ me, ready, logout: async () => { await supabase.auth.signOut(); } }}>{children}</A.Provider>;
}
