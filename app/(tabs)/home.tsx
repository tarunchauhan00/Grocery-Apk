import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Pressable,
  TextInput,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../components/supabase';
import { useCart } from '../../src/context/CartContext';
import Ionicons from '@expo/vector-icons/Ionicons';

const HomeScreen = () => {
  const navigation = useNavigation();

  // Destructure functions from Cart Context
  const { addToCart, toggleWishlist, isInWishlist } = useCart();

  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');

  // For sidebar animation
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-250)).current;

  // For slider
  const [sliderImages, setSliderImages] = useState<any[]>([]);
  const [sliderIndex, setSliderIndex] = useState(0);
  const screenWidth = Dimensions.get('window').width;

  // Animated value for smooth slide transition
  const animatedSlide = useRef(new Animated.Value(0)).current;

  // Fetch products and slider images on mount
  useEffect(() => {
    fetchProducts();
    fetchSliderImages();
  }, []);

  // Auto-swipe slider every 6 seconds
  useEffect(() => {
    if (sliderImages.length === 0) return;
    const interval = setInterval(() => {
      setSliderIndex(prevIndex =>
        prevIndex === sliderImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 6000);
    return () => clearInterval(interval);
  }, [sliderImages.length]);

  // Animate slide transition whenever sliderIndex changes
  useEffect(() => {
    Animated.timing(animatedSlide, {
      toValue: -sliderIndex * screenWidth,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [sliderIndex, screenWidth, animatedSlide]);

  // Reset filtered list whenever products change
  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  // Toggle the sidebar open/close with animation
  const toggleSidebar = () => {
    if (sidebarVisible) {
      Animated.timing(sidebarAnim, {
        toValue: -250,
        duration: 600,
        useNativeDriver: false,
      }).start(() => setSidebarVisible(false));
    } else {
      setSidebarVisible(true);
      Animated.timing(sidebarAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: false,
      }).start();
    }
  };

  // Fetch products from Supabase
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching products:', error.message);
      } else {
        setProducts(data);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch slider images from Supabase
  const fetchSliderImages = async () => {
    try {
      const { data, error } = await supabase
        .from('slider_images')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Error fetching slider images:', error.message);
      } else {
        setSliderImages(data);
      }
    } catch (err) {
      console.error('Error fetching slider images:', err);
    }
  };

  // Handle search input
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(item =>
        item.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };

  // Compute final price and discount label for a product
  const getFinalPriceAndLabel = (item: any) => {
    const discountPercent = item.discount || 0;
    if (discountPercent > 0) {
      const oldPrice = item.price;
      const finalPrice = Math.round(item.price * (1 - discountPercent / 100));
      return {
        oldPrice,
        finalPrice,
        discountLabel: `${discountPercent}% OFF`,
      };
    } else {
      return {
        oldPrice: null,
        finalPrice: item.price,
        discountLabel: '',
      };
    }
  };

  // Render each product item
  const renderProductItem = ({ item }: { item: any }) => {
    const { oldPrice, finalPrice, discountLabel } = getFinalPriceAndLabel(item);
    const inWish = isInWishlist(item.id);

    return (
      <View style={styles.productCard}>
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/150' }}
          style={styles.productImage}
        />
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.priceContainer}>
          {oldPrice && <Text style={styles.oldPrice}>₹{oldPrice}</Text>}
          <Text style={styles.productPrice}>₹{finalPrice}</Text>
        </View>
        {discountLabel ? (
          <Text style={styles.discountText}>{discountLabel}</Text>
        ) : null}
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => toggleWishlist(item)}>
            <Ionicons
              name={inWish ? 'heart' : 'heart-outline'}
              size={24}
              color="#E53935"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => addToCart(item)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Image Slider Component with Auto-swipe and Smooth Animated Transition (without left/right buttons)
  const ImageSlider = () => {
    return (
      <View style={styles.sliderContainer}>
        <Animated.View
          style={[
            styles.sliderWrapper,
            { transform: [{ translateX: animatedSlide }] },
          ]}
        >
          {sliderImages.map((imageObj, index) => (
            <View
              key={index}
              style={{ width: screenWidth, alignItems: 'center' }}
            >
              <Image
                source={{ uri: imageObj.image_url }}
                style={[styles.sliderImage, { width: screenWidth - 30 }]}
              />
            </View>
          ))}
        </Animated.View>
        <View style={styles.indicatorContainer}>
          {sliderImages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                { opacity: sliderIndex === index ? 1 : 0.3 },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  // List header including banner, search bar, slider, and top offers title
  const renderListHeader = () => (
    <View>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          Our prices are on a diet they just keep dropping!
        </Text>
      </View>
      <View style={styles.searchContainer}>
        <Image
          source={require('@/assets/images/search-icon.png')}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search 'tomato'"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      {/* Auto-swipe Image Slider with Smooth Animation */}
      {sliderImages.length > 0 && <ImageSlider />}
      <View style={styles.topOffersHeader}>
        <Text style={styles.topOffersTitle}>Top Offers</Text>
      </View>
    </View>
  );

  // Render if no products found
  const renderEmptyList = () => {
    if (!loadingProducts && filteredProducts.length === 0 && searchQuery) {
      return (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>
          No results found for "{searchQuery}"
        </Text>
      );
    }
    return null;
  };

  return ( 
    <View style={styles.container}>
      {sidebarVisible && (
        <Pressable style={styles.overlay} onPress={toggleSidebar} />
      )}
      <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
        <View style={styles.sidebarHeader}>
          <Image
            source={require('@/assets/images/react-logo.png')}
            style={styles.sidebarImage}
          />
          <Text style={styles.sidebarTitle}>Welcome, User</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('Home');
            toggleSidebar();
          }}
        >
          <Text style={styles.sidebarButton}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('Categories');
            toggleSidebar();
          }}
        >
          <Text style={styles.sidebarButton}>Categories</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('Cart');
            toggleSidebar();
          }}
        >
          <Text style={styles.sidebarButton}>Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('Orders');
            toggleSidebar();
          }}
        >
          <Text style={styles.sidebarButton}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('Profile');
            toggleSidebar();
          }}
        >
          <Text style={styles.sidebarButton}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleSidebar} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </Animated.View>
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id.toString()}
        renderItem={renderProductItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.productsGrid}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyList}
      />
      {loadingProducts && (
        <ActivityIndicator
          size="large"
          color="#000"
          style={{ position: 'absolute', top: '50%', left: '45%' }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // Overlay for sidebar
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1,
  },
  // Sidebar styling
  sidebar: {
    position: 'absolute',
    top: 0,
    left: -250,
    width: 250,
    height: '100%',
    backgroundColor: '#DCE4F7',
    paddingTop: 50,
    paddingLeft: 20,
    zIndex: 2,
    paddingHorizontal: 15,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sidebarImage: {
    width: 55,
    height: 55,
    borderRadius: 30,
    marginRight: 15,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  sidebarButton: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: '#2196F3',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  closeButton: {
    marginTop: 25,
    backgroundColor: '#F44336',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Banner styling
  banner: {
    backgroundColor: '#FCE4EC',
    paddingVertical: 20,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    borderRadius: 15,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  bannerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D81B60',
    textTransform: 'uppercase',
  },
  // Search container styling
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 8,
    paddingHorizontal: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: '#999',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
    letterSpacing: 0.5,
  },
  // Slider styles
  sliderContainer: {
    height: 200,
    marginBottom: 20,
    marginLeft:-15,
    position: 'relative',
    overflow: 'hidden',
  },
  sliderWrapper: {
    flexDirection: 'row',
  },
  sliderImage: {
    height: 200,
    resizeMode: 'cover',
    borderRadius: 10,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  indicator: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#888',
    marginHorizontal: 4,
  },
  // Top offers header
  topOffersHeader: {
    paddingHorizontal: 15,
  },
  topOffersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#333',
  },
  // Products grid styling
  productsGrid: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  // Product card styling
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 20,
    width: '48%',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
    borderRadius: 8,
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
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 5,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  discountText: {
    marginTop: 4,
    fontSize: 12,
    color: '#E53935',
    fontWeight: 'bold',
  },
  // Action row styling (wishlist and add to cart)
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  addButton: {
    borderRadius: 5,
    borderColor: 'green',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    // elevation: 2,
  },
  addButtonText: {
    color: 'green',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default HomeScreen;
