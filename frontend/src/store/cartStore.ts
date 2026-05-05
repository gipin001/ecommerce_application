import { create } from 'zustand';
import api from '@/lib/api';
import { Cart } from '@/types';

interface CartState extends Cart {
  open: boolean;
  loading: boolean;
  setOpen: (open: boolean) => void;
  fetchCart: () => Promise<void>;
  addItem: (product_id: string, quantity?: number) => Promise<void>;
  updateItem: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  total: '0.00',
  count: 0,
  open: false,
  loading: false,
  setOpen: (open) => set({ open }),
  fetchCart: async () => {
    try {
      const { data } = await api.get('/cart');
      set(data);
    } catch {}
  },
  addItem: async (product_id, quantity = 1) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/cart', { product_id, quantity });
      set({ ...data, loading: false });
    } catch {
      set({ loading: false });
      throw new Error('Failed to add item');
    }
  },
  updateItem: async (id, quantity) => {
    try {
      const { data } = await api.put(`/cart/${id}`, { quantity });
      set(data);
    } catch {}
  },
  removeItem: async (id) => {
    try {
      const { data } = await api.delete(`/cart/${id}`);
      set(data);
    } catch {}
  },
  clearCart: async () => {
    try {
      const { data } = await api.delete('/cart/clear');
      set(data);
    } catch {}
  },
}));
