"use client";

import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  BadgeCheck,
  MapPin,
  Star,
  Share2,
  MessageCircle,
  Package,
  LayoutGrid,
  List,
  Heart,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

const API_URL = 'https://ji-africa-backend.onrender.com/api';

function formatPhoneNG(phone: string) {
  if (!phone) return '';
  const cleaned = phone.toString().trim();
  if (cleaned.startsWith('0')) return '+234' + cleaned.substring(1);
  if (!cleaned.startsWith('+')) return '+' + cleaned;
  return cleaned;
}

function resolveImage(path: string | null | undefined) {
  if (!path) return '';
  return path.startsWith('http') || path.startsWith('data:')
    ? path
    : `https://ji-africa-backend.onrender.com${path}`;
}

function getAdPrimaryImage(ad: any) {
  if (!ad?.image) {
    return `https://placehold.co/400x300/f8fafc/94a3b8?text=${encodeURIComponent((ad?.title || 'Ad').substring(0, 15))}`;
  }
  try {
    const parsed = JSON.parse(ad.image);
    const first = Array.isArray(parsed) ? parsed[0] : ad.image;
    if (first) return resolveImage(first);
  } catch {
    if (typeof ad.image === 'string') return resolveImage(ad.image);
  }
  return 'https://placehold.co/400x300/f8fafc/94a3b8?text=Ad';
}

