import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { money } from '@mm/shared';
import { api, img } from '../api';
import { useAuth } from '../auth';
import { useCart } from '../cart';
import { Btn, C, Field, s } from '../theme';

export default function Cart({ navigation }: any) {
  const { lines, setQty, clear, total } = useCart();
  const { me } = useAuth();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);

  async function checkout() {
    if (!me) return Alert.alert('Please log in', 'Log in from the Log in tab to check out.', [{ text: 'OK', onPress: () => navigation.navigate('Login') }]);
    setBusy(true);
    try {
      await api('/api/checkout', {
        items: lines.map((l) => ({ productId: l.productId, qty: l.qty, selection: l.selection })),
        shipping: { name, address, phone },
      });
      clear();
      Alert.alert('Order placed', 'Thanks! (This is a demo checkout, no payment was taken.)');
      navigation.navigate('Orders');
    } catch (e: any) {
      Alert.alert('Checkout failed', e.message);
    }
    setBusy(false);
  }

  if (!lines.length)
    return (
      <View style={[s.screen, { alignItems: 'center', justifyContent: 'center', padding: 30 }]}>
        <Text style={{ fontSize: 44 }}>🛏️</Text>
        <Text style={[s.h1, { marginTop: 10 }]}>Your basket is empty</Text>
        <Text style={[s.muted, { marginBottom: 16 }]}>Pick a bed, choose your options and it will show up here.</Text>
        <Btn title="Browse products" onPress={() => navigation.navigate('Shop')} />
      </View>
    );

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      {lines.map((l) => (
        <View key={l.key} style={[s.card, { flexDirection: 'row', gap: 12 }]}>
          <Image source={{ uri: img(l.image) }} style={{ width: 92, height: 72, borderRadius: 12, backgroundColor: '#ece8e0' }} />
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{l.title}</Text>
            {l.options.map((o) => (
              <Text key={o.group} style={s.muted}>{o.group}: {o.label}{o.price_delta ? ` (+${money(o.price_delta)})` : ''}</Text>
            ))}
            <Text style={[s.price, { marginTop: 4 }]}>{money(l.unitPrice * l.qty)}</Text>
            <View style={[s.row, { marginTop: 6 }]}>
              <Pressable style={qtyBtn} onPress={() => setQty(l.key, l.qty - 1)}><Text style={{ fontSize: 20 }}>−</Text></Pressable>
              <Text style={{ fontWeight: '800', minWidth: 22, textAlign: 'center' }}>{l.qty}</Text>
              <Pressable style={qtyBtn} onPress={() => setQty(l.key, l.qty + 1)}><Text style={{ fontSize: 20 }}>+</Text></Pressable>
            </View>
          </View>
        </View>
      ))}
      <View style={[s.card, { flexDirection: 'row', justifyContent: 'space-between' }]}>
        <Text style={s.title}>Total</Text>
        <Text style={s.priceBig}>{money(total)}</Text>
      </View>
      <Text style={s.h2}>Delivery details</Text>
      <Text style={s.muted}>Demo checkout: no real payment is taken.</Text>
      <Field label="Full name" value={name} onChangeText={setName} />
      <Field label="Address" value={address} onChangeText={setAddress} multiline />
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Btn title={busy ? 'Placing order…' : 'Place order'} onPress={checkout} disabled={busy} style={{ marginTop: 18 }} />
    </ScrollView>
  );
}
const qtyBtn = { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: C.line, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' } as const;
