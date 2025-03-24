import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native'; // FIX: use react-navigation's useRoute for params
import { supabase } from '../../components/supabase';

const ProductDetails = () => {
  const route = useRoute(); // FIX: useRoute to get route params
  const { id } = route.params; // Access id from params
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching product details:', error.message);
      } else {
        setProduct(data);
      }
      setLoading(false);
    };

    fetchProductDetails();
  }, [id]);

  if (loading) {
    return <ActivityIndicator size="large" color="#000" style={styles.loader} />;
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.image || 'https://via.placeholder.com/300' }} style={styles.image} />
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>₹{product.price}</Text>
      <Text style={styles.category}>Category: {product.category}</Text>
      <Text style={styles.details}>{product.details}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
    borderRadius: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  price: {
    fontSize: 18,
    color: 'green',
    marginBottom: 5,
  },
  category: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  details: {
    fontSize: 16,
    color: '#333',
    marginTop: 10,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
  },
});

export default ProductDetails;
