import { FlatList, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatINR } from '@/utils/currency';
import { DELIVERY_FEE, FREE_DELIVERY_ABOVE } from '@/utils/constants';
import type { CartItem } from '@/types';

function CartRow({ item }: { item: CartItem }) {
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <View className="flex-row items-center py-3 px-4 border-b border-gray-100 bg-white">
      <Image
        source={{ uri: item.product.image_url ?? undefined }}
        style={{ width: 64, height: 64 }}
        contentFit="contain"
      />
      <View className="flex-1 ml-3">
        <Text className="text-gray-800 font-semibold" numberOfLines={2}>{item.product.name}</Text>
        <Text className="text-gray-400 text-xs mt-0.5">{item.product.unit}</Text>
        <Text className="text-gray-800 font-bold mt-1">{formatINR(item.product.price)}</Text>
      </View>
      <View className="flex-row items-center bg-gray-100 rounded-xl overflow-hidden">
        <TouchableOpacity onPress={() => removeItem(item.product.id)} className="px-3 py-2">
          <Text className="text-gray-700 font-bold text-lg">−</Text>
        </TouchableOpacity>
        <Text className="text-gray-900 font-bold text-base w-6 text-center">{item.quantity}</Text>
        <TouchableOpacity onPress={() => addItem(item.product)} className="px-3 py-2">
          <Text className="text-gray-700 font-bold text-lg">+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotal = useCartStore((s) => s.subtotal());
  const deliveryFee = subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 flex-row items-center justify-between border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-2xl text-gray-700">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800">My Cart</Text>
        {items.length > 0 ? (
          <TouchableOpacity onPress={() => clearCart()}>
            <Text className="text-red-500 text-sm font-medium">Clear</Text>
          </TouchableOpacity>
        ) : (
          <View className="w-12" />
        )}
      </View>

      {items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          subtitle="Add items to get started"
          actionLabel="Browse Products"
          onAction={() => router.push('/(app)/(tabs)')}
        />
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(i) => i.product.id}
            renderItem={({ item }) => <CartRow item={item} />}
            contentContainerStyle={{ paddingBottom: 8 }}
            ListFooterComponent={
              <View className="bg-white mt-2 px-4 py-4">
                <Text className="text-base font-bold text-gray-800 mb-3">Order Summary</Text>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500">Subtotal</Text>
                  <Text className="text-gray-800 font-medium">{formatINR(subtotal)}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500">Delivery Fee</Text>
                  {deliveryFee === 0 ? (
                    <Text className="text-green-600 font-medium">FREE</Text>
                  ) : (
                    <Text className="text-gray-800 font-medium">{formatINR(deliveryFee)}</Text>
                  )}
                </View>
                {deliveryFee > 0 && (
                  <Text className="text-xs text-green-600 mb-2">
                    Add {formatINR(FREE_DELIVERY_ABOVE - subtotal)} more for free delivery
                  </Text>
                )}
                <View className="border-t border-gray-100 mt-1 pt-3 flex-row justify-between">
                  <Text className="text-base font-bold text-gray-800">Total</Text>
                  <Text className="text-base font-bold text-green-600">{formatINR(total)}</Text>
                </View>
              </View>
            }
          />

          <View className="px-4 py-4 bg-white border-t border-gray-100" style={{ elevation: 8 }}>
            <Button
              title={`Proceed to Checkout · ${formatINR(total)}`}
              onPress={() => router.push('/(app)/checkout')}
              fullWidth
              size="lg"
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
