import { FlatList, View, Text, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { productsService } from '@/services/products.service';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Category } from '@/types';

export default function AdminCategoriesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#4CAF50');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('sort_order');
      if (error) throw error;
      return data as Category[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      let image_url: string | null = null;

      if (imageUri) {
        setUploading(true);
        try {
          const filename = `${slug}_${Date.now()}.jpg`;
          image_url = await productsService.uploadCategoryImage(imageUri, filename);
        } catch {
          // Image upload failed — category saves without image
        } finally {
          setUploading(false);
        }
      }

      const { data, error } = await supabase
        .from('categories')
        .insert({ name, slug, color, image_url, sort_order: categories.length + 1 })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setName(''); setColor('#4CAF50'); setImageUri(null); setShowForm(false);
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  const busy = createMutation.isPending || uploading;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-2xl text-gray-700">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800 flex-1">Categories</Text>
        <TouchableOpacity onPress={() => setShowForm((v) => !v)} className="bg-green-600 rounded-xl px-3 py-1.5">
          <Text className="text-white font-semibold text-sm">{showForm ? '✕ Close' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 border border-gray-100">
          <Text className="text-sm font-bold text-gray-800 mb-3">New Category</Text>

          {/* Image picker */}
          <TouchableOpacity
            onPress={pickImage}
            className="border-2 border-dashed border-gray-300 rounded-xl h-24 items-center justify-center mb-3 overflow-hidden"
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: 96 }} contentFit="cover" />
            ) : (
              <View className="items-center">
                <Text className="text-2xl">🖼️</Text>
                <Text className="text-gray-400 text-xs mt-1">Tap to add category image</Text>
              </View>
            )}
          </TouchableOpacity>

          <Input label="Name" placeholder="e.g. Dairy & Eggs" value={name} onChangeText={setName} />

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Color (hex)</Text>
            <View className="flex-row items-center gap-2">
              <TextInput
                className="flex-1 border border-gray-200 rounded-xl px-3 py-3 text-gray-900"
                value={color}
                onChangeText={setColor}
                placeholder="#4CAF50"
                autoCapitalize="characters"
              />
              <View className="w-10 h-10 rounded-xl border border-gray-200" style={{ backgroundColor: color }} />
            </View>
          </View>

          <Button
            title={busy ? 'Creating...' : 'Create Category'}
            onPress={() => createMutation.mutate()}
            loading={busy}
            disabled={!name.trim() || busy}
          />
        </View>
      )}

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#16a34a" />
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl px-4 py-3 mb-2 flex-row items-center border border-gray-100">
              {/* Category icon: image if set, else color dot */}
              <View
                className="w-12 h-12 rounded-xl mr-3 items-center justify-center overflow-hidden"
                style={{ backgroundColor: item.color + '22' }}
              >
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={{ width: 48, height: 48 }} contentFit="cover" />
                ) : (
                  <View className="w-5 h-5 rounded-full" style={{ backgroundColor: item.color }} />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold">{item.name}</Text>
                {item.image_url ? (
                  <Text className="text-gray-400 text-xs mt-0.5">Has image</Text>
                ) : (
                  <Text className="text-gray-300 text-xs mt-0.5">No image</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Delete', `Delete "${item.name}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
                  ])
                }
                className="p-2"
              >
                <Text className="text-red-400 text-lg">🗑</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
