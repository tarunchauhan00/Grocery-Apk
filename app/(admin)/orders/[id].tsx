import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersService } from '@/services/orders.service';
import { Badge } from '@/components/ui/Badge';
import { formatINR } from '@/utils/currency';
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '@/utils/constants';

const STATUSES = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'] as const;

export default function AdminOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => ordersService.getOrderById(id),
    enabled: !!id,
  });

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: (status: string) => ordersService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  if (isLoading) {
    return <SafeAreaView className="flex-1 bg-white items-center justify-center"><ActivityIndicator color="#16a34a" /></SafeAreaView>;
  }
  if (!order) return null;

  const color = ORDER_STATUS_COLOR[order.status] ?? '#6b7280';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-2xl text-gray-700">‹</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800">Order #{id.slice(-8).toUpperCase()}</Text>
        </View>
        <Badge label={ORDER_STATUS_LABEL[order.status]} color={color + '22'} textColor={color} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Update Status */}
        <View className="bg-white rounded-2xl p-4 mb-3">
          <Text className="text-sm font-bold text-gray-800 mb-3">Update Status</Text>
          <View className="flex-row flex-wrap gap-2">
            {STATUSES.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => updateStatus(s)}
                disabled={isPending || order.status === s}
                className={`px-3 py-2 rounded-xl border-2 ${order.status === s ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
              >
                <Text className={`text-xs font-medium ${order.status === s ? 'text-green-700' : 'text-gray-600'}`}>
                  {ORDER_STATUS_LABEL[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Customer */}
        <View className="bg-white rounded-2xl p-4 mb-3">
          <Text className="text-sm font-bold text-gray-800 mb-2">Customer</Text>
          <Text className="text-gray-700 font-medium">{order.address_snapshot.full_name}</Text>
          <Text className="text-gray-500 text-sm">📞 {order.address_snapshot.phone}</Text>
          <Text className="text-gray-500 text-sm mt-1">{order.address_snapshot.line1}, {order.address_snapshot.city}</Text>
          <Text className="text-gray-500 text-sm">{order.address_snapshot.state} - {order.address_snapshot.pincode}</Text>
        </View>

        {/* Items */}
        <View className="bg-white rounded-2xl p-4 mb-3">
          <Text className="text-sm font-bold text-gray-800 mb-2">Items</Text>
          {order.order_items?.map((item) => (
            <View key={item.id} className="flex-row justify-between py-1.5 border-b border-gray-50">
              <Text className="text-gray-700 flex-1" numberOfLines={1}>{item.product_name} × {item.quantity}</Text>
              <Text className="text-gray-800 font-medium">{formatINR(item.total_price)}</Text>
            </View>
          ))}
        </View>

        {/* Payment */}
        <View className="bg-white rounded-2xl p-4">
          <Text className="text-sm font-bold text-gray-800 mb-2">Payment</Text>
          {[
            ['Subtotal', formatINR(order.subtotal)],
            ['Delivery', order.delivery_fee === 0 ? 'FREE' : formatINR(order.delivery_fee)],
            ...(order.discount > 0 ? [['Discount', `− ${formatINR(order.discount)}`]] : []),
            ['Total', formatINR(order.total_amount)],
            ['Method', order.payment_method === 'razorpay' ? 'Razorpay' : 'COD'],
            ['Status', order.payment_status],
          ].map(([label, value]) => (
            <View key={label} className="flex-row justify-between mb-1.5">
              <Text className="text-gray-500 text-sm">{label}</Text>
              <Text className="text-gray-800 font-medium text-sm capitalize">{value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
