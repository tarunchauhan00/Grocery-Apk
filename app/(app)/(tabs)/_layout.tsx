import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWishlistStore } from '@/store/wishlistStore';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const ACTIVE = '#16a34a';
const INACTIVE = '#94a3b8';

function TabIcon({
  name,
  focusedName,
  label,
  focused,
}: {
  name: IoniconName;
  focusedName: IoniconName;
  label: string;
  focused: boolean;
}) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 3 }}>
      <Ionicons name={focused ? focusedName : name} size={22} color={focused ? ACTIVE : INACTIVE} />
      <Text
        numberOfLines={1}
        style={{
          fontSize: 10,
          color: focused ? ACTIVE : INACTIVE,
          fontWeight: focused ? '600' : '400',
          letterSpacing: 0.1,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function WishlistIcon({ focused }: { focused: boolean }) {
  const count = useWishlistStore((s) => s.count());
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 3 }}>
      <View>
        <Ionicons name={focused ? 'heart' : 'heart-outline'} size={22} color={focused ? ACTIVE : INACTIVE} />
        {count > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -3,
              right: -5,
              backgroundColor: '#ef4444',
              borderRadius: 7,
              minWidth: 14,
              height: 14,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 2,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 8, fontWeight: '700' }}>{count > 9 ? '9+' : count}</Text>
          </View>
        )}
      </View>
      <Text
        numberOfLines={1}
        style={{
          fontSize: 10,
          color: focused ? ACTIVE : INACTIVE,
          fontWeight: focused ? '600' : '400',
          letterSpacing: 0.1,
        }}
      >
        Saved
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopWidth: 0,
          backgroundColor: '#ffffff',
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.07,
          shadowRadius: 16,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home-outline" focusedName="home" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="search-outline" focusedName="search" label="Search" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="receipt-outline" focusedName="receipt" label="Orders" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          tabBarIcon: ({ focused }) => <WishlistIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person-outline" focusedName="person" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
