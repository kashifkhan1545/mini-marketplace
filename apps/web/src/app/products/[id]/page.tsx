'use client';
import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import { useCart } from '@/components/Providers';
import { Gallery } from '@/components/Gallery';
import {
  chosenOptions, colourGroup, computePrice, defaultSelection, discountPercent, displayTitle, money, selectionKey,
  type Product, type Selection,
} from '@mm/shared';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [p, setP] = useState<Product | null>(null);
  const [err, setErr] = useState('');
  const [sel, setSel] = useState<Selection>({});
  const [added, setAdded] = useState(false);
  const cart = useCart();
  const router = useRouter();

  useEffect(() => {
    api<Product>(`/api/products/${id}`)
      .then((prod) => {
        setP(prod);
        setSel(defaultSelection(prod));
      })
      .catch((e) => setErr(e.message));
  }, [id]);

  const cg = useMemo(() => (p ? colourGroup(p) : undefined), [p]);
  const colour = cg?.values.find((v) => v.id === sel[cg.id]);
  const images = useMemo(() => {
    if (!p) return [];
    const base = p.images.map((i) => i.url);
    return colour?.image_url ? [colour.image_url, ...base.filter((u) => u !== colour.image_url)] : base;
  }, [p, colour]);

  if (err) return <p className="error">{err}</p>;
  if (!p) return <p className="muted">Loading…</p>;

  const price = computePrice(p, sel);
  const off = discountPercent(p.base_price, p.compare_at_price);
  const title = displayTitle(p.title, colour?.label);
  // compare-at scales with the options so the crossed-out price stays a consistent "was" price
  const wasPrice = p.compare_at_price ? Math.round((p.compare_at_price + (price - p.base_price)) * 100) / 100 : null;

  const choose = (gid: string, vid: string | null) =>
    setSel((s) => {
      const n = { ...s };
      if (vid) n[gid] = vid;
      else delete n[gid];
      return n;
    });

  const addToCart = () => {
    cart.add({
      key: selectionKey(p.id, sel),
      productId: p.id,
      title,
      image: images[0] ?? null,
      qty: 1,
      selection: sel,
      options: chosenOptions(p, sel),
      unitPrice: price,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="pdp">
      <Gallery images={images} alt={title} />
      <div>
        <h1 style={{ marginTop: 0 }}>{title}</h1>
        <div>
          <span className="price">{money(price)}</span>
          {wasPrice && <span className="was">{money(wasPrice)}</span>}
          {off && <span className="off">{off}% OFF</span>}
        </div>
        <p className="muted">Sold by {p.seller?.full_name || 'Demo Seller'}</p>

        {p.option_groups.map((g) => (
          <div className="opt" key={g.id}>
            {g.type === 'swatch' && (
              <>
                <div className="opt-h">{g.name}: <span>{g.values.find((v) => v.id === sel[g.id])?.label}</span></div>
                <div className="swatches" role="radiogroup">
                  {g.values.map((v) => (
                    <button
                      key={v.id}
                      className={`sw ${sel[g.id] === v.id ? 'on' : ''}`}
                      style={{ background: v.color_hex || '#ccc' }}
                      aria-label={v.label}
                      aria-checked={sel[g.id] === v.id}
                      role="radio"
                      title={v.label}
                      onClick={() => choose(g.id, v.id)}
                    />
                  ))}
                </div>
              </>
            )}
            {g.type === 'select' && (
              <>
                <div className="opt-h">{g.name}</div>
                <div className="choices">
                  {g.values.map((v) => (
                    <button key={v.id} className={`chip ${sel[g.id] === v.id ? 'on' : ''}`} onClick={() => choose(g.id, v.id)}>
                      {v.label}
                      <small>{v.price_delta > 0 ? `+${money(v.price_delta)}` : 'Included'}</small>
                    </button>
                  ))}
                </div>
              </>
            )}
            {g.type === 'checkbox' &&
              g.values.map((v) => (
                <label className="check" key={v.id}>
                  <input type="checkbox" checked={sel[g.id] === v.id} onChange={(e) => choose(g.id, e.target.checked ? v.id : null)} />
                  <span>
                    {v.label} <b>+{money(v.price_delta)}</b>
                  </span>
                </label>
              ))}
          </div>
        ))}

        {p.description && (
          <>
            <h2>Description</h2>
            <p>{p.description}</p>
          </>
        )}
      </div>

      <div className="stickybar">
        <div className="p">{money(price)}</div>
        <button className="btn" onClick={added ? () => router.push('/cart') : addToCart}>
          {added ? 'Added ✓ View basket' : 'Add to Basket'}
        </button>
      </div>
    </div>
  );
}
