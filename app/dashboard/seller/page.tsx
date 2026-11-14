"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const API_URL = 'https://ji-africa-backend.onrender.com/api';

function getAdImage(ad: any) {
  if (!ad?.image) {
    return `https://placehold.co/400x300/f8fafc/94a3b8?text=${encodeURIComponent((ad?.title || 'Ad').substring(0, 15))}`;
  }
  try {
    const parsed = JSON.parse(ad.image);
    const first = Array.isArray(parsed) ? parsed[0] : ad.image;
    if (first) {
      return first.startsWith('http') || first.startsWith('data:')
        ? first
        : `https://ji-africa-backend.onrender.com${first}`;
    }
  } catch {
    if (typeof ad.image === 'string') {
      return ad.image.startsWith('http') || ad.image.startsWith('data:')
        ? ad.image
        : `https://ji-africa-backend.onrender.com${ad.image}`;
    }
  }
  return `https://placehold.co/400x300/f8fafc/94a3b8?text=Ad`;
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadSellerData = useCallback(async () => {
    const token = localStorage.getItem('ji_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/dashboard/seller`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401 || res.status === 403) {
        router.push('/login');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setAds(data.ads || []);
      } else {
        notify('Error loading dashboard', 'error');
      }
    } catch {
      notify('Server error loading dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadSellerData();
  }, [loadSellerData]);

  const handleDeleteAd = async (id: string | number) => {
    if (!confirm('Delete ad?')) return;
    const token = localStorage.getItem('ji_token');

    try {
      const res = await fetch(`${API_URL}/ads/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        notify('Ad deleted', 'success');
        setAds(prev => prev.filter(ad => String(ad.id) !== String(id)));
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
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Toast Feedback */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-bold text-white ${toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-brand-orange" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 flex justify-between items-center shadow-sm">
        <h1 className="font-black text-xl text-gray-900">Seller Dashboard</h1>
        <Link 
          href="/sell" 
          className="bg-brand-orange hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow transition"
        >
          Post New Ad
        </Link>
      </div>

      {/* Seller Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ads.length === 0 ? (
          <p className="text-gray-400 text-sm col-span-full bg-white p-8 rounded-xl border border-gray-200 text-center">
            You haven&apos;t posted any ads yet.
          </p>
        ) : (
          ads.map((ad) => {
            const isUnavailable = ad.status === 'Unavailable' || ad.status === 'unavailable';
            return (
              <div 
                key={ad.id} 
                className={`bg-white rounded-xl border border-gray-200 p-4 flex flex-col justify-between relative shadow-sm ${isUnavailable ? 'opacity-75' : ''}`}
              >
                {isUnavailable && (
                  <span className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded shadow z-10">
                    Unavailable
                  </span>
                )}
                <div>
                  <Link href={`/ad/${ad.id}`}>
                    <img 
                      src={getAdImage(ad)} 
                      alt={ad.title} 
                      className="w-full h-36 object-cover rounded-lg mb-3 hover:opacity-95 transition" 
                    />
                  </Link>
                  <h3 className="font-bold text-sm text-gray-800 line-clamp-1">{ad.title}</h3>
                  <p className="text-brand-orange font-black text-sm mt-1">
                    ₦{Number(ad.price).toLocaleString('en-NG')}
                  </p>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  <Link 
                    href={`/sell?edit=${ad.id}`}
                    className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg text-xs font-bold transition"
                  >
                    Edit
                  </Link>
                  <button 
                    type="button"
                    onClick={() => handleDeleteAd(ad.id)} 
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-1.5 rounded-lg text-xs font-bold transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}