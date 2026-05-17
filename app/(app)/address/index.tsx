import { FlatList, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressesService } from '@/services/addresses.service';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Address } from '@/types';

function AddressCard({ address, onSetDefault, onDelete }: {
  address: Address;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  return (
    <View className={`bg-white rounded-2xl p-4 mx-4 mb-3 border-2 ${address.is_default ? 'border-green-500' : 'border-gray-100'}`}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-gray-800 font-semibold">{address.label}</Text>
            {address.is_default && (
              <View className="bg-green-100 rounded-full px-2 py-0.5">
                <Text className="text-green-700 text-xs font-semibold">Default</Text>
              </View>
            )}
          </View>
          <Text className="text-gray-700 font-medium">{address.full_name}</Text>
          <Text className="text-gray-500 text-sm">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</Text>
          <Text className="text-gray-500 text-sm">{address.city}, {address.state} {address.pincode}</Text>
          <Text className="text-gray-400 text-xs mt-1">📞 {address.phone}</Text>
        </View>
        <TouchableOpacity onPress={onDelete} className="ml-2">
          <Text className="text-red-400 text-lg">🗑</Text>
        </TouchableOpacity>
      </View>
      {!address.is_default && (
        <TouchableOpacity onPress={onSetDefault} className="mt-3 border border-green-500 rounded-xl py-2 items-center">
          <Text className="text-green-600 font-medium text-sm">Set as Default</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function AddressListScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id ?? '');
  const queryClient = useQueryClient();

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses', userId],
    queryFn: () => addressesService.getAddresses(userId),
    enabled: !!userId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => addressesService.deleteAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses', userId] }),
  });

  const defaultMutation = useMutation({
    mutationFn: (id: string) => addressesService.setDefault(id, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses', userId] }),
  });

  function confirmDelete(id: string) {
    Alert.alert('Delete Address', 'Remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-2xl text-gray-700">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800 flex-1">My Addresses</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/address/new')}>
          <Text className="text-green-600 font-semibold">+ Add</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#16a34a" />
        </View>
      ) : addresses.length === 0 ? (
        <EmptyState
          title="No addresses saved"
          subtitle="Add a delivery address to get started"
          actionLabel="Add Address"
          onAction={() => router.push('/(app)/address/new')}
        />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <AddressCard
              address={item}
              onSetDefault={() => defaultMutation.mutate(item.id)}
              onDelete={() => confirmDelete(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
