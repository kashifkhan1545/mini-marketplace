'use client';
import Link from 'next/link';
import { useAuth } from '@/components/Providers';
import { OrderList } from '@/components/OrderList';

export default function Orders() {
  const { me, loading } = useAuth();
  if (loading) return null;
  if (!me) return <><h1>My orders</h1><Link className="btn" href="/login?next=/orders">Log in</Link></>;
  return (
    <>
      <h1>My orders</h1>
      {typeof window !== 'undefined' && location.search.includes('placed') && <p className="ok">Order placed — thank you!</p>}
      <OrderList />
    </>
  );
}
