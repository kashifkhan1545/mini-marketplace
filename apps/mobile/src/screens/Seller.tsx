import React, { useCallback, useState } from 'react';
import { FlatList, Image, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Product, money } from '@mm/shared';
import { api, img } from '../api';
import { useAuth } from '../auth';
import { Btn, C, Chip, StatusPill, s } from '../theme';
import { imgSrc } from '../images';
import Orders from './Orders';

export default function Seller({ navigation }: any) {
  const { me } = useAuth();
  const [tab, setTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[] | null>(null);
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    api<Product[]>('/api/products?scope=mine').then((d) => { setProducts(d); setErr(''); }).catch((e) => setErr(e.message));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={s.screen}>
      <View style={{ padding: 14, paddingBottom: 4 }}>
        {me && me.status !== 'approved' ? (
          <Text style={s.err}>Your seller account is {me.status}. Your products stay hidden until an admin approves you.</Text>
        ) : null}
        <View style={s.wrap}>
          <Chip label="My products" on={tab === 'products'} onPress={() => setTab('products')} />
          <Chip label="Incoming orders" on={tab === 'orders'} onPress={() => setTab('orders')} />
        </View>
      </View>
      {tab === 'orders' ? (
        <Orders seller />
      ) : (
        <FlatList
          data={products || []} keyExtractor={(p) => p.id} contentContainerStyle={{ padding: 14 }} onRefresh={load} refreshing={false}
          ListHeaderComponent={
            <View style={{ marginBottom: 12 }}>
              <Btn title="+ Add product" onPress={() => navigation.navigate('ProductForm', {})} />
              {err ? <Text style={s.err}>{err}</Text> : null}
            </View>
          }
          ListEmptyComponent={products ? <Text style={s.muted}>No products yet.</Text> : undefined}
          renderItem={({ item: p }) => (
            <View style={[s.card, { flexDirection: 'row', gap: 12 }]}>
              {p.images[0] ? <Image source={imgSrc(p.images[0].url)} style={{ width: 92, height: 72, borderRadius: 12, backgroundColor: '#ece8e0' }} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{p.title}</Text>
                <View style={[s.row, { marginVertical: 4 }]}>
                  <Text style={s.price}>{money(p.base_price)}</Text>
                  <StatusPill status={p.status} />
                </View>
                <View style={s.row}>
                  <Btn small kind="secondary" title="Edit" onPress={() => navigation.navigate('ProductForm', { id: p.id })} />
                  <Btn small kind="secondary" title="View" onPress={() => navigation.navigate('Product', { id: p.id })} />
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
