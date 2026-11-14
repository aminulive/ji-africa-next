"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Users,
  Package,
  FileText,
  Mail,
  BadgeCheck,
  CheckCircle2,
  XCircle,
  Trash2,
  Plus,
  Edit3,
  Loader2,
  Search,
  AlertTriangle,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';

const API_URL = 'https://ji-africa-backend.onrender.com/api';

function getAdThumb(ad: any) {
  if (!ad?.image) return 'https://placehold.co/120x90/f8fafc/94a3b8?text=Ad';
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
  return 'https://placehold.co/120x90/f8fafc/94a3b8?text=Ad';
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'moderation' | 'users' | 'blog' | 'messages'>('moderation');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedSellers: 0,
    totalAds: 0,
    flaggedAds: 0,
    publishedPosts: 0,
    unreadMessages: 0,
    openReports: 0,
  });

  // Moderation State
  const [ads, setAds] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [adFilter, setAdFilter] = useState<'all' | 'Flagged' | 'Available' | 'Rejected'>('all');

  // Users & KYC State
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Blog CMS State
  const [posts, setPosts] = useState<any[]>([]);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [showBlogEditor, setShowBlogEditor] = useState(false);
  const [blogForm, setBlogForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    status: 'published',
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [savingPost, setSavingPost] = useState(false);

  // Contact Messages State
  const [messages, setMessages] = useState<any[]>([]);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  };

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('ji_token') || ''}`,
  });

  const loadAdminData = useCallback(async () => {
    const token = localStorage.getItem('ji_token');
    const rawUser = localStorage.getItem('ji_user');
    if (!token || !rawUser) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(rawUser);
      if (!['admin', 'super_admin'].includes(parsedUser.role)) {
        router.push('/dashboard/seller');
        return;
      }
    } catch {
      router.push('/login');
      return;
    }

    try {
      const headers = getAuthHeaders();
      const [statsRes, adsRes, usersRes, blogRes, msgRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, { headers }),
        fetch(`${API_URL}/admin/ads?status=${adFilter}`, { headers }),
        fetch(`${API_URL}/admin/users?search=${encodeURIComponent(userSearch)}`, { headers }),
        fetch(`${API_URL}/admin/blog`, { headers }),
        fetch(`${API_URL}/admin/messages`, { headers }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (adsRes.ok) {
        const d = await adsRes.json();
        setAds(d.ads || []);
        setReports(d.reports || []);
      }
      if (usersRes.ok) setUsers(await usersRes.json());
      if (blogRes.ok) setPosts(await blogRes.json());
      if (msgRes.ok) setMessages(await msgRes.json());
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  }, [router, adFilter, userSearch]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Ad Moderation Handlers
  const handleModerateAd = async (adId: number, status: 'Available' | 'Rejected') => {
    try {
      const res = await fetch(`${API_URL}/admin/ads/${adId}/moderate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          status,
          reason: status === 'Rejected' ? 'Rejected by marketplace moderator' : null,
        }),
      });
      if (res.ok) {
        notify(`Ad #${adId} marked as ${status}`);
        loadAdminData();
      }
    } catch {}
  };

  const handleDeleteAd = async (adId: number) => {
    if (!confirm('Permanently delete this listing?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/ads/${adId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        notify('Ad permanently deleted');
        loadAdminData();
      }
    } catch {}
  };

  const handleResolveReport = async (reportId: number) => {
    try {
      const res = await fetch(`${API_URL}/admin/reports/${reportId}/resolve`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        notify('Report marked as resolved');
        loadAdminData();
      }
    } catch {}
  };

  // User Verification & Role Handlers
  const handleToggleVerifyUser = async (user: any) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ is_verified: !user.is_verified }),
      });
      if (res.ok) {
        notify(!user.is_verified ? `${user.full_name} verified!` : 'Verification badge removed');
        loadAdminData();
      }
    } catch {}
  };

  const handleRoleChange = async (userId: number, role: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        notify(`User role updated to ${role}`);
        loadAdminData();
      }
    } catch {}
  };

  // Blog CMS Handlers
  const openNewPostEditor = () => {
    setEditingPost(null);
    setCoverFile(null);
    setBlogForm({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      seo_title: '',
      seo_description: '',
      seo_keywords: '',
      status: 'published',
    });
    setShowBlogEditor(true);
  };

  const openEditPostEditor = (post: any) => {
    setEditingPost(post);
    setCoverFile(null);
    setBlogForm({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      seo_title: post.seo_title || '',
      seo_description: post.seo_description || '',
      seo_keywords: post.seo_keywords || '',
      status: post.status || 'published',
    });
    setShowBlogEditor(true);
  };

  const handleSaveBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPost(true);

    const formData = new FormData();
    formData.append('title', blogForm.title);
    if (blogForm.slug) formData.append('slug', blogForm.slug);
    formData.append('excerpt', blogForm.excerpt);
    formData.append('content', blogForm.content);
    formData.append('seo_title', blogForm.seo_title);
    formData.append('seo_description', blogForm.seo_description);
    formData.append('seo_keywords', blogForm.seo_keywords);
    formData.append('status', blogForm.status);
    if (coverFile) formData.append('cover_image', coverFile);

    try {
      const url = editingPost
        ? `${API_URL}/admin/blog/${editingPost.id}`
        : `${API_URL}/admin/blog`;
      const method = editingPost ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        notify(editingPost ? 'Article updated!' : 'Article published!');
        setShowBlogEditor(false);
        loadAdminData();
      } else {
        notify(data.error || 'Failed to save article');
      }
    } catch {
      notify('Server error saving article');
    } finally {
      setSavingPost(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Delete this blog article permanently?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/blog/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        notify('Article deleted');
        loadAdminData();
      }
    } catch {}
  };

  // Contact Message Handler
  const handleMarkMessageRead = async (msgId: number) => {
    try {
      const res = await fetch(`${API_URL}/admin/messages/${msgId}/read`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        notify('Marked as read');
        loadAdminData();
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-brand-orange" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <Link
            href="/dashboard/seller"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-orange mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Seller Dashboard
          </Link>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-brand-orange" />
            Super Admin Governance &amp; CMS
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Moderate marketplace listings, verify seller KYC badges, and manage SEO editorial content.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/blog"
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Public Blog
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[11px] font-bold text-gray-400 uppercase">Total Users</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[11px] font-bold text-gray-400 uppercase">Verified Sellers</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{stats.verifiedSellers}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[11px] font-bold text-gray-400 uppercase">Total Listings</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{stats.totalAds}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[11px] font-bold text-gray-400 uppercase">Flagged / Reports</p>
          <p className="text-2xl font-black text-red-600 mt-1">
            {stats.flaggedAds + stats.openReports}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[11px] font-bold text-gray-400 uppercase">Published Blogs</p>
          <p className="text-2xl font-black text-brand-orange mt-1">{stats.publishedPosts}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[11px] font-bold text-gray-400 uppercase">Unread Inbox</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.unreadMessages}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('moderation')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'moderation'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Package className="w-4 h-4" /> Ad Moderation ({ads.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'users'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users className="w-4 h-4" /> Users &amp; KYC ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('blog')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'blog'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FileText className="w-4 h-4" /> Blog CMS ({posts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('messages')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'messages'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Mail className="w-4 h-4" /> Contact Inbox ({messages.length})
        </button>
      </div>

      {/* TAB 1: AD MODERATION & REPORTS */}
      {activeTab === 'moderation' && (
        <div className="space-y-6">
          {reports.filter((r) => r.status === 'open').length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <h3 className="text-sm font-black text-red-800 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" /> Open Buyer Ad Reports
              </h3>
              <div className="space-y-2">
                {reports
                  .filter((r) => r.status === 'open')
                  .map((rep) => (
                    <div
                      key={rep.id}
                      className="bg-white p-3.5 rounded-xl border border-red-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-900">
                          Ad #{rep.ad_id} — Reason: <span className="text-red-600">{rep.reason}</span>
                        </p>
                        {rep.details && <p className="text-xs text-gray-500 mt-0.5">{rep.details}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/ad/${rep.ad_id}`}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold"
                        >
                          Inspect Ad
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleResolveReport(rep.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                        >
                          Mark Resolved
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-gray-900 text-base">Marketplace Listings Queue</h2>
              <div className="flex gap-1.5">
                {(['all', 'Flagged', 'Available', 'Rejected'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setAdFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                      adFilter === st
                        ? 'bg-brand-orange text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {ads.length === 0 ? (
                <div className="p-10 text-center text-xs text-gray-500 font-medium">
                  No listings match this filter.
                </div>
              ) : (
                ads.map((ad) => (
                  <div
                    key={ad.id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={getAdThumb(ad)}
                        alt={ad.title}
                        className="w-16 h-14 rounded-lg object-cover border border-gray-200 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/ad/${ad.id}`}
                            className="font-bold text-sm text-gray-900 hover:text-brand-orange"
                          >
                            {ad.title}
                          </Link>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              ad.status === 'Flagged' || ad.status === 'Rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {ad.status}
                          </span>
                        </div>
                        <p className="text-xs font-black text-brand-orange mt-0.5">
                          ₦{Number(ad.price).toLocaleString('en-NG')}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Seller: {ad.user?.shop_name || ad.user?.full_name} ({ad.user?.email}) •{' '}
                          {ad.category?.name || 'General'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleModerateAd(ad.id, 'Available')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModerateAd(ad.id, 'Rejected')}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAd(ad.id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS & SELLER KYC */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-bold text-gray-900 text-base">Seller Accounts &amp; KYC Badges</h2>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search name, email, or shop..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase">
                  <th className="py-3 px-4">Seller / Shop</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Ads</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">KYC Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        {u.shop_name || u.full_name}
                        {u.is_verified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {u.full_name} {u.username ? `(@${u.username})` : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-gray-800">{u.email}</div>
                      <div className="text-[11px] text-gray-500">{u.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-700">{u._count?.ads || 0}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="px-2.5 py-1 border border-gray-200 rounded-md text-xs font-semibold bg-white"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          u.is_verified
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {u.is_verified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleVerifyUser(u)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          u.is_verified
                            ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {u.is_verified ? 'Revoke Badge' : 'Verify Seller'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SEO BLOG CMS */}
      {activeTab === 'blog' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div>
              <h2 className="font-bold text-gray-900 text-base">SEO Editorial &amp; Blog Publisher</h2>
              <p className="text-xs text-gray-500">
                Publish buying guides, market insights, and safety tips indexed at /blog.
              </p>
            </div>
            <button
              type="button"
              onClick={openNewPostEditor}
              className="px-4 py-2.5 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Write New Article
            </button>
          </div>

          {showBlogEditor && (
            <form
              onSubmit={handleSaveBlogPost}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-black text-gray-900">
                  {editingPost ? `Edit Article: ${editingPost.title}` : 'Publish New Article'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowBlogEditor(false)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={blogForm.title}
                    onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                    placeholder="e.g. How to Safely Buy Tokunbo Cars in Abuja & Lagos"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                    Custom URL Slug (Optional)
                  </label>
                  <input
                    type="text"
                    value={blogForm.slug}
                    onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                    placeholder="auto-generated-from-title"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                    Cover Image (Cloudinary)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                    Publish Status
                  </label>
                  <select
                    value={blogForm.status}
                    onChange={(e) => setBlogForm({ ...blogForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-brand-orange"
                  >
                    <option value="published">Published (Live)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                    Short Excerpt
                  </label>
                  <input
                    type="text"
                    value={blogForm.excerpt}
                    onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                    placeholder="Brief summary shown on the blog feed..."
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-orange"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                    Article Body *
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={blogForm.content}
                    onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                    placeholder="Write your full article here..."
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                    SEO Meta Title
                  </label>
                  <input
                    type="text"
                    value={blogForm.seo_title}
                    onChange={(e) => setBlogForm({ ...blogForm, seo_title: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                    SEO Keywords (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={blogForm.seo_keywords}
                    onChange={(e) => setBlogForm({ ...blogForm, seo_keywords: e.target.value })}
                    placeholder="nigeria marketplace, buy phones lagos, abuja cars"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingPost}
                  className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-60"
                >
                  {savingPost && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingPost ? 'Update Article' : 'Publish Article'}
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
            {posts.length === 0 ? (
              <div className="p-10 text-center text-xs text-gray-500">
                No blog articles yet. Click "Write New Article" to publish your first post.
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    {post.cover_image && (
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-16 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="font-bold text-sm text-gray-900 hover:text-brand-orange"
                        >
                          {post.title}
                        </Link>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            post.status === 'published'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {post.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        /blog/{post.slug} • {new Date(post.created_at).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditPostEditor(post)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CONTACT INBOX */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-base">Support &amp; Contact Inquiries</h2>
          </div>
          {messages.length === 0 ? (
            <div className="p-10 text-center text-xs text-gray-500">
              No contact messages received yet.
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="p-5 flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">{m.full_name}</span>
                    <span className="text-xs text-gray-500">({m.email})</span>
                    {m.status === 'unread' && (
                      <span className="bg-brand-orange text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-gray-700">{m.subject || 'General Inquiry'}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{m.message}</p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(m.created_at).toLocaleString('en-GB')}
                  </p>
                </div>

                <div className="flex items-start gap-2 shrink-0">
                  <a
                    href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject || 'ji.africa Support')}`}
                    className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold"
                  >
                    Reply via Email
                  </a>
                  {m.status === 'unread' && (
                    <button
                      type="button"
                      onClick={() => handleMarkMessageRead(m.id)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
