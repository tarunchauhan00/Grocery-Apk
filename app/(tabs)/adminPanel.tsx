import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '../../components/supabase';

const AdminPanel = () => {
  // ---------------------------
  // Category Management (Optional)
  // ---------------------------
  const [catName, setCatName] = useState('');
  const [catImage, setCatImage] = useState('');
  const [catLoading, setCatLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  // ---------------------------
  // Product Upload (Optional)
  // ---------------------------
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [details, setDetails] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  // ---------------------------
  // Coupon Management
  // ---------------------------
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState('');
  const [couponMaxUses, setCouponMaxUses] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);

  // ---------------------------
  // Orders & Analytics (Optional)
  // ---------------------------
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [orderFilter, setOrderFilter] = useState('All');

  useEffect(() => {
    fetchCategories();   // optional
    fetchCoupons();      // main for coupons
    fetchOrders();       // optional
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 1. CATEGORIES (OPTIONAL)
  // ─────────────────────────────────────────────────────────────
  const fetchCategories = async () => {
    setCatLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCategories(data);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setCatLoading(false);
    }
  };

  const createCategory = async () => {
    if (!catName || !catImage) {
      Alert.alert('Error', 'Category name and image are required');
      return;
    }
    setCatLoading(true);
    try {
      const { error } = await supabase
        .from('categories')
        .insert([{ name: catName, image: catImage }]);
      if (error) throw error;

      Alert.alert('Success', 'Category created successfully!');
      setCatName('');
      setCatImage('');
      fetchCategories();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setCatLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 2. PRODUCT UPLOAD (OPTIONAL)
  // ─────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!name || !price || !prodImage || !details) {
      Alert.alert('Error', 'All product fields are required');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category first');
      return;
    }
    setUploadLoading(true);
    try {
      const p = parseFloat(price);
      const d = parseFloat(discount) || 0;
      const finalPrice = Math.round(p * (1 - d / 100));

      const productData = {
        name,
        price: p,
        discount: d,
        final_price: finalPrice,
        category: selectedCategory.name,
        image: prodImage,
        details,
      };

      const { error } = await supabase.from('products').insert([productData]);
      if (error) throw error;

      Alert.alert('Success', 'Product uploaded successfully!');
      setName('');
      setPrice('');
      setDiscount('');
      setProdImage('');
      setDetails('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 3. COUPON MANAGEMENT (IMPORTANT PART)
  // ─────────────────────────────────────────────────────────────
  const fetchCoupons = async () => {
    setCouponLoading(true);
    try {
      const { data, error } = await supabase.from('coupons').select('*');
      if (error) throw error;
      setCoupons(data);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setCouponLoading(false);
    }
  };

  const createCoupon = async () => {
    if (!couponCode || !couponDiscount || !couponMaxUses) {
      Alert.alert('Error', 'Code, discount, and max uses are required');
      return;
    }
    setCouponLoading(true);
    try {
      const { error } = await supabase
        .from('coupons')
        .insert([
          {
            code: couponCode,
            discount: parseFloat(couponDiscount),
            max_uses: parseInt(couponMaxUses),
            uses_count: 0, // start usage count at 0
          },
        ]);
      if (error) throw error;

      Alert.alert('Success', 'Coupon created successfully!');
      setCouponCode('');
      setCouponDiscount('');
      setCouponMaxUses('');
      fetchCoupons();
    } catch (err: any) {
      Alert.alert('Error creating coupon', err.message);
    } finally {
      setCouponLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 4. ORDERS & ANALYTICS (OPTIONAL)
  // ─────────────────────────────────────────────────────────────
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data);

      // Basic analytics
      const totalOrders = data.length;
      const pendingOrders = data.filter((o: any) => o.status?.toLowerCase() === 'pending').length;
      const completedOrders = data.filter((o: any) => o.status?.toLowerCase() === 'completed').length;
      const totalRevenue = data
        .filter((o: any) => o.status?.toLowerCase() === 'completed')
        .reduce((sum: number, o: any) => sum + parseFloat(o.total), 0);

      setAnalytics({
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue,
      });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      if (error) throw error;

      Alert.alert('Success', `Order #${orderId} status updated to ${newStatus}`);
      fetchOrders();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'All') return true;
    return o.status?.toLowerCase() === orderFilter.toLowerCase();
  });

  // RENDER CATEGORIES (OPTIONAL)
  const renderCategoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.adminCategoryItem,
        selectedCategory?.id === item.id && styles.selectedAdminCategory,
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text style={styles.adminCategoryText}>{item.name}</Text>
    </TouchableOpacity>
  );

  // RENDER ORDERS (OPTIONAL)
  const renderOrderItem = ({ item }: { item: any }) => {
    let orderItems = [];
    if (Array.isArray(item.order_items)) {
      orderItems = item.order_items;
    } else if (item.order_items) {
      try {
        orderItems = JSON.parse(item.order_items);
      } catch {}
    }

    return (
      <View style={styles.orderItem}>
        <Text style={styles.orderId}>Order ID: {item.id}</Text>
        <Text style={styles.orderTotal}>Total: ₹{item.total}</Text>
        <Text style={styles.orderStatus}>Status: {item.status}</Text>
        <Text style={styles.orderDate}>
          Date: {new Date(item.created_at).toLocaleString()}
        </Text>

        <Text style={styles.userName}>User: {item.user_name || 'N/A'}</Text>
        <Text style={styles.userMobile}>Mobile: {item.user_mobile || 'N/A'}</Text>
        <Text style={styles.addressText}>
          Address: {item.shipping_address || 'N/A'}
        </Text>

        {orderItems.length > 0 && (
          <View style={styles.itemsContainer}>
            <Text style={styles.itemsHeader}>Items:</Text>
            {orderItems.map((itm: any, idx: number) => (
              <Text key={idx} style={styles.itemDetail}>
                - {itm.name} x {itm.quantity} = ₹{itm.total}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.statusButtonRow}>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => handleUpdateOrderStatus(item.id, 'Pending')}
            disabled={updatingStatus}
          >
            <Text style={styles.statusButtonText}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => handleUpdateOrderStatus(item.id, 'Shipped')}
            disabled={updatingStatus}
          >
            <Text style={styles.statusButtonText}>Shipped</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => handleUpdateOrderStatus(item.id, 'Delivered')}
            disabled={updatingStatus}
          >
            <Text style={styles.statusButtonText}>Delivered</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => handleUpdateOrderStatus(item.id, 'Cancelled')}
            disabled={updatingStatus}
          >
            <Text style={styles.statusButtonText}>Cancelled</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyOrders = () => {
    if (!ordersLoading && filteredOrders.length === 0) {
      return (
        <View style={{ padding: 20 }}>
          <Text>No orders found for "{orderFilter}".</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <ScrollView style={styles.container} nestedScrollEnabled>
      <Text style={styles.title}>Admin Panel</Text>

      {/* ─────────────────────────────────────────────────────────────
          CATEGORY MANAGEMENT (OPTIONAL)
         ───────────────────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Manage Categories</Text>
      <TextInput
        style={styles.input}
        placeholder="Category Name"
        value={catName}
        onChangeText={setCatName}
      />
      <TextInput
        style={styles.input}
        placeholder="Category Image URL"
        value={catImage}
        onChangeText={setCatImage}
      />
      <Button
        title="Create Category"
        onPress={createCategory}
        disabled={catLoading}
      />
      {catLoading && <ActivityIndicator size="large" color="#000" />}

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
        Existing Categories
      </Text>
      {catLoading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : categories.length === 0 ? (
        <Text>No categories found.</Text>
      ) : (
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          style={{ marginBottom: 20 }}
          nestedScrollEnabled
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          PRODUCT UPLOAD (OPTIONAL)
         ───────────────────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>
        Upload Product {selectedCategory ? `in ${selectedCategory.name}` : ''}
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Product Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Price"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Discount (%)"
        value={discount}
        onChangeText={setDiscount}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Product Image URL"
        value={prodImage}
        onChangeText={setProdImage}
      />
      <TextInput
        style={styles.input}
        placeholder="Product Details"
        value={details}
        onChangeText={setDetails}
        multiline
      />
      <Button
        title="Upload Product"
        onPress={handleUpload}
        disabled={uploadLoading}
      />
      {uploadLoading && <ActivityIndicator size="large" color="#000" />}

      {/* ─────────────────────────────────────────────────────────────
          COUPON MANAGEMENT (MAIN)
         ───────────────────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Create Coupon</Text>
      <TextInput
        style={styles.input}
        placeholder="Coupon Code"
        value={couponCode}
        onChangeText={setCouponCode}
      />
      <TextInput
        style={styles.input}
        placeholder="Coupon Discount (%)"
        value={couponDiscount}
        onChangeText={setCouponDiscount}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Max Uses (e.g. 30)"
        value={couponMaxUses}
        onChangeText={setCouponMaxUses}
        keyboardType="numeric"
      />
      <Button
        title="Create Coupon"
        onPress={createCoupon}
        disabled={couponLoading}
      />
      {couponLoading && <ActivityIndicator size="large" color="#000" />}

      {/* Existing Coupons */}
      {coupons.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Existing Coupons</Text>
          {coupons.map((c) => (
            <View key={c.id} style={styles.couponItem}>
              <Text>Code: {c.code}</Text>
              <Text>Discount: {c.discount}%</Text>
              <Text>Max Uses: {c.max_uses}</Text>
              <Text>Uses Count: {c.uses_count}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ─────────────────────────────────────────────────────────────
          ORDER ANALYTICS (OPTIONAL)
         ───────────────────────────────────────────────────────────── */}
      <View style={styles.analyticsContainer}>
        <Text style={styles.sectionTitle}>Order Analytics</Text>
        {ordersLoading ? (
          <ActivityIndicator size="large" color="#000" />
        ) : (
          <View style={styles.analytics}>
            <Text style={styles.analyticsText}>
              Total Orders: {analytics.totalOrders}
            </Text>
            <Text style={styles.analyticsText}>
              Pending Orders: {analytics.pendingOrders}
            </Text>
            <Text style={styles.analyticsText}>
              Completed Orders: {analytics.completedOrders}
            </Text>
            <Text style={styles.analyticsText}>
              Total Revenue: ₹{analytics.totalRevenue}
            </Text>
          </View>
        )}
      </View>

      {/* Orders Filter */}
      <Text style={styles.sectionTitle}>Orders</Text>
      {ordersLoading && <ActivityIndicator size="large" color="#000" />}
      <View style={styles.filterRow}>
        {['All', 'Pending', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              orderFilter === status && styles.activeFilterButton,
            ]}
            onPress={() => setOrderFilter(status)}
          >
            <Text
              style={[
                styles.filterButtonText,
                orderFilter === status && styles.activeFilterButtonText,
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredOrders.length === 0 && !ordersLoading ? (
        <View style={{ padding: 20 }}>
          <Text>No orders found for "{orderFilter}".</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrderItem}
          nestedScrollEnabled
        />
      )}
    </ScrollView>
  );
};

export default AdminPanel;

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    borderRadius: 5,
  },
  analyticsContainer: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#e8e8e8',
    borderRadius: 8,
  },
  analytics: {},
  analyticsText: {
    fontSize: 16,
    marginBottom: 5,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  filterButton: {
    backgroundColor: '#ccc',
    borderRadius: 5,
    marginHorizontal: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeFilterButton: {
    backgroundColor: '#4CAF50',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  adminCategoryItem: {
    backgroundColor: '#eee',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedAdminCategory: {
    backgroundColor: '#4CAF50',
  },
  adminCategoryText: {
    fontSize: 16,
  },
  couponItem: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 6,
    marginVertical: 4,
  },
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
  userName: {
    marginTop: 4,
    fontSize: 14,
    color: '#333',
  },
  userMobile: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  addressText: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  itemsContainer: {
    marginTop: 8,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 6,
  },
  itemsHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemDetail: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    marginTop: 2,
  },
  statusButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statusButton: {
    backgroundColor: '#ddd',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 5,
  },
  statusButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
