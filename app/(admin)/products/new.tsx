import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { productsService } from '@/services/products.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function NewProductScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [unit, setUnit] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: productsService.getCategories,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      let imageUrl: string | null = null;

      if (imageUri) {
        try {
          setUploadingImage(true);
          imageUrl = await productsService.uploadProductImage(imageUri, `${Date.now()}.jpg`);
        } catch {
          // Upload failed — save product without image rather than blocking the user
        } finally {
          setUploadingImage(false);
        }
      }

      const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      return productsService.createProduct({
        name: name.trim(),
        slug,
        description: description.trim() || null,
        price: parseFloat(price),
        compare_price: comparePrice ? parseFloat(comparePrice) : null,
        unit: unit.trim(),
        stock_quantity: parseInt(stock, 10) || 0,
        category_id: categoryId || null,
        image_url: imageUrl,
        is_active: true,
        is_featured: isFeatured,
        tags: null,
        sort_order: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.back();
    },
    onError: (e: any) => Alert.alert('Failed to save', e.message),
  });

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Product name is required.');
      return;
    }
    const parsedPrice = parseFloat(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Invalid price', 'Enter a valid price greater than 0.');
      return;
    }
    if (!unit.trim()) {
      Alert.alert('Missing unit', 'Unit is required (e.g. 1 kg, 500g, 6 pcs).');
      return;
    }
    mutate();
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }

  const busy = isPending || uploadingImage;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        {/* Header */}
        <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 w-8 h-8 items-center justify-center">
            <Text className="text-2xl text-gray-700">‹</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-800">New Product</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          {/* Image picker */}
          <TouchableOpacity
            onPress={pickImage}
            className="border-2 border-dashed border-gray-300 rounded-2xl h-40 items-center justify-center mb-4 bg-white overflow-hidden"
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: 160 }} contentFit="cover" />
            ) : (
              <View className="items-center">
                <Text className="text-4xl">📷</Text>
                <Text className="text-gray-400 mt-2 font-medium text-sm">Tap to add product image</Text>
                <Text className="text-gray-300 text-xs mt-0.5">Optional — you can add it later</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Fields */}
          <Input label="Product Name *" placeholder="e.g. Fresh Apples" value={name} onChangeText={setName} />
          <Input
            label="Description"
            placeholder="Brief product description..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input label="Price (₹) *" placeholder="0.00" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
            </View>
            <View className="flex-1">
              <Input label="MRP (₹)" placeholder="0.00" value={comparePrice} onChangeText={setComparePrice} keyboardType="decimal-pad" />
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input label="Unit *" placeholder="1 kg / 500g / 6 pcs" value={unit} onChangeText={setUnit} />
            </View>
            <View className="flex-1">
              <Input label="Stock" placeholder="0" value={stock} onChangeText={setStock} keyboardType="number-pad" />
            </View>
          </View>

          {/* Category */}
          <Text className="text-sm font-semibold text-gray-700 mb-2 mt-1">Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <TouchableOpacity
              onPress={() => setCategoryId('')}
              className={`mr-2 px-3 py-2 rounded-xl border-2 ${categoryId === '' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}
            >
              <Text className={`text-sm font-medium ${categoryId === '' ? 'text-green-700' : 'text-gray-500'}`}>None</Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategoryId(cat.id)}
                className={`mr-2 px-3 py-2 rounded-xl border-2 ${categoryId === cat.id ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}
              >
                <Text className={`text-sm font-medium ${categoryId === cat.id ? 'text-green-700' : 'text-gray-600'}`}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Featured toggle */}
          <View className="flex-row items-center justify-between bg-white rounded-xl p-4 mb-6 border border-gray-100">
            <View>
              <Text className="text-gray-800 font-semibold text-sm">Featured Product</Text>
              <Text className="text-gray-400 text-xs mt-0.5">Show on home screen</Text>
            </View>
            <Switch
              value={isFeatured}
              onValueChange={setIsFeatured}
              trackColor={{ true: '#16a34a', false: '#e5e7eb' }}
              thumbColor="#ffffff"
            />
          </View>

          <Button
            title={busy ? 'Saving...' : 'Create Product'}
            onPress={handleSave}
            loading={busy}
            fullWidth
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
