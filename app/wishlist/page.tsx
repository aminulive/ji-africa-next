"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Bell, BellPlus, Trash2, CheckCircle2 } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const API_URL = 'https://ji-africa-backend.onrender.com/api';

export default function WishlistPage() {
  const router = useRouter();
  const [savedAds, setSavedAds] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newQuery, setNewQuery] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newMaxPrice, setNewMaxPrice] = useState('');
  const [creatingAlert, setCreatingAlert] = useState(false);
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadData = useCallback(async () => {
    const user = localStorage.getItem('ji_user');
    const token = localStorage.getItem('ji_token');
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      if (token) {
        const [dbRes, alertRes] = await Promise.all([
          fetch(`${API_URL}/users/wishlist`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/users/saved-searches`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (alertRes.ok) {
          const alertData = await alertRes.json();
          setAlerts(alertData.alerts || []);
        }

        if (dbRes.ok) {
          const dbAds = await dbRes.json();
          if (Array.isArray(dbAds)) {
            setSavedAds(dbAds);
            localStorage.setItem(
              'ji_wishlist',
              JSON.stringify(dbAds.map((a: any) => String(a.id)))
            );
            setLoading(false);
            return;
          }
        }
      }

      let wishlistIds: string[] = [];
      try {
        wishlistIds = JSON.parse(localStorage.getItem('ji_wishlist') || '[]').map(String);
      } catch {
        wishlistIds = [];
      }

      if (wishlistIds.length === 0) {
        setSavedAds([]);
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/ads?page=1&limit=100`);
      if (res.ok) {
        const data = await res.json();
        const allAds = data.ads || [];
        const matched = allAds.filter((a: any) => wishlistIds.includes(String(a.id)));
        setSavedAds(matched);
      }
    } catch (err) {
      console.error('Failed to load saved ads & alerts', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
    window.addEventListener('ji_wishlist_updated', loadData);
    return () => window.removeEventListener('ji_wishlist_updated', loadData);
  }, [loadData]);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('ji_token');
    if (!token) return;
    if (!newQuery.trim() && !newLocation.trim() && !newMaxPrice.trim()) {
      notify('Enter a keyword, city/state, or max budget');
      return;
    }
    setCreatingAlert(true);
    try {
      const res = await fetch(`${API_URL}/users/saved-searches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: newQuery.trim(),
          location: newLocation.trim() || null,
          max_price: newMaxPrice ? Number(newMaxPrice) : null,
          email_enabled: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        notify(data.message || 'Search alert created!');
        setNewQuery('');
        setNewLocation('');
        setNewMaxPrice('');
        loadData();
      } else {
        notify(data.error || 'Failed to create alert');
      }
    } catch {
      notify('Network error creating alert');
    } finally {
      setCreatingAlert(false);
    }
  };

  const handleDeleteAlert = async (id: number) => {
    const token = localStorage.getItem('ji_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/users/saved-searches/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => Number(a.id) !== Number(id)));
        notify('Search alert removed');
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-brand-orange shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      {/* SAVED SEARCH & PRICE-DROP ALERTS SECTION */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-orange" /> Saved Search Alerts ({alerts.length})
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Receive instant in-app and email alerts whenever a seller posts a matching listing—plus automatic price-drop alerts on all your saved items below.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateAlert} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <input
            type="text"
            value={newQuery}
            onChange={(e) => setNewQuery(e.target.value)}
            placeholder="Keyword (e.g. iPhone 15 Pro, Toyota Camry)"
            className="sm:col-span-5 px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-orange"
          />
          <input
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            placeholder="Location (e.g. Abuja, Lagos)"
            className="sm:col-span-3 px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-orange"
          />
          <input
            type="number"
            min={1}
            value={newMaxPrice}
            onChange={(e) => setNewMaxPrice(e.target.value)}
            placeholder="Max Budget (₦)"
            className="sm:col-span-2 px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-orange"
          />
          <button
            type="submit"
            disabled={creatingAlert}
            className="sm:col-span-2 py-2.5 px-3 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition"
          >
            <BellPlus className="w-3.5 h-3.5" />
            {creatingAlert ? 'Saving...' : 'Add Alert'}
          </button>
        </form>

        {alerts.length > 0 && (
          <div className="divide-y divide-gray-100 border-t border-gray-100 pt-2">
            {alerts.map((al) => (
              <div key={al.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-black text-gray-900">{al.label}</p>
                  <p className="text-[11px] text-gray-500">
                    In-App &amp; Email Active • {Number(al.matches_count || 0)} match(es) sent
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteAlert(al.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete Alert"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SAVED ITEMS (WITH AUTOMATIC PRICE-DROP MONITORING) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-gray-900">
            Saved Adverts ({savedAds.length})
          </h1>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Auto Price-Drop Alerts Active
          </span>
        </div>

        {savedAds.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {savedAds.map((ad) => (
              <ProductCard key={ad.id} ad={ad} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl text-center text-gray-400 border border-gray-200 font-medium text-sm">
            No saved ads yet. Tap the heart icon on any item to save it across your devices and get instant price-drop alerts.
          </div>
        )}
      </div>
    </div>
  );
}
