import { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { productsService } from '@/services/products.service';
import { ProductCard } from '@/components/home/ProductCard';
import { CategoryChip } from '@/components/home/CategoryChip';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const router = useRouter();

  const debounceRef = useCallback((text: string) => {
    setQuery(text);
    const t = setTimeout(() => setDebouncedQuery(text), 400);
    return () => clearTimeout(t);
  }, []);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: productsService.getCategories,
  });

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => productsService.searchProducts(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const showResults = debouncedQuery.length >= 2;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 pt-4 pb-2 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-800 mb-3">Search</Text>
        <Input
          placeholder="Search fruits, vegetables, dairy..."
          value={query}
          onChangeText={debounceRef}
          leftIcon={<Text className="text-gray-400">🔍</Text>}
          rightIcon={query ? <Text className="text-gray-400 text-sm">✕</Text> : undefined}
          onRightIconPress={() => { setQuery(''); setDebouncedQuery(''); }}
        />
      </View>

      {!showResults ? (
        <FlatList
          data={categories}
          ListHeaderComponent={<Text className="text-base font-bold text-gray-800 px-4 pt-4 pb-2">All Categories</Text>}
          numColumns={3}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View className="flex-1 items-center py-2">
              <CategoryChip category={item} onPress={() => router.push(`/(app)/category/${item.id}`)} />
            </View>
          )}
        />
      ) : isFetching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#16a34a" />
        </View>
      ) : results.length === 0 ? (
        <EmptyState
          title="No results found"
          subtitle={`We couldn't find anything for "${debouncedQuery}"`}
        />
      ) : (
        <FlatList
          data={results}
          ListHeaderComponent={
            <Text className="text-sm text-gray-500 px-4 pt-3 pb-2">
              {results.length} results for "{debouncedQuery}"
            </Text>
          }
          numColumns={2}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 24 }}
          columnWrapperStyle={{ justifyContent: 'flex-start', paddingHorizontal: 8 }}
          renderItem={({ item }) => <ProductCard product={item} width={164} />}
        />
      )}
    </SafeAreaView>
  );
}
