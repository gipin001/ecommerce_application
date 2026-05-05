'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCartIcon, HeartIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

interface Props { product: Product; }

export default function ProductCard({ product }: Props) {
  const { addItem, loading } = useCartStore();
  const { user } = useAuthStore();
  const router = useRouter();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { router.push('/auth/login'); return; }
    try {
      await addItem(product.id);
      toast.success('Added to cart');
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  const discount = product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : null;

  return (
    <Link href={`/products/${product.slug}`} className="card group hover:shadow-md transition-shadow overflow-hidden">
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {product.image ? (
          <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="(max-width: 768px) 50vw, 25vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">🛍️</div>
        )}
        {discount && (
          <span className="absolute top-2 left-2 badge bg-red-100 text-red-700">-{discount}%</span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-medium">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="text-xs text-gray-500 mb-1">{product.category_name}</p>
        <h3 className="font-medium text-sm line-clamp-2 mb-2">{product.name}</h3>

        {product.rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <StarSolid className="w-3 h-3 text-yellow-400" />
            <span className="text-xs text-gray-600">{product.rating.toFixed(1)} ({product.review_count})</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-gray-900">${product.price}</span>
            {product.compare_price && (
              <span className="text-xs text-gray-400 line-through ml-1">${product.compare_price}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={loading || product.stock === 0}
            className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            <ShoppingCartIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
