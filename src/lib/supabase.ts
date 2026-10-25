import 'react-native-url-polyfill/auto'; // 베어 RN(Hermes)의 URL 구현 보완 — 반드시 맨 위
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

const url = Config.SUPABASE_URL;
const key = Config.SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error('.env에 SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY 를 채우고 앱을 다시 빌드해 주세요.');
}

// publishable 키는 앱에 들어가도 안전하다. 데이터 보호는 RLS 정책이 맡는다.
export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});