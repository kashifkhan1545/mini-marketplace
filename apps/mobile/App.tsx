import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Product, Selection, chosenOptions, colourGroup, computePrice, defaultSelection, discountPercent,
  displayTitle, money, selectionKey,
} from '@mm/shared';
import { api, img, supabase } from './src/api';
import { CartProvider, useCart } from './src/cart';

const BRAND = '#1f3a5f';
const W = Dimensions.get('window').width;
const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function useSession() {
  const [session, setSession] = useState<any>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}

function Btn({ title, onPress, disabled, style }: any) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[s.btn, disabled && { opacity: 0.5 }, style]}>
      <Text style={s.btnText}>{title}</Text>
    </Pressable>
  );
}

/* ---------- Login ---------- */
function Login() {
  const [signup, setSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    try {
      if (signup) await api('/api/auth/signup', { email, password, full_name: name, role: 'buyer' });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (e: any) {
      Alert.alert('Could not continue', e.message);
    }
    setBusy(false);
  }
  return (
    <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <Text style={s.h1}>{signup ? 'Create buyer account' : 'Log in'}</Text>
      {signup && <TextInput style={s.input} placeholder="Full name" value={name} onChangeText={setName} />}
      <TextInput style={s.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={s.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <Btn title={busy ? 'Please wait…' : signup ? 'Sign up' : 'Log in'} onPress={submit} disabled={busy} />
      <Pressable onPress={() => setSignup(!signup)} style={s.link}>
        <Text style={{ color: BRAND }}>{signup ? 'Have an account? Log in' : 'New here? Create an account'}</Text>
      </Pressable>
    </ScrollView>
  );
}

/* ---------- Product list + search ---------- */
function ProductList({ navigation }: any) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Product[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      api<Product[]>('/api/products' + (q ? `?q=${encodeURIComponent(q)}` : ''))
        .then((d) => { setItems(d); setErr(''); })
        .catch((e) => setErr(e.message));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <View style={{ flex: 1 }}>
      <TextInput style={[s.input, { margin: 12 }]} placeholder="Search products" value={q} onChangeText={setQ} />
      {err ? <Text style={s.err}>{err}</Text> : null}
      {!items && !err ? <ActivityIndicator style={{ marginTop: 30 }} /> : null}
      <FlatList
        data={items || []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 12, paddingTop: 0 }}
        ListEmptyComponent={items ? <Text style={s.muted}>No products found.</Text> : undefined}
        renderItem={({ item: p }) => {
          const pct = discountPercent(p.base_price, p.compare_at_price);
          return (
            <Pressable style={s.card} onPress={() => navigation.navigate('Product', { id: p.id })}>
              <Image source={{ uri: img(p.images[0]?.url) }} style={s.cardImg} />
              <View style={{ padding: 10 }}>
                <Text style={s.title}>{p.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={s.price}>from {money(p.base_price)}</Text>
                  {p.compare_at_price ? <Text style={s.was}>{money(p.compare_at_price)}</Text> : null}
                  {pct ? <Text style={s.badge}>{pct}% OFF</Text> : null}
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

/* ---------- Product page ---------- */
function ProductScreen({ route, navigation }: any) {
  const [p, setP] = useState<Product | null>(null);
  const [sel, setSel] = useState<Selection>({});
  const [active, setActive] = useState(0);
  const { add } = useCart();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    api<Product>(`/api/products/${route.params.id}`).then((d) => { setP(d); setSel(defaultSelection(d)); });
  }, [route.params.id]);
  if (!p) return <ActivityIndicator style={{ marginTop: 40 }} />;

  const cg = colourGroup(p);
  const colour = cg?.values.find((v) => v.id === sel[cg.id]);
  const price = computePrice(p, sel);
  const pct = discountPercent(p.base_price, p.compare_at_price);
  const gallery = [...(colour?.image_url ? [{ id: 'c', url: colour.image_url }] : []), ...p.images];
  const pick = (gid: string, vid: string, required: boolean) =>
    setSel((cur) => {
      const n = { ...cur };
      if (n[gid] === vid && !required) delete n[gid]; // untick optional
      else n[gid] = vid;
      return n;
    });

  function addToBasket() {
    add({
      key: selectionKey(p!.id, sel),
      productId: p!.id,
      title: displayTitle(p!.title, colour?.label),
      image: colour?.image_url || p!.images[0]?.url || null,
      qty: 1,
      selection: sel,
      options: chosenOptions(p!, sel),
      unitPrice: price,
    });
    navigation.navigate('Tabs', { screen: 'Cart' });
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <FlatList
          horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          data={gallery}
          keyExtractor={(g) => g.id}
          onMomentumScrollEnd={(e) => setActive(Math.round(e.nativeEvent.contentOffset.x / W))}
          renderItem={({ item }) => <Image source={{ uri: img(item.url) }} style={{ width: W, height: W * 0.75 }} />}
        />
        <Text style={[s.muted, { textAlign: 'center' }]}>{active + 1} / {gallery.length} — swipe</Text>
        <View style={s.pad}>
          <Text style={s.h1}>{displayTitle(p.title, colour?.label)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={s.priceBig}>{money(price)}</Text>
            {p.compare_at_price ? <Text style={s.was}>{money(p.compare_at_price)}</Text> : null}
            {pct ? <Text style={s.badge}>{pct}% OFF</Text> : null}
          </View>
          {p.option_groups.map((g) => (
            <View key={g.id} style={{ marginTop: 16 }}>
              <Text style={s.label}>{g.name}{g.type === 'swatch' && colour ? `: ${colour.label}` : ''}</Text>
              <View style={s.wrap}>
                {g.values.map((v) => {
                  const on = sel[g.id] === v.id;
                  if (g.type === 'swatch')
                    return (
                      <Pressable key={v.id} onPress={() => pick(g.id, v.id, g.required)} accessibilityLabel={v.label}
                        style={[s.swatch, { backgroundColor: v.color_hex || '#ccc' }, on && s.swatchOn]} />
                    );
                  return (
                    <Pressable key={v.id} onPress={() => pick(g.id, v.id, g.required)} style={[s.chip, on && s.chipOn]}>
                      <Text style={on ? { color: '#fff' } : undefined}>
                        {v.label}{v.price_delta ? ` (+${money(v.price_delta)})` : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
          {p.description ? <Text style={[s.muted, { marginTop: 16 }]}>{p.description}</Text> : null}
        </View>
      </ScrollView>
      <View style={[s.sticky, { paddingBottom: 12 + insets.bottom }]}>
        <Text style={s.priceBig}>{money(price)}</Text>
        <Btn title="Add to Basket" onPress={addToBasket} style={{ flex: 1, marginLeft: 16 }} />
      </View>
    </View>
  );
}

/* ---------- Cart + checkout ---------- */
function CartScreen({ navigation }: any) {
  const { lines, setQty, clear, total } = useCart();
  const session = useSession();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  async function checkout() {
    if (!session) return Alert.alert('Please log in', 'Log in from the Log in tab to check out.');
    setBusy(true);
    try {
      await api('/api/checkout', {
        items: lines.map((l) => ({ productId: l.productId, qty: l.qty, selection: l.selection })),
        shipping: { name, address, phone },
      });
      clear();
      Alert.alert('Order placed', 'Thanks! (No real payment was taken.)');
      navigation.navigate('Orders');
    } catch (e: any) {
      Alert.alert('Checkout failed', e.message);
    }
    setBusy(false);
  }
  if (!lines.length) return <Text style={[s.muted, { padding: 24 }]}>Your basket is empty.</Text>;
  return (
    <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      {lines.map((l) => (
        <View key={l.key} style={s.line}>
          <Image source={{ uri: img(l.image) }} style={s.thumb} />
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{l.title}</Text>
            {l.options.map((o) => (
              <Text key={o.group} style={s.muted}>{o.group}: {o.label}{o.price_delta ? ` (+${money(o.price_delta)})` : ''}</Text>
            ))}
            <Text style={s.price}>{money(l.unitPrice * l.qty)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 }}>
              <Pressable style={s.qty} onPress={() => setQty(l.key, l.qty - 1)}><Text>−</Text></Pressable>
              <Text>{l.qty}</Text>
              <Pressable style={s.qty} onPress={() => setQty(l.key, l.qty + 1)}><Text>+</Text></Pressable>
            </View>
          </View>
        </View>
      ))}
      <Text style={s.priceBig}>Total {money(total)}</Text>
      <Text style={[s.label, { marginTop: 16 }]}>Delivery details (demo checkout)</Text>
      <TextInput style={s.input} placeholder="Full name" value={name} onChangeText={setName} />
      <TextInput style={s.input} placeholder="Address" value={address} onChangeText={setAddress} multiline />
      <TextInput style={s.input} placeholder="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <Btn title={busy ? 'Placing…' : 'Place order'} onPress={checkout} disabled={busy} />
    </ScrollView>
  );
}

/* ---------- Orders (buyer) ---------- */
function OrdersScreen() {
  const [orders, setOrders] = useState<any[] | null>(null);
  const [err, setErr] = useState('');
  const load = () => api('/api/orders').then(setOrders).catch((e) => setErr(e.message));
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);
  if (err) return <Text style={s.err}>{err}</Text>;
  if (!orders) return <ActivityIndicator style={{ marginTop: 30 }} />;
  return (
    <FlatList
      data={orders} keyExtractor={(o) => o.id} contentContainerStyle={{ padding: 12 }}
      onRefresh={load} refreshing={false}
      ListEmptyComponent={<Text style={s.muted}>No orders yet.</Text>}
      renderItem={({ item: o }) => (
        <View style={s.card}>
          <View style={{ padding: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={s.title}>#{o.id.slice(0, 8)}</Text>
              <Text style={s.badge}>{String(o.status).toUpperCase()}</Text>
            </View>
            {o.items.map((i: any) => (
              <View key={i.id} style={{ marginTop: 6 }}>
                <Text>{i.qty} × {i.title} — {money(i.unit_price)}</Text>
                {(i.options || []).map((x: any) => <Text key={x.group} style={s.muted}>{x.group}: {x.label}</Text>)}
              </View>
            ))}
            <Text style={[s.price, { marginTop: 8 }]}>Total {money(o.total)}</Text>
          </View>
        </View>
      )}
    />
  );
}

function AccountScreen() {
  const [me, setMe] = useState<any>(null);
  useEffect(() => { api('/api/me').then(setMe).catch(() => {}); }, []);
  return (
    <View style={s.pad}>
      <Text style={s.h1}>{me?.full_name || 'Account'}</Text>
      <Text style={s.muted}>{me?.email} · {me?.role}</Text>
      <Btn title="Log out" onPress={() => supabase.auth.signOut()} style={{ marginTop: 24 }} />
    </View>
  );
}

function MainTabs() {
  const session = useSession();
  const { lines } = useCart();
  const n = lines.reduce((a, l) => a + l.qty, 0);
  return (
    <Tabs.Navigator screenOptions={{ tabBarActiveTintColor: BRAND, headerTitleStyle: { color: BRAND } }}>
      <Tabs.Screen name="Shop" component={ProductList} />
      <Tabs.Screen name="Cart" component={CartScreen} options={{ tabBarBadge: n || undefined }} />
      {session ? (
        <>
          <Tabs.Screen name="Orders" component={OrdersScreen} />
          <Tabs.Screen name="Account" component={AccountScreen} />
        </>
      ) : (
        <Tabs.Screen name="Login" component={Login} options={{ title: 'Log in' }} />
      )}
    </Tabs.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <CartProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Product" component={ProductScreen} options={{ title: 'Product' }} />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </CartProvider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  pad: { padding: 16 },
  h1: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '600', color: '#111' },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  muted: { color: '#666', fontSize: 13 },
  err: { color: '#b00020', padding: 12 },
  link: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, minHeight: 44, marginBottom: 10, backgroundColor: '#fff' },
  btn: { backgroundColor: BRAND, borderRadius: 8, minHeight: 48, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 10, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  cardImg: { width: '100%', height: 180, backgroundColor: '#eee' },
  price: { fontWeight: '700', color: BRAND },
  priceBig: { fontSize: 22, fontWeight: '700', color: BRAND },
  was: { textDecorationLine: 'line-through', color: '#888' },
  badge: { backgroundColor: '#c62828', color: '#fff', fontSize: 12, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#bbb' },
  swatchOn: { borderWidth: 3, borderColor: BRAND },
  chip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#bbb', backgroundColor: '#fff' },
  chipOn: { backgroundColor: BRAND, borderColor: BRAND },
  sticky: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ddd' },
  line: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  thumb: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#eee' },
  qty: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#bbb', justifyContent: 'center', alignItems: 'center' },
});
