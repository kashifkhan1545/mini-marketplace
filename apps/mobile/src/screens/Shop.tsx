import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, TextInput, View } from 'react-native';
import { Product, colourGroup, discountPercent, money } from '@mm/shared';
import { api, img } from '../api';
import { C, Chip, s, shadow } from '../theme';

const CATS = [{ slug: '', label: 'All' }, { slug: 'furniture', label: 'Furniture' }, { slug: 'divan-beds', label: 'Divan Beds' }];

export default function Shop({ navigation }: any) {
  const [all, setAll] = useState<Product[]>([]);
  const [items, setItems] = useState<Product[] | null>(null);
  const [err, setErr] = useState('');
  const [f, setF] = useState({ q: '', category: '', colour: '', size: '', minPrice: '', maxPrice: '' });
  const [showF, setShowF] = useState(false);

  useEffect(() => { api<Product[]>('/api/products').then(setAll).catch(() => {}); }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      const qs = Object.entries(f).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
      api<Product[]>('/api/products' + (qs ? `?${qs}` : '')).then((d) => { setItems(d); setErr(''); }).catch((e) => setErr(e.message));
    }, 300);
    return () => clearTimeout(t);
  }, [f]);

  const colours = useMemo(() => [...new Set(all.flatMap((p) => colourGroup(p)?.values.map((v) => v.label) ?? []))], [all]);
  const sizes = useMemo(
    () => [...new Set(all.flatMap((p) => p.option_groups.find((g) => g.name.toLowerCase() === 'size')?.values.map((v) => v.label) ?? []))],
    [all],
  );
  const active = [f.colour, f.size, f.minPrice, f.maxPrice].filter(Boolean).length;
  const toggle = (k: 'colour' | 'size', v: string) => setF((cur) => ({ ...cur, [k]: cur[k] === v ? '' : v }));

  const header = (
    <View>
      <View style={{ borderRadius: 22, padding: 22, backgroundColor: C.brand, marginBottom: 14, overflow: 'hidden', ...shadow }}>
        <View style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(200,150,62,0.45)' }} />
        <Text style={{ alignSelf: 'flex-start', color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 0.8, borderColor: 'rgba(255,255,255,0.35)', borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 }}>
          MULTI-VENDOR MARKETPLACE
        </Text>
        <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.6, lineHeight: 31 }}>
          Furniture you will love, from sellers you can trust.
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 8 }}>Pick your colour, size and storage — the price updates as you go.</Text>
      </View>

      <TextInput value={f.q} onChangeText={(q) => setF({ ...f, q })} placeholder="🔍  Search products…" placeholderTextColor="#9aa3ad"
        style={[s.input, { borderRadius: 99, paddingHorizontal: 18, marginBottom: 10 }, shadow]} />

      <View style={[s.wrap, { marginBottom: 10 }]}>
        {CATS.map((c) => <Chip key={c.slug} label={c.label} on={f.category === c.slug} onPress={() => setF({ ...f, category: c.slug })} />)}
        <Chip label={`Filters${active ? ` (${active})` : ''}`} on={showF || active > 0} onPress={() => setShowF(!showF)} />
      </View>

      {showF && (
        <View style={s.card}>
          <Text style={s.label}>Colour</Text>
          <View style={s.wrap}>{colours.map((c) => <Chip key={c} label={c} on={f.colour === c} onPress={() => toggle('colour', c)} />)}</View>
          <Text style={s.label}>Size</Text>
          <View style={s.wrap}>{sizes.map((c) => <Chip key={c} label={c} on={f.size === c} onPress={() => toggle('size', c)} />)}</View>
          <Text style={s.label}>Price (£)</Text>
          <View style={s.row}>
            <TextInput style={[s.input, { flex: 1 }]} placeholder="Min" keyboardType="decimal-pad" value={f.minPrice} onChangeText={(minPrice) => setF({ ...f, minPrice })} />
            <TextInput style={[s.input, { flex: 1 }]} placeholder="Max" keyboardType="decimal-pad" value={f.maxPrice} onChangeText={(maxPrice) => setF({ ...f, maxPrice })} />
          </View>
          <Pressable onPress={() => setF({ ...f, colour: '', size: '', minPrice: '', maxPrice: '' })} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ color: C.brand, fontWeight: '700' }}>Clear filters</Text>
          </Pressable>
        </View>
      )}
      {err ? <Text style={s.err}>{err}</Text> : null}
      {!items && !err ? <ActivityIndicator color={C.brand} style={{ marginTop: 20 }} /> : null}
    </View>
  );

  return (
    <FlatList
      style={s.screen}
      data={items || []}
      keyExtractor={(p) => p.id}
      contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
      ListHeaderComponent={header}
      ListEmptyComponent={items ? <Text style={s.muted}>No products found.</Text> : undefined}
      renderItem={({ item: p }) => {
        const pct = discountPercent(p.base_price, p.compare_at_price);
        return (
          <Pressable style={[s.card, { padding: 0, overflow: 'hidden' }]} onPress={() => navigation.navigate('Product', { id: p.id })}>
            <View>
              <Image source={{ uri: img(p.images[0]?.url) }} style={{ width: '100%', height: 200, backgroundColor: '#ece8e0' }} />
              {pct ? <Text style={[s.badge, { position: 'absolute', top: 10, left: 10 }]}>{pct}% OFF</Text> : null}
            </View>
            <View style={{ padding: 14 }}>
              <Text style={s.title}>{p.title}</Text>
              <View style={[s.row, { marginTop: 6 }]}>
                <Text style={s.muted}>from</Text>
                <Text style={[s.price, { fontSize: 19 }]}>{money(p.base_price)}</Text>
                {p.compare_at_price ? <Text style={s.was}>{money(p.compare_at_price)}</Text> : null}
              </View>
            </View>
          </Pressable>
        );
      }}
    />
  );
}
