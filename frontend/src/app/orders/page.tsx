'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Order } from '@/types';
import { useAuthStore } from '@/store/authStore';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
};

export default function OrdersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    api.get('/orders').then(({ data }) => { setOrders(data.orders); setLoading(false); });
  }, [user]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse space-y-4">{Array.from({length:3}).map((_,i)=><div key={i} className="h-24 bg-gray-200 rounded-xl"/>)}</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No orders yet</p>
          <Link href="/products" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow block">
              <div>
                <p className="font-medium">Order #{order.id.slice(-8).toUpperCase()}</p>
                <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                <p className="text-sm text-gray-500">{order.items?.length || 0} items</p>
              </div>
              <div className="text-right">
                <span className={`badge ${STATUS_COLORS[order.status]} mb-1`}>{order.status}</span>
                <p className="font-semibold">${Number(order.total).toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
