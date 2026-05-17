import { useState } from 'react';
import { FlatList, View, Text, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/utils/storage';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Banner } from '@/types';

async function uploadBannerImage(uri: string): Promise<string> {
  const filename = `banner_${Date.now()}.jpg`;
  return uploadImage('banners', filename, uri);
}

export default function AdminBannersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [bgColor, setBgColor] = useState('#16a34a');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data, error } = await supabase.from('banners').select('*').order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-banners'] }),
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('banners').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-banners'] }),
  });

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 7],
      quality: 0.85,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function handleCreate() {
    if (!imageUri) {
      Alert.alert('Image required', 'Please select a banner image.');
      return;
    }
    setSaving(true);
    try {
      let imageUrl = '';
      try {
        imageUrl = await uploadBannerImage(imageUri);
      } catch (e: any) {
        Alert.alert('Upload failed', e.message ?? 'Could not upload banner image.');
        return;
      }
      const { error } = await supabase.from('banners').insert({
        title: title || null,
        subtitle: subtitle || null,
        image_url: imageUrl,
        bg_color: bgColor,
        sort_order: banners.length + 1,
        is_active: true,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      setTitle(''); setSubtitle(''); setImageUri(null); setShowForm(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 flex-row items-center justify-between border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 w-8 h-8 items-center justify-center">
          <Text className="text-2xl text-gray-700">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800 flex-1">Banners</Text>
        <TouchableOpacity
          onPress={() => setShowForm((v) => !v)}
          className="bg-green-600 rounded-xl px-3 py-1.5"
        >
          <Text className="text-white font-semibold text-sm">{showForm ? '✕ Cancel' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 border border-gray-100">
          <Text className="text-sm font-bold text-gray-800 mb-3">New Banner</Text>
          <TouchableOpacity
            onPress={pickImage}
            className="border-2 border-dashed border-gray-300 rounded-xl h-32 items-center justify-center mb-3 overflow-hidden"
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: 128 }} contentFit="cover" />
            ) : (
              <View className="items-center">
                <Text className="text-3xl">🖼️</Text>
                <Text className="text-gray-400 text-sm mt-1">Tap to select banner image</Text>
                <Text className="text-gray-300 text-xs">Recommended: 16:7 ratio</Text>
              </View>
            )}
          </TouchableOpacity>
          <Input label="Title" placeholder="e.g. Fresh Deals!" value={title} onChangeText={setTitle} />
          <Input label="Subtitle" placeholder="e.g. Up to 40% off on veggies" value={subtitle} onChangeText={setSubtitle} />
          <Input label="Background Color (hex)" placeholder="#16a34a" value={bgColor} onChangeText={setBgColor} />
          <Button title={saving ? 'Saving...' : 'Create Banner'} onPress={handleCreate} loading={saving} fullWidth />
        </View>
      )}

      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#16a34a" /></View>
      ) : (
        <FlatList
          data={banners}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="py-16 items-center">
              <Text className="text-4xl mb-3">🖼️</Text>
              <Text className="text-gray-500 font-medium">No banners yet</Text>
              <Text className="text-gray-400 text-sm mt-1">Tap "+ Add" to create your first banner</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl overflow-hidden mb-3 border border-gray-100">
              <Image
                source={{ uri: item.image_url }}
                style={{ width: '100%', height: 120 }}
                contentFit="cover"
              />
              <View className="px-4 py-3 flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800" numberOfLines={1}>{item.title ?? 'Untitled'}</Text>
                  {item.subtitle && <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>{item.subtitle}</Text>}
                </View>
                <View className="flex-row items-center gap-3">
                  <Switch
                    value={item.is_active}
                    onValueChange={(v) => toggleMutation.mutate({ id: item.id, is_active: v })}
                    trackColor={{ true: '#16a34a', false: '#e5e7eb' }}
                    thumbColor="#ffffff"
                  />
                  <TouchableOpacity
                    onPress={() => Alert.alert('Delete Banner', 'Remove this banner?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
                    ])}
                  >
                    <Text className="text-red-400 text-lg">🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
