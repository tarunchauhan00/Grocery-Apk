import { useState } from 'react';
import { FlatList, View, Text, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { DeliverySlot } from '@/types';

export default function AdminSlotsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [slotStart, setSlotStart] = useState('');
  const [slotEnd, setSlotEnd] = useState('');

  const { data: slots = [], isLoading } = useQuery<DeliverySlot[]>({
    queryKey: ['admin-slots'],
    queryFn: async () => {
      const { data, error } = await supabase.from('delivery_slots').select('*').order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!label.trim() || !slotStart || !slotEnd) throw new Error('All fields are required.');
      const { error } = await supabase.from('delivery_slots').insert({
        label: label.trim(),
        slot_start: slotStart,
        slot_end: slotEnd,
        sort_order: slots.length + 1,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-slots'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-slots'] });
      setLabel(''); setSlotStart(''); setSlotEnd(''); setShowForm(false);
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('delivery_slots').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-slots'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-slots'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('delivery_slots').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-slots'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-slots'] });
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 flex-row items-center justify-between border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 w-8 h-8 items-center justify-center">
          <Text className="text-2xl text-gray-700">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800 flex-1">Delivery Slots</Text>
        <TouchableOpacity
          onPress={() => setShowForm((v) => !v)}
          className="bg-green-600 rounded-xl px-3 py-1.5"
        >
          <Text className="text-white font-semibold text-sm">{showForm ? '✕ Cancel' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 border border-gray-100">
          <Text className="text-sm font-bold text-gray-800 mb-3">New Delivery Slot</Text>
          <Input
            label="Label *"
            placeholder="e.g. Morning (9 AM – 12 PM)"
            value={label}
            onChangeText={setLabel}
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input label="Start Time *" placeholder="09:00" value={slotStart} onChangeText={setSlotStart} />
            </View>
            <View className="flex-1">
              <Input label="End Time *" placeholder="12:00" value={slotEnd} onChangeText={setSlotEnd} />
            </View>
          </View>
          <Button
            title={createMutation.isPending ? 'Creating...' : 'Create Slot'}
            onPress={() => createMutation.mutate()}
            loading={createMutation.isPending}
            fullWidth
          />
        </View>
      )}

      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#16a34a" /></View>
      ) : (
        <FlatList
          data={slots}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="py-16 items-center">
              <Text className="text-4xl mb-3">🕐</Text>
              <Text className="text-gray-500 font-medium">No delivery slots yet</Text>
              <Text className="text-gray-400 text-sm mt-1">Add time windows for delivery</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl px-4 py-3 mb-3 flex-row items-center border border-gray-100">
              <View className="w-10 h-10 rounded-xl bg-green-50 items-center justify-center mr-3">
                <Text className="text-lg">🕐</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-800">{item.label}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">{item.slot_start} – {item.slot_end}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Switch
                  value={item.is_active}
                  onValueChange={(v) => toggleMutation.mutate({ id: item.id, is_active: v })}
                  trackColor={{ true: '#16a34a', false: '#e5e7eb' }}
                  thumbColor="#ffffff"
                />
                <TouchableOpacity
                  onPress={() => Alert.alert('Delete Slot', `Delete "${item.label}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
                  ])}
                >
                  <Text className="text-red-400 text-lg">🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
