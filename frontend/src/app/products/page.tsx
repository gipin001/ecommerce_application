'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { Product, Category } from '@/types';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'created_at';
  const page = parseInt(searchParams.get('page') || '1');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12', sort });
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      const { data } = await api.get(`/products?${params}`);
      setProducts(data.products);
      setTotal(data.total);
      setPages(data.pages);
    } catch {}
    setLoading(false);
  }, [page, category, search, sort]);

  useEffect(() => {
    fetchProducts();
    api.get('/products/categories').then(({ data }) => setCategories(data.categories));
  }, [fetchProducts]);

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    router.push(`/products?${p}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 hidden md:block">
          <div className="card p-4 sticky top-20">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><FunnelIcon className="w-4 h-4" />Filters</h3>
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Category</p>
              <button onClick={() => setParam('category', '')} className={`block w-full text-left text-sm px-2 py-1 rounded ${!category ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-gray-50'}`}>
                All Categories
              </button>
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => setParam('category', cat.slug)}
                  className={`block w-full text-left text-sm px-2 py-1 rounded ${category === cat.slug ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-gray-50'}`}>
                  {cat.name} <span className="text-gray-400">({cat.product_count})</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 text-sm">{total} products {search && `for "${search}"`}</p>
            <select value={sort} onChange={(e) => setParam('sort', e.target.value)} className="input w-auto text-sm">
              <option value="created_at">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card aspect-square animate-pulse bg-gray-100" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setParam('page', String(p))}
                  className={`w-9 h-9 rounded-lg text-sm ${p === page ? 'bg-primary-600 text-white' : 'bg-white border hover:bg-gray-50'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
