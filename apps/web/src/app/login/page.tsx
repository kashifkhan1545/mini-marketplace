'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/Providers';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const me = await login(email, password);
      const next = new URLSearchParams(location.search).get('next');
      router.push(next || (me.role === 'seller' ? '/seller' : me.role === 'admin' ? '/admin' : '/'));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ maxWidth: 420 }}>
      <h1>Log in</h1>
      <label className="f">Email</label>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      <label className="f">Password</label>
      <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      {err && <p className="error">{err}</p>}
      <p><button className="btn" style={{ width: '100%' }} disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button></p>
      <p className="muted">No account? <Link href="/signup" style={{ textDecoration: 'underline' }}>Sign up</Link></p>
    </form>
  );
}
