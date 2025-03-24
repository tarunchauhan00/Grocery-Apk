import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { CartProvider } from '../../src/context/CartContext'; // Ensure correct path
import { Ionicons } from '@expo/vector-icons';

// Import Screens
import HomeScreen from './home';
import CategoriesScreen from './CategoriesScreen';
import CartScreen from './CartScreen';
import OrdersScreen from './OrdersScreen';
import ProfileScreen from './ProfileScreen';
import ProductDetailsScreen from './productDetails';
import AdminPanelScreen from './adminPanel';
import LoginScreen from './login';
import Explore from './explore';
import CategoryProductsScreen from './CategoryProductsScreen';
import WishlistScreen from './WishlistScreen';
import { supabase } from '../../components/supabase';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Bottom Tab Navigator for main screens
function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Hide headers for tabs
        tabBarStyle: { backgroundColor: '#fff', height: 60 },
        tabBarActiveTintColor: '#037a01',
        tabBarInactiveTintColor: '#888',
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home-outline';
          else if (route.name === 'Categories') iconName = 'list-outline';
          else if (route.name === 'Cart') iconName = 'cart-outline';
          else if (route.name === 'Orders') iconName = 'receipt-outline';
          else if (route.name === 'Profile') iconName = 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Main Stack Navigator with session check
export default function Layout() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    // Listen to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  if (loading) {
    return null; // Optionally, display a loading indicator here
  }

  return (
    <CartProvider>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {session ? (
            <>
              <Stack.Screen name="Main" component={BottomTabs} />
              <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
              <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />
              <Stack.Screen name="Explore" component={Explore} />
              <Stack.Screen name="Categories" component={CategoriesScreen} />
              <Stack.Screen name="Orders" component={OrdersScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
              <Stack.Screen name="Wishlist" component={WishlistScreen} />
            </>
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
    </CartProvider>
  );
}
