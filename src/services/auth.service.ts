import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

function getRedirectUrl(): string {
  // In Expo Go, createURL generates exp://<ip>:8081 which changes per device.
  // Use the stable localhost form that works for both emulators and Expo Go.
  const isExpoGo = Constants.appOwnership === 'expo';

  if (Platform.OS === 'web') {
    return window.location.origin;
  }

  if (isExpoGo) {
    // exp://localhost:8081 — add this exact URL to Supabase Redirect URLs
    return 'exp://localhost:8081';
  }

  // Standalone build — uses our custom scheme from app.json
  return Linking.createURL('/');
}

export const authService = {
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    return data;
  },

  async signInWithGoogle() {
    const redirectTo = getRedirectUrl();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error('No OAuth URL returned from Supabase');

    if (Platform.OS === 'web') {
      window.location.href = data.url;
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === 'success' && result.url) {
      await handleOAuthCallback(result.url);
    } else if (result.type === 'cancel') {
      throw new Error('Google sign-in was cancelled');
    }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl(),
    });
    if (error) throw error;
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },
};

async function handleOAuthCallback(url: string) {
  // Tokens may be in the URL hash (#access_token=...) or as query params
  let params: URLSearchParams;

  try {
    const parsed = new URL(url);
    // Hash fragment takes priority (Supabase default)
    params = parsed.hash
      ? new URLSearchParams(parsed.hash.replace(/^#/, ''))
      : parsed.searchParams;
  } catch {
    // URL parsing failed — try to extract manually
    const hashIndex = url.indexOf('#');
    const queryIndex = url.indexOf('?');
    const fragment = hashIndex !== -1 ? url.slice(hashIndex + 1) : url.slice(queryIndex + 1);
    params = new URLSearchParams(fragment);
  }

  const accessToken  = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) throw error;
  } else {
    // Fallback: let Supabase re-detect the session from storage
    await supabase.auth.getSession();
  }
}
