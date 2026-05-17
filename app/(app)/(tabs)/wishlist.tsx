import { FlatList, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatINR } from '@/utils/currency';
import type { Product } from '@/types';

function WishlistCard({ product }: { product: Product }) {
  const router = useRouter();
  const toggle = useWishlistStore((s) => s.toggle);
  const addItem = useCartStore((s) => s.addItem);
  const cartItem = useCartStore((s) => s.getItem(product.id));

  return (
    <View className="bg-white rounded-2xl border border-gray-100 mb-3 mx-4 overflow-hidden" style={{ elevation: 1 }}>
      <TouchableOpacity
        onPress={() => router.push(`/(app)/product/${product.id}`)}
        className="flex-row items-center p-3"
      >
        <View className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50">
          <Image
            source={{ uri: product.image_url ?? undefined }}
            style={{ width: 80, height: 80 }}
            contentFit="contain"
          />
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-gray-900 font-semibold text-sm" numberOfLines={2}>{product.name}</Text>
          <Text className="text-gray-400 text-xs mt-0.5">{product.unit}</Text>
          <View className="flex-row items-center mt-1 gap-2">
            <Text className="text-gray-900 font-bold text-base">{formatINR(product.price)}</Text>
            {product.compare_price && (
              <Text className="text-gray-400 text-xs line-through">{formatINR(product.compare_price)}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={() => toggle(product)} className="p-2">
          <Text className="text-red-400 text-lg">❤️</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      <View className="flex-row border-t border-gray-100">
        <TouchableOpacity
          onPress={() => toggle(product)}
          className="flex-1 py-3 items-center"
        >
          <Text className="text-gray-500 text-sm font-medium">Remove</Text>
        </TouchableOpacity>
        <View className="w-px bg-gray-100" />
        {product.stock_quantity === 0 ? (
          <View className="flex-1 py-3 items-center">
            <Text className="text-gray-400 text-sm">Out of stock</Text>
          </View>
        ) : cartItem ? (
          <TouchableOpacity
            onPress={() => router.push('/(app)/cart')}
            className="flex-1 py-3 items-center"
          >
            <Text className="text-green-600 font-semibold text-sm">In Cart ({cartItem.quantity})</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => addItem(product)}
            className="flex-1 py-3 items-center"
          >
            <Text className="text-green-600 font-semibold text-sm">Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function WishlistScreen() {
  const router = useRouter();
  const items = useWishlistStore((s) => s.items);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Wishlist</Text>
        {items.length > 0 && (
          <Text className="text-gray-400 text-sm mt-0.5">{items.length} saved item{items.length !== 1 ? 's' : ''}</Text>
        )}
      </View>

      {items.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          subtitle="Tap the ♡ on any product to save it here for later."
          actionLabel="Browse Products"
          onAction={() => router.push('/(app)/(tabs)')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
          renderItem={({ item }) => <WishlistCard product={item} />}
        />
      )}
    </SafeAreaView>
  );
}
