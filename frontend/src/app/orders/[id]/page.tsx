'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Order } from '@/types';
import { useAuthStore } from '@/store/authStore';

const STATUS_STEPS = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data.order));
  }, [user, id]);

  if (!order) return <div className="text-center py-16 animate-pulse">Loading...</div>;

  const stepIdx = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Order #{order.id.slice(-8).toUpperCase()}</h1>
      <p className="text-gray-500 mb-6">{new Date(order.created_at).toLocaleString()}</p>

      {/* Progress */}
      {stepIdx >= 0 && (
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= stepIdx ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {i + 1}
                </div>
                {i < STATUS_STEPS.length - 1 && <div className={`flex-1 h-1 ${i < stepIdx ? 'bg-primary-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {STATUS_STEPS.map((step) => <span key={step} className="text-xs text-gray-500 capitalize">{step}</span>)}
          </div>
        </div>
      )}

      <div className="card p-4 mb-4">
        <h2 className="font-semibold mb-3">Items</h2>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm py-2 border-b last:border-0">
              <span>{item.name} × {item.quantity}</span>
              <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>${Number(order.subtotal).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>${Number(order.tax).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{order.shipping == 0 ? 'Free' : `$${Number(order.shipping).toFixed(2)}`}</span></div>
          <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total</span><span>${Number(order.total).toFixed(2)}</span></div>
        </div>
      </div>

      {order.shipping_address && (
        <div className="card p-4">
          <h2 className="font-semibold mb-2">Shipping Address</h2>
          <p className="text-sm text-gray-600">{order.shipping_address.fullName}</p>
          <p className="text-sm text-gray-600">{order.shipping_address.address}</p>
          <p className="text-sm text-gray-600">{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
        </div>
      )}
    </div>
  );
}
