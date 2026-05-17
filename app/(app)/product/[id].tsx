import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { productsService } from '@/services/products.service';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatINR, discountPct } from '@/utils/currency';

const { width: W } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [imageIndex, setImageIndex] = useState(0);

  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const cartItem = useCartStore((s) => s.getItem(id));
  const qty = cartItem?.quantity ?? 0;
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(id));

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsService.getProductById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#16a34a" />
      </SafeAreaView>
    );
  }

  if (!product) return null;

  const images = product.product_images?.length
    ? product.product_images.map((i) => i.url)
    : product.image_url
      ? [product.image_url]
      : [];

  const pct = discountPct(product.price, product.compare_price);
  const outOfStock = product.stock_quantity === 0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Back button */}
      <TouchableOpacity onPress={() => router.back()} className="absolute top-12 left-4 z-10 bg-white/90 rounded-full w-10 h-10 items-center justify-center" style={{ elevation: 2 }}>
        <Text className="text-xl text-gray-700">‹</Text>
      </TouchableOpacity>
      {/* Wishlist button */}
      <TouchableOpacity
        onPress={() => product && toggleWishlist(product)}
        className="absolute top-12 right-4 z-10 bg-white/90 rounded-full w-10 h-10 items-center justify-center"
        style={{ elevation: 2 }}
      >
        <Text className="text-lg">{isWishlisted ? '❤️' : '🤍'}</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image gallery */}
        <View>
          <FlatList
            data={images.length ? images : ['placeholder']}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            onMomentumScrollEnd={(e) => setImageIndex(Math.round(e.nativeEvent.contentOffset.x / W))}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item !== 'placeholder' ? item : undefined }}
                style={{ width: W, height: W * 0.85 }}
                contentFit="contain"
              />
            )}
          />
          {images.length > 1 && (
            <View className="flex-row justify-center gap-1.5 absolute bottom-3 w-full">
              {images.map((_, i) => (
                <View key={i} className={`h-1.5 rounded-full ${i === imageIndex ? 'w-4 bg-green-600' : 'w-1.5 bg-gray-300'}`} />
              ))}
            </View>
          )}
        </View>

        <View className="px-4 pt-4 pb-8">
          {/* Category badge */}
          {product.category && (
            <TouchableOpacity onPress={() => router.push(`/(app)/category/${product.category_id}`)}>
              <Badge label={product.category.name} color={product.category.color + '22'} textColor={product.category.color} />
            </TouchableOpacity>
          )}

          <Text className="text-2xl font-bold text-gray-900 mt-2">{product.name}</Text>
          <Text className="text-gray-400 mt-1">{product.unit}</Text>

          {/* Price row */}
          <View className="flex-row items-center gap-3 mt-3">
            <Text className="text-3xl font-bold text-gray-900">{formatINR(product.price)}</Text>
            {product.compare_price && (
              <Text className="text-lg text-gray-400 line-through">{formatINR(product.compare_price)}</Text>
            )}
            {pct > 0 && (
              <Badge label={`${pct}% off`} color="#dcfce7" textColor="#16a34a" size="md" />
            )}
          </View>

          {/* Stock */}
          <Text className={`text-sm mt-1 ${outOfStock ? 'text-red-500' : 'text-green-600'} font-medium`}>
            {outOfStock ? 'Out of stock' : `In stock (${product.stock_quantity} left)`}
          </Text>

          {/* Description */}
          {product.description && (
            <View className="mt-5">
              <Text className="text-base font-bold text-gray-800 mb-2">About this product</Text>
              <Text className="text-gray-600 leading-relaxed">{product.description}</Text>
            </View>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-4">
              {product.tags.map((tag) => (
                <View key={tag} className="bg-gray-100 rounded-full px-3 py-1">
                  <Text className="text-xs text-gray-500">{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom bar */}
      {!outOfStock && (
        <View className="px-4 py-4 border-t border-gray-100 bg-white flex-row items-center gap-3" style={{ elevation: 8 }}>
          {qty === 0 ? (
            <Button title="Add to Cart" onPress={() => addItem(product)} fullWidth size="lg" />
          ) : (
            <>
              <View className="flex-row items-center bg-gray-100 rounded-xl overflow-hidden">
                <TouchableOpacity onPress={() => removeItem(product.id)} className="px-4 py-3">
                  <Text className="text-gray-800 font-bold text-xl">−</Text>
                </TouchableOpacity>
                <Text className="text-gray-900 font-bold text-lg px-2">{qty}</Text>
                <TouchableOpacity onPress={() => addItem(product)} className="px-4 py-3">
                  <Text className="text-gray-800 font-bold text-xl">+</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-1">
                <Button title={`Go to Cart · ${formatINR(product.price * qty)}`} onPress={() => router.push('/(app)/cart')} size="lg" />
              </View>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
