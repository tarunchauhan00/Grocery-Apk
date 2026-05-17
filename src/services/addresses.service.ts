import { supabase } from '@/lib/supabase';
import type { Address } from '@/types';

type AddressInput = Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export const addressesService = {
  async getAddresses(userId: string): Promise<Address[]> {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async createAddress(userId: string, address: AddressInput): Promise<Address> {
    const { data, error } = await supabase
      .from('addresses')
      .insert({ ...address, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateAddress(id: string, updates: Partial<AddressInput>): Promise<Address> {
    const { data, error } = await supabase
      .from('addresses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteAddress(id: string) {
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (error) throw error;
  },

  async setDefault(id: string, userId: string): Promise<void> {
    // The DB trigger handles clearing other defaults
    const { error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },
};
