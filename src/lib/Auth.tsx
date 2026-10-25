import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

type AuthState = {
  session: Session | null;
  /** 세션 확인(필요하면 익명 로그인)까지 끝났는지 */
  ready: boolean;
  error: string | null;
  retry: () => void;
};

const AuthContext = createContext<AuthState>({ session: null, ready: false, error: null, retry: () => {} });

/**
 * 로그인 화면 없이 바로 쓰도록 첫 실행 때 익명 계정을 만든다.
 * 세션은 기기에 저장되므로 다음 실행부터는 같은 계정으로 이어진다.
 * (나중에 이메일/Apple 로그인을 붙일 때 이 계정에 연결하면 데이터가 그대로 남는다.)
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        if (data.session) {
          setSession(data.session);
        } else {
          const res = await supabase.auth.signInAnonymously();
          if (!alive) return;
          if (res.error) throw res.error;
          setSession(res.data.session);
        }
        setError(null);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : '로그인하지 못했어요');
      } finally {
        if (alive) setReady(true);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (alive) setSession(next);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [attempt]);

  const value = useMemo<AuthState>(
    () => ({ session, ready, error, retry: () => { setReady(false); setAttempt((n) => n + 1); } }),
    [session, ready, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useSession = () => useContext(AuthContext);