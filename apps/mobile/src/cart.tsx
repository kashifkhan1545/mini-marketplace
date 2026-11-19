import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartLine } from '@mm/shared';

interface Ctx {
  lines: CartLine[];
  add: (l: CartLine) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  total: number;
}
const C = createContext<Ctx>(null as any);
export const useCart = () => useContext(C);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem('mm-cart').then((s) => {
      if (s) setLines(JSON.parse(s));
      setReady(true);
    });
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem('mm-cart', JSON.stringify(lines));
  }, [lines, ready]);

  const add = (l: CartLine) =>
    setLines((cur) => {
      const hit = cur.find((x) => x.key === l.key); // same options => same line
      return hit ? cur.map((x) => (x.key === l.key ? { ...x, qty: x.qty + l.qty } : x)) : [...cur, l];
    });
  const setQty = (key: string, qty: number) =>
    setLines((cur) => (qty <= 0 ? cur.filter((x) => x.key !== key) : cur.map((x) => (x.key === key ? { ...x, qty } : x))));
  const total = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  return <C.Provider value={{ lines, add, setQty, clear: () => setLines([]), total }}>{children}</C.Provider>;
}
