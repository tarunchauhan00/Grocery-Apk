import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/utils/storage';
import type { Profile } from '@/types';

export const profileService = {
  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Pick<Profile, 'full_name' | 'phone' | 'avatar_url'>>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async uploadAvatar(userId: string, uri: string): Promise<string> {
    const ext = uri.split('.').pop()?.split('?')[0] ?? 'jpg';
    const path = `${userId}/avatar.${ext}`;
    return uploadImage('avatars', path, uri);
  },
};
