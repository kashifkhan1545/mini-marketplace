import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Product, Selection, chosenOptions, colourGroup, computePrice, defaultSelection, discountPercent, displayTitle, money, selectionKey,
} from '@mm/shared';
import { api, img } from '../api';
import { useCart } from '../cart';
import { Btn, C, Chip, s, shadow } from '../theme';
import { imgSrc } from '../images';

const W = Dimensions.get('window').width;
const H = Dimensions.get('window').height;

export default function ProductScreen({ route, navigation }: any) {
  const [p, setP] = useState<Product | null>(null);
  const [sel, setSel] = useState<Selection>({});
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const { add } = useCart();
  const insets = useSafeAreaInsets();
  const track = useRef<FlatList>(null);

  useEffect(() => {
    api<Product>(`/api/products/${route.params.id}`).then((d) => { setP(d); setSel(defaultSelection(d)); });
  }, [route.params.id]);

  const cg = p ? colourGroup(p) : undefined;
  const colour = cg?.values.find((v) => v.id === sel[cg.id]);
  const colourImg = colour?.image_url;
  // Picking a colour jumps the gallery back to the first image (which is the colour's image).
  useEffect(() => { setIdx(0); track.current?.scrollToOffset({ offset: 0, animated: false }); }, [colourImg]);

  if (!p) return <ActivityIndicator color={C.brand} style={{ marginTop: 40 }} />;

  const price = computePrice(p, sel);
  const pct = discountPercent(p.base_price, p.compare_at_price);
  const gallery = [...(colourImg ? [{ id: 'c', url: colourImg }] : []), ...p.images.filter((i) => i.url !== colourImg)];
  const pick = (gid: string, vid: string, required: boolean) =>
    setSel((cur) => {
      const n = { ...cur };
      if (n[gid] === vid && !required) delete n[gid];
      else n[gid] = vid;
      return n;
    });
  const goto = (i: number) => { setIdx(i); track.current?.scrollToOffset({ offset: i * (W - 30), animated: true }); };

  function addToBasket() {
    add({
      key: selectionKey(p!.id, sel), productId: p!.id, title: displayTitle(p!.title, colour?.label),
      image: colourImg || p!.images[0]?.url || null, qty: 1, selection: sel, options: chosenOptions(p!, sel), unitPrice: price,
    });
    navigation.navigate('Tabs', { screen: 'Basket' });
  }

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 120 }}>
        <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, ...shadow }}>
          <FlatList
            ref={track} horizontal pagingEnabled showsHorizontalScrollIndicator={false} data={gallery} keyExtractor={(g) => g.id + g.url}
            onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / (W - 30)))}
            renderItem={({ item }) => (
              <Pressable onPress={() => setZoom(true)}>
                <Image source={imgSrc(item.url)} style={{ width: W - 30, height: (W - 30) * 0.75, backgroundColor: '#ece8e0' }} />
              </Pressable>
            )}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ gap: 8 }}>
          {gallery.map((g, i) => (
            <Pressable key={g.id + g.url} onPress={() => goto(i)} style={{ borderWidth: 2, borderColor: i === idx ? C.brand2 : 'transparent', borderRadius: 12, overflow: 'hidden', opacity: i === idx ? 1 : 0.7 }}>
              <Image source={imgSrc(g.url)} style={{ width: 68, height: 68 }} />
            </Pressable>
          ))}
        </ScrollView>
        <Text style={[s.muted, { textAlign: 'center', marginTop: 6 }]}>{idx + 1} / {gallery.length} · swipe or tap to enlarge</Text>

        <Text style={[s.h1, { marginTop: 14 }]}>{displayTitle(p.title, colour?.label)}</Text>
        <View style={[s.row, { flexWrap: 'wrap' }]}>
          <Text style={s.priceBig}>{money(price)}</Text>
          {p.compare_at_price ? <Text style={s.was}>{money(p.compare_at_price)}</Text> : null}
          {pct ? <Text style={s.badge}>{pct}% OFF</Text> : null}
        </View>
        {p.seller?.full_name ? <Text style={[s.muted, { marginTop: 4 }]}>Sold by {p.seller.full_name}</Text> : null}

        {p.option_groups.map((g) => (
          <View key={g.id} style={{ marginTop: 18, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.line }}>
            <Text style={{ fontWeight: '800', marginBottom: 10, color: C.ink }}>
              {g.name}
              {g.type === 'swatch' && colour ? <Text style={{ color: C.brand2, fontWeight: '600' }}>{`: ${colour.label}`}</Text> : null}
            </Text>
            <View style={s.wrap}>
              {g.values.map((v) => {
                const on = sel[g.id] === v.id;
                if (g.type === 'swatch')
                  return (
                    <Pressable key={v.id} onPress={() => pick(g.id, v.id, g.required)} accessibilityLabel={v.label}
                      style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: v.color_hex || '#ccc', borderWidth: on ? 4 : 2, borderColor: on ? C.brand2 : '#fff', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 }} />
                  );
                return (
                  <Chip key={v.id} label={v.label} sub={v.price_delta ? `+${money(v.price_delta)}` : undefined} on={on} onPress={() => pick(g.id, v.id, g.required)} />
                );
              })}
            </View>
          </View>
        ))}
        {p.description ? <Text style={[s.muted, { marginTop: 16, lineHeight: 20 }]}>{p.description}</Text> : null}
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, paddingBottom: 12 + insets.bottom, backgroundColor: 'rgba(255,255,255,0.97)', borderTopWidth: 1, borderTopColor: C.line }}>
        <Text style={[s.priceBig, { fontSize: 23 }]}>{money(price)}</Text>
        <Btn title="Add to Basket" onPress={addToBasket} style={{ flex: 1 }} />
      </View>

      <Modal visible={zoom} transparent animationType="fade" onRequestClose={() => setZoom(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(10,14,18,0.95)', justifyContent: 'center' }}>
          <FlatList
            horizontal pagingEnabled data={gallery} keyExtractor={(g) => 'z' + g.id + g.url} initialScrollIndex={idx}
            getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
            renderItem={({ item }) => <Image source={imgSrc(item.url)} style={{ width: W, height: H * 0.7 }} resizeMode="contain" />}
          />
          <Pressable onPress={() => setZoom(false)} style={{ position: 'absolute', top: 50, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22 }}>✕</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
