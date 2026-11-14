"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const API_URL = 'https://ji-africa-backend.onrender.com/api';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [recentAds, setRecentAds] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [newCatName, setNewCatName] = useState('');
  const [subInputs, setSubInputs] = useState<{ [key: string]: string }>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadAdminData = useCallback(async () => {
    const token = localStorage.getItem('ji_token');
    const rawUser = localStorage.getItem('ji_user');
    
    if (!token || !rawUser) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(rawUser);
      const adminRoles = ['super_admin', 'admin', 'country_manager'];
      if (!adminRoles.includes(parsedUser.role)) {
        router.push('/');
        return;
      }

      const [dashRes, catRes] = await Promise.all([
        fetch(`${API_URL}/admin/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/categories`)
      ]);

      if (dashRes.status === 401 || dashRes.status === 403) {
        router.push('/');
        return;
      }

      if (dashRes.ok) {
        const dashData = await dashRes.json();
        setUsers(dashData.users || []);
        setRecentAds(dashData.recent_ads || []);
      }

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.filter((c: any) => c.id !== 'all'));
      }
    } catch {
      notify('Error loading Admin Center', 'error');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // --- CATEGORY MANAGEMENT ---
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const token = localStorage.getItem('ji_token');

    try {
      const res = await fetch(`${API_URL}/admin/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCatName.trim() })
      });

      if (res.ok) {
        notify('Category added!', 'success');
        setNewCatName('');
        loadAdminData();
      } else {
        notify('Failed to add category', 'error');
      }
    } catch {
      notify('Server error', 'error');
    }
  };

  const handleDeleteCategory = async (catId: string | number) => {
    if (!confirm('Delete category?')) return;
    const token = localStorage.getItem('ji_token');

    try {
      const res = await fetch(`${API_URL}/admin/categories/${catId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        notify('Category deleted');
        loadAdminData();
      } else {
        notify('Failed to delete category', 'error');
      }
    } catch {
      notify('Server error', 'error');
    }
  };

  const handleAddSubcategory = async (catId: string | number) => {
    const val = (subInputs[String(catId)] || '').trim();
    if (!val) return;
    const token = localStorage.getItem('ji_token');

    try {
      const res = await fetch(`${API_URL}/admin/categories/${catId}/subcategories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subcategory: val })
      });

      if (res.ok) {
        notify('Subcategory added!', 'success');
        setSubInputs(prev => ({ ...prev, [String(catId)]: '' }));
        loadAdminData();
      } else {
        notify('Failed to add subcategory', 'error');
      }
    } catch {
      notify('Server error', 'error');
    }
  };

  // --- USER MANAGEMENT ---
  const handleToggleVerifyUser = async (userId: string | number, currentStatus: boolean) => {
    const token = localStorage.getItem('ji_token');
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_verified: !currentStatus })
      });

      if (res.ok) {
        notify('User verification updated!', 'success');
        setUsers(prev =>
          prev.map(u => (String(u.id) === String(userId) ? { ...u, is_verified: !currentStatus } : u))
        );
      } else {
        notify('Failed to update verification', 'error');
      }
    } catch {
      notify('Server error', 'error');
    }
  };

  const handleUpdateUserRole = async (userId: string | number, role: string) => {
    const token = localStorage.getItem('ji_token');
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      });

      if (res.ok) {
        notify('User role updated!', 'success');
        setUsers(prev =>
          prev.map(u => (String(u.id) === String(userId) ? { ...u, role } : u))
        );
      } else {
        notify('Failed to update role', 'error');
      }
    } catch {
      notify('Server error', 'error');
    }
  };

  const handleDeleteUser = async (userId: string | number) => {
    if (!confirm('Delete user?')) return;
    const token = localStorage.getItem('ji_token');

    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        notify('User deleted');
        setUsers(prev => prev.filter(u => String(u.id) !== String(userId)));
      } else {
        notify('Failed to delete user', 'error');
      }
    } catch {
      notify('Server error', 'error');
    }
  };

  // --- AD MANAGEMENT ---
  const handleDeleteAd = async (adId: string | number) => {
    if (!confirm('Delete ad?')) return;
    const token = localStorage.getItem('ji_token');

    try {
      const res = await fetch(`${API_URL}/ads/${adId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        notify('Ad deleted');
        setRecentAds(prev => prev.filter(ad => String(ad.id) !== String(adId)));
      } else {
        notify('Failed to delete ad', 'error');
      }
    } catch {
      notify('Server error', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-bold text-white ${toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-brand-orange" />}
          <span>{toast.message}</span>
        </div>
      )}

      <h1 className="text-2xl font-black text-gray-900">Admin Command Center</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Box: Manage Categories & Subcategories */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
          <h2 className="font-bold text-gray-800">Manage Categories &amp; Subcategories</h2>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="New category name..." 
              className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-brand-orange"
            />
            <button 
              type="button"
              onClick={handleAddCategory} 
              className="px-4 py-2 bg-brand-orange hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition"
            >
              Add Category
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {categories.map((c) => (
              <div key={c.id} className="p-3 border border-gray-200 rounded-xl bg-gray-50 space-y-2">
                <div className="flex justify-between items-center font-bold text-sm text-gray-800">
                  <span>{c.name}</span>
                  <button 
                    type="button"
                    onClick={() => handleDeleteCategory(c.id)} 
                    className="text-red-500 hover:text-red-700 text-xs transition"
                  >
                    Delete
                  </button>
                </div>

                <div className="flex flex-wrap gap-1 text-[11px]">
                  {(c.subcategories || []).map((sub: string, idx: number) => (
                    <span key={idx} className="bg-white text-gray-700 px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                      {sub}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 mt-2">
                  <input 
                    type="text" 
                    value={subInputs[String(c.id)] || ''}
                    onChange={(e) => setSubInputs(prev => ({ ...prev, [String(c.id)]: e.target.value }))}
                    placeholder="Add subcategory..." 
                    className="flex-1 px-2 py-1.5 text-xs border border-gray-200 bg-white rounded-lg outline-none focus:border-brand-orange"
                  />
                  <button 
                    type="button"
                    onClick={() => handleAddSubcategory(c.id)} 
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-bold transition"
                  >
                    Add Sub
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Box: Manage Users */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
          <h2 className="font-bold text-gray-800">Manage Users ({users.length})</h2>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto pr-2">
            {users.map((u) => (
              <div key={u.id} className="py-3 flex justify-between items-center text-xs gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 flex items-center gap-1.5 truncate">
                    <span className="truncate">{u.full_name}</span>
                    <span className="text-[9px] font-bold text-brand-orange bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                      {u.role}
                    </span>
                  </p>
                  <p className="text-gray-500 mt-1 truncate">{u.email}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    type="button"
                    onClick={() => handleToggleVerifyUser(u.id, u.is_verified)} 
                    className={`px-3 py-1.5 rounded-lg font-bold border transition ${
                      u.is_verified 
                        ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' 
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {u.is_verified ? 'Verified' : 'Verify'}
                  </button>

                  <select 
                    value={u.role}
                    onChange={(e) => handleUpdateUserRole(u.id, e.target.value)} 
                    className="text-xs border border-gray-200 rounded-lg p-1.5 bg-gray-50 font-medium outline-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="country_manager">Country Manager</option>
                  </select>

                  <button 
                    type="button"
                    onClick={() => handleDeleteUser(u.id)} 
                    className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1.5 rounded-lg font-bold transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Full-Width Box: Manage All Ads */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4">Manage All Ads ({recentAds.length})</h2>
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto pr-2">
          {recentAds.map((ad) => (
            <div key={ad.id} className="py-3 flex justify-between items-center text-xs">
              <div className="flex flex-col min-w-0 pr-4">
                <Link href={`/ad/${ad.id}`} className="font-semibold text-gray-800 hover:text-brand-orange truncate">
                  {ad.title}
                </Link>
                <span className="text-gray-400 text-[10px]">
                  by {ad.seller_name}{' '}
                  {(ad.status === 'Unavailable' || ad.status === 'unavailable') && (
                    <span className="ml-1 text-red-500 font-bold">(Unavailable)</span>
                  )}
                </span>
              </div>

              <div className="flex gap-2 shrink-0">
                <Link 
                  href={`/sell?edit=${ad.id}`}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold transition"
                >
                  Edit
                </Link>
                <button 
                  type="button"
                  onClick={() => handleDeleteAd(ad.id)} 
                  className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-bold transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}