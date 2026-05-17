import { FlatList, View, Text, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService } from '@/services/products.service';
import { formatINR } from '@/utils/currency';
import type { Product } from '@/types';

function ProductRow({ product, onDelete }: { product: Product; onDelete: () => void }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(admin)/products/${product.id}`)}
      className="bg-white flex-row items-center px-4 py-3 border-b border-gray-100"
    >
      <View className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100">
        <Image
          source={{ uri: product.image_url ?? undefined }}
          style={{ width: 56, height: 56 }}
          contentFit="cover"
        />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-gray-900 font-semibold text-sm" numberOfLines={1}>{product.name}</Text>
        <Text className="text-gray-400 text-xs mt-0.5">{product.unit} · Stock: {product.stock_quantity}</Text>
        <View className="flex-row items-center mt-0.5 gap-2">
          <Text className="text-green-600 font-bold text-sm">{formatINR(product.price)}</Text>
          {!product.is_active && (
            <View className="bg-red-100 px-2 py-0.5 rounded-full">
              <Text className="text-red-600 text-xs font-medium">Inactive</Text>
            </View>
          )}
          {product.is_featured && (
            <View className="bg-amber-100 px-2 py-0.5 rounded-full">
              <Text className="text-amber-700 text-xs font-medium">Featured</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={onDelete} className="ml-2 p-2">
        <Text className="text-red-400 text-lg">🗑</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function AdminProductsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: productsService.getAllProducts,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsService.deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  function confirmDelete(id: string, name: string) {
    Alert.alert('Delete Product', `Delete "${name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 flex-row items-center justify-between border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 w-8 h-8 items-center justify-center">
          <Text className="text-2xl text-gray-700">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800 flex-1">Products</Text>
        <TouchableOpacity
          onPress={() => router.push('/(admin)/products/new')}
          className="bg-green-600 rounded-xl px-3 py-1.5"
        >
          <Text className="text-white font-semibold text-sm">+ Add</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
          <Text className="text-gray-400 mr-2">🔍</Text>
          <TextInput
            className="flex-1 text-sm text-gray-800"
            placeholder="Search products..."
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text className="text-gray-400 text-sm">✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#16a34a" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          ListHeaderComponent={
            <Text className="text-xs text-gray-400 px-4 py-2 bg-gray-50">
              {filtered.length} product{filtered.length !== 1 ? 's' : ''}
            </Text>
          }
          ListEmptyComponent={
            <View className="py-16 items-center">
              <Text className="text-4xl mb-3">📦</Text>
              <Text className="text-gray-500 font-medium">No products found</Text>
              <Text className="text-gray-400 text-sm mt-1">Tap "+ Add" to create your first product</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ProductRow product={item} onDelete={() => confirmDelete(item.id, item.name)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}
