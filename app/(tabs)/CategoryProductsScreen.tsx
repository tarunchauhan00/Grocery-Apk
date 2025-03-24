import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../../components/supabase';
import { useCart } from '../../src/context/CartContext';

const CategoryProductsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { addToCart } = useCart();
  const { category } = route.params as { category: string };

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderProductItem = ({ item }: { item: any }) => (
    <View style={styles.productCard}>
      <TouchableOpacity onPress={() => navigation.navigate('ProductDetails', { id: item.id })}>
        <Image source={{ uri: item.image || 'https://via.placeholder.com/150' }} style={styles.productImage} />
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>₹{item.price}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.addToCartButton} onPress={() => addToCart(item)}>
        <Text style={styles.addToCartText}>Add to Cart</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{category} Products</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  list: { alignItems: 'center' },
  productCard: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    margin: 10,
    width: '45%',
  },
  productImage: { width: 100, height: 100, marginBottom: 5, resizeMode: 'cover' },
  productName: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  productPrice: { fontSize: 14, color: 'green', marginBottom: 5 },
  addToCartButton: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 5 },
  addToCartText: { color: '#fff', fontSize: 14 },
});

export default CategoryProductsScreen;
