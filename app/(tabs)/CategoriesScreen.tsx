import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../components/supabase';
import { useCart } from '../../src/context/CartContext';
import Ionicons from '@expo/vector-icons/Ionicons'; // <-- for heart icon

const CategoriesScreen = () => {
  const navigation = useNavigation();
  // Destructure the needed methods from useCart
  const { addToCart, toggleWishlist, isInWishlist } = useCart();

  // Categories from `categories` table
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

  // Currently selected category
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  // Products for the selected category
  const [categoryItems, setCategoryItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Whenever selectedCategory changes, fetch products
  useEffect(() => {
    if (selectedCategory) {
      fetchCategoryItems(selectedCategory.name);
    }
  }, [selectedCategory]);

  // 1. Fetch all categories from the `categories` table
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, image')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // 2. Fetch products for the selected category name
  const fetchCategoryItems = async (categoryName: string) => {
    setLoadingItems(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', categoryName)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCategoryItems(data);
    } catch (err) {
      console.error('Error fetching category items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  // Left pane: Render each category
  const renderCategory = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.leftCategoryButton,
        selectedCategory?.id === item.id && styles.selectedCategoryButton,
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/60' }}
        style={styles.categoryIcon}
      />
      <Text
        style={[
          styles.leftCategoryText,
          selectedCategory?.id === item.id && styles.selectedCategoryText,
        ]}
        numberOfLines={2}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Right pane: Render each product in a 2-column grid
  const renderItem = ({ item }: { item: any }) => {
    // If your DB has final_price or discount, handle it
    const discountPrice = item.final_price || item.price;
    const discount = item.discount ? item.price - discountPrice : 0;

    // Check if product is in wishlist (to fill or unfill heart)
    const inWishlist = isInWishlist(item.id);

    return (
      <View style={styles.productCard}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ProductDetails', { id: item.id })}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: item.image || 'https://via.placeholder.com/150' }}
            style={styles.productImage}
          />
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          {/* Show the discount price and old price */}
          <View style={styles.priceContainer}>
            {discount > 0 && <Text style={styles.oldPrice}>₹{item.price}</Text>}
            <Text style={styles.productPrice}>₹{discountPrice}</Text>
          </View>
          {discount > 0 && <Text style={styles.discountText}>₹{discount} OFF</Text>}
        </TouchableOpacity>

        {/* Action Row: Heart icon + "Add to Cart" */}
        <View style={styles.actionRow}>
          {/* Heart icon => toggles wishlist in Supabase */}
          <TouchableOpacity onPress={() => toggleWishlist(item)}>
            <Ionicons
              name={inWishlist ? 'heart' : 'heart-outline'}
              size={24}
              color="#E53935"
            />
          </TouchableOpacity>

          {/* Add to Cart Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => addToCart(item)}
          >
            <Text style={styles.addButtonText}>+ ADD</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loadingCategories) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.headerTitle}>Categories</Text>

      <View style={styles.splitContainer}>
        {/* Left Pane: Categories List */}
        <View style={styles.leftPane}>
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id.toString()}
          />
        </View>

        {/* Right Pane: Products for Selected Category */}
        <View style={styles.rightPane}>
          {/* Category Heading */}
          {selectedCategory && (
            <Text style={styles.selectedCategoryHeading}>
              {selectedCategory.name}
            </Text>
          )}

          {!selectedCategory ? (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>
                Select a category on the left
              </Text>
            </View>
          ) : loadingItems ? (
            <ActivityIndicator size="large" color="#000" />
          ) : categoryItems.length === 0 ? (
            <Text style={styles.placeholderText}>
              No items found for {selectedCategory.name}.
            </Text>
          ) : (
            <FlatList
              data={categoryItems}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={styles.rowWrapper}
              contentContainerStyle={styles.rightPaneContent}
            />
          )}
        </View>
      </View>
    </View>
  );
};

export default CategoriesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 16,
    textAlign: 'center',
    paddingTop:30,

  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  // Left Pane
  leftPane: {
    width: '25%',
    backgroundColor: '#f3f3f3',
    paddingVertical: 10,
  },
  leftCategoryButton: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    resizeMode: 'cover',
    marginBottom: 5,
    borderRadius: 8,
  },
  leftCategoryText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    flexShrink: 1,
  },
  selectedCategoryButton: {
    backgroundColor: '#fff',
  },
  selectedCategoryText: {
    color: '#d9534f',
    fontWeight: 'bold',
  },
  // Right Pane
  rightPane: {
    width: '75%',
    padding: 10,
  },
  selectedCategoryHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
    textAlign: 'center',
  },
  rowWrapper: {
    justifyContent: 'space-between',
  },
  rightPaneContent: {
    paddingBottom: 20,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  // Product Card
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '48%',
    marginBottom: 15,
    padding: 10,
    // Shadow on iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    // Shadow on Android
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 100,
    borderRadius: 5,
    resizeMode: 'cover',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    color: '#333',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  oldPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 5,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  discountText: {
    fontSize: 12,
    color: '#d9534f',
    fontWeight: 'bold',
  },
  // Action row for heart + add
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  addButton: {
    // backgroundColor: '#4CAF50',
    borderRadius: 5,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderColor:'green',
    borderWidth:1,
    
  },
  addButtonText: {
    color: 'green',
    fontSize: 14,
    fontWeight: '600',
  },
});
