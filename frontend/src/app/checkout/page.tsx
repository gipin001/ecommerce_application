'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { ShippingAddress } from '@/types';

const EMPTY_ADDRESS: ShippingAddress = { fullName: '', address: '', city: '', state: '', zip: '', country: 'US' };

export default function CheckoutPage() {
  const { items, total, fetchCart } = useCartStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [addr, setAddr] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) router.push('/auth/login');
    fetchCart();
  }, [user]);

  const subtotal = parseFloat(total);
  const tax = subtotal * 0.1;
  const shipping = subtotal > 50 ? 0 : 5.99;
  const orderTotal = subtotal + tax + shipping;

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/orders', { shipping_address: addr, payment_method: 'card' });
      toast.success('Order placed successfully!');
      router.push(`/orders/${data.order.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Order failed');
    }
    setLoading(false);
  };

  if (!items.length) return (
    <div className="text-center py-16">
      <p className="text-gray-500 mb-4">Your cart is empty</p>
      <button onClick={() => router.push('/products')} className="btn-primary">Shop Now</button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <div className="grid md:grid-cols-5 gap-6">
        <form onSubmit={handleOrder} className="md:col-span-3 space-y-4">
          <div className="card p-4">
            <h2 className="font-semibold mb-4">Shipping Address</h2>
            {[
              { label: 'Full Name', key: 'fullName', col: 'col-span-2' },
              { label: 'Address', key: 'address', col: 'col-span-2' },
              { label: 'City', key: 'city', col: '' },
              { label: 'State', key: 'state', col: '' },
              { label: 'ZIP Code', key: 'zip', col: '' },
              { label: 'Country', key: 'country', col: '' },
            ].map(({ label, key, col }) => (
              <div key={key} className={`mb-3 ${col}`}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <input className="input" required value={addr[key as keyof ShippingAddress]}
                  onChange={(e) => setAddr({ ...addr, [key]: e.target.value })} />
              </div>
            ))}
          </div>
          <div className="card p-4">
            <h2 className="font-semibold mb-2">Payment</h2>
            <p className="text-sm text-gray-500 mb-3">Mock payment — no real card required</p>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-gray-400 text-sm">
              💳 Payment form (Stripe integration ready)
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? 'Placing Order...' : `Place Order — $${orderTotal.toFixed(2)}`}
          </button>
        </form>

        <div className="md:col-span-2">
          <div className="card p-4 sticky top-20">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 line-clamp-1">{item.name} × {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <hr className="my-3" />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax (10%)</span><span>${tax.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span></div>
            </div>
            <hr className="my-3" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span><span>${orderTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
