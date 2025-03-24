import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Linking,
  Pressable,
  ImageBackground,
} from 'react-native';
import { supabase } from '../../components/supabase';

const CartScreen = () => {
  // Local state for cart items fetched from Supabase (table: cart_items)
  const [userCart, setUserCart] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Other state variables
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch cart items for the logged-in user from Supabase (cart_items table)
  const fetchCartItems = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'No user logged in. Please log in again.');
        setIsLoading(false);
        return;
      }

      const { data: cartData, error: cartError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id);

      if (cartError) {
        Alert.alert('Error', cartError.message);
        setIsLoading(false);
        return;
      }
      setUserCart(cartData || []);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch cart items when the component mounts
  useEffect(() => {
    fetchCartItems();
  }, []);

  // Remove a cart item both from Supabase and from local state
  const removeCartItem = async (itemId) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);
      if (error) {
        Alert.alert('Error', 'Failed to remove item: ' + error.message);
      } else {
        // Update the local state to remove the item
        setUserCart((prevCart) =>
          prevCart.filter((item) => item.id !== itemId)
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Calculate total using final_price if available
  const total = userCart.reduce((sum, item) => {
    const priceToUse = item.final_price || item.price;
    return sum + priceToUse * item.quantity;
  }, 0);

  // Apply coupon discount
  const discountedTotal = total * (1 - couponDiscount / 100);

  // Render each cart item
  const renderCartItem = ({ item }) => {
    const priceToUse = item.final_price || item.price;
    return (
      <View style={styles.cartItem}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>
          ₹{priceToUse} x {item.quantity} = ₹{priceToUse * item.quantity}
        </Text>
        <TouchableOpacity onPress={() => removeCartItem(item.id)}>
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Fetch user profile (used for payment/order placement)
  const fetchUserProfile = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'No user logged in. Please log in again.');
        return null;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, mobile, address')
        .eq('user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (err) {
      Alert.alert('Error', err.message);
      return null;
    }
  };

  // Apply coupon code
  const applyCoupon = async () => {
    if (!couponCode) {
      Alert.alert('Error', 'Please enter a coupon code.');
      return;
    }

    const { data, error } = await supabase
      .from('coupons')
      .select('id, discount, used_by, max_uses, uses_count')
      .eq('code', couponCode)
      .single();

    if (error || !data) {
      Alert.alert('Invalid Coupon', 'No coupon found with that code.');
      return;
    }

    const userId = (await supabase.auth.getUser()).data.user.id;
    if (data.used_by && data.used_by.includes(userId)) {
      Alert.alert('Coupon Already Used', 'You have already used this coupon.');
      return;
    }
    if (data.uses_count >= data.max_uses) {
      Alert.alert(
        'Coupon Limit Reached',
        'This coupon has reached its maximum usage limit.'
      );
      return;
    }

    setCouponDiscount(data.discount);
    Alert.alert('Coupon Applied', `You have received ${data.discount}% off!`);

    try {
      const { error: updateError } = await supabase
        .from('coupons')
        .update({
          uses_count: data.uses_count + 1,
          used_by: [...(data.used_by || []), userId],
        })
        .eq('id', data.id);

      if (updateError) {
        console.error('Error updating coupon usage:', updateError.message);
      }
    } catch (err) {
      console.error('Error applying coupon:', err.message);
    }
  };

  // Handle Cash on Delivery
  const handleCashOnDelivery = async () => {
    setIsProcessing(true);
    setShowPaymentModal(false);

    const userProfile = await fetchUserProfile();
    if (!userProfile) {
      setIsProcessing(false);
      return;
    }

    if (!userProfile.address) {
      Alert.alert(
        'No Address Found',
        'Please update your address in Profile before placing an order.'
      );
      setIsProcessing(false);
      return;
    }

    Alert.alert(
      'Confirm Delivery Address',
      `We will deliver to:\n\n${userProfile.address}\n\nPress "OK" to place your order with Cash on Delivery.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setIsProcessing(false) },
        {
          text: 'OK',
          onPress: async () => {
            await placeOrder(userProfile, 'COD');
            setIsProcessing(false);
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Handle UPI Payment
  const proceedWithPayment = async () => {
    setIsProcessing(true);
    setShowPaymentModal(false);

    const userProfile = await fetchUserProfile();
    if (!userProfile) {
      setIsProcessing(false);
      return;
    }

    if (!userProfile.address) {
      Alert.alert(
        'No Address Found',
        'Please update your address in Profile before placing an order.'
      );
      setIsProcessing(false);
      return;
    }

    Alert.alert(
      'Confirm Delivery Address',
      `We will deliver to:\n\n${userProfile.address}\n\nPress "OK" to proceed.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setIsProcessing(false) },
        { text: 'OK', onPress: () => initiateUpiPayment(userProfile) },
      ],
      { cancelable: false }
    );
  };

  // Initiate UPI Payment using a direct upi:// URL
  const initiateUpiPayment = async (userProfile) => {
    const upiUrl = `upi://pay?pa=9756571182@ybl&pn=YourMerchantName&mc=1234&tid=${Date.now()}&tr=${Date.now()}&tn=Deliver%20to%20${encodeURIComponent(
      userProfile.address
    )}&am=${discountedTotal}&cu=INR`;

    try {
      const supported = await Linking.canOpenURL(upiUrl);
      if (!supported) {
        Alert.alert(
          'Error',
          'No UPI payment app found. Please install Google Pay, PhonePe, or Paytm.'
        );
        return;
      }
      await Linking.openURL(upiUrl);
      Alert.alert(
        'Payment Initiated',
        'Please complete the payment in your UPI app. Once done, confirm to place your order.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Payment Completed',
            onPress: async () => {
              await placeOrder(userProfile, 'UPI');
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('UPI Payment Error:', error);
      Alert.alert('Error', 'An error occurred while initiating UPI payment.');
    }
  };

  // Place the order
  const placeOrder = async (userProfile, paymentMethod) => {
    try {
      const orderItems = userCart.map((item) => {
        const priceToUse = item.final_price || item.price;
        return {
          id: item.id,
          name: item.name,
          price: priceToUse,
          quantity: item.quantity,
          total: priceToUse * item.quantity,
        };
      });

      const orderData = {
        user_id: userProfile.user_id,
        user_name: userProfile.username,
        user_mobile: userProfile.mobile,
        shipping_address: userProfile.address,
        order_items: orderItems,
        total: discountedTotal,
        status: 'Pending',
        payment_method: paymentMethod,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('orders').insert([orderData]);

      if (error) {
        console.error('Error placing order:', error.message);
        Alert.alert('Error', 'An error occurred while placing your order.');
      } else {
        Alert.alert('Order Placed', 'Your order has been placed successfully!');
        // Optionally, clear the cart in Supabase after placing the order
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', userProfile.user_id);
        setUserCart([]);
      }
    } catch (err) {
      console.error('Error placing order:', err);
      Alert.alert('Error', 'An error occurred while placing your order.');
    }
  };

  // Handle Checkout
  const handleCheckout = () => {
    if (userCart.length === 0) {
      Alert.alert('Cart is empty', 'Add items before checking out.');
      return;
    }
    setShowPaymentModal(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Cart</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color="#2E7D32" />
      ) : userCart.length === 0 ? (
        <Text>Your cart is empty</Text>
      ) : (
        <>
          <FlatList
            data={userCart}
            renderItem={renderCartItem}
            keyExtractor={(item) => `${item.id}-${item.quantity}`}
          />
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Total: ₹{total}</Text>
            {couponDiscount > 0 && (
              <Text style={styles.discountText}>
                Discount Applied: {couponDiscount}%
              </Text>
            )}
            <Text style={styles.totalText}>Final Total: ₹{discountedTotal}</Text>
          </View>
          {/* Coupon Code Input */}
          <View style={styles.couponContainer}>
            <TextInput
              style={styles.couponInput}
              placeholder="Enter coupon code"
              value={couponCode}
              onChangeText={setCouponCode}
            />
            <TouchableOpacity style={styles.couponButton} onPress={applyCoupon}>
              <Text style={styles.couponButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {/* Checkout Button */}
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.checkoutText}>Checkout</Text>
            )}
          </TouchableOpacity>
        </>
      )}
      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ImageBackground
            source={require('@/assets/images/splash-icon.png')}
            style={styles.modalContainer}
            imageStyle={{ opacity: 0.4 }}
          >
            <Text style={styles.modalTitle}>Choose Payment Method</Text>
            <Text style={styles.modalSubtitle}>Total: ₹{discountedTotal}</Text>
            <TouchableOpacity
              style={[styles.paymentButton, { backgroundColor: '#ffa726' }]}
              onPress={handleCashOnDelivery}
              disabled={isProcessing}
            >
              <Text style={styles.paymentButtonText}>Cash on Delivery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentButton, { backgroundColor: '#009688' }]}
              onPress={proceedWithPayment}
              disabled={isProcessing}
            >
              <Text style={styles.paymentButtonText}>UPI Payment</Text>
            </TouchableOpacity>
            <Pressable
              style={styles.closeModalButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={styles.closeModalText}>Cancel</Text>
            </Pressable>
          </ImageBackground>
        </View>
      </Modal>
    </View>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2E7D32',
    paddingTop: 30,
  },
  cartItem: {
    padding: 12,
    backgroundColor: '#f1f8e9',
    marginVertical: 8,
    borderRadius: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#33691E',
  },
  productPrice: {
    fontSize: 16,
    color: '#558B2F',
    marginTop: 4,
  },
  removeText: {
    color: '#d32f2f',
    fontSize: 14,
    marginTop: 4,
  },
  totalContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  totalText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  discountText: {
    fontSize: 16,
    color: '#FF5722',
  },
  couponContainer: {
    flexDirection: 'row',
    marginVertical: 10,
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    padding: 12,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
  },
  couponButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    marginLeft: 10,
    borderRadius: 8,
  },
  couponButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: '#388E3C',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  checkoutText: {
    color: '#fff',
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    minHeight: '40%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 18,
    color: '#2E7D32',
    marginBottom: 20,
  },
  paymentButton: {
    width: '80%',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
  },
  paymentButtonText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  closeModalButton: {
    marginTop: 20,
    borderRadius: 8,
    backgroundColor: '#c62828',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  closeModalText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
