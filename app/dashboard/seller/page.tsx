"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  const [activeTab, setActiveTab] = useState<'listings' | 'callbacks' | 'payments'>('listings');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Available' | 'Sold' | 'VIP'>('all');

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
      const res = await fetch(`${API_URL}/dashboard/seller`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setAds(data.ads || []);
        setCallbacks(data.callbacks || []);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Seller dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Verify returning Paystack / NowPayments redirect
  useEffect(() => {
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
    const nextStatus = ad.status === 'Sold' ? 'Available' : 'Sold';
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

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[11px] font-bold text-gray-400 uppercase">Total Adverts</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{ads.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[11px] font-bold text-gray-400 uppercase">Active Listings</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{activeAdsCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[11px] font-bold text-gray-400 uppercase">Total Ad Views</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{totalViews.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[11px] font-bold text-gray-400 uppercase">VIP Boosted</p>
          <p className="text-2xl font-black text-amber-500 mt-1">{vipAdsCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[11px] font-bold text-gray-400 uppercase">Callback Leads</p>
          <p className="text-2xl font-black text-brand-orange mt-1">{callbacks.length}</p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'listings' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Package className="w-4 h-4" /> My Listings ({ads.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('callbacks')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'callbacks' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <PhoneCall className="w-4 h-4" /> Buyer Callbacks ({callbacks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'payments' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Receipt className="w-4 h-4" /> VIP Boost Receipts ({transactions.length})
        </button>
      </div>

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
                          href={`/ad/${ad.id}`}
                          className="font-bold text-sm text-gray-900 hover:text-brand-orange"
                        >
                          {ad.title}
                        </Link>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            ad.status === 'Sold'
                              ? 'bg-gray-200 text-gray-700'
                              : ad.status === 'Flagged' || ad.status === 'Rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {ad.status}
                        </span>
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
                    <button
                      type="button"
                      onClick={() => {
                        setBoostAd(ad);
                        setSelectedTier('TOP');
                      }}
                      className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-gray-950 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {ad.is_vip ? 'Extend VIP' : 'Boost Ad'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(ad)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition"
                    >
                      {ad.status === 'Sold' ? 'Mark Available' : 'Mark Sold'}
                    </button>

                    <Link
                      href={`/ad/${ad.id}`}
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
