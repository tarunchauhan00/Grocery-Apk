import { supabase } from '@/lib/supabase';
import type { Order, CartItem, Address, CouponValidation } from '@/types';
import { DELIVERY_FEE, FREE_DELIVERY_ABOVE } from '@/utils/constants';

export const ordersService = {
  async getOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), delivery_slot:delivery_slots(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getOrderById(id: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), delivery_slot:delivery_slots(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async getDeliverySlots() {
    const { data, error } = await supabase
      .from('delivery_slots')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return data ?? [];
  },

  async validateCoupon(code: string, orderValue: number): Promise<CouponValidation> {
    const { data, error } = await supabase.rpc('validate_coupon', {
      p_code: code,
      p_order_value: orderValue,
    });
    if (error) throw error;
    return data;
  },

  async placeOrder(params: {
    userId: string;
    items: CartItem[];
    address: Address;
    deliverySlotId: string | null;
    couponCode: string | null;
    discount: number;
    paymentMethod: 'razorpay' | 'cod';
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  }): Promise<Order> {
    const subtotal = params.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const deliveryFee = subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
    const totalAmount = subtotal + deliveryFee - params.discount;

    const isPaid = params.paymentMethod === 'razorpay' && !!params.razorpayPaymentId;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: params.userId,
        address_snapshot: params.address,
        delivery_slot_id: params.deliverySlotId,
        subtotal,
        delivery_fee: deliveryFee,
        discount: params.discount,
        total_amount: Math.max(0, totalAmount),
        coupon_code: params.couponCode,
        payment_method: params.paymentMethod,
        razorpay_order_id: params.razorpayOrderId ?? null,
        razorpay_payment_id: params.razorpayPaymentId ?? null,
        razorpay_signature: params.razorpaySignature ?? null,
        status: isPaid || params.paymentMethod === 'cod' ? 'confirmed' : 'pending',
        payment_status: isPaid ? 'paid' : 'pending',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = params.items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      product_image: item.product.image_url,
      unit: item.product.unit,
      quantity: item.quantity,
      unit_price: item.product.price,
      total_price: item.product.price * item.quantity,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    if (params.couponCode) {
      await supabase.rpc('increment_coupon_usage', { p_code: params.couponCode });
    }

    return order;
  },

  async confirmPayment(orderId: string, paymentId: string, signature: string) {
    const { error } = await supabase
      .from('orders')
      .update({
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        payment_status: 'paid',
        status: 'confirmed',
      })
      .eq('id', orderId);
    if (error) throw error;
  },

  async cancelOrder(orderId: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);
    if (error) throw error;
  },

  // Admin: update order status
  async updateStatus(orderId: string, status: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    if (error) throw error;
  },
};
