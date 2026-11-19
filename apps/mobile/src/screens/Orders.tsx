import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Text, View } from 'react-native';
import { ORDER_STATUSES, money } from '@mm/shared';
import { api, img } from '../api';
import { C, Chip, StatusPill, s } from '../theme';

/** Buyer: their orders. Seller (seller=true): incoming orders with status buttons. Same list as the web OrderList. */
export default function Orders({ seller }: { seller?: boolean }) {
  const [orders, setOrders] = useState<any[] | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => api<any[]>('/api/orders').then((d) => { setOrders(d); setErr(''); }).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  const setStatus = async (id: string, status: string) => {
    try { await api(`/api/orders/${id}`, { status }, 'PATCH'); load(); } catch (e: any) { Alert.alert('Could not update', e.message); }
  };

  if (err) return <Text style={[s.err, { padding: 16 }]}>{err}</Text>;
  if (!orders) return <ActivityIndicator color={C.brand} style={{ marginTop: 30 }} />;
  return (
    <FlatList
      style={s.screen} data={orders} keyExtractor={(o) => o.id} contentContainerStyle={{ padding: 14 }} onRefresh={load} refreshing={false}
      ListEmptyComponent={<Text style={s.muted}>No orders yet.</Text>}
      renderItem={({ item: o }) => (
        <View style={s.card}>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <Text style={s.title}>#{o.id.slice(0, 8)}</Text>
            <StatusPill status={o.status} />
          </View>
          <Text style={s.muted}>
            {new Date(o.created_at).toLocaleString()}
            {seller ? ` · ${o.shipping_name}, ${o.shipping_address}` : ''}
          </Text>
          {o.items.map((i: any) => (
            <View key={i.id} style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              {i.image_url ? <Image source={{ uri: img(i.image_url) }} style={{ width: 72, height: 56, borderRadius: 10, backgroundColor: '#ece8e0' }} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{i.title} × {i.qty}</Text>
                {(i.options || []).map((x: any) => <Text key={x.group} style={s.muted}>{x.group}: {x.label}</Text>)}
              </View>
              <Text style={s.price}>{money(i.unit_price * i.qty)}</Text>
            </View>
          ))}
          <Text style={[s.price, { marginTop: 12 }]}>Total {money(o.total)}</Text>
          {seller && (
            <View style={{ marginTop: 10 }}>
              <Text style={s.label}>Set status</Text>
              <View style={s.wrap}>
                {ORDER_STATUSES.map((st) => <Chip key={st} label={st[0].toUpperCase() + st.slice(1)} on={o.status === st} onPress={() => o.status !== st && setStatus(o.id, st)} />)}
              </View>
            </View>
          )}
        </View>
      )}
    />
  );
}
