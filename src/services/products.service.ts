import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/utils/storage';
import type { Product, Category, Banner } from '@/types';

export const productsService = {
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return data ?? [];
  },

  async getFeaturedProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(id,name,slug,color), product_images(*)')
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('sort_order')
      .limit(12);
    if (error) throw error;
    return data ?? [];
  },

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(id,name,slug,color), product_images(*)')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return data ?? [];
  },

  async getProductById(id: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(id,name,slug,color), product_images(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(id,name,slug,color)')
      .eq('is_active', true)
      .ilike('name', `%${query}%`)
      .order('sort_order')
      .limit(30);
    if (error) throw error;
    return data ?? [];
  },

  async getNewArrivals(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(id,name,slug,color)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    return data ?? [];
  },

  async getProductsOnSale(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(id,name,slug,color)')
      .eq('is_active', true)
      .not('compare_price', 'is', null)
      .order('sort_order')
      .limit(10);
    if (error) throw error;
    return data ?? [];
  },

  async getBanners(): Promise<Banner[]> {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return data ?? [];
  },

  // Admin: get ALL products (no featured filter)
  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(id,name,slug,color)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  // Admin: create/update/delete product
  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'product_images'>) {
    const { data, error } = await supabase.from('products').insert(product).select().single();
    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, updates: Partial<Product>) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  async uploadProductImage(uri: string, filename: string): Promise<string> {
    return uploadImage('products', filename, uri);
  },

  async uploadCategoryImage(uri: string, filename: string): Promise<string> {
    return uploadImage('categories', filename, uri);
  },
};
