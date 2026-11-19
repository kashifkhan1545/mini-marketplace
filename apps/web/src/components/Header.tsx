'use client';
import Link from 'next/link';
import { useAuth, useCart } from './Providers';

export function Header() {
  const { me, logout } = useAuth();
  const { count } = useCart();
  return (
    <header className="header">
      <div className="container header-in">
        <Link href="/" className="logo">
          Mini<b>Market</b>
        </Link>
        <nav className="nav">
          {me?.role === 'seller' && <Link href="/seller">Seller</Link>}
          {me?.role === 'admin' && <Link href="/admin">Admin</Link>}
          {me?.role === 'buyer' && <Link href="/orders">Orders</Link>}
          <Link href="/cart" className="cart-link">
            Basket{count > 0 && <span className="badge-count">{count}</span>}
          </Link>
          {me ? (
            <button className="linkbtn" onClick={logout}>
              Log out
            </button>
          ) : (
            <Link href="/login">Log in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
