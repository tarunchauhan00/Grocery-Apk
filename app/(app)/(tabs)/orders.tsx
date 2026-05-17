import { FlatList, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ordersService } from '@/services/orders.service';
import { useAuthStore } from '@/store/authStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { formatINR } from '@/utils/currency';
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '@/utils/constants';
import type { Order } from '@/types';

function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const color = ORDER_STATUS_COLOR[order.status] ?? '#6b7280';
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 mb-3 mx-4 border border-gray-100"
      style={{ elevation: 1 }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-bold text-gray-800">
          #{order.id.slice(-8).toUpperCase()}
        </Text>
        <Badge
          label={ORDER_STATUS_LABEL[order.status]}
          color={color + '22'}
          textColor={color}
        />
      </View>
      <Text className="text-xs text-gray-400 mb-3">
        {new Date(order.created_at).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric',
        })}
      </Text>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-gray-600">
          {order.order_items?.length ?? 0} items
        </Text>
        <Text className="text-base font-bold text-gray-800">{formatINR(order.total_amount)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id ?? '');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', userId],
    queryFn: () => ordersService.getOrders(userId),
    enabled: !!userId,
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-800">My Orders</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#16a34a" />
        </View>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          subtitle="Your orders will appear here once you place one."
          actionLabel="Start Shopping"
          onAction={() => router.push('/(app)/(tabs)')}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={() => router.push(`/(app)/order/${item.id}`)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}
