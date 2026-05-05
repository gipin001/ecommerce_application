'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Product, Category } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const EMPTY_FORM = { name: '', description: '', price: '', compare_price: '', category_id: '', stock: '', sku: '', image: '', is_active: true };

export default function AdminProductsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/');
    if (!user) router.push('/auth/login');
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const [p, c] = await Promise.all([api.get('/products?limit=100'), api.get('/products/categories')]);
    setProducts(p.data.products);
    setCategories(c.data.categories);
  };

  const openEdit = (p: Product) => {
    setForm({ name: p.name, description: p.description || '', price: String(p.price), compare_price: String(p.compare_price || ''), category_id: p.category_id || '', stock: String(p.stock), sku: p.sku || '', image: p.image || '', is_active: p.is_active });
    setEditId(p.id);
    setModal(true);
  };

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), compare_price: form.compare_price ? parseFloat(form.compare_price) : null, stock: parseInt(form.stock) || 0 };
      if (editId) await api.put(`/products/${editId}`, payload);
      else await api.post('/products', payload);
      toast.success(editId ? 'Product updated' : 'Product created');
      setModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    toast.success('Product deleted');
    fetchData();
  };

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500 border-b">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.category_name}</td>
                <td className="px-4 py-3">${p.price}</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => openEdit(p)} className="p-1 hover:text-primary-600"><PencilIcon className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-1 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{editId ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[{ label: 'Name', key: 'name', type: 'text', required: true }, { label: 'Price', key: 'price', type: 'number', required: true }, { label: 'Compare Price', key: 'compare_price', type: 'number' }, { label: 'Stock', key: 'stock', type: 'number' }, { label: 'SKU', key: 'sku', type: 'text' }, { label: 'Image URL', key: 'image', type: 'url' }].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input type={type} className="input" value={form[key as keyof typeof form] as string} required={required} onChange={f(key)} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select className="input" value={form.category_id} onChange={f('category_id')}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea className="input" rows={3} value={form.description} onChange={f('description')} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active as boolean} onChange={f('is_active')} />
                Active
              </label>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
