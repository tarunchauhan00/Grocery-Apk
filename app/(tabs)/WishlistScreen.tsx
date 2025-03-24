// WishlistScreen.tsx
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useCart } from '../../src/context/CartContext';

const WishlistScreen = () => {
  const { wishlist, removeFromWishlist, addToCart } = useCart();

  const renderWishlistItem = ({ item }: { item: any }) => (
    <View style={styles.wishlistItem}>
      <Text style={styles.wishlistName}>{item.name}</Text>
      <View style={styles.wishlistActions}>
        {/* Remove from wishlist */}
        <TouchableOpacity onPress={() => removeFromWishlist(item.id)}>
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>

        {/* Move to cart */}
        <TouchableOpacity
          style={styles.moveToCartButton}
          onPress={() => {
            addToCart(item);
            removeFromWishlist(item.id);
          }}
        >
          <Text style={styles.moveToCartText}>Move to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Wishlist</Text>
      {wishlist.length === 0 ? (
        <Text style={styles.text}>No items in wishlist.</Text>
      ) : (
        <FlatList
          data={wishlist}
          renderItem={renderWishlistItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

export default WishlistScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  wishlistItem: {
    padding: 12,
    backgroundColor: '#fff9c4',
    marginVertical: 8,
    borderRadius: 8,
  },
  wishlistName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  wishlistActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  removeText: {
    color: '#d32f2f',
    fontSize: 14,
    marginRight: 15,
  },
  moveToCartButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    padding: 8,
  },
  moveToCartText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
