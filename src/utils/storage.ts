import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Upload a local image URI to Supabase Storage.
 *
 * Web:    uri is a blob: URL → fetch it → pass a File to supabase.storage.upload()
 * Native: uri is a file:// or content:// URI → FormData with { uri, name, type }
 */
export async function uploadImage(
  bucket: string,
  path: string,
  uri: string,
): Promise<string> {
  if (Platform.OS === 'web') {
    return uploadWeb(bucket, path, uri);
  }
  return uploadNative(bucket, path, uri);
}

// ─── Web ──────────────────────────────────────────────────────────────────────
async function uploadWeb(bucket: string, path: string, uri: string): Promise<string> {
  // On web, expo-image-picker returns a blob: URL. fetch() can read it.
  const res = await fetch(uri);
  const blob = await res.blob();
  const filename = path.split('/').pop() ?? 'upload.jpg';
  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

  // supabase.storage automatically includes the auth session on web (via localStorage)
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// ─── Native (iOS / Android) ───────────────────────────────────────────────────
async function uploadNative(bucket: string, path: string, uri: string): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const filename = path.split('/').pop() ?? 'upload.jpg';
  const ext = filename.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  // React Native FormData understands { uri, name, type } and reads the local file natively
  const formData = new FormData();
  formData.append('file', { uri, name: filename, type: mimeType } as any);

  const endpoint = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
      'x-upsert': 'true',
    },
    body: formData,
  });

  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch { /* ignore */ }
    throw new Error(`Upload failed (${res.status}): ${detail}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
