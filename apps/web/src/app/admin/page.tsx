'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client';
import { useAuth } from '@/components/Providers';
import { money } from '@mm/shared';

export default function Admin() {
  const { me, loading } = useAuth();
  const [data, setData] = useState<{ sellers: any[]; products: any[] } | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => api('/api/admin/overview').then(setData).catch((e) => setErr(e.message)), []);
  useEffect(() => { if (me?.role === 'admin') load(); }, [me, load]);

  const act = async (url: string, status: string) => {
    try { await api(url, { method: 'PATCH', json: { status } }); load(); } catch (e: any) { setErr(e.message); }
  };

  if (loading) return null;
  if (me?.role !== 'admin') return <><h1>Admin</h1><p>Admins only.</p><Link className="btn" href="/login?next=/admin">Log in</Link></>;

  return (
    <>
      <h1>Admin</h1>
      {err && <p className="error">{err}</p>}
      <h2>Sellers</h2>
      {data?.sellers.map((s) => (
        <div className="card row" key={s.id} style={{ justifyContent: 'space-between' }}>
          <div><b>{s.full_name || s.email}</b><div className="muted">{s.email} · <span className="status">{s.status}</span></div></div>
          <div className="row">
            {s.status !== 'approved' && <button className="btn small" onClick={() => act(`/api/admin/profiles/${s.id}`, 'approved')}>Approve</button>}
            {s.status !== 'hidden' && <button className="btn small danger" onClick={() => act(`/api/admin/profiles/${s.id}`, 'hidden')}>Hide</button>}
          </div>
        </div>
      ))}
      <h2>Listings</h2>
      {data?.products.map((p) => (
        <div className="card row" key={p.id} style={{ justifyContent: 'space-between' }}>
          <div><b>{p.title}</b><div className="muted">{money(Number(p.base_price))} · {p.seller?.full_name || p.seller?.email} · <span className="status">{p.status}</span></div></div>
          <div className="row">
            {p.status === 'hidden' ? (
              <button className="btn small" onClick={() => act(`/api/admin/products/${p.id}`, 'active')}>Show</button>
            ) : (
              <button className="btn small danger" onClick={() => act(`/api/admin/products/${p.id}`, 'hidden')}>Hide</button>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
