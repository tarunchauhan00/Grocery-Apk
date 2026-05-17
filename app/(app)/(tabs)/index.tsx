import { ScrollView, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { productsService } from '@/services/products.service';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { BannerCarousel } from '@/components/home/BannerCarousel';
import { CategoryChip } from '@/components/home/CategoryChip';
import { ProductCard } from '@/components/home/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatINR } from '@/utils/currency';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function SectionHeader({
  title,
  icon,
  onSeeAll,
}: {
  title: string;
  icon?: IoniconName;
  onSeeAll?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between px-4 mb-3">
      <View className="flex-row items-center" style={{ gap: 6 }}>
        {icon && <Ionicons name={icon} size={17} color="#16a34a" />}
        <Text className="text-base font-bold text-gray-900">{title}</Text>
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} className="flex-row items-center" style={{ gap: 2 }}>
          <Text className="text-green-600 text-sm font-medium">See all</Text>
          <Ionicons name="chevron-forward" size={14} color="#16a34a" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function DeliveryStrip() {
  return (
    <View className="flex-row items-center justify-around bg-green-50 border-b border-green-100 px-4 py-2.5">
      <View className="flex-row items-center" style={{ gap: 5 }}>
        <Ionicons name="flash" size={14} color="#15803d" />
        <Text className="text-green-800 text-xs font-semibold">30-min delivery</Text>
      </View>
      <View className="w-px h-4 bg-green-200" />
      <View className="flex-row items-center" style={{ gap: 5 }}>
        <Ionicons name="leaf-outline" size={14} color="#15803d" />
        <Text className="text-green-800 text-xs font-semibold">100% fresh</Text>
      </View>
      <View className="w-px h-4 bg-green-200" />
      <View className="flex-row items-center" style={{ gap: 5 }}>
        <Ionicons name="bicycle-outline" size={15} color="#15803d" />
        <Text className="text-green-800 text-xs font-semibold">Free above ₹299</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const cartCount = useCartStore((s) => s.itemCount());
  const cartSubtotal = useCartStore((s) => s.subtotal());
  const wishlistCount = useWishlistStore((s) => s.count());

  const { data: banners = [] } = useQuery({
    queryKey: ['banners'],
    queryFn: productsService.getBanners,
  });

  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: productsService.getCategories,
  });

  const { data: featured = [], isLoading: loadingFeatured } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: productsService.getFeaturedProducts,
  });

  const { data: onSale = [], isLoading: loadingSale } = useQuery({
    queryKey: ['products', 'on-sale'],
    queryFn: productsService.getProductsOnSale,
  });

  const { data: newArrivals = [], isLoading: loadingNew } = useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: productsService.getNewArrivals,
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Shopper';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-2 pb-3" style={{ borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '500' }}>{greeting()}</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 1 }}>
              {firstName} 👋
            </Text>
          </View>
          <View className="flex-row items-center" style={{ gap: 4 }}>
            {profile?.is_admin && (
              <TouchableOpacity
                onPress={() => router.push('/(admin)')}
                style={{
                  backgroundColor: '#fef3c7',
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Ionicons name="settings-outline" size={13} color="#92400e" />
                <Text style={{ color: '#92400e', fontWeight: '600', fontSize: 12 }}>Admin</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => router.push('/(app)/(tabs)/wishlist' as any)}
              style={{ padding: 8, position: 'relative' }}
            >
              <Ionicons name="heart-outline" size={24} color="#374151" />
              {wishlistCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    backgroundColor: '#ef4444',
                    borderRadius: 6,
                    minWidth: 16,
                    height: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 2,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{wishlistCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(app)/cart')}
              style={{ padding: 8, position: 'relative' }}
            >
              <Ionicons name="cart-outline" size={24} color="#374151" />
              {cartCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    backgroundColor: '#16a34a',
                    borderRadius: 6,
                    minWidth: 16,
                    height: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 2,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{cartCount > 9 ? '9+' : cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar */}
        <TouchableOpacity
          onPress={() => router.push('/(app)/(tabs)/search')}
          style={{
            marginTop: 12,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 11,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            gap: 8,
          }}
        >
          <Ionicons name="search-outline" size={17} color="#94a3b8" />
          <Text style={{ color: '#94a3b8', fontSize: 14, flex: 1 }}>Search groceries, fruits, veggies...</Text>
          <View style={{ backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
            <Text style={{ fontSize: 10, color: '#64748b', fontWeight: '500' }}>Search</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Delivery promise strip */}
      <DeliveryStrip />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Banners */}
        <View className="mt-4">
          <BannerCarousel banners={banners} />
        </View>

        {/* Categories */}
        <View className="mt-5">
          <SectionHeader
            title="Shop by Category"
            icon="grid-outline"
            onSeeAll={() => router.push('/(app)/(tabs)/search')}
          />
          {loadingCats ? (
            <View className="flex-row px-4" style={{ gap: 16 }}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} className="items-center">
                  <Skeleton width={64} height={64} borderRadius={16} />
                  <Skeleton width={48} height={10} borderRadius={4} style={{ marginTop: 6 }} />
                </View>
              ))}
            </View>
          ) : (
            <FlatList
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              keyExtractor={(c) => c.id}
              renderItem={({ item }) => (
                <CategoryChip category={item} onPress={() => router.push(`/(app)/category/${item.id}`)} />
              )}
            />
          )}
        </View>

        {/* Today's Deals */}
        {(loadingSale || onSale.length > 0) && (
          <View className="mt-5">
            <SectionHeader
              title="Today's Deals"
              icon="pricetag-outline"
              onSeeAll={() => router.push('/(app)/(tabs)/search')}
            />
            {loadingSale ? (
              <View className="flex-row px-4" style={{ gap: 12 }}>
                {[1, 2].map((i) => (
                  <Skeleton key={i} width={168} height={220} borderRadius={16} />
                ))}
              </View>
            ) : (
              <FlatList
                data={onSale}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                keyExtractor={(p) => p.id}
                renderItem={({ item }) => <ProductCard product={item} />}
              />
            )}
          </View>
        )}

        {/* Featured Products */}
        <View className="mt-5">
          <SectionHeader
            title="Featured Products"
            icon="star-outline"
            onSeeAll={() => router.push('/(app)/(tabs)/search')}
          />
          {loadingFeatured ? (
            <View className="flex-row px-4" style={{ gap: 12 }}>
              {[1, 2].map((i) => (
                <Skeleton key={i} width={168} height={220} borderRadius={16} />
              ))}
            </View>
          ) : featured.length === 0 ? (
            <View className="px-4 py-6 items-center">
              <Text className="text-gray-300 text-sm">No featured products yet</Text>
            </View>
          ) : (
            <FlatList
              data={featured}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              keyExtractor={(p) => p.id}
              renderItem={({ item }) => <ProductCard product={item} />}
            />
          )}
        </View>

        {/* New Arrivals */}
        {(loadingNew || newArrivals.length > 0) && (
          <View className="mt-5">
            <SectionHeader title="New Arrivals" icon="sparkles-outline" />
            {loadingNew ? (
              <View className="flex-row flex-wrap px-4" style={{ gap: 12 }}>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} width={168} height={220} borderRadius={16} />
                ))}
              </View>
            ) : (
              <View className="px-4 flex-row flex-wrap" style={{ gap: 12 }}>
                {newArrivals.map((product) => (
                  <ProductCard key={product.id} product={product} width={164} />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <TouchableOpacity
          onPress={() => router.push('/(app)/cart')}
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            backgroundColor: '#16a34a',
            borderRadius: 18,
            paddingHorizontal: 18,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            elevation: 12,
            shadowColor: '#16a34a',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.45,
            shadowRadius: 16,
          }}
        >
          <View
            style={{
              backgroundColor: '#15803d',
              borderRadius: 10,
              minWidth: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 6,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{cartCount}</Text>
          </View>
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Ionicons name="cart" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>View Cart</Text>
          </View>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{formatINR(cartSubtotal)}</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
