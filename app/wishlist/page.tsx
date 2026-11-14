"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const API_URL = 'https://ji-africa-backend.onrender.com/api';

export default function WishlistPage() {
  const router = useRouter();
  const [savedAds, setSavedAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWishlistAds = useCallback(async () => {
    const user = localStorage.getItem('ji_user');
    if (!user) {
      router.push('/login');
      return;
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

    try {
      const res = await fetch(`${API_URL}/ads?page=1&limit=100`);
      if (res.ok) {
        const data = await res.json();
        const allAds = data.ads || [];
        const matched = allAds.filter((a: any) => wishlistIds.includes(String(a.id)));
        setSavedAds(matched);
      }
    } catch (err) {
      console.error('Failed to load saved ads', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadWishlistAds();
    window.addEventListener('ji_wishlist_updated', loadWishlistAds);
    return () => window.removeEventListener('ji_wishlist_updated', loadWishlistAds);
  }, [loadWishlistAds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <h1 className="text-xl font-black text-gray-900">
        Saved Adverts ({savedAds.length})
      </h1>

      {savedAds.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {savedAds.map((ad) => (
            <ProductCard key={ad.id} ad={ad} />
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl text-center text-gray-400 border border-gray-200 font-medium text-sm">
          No saved ads.
        </div>
      )}
    </div>
  );
}"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const API_URL = 'https://ji-africa-backend.onrender.com/api';

export default function WishlistPage() {
  const router = useRouter();
  const [savedAds, setSavedAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWishlistAds = useCallback(async () => {
    const user = localStorage.getItem('ji_user');
    const token = localStorage.getItem('ji_token');
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      if (token) {
        const dbRes = await fetch(`${API_URL}/users/wishlist`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
      console.error('Failed to load saved ads', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadWishlistAds();
    window.addEventListener('ji_wishlist_updated', loadWishlistAds);
    return () => window.removeEventListener('ji_wishlist_updated', loadWishlistAds);
  }, [loadWishlistAds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <h1 className="text-xl font-black text-gray-900">
        Saved Adverts ({savedAds.length})
      </h1>

      {savedAds.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {savedAds.map((ad) => (
            <ProductCard key={ad.id} ad={ad} />
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl text-center text-gray-400 border border-gray-200 font-medium text-sm">
          No saved ads yet. Tap the heart icon on any item to save it across your devices.
        </div>
      )}
    </div>
  );
}