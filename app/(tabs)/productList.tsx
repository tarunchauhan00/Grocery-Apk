// /app/productList.tsx
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function ProductList() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Product List Screen</Text>
      <Button title="View Product Details" onPress={() => router.push('/productDetails')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold' },
});
