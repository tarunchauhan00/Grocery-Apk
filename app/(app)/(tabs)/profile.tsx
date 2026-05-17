import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { authService } from '@/services/auth.service';

interface MenuRowProps {
  emoji: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
  value?: string;
}

function MenuRow({ emoji, label, onPress, danger, value }: MenuRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center px-4 py-4 border-b border-gray-50"
    >
      <Text className="text-xl mr-3">{emoji}</Text>
      <Text className={`flex-1 text-sm font-medium ${danger ? 'text-red-500' : 'text-gray-700'}`}>
        {label}
      </Text>
      {value && <Text className="text-gray-400 text-sm mr-2">{value}</Text>}
      <Text className="text-gray-200 text-lg">›</Text>
    </TouchableOpacity>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 items-center py-3">
      <Text className="text-xl font-bold text-gray-900">{value}</Text>
      <Text className="text-xs text-gray-400 mt-0.5 font-medium">{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, session } = useAuthStore();
  const orderCount = 0; // could query orders count
  const wishlistCount = useWishlistStore((s) => s.count());
  const cartCount = useCartStore((s) => s.itemCount());

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => authService.signOut(),
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar & name */}
        <View className="bg-white items-center pt-8 pb-5 mb-2">
          <TouchableOpacity onPress={() => router.push('/(app)/edit-profile')}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={{ width: 88, height: 88, borderRadius: 44 }}
                contentFit="cover"
              />
            ) : (
              <View className="w-22 h-22 rounded-full bg-green-100 items-center justify-center" style={{ width: 88, height: 88 }}>
                <Text className="text-4xl">👤</Text>
              </View>
            )}
            <View className="absolute bottom-0 right-0 bg-green-600 rounded-full w-7 h-7 items-center justify-center border-2 border-white">
              <Text className="text-white text-xs">✏️</Text>
            </View>
          </TouchableOpacity>

          <Text className="text-lg font-bold text-gray-900 mt-3">
            {profile?.full_name ?? 'Shopper'}
          </Text>
          <Text className="text-gray-400 text-sm mt-0.5">{session?.user.email}</Text>
          {profile?.phone && (
            <Text className="text-gray-400 text-xs mt-0.5">{profile.phone}</Text>
          )}

          {/* Stats row */}
          <View className="flex-row w-full mt-5 mx-4 border-t border-gray-100 pt-2">
            <StatPill label="Orders" value={orderCount} />
            <View className="w-px bg-gray-100" />
            <StatPill label="Wishlist" value={wishlistCount} />
            <View className="w-px bg-gray-100" />
            <StatPill label="In Cart" value={cartCount} />
          </View>
        </View>

        {/* Account */}
        <View className="bg-white mb-2 rounded-2xl mx-4 overflow-hidden border border-gray-100">
          <Text className="text-xs font-bold text-gray-400 px-4 pt-3 pb-1 uppercase tracking-widest">Account</Text>
          <MenuRow emoji="✏️" label="Edit Profile" onPress={() => router.push('/(app)/edit-profile')} />
          <MenuRow emoji="📍" label="My Addresses" onPress={() => router.push('/(app)/address')} />
          <MenuRow emoji="📦" label="My Orders" onPress={() => router.push('/(app)/(tabs)/orders')} />
          <MenuRow emoji="♡" label="Wishlist" value={wishlistCount > 0 ? `${wishlistCount} items` : ''} onPress={() => router.push('/(app)/(tabs)/wishlist' as any)} />
        </View>

        {profile?.is_admin && (
          <View className="bg-white mb-2 rounded-2xl mx-4 overflow-hidden border border-amber-100">
            <Text className="text-xs font-bold text-amber-500 px-4 pt-3 pb-1 uppercase tracking-widest">Admin</Text>
            <MenuRow emoji="⚙️" label="Admin Panel" onPress={() => router.push('/(admin)')} />
          </View>
        )}

        {/* Support */}
        <View className="bg-white mb-2 rounded-2xl mx-4 overflow-hidden border border-gray-100">
          <Text className="text-xs font-bold text-gray-400 px-4 pt-3 pb-1 uppercase tracking-widest">Support</Text>
          <MenuRow emoji="📞" label="Contact Support" onPress={() => {}} />
          <MenuRow emoji="🔒" label="Privacy Policy" onPress={() => {}} />
          <MenuRow emoji="📋" label="Terms of Service" onPress={() => {}} />
        </View>

        {/* Sign out */}
        <View className="bg-white mb-8 rounded-2xl mx-4 overflow-hidden border border-gray-100">
          <MenuRow emoji="🚪" label="Sign Out" onPress={handleSignOut} danger />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
