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
  FolderTree,
  ChevronRight,
  ChevronDown,
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
  const [activeTab, setActiveTab] = useState<
    'moderation' | 'users' | 'trust' | 'reviews' | 'categories' | 'blog' | 'messages'
  >('moderation');
  const [trustOrders, setTrustOrders] = useState<any[]>([]);
  const [trustSellers, setTrustSellers] = useState<any[]>([]);
  const [adminReviews, setAdminReviews] = useState<any[]>([]);
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
  const [userSearch, setUserSearch] = useState("");
  const [kycFilter, setKycFilter] = useState<"all" | "pending" | "verified">("all");
  const [reviewUser, setReviewUser] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewActionLoading, setReviewActionLoading] = useState(false);

  // 4-Level Categories Governance State
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('layers');
  const [creatingCat, setCreatingCat] = useState(false);
  const [expandedCatIds, setExpandedCatIds] = useState<Record<number, boolean>>({});
  const [addingNodeTarget, setAddingNodeTarget] = useState<{
    catId: number;
    path: string[];
    label: string;
  } | null>(null);
  const [newNodeName, setNewNodeName] = useState('');
  const [savingNode, setSavingNode] = useState(false);

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
      const [statsRes, adsRes, usersRes, catsRes, blogRes, msgRes, revRes, trustRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, { headers }),
        fetch(`${API_URL}/admin/ads?status=${adFilter}`, { headers }),
        fetch(`${API_URL}/admin/users?search=${encodeURIComponent(userSearch)}`, { headers }),
        fetch(`${API_URL}/admin/categories`, { headers }),
        fetch(`${API_URL}/admin/blog`, { headers }),
        fetch(`${API_URL}/admin/messages`, { headers }),
        fetch(`${API_URL}/admin/reviews`, { headers }),
        fetch(`${API_URL}/admin/trust`, { headers }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (adsRes.ok) {
        const d = await adsRes.json();
        setAds(d.ads || []);
        setReports(d.reports || []);
      }
      if (usersRes.ok) setUsers(await usersRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());
      if (blogRes.ok) setPosts(await blogRes.json());
      if (msgRes.ok) setMessages(await msgRes.json());
      if (revRes?.ok) setAdminReviews(await revRes.json());
      if (trustRes?.ok) {
        const tJson = await trustRes.json();
        setTrustOrders(tJson.orders || []);
        setTrustSellers(tJson.enrolledSellers || []);
      }
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  }, [router, adFilter, userSearch]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const tabParam = sp.get('tab');
      if (
        tabParam &&
        ['moderation', 'users', 'categories', 'blog', 'messages'].includes(tabParam)
      ) {
        setActiveTab(tabParam as any);
      }
      if (sp.get('new') === '1') {
        setActiveTab('blog');
        setShowBlogEditor(true);
      }
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Category Tree Handlers
  const handleCreateMainCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || creatingCat) return;
    setCreatingCat(true);
    try {
      const res = await fetch(`${API_URL}/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: newCatName.trim(), icon: newCatIcon }),
      });
      const data = await res.json();
      if (res.ok) {
        notify(`Category "${newCatName.trim()}" added!`);
        setNewCatName('');
        if (data.category?.id) {
          setExpandedCatIds((prev) => ({ ...prev, [data.category.id]: true }));
        }
        loadAdminData();
      } else {
        notify(data.error || 'Could not add category');
      }
    } catch {
      notify('Network error creating category');
    } finally {
      setCreatingCat(false);
    }
  };

  const handleDeleteMainCategory = async (cat: any) => {
    if (!confirm(`Delete main category "${cat.name}" and all its subcategories?`)) return;
    try {
      const res = await fetch(`${API_URL}/admin/categories/${cat.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        notify(`Deleted category "${cat.name}"`);
        loadAdminData();
      } else {
        const d = await res.json();
        notify(d.error || 'Could not delete category');
      }
    } catch {
      notify('Network error deleting category');
    }
  };

  const handleAddSubNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingNodeTarget || !newNodeName.trim() || savingNode) return;
    setSavingNode(true);
    try {
      const res = await fetch(`${API_URL}/admin/categories/${addingNodeTarget.catId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          path: addingNodeTarget.path,
          name: newNodeName.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        notify(`Added "${newNodeName.trim()}"`);
        setExpandedCatIds((prev) => ({ ...prev, [addingNodeTarget.catId]: true }));
        setNewNodeName('');
        setAddingNodeTarget(null);
        loadAdminData();
      } else {
        notify(data.error || 'Failed to add subcategory');
      }
    } catch {
      notify('Network error adding subcategory');
    } finally {
      setSavingNode(false);
    }
  };

  const handleDeleteSubNode = async (catId: number, path: string[]) => {
    const targetName = path[path.length - 1];
    if (!confirm(`Remove "${targetName}" and any nested items inside it?`)) return;
    try {
      const res = await fetch(`${API_URL}/admin/categories/${catId}/nodes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ path }),
      });
      if (res.ok) {
        notify(`Removed "${targetName}"`);
        loadAdminData();
      } else {
        const d = await res.json();
        notify(d.error || 'Failed to remove item');
      }
    } catch {
      notify('Network error removing item');
    }
  };

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

  const resolveDocUrl = (url: string | null | undefined) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `https://ji-africa-backend.onrender.com${url}`;
  };

  const handleKycDecision = async (user: any, decision: "verified" | "rejected") => {
    setReviewActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          kyc_status: decision,
          kyc_rejection_reason: decision === "rejected" ? (rejectReason.trim() || "Document unclear or invalid") : null,
        }),
      });
      if (res.ok) {
        notify(decision === "verified" ? `${user.full_name} KYC approved & verified!` : `${user.full_name} KYC rejected`);
        setReviewUser(null);
        setRejectReason("");
        loadAdminData();
      }
    } catch {}
    setReviewActionLoading(false);
  };

  const handleModerateReview = async (reviewId: number, status: "published" | "hidden") => {
    try {
      const res = await fetch(`${API_URL}/admin/reviews/${reviewId}/moderate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        notify(`Review marked as ${status}`);
        loadAdminData();
      }
    } catch {}
  };

  const handleDeleteReview = async (reviewId: number) => {
    try {
      const res = await fetch(`${API_URL}/admin/reviews/${reviewId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        notify("Review deleted");
        loadAdminData();
      }
    } catch {}
  };

  const handleResolveTrust = async (orderId: number, action: "release_to_seller" | "mark_paid_out" | "refund_buyer") => {
    try {
      const res = await fetch(`${API_URL}/admin/trust/${orderId}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        notify(data.message || "Escrow updated");
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
            Moderate marketplace listings, verify seller KYC badges, manage 4-level categories, and publish SEO content.
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
          <p className="text-[11px] font-bold text-gray-400 uppercase">Categories</p>
          <p className="text-2xl font-black text-brand-orange mt-1">{categories.length}</p>
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
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'reviews'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Reviews ({adminReviews.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('trust')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'trust'
              ? 'bg-emerald-700 text-white'
              : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> JI Trust ({trustOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'categories'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FolderTree className="w-4 h-4" /> Categories ({categories.length})
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
      {activeTab === "users" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-gray-900 text-base">Seller Accounts &amp; KYC Verification Queue</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Inspect submitted ID/CAC documents and grant or revoke the blue Verified Seller badge.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {(["all", "pending", "verified"] as const).map((kf) => (
                  <button
                    key={kf}
                    type="button"
                    onClick={() => setKycFilter(kf)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold capitalize transition ${
                      kycFilter === kf ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {kf === "pending"
                      ? `Pending KYC (${users.filter((u) => u.kyc_status === "pending").length})`
                      : kf}
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-64">
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
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase">
                  <th className="py-3 px-4">Seller / Shop</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Ads</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">KYC Status &amp; Document</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {users
                  .filter((u) => {
                    if (kycFilter === "pending") return u.kyc_status === "pending";
                    if (kycFilter === "verified") return Boolean(u.is_verified);
                    return true;
                  })
                  .map((u) => {
                    const docHref = resolveDocUrl(u.kyc_doc_url);
                    return (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900 flex items-center gap-1.5">
                            {u.shop_name || u.full_name}
                            {u.is_verified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {u.full_name} {u.username ? `(@${u.username})` : ""}
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
                        <td className="py-3.5 px-4 space-y-1">
                          <div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                u.is_verified || u.kyc_status === "verified"
                                  ? "bg-blue-100 text-blue-700"
                                  : u.kyc_status === "pending"
                                  ? "bg-amber-100 text-amber-800"
                                  : u.kyc_status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {u.is_verified ? "Verified" : u.kyc_status || "Unverified"}
                            </span>
                          </div>
                          {u.kyc_doc_type && (
                            <div className="text-[11px] text-gray-500">
                              {u.kyc_doc_type} {u.kyc_doc_number ? `• ${u.kyc_doc_number}` : ""}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {docHref && (
                            <button
                              type="button"
                              onClick={() => {
                                setReviewUser({ ...u, kyc_doc_url: docHref });
                                setRejectReason(u.kyc_rejection_reason || "");
                              }}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition"
                            >
                              Review Doc
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleToggleVerifyUser(u)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                              u.is_verified
                                ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                          >
                            {u.is_verified ? "Revoke Badge" : "Verify Seller"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {reviewUser && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="font-black text-gray-900 text-base">
                      KYC Review: {reviewUser.shop_name || reviewUser.full_name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {reviewUser.kyc_doc_type} {reviewUser.kyc_doc_number ? `• ${reviewUser.kyc_doc_number}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReviewUser(null)}
                    className="text-xs font-bold text-gray-500 hover:text-gray-800"
                  >
                    Close
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col items-center">
                  {String(reviewUser.kyc_doc_url).toLowerCase().endsWith(".pdf") ? (
                    <a
                      href={reviewUser.kyc_doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-gray-900 text-white rounded-lg text-xs font-bold"
                    >
                      Open Uploaded PDF Document
                    </a>
                  ) : (
                    <a href={reviewUser.kyc_doc_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={reviewUser.kyc_doc_url}
                        alt="KYC Document"
                        className="max-h-72 rounded-lg object-contain border border-gray-200"
                      />
                    </a>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                    Rejection Reason (Required only if rejecting)
                  </label>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Photo is blurry, name does not match shop profile..."
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={reviewActionLoading}
                    onClick={() => handleKycDecision(reviewUser, "rejected")}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold disabled:opacity-60"
                  >
                    Reject Document
                  </button>
                  <button
                    type="button"
                    disabled={reviewActionLoading}
                    onClick={() => handleKycDecision(reviewUser, "verified")}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-60"
                  >
                    Approve &amp; Grant Verified Badge
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2A: JI TRUST ESCROW LEDGER & MEDIATION */}
      {activeTab === 'trust' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-base">🛡️ JI Trust Escrow Ledger &amp; Dispute Mediation</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Track held escrow funds, 3% commission revenue, seller bank payout details, and disputed orders.
            </p>
          </div>
          {/* Enrolled Sellers & Registered Payout Accounts */}
          <div className="p-5 bg-emerald-50/40 space-y-3">
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
              Enrolled JI Trust Sellers &amp; Payout Bank Accounts ({trustSellers.length})
            </h3>
            {trustSellers.length === 0 ? (
              <p className="text-xs text-gray-500">No sellers enrolled in JI Trust yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {trustSellers.map((s) => (
                  <div key={s.id} className="bg-white border border-emerald-200 rounded-xl p-3.5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{s.shop_name || s.full_name}</span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        JI Trust Active
                      </span>
                    </div>
                    <p className="text-gray-500">{s.email} • {s.phone}</p>
                    <p className="font-semibold text-gray-800 pt-1 border-t border-gray-100">
                      Bank: {s.payout_bank_name || "—"} | Acct: <span className="font-mono">{s.payout_account_number || "—"}</span> ({s.payout_account_name || "—"})
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {trustOrders.length === 0 ? (
            <div className="p-10 text-center text-xs text-gray-500">No JI Trust escrow transactions yet.</div>
          ) : (
            trustOrders.map((ord) => (
              <div key={ord.id} className="p-5 flex flex-col lg:flex-row justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-gray-700">{ord.reference}</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        ord.status === "disputed"
                          ? "bg-red-100 text-red-700"
                          : ord.status === "released" || ord.status === "paid_out"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>
                  <p className="text-gray-800">
                    Item: <strong>{ord.ad_title || `Ad #${ord.ad_id}`}</strong> • Gross:{" "}
                    <strong>₦{Number(ord.item_amount).toLocaleString("en-NG")}</strong> • Fee (3%):{" "}
                    <strong className="text-brand-orange">₦{Number(ord.commission_amount).toLocaleString("en-NG")}</strong> • Seller Payout:{" "}
                    <strong className="text-emerald-700">₦{Number(ord.seller_payout_amount).toLocaleString("en-NG")}</strong>
                  </p>
                  <p className="text-gray-600">
                    Seller: <strong>{ord.seller_shop_name || ord.seller_name}</strong> | Bank:{" "}
                    <strong>
                      {ord.payout_bank_name
                        ? `${ord.payout_bank_name} — ${ord.payout_account_number} (${ord.payout_account_name})`
                        : "Not configured yet"}
                    </strong>
                  </p>
                  <p className="text-gray-600">
                    Buyer: <strong>{ord.buyer_name}</strong> ({ord.buyer_phone})
                  </p>
                  {ord.dispute_reason && (
                    <p className="text-red-600 font-bold">Dispute: {ord.dispute_reason}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-start gap-2 shrink-0">
                  {ord.status === "disputed" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleResolveTrust(ord.id, "release_to_seller")}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                      >
                        Release to Seller
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolveTrust(ord.id, "refund_buyer")}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
                      >
                        Refund Buyer
                      </button>
                    </>
                  )}
                  {ord.status === "released" && (
                    <button
                      type="button"
                      onClick={() => handleResolveTrust(ord.id, "mark_paid_out")}
                      className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold"
                    >
                      Mark Bank Payout Sent
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2B: REVIEWS MODERATION */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-base">Buyer &amp; Storefront Reviews Moderation</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Auto-flagged spam reviews appear at the top. Approve legitimate feedback or remove abuse.
            </p>
          </div>
          {adminReviews.length === 0 ? (
            <div className="p-10 text-center text-xs text-gray-500">No reviews submitted yet.</div>
          ) : (
            adminReviews.map((rev) => (
              <div key={rev.id} className="p-5 flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">{rev.reviewer_name || "Buyer"}</span>
                    <span className="text-xs font-black text-amber-500">{rev.rating}★</span>
                    <span className="text-xs text-gray-500">
                      → {rev.seller_shop_name || rev.seller_name} {rev.ad_title ? `(${rev.ad_title})` : "(Shop)"}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        rev.status === "flagged"
                          ? "bg-red-100 text-red-700"
                          : rev.status === "hidden"
                          ? "bg-gray-200 text-gray-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {rev.status}
                    </span>
                  </div>
                  {rev.flag_reason && (
                    <p className="text-[11px] font-bold text-red-600">Flag reason: {rev.flag_reason}</p>
                  )}
                  <p className="text-xs text-gray-700 leading-relaxed">{rev.comment}</p>
                  {rev.seller_reply && (
                    <p className="text-[11px] text-gray-500 italic">Seller reply: "{rev.seller_reply}"</p>
                  )}
                </div>

                <div className="flex items-start gap-2 shrink-0">
                  {rev.status !== "published" && (
                    <button
                      type="button"
                      onClick={() => handleModerateReview(rev.id, "published")}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                    >
                      Approve
                    </button>
                  )}
                  {rev.status === "published" && (
                    <button
                      type="button"
                      onClick={() => handleModerateReview(rev.id, "hidden")}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold"
                    >
                      Hide
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteReview(rev.id)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: 4-LEVEL CATEGORY TREE GOVERNANCE */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Add New Main Category (Level 1) */}
          <form
            onSubmit={handleCreateMainCategory}
            className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-end gap-3"
          >
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                New Main Category (Level 1) *
              </label>
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Phones & Tablets, Vehicles, Fashion..."
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-orange"
              />
            </div>

            <div className="w-full sm:w-48">
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                Category Icon
              </label>
              <select
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-brand-orange"
              >
                <option value="layers">General (Layers)</option>
                <option value="smartphone">Phones &amp; Tablets</option>
                <option value="car">Vehicles</option>
                <option value="home">Property</option>
                <option value="tv">Electronics / Laptops</option>
                <option value="sofa">Home &amp; Furniture</option>
                <option value="shirt">Fashion &amp; Beauty</option>
                <option value="briefcase">Jobs &amp; Services</option>
                <option value="wrench">Repair &amp; Construction</option>
                <option value="baby">Babies &amp; Kids</option>
                <option value="paw">Animals &amp; Pets</option>
                <option value="dumbbell">Sports &amp; Outdoors</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={creatingCat}
              className="px-5 py-2.5 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-60"
            >
              {creatingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Main Category
            </button>
          </form>

          {/* Inline Add Child Node Prompt */}
          {addingNodeTarget && (
            <form
              onSubmit={handleAddSubNode}
              className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex-1">
                <p className="text-[11px] font-black text-brand-orange uppercase mb-1">
                  Adding inside: {addingNodeTarget.label}
                </p>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  placeholder="Enter subcategory name..."
                  className="w-full px-3.5 py-2 bg-white border border-orange-300 rounded-lg text-sm outline-none focus:border-brand-orange"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="submit"
                  disabled={savingNode}
                  className="px-4 py-2 bg-brand-orange hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  {savingNode && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Item
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingNodeTarget(null);
                    setNewNodeName('');
                  }}
                  className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* 4-Level Category Tree List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-base">
                4-Level Category Hierarchy (Category → Subcategory → Sub-sub → 4th Level)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Expand any category to add or remove subcategories down to 4 levels deep.
              </p>
            </div>

            {categories.map((cat) => {
              const isExpanded = !!expandedCatIds[cat.id];
              const tree: any[] = Array.isArray(cat.category_tree) ? cat.category_tree : [];

              return (
                <div key={cat.id} className="p-4">
                  {/* Level 1 Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCatIds((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))
                      }
                      className="flex items-center gap-2 text-left font-black text-sm text-gray-900 hover:text-brand-orange"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-brand-orange" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <span>{cat.name}</span>
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {tree.length} subcategories
                      </span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedCatIds((prev) => ({ ...prev, [cat.id]: true }));
                          setAddingNodeTarget({
                            catId: cat.id,
                            path: [],
                            label: `${cat.name} (Level 2 Subcategory)`,
                          });
                          setNewNodeName('');
                        }}
                        className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-brand-orange border border-orange-200 rounded-lg text-[11px] font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Subcategory
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMainCategory(cat)}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[11px] font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>

                  {/* Expanded Tree (Levels 2 -> 3 -> 4) */}
                  {isExpanded && (
                    <div className="mt-3 pl-5 border-l-2 border-orange-100 space-y-2.5">
                      {tree.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">
                          No subcategories yet. Click &ldquo;+ Add Subcategory&rdquo; above.
                        </p>
                      ) : (
                        tree.map((l2: any) => (
                          <div key={l2.name} className="bg-gray-50 rounded-xl p-3 space-y-2">
                            {/* Level 2 Row */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-bold text-gray-800">
                                {l2.name}
                                <span className="ml-2 text-[10px] font-normal text-gray-400">
                                  (Level 2)
                                </span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddingNodeTarget({
                                      catId: cat.id,
                                      path: [l2.name],
                                      label: `${cat.name} → ${l2.name} (Level 3 Sub-subcategory)`,
                                    });
                                    setNewNodeName('');
                                  }}
                                  className="px-2 py-0.5 bg-white hover:bg-orange-50 text-brand-orange border border-gray-200 rounded text-[10px] font-bold inline-flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Add Sub-sub
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubNode(cat.id, [l2.name])}
                                  className="px-2 py-0.5 bg-white hover:bg-red-50 text-red-600 border border-gray-200 rounded text-[10px] font-bold inline-flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" /> Remove
                                </button>
                              </div>
                            </div>

                            {/* Level 3 Rows */}
                            {Array.isArray(l2.children) && l2.children.length > 0 && (
                              <div className="pl-4 border-l-2 border-gray-200 space-y-2">
                                {l2.children.map((l3: any) => (
                                  <div
                                    key={l3.name}
                                    className="bg-white rounded-lg p-2.5 border border-gray-100 space-y-1.5"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span className="text-xs font-semibold text-gray-700">
                                        • {l3.name}
                                        <span className="ml-1.5 text-[10px] text-gray-400">
                                          (Level 3)
                                        </span>
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setAddingNodeTarget({
                                              catId: cat.id,
                                              path: [l2.name, l3.name],
                                              label: `${cat.name} → ${l2.name} → ${l3.name} (Level 4)`,
                                            });
                                            setNewNodeName('');
                                          }}
                                          className="px-2 py-0.5 bg-orange-50 hover:bg-orange-100 text-brand-orange rounded text-[10px] font-bold inline-flex items-center gap-1"
                                        >
                                          <Plus className="w-3 h-3" /> Add 4th Level
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeleteSubNode(cat.id, [l2.name, l3.name])
                                          }
                                          className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px] font-bold inline-flex items-center gap-1"
                                        >
                                          <Trash2 className="w-3 h-3" /> Remove
                                        </button>
                                      </div>
                                    </div>

                                    {/* Level 4 Pills */}
                                    {Array.isArray(l3.children) && l3.children.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 pt-1 pl-3">
                                        {l3.children.map((l4: any) => (
                                          <span
                                            key={l4.name}
                                            className="inline-flex items-center gap-1 bg-orange-50 text-gray-800 border border-orange-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                                          >
                                            <span>{l4.name}</span>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleDeleteSubNode(cat.id, [
                                                  l2.name,
                                                  l3.name,
                                                  l4.name,
                                                ])
                                              }
                                              title={`Remove ${l4.name}`}
                                              className="text-red-500 hover:text-red-700"
                                            >
                                              <XCircle className="w-3.5 h-3.5" />
                                            </button>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: SEO BLOG CMS */}
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
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
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
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
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
                No blog articles yet. Click &ldquo;Write New Article&rdquo; to publish your first post.
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

      {/* TAB 5: CONTACT INBOX */}
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
