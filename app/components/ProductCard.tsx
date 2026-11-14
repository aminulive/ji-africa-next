"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MapPin, BadgeCheck } from 'lucide-react';
import Link from 'next/link';

export default function ProductCard({ ad }: { ad: any }) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);

  // Sync saved state from localStorage
  useEffect(() => {
    const syncWishlist = () => {
      try {
        const list = JSON.parse(localStorage.getItem('ji_wishlist') || '[]').map(String);
        setIsSaved(list.includes(String(ad.id)));
      } catch {
        setIsSaved(false);
      }
    };

    syncWishlist();
    window.addEventListener('ji_wishlist_updated', syncWishlist);
    return () => window.removeEventListener('ji_wishlist_updated', syncWishlist);
  }, [ad.id]);

  // Safely extract the first image
  let imageUrl = 'https://placehold.co/400x300/f8fafc/94a3b8?text=Ad';
  try {
    const images = JSON.parse(ad.image);
    const first = Array.isArray(images) ? images[0] : ad.image;
    if (first) {
      imageUrl =
        first.startsWith('http') || first.startsWith('data:')
          ? first
          : `https://ji-africa-backend.onrender.com${first}`;
    }
  } catch {
    if (typeof ad.image === 'string' && ad.image.length > 0) {
      imageUrl =
        ad.image.startsWith('http') || ad.image.startsWith('data:')
          ? ad.image
          : `https://ji-africa-backend.onrender.com${ad.image}`;
    }
  }

  // Hide unavailable ads on public feeds
  if (ad.status === 'Unavailable' || ad.status === 'unavailable') return null;

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const user = localStorage.getItem('ji_user');
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const current: string[] = JSON.parse(localStorage.getItem('ji_wishlist') || '[]').map(String);
      const strId = String(ad.id);
      const idx = current.indexOf(strId);

      if (idx > -1) {
        current.splice(idx, 1);
      } else {
        current.push(strId);
      }

      localStorage.setItem('ji_wishlist', JSON.stringify(current));
      setIsSaved(idx === -1);
      window.dispatchEvent(new Event('ji_wishlist_updated'));
    } catch (err) {
      console.error('Wishlist update failed', err);
    }
  };

  return (
    <div className="bg-white rounded-md overflow-hidden border border-gray-200 hover:shadow-lg hover:scale-[1.02] hover:border-brand-orange transition-all duration-300 flex flex-col group relative">
      {/* Save Button */}
      <button
        type="button"
        onClick={handleToggleWishlist}
        className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-full shadow-sm hover:text-brand-orange transition z-10"
        title={isSaved ? 'Remove from Saved Ads' : 'Save Ad'}
      >
        <Heart
          className={`w-4 h-4 transition ${
            isSaved ? 'fill-brand-orange text-brand-orange' : 'text-gray-500'
          }`}
        />
      </button>

      {/* Clickable Card Link */}
      <Link href={`/ad/${ad.id}`} className="flex flex-col h-full">
        <div className="relative aspect-[4/3] sm:aspect-square bg-gray-100 overflow-hidden">
          <img
            src={imageUrl}
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
  );
}