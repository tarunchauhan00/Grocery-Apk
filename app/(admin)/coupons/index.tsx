import { useState } from 'react';
import { FlatList, View, Text, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/utils/currency';
import type { Coupon, CouponType } from '@/types';

export default function AdminCouponsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CouponType>('percentage');
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!code.trim() || !value) throw new Error('Code and value are required.');
      const { error } = await supabase.from('coupons').insert({
        code: code.trim().toUpperCase(),
        description: description.trim() || null,
        type,
        value: parseFloat(value),
        min_order_value: minOrder ? parseFloat(minOrder) : 0,
        max_discount: maxDiscount ? parseFloat(maxDiscount) : null,
        usage_limit: usageLimit ? parseInt(usageLimit, 10) : null,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setCode(''); setDescription(''); setValue(''); setMinOrder('');
      setMaxDiscount(''); setUsageLimit(''); setShowForm(false);
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('coupons').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }),
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 flex-row items-center justify-between border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 w-8 h-8 items-center justify-center">
          <Text className="text-2xl text-gray-700">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800 flex-1">Coupons</Text>
        <TouchableOpacity
          onPress={() => setShowForm((v) => !v)}
          className="bg-green-600 rounded-xl px-3 py-1.5"
        >
          <Text className="text-white font-semibold text-sm">{showForm ? '✕ Cancel' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 border border-gray-100">
          <Text className="text-sm font-bold text-gray-800 mb-3">New Coupon</Text>

          <Input
            label="Coupon Code *"
            placeholder="e.g. SAVE20"
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            autoCapitalize="characters"
          />
          <Input label="Description" placeholder="e.g. 20% off on first order" value={description} onChangeText={setDescription} />

          {/* Type selector */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">Discount Type</Text>
          <View className="flex-row gap-2 mb-4">
            {(['percentage', 'flat'] as CouponType[]).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setType(t)}
                className={`flex-1 py-2.5 rounded-xl border-2 items-center ${type === t ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
              >
                <Text className={`font-semibold text-sm ${type === t ? 'text-green-700' : 'text-gray-500'}`}>
                  {t === 'percentage' ? '% Percentage' : '₹ Flat Amount'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input
                label={type === 'percentage' ? 'Discount %' : 'Flat Amount (₹)'}
                placeholder={type === 'percentage' ? '20' : '50'}
                value={value}
                onChangeText={setValue}
                keyboardType="decimal-pad"
              />
            </View>
            <View className="flex-1">
              <Input label="Min Order (₹)" placeholder="0" value={minOrder} onChangeText={setMinOrder} keyboardType="decimal-pad" />
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input label="Max Discount (₹)" placeholder="Optional" value={maxDiscount} onChangeText={setMaxDiscount} keyboardType="decimal-pad" />
            </View>
            <View className="flex-1">
              <Input label="Usage Limit" placeholder="Unlimited" value={usageLimit} onChangeText={setUsageLimit} keyboardType="number-pad" />
            </View>
          </View>

          <Button
            title={createMutation.isPending ? 'Creating...' : 'Create Coupon'}
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
          data={coupons}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="py-16 items-center">
              <Text className="text-4xl mb-3">🏷️</Text>
              <Text className="text-gray-500 font-medium">No coupons yet</Text>
              <Text className="text-gray-400 text-sm mt-1">Tap "+ Add" to create your first coupon</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl px-4 py-3 mb-3 border border-gray-100">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <View className="bg-green-100 px-3 py-1 rounded-lg">
                      <Text className="text-green-700 font-bold text-sm tracking-wider">{item.code}</Text>
                    </View>
                    {!item.is_active && (
                      <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                        <Text className="text-gray-500 text-xs">Inactive</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-gray-600 text-sm mt-1.5">
                    {item.type === 'percentage' ? `${item.value}% off` : `${formatINR(item.value)} off`}
                    {item.min_order_value > 0 ? ` · Min order ${formatINR(item.min_order_value)}` : ''}
                  </Text>
                  {item.description && (
                    <Text className="text-gray-400 text-xs mt-0.5">{item.description}</Text>
                  )}
                  <Text className="text-gray-400 text-xs mt-1">
                    Used: {item.used_count}{item.usage_limit ? ` / ${item.usage_limit}` : ''}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2 ml-3">
                  <Switch
                    value={item.is_active}
                    onValueChange={(v) => toggleMutation.mutate({ id: item.id, is_active: v })}
                    trackColor={{ true: '#16a34a', false: '#e5e7eb' }}
                    thumbColor="#ffffff"
                  />
                  <TouchableOpacity
                    onPress={() => Alert.alert('Delete Coupon', `Delete coupon "${item.code}"?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
                    ])}
                  >
                    <Text className="text-red-400 text-lg">🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
