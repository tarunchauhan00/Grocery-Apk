import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { ordersService } from '@/services/orders.service';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/utils/currency';
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '@/utils/constants';

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'] as const;
const STATUS_EMOJI: Record<string, string> = {
  pending: '📋', confirmed: '✅', preparing: '👨‍🍳', out_for_delivery: '🛵', delivered: '🎉',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id ?? '');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersService.getOrderById(id),
    enabled: !!id,
  });

  // Real-time subscription for order status updates
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['order', id] });
        queryClient.invalidateQueries({ queryKey: ['orders', userId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, userId]);

  async function handleCancel() {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'Keep Order', style: 'cancel' },
      {
        text: 'Cancel Order',
        style: 'destructive',
        onPress: async () => {
          try {
            await ordersService.cancelOrder(id);
            queryClient.invalidateQueries({ queryKey: ['order', id] });
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#16a34a" />
      </SafeAreaView>
    );
  }

  if (!order) return null;

  const statusColor = ORDER_STATUS_COLOR[order.status] ?? '#6b7280';
  const currentStep = STATUS_STEPS.indexOf(order.status as any);
  const isCancelled = order.status === 'cancelled';
  const canCancel = ['pending', 'confirmed'].includes(order.status);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-2xl text-gray-700">‹</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800">Order Details</Text>
          <Text className="text-xs text-gray-400">#{id.slice(-8).toUpperCase()}</Text>
        </View>
        <Badge label={ORDER_STATUS_LABEL[order.status]} color={statusColor + '22'} textColor={statusColor} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Progress tracker */}
        {!isCancelled && (
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4">
            <Text className="text-sm font-bold text-gray-800 mb-4">Order Progress</Text>
            <View className="flex-row items-center justify-between">
              {STATUS_STEPS.map((step, idx) => (
                <View key={step} className="items-center flex-1">
                  <View
                    className={`w-9 h-9 rounded-full items-center justify-center ${idx <= currentStep ? 'bg-green-600' : 'bg-gray-100'}`}
                  >
                    <Text className="text-base">{STATUS_EMOJI[step]}</Text>
                  </View>
                  {idx < STATUS_STEPS.length - 1 && (
                    <View
                      className={`absolute h-0.5 top-4 ${idx < currentStep ? 'bg-green-600' : 'bg-gray-200'}`}
                      style={{ left: '60%', right: '-60%', position: 'absolute' }}
                    />
                  )}
                  <Text className={`text-xs mt-1 text-center ${idx <= currentStep ? 'text-green-700 font-medium' : 'text-gray-400'}`} numberOfLines={2} style={{ maxWidth: 56 }}>
                    {ORDER_STATUS_LABEL[step]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Order Items */}
        <View className="bg-white mx-4 mt-3 rounded-2xl p-4">
          <Text className="text-sm font-bold text-gray-800 mb-3">Items ({order.order_items?.length})</Text>
          {order.order_items?.map((item) => (
            <View key={item.id} className="flex-row items-center py-2 border-b border-gray-50">
              <Image
                source={{ uri: item.product_image ?? undefined }}
                style={{ width: 48, height: 48 }}
                contentFit="contain"
              />
              <View className="flex-1 ml-3">
                <Text className="text-gray-800 font-medium text-sm" numberOfLines={1}>{item.product_name}</Text>
                <Text className="text-gray-400 text-xs">{item.unit} × {item.quantity}</Text>
              </View>
              <Text className="text-gray-800 font-semibold text-sm">{formatINR(item.total_price)}</Text>
            </View>
          ))}
        </View>

        {/* Price Summary */}
        <View className="bg-white mx-4 mt-3 rounded-2xl p-4">
          <Text className="text-sm font-bold text-gray-800 mb-3">Price Summary</Text>
          {[
            ['Subtotal', formatINR(order.subtotal)],
            ['Delivery', order.delivery_fee === 0 ? 'FREE' : formatINR(order.delivery_fee)],
            ...(order.discount > 0 ? [['Discount', `− ${formatINR(order.discount)}`]] : []),
          ].map(([label, value]) => (
            <View key={label} className="flex-row justify-between mb-2">
              <Text className="text-gray-500">{label}</Text>
              <Text className={`font-medium ${value === 'FREE' || value?.startsWith('−') ? 'text-green-600' : 'text-gray-800'}`}>{value}</Text>
            </View>
          ))}
          <View className="flex-row justify-between pt-2 border-t border-gray-100">
            <Text className="text-base font-bold text-gray-800">Total Paid</Text>
            <Text className="text-base font-bold text-green-600">{formatINR(order.total_amount)}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View className="bg-white mx-4 mt-3 rounded-2xl p-4">
          <Text className="text-sm font-bold text-gray-800 mb-2">📍 Delivery Address</Text>
          <Text className="text-gray-700 font-medium">{order.address_snapshot.full_name}</Text>
          <Text className="text-gray-500 text-sm">{order.address_snapshot.line1}{order.address_snapshot.line2 ? `, ${order.address_snapshot.line2}` : ''}</Text>
          <Text className="text-gray-500 text-sm">{order.address_snapshot.city}, {order.address_snapshot.state} {order.address_snapshot.pincode}</Text>
          <Text className="text-gray-400 text-xs mt-1">📞 {order.address_snapshot.phone}</Text>
        </View>

        {/* Payment Info */}
        <View className="bg-white mx-4 mt-3 rounded-2xl p-4">
          <Text className="text-sm font-bold text-gray-800 mb-2">💳 Payment</Text>
          <View className="flex-row justify-between">
            <Text className="text-gray-500">Method</Text>
            <Text className="text-gray-800 font-medium capitalize">
              {order.payment_method === 'razorpay' ? 'Online (Razorpay)' : 'Cash on Delivery'}
            </Text>
          </View>
          <View className="flex-row justify-between mt-1">
            <Text className="text-gray-500">Status</Text>
            <Text className={`font-medium capitalize ${order.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
              {order.payment_status}
            </Text>
          </View>
        </View>

        {/* Cancel button */}
        {canCancel && (
          <View className="mx-4 mt-4">
            <Button title="Cancel Order" onPress={handleCancel} variant="danger" fullWidth />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
