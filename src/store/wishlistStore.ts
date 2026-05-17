import { create } from 'zustand';
import type { Product } from '@/types';

interface WishlistState {
  items: Product[];
  toggle: (product: Product) => void;
  isWishlisted: (id: string) => boolean;
  count: () => number;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  toggle: (product) => {
    const exists = get().items.some((p) => p.id === product.id);
    set({ items: exists ? get().items.filter((p) => p.id !== product.id) : [...get().items, product] });
  },
  isWishlisted: (id) => get().items.some((p) => p.id === id),
  count: () => get().items.length,
}));
