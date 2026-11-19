'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client';
import { colourGroup, discountPercent, money, type Product } from '@mm/shared';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [all, setAll] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [f, setF] = useState({ q: '', category: '', minPrice: '', maxPrice: '', colour: '', size: '' });

  // Load everything once to build the filter dropdowns.
  useEffect(() => {
    api<Product[]>('/api/products').then(setAll).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]);
      setLoading(true);
      api<Product[]>(`/api/products?${qs}`)
        .then((p) => {
          setProducts(p);
          setErr('');
        })
        .catch((e) => setErr(e.message))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [f]);

  const colours = useMemo(() => [...new Set(all.flatMap((p) => colourGroup(p)?.values.map((v) => v.label) ?? []))], [all]);
  const sizes = useMemo(
    () => [...new Set(all.flatMap((p) => p.option_groups.find((g) => g.name.toLowerCase() === 'size')?.values.map((v) => v.label) ?? []))],
    [all],
  );
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <>
      <section className="hero">
        <span className="pill">MULTI-VENDOR MARKETPLACE</span>
        <h1>Furniture you will love, from sellers you can trust.</h1>
        <p>Pick your colour, size and storage — the price updates as you go.</p>
        <a className="btn" href="#products">Shop divan beds</a>
      </section>
      <div className="searchbar" id="products">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input placeholder="Search products…" value={f.q} onChange={set('q')} />
      </div>
      <div className="filters">
        <select value={f.category} onChange={set('category')}>
          <option value="">All categories</option>
          <option value="furniture">Furniture</option>
          <option value="divan-beds">Divan Beds</option>
        </select>
        <select value={f.colour} onChange={set('colour')}>
          <option value="">Any colour</option>
          {colours.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={f.size} onChange={set('size')}>
          <option value="">Any size</option>
          {sizes.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input type="number" inputMode="decimal" placeholder="Min £" value={f.minPrice} onChange={set('minPrice')} />
        <input type="number" inputMode="decimal" placeholder="Max £" value={f.maxPrice} onChange={set('maxPrice')} />
      </div>
      {err && <p className="error">{err}</p>}
      {loading ? <p className="muted">Loading…</p> : products.length === 0 ? <p className="muted">No products found.</p> : null}
      <div className="grid">
        {products.map((p) => {
          const off = discountPercent(p.base_price, p.compare_at_price);
          return (
            <Link key={p.id} href={`/products/${p.id}`} className="pcard">
              <div className="imgw">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.images[0]?.url} alt={p.title} loading="lazy" />
                {off && <span className="off">{off}% OFF</span>}
              </div>
              <div className="pbody">
                <div className="t">{p.title}</div>
                <div className="pr">
                  <span className="muted">from</span>
                  <b>{money(p.base_price)}</b>
                  {p.compare_at_price && <span className="was">{money(p.compare_at_price)}</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
