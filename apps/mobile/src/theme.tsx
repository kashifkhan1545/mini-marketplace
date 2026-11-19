import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, ViewStyle, TextInputProps } from 'react-native';

// Same design tokens as the website (apps/web/src/app/globals.css)
export const C = {
  bg: '#f6f4f0', card: '#ffffff', ink: '#17202a', muted: '#6a7480', line: '#e6e2da',
  brand: '#17493f', brand2: '#1f6f5c', soft: '#e8f1ee', accent: '#c8963e', danger: '#c0392b', sale: '#d6342c',
};

export const shadow = {
  shadowColor: '#17202a', shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3,
} as const;

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  pad: { padding: 16, paddingBottom: 40 },
  h1: { fontSize: 24, fontWeight: '800', color: C.ink, letterSpacing: -0.5, marginBottom: 8 },
  h2: { fontSize: 17, fontWeight: '800', color: C.ink, marginTop: 20, marginBottom: 8 },
  title: { fontSize: 15, fontWeight: '700', color: C.ink },
  label: { fontSize: 12, fontWeight: '800', color: '#3b4651', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 14, marginBottom: 6 },
  muted: { color: C.muted, fontSize: 13 },
  err: { color: C.danger, marginVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 14, marginBottom: 12, ...shadow },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, minHeight: 48, fontSize: 16, color: C.ink },
  price: { fontWeight: '800', color: C.brand, fontSize: 16 },
  priceBig: { fontWeight: '800', color: C.brand, fontSize: 28, letterSpacing: -0.5 },
  was: { textDecorationLine: 'line-through', color: C.muted, fontSize: 15 },
  badge: { backgroundColor: C.sale, color: '#fff', fontSize: 11, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
});

export function Btn({ title, onPress, disabled, kind = 'primary', small, style }: {
  title: string; onPress?: () => void; disabled?: boolean; kind?: 'primary' | 'secondary' | 'danger'; small?: boolean; style?: ViewStyle;
}) {
  const bg = kind === 'primary' ? C.brand : 'transparent';
  const fg = kind === 'primary' ? '#fff' : kind === 'danger' ? C.danger : C.brand;
  const bd = kind === 'danger' ? C.danger : C.brand;
  return (
    <Pressable onPress={onPress} disabled={disabled}
      style={({ pressed }) => [{
        backgroundColor: bg, borderColor: bd, borderWidth: 1.5, borderRadius: 14, minHeight: small ? 44 : 50, paddingHorizontal: small ? 14 : 20,
        alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      }, kind === 'primary' && !small ? shadow : null, style]}>
      <Text style={{ color: fg, fontWeight: '800', fontSize: small ? 14 : 16 }}>{title}</Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label?: string }) {
  const { label, style, ...rest } = props;
  return (
    <View>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TextInput placeholderTextColor="#9aa3ad" style={[s.input, rest.multiline && { minHeight: 96, textAlignVertical: 'top' }, style]} {...rest} />
    </View>
  );
}

export function Chip({ label, sub, on, onPress }: { label: string; sub?: string; on?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{
      minHeight: 48, paddingHorizontal: 14, paddingVertical: 8, justifyContent: 'center', borderRadius: 12, borderWidth: 1.5,
      borderColor: on ? C.brand2 : C.line, backgroundColor: on ? C.soft : '#fff',
    }}>
      <Text style={{ color: C.ink, fontWeight: on ? '800' : '500', fontSize: 14 }}>{label}</Text>
      {sub ? <Text style={{ color: C.muted, fontSize: 11 }}>{sub}</Text> : null}
    </Pressable>
  );
}

export function Logo() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: C.brand2, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '800' }}>M</Text>
      </View>
      <Text style={{ fontSize: 21, fontWeight: '800', color: C.brand, letterSpacing: -0.8 }}>
        Mini<Text style={{ color: C.accent }}>Market</Text>
      </Text>
    </View>
  );
}

const STATUS: Record<string, [string, string]> = {
  new: ['#fff1cf', '#7a5a00'], confirmed: ['#d9eaff', '#124b8f'], shipped: ['#e9defd', '#53309c'], delivered: ['#d3f2dc', '#17653a'],
  approved: ['#d3f2dc', '#17653a'], active: ['#d3f2dc', '#17653a'], pending: ['#fff1cf', '#7a5a00'], hidden: ['#eee', '#555'],
};
export function StatusPill({ status }: { status: string }) {
  const [bg, fg] = STATUS[status] || ['#eee', '#333'];
  return (
    <Text style={{ backgroundColor: bg, color: fg, fontWeight: '800', fontSize: 12, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 99, overflow: 'hidden', textTransform: 'capitalize' }}>
      {status}
    </Text>
  );
}
