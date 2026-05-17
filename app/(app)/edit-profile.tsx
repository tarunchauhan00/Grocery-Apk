import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { profileService } from '@/services/profile.service';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, session, setProfile } = useAuthStore();
  const userId = session?.user.id ?? '';

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      let avatarUrl = profile?.avatar_url ?? null;
      if (avatarUri) {
        avatarUrl = await profileService.uploadAvatar(userId, avatarUri);
      }
      return profileService.updateProfile(userId, { full_name: fullName, phone, avatar_url: avatarUrl });
    },
    onSuccess: (updated) => {
      setProfile(updated);
      router.back();
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  }

  const displayAvatar = avatarUri ?? profile?.avatar_url;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl text-gray-700">‹</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-800">Edit Profile</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View className="items-center mb-6">
            <TouchableOpacity onPress={pickImage} className="relative">
              {displayAvatar ? (
                <Image source={{ uri: displayAvatar }} style={{ width: 96, height: 96, borderRadius: 48 }} />
              ) : (
                <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center">
                  <Text className="text-4xl">👤</Text>
                </View>
              )}
              <View className="absolute bottom-0 right-0 bg-green-600 rounded-full w-7 h-7 items-center justify-center">
                <Text className="text-white text-xs">✏️</Text>
              </View>
            </TouchableOpacity>
            <Text className="text-sm text-gray-400 mt-2">Tap to change photo</Text>
          </View>

          <Input label="Full Name" placeholder="John Doe" value={fullName} onChangeText={setFullName} />
          <Input label="Phone Number" placeholder="+91 98765 43210" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
            <View className="bg-gray-100 rounded-xl px-3 py-3">
              <Text className="text-gray-500">{session?.user.email}</Text>
            </View>
            <Text className="text-xs text-gray-400 mt-1">Email cannot be changed</Text>
          </View>

          <Button title="Save Changes" onPress={() => mutate()} loading={isPending} fullWidth size="lg" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
