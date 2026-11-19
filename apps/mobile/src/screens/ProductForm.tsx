import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { Category, OptionType } from '@mm/shared';
import { api, img, uploadImage } from '../api';
import { Btn, C, Chip, Field, s } from '../theme';

interface VForm { label: string; price_delta: string; color_hex: string; image_url: string }
interface GForm { name: string; type: OptionType; required: boolean; values: VForm[] }
interface FormState { title: string; description: string; base_price: string; compare_at_price: string; category_id: string; images: { url: string }[]; option_groups: GForm[] }
const empty: FormState = { title: '', description: '', base_price: '', compare_at_price: '', category_id: '', images: [], option_groups: [] };
const PALETTE = ['#E8DCC4', '#8C8C8F', '#B9BDC1', '#2B2B2D', '#9C8878', '#5B6772', '#2F7D86', '#D6A1B3'];
const blankValue = (): VForm => ({ label: '', price_delta: '0', color_hex: '', image_url: '' });

export default function ProductForm({ route, navigation }: any) {
  const id: string | undefined = route.params?.id;
  const [f, setF] = useState<FormState>(empty);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => { navigation.setOptions({ title: id ? 'Edit product' : 'Add product' }); }, [id, navigation]);
  useEffect(() => { api<Category[]>('/api/categories').then(setCats).catch(() => {}); }, []);
  useEffect(() => {
    if (!id) return;
    api<any>(`/api/products/${id}`).then((p) => {
      setF({
        title: p.title, description: p.description || '', base_price: String(p.base_price),
        compare_at_price: p.compare_at_price == null ? '' : String(p.compare_at_price), category_id: p.category_id || '',
        images: p.images.map((i: any) => ({ url: i.url })),
        option_groups: p.option_groups.map((g: any) => ({
          name: g.name, type: g.type, required: g.required,
          values: g.values.map((v: any) => ({ label: v.label, price_delta: String(v.price_delta), color_hex: v.color_hex || '', image_url: v.image_url || '' })),
        })),
      });
      setLoading(false);
    });
  }, [id]);

  const setGroup = (gi: number, patch: Partial<GForm>) => setF((st) => ({ ...st, option_groups: st.option_groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)) }));
  const setValue = (gi: number, vi: number, patch: Partial<VForm>) =>
    setF((st) => ({ ...st, option_groups: st.option_groups.map((g, i) => (i === gi ? { ...g, values: g.values.map((v, j) => (j === vi ? { ...v, ...patch } : v)) } : g)) }));

  async function pickPhotos() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.7 });
    if (r.canceled) return;
    try {
      const urls = await Promise.all(r.assets.map((a) => uploadImage(a.uri, a.mimeType || 'image/jpeg')));
      setF((st) => ({ ...st, images: [...st.images, ...urls.map((url) => ({ url }))] }));
    } catch (e: any) { Alert.alert('Upload failed', e.message); }
  }

  function addPlaceholders() {
    const c = (f.option_groups.find((g) => g.type === 'swatch')?.values[0]?.color_hex || '#E8DCC4').replace('#', '');
    setF((st) => ({ ...st, images: [...st.images, ...['Front', 'Side', 'Headboard', 'Drawers', 'Detail'].map((t) => ({ url: `/api/placeholder?c=${c}&t=${t}` }))] }));
  }

  async function describeFromPhoto() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.5 });
    if (r.canceled || !r.assets[0].base64) return;
    setAiBusy(true);
    try {
      const out = await api<{ title: string; description: string }>('/api/ai/describe', { image: r.assets[0].base64, mediaType: r.assets[0].mimeType || 'image/jpeg' });
      setF((st) => ({ ...st, title: st.title || out.title, description: out.description }));
    } catch (e: any) { Alert.alert('AI', e.message); }
    setAiBusy(false);
  }

  async function save() {
    setBusy(true);
    try {
      await api(id ? `/api/products/${id}` : '/api/products', f, id ? 'PUT' : 'POST');
      navigation.goBack();
    } catch (e: any) { Alert.alert('Could not save', e.message); }
    setBusy(false);
  }

  if (loading) return <ActivityIndicator color={C.brand} style={{ marginTop: 40 }} />;
  const subCats = cats.filter((c) => c.parent_id);

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <View style={s.card}>
        <Btn kind="secondary" small title={aiBusy ? 'Looking at your photo…' : '✨ AI: fill title + description from a photo'} onPress={describeFromPhoto} disabled={aiBusy} />
        <Field label="Title" value={f.title} onChangeText={(title) => setF({ ...f, title })} />
        <Field label="Description" value={f.description} onChangeText={(description) => setF({ ...f, description })} multiline />
        <Text style={s.label}>Category</Text>
        <View style={s.wrap}>
          <Chip label="None" on={!f.category_id} onPress={() => setF({ ...f, category_id: '' })} />
          {subCats.map((c) => <Chip key={c.id} label={`Furniture > ${c.name}`} on={f.category_id === c.id} onPress={() => setF({ ...f, category_id: c.id })} />)}
        </View>
        <View style={s.row}>
          <View style={{ flex: 1 }}><Field label="Base price (£)" value={f.base_price} onChangeText={(base_price) => setF({ ...f, base_price })} keyboardType="decimal-pad" /></View>
          <View style={{ flex: 1 }}><Field label="Compare-at (£)" value={f.compare_at_price} onChangeText={(compare_at_price) => setF({ ...f, compare_at_price })} keyboardType="decimal-pad" /></View>
        </View>
      </View>

      <Text style={s.h2}>Images ({f.images.length})</Text>
      <View style={s.card}>
        <View style={s.wrap}>
          {f.images.map((im, i) => (
            <View key={i}>
              <Image source={{ uri: img(im.url) }} style={{ width: 84, height: 64, borderRadius: 10, backgroundColor: '#ece8e0' }} />
              <Pressable onPress={() => setF((st) => ({ ...st, images: st.images.filter((_, j) => j !== i) }))}
                style={{ position: 'absolute', top: -8, right: -8, width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}>
                <Text>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
        <View style={[s.row, { marginTop: 12, flexWrap: 'wrap' }]}>
          <Btn small kind="secondary" title="Upload photos" onPress={pickPhotos} />
          <Btn small kind="secondary" title="Add 5 placeholders" onPress={addPlaceholders} />
        </View>
      </View>

      <Text style={s.h2}>Variation options</Text>
      <Text style={s.muted}>Swatch = colour picker. Select = choose one. Checkbox = optional add-on. Price is added to the base price.</Text>
      {f.option_groups.map((g, gi) => (
        <View key={gi} style={[s.card, { marginTop: 12, borderStyle: 'dashed' }]}>
          <Field label="Group name" placeholder="Colour, Size…" value={g.name} onChangeText={(name) => setGroup(gi, { name })} />
          <View style={[s.wrap, { marginTop: 10 }]}>
            {(['swatch', 'select', 'checkbox'] as OptionType[]).map((t) => <Chip key={t} label={t[0].toUpperCase() + t.slice(1)} on={g.type === t} onPress={() => setGroup(gi, { type: t })} />)}
          </View>
          <View style={[s.row, { marginTop: 10 }]}>
            <Switch value={g.required} onValueChange={(required) => setGroup(gi, { required })} trackColor={{ true: C.brand2 }} />
            <Text>Required</Text>
          </View>
          {g.values.map((v, vi) => (
            <View key={vi} style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line }}>
              <View style={s.row}>
                <View style={{ flex: 2 }}><Field placeholder="Label" value={v.label} onChangeText={(label) => setValue(gi, vi, { label })} /></View>
                <View style={{ flex: 1 }}><Field placeholder="+£" value={v.price_delta} onChangeText={(price_delta) => setValue(gi, vi, { price_delta })} keyboardType="decimal-pad" /></View>
                <Pressable onPress={() => setGroup(gi, { values: g.values.filter((_, j) => j !== vi) })} style={{ width: 44, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: C.danger, fontSize: 18 }}>✕</Text>
                </Pressable>
              </View>
              {g.type === 'swatch' && (
                <View style={[s.wrap, { marginTop: 8 }]}>
                  {PALETTE.map((hex) => (
                    <Pressable key={hex} onPress={() => setValue(gi, vi, { color_hex: hex, image_url: v.image_url || `/api/placeholder?c=${hex.slice(1)}&t=${encodeURIComponent(v.label)}` })}
                      style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: hex, borderWidth: v.color_hex === hex ? 3 : 1, borderColor: v.color_hex === hex ? C.brand2 : C.line }} />
                  ))}
                </View>
              )}
            </View>
          ))}
          <View style={[s.row, { marginTop: 12, flexWrap: 'wrap' }]}>
            <Btn small kind="secondary" title="+ Add value" onPress={() => setGroup(gi, { values: [...g.values, blankValue()] })} />
            <Btn small kind="danger" title="Remove group" onPress={() => setF((st) => ({ ...st, option_groups: st.option_groups.filter((_, i) => i !== gi) }))} />
          </View>
        </View>
      ))}
      <Btn kind="secondary" title="+ Add option group" style={{ marginTop: 12 }}
        onPress={() => setF((st) => ({ ...st, option_groups: [...st.option_groups, { name: '', type: 'select', required: true, values: [blankValue()] }] }))} />

      <Btn title={busy ? 'Saving…' : 'Save product'} onPress={save} disabled={busy} style={{ marginTop: 22 }} />
    </ScrollView>
  );
}
