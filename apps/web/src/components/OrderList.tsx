'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { money, ORDER_STATUSES } from '@mm/shared';

export function OrderList({ seller }: { seller?: boolean }) {
  const [orders, setOrders] = useState<any[] | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => api<any[]>('/api/orders').then(setOrders).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: string) => {
    try {
      await api(`/api/orders/${id}`, { method: 'PATCH', json: { status } });
      load();
    } catch (e: any) { setErr(e.message); }
  };

  if (err) return <p className="error">{err}</p>;
  if (!orders) return <p className="muted">Loading…</p>;
  if (!orders.length) return <p className="muted">No orders yet.</p>;

  return (
    <>
      {orders.map((o) => (
        <div className="card" key={o.id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <b>#{o.id.slice(0, 8)}</b>
            <span className={`status ${o.status}`}>{o.status}</span>
          </div>
          <div className="muted">
            {new Date(o.created_at).toLocaleString()}
            {seller && ` · ${o.shipping_name}, ${o.shipping_address}`}
          </div>
          {o.items.map((i: any) => (
            <div className="line" key={i.id} style={{ marginTop: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {i.image_url && <img src={i.image_url} alt="" />}
              <div className="grow">
                <b>{i.title}</b> × {i.qty}
                {(i.options || []).map((op: any) => <div className="opts" key={op.group}>{op.group}: {op.label}</div>)}
              </div>
              <b>{money(i.unit_price * i.qty)}</b>
            </div>
          ))}
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
            <b>Total {money(o.total)}</b>
            {seller && (
              <select style={{ width: 'auto' }} value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
