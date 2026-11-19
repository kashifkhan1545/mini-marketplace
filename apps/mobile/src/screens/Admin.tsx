import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { money } from '@mm/shared';
import { api } from '../api';
import { Btn, StatusPill, s } from '../theme';

export default function Admin() {
  const [data, setData] = useState<{ sellers: any[]; products: any[] } | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => { api('/api/admin/overview').then(setData).catch((e) => setErr(e.message)); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const act = async (url: string, status: string) => {
    try { await api(url, { status }, 'PATCH'); load(); } catch (e: any) { Alert.alert('Could not update', e.message); }
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad}>
      {err ? <Text style={s.err}>{err}</Text> : null}
      <Text style={s.h2}>Sellers</Text>
      {data?.sellers.map((x) => (
        <View key={x.id} style={s.card}>
          <Text style={s.title}>{x.full_name || x.email}</Text>
          <View style={[s.row, { marginVertical: 4 }]}><Text style={s.muted}>{x.email}</Text><StatusPill status={x.status} /></View>
          <View style={s.row}>
            {x.status !== 'approved' && <Btn small title="Approve" onPress={() => act(`/api/admin/profiles/${x.id}`, 'approved')} />}
            {x.status !== 'hidden' && <Btn small kind="danger" title="Hide" onPress={() => act(`/api/admin/profiles/${x.id}`, 'hidden')} />}
          </View>
        </View>
      ))}
      <Text style={s.h2}>Listings</Text>
      {data?.products.map((p) => (
        <View key={p.id} style={s.card}>
          <Text style={s.title}>{p.title}</Text>
          <View style={[s.row, { marginVertical: 4, flexWrap: 'wrap' }]}>
            <Text style={s.muted}>{money(Number(p.base_price))} · {p.seller?.full_name || p.seller?.email}</Text>
            <StatusPill status={p.status} />
          </View>
          {p.status === 'hidden'
            ? <Btn small title="Show" onPress={() => act(`/api/admin/products/${p.id}`, 'active')} />
            : <Btn small kind="danger" title="Hide" onPress={() => act(`/api/admin/products/${p.id}`, 'hidden')} />}
        </View>
      ))}
    </ScrollView>
  );
}