function ShopContent() {
  const params = useParams();
  const sellerId = String(params?.id || '');

  const [loading, setLoading] = useState(true);
  const [shopUser, setShopUser] = useState<any>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Shop Reviews State (persisted in localStorage just like app.js)
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [toast, setToast] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('ji_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {}
    }

    const storedReviews = localStorage.getItem('ji_shop_reviews');
    if (storedReviews && sellerId) {
      try {
        const parsed = JSON.parse(storedReviews);
        setReviews(parsed[sellerId] || []);
      } catch {}
    }
  }, [sellerId]);

  useEffect(() => {
    if (!sellerId) return;

    async function fetchShop() {
      try {
        // 1. Try dedicated shop endpoint first
        const res = await fetch(`${API_URL}/users/${sellerId}/shop`);
        if (res.ok) {
          const data = await res.json();
          setShopUser(data.user);
          setAds(data.ads || []);
          setLoading(false);
          return;
        }

        // 2. Fallback: query ads by user_id or filter full list
        let shopAds: any[] = [];
        const adsRes = await fetch(`${API_URL}/ads?user_id=${sellerId}`);
        if (adsRes.ok) {
          const adsData = await adsRes.json();
          shopAds = adsData.ads || [];
        }

        if (shopAds.length === 0) {
          const allRes = await fetch(`${API_URL}/ads?page=1&limit=100`);
          if (allRes.ok) {
            const allData = await allRes.json();
            shopAds = (allData.ads || []).filter(
              (a: any) =>
                String(a.user_id) === sellerId || String(a.seller_id) === sellerId
            );
          }
        }

        const sampleAd = shopAds[0] || {};
        setShopUser({
          id: sellerId,
          full_name: sampleAd.seller_name || 'Seller Shop',
          shop_name: sampleAd.seller_shop_name || '',
          phone: sampleAd.seller_phone || '',
          shop_address: sampleAd.shop_address || 'Nigeria',
          shop_description: sampleAd.seller_shop_description || '',
          is_verified: sampleAd.seller_verified || false,
          profile_image: sampleAd.seller_image || null,
          shop_image: sampleAd.seller_shop_image || null,
        });
        setAds(shopAds);
      } catch (err) {
        console.error('Error loading shop data', err);
      } finally {
        setLoading(false);
      }
    }

    fetchShop();
  }, [sellerId]);

  const handleShareShop = async (displayName: string) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${displayName}'s Shop on ji.africa`,
          text: `Check out ${displayName}'s shop on ji.africa!`,
          url: window.location.href,
        });
      } catch {}
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      notify('Shop link copied to clipboard!');
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !comment.trim()) return;

    const newReview = {
      name: currentUser.full_name,
      avatar: currentUser.profile_image,
      rating,
      comment: comment.trim(),
      date: new Date().toLocaleDateString('en-GB'),
    };

    const updated = [newReview, ...reviews];
    setReviews(updated);
    setComment('');

    try {
      const all = JSON.parse(localStorage.getItem('ji_shop_reviews') || '{}');
      all[sellerId] = updated;
      localStorage.setItem('ji_shop_reviews', JSON.stringify(all));
    } catch {}

    notify('Shop review submitted!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (!shopUser) {
    return (
      <div className="text-center py-20 font-bold text-gray-600">
        Shop not found.
      </div>
    );
  }

  const profileImg = resolveImage(shopUser.profile_image);
  const shopImg = resolveImage(shopUser.shop_image);
  const displayName = shopUser.shop_name || shopUser.full_name;
  const visibleAds = ads.filter(
    (a) => a.status !== 'Unavailable' && a.status !== 'unavailable'
  );

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const whatsappHref = `https://wa.me/${formatPhoneNG(shopUser.phone).replace('+', '')}`;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-brand-orange" />
          <span>{toast}</span>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="text-[11px] text-gray-500 font-semibold mb-4 flex items-center gap-2">
        <Link href="/" className="hover:text-brand-orange">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-800">Stores</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-800 truncate">{displayName}</span>
      </div>

      {/* Shop Banner Header */}
      <div className="relative mb-16 md:mb-20">
        <div className="h-48 md:h-64 rounded-2xl bg-gray-200 overflow-hidden shadow-sm border border-gray-200">
          {shopImg ? (
            <img src={shopImg} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-brand-orange to-amber-500 opacity-80" />
          )}
        </div>

        <div className="absolute -bottom-10 md:-bottom-12 left-6 md:left-8 w-24 h-24 md:w-32 md:h-32 bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center text-brand-orange overflow-hidden z-10">
          {profileImg ? (
            <img src={profileImg} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl font-black">{(displayName || 'S')[0]}</span>
          )}
        </div>
      </div>

      {/* Shop Info Section */}
      <div className="px-2 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
              {displayName}
              {shopUser.is_verified && (
                <BadgeCheck className="w-7 h-7 text-blue-500" />
              )}
            </h1>
            {shopUser.shop_name && (
              <p className="text-sm font-semibold text-gray-500 mt-1">
                Managed by {shopUser.full_name}
              </p>
            )}
            <p className="text-sm text-gray-600 mt-2 flex items-center gap-1.5 font-medium">
              <MapPin className="w-4 h-4 text-brand-orange" /> {shopUser.shop_address || 'Nigeria'}
            </p>
          </div>

          {shopUser.shop_description && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-700 leading-relaxed">
                {shopUser.shop_description}
              </p>
            </div>
          )}
        </div>

        {/* Right Action Card */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-amber-400 fill-current" />
              <span className="text-lg font-black text-gray-900">
                {avgRating ? avgRating : 'New Shop'}
              </span>
              <span className="text-xs font-bold text-gray-500">
                ({reviews.length} Reviews)
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleShareShop(displayName)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Share2 className="w-4 h-4" /> Share Shop Link
              </button>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp Chat
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Layout Grid: Shop Inventory & Reviews */}
      <div className="px-2 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Inventory */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-orange" /> Shop Inventory ({visibleAds.length})
            </h2>
            <button
              type="button"
              onClick={() => setViewMode((m) => (m === 'grid' ? 'list' : 'grid'))}
              className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 text-gray-600 hover:text-brand-orange rounded-md shadow-sm transition"
              title="Toggle View"
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
            </button>
          </div>

          {visibleAds.length === 0 ? (
            <div className="text-center py-10 text-gray-500 font-medium text-sm bg-white rounded-lg border border-gray-200">
              No ads found in this shop.
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {visibleAds.map((ad) => (
                <div
                  key={ad.id}
                  className="bg-white rounded-md overflow-hidden border border-gray-200 hover:shadow-lg hover:scale-[1.02] hover:border-brand-orange transition-all duration-300 flex flex-col group relative"
                >
                  <button
                    type="button"
                    className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-full shadow-sm hover:text-brand-orange transition z-10"
                    title="Save Ad"
                  >
                    <Heart className="w-4 h-4 text-gray-500" />
                  </button>
                  <Link href={`/ad/${ad.id}`} className="flex flex-col h-full">
                    <div className="relative aspect-[4/3] sm:aspect-square bg-gray-100 overflow-hidden">
                      <img
                        src={getAdPrimaryImage(ad)}
                        alt={ad.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      {ad.is_vip && (
                        <span className="absolute top-1 left-1 bg-amber-400 text-gray-950 font-black text-[9px] uppercase px-1.5 py-0.5 rounded shadow-sm z-10">
                          {ad.vip_type}
                        </span>
                      )}
                    </div>
                    <div className="p-2.5 flex flex-col flex-1">
                      <h3 className="font-medium text-gray-700 text-[11px] line-clamp-1 mb-0.5 flex items-center gap-1">
                        {ad.title}
                        {ad.seller_verified && (
                          <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        )}
                      </h3>
                      <p className="font-black text-brand-orange text-sm mt-auto">
                        ₦{Number(ad.price).toLocaleString('en-NG')}
                      </p>
                      <p className="text-[9px] text-gray-500 line-clamp-2 mt-1 leading-tight">
                        {ad.description}
                      </p>
                      <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center text-[9px] text-gray-400 font-medium">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" /> {ad.shop_address || 'Nigeria'}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visibleAds.map((ad) => (
                <Link
                  key={ad.id}
                  href={`/ad/${ad.id}`}
                  className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg hover:border-brand-orange transition-all duration-300 flex flex-row group relative h-32 md:h-40"
                >
                  <div className="relative w-32 md:w-48 bg-gray-100 overflow-hidden shrink-0">
                    <img
                      src={getAdPrimaryImage(ad)}
                      alt={ad.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                  <div className="p-3 md:p-5 flex flex-col flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                      <h3 className="font-bold text-gray-800 text-sm md:text-base line-clamp-1">
                        {ad.title}
                      </h3>
                      <p className="text-brand-orange font-black text-base md:text-lg shrink-0">
                        ₦{Number(ad.price).toLocaleString('en-NG')}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 hidden md:block mb-auto">
                      {ad.description}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-100">
                      <span className="flex items-center gap-1 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-brand-orange" /> {ad.shop_address || 'Nigeria'}
                      </span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded">{ad.condition || 'Used'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Shop Reviews */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Shop Reviews ({reviews.length})
            </h3>

            {currentUser ? (
              <form
                onSubmit={handleSubmitReview}
                className="mb-6 pb-6 border-b border-gray-100"
              >
                <div className="mb-3">
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-brand-orange transition"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ 5 - Excellent</option>
                    <option value={4}>⭐⭐⭐⭐ 4 - Good</option>
                    <option value={3}>⭐⭐⭐ 3 - Average</option>
                    <option value={2}>⭐⭐ 2 - Fair</option>
                    <option value={1}>⭐ 1 - Poor</option>
                  </select>
                </div>
                <textarea
                  required
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a review about this shop..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs mb-3 outline-none focus:border-brand-orange transition"
                ></textarea>
                <button
                  type="submit"
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm"
                >
                  Submit Review
                </button>
              </form>
            ) : (
              <div className="mb-6 pb-6 border-b border-gray-100 text-center">
                <p className="text-xs text-gray-500">
                  Please{' '}
                  <Link href="/login" className="text-brand-orange font-bold hover:underline">
                    log in
                  </Link>{' '}
                  to leave a review.
                </p>
              </div>
            )}

            <div className="space-y-5 max-h-[500px] overflow-y-auto pr-2">
              {reviews.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No reviews yet.</p>
              ) : (
                reviews.map((r, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 shrink-0 overflow-hidden text-xs">
                      {r.avatar ? (
                        <img
                          src={resolveImage(r.avatar)}
                          alt={r.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        r.name?.[0] || 'U'
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-xs text-gray-900">{r.name}</span>
                        <span className="text-[10px] text-gray-400">{r.date}</span>
                      </div>
                      <div className="text-amber-400 text-[10px] my-0.5">
                        {'★'.repeat(r.rating)}
                        {'☆'.repeat(5 - r.rating)}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{r.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}