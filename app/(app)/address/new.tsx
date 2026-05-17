import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addressesService } from '@/services/addresses.service';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const LABELS = ['Home', 'Work', 'Other'];

export default function NewAddressScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id ?? '');
  const queryClient = useQueryClient();

  const [label, setLabel] = useState('Home');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      addressesService.createAddress(userId, {
        label, full_name: fullName, phone, line1, line2: line2 || null,
        city, state, pincode, landmark: landmark || null, is_default: false,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', userId] });
      router.back();
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  function handleSave() {
    if (!fullName || !phone || !line1 || !city || !state || !pincode) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }
    mutate();
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl text-gray-700">‹</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-800">New Address</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          {/* Label selector */}
          <Text className="text-sm font-medium text-gray-700 mb-2">Address Type</Text>
          <View className="flex-row gap-2 mb-4">
            {LABELS.map((l) => (
              <TouchableOpacity
                key={l}
                onPress={() => setLabel(l)}
                className={`px-4 py-2 rounded-xl border-2 ${label === l ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
              >
                <Text className={`font-medium ${label === l ? 'text-green-700' : 'text-gray-600'}`}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="Full Name *" placeholder="John Doe" value={fullName} onChangeText={setFullName} />
          <Input label="Phone Number *" placeholder="+91 98765 43210" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Input label="Address Line 1 *" placeholder="Flat/House No, Building" value={line1} onChangeText={setLine1} />
          <Input label="Address Line 2" placeholder="Street, Colony (optional)" value={line2} onChangeText={setLine2} />
          <Input label="City *" placeholder="Mumbai" value={city} onChangeText={setCity} />
          <Input label="State *" placeholder="Maharashtra" value={state} onChangeText={setState} />
          <Input label="Pincode *" placeholder="400001" value={pincode} onChangeText={setPincode} keyboardType="number-pad" maxLength={6} />
          <Input label="Landmark" placeholder="Near school, park (optional)" value={landmark} onChangeText={setLandmark} />

          <Button title="Save Address" onPress={handleSave} loading={isPending} fullWidth size="lg" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
