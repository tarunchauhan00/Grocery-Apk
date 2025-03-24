// OrdersScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '../../components/supabase';
import { useCart } from '../../src/context/CartContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const OrdersScreen = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { wishlist, removeFromWishlist, addToCart } = useCart();
  const navigation = useNavigation();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('No user logged in or error fetching user:', userError);
        setOrders([]);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error.message);
      } else {
        setOrders(data);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // RENDER ORDER ITEM
  const renderOrderItem = ({ item }: { item: any }) => (
    <View style={styles.orderItem}>
      <Text style={styles.orderId}>Order ID: {item.id}</Text>
      <Text style={styles.orderTotal}>Total: ₹{item.total}</Text>
      <Text style={styles.orderStatus}>Status: {item.status}</Text>
      <Text style={styles.orderDate}>
        Date: {new Date(item.created_at).toLocaleString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER with Wishlist Icon */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Wishlist')}>
          <Ionicons name="heart" size={24} color="red" />
        </TouchableOpacity>
      </View>

      {/* ORDERS SECTION */}
      {orders.length === 0 ? (
        <Text style={styles.text}>No orders found.</Text>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

export default OrdersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop:30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },

  // ORDER STYLES
  orderItem: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    marginVertical: 8,
    borderRadius: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderTotal: {
    fontSize: 16,
    marginTop: 4,
  },
  orderStatus: {
    fontSize: 14,
    color: 'green',
    marginTop: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
});
