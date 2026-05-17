import { FlatList, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/Badge';
import { formatINR } from '@/utils/currency';
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '@/utils/constants';
import type { Order } from '@/types';

export default function AdminOrdersScreen() {
  const router = useRouter();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(id)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Order[];
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-2xl text-gray-700">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800 flex-1">All Orders</Text>
        <Text className="text-gray-400 text-sm">{orders.length} total</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#16a34a" /></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const color = ORDER_STATUS_COLOR[item.status] ?? '#6b7280';
            return (
              <TouchableOpacity
                onPress={() => router.push(`/(admin)/orders/${item.id}`)}
                className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-bold text-gray-800 text-sm">#{item.id.slice(-8).toUpperCase()}</Text>
                  <Badge label={ORDER_STATUS_LABEL[item.status]} color={color + '22'} textColor={color} />
                </View>
                <Text className="text-xs text-gray-400 mb-2">
                  {new Date(item.created_at).toLocaleString('en-IN')}
                </Text>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-600">{(item.order_items as any)?.length ?? 0} items</Text>
                  <Text className="font-bold text-gray-800">{formatINR(item.total_amount)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
