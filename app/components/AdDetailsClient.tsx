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
  ShieldCheck,
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
  CreditCard,
  Building2,
  Smartphone,
  PlusCircle,
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

  // Reviews State
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Offer Modal State
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerName, setOfferName] = useState('');
  const [offerPhone, setOfferPhone] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);

  // JI Trust Escrow Modal State
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [showTrustInfoModal, setShowTrustInfoModal] = useState(false);
  const [trustBuyerName, setTrustBuyerName] = useState('');
  const [trustBuyerPhone, setTrustBuyerPhone] = useState('');
  const [trustAddress, setTrustAddress] = useState('');
  const [startingTrust, setStartingTrust] = useState(false);
  const [trustCheckoutStep, setTrustCheckoutStep] = useState<'details' | 'paystack' | 'receipt'>('details');
  const [trustOrderData, setTrustOrderData] = useState<any>(null);
  const [payMethod, setPayMethod] = useState<'card' | 'transfer' | 'ussd'>('card');
  const [confirmingPaystack, setConfirmingPaystack] = useState(false);

  // Callback Modal State
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [cbName, setCbName] = useState('');
  const [cbPhone, setCbPhone] = useState('');
  const [cbMessage, setCbMessage] = useState('');
  const [sendingCallback, setSendingCallback] = useState(false);

  // Report & Share Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [reportReason, setReportReason] = useState('Suspected scam or fraud');
  const [reportDetails, setReportDetails] = useState('');
  const [sendingReport, setSendingReport] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  };

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

  useEffect(() => {
    const storedUser = localStorage.getItem('ji_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
        if (parsed.full_name) {
          setCbName(parsed.full_name);
          setOfferName(parsed.full_name);
          setTrustBuyerName(parsed.full_name);
        }
        if (parsed.phone) {
          setCbPhone(parsed.phone);
          setOfferPhone(parsed.phone);
          setTrustBuyerPhone(parsed.phone);
        }
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

  const handleStartInAppChat = async () => {
    const token = localStorage.getItem('ji_token');
    if (!token || !currentUser) {
      localStorage.setItem('ji_redirect_after_login', `/ad/${ad.id}`);
      router.push('/login');
      return;
    }
    setStartingChat(true);
    try {
      const res = await fetch(`${API_URL}/chat/threads/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ad_id: Number(ad.id) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.thread?.id) {
        router.push(`/messages?thread=${data.thread.id}`);
      } else {
        notify(data.error || 'Could not open chat with seller');
      }
    } catch {
      notify('Network error opening chat');
    } finally {
      setStartingChat(false);
    }
  };

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

  const handleTriggerShare = async () => {
    const shareUrl =
      typeof window !== 'undefined'
        ? window.location.href
        : `https://www.ji.africa/ad/${ad?.id || ''}`;
    const shareTitle = ad?.title || 'Listing on ji.africa';
    const shareText = `${shareTitle} — ₦${Number(ad?.price || 0).toLocaleString('en-NG')} on ji.africa`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard?.writeText(shareUrl);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 3000);
    } catch {}
    setShowShareModal(true);
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
    const numericOffer = Number(String(offerPrice).replace(/[^0-9.]/g, ''));
    if (!numericOffer || numericOffer <= 0) {
      notify('Enter a valid offer amount in Naira');
      return;
    }
    if (!offerName.trim() || !offerPhone.trim()) {
      notify('Please enter your name and phone number');
      return;
    }
    setSubmittingOffer(true);
    try {
      const res = await fetch(`${API_URL}/ads/${ad.id}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        notify(data.message || 'Offer sent to seller!');
        setShowOfferModal(false);
        setOfferNote('');
      } else {
        notify(data.error || 'Could not send offer');
      }
    } catch {
      notify('Network error sending offer');
    } finally {
      setSubmittingOffer(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const trustRef = params.get('trust_ref') || params.get('reference') || params.get('trxref');
    if (!trustRef || !trustRef.startsWith('JITRUST_')) return;

    const token = localStorage.getItem('ji_token');
    fetch(`${API_URL}/payments/trust/verify/${encodeURIComponent(trustRef)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.status === 'funded' && data?.order) {
          setTrustOrderData({
            reference: data.order.reference,
            amount: Number(data.order.item_amount || ad.price || 0),
            buyer_name: data.order.buyer_name || '',
            buyer_phone: data.order.buyer_phone || '',
            delivery_address: data.order.delivery_address || '',
            demo_mode: false,
          });
          setTrustCheckoutStep('receipt');
          setShowTrustModal(true);
          window.dispatchEvent(new Event('ji_notifications_updated'));
          window.history.replaceState({}, '', window.location.pathname);
        }
      })
      .catch(() => {});
  }, [ad.id, ad.price]);

  const handleStartJiTrustCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('ji_token');
    if (!token || !currentUser) {
      notify('Please log in to use JI Trust Escrow Protection');
      router.push('/login');
      return;
    }
    if (!trustBuyerName.trim() || !trustBuyerPhone.trim()) {
      notify('Please enter your name and phone number');
      return;
    }
    setStartingTrust(true);
    try {
      const res = await fetch(`${API_URL}/payments/trust/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      if (res.ok && data.reference) {
        setStartingTrust(false);
        if (!data.demo_mode && data.authorization_url && !data.authorization_url.includes('demo=1')) {
          window.location.href = data.authorization_url;
          return;
        }
        setTrustOrderData({
          reference: data.reference,
          amount: Number(ad.price || 0),
          buyer_name: trustBuyerName.trim(),
          buyer_phone: trustBuyerPhone.trim(),
          delivery_address: trustAddress.trim(),
          demo_mode: Boolean(data.demo_mode),
        });
        setTrustCheckoutStep('paystack');
      } else {
        notify(data.error || 'Could not initialize JI Trust checkout');
        setStartingTrust(false);
      }
    } catch {
      notify('Network error initializing JI Trust');
      setStartingTrust(false);
    }
  };

  const handleCompletePaystackTrustPayment = async () => {
    if (!trustOrderData?.reference) return;
    const token = localStorage.getItem('ji_token');
    setConfirmingPaystack(true);
    try {
      const demoParam = trustOrderData.demo_mode ? '?demo=1' : '';
      const res = await fetch(
        `${API_URL}/payments/trust/verify/${encodeURIComponent(trustOrderData.reference)}${demoParam}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.status === 'funded') {
        setTrustCheckoutStep('receipt');
        window.dispatchEvent(new Event('ji_notifications_updated'));
        notify('Payment confirmed! Funds secured in JI Trust Escrow.');
      } else {
        notify(data.error || 'Could not verify payment yet');
      }
    } catch {
      notify('Network error confirming payment');
    } finally {
      setConfirmingPaystack(false);
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

  const isOwner = Boolean(
    currentUser &&
      Number(currentUser.id || currentUser.userId || 0) > 0 &&
      Number(currentUser.id || currentUser.userId) ===
        Number(ad.user_id || ad.seller_id || ad.user?.id || ad.seller?.id || 0)
  );

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
    { label: 'Negotiable', value: ad.is_negotiable ? 'Yes (Open to offers)' : 'Fixed price' },
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
        <span className="text-gray-900 dark:text-gray-100 font-bold truncate max-w-[240px] sm:max-w-md">
          {ad.title}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT COLUMN: Gallery -> Title & Specs -> Description -> Buyer Reviews */}
        <div className="flex-1 space-y-5 min-w-0 w-full">
          {/* Image Gallery */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white text-gray-800 w-9 h-9 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white text-gray-800 w-9 h-9 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <span className="absolute bottom-3 left-3 bg-black/65 text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                    {currentImageIndex + 1} / {images.length}
                  </span>
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
                        ? 'border-brand-orange'
                        : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Mobile Sticky Price & Clean 3-Button Contact Bar */}
          <div className="lg:hidden sticky top-[62px] z-30 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-3.5 shadow-md space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-2xl font-black text-brand-orange dark:text-orange-400 tracking-tight truncate">
                  {formatNaira(ad.price)}
                </span>
                <span className="text-[11px] font-semibold text-gray-500 shrink-0">
                  {ad.is_negotiable ? 'Negotiable' : 'Fixed price'}
                </span>
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
                <button
                  type="button"
                  onClick={handleTriggerShare}
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
                  className="py-2 px-1.5 rounded-lg text-[11px] font-bold bg-brand-orange text-white flex items-center justify-center gap-1 truncate"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{formattedPhone}</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled={isUnavailable}
                  onClick={() => setShowPhone(true)}
                  className="py-2 px-1.5 rounded-lg text-[11px] font-bold bg-brand-orange hover:bg-orange-700 text-white flex items-center justify-center gap-1 transition disabled:opacity-50"
                >
                  <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Show Contact</span>
                </button>
              )}

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`py-2 px-1.5 rounded-lg text-[11px] font-bold border border-[#25D366] text-[#128C7E] bg-[#25D366]/10 flex items-center justify-center gap-1 transition ${
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
                className="py-2 px-1.5 rounded-lg text-[11px] font-bold border border-gray-200 bg-gray-50 text-gray-800 flex items-center justify-center gap-1 transition disabled:opacity-50"
              >
                <PhoneCall className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                <span className="truncate">Call Back</span>
              </button>
            </div>

            {!isUnavailable && !isOwner && (
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  disabled={startingChat}
                  onClick={handleStartInAppChat}
                  className="py-2 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-brand-orange" />
                  {startingChat ? 'Opening...' : 'In-App Chat / Quote'}
                </button>
                {ad.ji_trust_enabled ? (
                  <button
                    type="button"
                    onClick={() => {
                      setTrustCheckoutStep('details');
                      setShowTrustModal(true);
                    }}
                    className="py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black flex items-center justify-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> JI Trust Escrow
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const suggested = Math.round(Number(ad.price || 0) * 0.9);
                      if (!offerPrice && suggested > 0) setOfferPrice(String(suggested));
                      setShowOfferModal(true);
                    }}
                    className="py-2 px-2 bg-orange-50 text-brand-orange border border-orange-200 rounded-lg text-[11px] font-black"
                  >
                    Make an Offer
                  </button>
                )}
              </div>
            )}
          </div>

          {isUnavailable && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-xl">
              <Slash className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-800">
                  This item is currently marked as {ad.status}
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  The seller has marked this item as sold or temporarily unavailable.
                </p>
              </div>
            </div>
          )}

          {/* Clean Product Title, Specs & Description Card (Directly Under Gallery) */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug">
                {ad.title}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">
                <Eye className="w-3.5 h-3.5 text-brand-orange" /> {viewsCount} views
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-500 pb-5 border-b border-gray-100">
              <span className="inline-flex items-center gap-1 font-medium text-gray-600">
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
              {ad.ji_trust_enabled && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                  <ShieldCheck className="w-3 h-3" /> JI Trust Protected
                </span>
              )}
            </div>

            {/* Single Scannable 2-Column Specification Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 py-5 border-b border-gray-100">
              {specItems.map((spec) => (
                <div key={spec.label} className="min-w-0">
                  <p className="text-xs sm:text-sm font-extrabold ji-spec-value truncate">
                    {spec.value}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider font-bold ji-spec-label mt-0.5">
                    {spec.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-5">
              <h3 className="text-sm font-bold text-gray-800 mb-2">Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {ad.description}
              </p>
            </div>

            {ad.youtube_link && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <a
                  href={
                    ad.youtube_link.startsWith('http')
                      ? ad.youtube_link
                      : `https://${ad.youtube_link}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-brand-orange hover:underline"
                >
                  <ExternalLink className="w-4 h-4" /> View External Link / Product Video
                </a>
              </div>
            )}
          </div>

          {/* Buyer Reviews Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
            <h3 className="text-base font-black text-gray-900 mb-4">
              Buyer Reviews ({reviews.length})
            </h3>

            {isOwner ? (
              <div className="mb-5 pb-4 border-b border-gray-100 bg-gray-50 p-3.5 rounded-xl text-xs text-gray-600">
                <p className="font-bold text-gray-800">Seller Listing View</p>
                <p className="mt-0.5">Self-reviews are disabled on your own adverts.</p>
              </div>
            ) : currentUser ? (
              <form onSubmit={handleSubmitReview} className="mb-6 pb-6 border-b border-gray-100">
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
                              active ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="ml-2 text-xs font-bold text-gray-600">{rating}/5</span>
                  </div>
                </div>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this item or seller..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 outline-none focus:border-brand-orange transition"
                ></textarea>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition shadow-xs inline-flex items-center gap-2 disabled:opacity-60"
                >
                  {submittingReview && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Review
                </button>
              </form>
            ) : (
              <div className="mb-5 pb-5 border-b border-gray-100">
                <p className="text-xs text-gray-500">
                  Please{' '}
                  <Link href="/login" className="text-brand-orange font-bold hover:underline">
                    log in
                  </Link>{' '}
                  to leave a review for this ad.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-xs text-gray-500">No reviews yet. Be the first!</p>
              ) : (
                reviews.map((r, i) => (
                  <div key={r.id || i} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-600 shrink-0 overflow-hidden">
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
                        <span className="font-bold text-xs text-gray-900">{r.name}</span>
                        <span className="text-[11px] text-gray-400">{r.date}</span>
                      </div>
                      <div className="flex items-center gap-0.5 my-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= Number(r.rating || 5)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{r.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Clean Jiji-Style Modular Cards */}
        <div className="w-full lg:w-[350px] space-y-3.5 shrink-0 lg:sticky lg:top-20">
          {/* CARD 1: Price + Request Call Back (Desktop) */}
          <div className="hidden lg:block bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3.5">
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                  {formatNaira(ad.price)}
                </h2>
                {ad.stock_quantity !== null &&
                  ad.stock_quantity !== undefined &&
                  Number(ad.stock_quantity) > 0 && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {ad.stock_quantity} left
                    </span>
                  )}
              </div>
              <p className="text-xs font-medium text-gray-500 mt-0.5">
                {ad.is_negotiable ? 'Negotiable' : 'Fixed price'}
              </p>
            </div>

            <button
              type="button"
              disabled={isUnavailable}
              onClick={() => setShowCallbackModal(true)}
              className="w-full py-2.5 rounded-xl border border-brand-orange/40 bg-orange-50/50 hover:bg-orange-50 text-brand-orange text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
            >
              Request call back
            </button>
          </div>

          {/* CARD 2: Seller Profile + Direct Contact */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3.5">
            <Link
              href={`/shop/${ad.user_id || ad.seller_id || ''}`}
              className="flex items-center gap-3.5 group"
            >
              <div className="w-12 h-12 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center font-black text-lg shrink-0 overflow-hidden border border-gray-200">
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
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {ad.ji_trust_enabled && (
                    <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      <ShieldCheck className="w-2.5 h-2.5" /> JI Trust Verified
                    </span>
                  )}
                  <span className="text-[11px] text-gray-500 truncate">
                    {ad.shop_address || 'Nigeria'}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-brand-orange mt-1 inline-block">
                  View shop &amp; reviews &rarr;
                </span>
              </div>
            </Link>

            <div className="hidden lg:block space-y-2.5 pt-1">
              {showPhone && formattedPhone ? (
                <a
                  href={`tel:${formattedPhone}`}
                  className="w-full py-3 rounded-xl bg-brand-orange text-white font-black text-sm flex items-center justify-center gap-2 shadow-xs"
                >
                  <Phone className="w-4 h-4" /> {formattedPhone}
                </a>
              ) : (
                <button
                  type="button"
                  disabled={isUnavailable}
                  onClick={() => setShowPhone(true)}
                  className="w-full py-3 rounded-xl bg-brand-orange hover:bg-orange-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  <PhoneCall className="w-4 h-4" /> Show Contact
                </button>
              )}

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-2.5 rounded-xl border border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10 font-bold text-xs flex items-center justify-center gap-2 transition ${
                  isUnavailable ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
              </a>

              {!isUnavailable && !isOwner && (
                <button
                  type="button"
                  disabled={startingChat}
                  onClick={handleStartInAppChat}
                  className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle className="w-4 h-4 text-brand-orange" />
                  {startingChat ? 'Opening Chat...' : 'Start Chat / Custom Quote'}
                </button>
              )}
            </div>
          </div>

          {/* CARD 3: JI Trust Escrow & Make an Offer (Desktop) */}
          {!isUnavailable && (ad.ji_trust_enabled || !isOwner) && (
            <div className="hidden lg:block bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-2.5">
              {ad.ji_trust_enabled && (
                <div className="space-y-1.5">
                  {isOwner ? (
                    <div className="w-full py-2.5 px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> JI Trust Escrow Active
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTrustCheckoutStep('details');
                        setShowTrustModal(true);
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" /> Buy Safely with JI Trust
                    </button>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
                    <span>100% Buyer Protection</span>
                    <button
                      type="button"
                      onClick={() => setShowTrustInfoModal(true)}
                      className="font-bold text-emerald-700 hover:underline"
                    >
                      How it works
                    </button>
                  </div>
                </div>
              )}

              {!isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    const suggested = Math.round(Number(ad.price || 0) * 0.9);
                    if (!offerPrice && suggested > 0) setOfferPrice(String(suggested));
                    setShowOfferModal(true);
                  }}
                  className="w-full py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
                >
                  Make an Offer
                </button>
              )}
            </div>
          )}

          {/* CARD 4: Compact Share Strip + Jiji-Style 2-Column Governance Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-xs space-y-2.5">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleToggleSave}
                className="py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
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
                className="py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[#128C7E] rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Forward
              </a>
              <button
                type="button"
                onClick={handleTriggerShare}
                className="py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setReportReason('Item is Out of Stock / Unavailable');
                  setShowReportModal(true);
                }}
                className="py-2 px-2 bg-white hover:bg-amber-50 text-amber-800 border border-gray-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition"
              >
                <Flag className="w-3 h-3 text-amber-600 shrink-0" /> Out of Stock
              </button>
              <button
                type="button"
                onClick={() => {
                  setReportReason('Suspected scam or fraud');
                  setShowReportModal(true);
                }}
                className="py-2 px-2 bg-white hover:bg-red-50 text-red-600 border border-gray-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition"
              >
                <Flag className="w-3 h-3 shrink-0" /> Report Abuse
              </button>
            </div>
          </div>

          {/* CARD 5: Clean Safety Tips */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-2">
            <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" /> Safety tips
            </h3>
            <ul className="text-[11px] text-gray-600 space-y-1.5 list-disc pl-4 marker:text-gray-400">
              <li>Avoid sending money upfront before inspecting your item.</li>
              <li>Meet the seller at a safe, open public location.</li>
              <li>Inspect the item thoroughly to confirm it matches the ad.</li>
              <li>Use JI Trust Escrow when buying from verified sellers.</li>
            </ul>
          </div>

          {/* CARD 6: Post Ad Like This (Clean Jiji Bottom Placement) */}
          <Link
            href="/sell"
            className="w-full py-3 bg-white hover:bg-orange-50 border border-brand-orange/40 text-brand-orange rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" /> Post Ad Like This
          </Link>
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

      {/* SHARE ADVERT MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
              <h3 className="font-black text-sm flex items-center gap-2">
                <Share2 className="w-4 h-4 text-brand-orange" /> Share This Advert
              </h3>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-600 line-clamp-2 font-medium">
                {ad.title} —{' '}
                <span className="font-black text-brand-orange">
                  ₦{Number(ad.price || 0).toLocaleString('en-NG')}
                </span>
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${ad.title} (₦${Number(ad.price || 0).toLocaleString('en-NG')}) - https://www.ji.africa/ad/${ad.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] text-xs font-black text-center transition"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${ad.title} (₦${Number(ad.price || 0).toLocaleString('en-NG')}) on @jiafrica`)}&url=${encodeURIComponent(`https://www.ji.africa/ad/${ad.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-black text-center transition"
                >
                  Post on X
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://www.ji.africa/ad/${ad.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-700 text-xs font-black text-center transition"
                >
                  Facebook
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(`https://www.ji.africa/ad/${ad.id}`)}&text=${encodeURIComponent(`${ad.title} (₦${Number(ad.price || 0).toLocaleString('en-NG')})`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 text-xs font-black text-center transition"
                >
                  Telegram
                </a>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={`https://www.ji.africa/ad/${ad.id}`}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard?.writeText(`https://www.ji.africa/ad/${ad.id}`);
                      setCopiedShareLink(true);
                      setTimeout(() => setCopiedShareLink(false), 3000);
                    } catch {}
                  }}
                  className="px-4 py-2 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-xs font-black shrink-0 transition"
                >
                  {copiedShareLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT AD MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 bg-red-600 text-white flex items-center justify-between">
              <h3 className="font-black text-sm flex items-center gap-2">
                <Flag className="w-4 h-4" /> Report Advert
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
                  <option value="Item is Out of Stock / Unavailable">Item is Out of Stock / Unavailable</option>
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

      {/* MAKE AN OFFER MODAL */}
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
                <span className="text-sm font-black text-gray-900">
                  ₦{Number(ad.price || 0).toLocaleString('en-NG')}
                </span>
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
                          -{Math.round((1 - pct) * 100)}% (₦{val.toLocaleString('en-NG')})
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
                {submittingOffer ? 'Sending Offer...' : 'Send Offer to Seller'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* JI TRUST ESCROW CHECKOUT MODAL */}
      {showTrustModal && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          {trustCheckoutStep === 'details' && (
            <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-gray-200 text-gray-900">
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
                    <span className="text-emerald-700">₦{Number(ad.price || 0).toLocaleString('en-NG')}</span>
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
                  {startingTrust ? 'Initializing Paystack Checkout...' : 'Proceed to Paystack Payment'}
                </button>
              </form>
            </div>
          )}

          {trustCheckoutStep === 'paystack' && trustOrderData && (
            <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-gray-200 text-gray-900">
              <div className="p-4 bg-[#011B33] text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-[#0BA4DB] flex items-center justify-center font-black text-xs text-white">
                    P
                  </div>
                  <div>
                    <p className="text-xs font-black tracking-wide">Paystack Secure Checkout</p>
                    <p className="text-[10px] text-sky-200">{currentUser?.email || 'buyer@ji.africa'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-300 uppercase">Pay</p>
                  <p className="text-sm font-black text-[#0BA4DB]">
                    ₦{Number(trustOrderData.amount).toLocaleString('en-NG')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-50 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPayMethod('card')}
                  className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
                    payMethod === 'card'
                      ? 'border-[#0BA4DB] text-[#011B33] bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#0BA4DB]" /> Card
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod('transfer')}
                  className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
                    payMethod === 'transfer'
                      ? 'border-[#0BA4DB] text-[#011B33] bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-[#0BA4DB]" /> Transfer
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod('ussd')}
                  className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
                    payMethod === 'ussd'
                      ? 'border-[#0BA4DB] text-[#011B33] bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#0BA4DB]" /> USSD
                </button>
              </div>

              <div className="p-5 space-y-4">
                {payMethod === 'card' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Card Number</label>
                      <input
                        type="text"
                        defaultValue="4084 0840 8408 4081"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs font-mono font-bold tracking-wider outline-none focus:border-[#0BA4DB]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Card Expiry</label>
                        <input
                          type="text"
                          defaultValue="09 / 29"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs font-mono font-bold outline-none focus:border-[#0BA4DB]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">CVV</label>
                        <input
                          type="password"
                          defaultValue="408"
                          maxLength={4}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs font-mono font-bold outline-none focus:border-[#0BA4DB]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {payMethod === 'transfer' && (
                  <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-center space-y-1.5">
                    <p className="text-[11px] font-bold text-gray-600">Transfer exact amount to JI Trust Escrow Account:</p>
                    <p className="text-lg font-black font-mono text-[#011B33] tracking-wider">9940281745</p>
                    <p className="text-xs font-bold text-[#0BA4DB]">Paystack-Titan • JI AFRICA ESCROW</p>
                    <p className="text-[11px] text-gray-500 pt-1">Ref: {trustOrderData.reference}</p>
                  </div>
                )}

                {payMethod === 'ussd' && (
                  <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-center space-y-1.5">
                    <p className="text-[11px] font-bold text-gray-600">Dial your bank USSD code to authorize escrow:</p>
                    <p className="text-lg font-black font-mono text-[#011B33]">*737*000*9582#</p>
                    <p className="text-[11px] text-gray-500">GTBank • Access • Zenith • FirstBank • UBA</p>
                  </div>
                )}

                <button
                  type="button"
                  disabled={confirmingPaystack}
                  onClick={handleCompletePaystackTrustPayment}
                  className="w-full py-3 bg-[#3BB75E] hover:bg-[#32a050] text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {confirmingPaystack ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Confirming Payment with Paystack...
                    </>
                  ) : (
                    `Pay NGN ${Number(trustOrderData.amount).toLocaleString('en-NG')}`
                  )}
                </button>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setTrustCheckoutStep('details')}
                    className="text-gray-500 hover:text-gray-800 font-bold"
                  >
                    &larr; Back
                  </button>
                  <span className="text-gray-400 font-semibold">🔒 Secured by Paystack</span>
                  <button
                    type="button"
                    onClick={() => setShowTrustModal(false)}
                    className="text-red-500 hover:text-red-700 font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {trustCheckoutStep === 'receipt' && trustOrderData && (
            <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-emerald-200 text-gray-900">
              <div className="p-5 bg-emerald-700 text-white text-center space-y-1.5">
                <div className="w-12 h-12 rounded-full bg-white/20 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-black text-base">JI Trust Payment Confirmed!</h3>
                <p className="text-xs text-emerald-100">
                  Your funds are safely locked in escrow &amp; the seller has been notified.
                </p>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Escrow Reference</span>
                    <span className="font-mono font-bold text-gray-900">{trustOrderData.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Item</span>
                    <span className="font-bold text-gray-900 truncate max-w-[200px]">{ad.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount Secured</span>
                    <span className="font-black text-emerald-700">
                      ₦{Number(trustOrderData.amount).toLocaleString('en-NG')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery Location</span>
                    <span className="font-semibold text-gray-800 truncate max-w-[190px]">
                      {trustOrderData.delivery_address || 'Abuja / Agreed Meetup'}
                    </span>
                  </div>
                </div>

                {formattedPhone && (
                  <a
                    href={`https://wa.me/${formattedPhone.replace('+', '')}?text=${encodeURIComponent(
                      `Hello ${ad.seller_shop_name || ad.seller_name || 'Seller'}, I just funded *JI Trust Escrow* on *ji.africa* for your advert:\n\n*Item:* ${ad.title}\n*Amount Secured:* ₦${Number(trustOrderData.amount).toLocaleString('en-NG')}\n*Escrow Ref:* ${trustOrderData.reference}\n*Buyer:* ${trustOrderData.buyer_name} (${trustOrderData.buyer_phone})\n*Delivery:* ${trustOrderData.delivery_address}\n*Listing:* ${adPageUrl}\n\nPlease proceed to dispatch/deliver and mark it dispatched in your ji.africa Seller Dashboard.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition"
                  >
                    <MessageCircle className="w-4 h-4" /> Share Payment Details on WhatsApp
                  </a>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTrustModal(false);
                      router.push('/dashboard/seller?tab=trust');
                    }}
                    className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition"
                  >
                    Go to Escrow Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTrustModal(false)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* WHAT IS JI TRUST INFO MODAL */}
      {showTrustInfoModal && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-emerald-200 text-gray-900">
            <div className="p-4 bg-emerald-900 text-white flex items-center justify-between">
              <h3 className="font-black text-sm flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-300" /> What is JI Trust Escrow?
              </h3>
              <button
                type="button"
                onClick={() => setShowTrustInfoModal(false)}
                className="text-emerald-200 hover:text-white text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs text-gray-700 leading-relaxed">
              <p>
                <strong>JI Trust</strong> is <strong>ji.africa&apos;s</strong> official buyer &amp; seller escrow protection service. Because this seller accepts JI Trust, you do not have to risk sending money directly before receiving your item.
              </p>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 space-y-2">
                <p><strong>Step 1 — Secure Payment:</strong> You fund JI Trust via Paystack. Your money is locked safely in escrow.</p>
                <p><strong>Step 2 — Seller Dispatches:</strong> The seller ships or delivers your item and updates tracking.</p>
                <p><strong>Step 3 — 72-Hour Inspection:</strong> Inspect your item upon arrival. Click <em>Confirm Receipt</em> to release payout to the seller, or open a dispute within 72 hours if there is any issue.</p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                {!isOwner && !isUnavailable && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowTrustInfoModal(false);
                      setTrustCheckoutStep('details');
                      setShowTrustModal(true);
                    }}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs"
                  >
                    Buy Safely with JI Trust
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowTrustInfoModal(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
