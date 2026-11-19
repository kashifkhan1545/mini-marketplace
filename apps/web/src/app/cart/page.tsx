'use client';
import Link from 'next/link';
import { useCart } from '@/components/Providers';
import { money } from '@mm/shared';

export default function CartPage() {
  const { lines, setQty, remove, total } = useCart();
  if (!lines.length)
    return (
      <>
        <h1>Your basket</h1>
        <p className="muted">Your basket is empty.</p>
        <Link href="/" className="btn">Continue shopping</Link>
      </>
    );
  return (
    <>
      <h1>Your basket</h1>
      {lines.map((l) => (
        <div className="card line" key={l.key}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {l.image && <img src={l.image} alt="" />}
          <div className="grow">
            <b>{l.title}</b>
            {l.options.map((o) => (
              <div className="opts" key={o.group}>
                {o.group}: {o.label}
                {o.price_delta > 0 ? ` (+${money(o.price_delta)})` : ''}
              </div>
            ))}
            <div className="row" style={{ marginTop: 8, justifyContent: 'space-between' }}>
              <div className="qty">
                <button onClick={() => setQty(l.key, l.qty - 1)} aria-label="Less">−</button>
                <span>{l.qty}</span>
                <button onClick={() => setQty(l.key, l.qty + 1)} aria-label="More">+</button>
              </div>
              <b>{money(l.unitPrice * l.qty)}</b>
            </div>
            <button className="linkbtn" onClick={() => remove(l.key)} style={{ color: 'var(--danger)', paddingLeft: 0 }}>Remove</button>
          </div>
        </div>
      ))}
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <b>Total</b>
        <b className="price">{money(total)}</b>
      </div>
      <Link href="/checkout" className="btn" style={{ width: '100%' }}>Checkout</Link>
    </>
  );
}
