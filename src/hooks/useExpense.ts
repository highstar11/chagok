import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../lib/Auth';
import { fetchExpenses } from '../data/expenses';
import type { Expense } from '../data/expenses';
import { fromYmd, toYmd } from '../utils/date';

export function useExpenses(from: Date, to: Date) {
  const { session } = useSession();
  const fromKey = toYmd(from);
  const toKey = toYmd(to);
  const key = `${fromKey}|${toKey}`;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadedKey, setLoadedKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!session) return;
    const id = ++requestId.current;
    try {
      const rows = await fetchExpenses(fromYmd(fromKey), fromYmd(toKey));
      if (id !== requestId.current) return; // 더 최신 요청이 있으면 버린다
      setExpenses(rows);
      setError(null);
    } catch (e) {
      if (id === requestId.current) setError(e instanceof Error ? e.message : '불러오지 못했어요');
    } finally {
      if (id === requestId.current) setLoadedKey(`${fromKey}|${toKey}`);
    }
  }, [session, fromKey, toKey]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { expenses, loading: loadedKey !== key, error, reload: load };
}