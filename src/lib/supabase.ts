import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// SecureStore has a 2048-byte key limit — large JWTs get chunked across multiple keys
const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const chunks: string[] = [];
      let index = 0;
      while (true) {
        const chunk = await SecureStore.getItemAsync(`${key}.${index}`);
        if (chunk === null) break;
        chunks.push(chunk);
        index++;
      }
      if (chunks.length === 0) return await SecureStore.getItemAsync(key);
      return chunks.join('');
    } catch {
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const chunkSize = 1800; // safe under 2048-byte limit
      if (value.length <= chunkSize) {
        await SecureStore.setItemAsync(key, value);
        return;
      }
      // Store in chunks
      let index = 0;
      for (let i = 0; i < value.length; i += chunkSize) {
        await SecureStore.setItemAsync(`${key}.${index}`, value.slice(i, i + chunkSize));
        index++;
      }
    } catch {
      // SecureStore unavailable (e.g. web) — silently fail
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
      // Also clear any chunks
      let index = 0;
      while (true) {
        const chunk = await SecureStore.getItemAsync(`${key}.${index}`);
        if (chunk === null) break;
        await SecureStore.deleteItemAsync(`${key}.${index}`);
        index++;
      }
    } catch {
      // ignore
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
