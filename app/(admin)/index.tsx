import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatINR } from '@/utils/currency';

interface StatCardProps { label: string; value: string | number; emoji: string; bg: string; }

function StatCard({ label, value, emoji, bg }: StatCardProps) {
  return (
    <View className="flex-1 rounded-2xl p-4 mr-3" style={{ backgroundColor: bg }}>
      <Text className="text-2xl mb-2">{emoji}</Text>
      <Text className="text-2xl font-bold text-gray-900">{value}</Text>
      <Text className="text-xs text-gray-500 mt-0.5 font-medium">{label}</Text>
    </View>
  );
}

interface MenuTileProps { emoji: string; label: string; subtitle: string; onPress: () => void; badge?: string; }

function MenuTile({ emoji, label, subtitle, onPress, badge }: MenuTileProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 mb-3 flex-row items-center border border-gray-100"
      style={{ elevation: 1 }}
    >
      <View className="w-11 h-11 rounded-xl bg-gray-50 items-center justify-center mr-3">
        <Text className="text-2xl">{emoji}</Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-gray-900 font-semibold text-sm">{label}</Text>
          {badge && (
            <View className="bg-green-100 px-2 py-0.5 rounded-full">
              <Text className="text-green-700 text-xs font-semibold">{badge}</Text>
            </View>
          )}
        </View>
        <Text className="text-gray-400 text-xs mt-0.5">{subtitle}</Text>
      </View>
      <Text className="text-gray-300 text-xl">›</Text>
    </TouchableOpacity>
  );
}

export default function AdminDashboard() {
  const router = useRouter();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [ordersRes, productsRes, usersRes, revenueRes, todayOrdersRes] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount').eq('payment_status', 'paid'),
        supabase.from('orders').select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 86400000).toISOString()),
      ]);
      const revenue = revenueRes.data?.reduce((s, o) => s + o.total_amount, 0) ?? 0;
      return {
        orders: ordersRes.count ?? 0,
        products: productsRes.count ?? 0,
        users: usersRes.count ?? 0,
        revenue,
        todayOrders: todayOrdersRes.count ?? 0,
      };
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 flex-row items-center justify-between border-b border-gray-100">
        <View>
          <Text className="text-xs text-gray-400 font-medium">SwiftMart</Text>
          <Text className="text-xl font-bold text-gray-900">Admin Dashboard</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(app)/(tabs)')}
          className="bg-gray-100 rounded-xl px-3 py-1.5"
        >
          <Text className="text-gray-600 font-medium text-sm">← App</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Stats */}
        {isLoading ? (
          <View className="h-28 items-center justify-center mb-4">
            <ActivityIndicator color="#16a34a" />
          </View>
        ) : (
          <>
            <View className="flex-row mb-3">
              <StatCard
                label="Total Orders"
                value={stats?.orders ?? 0}
                emoji="📦"
                bg="#eff6ff"
              />
              <StatCard
                label="Today's Orders"
                value={stats?.todayOrders ?? 0}
                emoji="🆕"
                bg="#f0fdf4"
              />
            </View>
            <View className="flex-row mb-6">
              <StatCard
                label="Total Revenue"
                value={formatINR(stats?.revenue ?? 0)}
                emoji="💰"
                bg="#fefce8"
              />
              <StatCard
                label="Active Products"
                value={stats?.products ?? 0}
                emoji="🥦"
                bg="#fdf4ff"
              />
            </View>
          </>
        )}

        <Text className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">Catalogue</Text>
        <MenuTile emoji="🥦" label="Products" subtitle="Add, edit, manage inventory" onPress={() => router.push('/(admin)/products')} />
        <MenuTile emoji="📁" label="Categories" subtitle="Manage product categories" onPress={() => router.push('/(admin)/categories')} />
        <MenuTile emoji="🖼️" label="Banners" subtitle="Manage home screen banners" onPress={() => router.push('/(admin)/banners' as any)} />

        <Text className="text-xs font-bold text-gray-400 mb-3 mt-2 uppercase tracking-widest">Orders & Promotions</Text>
        <MenuTile emoji="📦" label="Orders" subtitle="View and update order status" onPress={() => router.push('/(admin)/orders')} />
        <MenuTile emoji="🏷️" label="Coupons" subtitle="Create and manage discount codes" onPress={() => router.push('/(admin)/coupons' as any)} />
        <MenuTile emoji="🕐" label="Delivery Slots" subtitle="Configure delivery time windows" onPress={() => router.push('/(admin)/slots' as any)} />
      </ScrollView>
    </SafeAreaView>
  );
}
