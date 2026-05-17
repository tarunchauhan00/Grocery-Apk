import { FlatList, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { productsService } from '@/services/products.service';
import { ProductCard } from '@/components/home/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: productsService.getCategories,
  });

  const category = categories.find((c) => c.id === id);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'category', id],
    queryFn: () => productsService.getProductsByCategory(id),
    enabled: !!id,
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-2xl">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800 flex-1">
          {category?.name ?? 'Products'}
        </Text>
        <Text className="text-gray-400 text-sm">{products.length} items</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#16a34a" />
        </View>
      ) : products.length === 0 ? (
        <EmptyState
          title="No products here"
          subtitle="Check back soon — we're stocking up!"
          actionLabel="Browse categories"
          onAction={() => router.back()}
        />
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          columnWrapperStyle={{ justifyContent: 'flex-start', gap: 8 }}
          renderItem={({ item }) => <ProductCard product={item} width={176} />}
        />
      )}
    </SafeAreaView>
  );
}
