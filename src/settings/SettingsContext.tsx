import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'chagok.billingDay';

type SettingsValue = {
  // 저장소 로딩이 끝났는지
  ready: boolean;
  // 카드값 정산 시작일(1~31). 아직 설정 전이면 null
  billingDay: number | null;
  setBillingDay: (day: number) => Promise<void>;
};

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [billingDay, setDay] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        const n = raw ? Number(raw) : NaN;
        if (Number.isInteger(n) && n >= 1 && n <= 31) setDay(n);
      } catch {
        // 저장소를 못 읽으면 미설정 상태로 시작
      }
      setReady(true);
    })();
  }, []);

  const setBillingDay = useCallback(async (day: number) => {
    setDay(day);
    try {
      await AsyncStorage.setItem(KEY, String(day));
    } catch {
      // 저장 실패 시에도 이번 실행 동안은 값을 유지
    }
  }, []);

  const value = useMemo(() => ({ ready, billingDay, setBillingDay }), [ready, billingDay, setBillingDay]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
