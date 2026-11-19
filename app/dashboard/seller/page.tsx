"use client";

import { getAdPath } from '../../lib/adUrl';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, Copy, Check, Star } from 'lucide-react';
import WhatsAppShareFlyerModal from '../../components/WhatsAppShareFlyerModal';
import {
  LayoutDashboard,
  Plus,
  Store,
  UserCog,
  ShieldCheck,
  Eye,
  PhoneCall,
  Sparkles,
  Package,
  Trash2,
  CheckCircle2,
  Loader2,
  CreditCard,
  Coins,
  X,
  ExternalLink,
  Receipt,
  Megaphone,
  Send,
  BadgeCheck,
  MapPin,
  Clock,
} from 'lucide-react';

const API_URL = 'https://ji-africa-backend.onrender.com/api';

const VIP_TIERS = [
  {
    tier: 'URGENT',
    title: 'Urgent Sale Badge',
    days: 7,
    ngn: 1500,
    usd: 1.5,
    badgeClass: 'bg-red-500 text-white',
    desc: 'High-contrast URGENT tag on your listing card for 7 days to attract fast buyers.',
  },
  {
    tier: 'TOP',
    title: 'Top Category Placement',
    days: 14,
    ngn: 3500,
    usd: 3.5,
    badgeClass: 'bg-amber-400 text-gray-950',
    desc: 'Pins your advert above standard listings in search and category feeds for 14 days.',
  },
  {
    tier: 'BOOST',
    title: 'Homepage VIP Spotlight',
    days: 30,
    ngn: 7500,
    usd: 7.5,
    badgeClass: 'bg-brand-orange text-white',
    desc: 'Maximum visibility across homepage trending shelves and category headers for 30 days.',
  },
];

function getAdThumb(ad: any) {
  if (!ad?.image) return 'https://placehold.co/160x120/f8fafc/94a3b8?text=Ad';
  try {
    const parsed = JSON.parse(ad.image);
    const first = Array.isArray(parsed) ? parsed[0] : ad.image;
    if (first) {
      return first.startsWith('http') ? first : `https://ji-africa-backend.onrender.com${first}`;
    }
  } catch {
    if (typeof ad.image === 'string') {
      return ad.image.startsWith('http') ? ad.image : `https://ji-africa-backend.onrender.com${ad.image}`;
    }
  }
  return 'https://placehold.co/160x120/f8fafc/94a3b8?text=Ad';
}

function SellerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'trust' | 'messages' | 'offers' | 'callbacks' | 'payments' | 'requests' | 'my-requests'>('listings');
  const [chatThreads, setChatThreads] = useState<any[]>([]);
  const [chatQuotes, setChatQuotes] = useState<any[]>([]);
  const [buyerLeads, setBuyerLeads] = useState<any[]>([]);
  const [isVerifiedMerchant, setIsVerifiedMerchant] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [quoteModalReq, setQuoteModalReq] = useState<any>(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteAdId, setQuoteAdId] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [trustOrders, setTrustOrders] = useState<any[]>([]);
  const [waybillInputs, setWaybillInputs] = useState<Record<number, string>>({});
  const [disputeReasons, setDisputeReasons] = useState<Record<number, string>>({});
  const [offers, setOffers] = useState<any[]>([]);
  const [priceEditAd, setPriceEditAd] = useState<any>(null);
  const [whatsappShareAd, setWhatsappShareAd] = useState<any>(null);
  const [copiedCatalogLink, setCopiedCatalogLink] = useState(false);
  const [newPriceInput, setNewPriceInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'Available' | 'Sold' | 'VIP'>('all');
  const [referralStats, setReferralStats] = useState<any>(null);
  const [redeemingAdId, setRedeemingAdId] = useState<number | null>(null);

  const loadReferralStats = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/users/referrals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReferralStats(data);
      }
    } catch {}
  };

  useEffect(() => {
    const token = localStorage.getItem('ji_token');
    if (token) loadReferralStats(token);
  }, []);

  const handleRedeemReferralBoost = async (ad: any) => {
    const token = localStorage.getItem('ji_token');
    if (!token) return;
    const avail = Number(referralStats?.free_boost_credits || 0);
    if (avail <= 0) return;
    let chosenDays = 1;
    if (avail > 1) {
      const raw = prompt(`You have ${avail} Boost Day(s). How many days to boost "${ad.title}"? (1-${avail})`, '1');
      if (raw === null) return;
      chosenDays = Math.max(1, Math.min(avail, parseInt(raw, 10) || 1));
    } else if (!confirm(`Apply 1 Free Boost Day (24h) to "${ad.title}"?`)) return;
    setRedeemingAdId(Number(ad.id));
    try {
      const res = await fetch(`${API_URL}/users/referrals/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ad_id: Number(ad.id), days: chosenDays, vip_type: 'top' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        notify(data.message || `Boosted for +${chosenDays} day(s)!`);
        loadReferralStats(token);
        setAds((prev) => prev.map((it) => Number(it.id) === Number(ad.id) ? { ...it, is_vip: true, vip_type: 'top' } : it));
      } else notify(data.error || 'Could not redeem boost days');
    } catch { notify('Network error redeeming boost'); } finally { setRedeemingAdId(null); }
  };

  const [ads, setAds] = useState<any[]>([]);
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [toast, setToast] = useState('');

  // VIP Boost Modal State
  const [boostAd, setBoostAd] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<'URGENT' | 'TOP' | 'BOOST'>('TOP');
  const [gateway, setGateway] = useState<'paystack' | 'nowpayments'>('paystack');
  const [processingPayment, setProcessingPayment] = useState(false);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('ji_token') || ''}`,
  });

  const loadDashboard = useCallback(async () => {
    const token = localStorage.getItem('ji_token');
    const rawUser = localStorage.getItem('ji_user');
    if (!token || !rawUser) {
      router.push('/login');
      return;
    }

    try {
      setUser(JSON.parse(rawUser));
    } catch {
      router.push('/login');
      return;
    }

    try {
      const [res, offersRes, trustRes, leadsRes, myReqRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/seller`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/dashboard/offers`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/payments/trust/orders`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/buyer-requests/feed`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/buyer-requests/mine`, { headers: getAuthHeaders() }),
      ]);
      if (res.ok) {
        const data = await res.json();
        setAds(data.ads || []);
        setCallbacks(data.callbacks || []);
        setTransactions(data.transactions || []);
      }
      if (offersRes?.ok) {
        const oData = await offersRes.json();
        setOffers(oData.offers || []);
      }
      if (trustRes?.ok) {
        const tData = await trustRes.json();
        setTrustOrders(tData.orders || []);
      }
      if (leadsRes?.ok) {
        const lData = await leadsRes.json();
        setBuyerLeads(lData.requests || []);
        setIsVerifiedMerchant(Boolean(lData.isVerifiedSeller));
      }
      if (myReqRes?.ok) {
        const mrData = await myReqRes.json();
        setMyRequests(mrData.requests || []);
      }
    } catch (err) {
      console.error('Seller dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Verify returning Paystack / NowPayments redirect
  useEffect(() => {
    const initialTab = searchParams?.get('tab');
    if (initialTab === 'trust' || initialTab === 'requests' || initialTab === 'my-requests') {
      setActiveTab(initialTab);
    }
    const trustRef = searchParams?.get('trust_ref');
    const trustDemo = searchParams?.get('demo') === '1' ? '?demo=1' : '';
    const savedTok = typeof window !== 'undefined' ? localStorage.getItem('ji_token') : null;
    if (trustRef && savedTok) {
      fetch(`${API_URL}/payments/trust/verify/${encodeURIComponent(trustRef)}${trustDemo}`, {
        headers: { Authorization: `Bearer ${savedTok}` },
      })
        .then((r) => r.json())
        .then((d) => {
          if (d?.status === 'funded') {
            notify(d.message || 'JI Trust Escrow Funded!');
            setActiveTab('trust');
            loadDashboard();
            router.replace('/dashboard/seller');
          }
        })
        .catch(() => {});
    }

    const ref = searchParams?.get('payment_ref');
    const provider = searchParams?.get('provider') || 'paystack';
    const demo = searchParams?.get('demo') === '1' ? '?demo=1' : '';
    const token = typeof window !== 'undefined' ? localStorage.getItem('ji_token') : null;

    if (!ref || !token) return;

    fetch(`${API_URL}/payments/${provider}/verify/${encodeURIComponent(ref)}${demo}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.status === 'paid') {
          notify(data.message || 'VIP Boost activated!');
          loadDashboard();
          router.replace('/dashboard/seller');
        }
      })
      .catch(() => {});
  }, [searchParams, loadDashboard, router]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleToggleStatus = async (ad: any) => {
    const nextStatus = ['Sold', 'Out of Stock', 'Unavailable'].includes(ad.status) ? 'Available' : 'Out of Stock';
    try {
      const res = await fetch(`${API_URL}/dashboard/ads/${ad.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        notify(`Listing marked as ${nextStatus}`);
        loadDashboard();
      }
    } catch {}
  };

  const handleBumpAd = async (ad: any) => {
    try {
      const res = await fetch(`${API_URL}/dashboard/ads/${ad.id}/bump`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        notify(data.message || "Advert bumped to the top!");
        loadDashboard();
      } else {
        notify(data.error || "Free bump cooldown active");
      }
    } catch {
      notify("Server error bumping advert");
    }
  };

  const handleSaveNewPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceEditAd) return;
    const numericPrice = Number(newPriceInput);
    if (!numericPrice || numericPrice <= 0) return;
    try {
      const res = await fetch(`${API_URL}/dashboard/ads/${priceEditAd.id}/price`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ price: numericPrice }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        notify(data.message || "Price updated!");
        setPriceEditAd(null);
        loadDashboard();
      } else {
        notify(data.error || "Could not update price");
      }
    } catch {}
  };

  const handleRespondOffer = async (offer: any, status: "accepted" | "declined") => {
    try {
      const res = await fetch(`${API_URL}/dashboard/offers/${offer.id}/respond`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        notify(`Offer ${status}!`);
        loadDashboard();
        if (status === "accepted" && offer.buyer_phone) {
          const cleanPhone = String(offer.buyer_phone).replace(/[^0-9]/g, "").replace(/^0/, "234");
          const msg = encodeURIComponent(
            `Hello ${offer.buyer_name}, I have accepted your offer of ₦${Number(offer.offered_price).toLocaleString("en-NG")} for "${offer.ad_title}" on ji.africa!`
          );
          window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
        }
      }
    } catch {}
  };

  const handleTrustDispatch = async (orderId: number) => {
    try {
      const res = await fetch(`${API_URL}/payments/trust/orders/${orderId}/dispatch`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ waybill_info: waybillInputs[orderId] || "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        notify(data.message || "Marked dispatched!");
        loadDashboard();
      } else {
        notify(data.error || "Could not update order");
      }
    } catch {}
  };

  const handleTrustConfirm = async (orderId: number) => {
    try {
      const res = await fetch(`${API_URL}/payments/trust/orders/${orderId}/confirm`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        notify(data.message || "Receipt confirmed!");
        loadDashboard();
      } else {
        notify(data.error || "Could not confirm receipt");
      }
    } catch {}
  };

  const handleTrustDispute = async (orderId: number) => {
    const reason = (disputeReasons[orderId] || "").trim();
    if (!reason) {
      notify("Enter your dispute reason first");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/payments/trust/orders/${orderId}/dispute`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        notify(data.message || "Dispute submitted");
        loadDashboard();
      } else {
        notify(data.error || "Could not open dispute");
      }
    } catch {}
  };

  const handleSendMerchantQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteModalReq) return;
    setSubmittingQuote(true);
    try {
      const res = await fetch(`${API_URL}/buyer-requests/${quoteModalReq.id}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          offered_price: Number(quotePrice),
          message: quoteMessage.trim(),
          ad_id: quoteAdId ? Number(quoteAdId) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        notify(data.message || 'Quote sent to buyer!');
        setQuoteModalReq(null);
        setQuotePrice('');
        setQuoteMessage('');
        setQuoteAdId('');
        loadDashboard();
      } else {
        notify(data.error || 'Could not send quote');
      }
    } catch {
      notify('Network error sending quote');
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleCloseMyRequest = async (reqId: number, status: 'fulfilled' | 'closed') => {
    try {
      const res = await fetch(`${API_URL}/buyer-requests/${reqId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        notify(`Request marked as ${status}`);
        loadDashboard();
      }
    } catch {}
  };

  const handleDeleteAd = async (adId: number) => {
    if (!confirm('Delete this advert permanently?')) return;
    try {
      const res = await fetch(`${API_URL}/ads/${adId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        notify('Advert deleted');
        loadDashboard();
      }
    } catch {}
  };

  const handleStartBoostCheckout = async () => {
    if (!boostAd) return;
    setProcessingPayment(true);

    try {
      const endpoint =
        gateway === 'paystack'
          ? `${API_URL}/payments/paystack/initialize`
          : `${API_URL}/payments/nowpayments/initialize`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ ad_id: boostAd.id, tier: selectedTier }),
      });

      const data = await res.json();
      if (res.ok && data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        notify(data.error || 'Could not initialize payment');
        setProcessingPayment(false);
      }
    } catch {
      notify('Payment gateway connection error');
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  const totalViews = ads.reduce((sum, a) => sum + Number(a.views || 0), 0);
  const activeAdsCount = ads.filter((a) => a.status === 'Available').length;
  const vipAdsCount = ads.filter((a) => a.is_vip).length;

  const filteredAds = ads.filter((ad) => {
    if (statusFilter === 'Available') return ad.status === 'Available';
    if (statusFilter === 'Sold') return ad.status === 'Sold';
    if (statusFilter === 'VIP') return Boolean(ad.is_vip);
    return true;
  });

  const shopSlug = user?.username || user?.id;
  const isAdmin = user && ['admin', 'super_admin'].includes(user.role);

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-brand-orange" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Seller Command Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="w-7 h-7 text-brand-orange" />
            Seller Command Center
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Welcome back, <span className="font-bold text-gray-800">{user?.shop_name || user?.full_name}</span>. Manage listings, track buyer leads, and boost adverts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/sell"
            className="px-4 py-2.5 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Post New Ad
          </Link>
          <Link
            href={`/shop/${shopSlug}`}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Store className="w-4 h-4" /> View My Shop
          </Link>
          <Link
            href="/profile"
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <UserCog className="w-4 h-4" /> Edit Profile
          </Link>
          {isAdmin && (
            <Link
              href="/dashboard/admin"
              className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <ShieldCheck className="w-4 h-4 text-brand-orange" /> Super Admin
            </Link>
          )}
        </div>
      </div>

      {/* REFER & EARN FREE AD BOOSTS */}
      {referralStats && (
        <div className="ji-refer-banner bg-orange-50/70 dark:bg-neutral-900 border border-orange-200 dark:border-orange-500/30 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-orange text-white text-[10px] font-black uppercase tracking-wider">
                Refer &amp; Earn Free Boosts
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-black">
                {Number(referralStats.free_boost_credits || 0)} Boost Day(s) Available
              </span>
            </div>
            <h3 className="text-base font-black text-gray-900">
              Invite 1 Friend &rarr; Unlock 1 Free Boost Day (10 Invites = 10 Days!)
            </h3>
            <p className="text-xs text-gray-600">
              Every friend who signs up and verifies their email unlocks <strong>+1 Boost Day</strong> (valid for <strong>14 days</strong> before unused days expire). Apply 1 day per listing or stack multiple days on one advert!
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-gray-700 pt-1">
              <span>Code: <strong className="text-brand-orange">{referralStats.referral_code}</strong></span>
              <span>• Invited: <strong>{referralStats.total_invited || 0}</strong></span>
              <span>• Verified &amp; Credited: <strong className="text-emerald-700">{referralStats.qualified_count || 0}</strong></span>
              {Number(referralStats.pending_count || 0) > 0 && (
                <span>• Pending Verification: <strong className="text-amber-700">{referralStats.pending_count}</strong></span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <input
              type="text"
              readOnly
              value={referralStats.referral_link || ''}
              className="px-3 py-2.5 bg-white dark:bg-neutral-950 border border-orange-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-neutral-200 min-w-[230px] outline-none"
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard?.writeText(referralStats.referral_link || '');
                  notify('Referral link copied! Share it on WhatsApp to earn free boosts.');
                } catch {}
              }}
              className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-black transition"
            >
              Copy Link
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Join me on ji.africa — Nigeria's fast classifieds & escrow marketplace! Sign up free with my invite link: ${referralStats.referral_link}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl text-xs font-black text-center transition"
            >
              Invite via WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Unified Clickable Metric & Section Tiles */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] font-black uppercase tracking-wider text-gray-500">
            Seller Overview — Tap any card to view items
          </p>
          <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> {totalViews.toLocaleString()} Total Views
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {[
            {
              id: 'all-listings',
              label: 'My Listings',
              value: ads.length,
              sub: `${totalViews.toLocaleString()} total views`,
              valueColor: 'text-gray-900',
              activeBg: 'bg-brand-orange text-white border-brand-orange',
              isActive: activeTab === 'listings' && statusFilter === 'all',
              icon: <Package className="w-4 h-4" />,
              onSelect: () => {
                setActiveTab('listings');
                setStatusFilter('all');
              },
            },
            {
              id: 'active-listings',
              label: 'Active Listings',
              value: activeAdsCount,
              sub: 'Live on marketplace',
              valueColor: 'text-emerald-600',
              activeBg: 'bg-emerald-700 text-white border-emerald-700',
              isActive: activeTab === 'listings' && statusFilter === 'Available',
              icon: <CheckCircle2 className="w-4 h-4" />,
              onSelect: () => {
                setActiveTab('listings');
                setStatusFilter('Available');
              },
            },
            {
              id: 'vip-boosted',
              label: 'VIP Boosted',
              value: vipAdsCount,
              sub: 'Priority placement',
              valueColor: 'text-amber-500',
              activeBg: 'bg-amber-500 text-gray-950 border-amber-500',
              isActive: activeTab === 'listings' && statusFilter === 'VIP',
              icon: <Sparkles className="w-4 h-4" />,
              onSelect: () => {
                setActiveTab('listings');
                setStatusFilter('VIP');
              },
            },
            {
              id: 'trust',
              label: 'JI Trust Escrow',
              value: trustOrders.length,
              sub: 'Escrow orders',
              valueColor: 'text-emerald-600',
              activeBg: 'bg-emerald-700 text-white border-emerald-700',
              isActive: activeTab === 'trust',
              icon: <ShieldCheck className="w-4 h-4" />,
              onSelect: () => setActiveTab('trust'),
            },
            {
              id: 'messages',
              label: 'Chats & Quotes',
              value: chatQuotes.length,
              sub: 'Buyer threads',
              valueColor: 'text-brand-orange',
              activeBg: 'bg-brand-orange text-white border-brand-orange',
              isActive: activeTab === 'messages',
              icon: <MessageCircle className="w-4 h-4" />,
              onSelect: () => setActiveTab('messages'),
            },
            {
              id: 'offers',
              label: 'Buyer Offers',
              value: offers.length,
              sub: 'Price offers',
              valueColor: 'text-brand-orange',
              activeBg: 'bg-brand-orange text-white border-brand-orange',
              isActive: activeTab === 'offers',
              icon: <Coins className="w-4 h-4" />,
              onSelect: () => setActiveTab('offers'),
            },
            {
              id: 'callbacks',
              label: 'Callback Leads',
              value: callbacks.length,
              sub: 'Phone requests',
              valueColor: 'text-brand-orange',
              activeBg: 'bg-brand-orange text-white border-brand-orange',
              isActive: activeTab === 'callbacks',
              icon: <PhoneCall className="w-4 h-4" />,
              onSelect: () => setActiveTab('callbacks'),
            },
            {
              id: 'requests',
              label: 'Buyer Leads',
              value: buyerLeads.length,
              sub: 'Matching requests',
              valueColor: 'text-brand-orange',
              activeBg: 'bg-brand-orange text-white border-brand-orange',
              isActive: activeTab === 'requests',
              icon: <Megaphone className="w-4 h-4" />,
              onSelect: () => setActiveTab('requests'),
            },
            {
              id: 'my-requests',
              label: 'My Requests',
              value: myRequests.length,
              sub: 'Items you requested',
              valueColor: 'text-gray-900',
              activeBg: 'bg-brand-orange text-white border-brand-orange',
              isActive: activeTab === 'my-requests',
              icon: <Sparkles className="w-4 h-4" />,
              onSelect: () => setActiveTab('my-requests'),
            },
            {
              id: 'payments',
              label: 'Boost Receipts',
              value: transactions.length,
              sub: 'Billing & credits',
              valueColor: 'text-gray-900',
              activeBg: 'bg-brand-orange text-white border-brand-orange',
              isActive: activeTab === 'payments',
              icon: <Receipt className="w-4 h-4" />,
              onSelect: () => setActiveTab('payments'),
            },
          ].map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => {
                tile.onSelect();
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  document
                    .getElementById('seller-section-panel')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between shadow-2xs ${
                tile.isActive
                  ? `${tile.activeBg} shadow-md ring-2 ring-brand-orange/30`
                  : 'ji-metric-tile bg-white dark:bg-neutral-900 hover:bg-orange-50/40 dark:hover:bg-neutral-800 border-gray-200 dark:border-neutral-800 hover:border-brand-orange text-gray-900 dark:text-neutral-100'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wide truncate ${
                    tile.isActive ? 'opacity-85' : 'text-gray-500'
                  }`}
                >
                  {tile.label}
                </span>
                <span className={tile.isActive ? 'opacity-90' : 'text-gray-400'}>
                  {tile.icon}
                </span>
              </div>
              <p
                className={`text-2xl font-black mt-1.5 leading-none ${
                  tile.isActive ? '' : tile.valueColor
                }`}
              >
                {tile.value}
              </p>
              <p
                className={`text-[10px] font-bold mt-1.5 truncate ${
                  tile.isActive ? 'opacity-80' : 'text-gray-400'
                }`}
              >
                {tile.sub}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div id="seller-section-panel" className="scroll-mt-4" />

      {/* TAB 1: MY LISTINGS */}
      {activeTab === 'listings' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-gray-900 text-base">Inventory &amp; Promotions</h2>
            <div className="flex gap-1.5">
              {(['all', 'Available', 'Sold', 'VIP'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                    statusFilter === st
                      ? 'bg-brand-orange text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredAds.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-sm text-gray-500 font-medium">No adverts found under this filter.</p>
              <Link
                href="/sell"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-orange text-white rounded-lg text-xs font-bold"
              >
                <Plus className="w-4 h-4" /> Post Your First Advert
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredAds.map((ad) => (
                <div
                  key={ad.id}
                  className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={getAdThumb(ad)}
                      alt={ad.title}
                      className="w-20 h-16 rounded-xl object-cover border border-gray-200 shrink-0"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={getAdPath(ad)}
                          className="font-bold text-sm text-gray-900 hover:text-brand-orange"
                        >
                          {ad.title}
                        </Link>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            ['Sold', 'Out of Stock', 'Unavailable'].includes(ad.status)
                              ? 'bg-gray-200 text-gray-700'
                              : ad.status === 'Flagged' || ad.status === 'Rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {ad.status}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          {ad.stock_quantity !== null && ad.stock_quantity !== undefined
                            ? `Stock: ${ad.stock_quantity} left`
                            : 'Unlimited / Manual Stock'}
                        </span>
                        {Number(ad.out_of_stock_reports || 0) > 0 && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            {ad.out_of_stock_reports} Out-of-Stock Report(s)
                          </span>
                        )}
                        {ad.is_vip && (
                          <span className="bg-amber-400 text-gray-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> {ad.vip_type || 'VIP'}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-black text-brand-orange mt-0.5">
                        ₦{Number(ad.price).toLocaleString('en-NG')}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1">
                        <span className="flex items-center gap-1 font-semibold">
                          <Eye className="w-3.5 h-3.5 text-blue-500" /> {Number(ad.views || 0)} views
                        </span>
                        <span>• Posted {new Date(ad.created_at).toLocaleDateString('en-GB')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {Number(referralStats?.free_boost_credits || 0) > 0 && ad.status === 'Available' ? (
                      <button
                        type="button"
                        disabled={redeemingAdId === Number(ad.id)}
                        onClick={() => handleRedeemReferralBoost(ad)}
                        className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-gray-950 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-xs transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {redeemingAdId === Number(ad.id)
                          ? 'Boosting...'
                          : ad.is_vip ? `+Extend (${referralStats.free_boost_credits}d)` : `Boost (${referralStats.free_boost_credits}d)`}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        title="Paid VIP Ad Boosting is coming soon — earn Free Boosts via referrals!"
                        className="px-3.5 py-2 bg-gray-100 text-gray-400 border border-gray-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-not-allowed select-none"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Boost (Soon)
                      </button>
                    )}

                    <button
                      type="button"
                      disabled
                      title="Free Bump Ad is temporarily disabled (Coming Soon)"
                      className="px-3.5 py-2 bg-gray-100 text-gray-400 border border-gray-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-not-allowed select-none"
                    >
                      Bump (Soon)
                    </button>

                    <button
                      type="button"
                      onClick={() => setWhatsappShareAd(ad)}
                      className="px-3 py-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg text-xs font-black flex items-center gap-1 shadow-xs transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Share on WhatsApp
                    </button>

                    <Link
                      href={`/sell?edit=${ad.id}`}
                      className="px-3 py-2 bg-brand-orange hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition"
                    >
                      Edit Ad
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setPriceEditAd(ad);
                        setNewPriceInput(String(ad.price || ""));
                      }}
                      className="px-3 py-2 bg-orange-50 hover:bg-orange-100 text-brand-orange rounded-lg text-xs font-bold transition"
                    >
                      Edit Price
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(ad)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition"
                    >
                      {['Sold', 'Out of Stock', 'Unavailable'].includes(ad.status) ? 'Reactivate (Available)' : 'Mark Out of Stock'}
                    </button>

                    <Link
                      href={getAdPath(ad)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDeleteAd(ad.id)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                      title="Delete Ad"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 1A: JI TRUST ESCROW ORDERS */}
      {activeTab === 'trust' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-gray-900 text-base">🛡️ JI Trust Protected Orders</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Escrow funds release automatically 72 hours after seller dispatch unless disputed (3% JI Trust fee).
              </p>
            </div>
            <Link href="/profile" className="text-xs font-bold text-emerald-700 hover:underline">
              Configure Payout Bank →
            </Link>
          </div>
          {trustOrders.length === 0 ? (
            <div className="p-10 text-center text-xs text-gray-500">
              No JI Trust escrow orders yet. Enable JI Trust when posting or editing an advert.
            </div>
          ) : (
            trustOrders.map((ord) => {
              const myId = Number(user?.id || user?.userId || 0);
              const isSeller = Number(ord.seller_id) === myId;
              const isBuyer = Number(ord.buyer_id) === myId;
              return (
                <div key={ord.id} className="p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-600">{ord.reference}</span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {isSeller ? "Selling" : "Buying"}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          ord.status === "released" || ord.status === "paid_out"
                            ? "bg-emerald-100 text-emerald-800"
                            : ord.status === "disputed"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {ord.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-900">
                        ₦{Number(ord.item_amount).toLocaleString("en-NG")}
                      </p>
                      {isSeller && (
                        <p className="text-[11px] font-bold text-emerald-700">
                          Net Payout: ₦{Number(ord.seller_payout_amount).toLocaleString("en-NG")} (after 3% fee)
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-gray-700 space-y-0.5">
                    <p>
                      Item: <span className="font-bold">{ord.ad_title || `Ad #${ord.ad_id}`}</span>
                    </p>
                    <p>
                      Buyer: <span className="font-semibold">{ord.buyer_name}</span> ({ord.buyer_phone})
                      {ord.delivery_address ? ` • Delivery: ${ord.delivery_address}` : ""}
                    </p>
                    {ord.waybill_info && (
                      <p className="text-blue-700 font-medium">Dispatch Info: {ord.waybill_info}</p>
                    )}
                    {ord.auto_release_at && ord.status === "dispatched" && (
                      <p className="text-amber-700 font-bold">
                        Auto-releases on: {new Date(ord.auto_release_at).toLocaleString("en-GB")}
                      </p>
                    )}
                    {ord.dispute_reason && (
                      <p className="text-red-600 font-bold">Dispute Reason: {ord.dispute_reason}</p>
                    )}
                  </div>

                  {/* Seller Action: Mark Dispatched */}
                  {isSeller && ord.status === "funded" && (
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Courier / Waybill / Driver details (optional)"
                        value={waybillInputs[ord.id] || ""}
                        onChange={(e) =>
                          setWaybillInputs((prev) => ({ ...prev, [ord.id]: e.target.value }))
                        }
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleTrustDispatch(ord.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shrink-0"
                      >
                        Mark Dispatched (Start 72h Clock)
                      </button>
                    </div>
                  )}

                  {/* Buyer Action: Confirm Receipt or Raise Dispute */}
                  {isBuyer && ["funded", "dispatched"].includes(ord.status) && (
                    <div className="pt-2 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTrustConfirm(ord.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black"
                        >
                          ✓ Confirm Receipt &amp; Release Funds
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Issue with item? Enter dispute reason to freeze payout..."
                          value={disputeReasons[ord.id] || ""}
                          onChange={(e) =>
                            setDisputeReasons((prev) => ({ ...prev, [ord.id]: e.target.value }))
                          }
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-red-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleTrustDispute(ord.id)}
                          className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold shrink-0"
                        >
                          Raise Dispute
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 1B: BUYER OFFERS */}
      {activeTab === 'offers' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-base">Buyer Price Offers</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Accepting an offer notifies the buyer and opens a pre-filled WhatsApp deal confirmation.
            </p>
          </div>
          {offers.length === 0 ? (
            <div className="p-10 text-center text-xs text-gray-500">
              No buyer offers yet. Buyers can click "Make an Offer" on any of your listings.
            </div>
          ) : (
            offers.map((off) => (
              <div key={off.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">{off.buyer_name}</span>
                    <span className="text-xs font-semibold text-brand-orange">{off.buyer_phone}</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        off.status === "accepted"
                          ? "bg-emerald-100 text-emerald-700"
                          : off.status === "declined"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {off.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700">
                    Offered <span className="font-black text-emerald-700">₦{Number(off.offered_price).toLocaleString("en-NG")}</span>{" "}
                    for <span className="font-bold">{off.ad_title || `Ad #${off.ad_id}`}</span>{" "}
                    {off.asking_price ? <span className="text-gray-400">(Asking: ₦{Number(off.asking_price).toLocaleString("en-NG")})</span> : null}
                  </p>
                  {off.message && <p className="text-xs text-gray-500 italic">"{off.message}"</p>}
                </div>

                {off.status === "pending" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRespondOffer(off, "accepted")}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                    >
                      Accept &amp; WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRespondOffer(off, "declined")}
                      className="px-3 py-2 bg-gray-100 hover:bg-red-100 hover:text-red-700 text-gray-700 rounded-lg text-xs font-bold"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* QUICK PRICE EDIT MODAL */}
      {priceEditAd && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
              <h3 className="font-black text-sm">Update Listing Price</h3>
              <button type="button" onClick={() => setPriceEditAd(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveNewPrice} className="p-5 space-y-4">
              <p className="text-xs text-gray-600">
                Lowering your price automatically sends a <span className="font-bold text-brand-orange">Price-Drop Alert</span> to everyone who saved this item!
              </p>
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-600 mb-1">New Price (₦)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newPriceInput}
                  onChange={(e) => setNewPriceInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-black text-brand-orange outline-none focus:border-brand-orange"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-xs font-black"
              >
                Save Price
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: BUYER CALLBACK LEADS */}
      {activeTab === 'callbacks' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-base">Buyer Callback Requests</h2>
          </div>
          {callbacks.length === 0 ? (
            <div className="p-10 text-center text-xs text-gray-500">
              No callback requests yet. When buyers tap "Request Callback" on your ads, their numbers appear here.
            </div>
          ) : (
            callbacks.map((cb) => (
              <div key={cb.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {cb.buyer_name} — <span className="text-brand-orange">{cb.buyer_phone}</span>
                  </p>
                  <p className="text-xs text-gray-600">
                    Interested in: <span className="font-semibold">{cb.ad_title || `Ad #${cb.ad_id}`}</span>
                  </p>
                  {cb.message && <p className="text-xs text-gray-500 mt-0.5">"{cb.message}"</p>}
                </div>
                <a
                  href={`tel:${cb.buyer_phone}`}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-center"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call Buyer
                </a>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: VIP PAYMENT RECEIPTS */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-base">VIP Promotion Transactions</h2>
          </div>
          {transactions.length === 0 ? (
            <div className="p-10 text-center text-xs text-gray-500">
              No VIP promotion payments yet. Click "Boost Ad" on any listing to promote it.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase">
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Advert</th>
                    <th className="py-3 px-4">Package</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Gateway</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-600">{tx.reference}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{tx.ad_title || `Ad #${tx.ad_id}`}</td>
                      <td className="py-3 px-4 font-bold text-brand-orange">
                        {tx.tier} ({tx.days} days)
                      </td>
                      <td className="py-3 px-4 font-black">
                        {tx.currency === 'NGN'
                          ? `₦${Number(tx.amount).toLocaleString('en-NG')}`
                          : `$${Number(tx.amount).toFixed(2)} USD`}
                      </td>
                      <td className="py-3 px-4 uppercase font-semibold">{tx.provider}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            tx.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIP BOOST CHECKOUT MODAL */}
      {boostAd && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-5 bg-gray-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" /> Promote Advert
                </h3>
                <p className="text-xs text-gray-300 truncate max-w-md">{boostAd.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setBoostAd(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Step 1: Select Tier */}
              <div className="space-y-2.5">
                <label className="block text-xs font-black text-gray-700 uppercase">
                  1. Choose VIP Boost Package
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {VIP_TIERS.map((pkg) => {
                    const active = selectedTier === pkg.tier;
                    return (
                      <button
                        key={pkg.tier}
                        type="button"
                        onClick={() => setSelectedTier(pkg.tier as any)}
                        className={`text-left p-4 rounded-xl border-2 transition flex flex-col ${
                          active
                            ? 'border-brand-orange bg-orange-50/40 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span
                          className={`self-start text-[10px] font-black uppercase px-2 py-0.5 rounded ${pkg.badgeClass}`}
                        >
                          {pkg.tier} • {pkg.days} DAYS
                        </span>
                        <p className="font-black text-gray-900 text-sm mt-2">{pkg.title}</p>
                        <p className="text-xs text-gray-500 mt-1 leading-snug mb-3">{pkg.desc}</p>
                        <div className="mt-auto pt-2 border-t border-gray-100">
                          <p className="font-black text-base text-brand-orange">
                            ₦{pkg.ngn.toLocaleString('en-NG')}
                          </p>
                          <p className="text-[11px] font-bold text-gray-400">
                            or ${pkg.usd.toFixed(2)} Crypto
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Payment Method */}
              <div className="space-y-2.5">
                <label className="block text-xs font-black text-gray-700 uppercase">
                  2. Select Payment Gateway
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGateway('paystack')}
                    className={`p-3.5 rounded-xl border-2 flex items-center gap-3 text-left transition ${
                      gateway === 'paystack'
                        ? 'border-brand-orange bg-orange-50/40'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 text-blue-600 shrink-0" />
                    <div>
                      <p className="font-black text-xs text-gray-900">Paystack (NGN)</p>
                      <p className="text-[11px] text-gray-500">Naira Card, Bank Transfer &amp; USSD</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGateway('nowpayments')}
                    className={`p-3.5 rounded-xl border-2 flex items-center gap-3 text-left transition ${
                      gateway === 'nowpayments'
                        ? 'border-brand-orange bg-orange-50/40'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Coins className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-black text-xs text-gray-900">NowPayments (Crypto)</p>
                      <p className="text-[11px] text-gray-500">USDT (TRC20/BEP20), BTC, TRX &amp; ETH</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setBoostAd(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={processingPayment}
                  onClick={handleStartBoostCheckout}
                  className="px-6 py-2.5 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md disabled:opacity-60"
                >
                  {processingPayment && <Loader2 className="w-4 h-4 animate-spin" />}
                  Proceed to {gateway === 'paystack' ? 'Paystack' : 'Crypto'} Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    
      {/* TAB: BUYER LEADS FOR VERIFIED MERCHANTS */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-gray-900 text-base flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-brand-orange" /> Live Buyer Sourcing Requests
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Verified merchants can respond to active buyer requests and unlock direct WhatsApp contact.
              </p>
            </div>
            {!isVerifiedMerchant && (
              <Link
                href="/profile"
                className="px-4 py-2 bg-brand-orange text-white rounded-xl text-xs font-black"
              >
                Verify Seller Account to Quote
              </Link>
            )}
          </div>

          {!isVerifiedMerchant && (
            <div className="p-4 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 font-semibold">
              Only <strong>Verified Merchants</strong> can submit quotes and unlock buyer phone numbers. Complete verification in your Profile to respond.
            </div>
          )}

          {buyerLeads.length === 0 ? (
            <div className="p-10 text-center text-xs text-gray-500">
              No active buyer requests at the moment. Check back soon!
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {buyerLeads.map((lead) => {
                const scopeLabel =
                  lead.location_scope === 'lga' && lead.sub_region_name
                    ? `${lead.sub_region_name}, ${(lead.region_name || '').replace(/\s*State$/i, '')}`
                    : lead.location_scope === 'state' && lead.region_name
                    ? `All of ${lead.region_name.replace(/\s*State$/i, '')}`
                    : 'All of Nigeria';
                const cleanWa = String(lead.buyer_phone || '').replace(/[^0-9]/g, '').replace(/^0/, '234');
                return (
                  <div key={lead.id} className="p-5 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex gap-4 min-w-0">
                      {lead.image_url && (
                        <img
                          src={lead.image_url}
                          alt={lead.title}
                          className="w-20 h-20 rounded-xl object-cover border border-gray-200 shrink-0"
                        />
                      )}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-brand-orange text-[10px] font-black uppercase">
                            {scopeLabel}
                          </span>
                          {lead.category_name && (
                            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold">
                              {lead.category_name}
                            </span>
                          )}
                          <span className="text-[11px] font-bold text-emerald-700">
                            {lead.urgency}
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-gray-900">{lead.title}</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">{lead.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 pt-1">
                          <span>
                            Budget:{' '}
                            <strong className="text-gray-900">
                              {lead.budget_max
                                ? `Up to ₦${Number(lead.budget_max).toLocaleString('en-NG')}`
                                : 'Open Budget'}
                            </strong>
                          </span>
                          <span>• Condition: <strong>{lead.condition_pref}</strong></span>
                          <span>• Quotes: <strong>{lead.quotes_count}/{lead.max_quotes}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center items-start md:items-end gap-2 shrink-0">
                      {lead.already_quoted ? (
                        <>
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-black">
                            ✓ Quote Sent ({lead.buyer_phone})
                          </span>
                          {cleanWa.length >= 10 && (
                            <a
                              href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hello ${lead.buyer_name}, I sent you a quote on ji.africa for "${lead.title}".`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5"
                            >
                              <MessageCircle className="w-3.5 h-3.5" /> Chat on WhatsApp
                            </a>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={!isVerifiedMerchant || Number(lead.quotes_count) >= Number(lead.max_quotes)}
                          onClick={() => {
                            setQuoteModalReq(lead);
                            setQuotePrice(lead.budget_max ? String(lead.budget_max) : '');
                            setQuoteMessage('');
                          }}
                          className="px-4 py-2.5 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" /> Send Quote / Reach Out
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: MY BUYER REQUESTS & INCOMING MERCHANT QUOTES */}
      {activeTab === 'my-requests' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-gray-900 text-base">My Submitted Buyer Requests</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Compare quotes from verified merchants and close your request once fulfilled.
              </p>
            </div>
            <Link
              href="/request"
              className="px-4 py-2 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-xs font-black"
            >
              + New Buyer Request
            </Link>
          </div>

          {myRequests.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-xs text-gray-500">You haven&apos;t submitted any Buyer Requests yet.</p>
              <Link
                href="/request"
                className="inline-block px-4 py-2 bg-brand-orange text-white rounded-xl text-xs font-black"
              >
                Submit a Buyer Request
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {myRequests.map((reqItem) => (
                <div key={reqItem.id} className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            reqItem.status === 'open'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {reqItem.status}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {reqItem.quotes?.length || 0} Verified Merchant Quote(s)
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-gray-900 mt-1">{reqItem.title}</h3>
                      <p className="text-xs text-gray-600 mt-0.5">{reqItem.description}</p>
                    </div>

                    {reqItem.status === 'open' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCloseMyRequest(reqItem.id, 'fulfilled')}
                          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black"
                        >
                          Mark as Fulfilled
                        </button>
                      </div>
                    )}
                  </div>

                  {Array.isArray(reqItem.quotes) && reqItem.quotes.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200/80">
                      <p className="text-[11px] font-black uppercase text-gray-500">
                        Quotes from Verified Merchants
                      </p>
                      {reqItem.quotes.map((q: any) => {
                        const cleanWa = String(q.seller_phone || '').replace(/[^0-9]/g, '').replace(/^0/, '234');
                        return (
                          <div
                            key={q.id}
                            className="bg-white p-3.5 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-gray-900">
                                  {q.shop_name || q.seller_name}
                                </span>
                                <BadgeCheck className="w-4 h-4 text-emerald-600" />
                                <span className="text-xs font-black text-brand-orange ml-2">
                                  ₦{Number(q.offered_price).toLocaleString('en-NG')}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">{q.message}</p>
                              {q.ad_id && q.ad_title && (
                                <Link
                                  href={`/ad/${q.ad_slug || q.ad_id}`}
                                  className="inline-block text-[11px] font-bold text-blue-600 hover:underline"
                                >
                                  View Linked Listing: {q.ad_title} &rarr;
                                </Link>
                              )}
                            </div>

                            {cleanWa.length >= 10 && (
                              <a
                                href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hello ${q.shop_name || q.seller_name}, I saw your ₦${Number(q.offered_price).toLocaleString('en-NG')} quote for my request "${reqItem.title}" on ji.africa.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0"
                              >
                                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Seller
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MERCHANT QUOTE MODAL */}
      {quoteModalReq && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900">Send Quote to Buyer</h3>
              <button
                type="button"
                onClick={() => setQuoteModalReq(null)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-600">
              Request: <strong className="text-gray-900">{quoteModalReq.title}</strong>
            </p>
            <form onSubmit={handleSendMerchantQuote} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Your Offer Price (₦) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value)}
                  placeholder="e.g. 820000"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-bold outline-none focus:border-brand-orange"
                />
              </div>
              {ads.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Attach One of Your Listings (Optional)
                  </label>
                  <select
                    value={quoteAdId}
                    onChange={(e) => setQuoteAdId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs bg-white outline-none focus:border-brand-orange"
                  >
                    <option value="">-- No attached listing --</option>
                    {ads.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title} (₦{Number(a.price).toLocaleString('en-NG')})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Message &amp; Availability Details *
                </label>
                <textarea
                  rows={3}
                  required
                  value={quoteMessage}
                  onChange={(e) => setQuoteMessage(e.target.value)}
                  placeholder="Confirm stock condition, location/delivery options, and why the buyer should buy from you..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:border-brand-orange"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuoteModalReq(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingQuote}
                  className="px-5 py-2 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingQuote && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Send Quote &amp; Unlock Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {whatsappShareAd && (
        <WhatsAppShareFlyerModal
          ad={whatsappShareAd}
          sellerPhoneFallback={user?.phone || ''}
          onClose={() => setWhatsappShareAd(null)}
        />
      )}
    </div>
  );
}

export default function SellerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
</div>
      }
    >
      <SellerDashboardContent />
    </Suspense>
  );
}
