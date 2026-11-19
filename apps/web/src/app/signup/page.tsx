'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import { useAuth } from '@/components/Providers';

export default function Signup() {
  const { login } = useAuth();
  const router = useRouter();
  const [f, setF] = useState({ full_name: '', email: '', password: '', role: 'buyer' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await api('/api/auth/signup', { method: 'POST', json: f });
      const me = await login(f.email, f.password);
      router.push(me.role === 'seller' ? '/seller' : '/');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ maxWidth: 420 }}>
      <h1>Create account</h1>
      <label className="f">I want to</label>
      <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
        <option value="buyer">Buy things</option>
        <option value="seller">Sell things (needs admin approval)</option>
      </select>
      <label className="f">Name</label>
      <input required value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
      <label className="f">Email</label>
      <input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <label className="f">Password (6+ characters)</label>
      <input type="password" required minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      {err && <p className="error">{err}</p>}
      <p><button className="btn" style={{ width: '100%' }} disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button></p>
    </form>
  );
}
