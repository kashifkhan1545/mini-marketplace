import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { api, supabase } from '../api';
import { useAuth } from '../auth';
import { Btn, C, Chip, Field, Logo, StatusPill, s } from '../theme';

export function Login() {
  const [signup, setSignup] = useState(false);
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      if (signup) await api('/api/auth/signup', { email: email.trim(), password, full_name: name, role });
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    } catch (e: any) {
      Alert.alert('Could not continue', e.message);
    }
    setBusy(false);
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: 'center', marginVertical: 16 }}><Logo /></View>
      <View style={s.card}>
        <Text style={s.h1}>{signup ? 'Create account' : 'Log in'}</Text>
        {signup && (
          <>
            <Text style={s.label}>I want to</Text>
            <View style={s.wrap}>
              <Chip label="Buy things" on={role === 'buyer'} onPress={() => setRole('buyer')} />
              <Chip label="Sell things" sub="needs admin approval" on={role === 'seller'} onPress={() => setRole('seller')} />
            </View>
            <Field label="Name" value={name} onChangeText={setName} />
          </>
        )}
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <Btn title={busy ? 'Please wait…' : signup ? 'Sign up' : 'Log in'} onPress={submit} disabled={busy} style={{ marginTop: 18 }} />
        <Pressable onPress={() => setSignup(!signup)} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.brand, fontWeight: '700' }}>{signup ? 'Have an account? Log in' : 'New here? Create an account'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

export function Account() {
  const { me, logout } = useAuth();
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad}>
      <View style={s.card}>
        <Text style={s.h1}>{me?.full_name || 'My account'}</Text>
        <Text style={s.muted}>{me?.email}</Text>
        <View style={[s.row, { marginTop: 10 }]}>
          <StatusPill status={me?.role || ''} />
          {me?.role === 'seller' ? <StatusPill status={me.status} /> : null}
        </View>
        {me?.role === 'seller' && me.status !== 'approved' ? (
          <Text style={[s.err, { marginTop: 10 }]}>Your seller account is {me.status}. Your products stay hidden until an admin approves you.</Text>
        ) : null}
      </View>
      <Btn title="Log out" kind="secondary" onPress={logout} />
    </ScrollView>
  );
}
