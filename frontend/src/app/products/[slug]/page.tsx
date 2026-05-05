'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Product, Review } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product & { reviews?: Review[] } | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');
  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    api.get(`/products/${slug}`).then(({ data }) => {
      setProduct(data.product);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = async () => {
    if (!user) { router.push('/auth/login'); return; }
    try {
      await addItem(product!.id, qty);
      toast.success('Added to cart');
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/products/${product!.id}/reviews`, { rating: reviewRating, body: reviewBody });
      toast.success('Review submitted');
      const { data } = await api.get(`/products/${slug}`);
      setProduct(data.product);
      setReviewBody('');
    } catch {
      toast.error('Failed to submit review');
    }
  };

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse"><div className="h-96 bg-gray-200 rounded-xl" /></div>;
  if (!product) return <div className="text-center py-16">Product not found</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative">
          {product.image
            ? <Image src={product.image} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            : <div className="absolute inset-0 flex items-center justify-center text-8xl">🛍️</div>}
        </div>

        <div>
          <p className="text-sm text-primary-600 mb-1">{product.category_name}</p>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1,2,3,4,5].map((s) => (
                s <= Math.round(product.rating)
                  ? <StarIcon key={s} className="w-4 h-4 text-yellow-400" />
                  : <StarOutline key={s} className="w-4 h-4 text-gray-300" />
              ))}
            </div>
            <span className="text-sm text-gray-500">({product.review_count} reviews)</span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-bold">${product.price}</span>
            {product.compare_price && <span className="text-xl text-gray-400 line-through">${product.compare_price}</span>}
          </div>

          <p className="text-gray-600 mb-6">{product.description}</p>

          <p className="text-sm text-gray-500 mb-4">
            {product.stock > 0 ? <span className="text-green-600">In stock ({product.stock} left)</span> : <span className="text-red-500">Out of stock</span>}
          </p>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-gray-50">-</button>
              <span className="px-4 py-2 font-medium">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="px-3 py-2 hover:bg-gray-50">+</button>
            </div>
            <button onClick={handleAddToCart} disabled={product.stock === 0} className="btn-primary flex-1 py-3">
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Reviews</h2>
        {user && (
          <form onSubmit={handleReview} className="card p-4 mb-6">
            <h3 className="font-medium mb-3">Write a Review</h3>
            <div className="flex gap-1 mb-3">
              {[1,2,3,4,5].map((s) => (
                <button key={s} type="button" onClick={() => setReviewRating(s)}>
                  {s <= reviewRating ? <StarIcon className="w-6 h-6 text-yellow-400" /> : <StarOutline className="w-6 h-6 text-gray-300" />}
                </button>
              ))}
            </div>
            <textarea value={reviewBody} onChange={(e) => setReviewBody(e.target.value)}
              className="input mb-3" rows={3} placeholder="Share your experience..." />
            <button type="submit" className="btn-primary">Submit Review</button>
          </form>
        )}
        <div className="space-y-4">
          {(product.reviews || []).map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[1,2,3,4,5].map((s) => (
                    <StarIcon key={s} className={`w-4 h-4 ${s <= r.rating ? 'text-yellow-400' : 'text-gray-200'}`} />
                  ))}
                </div>
                <span className="font-medium text-sm">{r.user_name}</span>
                <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              {r.body && <p className="text-gray-600 text-sm">{r.body}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
