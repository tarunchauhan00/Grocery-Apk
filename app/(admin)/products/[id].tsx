import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { productsService } from '@/services/products.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsService.getProductById(id),
    enabled: !!id,
  });

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: productsService.getCategories });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [unit, setUnit] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  if (product && !initialized) {
    setName(product.name);
    setDescription(product.description ?? '');
    setPrice(String(product.price));
    setComparePrice(product.compare_price ? String(product.compare_price) : '');
    setUnit(product.unit);
    setStock(String(product.stock_quantity));
    setCategoryId(product.category_id ?? '');
    setIsFeatured(product.is_featured);
    setInitialized(true);
  }

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      let imageUrl = product?.image_url ?? null;
      if (imageUri) {
        try {
          imageUrl = await productsService.uploadProductImage(imageUri, `${id}_${Date.now()}.jpg`);
        } catch {
          // Upload failed — keep existing image rather than blocking the save
        }
      }
      return productsService.updateProduct(id, {
        name, description: description || null,
        price: parseFloat(price), compare_price: comparePrice ? parseFloat(comparePrice) : null,
        unit, stock_quantity: parseInt(stock, 10) || 0,
        category_id: categoryId || null, image_url: imageUrl, is_featured: isFeatured,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      router.back();
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  if (isLoading) {
    return <SafeAreaView className="flex-1 bg-white items-center justify-center"><ActivityIndicator color="#16a34a" /></SafeAreaView>;
  }

  const displayImage = imageUri ?? product?.image_url;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl text-gray-700">‹</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-800 flex-1">Edit Product</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={pickImage} className="border-2 border-dashed border-gray-300 rounded-2xl h-40 items-center justify-center mb-4 overflow-hidden">
            {displayImage ? (
              <Image source={{ uri: displayImage }} style={{ width: '100%', height: 160 }} contentFit="cover" />
            ) : (
              <View className="items-center">
                <Text className="text-3xl">📷</Text>
                <Text className="text-gray-400 mt-2">Tap to change image</Text>
              </View>
            )}
          </TouchableOpacity>

          <Input label="Product Name *" value={name} onChangeText={setName} />
          <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
          <Input label="Price (₹) *" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
          <Input label="Compare Price (₹)" value={comparePrice} onChangeText={setComparePrice} keyboardType="decimal-pad" />
          <Input label="Unit *" value={unit} onChangeText={setUnit} />
          <Input label="Stock Quantity" value={stock} onChangeText={setStock} keyboardType="number-pad" />

          <Text className="text-sm font-medium text-gray-700 mb-2">Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategoryId(cat.id)}
                className={`mr-2 px-3 py-2 rounded-xl border-2 ${categoryId === cat.id ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
              >
                <Text className={`text-sm font-medium ${categoryId === cat.id ? 'text-green-700' : 'text-gray-600'}`}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View className="flex-row items-center justify-between bg-white rounded-xl p-4 mb-4 border border-gray-100">
            <Text className="text-gray-700 font-medium">Featured Product</Text>
            <Switch value={isFeatured} onValueChange={setIsFeatured} trackColor={{ true: '#16a34a' }} />
          </View>

          <Button title="Save Changes" onPress={() => mutate()} loading={isPending} fullWidth size="lg" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
