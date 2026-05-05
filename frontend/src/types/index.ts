export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'vendor';
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  product_count?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compare_price?: number;
  image?: string;
  images?: string[];
  category_id?: string;
  category_name?: string;
  category_slug?: string;
  stock: number;
  sku?: string;
  is_active: boolean;
  rating: number;
  review_count: number;
  created_at: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  stock: number;
  line_total: number;
}

export interface Cart {
  items: CartItem[];
  total: string;
  count: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  product_id?: string;
}

export interface Order {
  id: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  shipping_address?: ShippingAddress;
  payment_method?: string;
  items: OrderItem[];
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Review {
  id: string;
  rating: number;
  title?: string;
  body?: string;
  user_name: string;
  created_at: string;
}

export interface PaginatedProducts {
  products: Product[];
  total: number;
  page: number;
  pages: number;
}
