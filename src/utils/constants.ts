export const DELIVERY_FEE = 30;
export const FREE_DELIVERY_ABOVE = 299;
export const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? '';

// Your local dev machine's LAN IP (e.g. 192.168.1.5) so the phone/emulator can reach the server.
// For production, replace with your deployed server URL.
export const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://localhost:3000';

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending:          'Order Placed',
  confirmed:        'Confirmed',
  preparing:        'Being Prepared',
  out_for_delivery: 'Out for Delivery',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
};

export const ORDER_STATUS_COLOR: Record<string, string> = {
  pending:          '#f59e0b',
  confirmed:        '#3b82f6',
  preparing:        '#8b5cf6',
  out_for_delivery: '#f97316',
  delivered:        '#22c55e',
  cancelled:        '#ef4444',
};
