'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShoppingCartIcon, UserIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, token, logout, fetchMe } = useAuthStore();
  const { count, fetchCart, setOpen } = useCartStore();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (token) {
      fetchMe();
      fetchCart();
    }
  }, [token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/products?search=${encodeURIComponent(search)}`);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
        <Link href="/" className="text-xl font-bold text-primary-600 shrink-0">ShopMVP</Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9 text-sm"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </form>

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setOpen(true)} className="relative p-2 hover:bg-gray-100 rounded-lg">
            <ShoppingCartIcon className="w-6 h-6" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>

          {user ? (
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg text-sm">
                <UserIcon className="w-5 h-5" />
                <span className="hidden md:block">{user.name.split(' ')[0]}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 card shadow-lg py-1 z-50">
                  {user.role === 'admin' && (
                    <Link href="/admin" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                      Admin Dashboard
                    </Link>
                  )}
                  <Link href="/orders" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setMenuOpen(false)}>My Orders</Link>
                  <Link href="/wishlist" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Wishlist</Link>
                  <hr className="my-1" />
                  <button onClick={() => { logout(); setMenuOpen(false); router.push('/'); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/login" className="btn-primary text-sm">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
