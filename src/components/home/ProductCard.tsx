import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import type { Product } from '@/types';
import { formatINR, discountPct } from '@/utils/currency';

interface Props {
  product: Product;
  width?: number;
}

export function ProductCard({ product, width = 168 }: Props) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const cartItem = useCartStore((s) => s.getItem(product.id));
  const toggle = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));
  const qty = cartItem?.quantity ?? 0;
  const pct = discountPct(product.price, product.compare_price);
  const outOfStock = product.stock_quantity === 0;

  return (
    <Pressable
      onPress={() => router.push(`/(app)/product/${product.id}`)}
      style={{
        width,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        overflow: 'hidden',
        marginRight: 12,
        marginBottom: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      }}
    >
      {/* Image */}
      <View style={{ position: 'relative' }}>
        <Image
          source={{ uri: product.image_url ?? undefined }}
          style={{ width, height: width * 0.75, backgroundColor: '#f8fafc' }}
          contentFit="cover"
        />
        {/* Discount badge */}
        {pct > 0 && (
          <View
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: '#ef4444',
              borderRadius: 8,
              paddingHorizontal: 7,
              paddingVertical: 3,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{pct}% off</Text>
          </View>
        )}
        {/* Wishlist button */}
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); toggle(product); }}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: 'rgba(255,255,255,0.92)',
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.12,
            shadowRadius: 3,
          }}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={15}
            color={isWishlisted ? '#ef4444' : '#9ca3af'}
          />
        </TouchableOpacity>
        {/* Out of stock overlay */}
        {outOfStock && (
          <View
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.38)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Out of Stock</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={{ padding: 10 }}>
        <Text
          style={{ color: '#0f172a', fontWeight: '600', fontSize: 13, lineHeight: 18 }}
          numberOfLines={2}
        >
          {product.name}
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>{product.unit}</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <View>
            <Text style={{ color: '#0f172a', fontWeight: '700', fontSize: 15 }}>{formatINR(product.price)}</Text>
            {product.compare_price && (
              <Text style={{ color: '#cbd5e1', fontSize: 11, textDecorationLine: 'line-through', marginTop: 1 }}>
                {formatINR(product.compare_price)}
              </Text>
            )}
          </View>

          {!outOfStock && (
            qty === 0 ? (
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation(); addItem(product); }}
                style={{
                  backgroundColor: '#16a34a',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>+ Add</Text>
              </TouchableOpacity>
            ) : (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#16a34a',
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); removeItem(product.id); }}
                  style={{ paddingHorizontal: 10, paddingVertical: 7 }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>−</Text>
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, minWidth: 14, textAlign: 'center' }}>
                  {qty}
                </Text>
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); addItem(product); }}
                  style={{ paddingHorizontal: 10, paddingVertical: 7 }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>+</Text>
                </TouchableOpacity>
              </View>
            )
          )}
        </View>
      </View>
    </Pressable>
  );
}
