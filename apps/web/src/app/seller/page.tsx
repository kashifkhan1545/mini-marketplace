'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client';
import { useAuth } from '@/components/Providers';
import { OrderList } from '@/components/OrderList';
import { money, type Product } from '@mm/shared';

export default function Seller() {
  const { me, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [tab, setTab] = useState<'products' | 'orders'>('products');

  useEffect(() => {
    if (me?.role === 'seller' || me?.role === 'admin') api<Product[]>('/api/products?scope=mine').then(setProducts).catch(() => {});
  }, [me]);

  if (loading) return null;
  if (!me || (me.role !== 'seller' && me.role !== 'admin'))
    return <><h1>Seller area</h1><p>Log in with a seller account.</p><Link className="btn" href="/login?next=/seller">Log in</Link></>;

  return (
    <>
      <h1>Seller dashboard</h1>
      {me.status !== 'approved' && <p className="error">Your seller account is {me.status}. Your products stay hidden until an admin approves you.</p>}
      <div className="row" style={{ marginBottom: 12 }}>
        <button className={`btn small ${tab === 'products' ? '' : 'secondary'}`} onClick={() => setTab('products')}>My products</button>
        <button className={`btn small ${tab === 'orders' ? '' : 'secondary'}`} onClick={() => setTab('orders')}>Incoming orders</button>
        <Link className="btn small secondary" href="/seller/products/new">+ Add product</Link>
      </div>
      {tab === 'orders' ? (
        <OrderList seller />
      ) : products.length === 0 ? (
        <p className="muted">No products yet.</p>
      ) : (
        products.map((p) => (
          <div className="card line" key={p.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.images[0] && <img src={p.images[0].url} alt="" />}
            <div className="grow">
              <b>{p.title}</b>
              <div className="muted">{money(p.base_price)} · <span className="status">{p.status}</span></div>
              <div className="row" style={{ marginTop: 6 }}>
                <Link className="btn small secondary" href={`/seller/products/${p.id}`}>Edit</Link>
                <Link className="btn small secondary" href={`/products/${p.id}`}>View</Link>
              </div>
            </div>
          </div>
        ))
      )}
    </>
  );
}
