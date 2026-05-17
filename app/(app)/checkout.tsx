import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ordersService } from '@/services/orders.service';
import { addressesService } from '@/services/addresses.service';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatINR } from '@/utils/currency';
import { DELIVERY_FEE, FREE_DELIVERY_ABOVE, RAZORPAY_KEY_ID, SERVER_URL } from '@/utils/constants';
import type { Address, DeliverySlot } from '@/types';

export default function CheckoutScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id ?? '';
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotal = useCartStore((s) => s.subtotal());

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<DeliverySlot | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [loading, setLoading] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const deliveryFee = subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  const total = Math.max(0, subtotal + deliveryFee - couponDiscount);

  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ['addresses', userId],
    queryFn: () => addressesService.getAddresses(userId),
    enabled: !!userId,
  });

  const { data: slots = [] } = useQuery<DeliverySlot[]>({
    queryKey: ['delivery-slots'],
    queryFn: ordersService.getDeliverySlots,
  });

  // TanStack Query v5: no onSuccess on useQuery — use useEffect
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      setSelectedAddress(addresses.find((a) => a.is_default) ?? addresses[0]);
    }
  }, [addresses]);

  useEffect(() => {
    if (slots.length > 0 && !selectedSlot) {
      setSelectedSlot(slots[0]);
    }
  }, [slots]);

  async function validateCoupon() {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponMsg('');
    try {
      const result = await ordersService.validateCoupon(couponCode.trim(), subtotal);
      if (result.valid) {
        setCouponDiscount(result.discount ?? 0);
        setCouponMsg(`✓ ${result.description ?? 'Coupon applied!'} — saved ${formatINR(result.discount ?? 0)}`);
      } else {
        setCouponDiscount(0);
        setCouponMsg(result.message ?? 'Invalid coupon');
      }
    } catch {
      setCouponMsg('Could not validate coupon');
    } finally {
      setValidatingCoupon(false);
    }
  }

  async function handlePlaceOrder() {
    if (!selectedAddress) {
      Alert.alert('No address', 'Please select a delivery address.');
      return;
    }
    if (items.length === 0) return;
    setLoading(true);
    try {
      if (paymentMethod === 'razorpay') {
        await handleRazorpay();
      } else {
        await placeCodOrder();
      }
    } catch (e: any) {
      Alert.alert('Order failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function placeCodOrder() {
    const order = await ordersService.placeOrder({
      userId,
      items,
      address: selectedAddress!,
      deliverySlotId: selectedSlot?.id ?? null,
      couponCode: couponDiscount > 0 ? couponCode : null,
      discount: couponDiscount,
      paymentMethod: 'cod',
    });
    clearCart();
    router.replace(`/(app)/order/${order.id}`);
  }

  async function handleRazorpay() {
    if (Platform.OS === 'web') {
      Alert.alert('Payment', 'Razorpay web checkout coming soon. Please use COD for now.');
      return;
    }
    const RazorpayCheckout = (await import('react-native-razorpay')).default;

    // 1. Create Razorpay order via server (keeps secret key off the device)
    const serverRes = await fetch(`${SERVER_URL}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.round(total * 100), currency: 'INR' }),
    });
    if (!serverRes.ok) throw new Error('Could not create payment order. Is the server running?');
    const rzpOrder = await serverRes.json();

    // 2. Open Razorpay checkout — order is NOT saved to DB yet
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      name: 'SwiftMart',
      description: 'Order Payment',
      order_id: rzpOrder.id,
      prefill: {
        name: selectedAddress!.full_name,
        contact: selectedAddress!.phone,
        email: session?.user.email,
      },
      theme: { color: '#16a34a' },
    };

    let paymentData: any;
    try {
      paymentData = await RazorpayCheckout.open(options);
    } catch (err: any) {
      // Razorpay throws { code, description } on failure/cancel
      const desc: string = err?.description ?? err?.message ?? JSON.stringify(err) ?? 'Unknown error';
      const code: string | number = err?.code ?? '';
      console.log('[Razorpay error]', JSON.stringify(err));
      // code 0 = user manually dismissed the sheet
      if (code === 0 || desc.toLowerCase().includes('cancel')) {
        Alert.alert('Payment cancelled', 'Your order was not placed. Please try again.');
      } else {
        Alert.alert('Payment failed', `${desc}${code ? ` (code ${code})` : ''}`);
      }
      return;
    }

    // 3. Verify signature on server
    const verifyRes = await fetch(`${SERVER_URL}/api/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      }),
    });
    const { verified } = await verifyRes.json();
    if (!verified) throw new Error('Payment verification failed. Please contact support.');

    // 4. Payment verified — save order directly as confirmed/paid in one DB write
    const order = await ordersService.placeOrder({
      userId,
      items,
      address: selectedAddress!,
      deliverySlotId: selectedSlot?.id ?? null,
      couponCode: couponDiscount > 0 ? couponCode : null,
      discount: couponDiscount,
      paymentMethod: 'razorpay',
      razorpayOrderId: rzpOrder.id,
      razorpayPaymentId: paymentData.razorpay_payment_id,
      razorpaySignature: paymentData.razorpay_signature ?? '',
    });
    clearCart();
    router.replace(`/(app)/order/${order.id}`);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-2xl text-gray-700">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800">Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Delivery Address */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-gray-800">📍 Delivery Address</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/address')}>
              <Text className="text-green-600 text-sm font-medium">Change</Text>
            </TouchableOpacity>
          </View>
          {addresses.length === 0 ? (
            <TouchableOpacity
              onPress={() => router.push('/(app)/address/new')}
              className="border-2 border-dashed border-gray-300 rounded-xl p-4 items-center"
            >
              <Text className="text-gray-500 font-medium">+ Add delivery address</Text>
            </TouchableOpacity>
          ) : (
            addresses.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                onPress={() => setSelectedAddress(addr)}
                className={`p-3 rounded-xl border-2 mb-2 ${selectedAddress?.id === addr.id ? 'border-green-500 bg-green-50' : 'border-gray-100'}`}
              >
                <Text className="font-semibold text-gray-800">{addr.label} — {addr.full_name}</Text>
                <Text className="text-gray-500 text-sm mt-0.5">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</Text>
                <Text className="text-gray-500 text-sm">{addr.city}, {addr.state} {addr.pincode}</Text>
                <Text className="text-gray-400 text-xs mt-1">📞 {addr.phone}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Delivery Slot */}
        {slots.length > 0 && (
          <View className="bg-white mx-4 mt-3 rounded-2xl p-4">
            <Text className="text-base font-bold text-gray-800 mb-3">🕐 Delivery Slot</Text>
            <View className="flex-row flex-wrap gap-2">
              {slots.map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  onPress={() => setSelectedSlot(slot)}
                  className={`px-3 py-2 rounded-xl border-2 ${selectedSlot?.id === slot.id ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                >
                  <Text className={`text-sm font-medium ${selectedSlot?.id === slot.id ? 'text-green-700' : 'text-gray-600'}`}>
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Coupon */}
        <View className="bg-white mx-4 mt-3 rounded-2xl p-4">
          <Text className="text-base font-bold text-gray-800 mb-3">🏷️ Coupon Code</Text>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Input
                placeholder="Enter coupon code"
                value={couponCode}
                onChangeText={(t) => { setCouponCode(t.toUpperCase()); setCouponMsg(''); setCouponDiscount(0); }}
                autoCapitalize="characters"
              />
            </View>
            <Button
              title={validatingCoupon ? '...' : 'Apply'}
              onPress={validateCoupon}
              variant="outline"
              size="md"
              disabled={validatingCoupon || !couponCode.trim()}
            />
          </View>
          {couponMsg ? (
            <Text className={`text-sm mt-1 ${couponDiscount > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {couponMsg}
            </Text>
          ) : null}
        </View>

        {/* Payment Method */}
        <View className="bg-white mx-4 mt-3 rounded-2xl p-4">
          <Text className="text-base font-bold text-gray-800 mb-3">💳 Payment Method</Text>
          {(['razorpay', 'cod'] as const).map((method) => (
            <TouchableOpacity
              key={method}
              onPress={() => setPaymentMethod(method)}
              className={`flex-row items-center p-3 rounded-xl border-2 mb-2 ${paymentMethod === method ? 'border-green-500 bg-green-50' : 'border-gray-100'}`}
            >
              <Text className="text-xl mr-3">{method === 'razorpay' ? '💳' : '💵'}</Text>
              <View>
                <Text className="font-semibold text-gray-800">
                  {method === 'razorpay' ? 'Pay Online (Razorpay)' : 'Cash on Delivery'}
                </Text>
                <Text className="text-xs text-gray-400">
                  {method === 'razorpay' ? 'UPI, Cards, Net Banking & more' : 'Pay when you receive'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Summary */}
        <View className="bg-white mx-4 mt-3 rounded-2xl p-4">
          <Text className="text-base font-bold text-gray-800 mb-3">🧾 Order Summary</Text>
          {items.map((item) => (
            <View key={item.product.id} className="flex-row justify-between mb-2">
              <Text className="text-gray-600 flex-1" numberOfLines={1}>{item.product.name} × {item.quantity}</Text>
              <Text className="text-gray-800 font-medium">{formatINR(item.product.price * item.quantity)}</Text>
            </View>
          ))}
          <View className="border-t border-gray-100 mt-2 pt-3">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500">Subtotal</Text>
              <Text className="text-gray-800">{formatINR(subtotal)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500">Delivery</Text>
              {deliveryFee === 0
                ? <Text className="text-green-600 font-medium">FREE</Text>
                : <Text className="text-gray-800">{formatINR(deliveryFee)}</Text>
              }
            </View>
            {couponDiscount > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500">Coupon ({couponCode})</Text>
                <Text className="text-green-600 font-medium">− {formatINR(couponDiscount)}</Text>
              </View>
            )}
            <View className="flex-row justify-between pt-2 border-t border-gray-100">
              <Text className="text-base font-bold text-gray-800">Total</Text>
              <Text className="text-base font-bold text-green-600">{formatINR(total)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4" style={{ elevation: 8 }}>
        <Button
          title={loading ? 'Placing Order...' : `Place Order · ${formatINR(total)}`}
          onPress={handlePlaceOrder}
          loading={loading}
          fullWidth
          size="lg"
          disabled={!selectedAddress || items.length === 0}
        />
      </View>
    </SafeAreaView>
  );
}
