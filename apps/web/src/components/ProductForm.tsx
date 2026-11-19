'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, supabase } from '@/lib/client';
import type { Category, OptionType } from '@mm/shared';

interface VForm { label: string; price_delta: string; color_hex: string; image_url: string }
interface GForm { name: string; type: OptionType; required: boolean; values: VForm[] }
interface FormState {
  title: string; description: string; base_price: string; compare_at_price: string; category_id: string;
  images: { url: string }[]; option_groups: GForm[];
}

const empty: FormState = {
  title: '', description: '', base_price: '', compare_at_price: '', category_id: '', images: [], option_groups: [],
};

export function ProductForm({ product }: { product?: any }) {
  const router = useRouter();
  const [f, setF] = useState<FormState>(empty);
  const [cats, setCats] = useState<Category[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    api<Category[]>('/api/categories').then(setCats).catch(() => {});
  }, []);

  useEffect(() => {
    if (!product) return;
    setF({
      title: product.title,
      description: product.description || '',
      base_price: String(product.base_price),
      compare_at_price: product.compare_at_price == null ? '' : String(product.compare_at_price),
      category_id: product.category_id || '',
      images: product.images.map((i: any) => ({ url: i.url })),
      option_groups: product.option_groups.map((g: any) => ({
        name: g.name, type: g.type, required: g.required,
        values: g.values.map((v: any) => ({ label: v.label, price_delta: String(v.price_delta), color_hex: v.color_hex || '', image_url: v.image_url || '' })),
      })),
    });
  }, [product]);

  const setGroup = (gi: number, patch: Partial<GForm>) =>
    setF((s) => ({ ...s, option_groups: s.option_groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)) }));
  const setValue = (gi: number, vi: number, patch: Partial<VForm>) =>
    setF((s) => ({
      ...s,
      option_groups: s.option_groups.map((g, i) => (i === gi ? { ...g, values: g.values.map((v, j) => (j === vi ? { ...v, ...patch } : v)) } : g)),
    }));

  const upload = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const { url } = await api<{ url: string }>('/api/upload', { method: 'POST', body: fd });
    return url;
  };

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    try {
      const urls = await Promise.all([...files].map(upload));
      setF((s) => ({ ...s, images: [...s.images, ...urls.map((url) => ({ url }))] }));
    } catch (e: any) { setErr(e.message); }
  };

  const addPlaceholders = () => {
    const c = (f.option_groups.find((g) => g.type === 'swatch')?.values[0]?.color_hex || '#E8DCC4').replace('#', '');
    const labels = ['Front', 'Side', 'Headboard', 'Drawers', 'Detail'];
    setF((s) => ({ ...s, images: [...s.images, ...labels.map((t) => ({ url: `/api/placeholder?c=${c}&t=${t}` }))] }));
  };

  const describeFromPhoto = async (file: File | undefined) => {
    if (!file) return;
    setAiBusy(true);
    setErr('');
    try {
      const b64: string = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result).split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const out = await api<{ title: string; description: string }>('/api/ai/describe', { method: 'POST', json: { image: b64, mediaType: file.type } });
      setF((s) => ({ ...s, title: s.title || out.title, description: out.description }));
    } catch (e: any) { setErr(e.message); }
    finally { setAiBusy(false); }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error('Please log in');
      await api(product ? `/api/products/${product.id}` : '/api/products', { method: product ? 'PUT' : 'POST', json: f });
      router.push('/seller');
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={save}>
      <h1>{product ? 'Edit product' : 'Add product'}</h1>

      <div className="card">
        <label className="f">✨ AI: describe from a photo (fills title + description)</label>
        <input type="file" accept="image/*" disabled={aiBusy} onChange={(e) => describeFromPhoto(e.target.files?.[0])} />
        {aiBusy && <p className="muted">Looking at your photo…</p>}

        <label className="f">Title</label>
        <input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <label className="f">Description</label>
        <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <label className="f">Category</label>
        <select value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
          <option value="">— none —</option>
          {cats.filter((c) => c.parent_id).map((c) => <option key={c.id} value={c.id}>Furniture &gt; {c.name}</option>)}
        </select>
        <div className="row">
          <div style={{ flex: 1 }}>
            <label className="f">Base price (£)</label>
            <input required type="number" step="0.01" min="0" inputMode="decimal" value={f.base_price} onChange={(e) => setF({ ...f, base_price: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="f">Compare-at price (£)</label>
            <input type="number" step="0.01" min="0" inputMode="decimal" value={f.compare_at_price} onChange={(e) => setF({ ...f, compare_at_price: e.target.value })} />
          </div>
        </div>
      </div>

      <h2>Images ({f.images.length})</h2>
      <div className="card">
        <div className="thumbs" style={{ flexWrap: 'wrap' }}>
          {f.images.map((im, i) => (
            <div key={i} style={{ position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.url} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8 }} />
              <button type="button" className="linkbtn" style={{ position: 'absolute', top: -8, right: -8, background: '#fff', borderRadius: 99, minHeight: 28, padding: '0 8px' }}
                onClick={() => setF((s) => ({ ...s, images: s.images.filter((_, j) => j !== i) }))}>✕</button>
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <label className="btn secondary small">Upload photos<input type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} /></label>
          <button type="button" className="btn secondary small" onClick={addPlaceholders}>Add 5 placeholder images</button>
        </div>
      </div>

      <h2>Variation options</h2>
      <p className="muted">Swatch = colour picker (needs a hex colour). Select = choose one. Checkbox = optional add-on. Price is added to the base price.</p>
      {f.option_groups.map((g, gi) => (
        <div className="group-box" key={gi}>
          <div className="row">
            <input style={{ flex: 2 }} placeholder="Group name (Colour, Size…)" value={g.name} onChange={(e) => setGroup(gi, { name: e.target.value })} />
            <select style={{ flex: 1 }} value={g.type} onChange={(e) => setGroup(gi, { type: e.target.value as OptionType })}>
              <option value="swatch">Swatch</option><option value="select">Select</option><option value="checkbox">Checkbox</option>
            </select>
          </div>
          <label className="check"><input type="checkbox" checked={g.required} onChange={(e) => setGroup(gi, { required: e.target.checked })} /> Required</label>
          {g.values.map((v, vi) => (
            <div className="vrow" key={vi} style={g.type === 'swatch' ? { gridTemplateColumns: '1fr 80px 50px 44px' } : { gridTemplateColumns: '1fr 90px 44px' }}>
              <input placeholder="Label" value={v.label} onChange={(e) => setValue(gi, vi, { label: e.target.value })} />
              <input placeholder="+£" type="number" step="0.01" inputMode="decimal" value={v.price_delta} onChange={(e) => setValue(gi, vi, { price_delta: e.target.value })} />
              {g.type === 'swatch' && <input type="color" style={{ padding: 2 }} value={v.color_hex || '#cccccc'} onChange={(e) => setValue(gi, vi, { color_hex: e.target.value, image_url: v.image_url || `/api/placeholder?c=${e.target.value.slice(1)}&t=${encodeURIComponent(v.label)}` })} />}
              <button type="button" className="btn danger small" style={{ padding: 0 }} onClick={() => setGroup(gi, { values: g.values.filter((_, j) => j !== vi) })}>✕</button>
            </div>
          ))}
          <div className="row">
            <button type="button" className="btn secondary small" onClick={() => setGroup(gi, { values: [...g.values, { label: '', price_delta: '0', color_hex: '', image_url: '' }] })}>+ Add value</button>
            <button type="button" className="btn danger small" onClick={() => setF((s) => ({ ...s, option_groups: s.option_groups.filter((_, i) => i !== gi) }))}>Remove group</button>
          </div>
        </div>
      ))}
      <button type="button" className="btn secondary" onClick={() => setF((s) => ({ ...s, option_groups: [...s.option_groups, { name: '', type: 'select', required: true, values: [{ label: '', price_delta: '0', color_hex: '', image_url: '' }] }] }))}>
        + Add option group
      </button>

      {err && <p className="error">{err}</p>}
      <p><button className="btn" style={{ width: '100%' }} disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button></p>
    </form>
  );
}
