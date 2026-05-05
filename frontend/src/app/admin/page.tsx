'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Order } from '@/types';

interface Stats { users: number; products: number; orders: number; revenue: number; }

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (user && user.role !== 'admin') { router.push('/'); return; }
    if (!user) { router.push('/auth/login'); return; }
    api.get('/admin/dashboard').then(({ data }) => {
      setStats(data.stats);
      setRecentOrders(data.recentOrders);
    });
  }, [user]);

  if (!stats) return <div className="text-center py-16 animate-pulse">Loading dashboard...</div>;

  const cards = [
    { label: 'Total Users', value: stats.users, icon: '👥', color: 'text-blue-600' },
    { label: 'Active Products', value: stats.products, icon: '📦', color: 'text-green-600' },
    { label: 'Total Orders', value: stats.orders, icon: '🛒', color: 'text-purple-600' },
    { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}`, icon: '💰', color: 'text-yellow-600' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/admin/products" className="btn-primary text-sm">Manage Products</Link>
          <Link href="/admin/orders" className="btn-secondary text-sm">Manage Orders</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <p className="text-2xl mb-1">{c.icon}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-sm text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b">
              <tr>
                <th className="pb-2 pr-4">Order ID</th>
                <th className="pb-2 pr-4">Customer</th>
                <th className="pb-2 pr-4">Total</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentOrders.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="py-2 pr-4 font-mono text-xs">{order.id.slice(-8).toUpperCase()}</td>
                  <td className="py-2 pr-4">{order.user_name}</td>
                  <td className="py-2 pr-4">${Number(order.total).toFixed(2)}</td>
                  <td className="py-2 pr-4">
                    <span className={`badge ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>{order.status}</span>
                  </td>
                  <td className="py-2 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
