"use client";

import { formatLastSeen } from "../utils/activity";
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
  Flag,
  X,
  Loader2,
  Star,
  Eye,
  Tag,
} from 'lucide-react';
import ProductCard from './ProductCard';

const API_URL = 'https://ji-africa-backend.onrender.com/api';

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
  const [adPageUrl, setAdPageUrl] = useState(`https://www.ji.africa/ad/${ad.id}`);
  const [viewsCount, setViewsCount] = useState<number>(Number(ad.views_count) || 0);

  // Reviews State (PostgreSQL + Local Fallback)
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerName, setOfferName] = useState("");
  const [offerPhone, setOfferPhone] = useState("");
  const [offerNote, setOfferNote] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [trustBuyerName, setTrustBuyerName] = useState("");
  const [trustBuyerPhone, setTrustBuyerPhone] = useState("");
  const [trustAddress, setTrustAddress] = useState("");
  const [startingTrust, setStartingTrust] = useState(false);

  // Request Callback Modal State
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [cbName, setCbName] = useState('');
  const [cbPhone, setCbPhone] = useState('');
  const [cbMessage, setCbMessage] = useState('');
  const [sendingCallback, setSendingCallback] = useState(false);

  // Report Ad Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Suspected scam or fraud');
  const [reportDetails, setReportDetails] = useState('');
  const [sendingReport, setSendingReport] = useState(false);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
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

  // Record unique session view & capture exact shareable ad URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAdPageUrl(window.location.href);
    }
    if (!ad?.id || typeof window === 'undefined') return;
    const viewKey = `ji_viewed_ad_${ad.id}`;
    if (!sessionStorage.getItem(viewKey)) {
      sessionStorage.setItem(viewKey, '1');
      fetch(`${API_URL}/ads/${ad.id}/view`, { method: 'POST' })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.views_count) setViewsCount(Number(data.views_count));
        })
        .catch(() => {});
    }
  }, [ad?.id]);

  // Load user, saved wishlist state & reviews from PostgreSQL
  useEffect(() => {
    const storedUser = localStorage.getItem('ji_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
        if (parsed.full_name) setCbName(parsed.full_name);
        if (parsed.phone) setCbPhone(parsed.phone);
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

    fetch(`${API_URL}/ads/${ad.id}/reviews`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.reviews) {
          setReviews(data.reviews);
        } else {
          const allReviews = JSON.parse(localStorage.getItem('ji_reviews') || '{}');
          setReviews(allReviews[String(ad.id)] || []);
        }
      })
      .catch(() => {
        try {
          const allReviews = JSON.parse(localStorage.getItem('ji_reviews') || '{}');
          setReviews(allReviews[String(ad.id)] || []);
        } catch {}
      });

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

      const token = localStorage.getItem('ji_token');
      if (token) {
        fetch(`${API_URL}/users/wishlist/toggle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ad_id: Number(ad.id) }),
        }).catch(() => {});
      }
    } catch {}
  };

  const handleShare = async () => {
    const formattedPrice = '₦' + Number(ad.price).toLocaleString('en-NG');
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${ad.title} for ${formattedPrice} on ji.africa`,
          text: `Check out this ad on ji.africa: ${ad.title} (${formattedPrice})`,
          url: adPageUrl,
        });
      } catch {}
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(adPageUrl);
      notify('Link copied to clipboard!');
    }
  };

  const handleRequestCallback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cbName.trim() || !cbPhone.trim()) return;
    setSendingCallback(true);

    try {
      const res = await fetch(`${API_URL}/ads/${ad.id}/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_name: cbName.trim(),
          buyer_phone: cbPhone.trim(),
          message: cbMessage.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        notify('Callback request sent to seller!');
        setShowCallbackModal(false);
        setCbMessage('');
      } else {
        notify(data.error || 'Could not send callback request');
      }
    } catch {
      notify('Network error sending callback');
    } finally {
      setSendingCallback(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingReport(true);
    try {
      const token = localStorage.getItem('ji_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/ads/${ad.id}/report`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reason: reportReason,
          details: reportDetails.trim(),
        }),
      });
      if (res.ok) {
        notify('Report submitted to ji.africa moderators.');
        setShowReportModal(false);
        setReportDetails('');
      } else {
        notify('Could not submit report');
      }
    } catch {
      notify('Network error submitting report');
    } finally {
      setSendingReport(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !comment.trim()) return;
    setSubmittingReview(true);

    try {
      const token = localStorage.getItem('ji_token');
      const res = await fetch(`${API_URL}/ads/${ad.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data?.flagged) {
          setComment('');
          setRating(5);
          notify(data.message || 'Review submitted for moderator approval.');
        } else if (data?.review) {
          setReviews((prev) => [
            data.review,
            ...prev.filter((r) => r.name !== currentUser.full_name),
          ]);
          setComment('');
          setRating(5);
          notify(data.updated ? 'Your previous review was updated!' : 'Review published!');
        }
      } else {
        notify(data?.error || 'You cannot review your own listing.');
      }
    } catch {
      notify('Network error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericOffer = Number(String(offerPrice).replace(/[^0-9.]/g, ""));
    if (!numericOffer || numericOffer <= 0) {
      notify("Enter a valid offer amount in Naira");
      return;
    }
    if (!offerName.trim() || !offerPhone.trim()) {
      notify("Please enter your name and phone number");
      return;
    }
    setSubmittingOffer(true);
    try {
      const res = await fetch(`${API_URL}/ads/${ad.id}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offered_price: numericOffer,
          buyer_name: offerName.trim(),
          buyer_phone: offerPhone.trim(),
          message: offerNote.trim(),
          buyer_id: currentUser?.id || currentUser?.userId || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        notify(data.message || "Offer sent to seller!");
        setShowOfferModal(false);
        setOfferNote("");
      } else {
        notify(data.error || "Could not send offer");
      }
    } catch {
      notify("Network error sending offer");
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleStartJiTrustCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("ji_token");
    if (!token || !currentUser) {
      notify("Please log in to use JI Trust Escrow Protection");
      router.push("/login");
      return;
    }
    if (!trustBuyerName.trim() || !trustBuyerPhone.trim()) {
      notify("Please enter your name and phone number");
      return;
    }
    setStartingTrust(true);
    try {
      const res = await fetch(`${API_URL}/payments/trust/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ad_id: ad.id,
          buyer_name: trustBuyerName.trim(),
          buyer_phone: trustBuyerPhone.trim(),
          delivery_address: trustAddress.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        notify(data.error || "Could not initialize JI Trust checkout");
        setStartingTrust(false);
      }
    } catch {
      notify("Network error initializing JI Trust");
      setStartingTrust(false);
    }
  };

  const formatNaira = (amount: number) => '₦' + Number(amount).toLocaleString('en-NG');
  const formattedPhone = formatPhoneNG(ad.seller_phone || '');
  const whatsappMessage = `Hello, I saw your ad on ji.africa:\n*${ad.title}* (${formatNaira(ad.price)})\n${adPageUrl}`;
  const whatsappLink = `https://wa.me/${formattedPhone.replace('+', '')}?text=${encodeURIComponent(
    whatsappMessage
  )}`;
  const whatsappShareLink = `https://wa.me/?text=${encodeURIComponent(
    `Check out *${ad.title}* for *${formatNaira(ad.price)}* in ${
      ad.shop_address || 'Nigeria'
    } on ji.africa:\n${adPageUrl}`
  )}`;

  const isUnavailable =
    ad.status === 'Unavailable' || ad.status === 'unavailable' || ad.status === 'Sold';

  const prevImage = () =>
    setCurrentImageIndex((i) => (i - 1 + images.length) % images.length);
  const nextImage = () =>
    setCurrentImageIndex((i) => (i + 1) % images.length);

  const specItems = [
    { label: 'Condition', value: ad.condition || 'Used' },
    ad.brand ? { label: 'Brand', value: ad.brand } : null,
    ad.attributes?.model ? { label: 'Model', value: ad.attributes.model } : null,
    ad.type ? { label: 'Type', value: ad.type } : null,
    ad.subcategory ? { label: 'Subcategory', value: ad.subcategory } : null,
    ad.sub_subcategory ? { label: 'Category Detail', value: ad.sub_subcategory } : null,
    ad.delivery_option ? { label: 'Delivery', value: ad.delivery_option } : null,
    { label: 'Negotiable', value: ad.is_negotiable ? 'Yes (Open to offers)' : 'Fixed Price' },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-brand-orange" />
          <span>{toast}</span>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="text-[11px] text-gray-500 font-semibold mb-4 flex flex-wrap items-center gap-1.5">
        <Link href="/" className="hover:text-brand-orange">
          Home
        </Link>
        {ad.category_name && (
          <>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/?category=${ad.category_id}`} className="hover:text-brand-orange">
              {ad.category_name}
            </Link>
          </>
        )}
        {ad.subcategory && (
          <>
            <ChevronRight className="w-3 h-3" />
            <Link
              href={`/?category=${ad.category_id}&subcategory=${encodeURIComponent(ad.subcategory)}`}
              className="hover:text-brand-orange"
            >
              {ad.subcategory}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-800 dark:text-gray-200 truncate max-w-[240px] sm:max-w-md">
          {ad.title}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Images, Mobile Sticky Price/Actions, Specs & Buyer Reviews */}
        <div className="flex-1 space-y-4 lg:space-y-6 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="relative bg-gray-950 aspect-[4/3] flex items-center justify-center group">
              <img
                src={images[currentImageIndex]}
                alt={ad.title}
                className="w-full h-full object-contain"
              />
              {ad.is_vip && (
                <span className="absolute top-3 left-3 bg-amber-400 text-gray-950 font-black text-[10px] uppercase px-2.5 py-1 rounded shadow">
                  {ad.vip_type || 'TOP'}
                </span>
              )}
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

          {/* Mobile Sticky Price & Horizontal 3-Button Contact Bar */}
          <div className="lg:hidden sticky top-[62px] z-30 bg-white/95 backdrop-blur rounded-xl border border-gray-200 p-3 shadow-md space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-xl font-black text-gray-900 truncate">
                  {formatNaira(ad.price)}
                </span>
                {ad.is_negotiable && (
                  <span className="text-[10px] font-bold text-brand-orange bg-orange-50 px-2 py-0.5 rounded shrink-0">
                    Negotiable
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleSave}
                  aria-label="Save Ad"
                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isSaved ? 'fill-brand-orange text-brand-orange' : ''
                    }`}
                  />
                </button>
                <a
                  href={whatsappShareLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on WhatsApp"
                  className="p-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] rounded-lg transition"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share Ad"
                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {showPhone && formattedPhone ? (
                <a
                  href={`tel:${formattedPhone}`}
                  className="py-2 px-1.5 rounded-lg text-[11px] font-bold bg-gray-100 text-gray-900 border border-gray-200 flex items-center justify-center gap-1 truncate"
                >
                  <Phone className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                  <span className="truncate">{formattedPhone}</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled={isUnavailable}
                  onClick={() => setShowPhone(true)}
                  className="py-2 px-1.5 rounded-lg text-[11px] font-bold bg-orange-50 hover:bg-orange-100 text-brand-orange border border-orange-200 flex items-center justify-center gap-1 transition disabled:opacity-50"
                >
                  <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Show Contact</span>
                </button>
              )}

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`py-2 px-1.5 rounded-lg text-[11px] font-bold bg-[#25D366] hover:bg-[#128C7E] text-white flex items-center justify-center gap-1 shadow-xs transition ${
                  isUnavailable ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">WhatsApp</span>
              </a>

              <button
                type="button"
                disabled={isUnavailable}
                onClick={() => setShowCallbackModal(true)}
                className="py-2 px-1.5 rounded-lg text-[11px] font-bold bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center gap-1 transition disabled:opacity-50"
              >
                <PhoneCall className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                <span className="truncate">Call Back</span>
              </button>
            </div>
          </div>

          {isUnavailable ? (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-xl">
              <Slash className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-800">
                  This item is currently marked as {ad.status}
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  The seller has marked this item as sold or temporarily unavailable.
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
                className="bg-brand-orange hover:bg-orange-700 text-white px-5 py-2 rounded-lg text-xs font-bold shadow transition shrink-0"
              >
                Post ad like this
              </Link>
            </div>
          )}

          {/* Product Specifications & Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">{ad.title}</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">
                <Eye className="w-3.5 h-3.5 text-brand-orange" /> {viewsCount} views
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-5">
              <span className="inline-flex items-center gap-1 font-semibold text-gray-700">
                <MapPin className="w-3.5 h-3.5 text-brand-orange" /> {ad.shop_address || 'Nigeria'}
              </span>
              {ad.brand && (
                <Link
                  href={`/?category=${ad.category_id}&brand=${encodeURIComponent(ad.brand)}`}
                  className="inline-flex items-center gap-1 bg-orange-50 text-brand-orange px-2.5 py-0.5 rounded-full font-bold hover:bg-orange-100 transition"
                >
                  <Tag className="w-3 h-3" /> {ad.brand}
                </Link>
              )}
            </div>

            {/* Structured Specification Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 pt-4 border-t border-gray-100">
              {specItems.map((spec) => (
                <div
                  key={spec.label}
                  className="bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700/80 rounded-lg p-3"
                >
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">
                    {spec.label}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5 truncate">
                    {spec.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-bold text-gray-800 mb-2">Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {ad.description}
              </p>
            </div>

            {ad.youtube_link && (
              <div className="mt-6 border-t border-gray-100 pt-5">
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

          {/* Buyer Reviews Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Buyer Reviews ({reviews.length})
            </h3>

            {currentUser && Number(currentUser.id || currentUser.userId || 0) > 0 && Number(currentUser.id || currentUser.userId) === Number(ad.user_id || ad.seller_id || ad.user?.id || ad.seller?.id || 0) ? (
              <div className="mb-6 pb-5 border-b border-gray-100 bg-gray-50 p-3.5 rounded-xl text-xs text-gray-600">
                <p className="font-bold text-gray-800">Seller Listing View</p>
                <p className="mt-0.5">Self-reviews are disabled on your own adverts.</p>
              </div>
            ) : currentUser ?  (
              <form
                onSubmit={handleSubmitReview}
                className="mb-6 pb-6 border-b border-gray-100"
              >
                <div className="mb-3">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">
                    Tap a Star to Rate
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = (hoverRating || rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="p-0.5 transition-transform duration-150 hover:scale-125 active:scale-95 focus:outline-none"
                        >
                          <Star
                            className={`w-6 h-6 transition-all duration-150 ${
                              active
                                ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="ml-2 text-xs font-bold text-gray-600">
                      {rating}/5
                    </span>
                  </div>
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
                  disabled={submittingReview}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition shadow-sm inline-flex items-center gap-2 disabled:opacity-60"
                >
                  {submittingReview && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
                  <div key={r.id || i} className="flex gap-3">
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
                      <div className="flex items-center gap-0.5 my-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= Number(r.rating || 5)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Desktop Price/Contact Card + Seller Shop & Safety */}
        <div className="w-full lg:w-[360px] space-y-4 shrink-0">
          <div className="hidden lg:block bg-white rounded-xl border border-gray-200 p-6 shadow-sm sticky top-20">
            <h2 className="text-3xl font-black text-gray-900 mb-1">
              {formatNaira(ad.price)}
            </h2>
            {ad.is_negotiable && (
              <p className="text-xs font-semibold text-brand-orange mb-4 inline-flex bg-orange-50 px-2 py-1 rounded">
                Negotiable
              </p>
            )}

            <div className="space-y-2.5 mt-4">
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

              <button
                type="button"
                disabled={isUnavailable}
                onClick={() => setShowCallbackModal(true)}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <PhoneCall className="w-4 h-4 text-brand-orange" /> Request Seller Callback
              </button>
                {ad.ji_trust_enabled && ad.status !== "Sold" && !(currentUser && Number(currentUser.id || currentUser.userId || 0) > 0 && Number(currentUser.id || currentUser.userId) === Number(ad.user_id || ad.seller_id || ad.user?.id || 0)) && (
                  <button
                    type="button"
                    onClick={() => setShowTrustModal(true)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    🛡️ Buy Safely with JI Trust (Escrow)
                  </button>
                )}

                {ad.status === "Sold" ? (
                  <div className="w-full py-2.5 bg-gray-200 text-gray-700 rounded-xl text-xs font-black text-center uppercase tracking-wider">
                    Item Marked as Sold
                  </div>
                ) : !(currentUser && Number(currentUser.id || currentUser.userId || 0) > 0 && Number(currentUser.id || currentUser.userId) === Number(ad.user_id || ad.seller_id || ad.user?.id || 0)) ? (
                  <button
                    type="button"
                    onClick={() => {
                      const suggested = Math.round(Number(ad.price || 0) * 0.9);
                      if (!offerPrice && suggested > 0) setOfferPrice(String(suggested));
                      setShowOfferModal(true);
                    }}
                    className="w-full py-2.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-brand-orange rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5"
                  >
                    Make an Offer
                  </button>
                ) : null}

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleToggleSave}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      isSaved ? 'fill-brand-orange text-brand-orange' : ''
                    }`}
                  />{' '}
                  {isSaved ? 'Saved' : 'Save'}
                </button>
                <a
                  href={whatsappShareLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Forward
                </a>
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition"
                >
                  <Share2 className="w-3.5 h-3.5" /> Copy
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

          {/* Safety Warning + Report Ad */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-amber-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Safety tips
            </h3>
            <ul className="text-[11px] text-amber-800 space-y-2 list-disc pl-4 marker:text-amber-400">
              <li>Avoid sending money upfront before receiving your item.</li>
              <li>Meet the seller at a safe public location.</li>
              <li>Inspect the item to ensure it matches the description.</li>
              <li>Pay only if you are satisfied.</li>
            </ul>
            <div className="pt-2 border-t border-amber-200/70">
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="w-full py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Flag className="w-3.5 h-3.5" /> Report This Advert
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Items You Might Like */}
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

      {/* REQUEST CALLBACK MODAL */}
      {showCallbackModal && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
              <h3 className="font-black text-sm flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-brand-orange" /> Request a Callback
              </h3>
              <button
                type="button"
                onClick={() => setShowCallbackModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRequestCallback} className="p-5 space-y-3.5">
              <p className="text-xs text-gray-500">
                Leave your phone number and the seller of{' '}
                <span className="font-bold text-gray-800">{ad.title}</span> will call you back shortly.
              </p>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={cbName}
                  onChange={(e) => setCbName(e.target.value)}
                  placeholder="e.g. Chinedu Okafor"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-orange"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Your Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={cbPhone}
                  onChange={(e) => setCbPhone(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-orange"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  value={cbMessage}
                  onChange={(e) => setCbMessage(e.target.value)}
                  placeholder="e.g. Is the price still negotiable?"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-orange"
                />
              </div>
              <button
                type="submit"
                disabled={sendingCallback}
                className="w-full py-3 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {sendingCallback && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Callback Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REPORT AD MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 bg-red-600 text-white flex items-center justify-between">
              <h3 className="font-black text-sm flex items-center gap-2">
                <Flag className="w-4 h-4" /> Report Suspicious Advert
              </h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-red-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitReport} className="p-5 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Reason *
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-red-500"
                >
                  <option value="Suspected scam or fraud">Suspected scam or fraud</option>
                  <option value="Prohibited or illegal item">Prohibited or illegal item</option>
                  <option value="Item already sold / fake listing">Item already sold / fake listing</option>
                  <option value="Wrong category or misleading price">Wrong category or misleading price</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Additional Details
                </label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide any details to help our moderation team..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-500"
                />
              </div>
              <button
                type="submit"
                disabled={sendingReport}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {sendingReport && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Report to Moderators
              </button>
            </form>
          </div>
        </div>
      )}
    
      {showOfferModal && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm">Make an Offer</h3>
                <p className="text-[11px] text-gray-300 truncate max-w-xs">{ad.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowOfferModal(false)}
                className="text-gray-400 hover:text-white text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitOffer} className="p-5 space-y-4">
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">Seller Asking Price</span>
                <span className="text-sm font-black text-gray-900">₦{Number(ad.price || 0).toLocaleString("en-NG")}</span>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-600 mb-1.5">
                  Your Offer Amount (₦)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-black text-brand-orange outline-none focus:border-brand-orange"
                  placeholder="e.g. 195000"
                />
                {Number(ad.price || 0) > 0 && (
                  <div className="flex gap-2 mt-2">
                    {[0.95, 0.9, 0.85].map((pct) => {
                      const val = Math.round(Number(ad.price) * pct);
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setOfferPrice(String(val))}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-orange-100 hover:text-brand-orange rounded-lg text-[11px] font-bold text-gray-700 transition"
                        >
                          -{Math.round((1 - pct) * 100)}% (₦{val.toLocaleString("en-NG")})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={offerName}
                    onChange={(e) => setOfferName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={offerPhone}
                    onChange={(e) => setOfferPhone(e.target.value)}
                    placeholder="08012345678"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Note to Seller (Optional)</label>
                <input
                  type="text"
                  value={offerNote}
                  onChange={(e) => setOfferNote(e.target.value)}
                  placeholder="e.g. Ready to inspect and pay today in Abuja"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
                />
              </div>

              <button
                type="submit"
                disabled={submittingOffer}
                className="w-full py-3 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-md disabled:opacity-60"
              >
                {submittingOffer ? "Sending Offer..." : "Send Offer to Seller"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showTrustModal && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm">🛡️ JI Trust Escrow Protection</h3>
                <p className="text-[11px] text-emerald-200 truncate max-w-xs">{ad.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowTrustModal(false)}
                className="text-emerald-200 hover:text-white text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleStartJiTrustCheckout} className="p-5 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1.5 text-xs text-emerald-950">
                <div className="flex justify-between font-black text-sm">
                  <span>Escrow Amount</span>
                  <span className="text-emerald-700">₦{Number(ad.price || 0).toLocaleString("en-NG")}</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  1. Your money is held safely by <strong>ji.africa</strong>—not sent to the seller yet.<br />
                  2. Seller ships/delivers upon escrow confirmation.<br />
                  3. You have <strong>72 hours</strong> after dispatch to inspect &amp; confirm receipt before payout.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={trustBuyerName}
                    onChange={(e) => setTrustBuyerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={trustBuyerPhone}
                    onChange={(e) => setTrustBuyerPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Delivery Address / Meetup Location</label>
                <input
                  type="text"
                  required
                  value={trustAddress}
                  onChange={(e) => setTrustAddress(e.target.value)}
                  placeholder="e.g. Wuse 2, Abuja or Park Waybill"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <button
                type="submit"
                disabled={startingTrust}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md disabled:opacity-60"
              >
                {startingTrust ? "Securing Escrow..." : "Proceed to Fund JI Trust"}
              </button>
            </form>
          </div>
        </div>
      )}
</div>
  );
}
