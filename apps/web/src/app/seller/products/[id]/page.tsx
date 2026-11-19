'use client';
import { use, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { ProductForm } from '@/components/ProductForm';

export default function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [p, setP] = useState<any>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    api(`/api/products/${id}`).then(setP).catch((e) => setErr(e.message));
  }, [id]);
  if (err) return <p className="error">{err}</p>;
  if (!p) return <p className="muted">Loading…</p>;
  return <ProductForm product={p} />;
}
