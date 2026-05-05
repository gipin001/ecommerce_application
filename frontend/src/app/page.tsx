'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { Product, Category } from '@/types';

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.get('/products?limit=8').then(({ data }) => setFeatured(data.products));
    api.get('/products/categories').then(({ data }) => setCategories(data.categories));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Shop Everything</h1>
          <p className="text-xl text-primary-100 mb-8">Discover thousands of products at great prices</p>
          <Link href="/products" className="bg-white text-primary-700 font-semibold px-8 py-3 rounded-full hover:bg-primary-50 transition-colors">
            Shop Now
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/products?category=${cat.slug}`}
              className="card p-6 text-center hover:shadow-md transition-shadow group">
              <div className="text-3xl mb-2">🛍️</div>
              <p className="font-medium group-hover:text-primary-600">{cat.name}</p>
              <p className="text-sm text-gray-500">{cat.product_count} products</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <Link href="/products" className="text-primary-600 hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
