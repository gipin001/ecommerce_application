'use client';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';

export default function CartDrawer() {
  const { open, setOpen, items, total, updateItem, removeItem } = useCartStore();

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setOpen(false)} />}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Your Cart ({items.length})</h2>
          <button onClick={() => setOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-3">🛒</p>
              <p>Your cart is empty</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                  {item.image
                    ? <Image src={item.image} alt={item.name} width={64} height={64} className="object-cover w-full h-full" />
                    : <div className="w-full h-full flex items-center justify-center text-xl">🛍️</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                  <p className="text-sm text-primary-600 font-semibold">${item.price}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => updateItem(item.id, item.quantity - 1)} className="w-6 h-6 bg-gray-200 rounded text-sm hover:bg-gray-300">-</button>
                    <span className="text-sm w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateItem(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock} className="w-6 h-6 bg-gray-200 rounded text-sm hover:bg-gray-300 disabled:opacity-50">+</button>
                  </div>
                </div>
                <button onClick={() => removeItem(item.id)} className="p-1 hover:text-red-500">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t">
            <div className="flex justify-between font-semibold text-lg mb-4">
              <span>Total</span>
              <span>${total}</span>
            </div>
            <Link href="/checkout" onClick={() => setOpen(false)} className="btn-primary w-full block text-center py-3">
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
