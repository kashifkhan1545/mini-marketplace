'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import { useAuth, useCart } from '@/components/Providers';
import { money } from '@mm/shared';

export default function Checkout() {
  const { me, loading } = useAuth();
  const { lines, total, clear } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (!me)
    return (
      <>
        <h1>Checkout</h1>
        <p>Please log in to place your order.</p>
        <Link className="btn" href="/login?next=/checkout">Log in</Link>
      </>
    );
  if (!lines.length) return <p className="muted">Your basket is empty.</p>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await api('/api/checkout', {
        method: 'POST',
        json: { items: lines.map((l) => ({ productId: l.productId, qty: l.qty, selection: l.selection })), shipping: form },
      });
      clear();
      router.push('/orders?placed=1');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <h1>Checkout</h1>
      <div className="card">
        <label className="f">Full name</label>
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
        <label className="f">Delivery address</label>
        <textarea required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} autoComplete="street-address" />
        <label className="f">Phone (optional)</label>
        <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
      </div>
      <div className="card">
        <b>Payment</b>
        <p className="muted">Demo checkout — no real payment is taken.</p>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>{lines.reduce((s, l) => s + l.qty, 0)} item(s)</span>
          <b className="price">{money(total)}</b>
        </div>
      </div>
      {err && <p className="error">{err}</p>}
      <button className="btn" style={{ width: '100%' }} disabled={busy}>{busy ? 'Placing order…' : 'Place order'}</button>
    </form>
  );
}
