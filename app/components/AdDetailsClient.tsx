"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  BadgeCheck,
  PhoneCall,
  Phone,
  MessageCircle,
  Heart,
  Share2,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Layers,
  Slash,
  CheckCircle2,
} from 'lucide-react';
import ProductCard from './ProductCard';

function formatPhoneNG(phone: string) {
  if (!phone) return '';
  const cleaned = phone.toString().trim();
  if (cleaned.startsWith('0')) return '+234' + cleaned.substring(1);
  if (!cleaned.startsWith('+')) return '+' + cleaned;
  return cleaned;
}

function resolveImg(path: string) {
  if (!path) return '';
  return path.startsWith('http') || path.startsWith('data:')
    ? path
    : `https://ji-africa-backend.onrender.com${path}`;
}

export default function AdDetailsClient({
  ad,
  similarAds,
}: {
  ad: any;
  similarAds: any[];
}) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [toast, setToast] = useState('');

  // Buyer Reviews State (persisted in localStorage under 'ji_reviews')
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Parse images safely
  let images = ['https://placehold.co/800x600/f8fafc/94a3b8?text=No+Image'];
  try {
    const parsed = JSON.parse(ad.image);
    if (Array.isArray(parsed) && parsed.length > 0) {
      images = parsed.map(resolveImg);
    } else if (typeof ad.image === 'string' && ad.image.length > 0) {
      images = [resolveImg(ad.image)];
    }
  } catch {
    if (typeof ad.image === 'string' && ad.image.length > 0) {
      images = [resolveImg(ad.image)];
    }
  }

  useEffect(() => {
    const storedUser = localStorage.getItem('ji_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {}
    }

    const syncSaved = () => {
      try {
        const list = JSON.parse(localStorage.getItem('ji_wishlist') || '[]').map(String);
        setIsSaved(list.includes(String(ad.id)));
      } catch {}
    };

    syncSaved();
    window.addEventListener('ji_wishlist_updated', syncSaved);

    try {
      const allReviews = JSON.parse(localStorage.getItem('ji_reviews') || '{}');
      setReviews(allReviews[String(ad.id)] || []);
    } catch {}

    return () => window.removeEventListener('ji_wishlist_updated', syncSaved);
  }, [ad.id]);

  const handleToggleSave = () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    try {
      const list: string[] = JSON.parse(localStorage.getItem('ji_wishlist') || '[]').map(String);
      const strId = String(ad.id);
      const idx = list.indexOf(strId);
      if (idx > -1) {
        list.splice(idx, 1);
        notify('Removed from saved ads');
      } else {
        list.push(strId);
        notify('Added to saved ads!');
      }
      localStorage.setItem('ji_wishlist', JSON.stringify(list));
      setIsSaved(idx === -1);
      window.dispatchEvent(new Event('ji_wishlist_updated'));
    } catch {}
  };

  const handleShare = async () => {
    const formattedPrice = '₦' + Number(ad.price).toLocaleString('en-NG');
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${ad.title} for ${formattedPrice} on ji.africa`,
          text: `Check out this ad on ji.africa: ${ad.title}`,
          url: window.location.href,
        });
      } catch {}
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      notify('Link copied to clipboard!');
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
      const all = JSON.parse(localStorage.getItem('ji_reviews') || '{}');
      all[String(ad.id)] = updated;
      localStorage.setItem('ji_reviews', JSON.stringify(all));
    } catch {}

    notify('Review submitted successfully!');
  };

  const formatNaira = (amount: number) => '₦' + Number(amount).toLocaleString('en-NG');
  const formattedPhone = formatPhoneNG(ad.seller_phone || '');
  const whatsappLink = `https://wa.me/${formattedPhone.replace('+', '')}?text=${encodeURIComponent(
    `Hello, I saw your ad on ji.africa: "${ad.title}"`
  )}`;
  const isUnavailable = ad.status === 'Unavailable' || ad.status === 'unavailable';

  const prevImage = () =>
    setCurrentImageIndex((i) => (i - 1 + images.length) % images.length);
  const nextImage = () =>
    setCurrentImageIndex((i) => (i + 1) % images.length);

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-brand-orange" />
          <span>{toast}</span>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="text-[11px] text-gray-500 font-semibold mb-4 flex items-center gap-2">
        <Link href="/" className="hover:text-brand-orange">
          Home
        </Link>
        {ad.subcategory && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span>{ad.subcategory}</span>
          </>
        )}
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-800 truncate">{ad.title}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Images, Specs & Buyer Reviews */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Interactive Main Image Gallery */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="relative bg-gray-950 aspect-[4/3] flex items-center justify-center group">
              <img
                src={images[currentImageIndex]}
                alt={ad.title}
                className="w-full h-full object-contain"
              />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50 border-t border-gray-100">
                {images.map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${ad.title} ${idx + 1}`}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 transition shrink-0 ${
                      idx === currentImageIndex
                        ? 'border-brand-orange scale-105'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Availability / Post Similar Callout */}
          {isUnavailable ? (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-xl">
              <Slash className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-800">
                  This ad is temporarily unavailable
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  The seller has marked this item as currently out of stock or unavailable.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-orange-50 border border-orange-100 p-4 rounded-xl">
              <p className="text-sm font-bold text-orange-900">
                Got something similar to sell?
              </p>
              <Link
                href="/sell"
                className="bg-brand-orange hover:bg-orange-700 text-white px-5 py-2 rounded-lg text-xs font-bold shadow transition"
              >
                Post ad like this
              </Link>
            </div>
          )}

          {/* Product Specifications & Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{ad.title}</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 mb-6 pt-4 border-t border-gray-100">
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Condition</p>
                <p className="text-sm font-semibold text-gray-800">
                  {ad.condition || 'N/A'}
                </p>
              </div>
              {ad.brand && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Brand</p>
                  <p className="text-sm font-semibold text-gray-800">{ad.brand}</p>
                </div>
              )}
              {ad.type && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Type</p>
                  <p className="text-sm font-semibold text-gray-800">{ad.type}</p>
                </div>
              )}
              {ad.delivery_option && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Delivery</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {ad.delivery_option}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-bold text-gray-800 mb-2">Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {ad.description}
              </p>
            </div>

            {ad.youtube_link && (
              <div className="mt-6 border-t border-gray-100 pt-6">
                <a
                  href={
                    ad.youtube_link.startsWith('http')
                      ? ad.youtube_link
                      : `https://${ad.youtube_link}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-brand-orange hover:underline"
                >
                  <ExternalLink className="w-5 h-5" /> View External Link / Product Video
                </a>
              </div>
            )}
          </div>

          {/* Buyer Reviews Section (Replicated from app.js) */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Buyer Reviews ({reviews.length})
            </h3>

            {currentUser ? (
              <form
                onSubmit={handleSubmitReview}
                className="mb-6 pb-6 border-b border-gray-100"
              >
                <h4 className="text-sm font-bold mb-2 text-gray-800">
                  Leave a review
                </h4>
                <div className="mb-3">
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="bg-gray-50 border border-gray-200 text-sm font-medium rounded-lg px-3 py-2 outline-none focus:border-brand-orange transition"
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
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What do you think about this item or seller?"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 outline-none focus:border-brand-orange transition"
                ></textarea>
                <button
                  type="submit"
                  className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition shadow-sm"
                >
                  Submit Review
                </button>
              </form>
            ) : (
              <div className="mb-6 pb-6 border-b border-gray-100">
                <p className="text-sm text-gray-500">
                  Please{' '}
                  <Link href="/login" className="text-brand-orange font-bold hover:underline">
                    log in
                  </Link>{' '}
                  to leave a review for this ad.
                </p>
              </div>
            )}

            <div className="space-y-5">
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No reviews yet. Be the first!
                </p>
              ) : (
                reviews.map((r, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 shrink-0 overflow-hidden">
                      {r.avatar ? (
                        <img
                          src={resolveImg(r.avatar)}
                          alt={r.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        r.name?.[0] || 'U'
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">
                          {r.name}
                        </span>
                        <span className="text-xs text-gray-400">{r.date}</span>
                      </div>
                      <div className="text-amber-400 text-xs my-0.5">
                        {'★'.repeat(r.rating)}
                        {'☆'.repeat(5 - r.rating)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Price, Contact, Seller Shop & Safety Tips */}
        <div className="w-full lg:w-[360px] space-y-4 shrink-0">
          {/* Price & Actions Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm sticky top-20">
            <h2 className="text-3xl font-black text-gray-900 mb-1">
              {formatNaira(ad.price)}
            </h2>
            {ad.is_negotiable && (
              <p className="text-xs font-semibold text-brand-orange mb-4 inline-flex bg-orange-50 px-2 py-1 rounded">
                Negotiable
              </p>
            )}

            <div className="space-y-3 mt-4">
              <button
                type="button"
                disabled={isUnavailable}
                onClick={() => setShowPhone(true)}
                className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                  showPhone
                    ? 'bg-gray-100 text-gray-800 border border-gray-200'
                    : 'bg-orange-50 hover:bg-orange-100 text-brand-orange border border-orange-200'
                }`}
              >
                {showPhone ? (
                  <>
                    <Phone className="w-4 h-4" /> {formattedPhone || 'No phone listed'}
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-5 h-5" /> Show Contact
                  </>
                )}
              </button>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow transition ${
                  isUnavailable ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
              </a>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleToggleSave}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isSaved ? 'fill-brand-orange text-brand-orange' : ''
                    }`}
                  />{' '}
                  {isSaved ? 'Saved' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </div>
          </div>

          {/* Seller Shop Card */}
          <Link
            href={`/shop/${ad.user_id || ad.seller_id || ''}`}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4 group cursor-pointer hover:border-brand-orange transition"
          >
            <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-black text-lg shrink-0 overflow-hidden">
              {ad.seller_image ? (
                <img
                  src={resolveImg(ad.seller_image)}
                  alt={ad.seller_name || 'Seller'}
                  className="w-full h-full object-cover"
                />
              ) : (
                ad.seller_name?.[0] || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm truncate flex items-center gap-1.5 group-hover:text-brand-orange transition">
                {ad.seller_shop_name || ad.seller_name}
                {ad.seller_verified && (
                  <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                )}
              </h3>
              <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-brand-orange" /> {ad.shop_address || 'Nigeria'}
              </p>
              <span className="text-[10px] font-bold text-brand-orange mt-1.5 block">
                View Shop &amp; Reviews →
              </span>
            </div>
          </Link>

          {/* Safety Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h3 className="text-xs font-bold text-amber-900 mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Safety tips
            </h3>
            <ul className="text-[11px] text-amber-800 space-y-2 list-disc pl-4 marker:text-amber-400">
              <li>Avoid sending money upfront before receiving your item.</li>
              <li>Meet the seller at a safe public location.</li>
              <li>Inspect the item to ensure it matches the description.</li>
              <li>Pay only if you are satisfied.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Similar Items You Might Like (Replicated from app.js) */}
      {similarAds.length > 0 && (
        <div className="mt-12 pt-10 border-t border-gray-200">
          <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-orange" /> Similar items you might like
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {similarAds.map((item) => (
              <ProductCard key={item.id} ad={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}