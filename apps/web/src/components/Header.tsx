'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, useCart } from './Providers';

const I = {
  shop: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  cart: <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 8H6M9 20.5h.01M17 20.5h.01" />,
  orders: <path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" />,
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />,
  seller: <path d="M4 7h16l-1.5-3h-13zM5 7v13h14V7M9 20v-6h6v6" />,
  admin: <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z" />,
};
const Icon = ({ d }: { d: keyof typeof I }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {I[d]}
  </svg>
);

export function Header() {
  const { me, logout } = useAuth();
  const { count } = useCart();
  const path = usePathname() || '/';
  const is = (p: string) => (p === '/' ? path === '/' : path.startsWith(p));
  const cls = (p: string) => (is(p) ? 'active' : '');

  const tabs: { href: string; label: string; icon: keyof typeof I; badge?: number }[] = [
    { href: '/', label: 'Shop', icon: 'shop' },
    { href: '/cart', label: 'Basket', icon: 'cart', badge: count },
  ];
  if (me?.role === 'buyer') tabs.push({ href: '/orders', label: 'Orders', icon: 'orders' });
  if (me?.role === 'seller') tabs.push({ href: '/seller', label: 'Seller', icon: 'seller' });
  if (me?.role === 'admin') tabs.push({ href: '/admin', label: 'Admin', icon: 'admin' });
  tabs.push(me ? { href: '#logout', label: 'Log out', icon: 'user' } : { href: '/login', label: 'Log in', icon: 'user' });

  return (
    <>
      <header className="header">
        <div className="container header-in">
          <Link href="/" className="logo">
            <i>M</i>
            <span>
              Mini<b>Market</b>
            </span>
          </Link>
          <nav className="nav" aria-label="Main">
            <Link href="/" className={cls('/')}>Shop</Link>
            {me?.role === 'seller' && <Link href="/seller" className={cls('/seller')}>Seller</Link>}
            {me?.role === 'admin' && <Link href="/admin" className={cls('/admin')}>Admin</Link>}
            {me?.role === 'buyer' && <Link href="/orders" className={cls('/orders')}>Orders</Link>}
            <Link href="/cart" className={cls('/cart')}>
              Basket{count > 0 && <span className="badge-count">{count}</span>}
            </Link>
            {me ? (
              <button className="linkbtn" onClick={logout}>Log out</button>
            ) : (
              <Link href="/login" className={cls('/login')}>Log in</Link>
            )}
          </nav>
          <Link href="/cart" className="hdr-cart" aria-label={`Basket, ${count} items`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{I.cart}</svg>
            {count > 0 && <span>{count}</span>}
          </Link>
        </div>
      </header>

      <nav className="tabbar" aria-label="Tabs">
        {tabs.map((t) =>
          t.href === '#logout' ? (
            <button key={t.label} onClick={logout}>
              <Icon d={t.icon} />
              {t.label}
            </button>
          ) : (
            <Link key={t.label} href={t.href} className={is(t.href) ? 'on' : ''}>
              <Icon d={t.icon} />
              {t.label}
              {!!t.badge && <span className="dot">{t.badge}</span>}
            </Link>
          ),
        )}
      </nav>
    </>
  );
}
