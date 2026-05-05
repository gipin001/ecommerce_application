'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { useAuthStore } from '@/store/authStore';
import { Product } from '@/types';

export default function WishlistPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    api.get('/wishlist').then(({ data }) => setItems(data.items));
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">❤️</p>
          <p>Your wishlist is empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <ProductCard key={item.id} product={{ ...item, id: item.product_id }} />
          ))}
        </div>
      )}
    </div>
  );
}
