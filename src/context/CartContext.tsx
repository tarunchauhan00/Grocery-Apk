// CartContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../../components/supabase';

interface Product {
  id: number;
  name: string;
  price: number;
  final_price?: number;
  // etc...
}

interface CartItem extends Product {
  quantity: number;
}

interface CartContextValue {
  // Cart
  cart: CartItem[];
  addToCart: (item: Product) => Promise<void>;
  removeFromCart: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;

  // Wishlist
  wishlist: Product[];
  toggleWishlist: (item: Product) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);

  // ─────────────────────────────────────────────────────────────
  // CART LOGIC
  // ─────────────────────────────────────────────────────────────
  const addToCart = async (item: Product) => {
    // Update local state
    setCart((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });

    // Update Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.warn('User not logged in');
      return;
    }

    // Check if the item already exists in Supabase
    const { data: existingCartItems, error: fetchError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', item.id);

    if (fetchError) {
      console.error('Error fetching cart item:', fetchError.message);
      return;
    }

    if (existingCartItems && existingCartItems.length > 0) {
      // Update quantity if exists
      const currentQuantity = existingCartItems[0].quantity;
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: currentQuantity + 1 })
        .eq('user_id', user.id)
        .eq('product_id', item.id);
      if (updateError) {
        console.error('Error updating cart item:', updateError.message);
      }
    } else {
      // Insert new cart item
      const { error: insertError } = await supabase.from('cart_items').insert([
        {
          user_id: user.id,
          product_id: item.id,
          name: item.name,
          quantity: 1,
          price: item.price,
          final_price: item.final_price ? item.final_price : item.price,
        },
      ]);
      if (insertError) {
        console.error('Error inserting cart item:', insertError.message);
      }
    }
  };

  const removeFromCart = async (id: number) => {
    // Update local state
    setCart((prev) => prev.filter((item) => item.id !== id));

    // Update Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.warn('User not logged in');
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .match({ user_id: user.id, product_id: id });
    if (error) {
      console.error('Error removing cart item:', error.message);
    }
  };

  const clearCart = async () => {
    // Update local state
    setCart([]);

    // Update Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.warn('User not logged in');
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .match({ user_id: user.id });
    if (error) {
      console.error('Error clearing cart:', error.message);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // WISHLIST LOGIC
  // ─────────────────────────────────────────────────────────────
  const isInWishlist = (productId: number) => {
    return wishlist.some((p) => p.id === productId);
  };

  const toggleWishlist = async (product: Product) => {
    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in first');
        return;
      }

      const inWish = isInWishlist(product.id);
      if (inWish) {
        // Remove from Supabase
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);
        if (error) {
          console.error('Error removing wishlist item:', error.message);
          return;
        }
        // Remove from local state
        setWishlist((prev) => prev.filter((p) => p.id !== product.id));
      } else {
        // Add to Supabase
        const { error } = await supabase
          .from('wishlist')
          .insert([{ user_id: user.id, product_id: product.id }]);
        if (error) {
          console.error('Error adding wishlist item:', error.message);
          return;
        }
        // Add to local state
        setWishlist((prev) => [...prev, product]);
      }
    } catch (err) {
      console.error('toggleWishlist error:', err);
    }
  };

  const removeFromWishlist = async (productId: number) => {
    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in first');
        return;
      }

      // Remove from Supabase
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      if (error) {
        console.error('Error removing wishlist item:', error.message);
        return;
      }

      // Remove from local state
      setWishlist((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      console.error('removeFromWishlist error:', err);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        wishlist,
        toggleWishlist,
        removeFromWishlist,
        isInWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
