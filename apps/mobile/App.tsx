import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth';
import { CartProvider, useCart } from './src/cart';
import { C, Logo } from './src/theme';
import Shop from './src/screens/Shop';
import ProductScreen from './src/screens/ProductScreen';
import Cart from './src/screens/Cart';
import Orders from './src/screens/Orders';
import Seller from './src/screens/Seller';
import ProductForm from './src/screens/ProductForm';
import Admin from './src/screens/Admin';
import { Account, Login } from './src/screens/Auth';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: C.bg, primary: C.brand, card: '#fff', text: C.ink, border: C.line } };

const icon = (g: string) => ({ focused }: { focused: boolean }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{g}</Text>;
const BuyerOrders = () => <Orders />;

function MainTabs() {
  const { me, ready } = useAuth();
  const { lines } = useCart();
  const n = lines.reduce((a, l) => a + l.qty, 0);
  if (!ready) return <ActivityIndicator color={C.brand} style={{ flex: 1 }} />;
  return (
    <Tabs.Navigator
      screenOptions={{
        tabBarActiveTintColor: C.brand, tabBarInactiveTintColor: C.muted, tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: C.line, height: 62, paddingTop: 4, paddingBottom: 6 },
        headerStyle: { backgroundColor: '#fff' }, headerShadowVisible: false, headerTitleStyle: { color: C.brand, fontWeight: '800' },
        tabBarBadgeStyle: { backgroundColor: C.accent, color: '#fff' },
      }}>
      <Tabs.Screen name="Shop" component={Shop} options={{ headerTitle: () => <Logo />, headerTitleAlign: 'left', tabBarIcon: icon('🏠') }} />
      <Tabs.Screen name="Basket" component={Cart} options={{ tabBarBadge: n || undefined, tabBarIcon: icon('🛒') }} />
      {me?.role === 'buyer' && <Tabs.Screen name="Orders" component={BuyerOrders} options={{ title: 'My orders', tabBarLabel: 'Orders', tabBarIcon: icon('📦') }} />}
      {me?.role === 'seller' && <Tabs.Screen name="Seller" component={Seller} options={{ title: 'Seller dashboard', tabBarLabel: 'Seller', tabBarIcon: icon('🏪') }} />}
      {me?.role === 'admin' && <Tabs.Screen name="Admin" component={Admin} options={{ tabBarIcon: icon('🛡️') }} />}
      {me ? (
        <Tabs.Screen name="Account" component={Account} options={{ title: 'My account', tabBarIcon: icon('👤') }} />
      ) : (
        <Tabs.Screen name="Login" component={Login} options={{ title: 'Log in', tabBarIcon: icon('👤') }} />
      )}
    </Tabs.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <NavigationContainer theme={theme}>
            <Stack.Navigator screenOptions={{ headerTintColor: C.brand, headerTitleStyle: { fontWeight: '800' }, headerShadowVisible: false }}>
              <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
              <Stack.Screen name="Product" component={ProductScreen} options={{ title: 'Product' }} />
              <Stack.Screen name="ProductForm" component={ProductForm} />
            </Stack.Navigator>
          </NavigationContainer>
          <StatusBar style="dark" />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
