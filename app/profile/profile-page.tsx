"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BadgeCheck,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

const API_URL = 'https://ji-africa-backend.onrender.com/api';

function resolveImageUrl(path: string | null | undefined, fallback: string) {
  if (!path) return fallback;
  return path.startsWith('http') || path.startsWith('data:')
    ? path
    : `https://ji-africa-backend.onrender.com${path}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [socials, setSocials] = useState({
    facebook: '',
    twitter: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    whatsapp: '',
  });

  // Previews & Cropped Blobs
  const [profilePreview, setProfilePreview] = useState('https://placehold.co/150x150?text=U');
  const [bannerPreview, setBannerPreview] = useState('https://placehold.co/800x200?text=Banner');
  const [profileBlob, setProfileBlob] = useState<Blob | null>(null);
  const [bannerBlob, setBannerBlob] = useState<Blob | null>(null);

  // Cropper Modal State (1:1 Profile, 4:1 Banner)
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<'profile' | 'banner'>('profile');
  const [rawCropUrl, setRawCropUrl] = useState('');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const cropImgRef = useRef<HTMLImageElement | null>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('ji_token');
    const storedUser = localStorage.getItem('ji_user');
    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    try {
      const u = JSON.parse(storedUser);
      setUser(u);
      setFullName(u.full_name || '');
      setShopName(u.shop_name || '');
      setPhone(u.phone || '');
      setShopAddress(u.shop_address || '');
      setShopDescription(u.shop_description || '');
      setSocials({
        facebook: u.facebook || '',
        twitter: u.twitter || '',
        instagram: u.instagram || '',
        tiktok: u.tiktok || '',
        youtube: u.youtube || '',
        whatsapp: u.whatsapp_link || u.whatsapp || '',
      });
      setProfilePreview(resolveImageUrl(u.profile_image, 'https://placehold.co/150x150?text=U'));
      setBannerPreview(resolveImageUrl(u.shop_image, 'https://placehold.co/800x200?text=Banner'));
    } catch {
      router.push('/login');
    }
  }, [router]);

  // Open Cropper Modal
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, target: 'profile' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropTarget(target);
    setRawCropUrl(URL.createObjectURL(file));
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setCropModalOpen(true);
    e.target.value = '';
  };

  // Export Cropped Canvas to JPEG Blob
  const confirmCrop = () => {
    const img = cropImgRef.current;
    if (!img) return;

    const outW = cropTarget === 'profile' ? 400 : 1200;
    const outH = cropTarget === 'profile' ? 400 : 300;
    const frameW = cropTarget === 'profile' ? 280 : 560;
    const frameH = cropTarget === 'profile' ? 280 : 140;

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseScale = Math.max(frameW / img.naturalWidth, frameH / img.naturalHeight);
    const totalScale = baseScale * zoom;
    const drawnW = img.naturalWidth * totalScale;
    const drawnH = img.naturalHeight * totalScale;

    const imgLeftInFrame = (frameW - drawnW) / 2 + offset.x;
    const imgTopInFrame = (frameH - drawnH) / 2 + offset.y;

    const ratio = outW / frameW;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(
      img,
      imgLeftInFrame * ratio,
      imgTopInFrame * ratio,
      drawnW * ratio,
      drawnH * ratio
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const previewUrl = URL.createObjectURL(blob);
        if (cropTarget === 'profile') {
          setProfileBlob(blob);
          setProfilePreview(previewUrl);
        } else {
          setBannerBlob(blob);
          setBannerPreview(previewUrl);
        }
        setCropModalOpen(false);
      },
      'image/jpeg',
      0.9
    );
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('ji_token');

    const formData = new FormData();
    formData.append('full_name', fullName);
    formData.append('shop_name', shopName);
    formData.append('phone', phone);
    formData.append('shop_address', shopAddress);
    formData.append('shop_description', shopDescription);

    formData.append('facebook', socials.facebook);
    formData.append('twitter', socials.twitter);
    formData.append('instagram', socials.instagram);
    formData.append('tiktok', socials.tiktok);
    formData.append('youtube', socials.youtube);
    formData.append('whatsapp_link', socials.whatsapp);

    if (profileBlob) {
      formData.append('profile_image', profileBlob, 'profile.jpg');
    }
    if (bannerBlob) {
      formData.append('shop_image', bannerBlob, 'banner.jpg');
    }

    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.user) {
        setProfileBlob(null);
        setBannerBlob(null);
        setUser(data.user);
        localStorage.setItem('ji_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('ji_user_updated'));
        notify('Profile updated successfully!', 'success');
      } else {
        notify(data.error || 'Failed to update profile', 'error');
      }
    } catch {
      notify('Server error', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-bold text-white ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-brand-orange" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* Top Profile Header Card */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex items-center gap-6 relative overflow-hidden">
        {user.is_verified && (
          <div className="absolute -right-10 top-5 bg-blue-500 text-white text-xs font-bold px-10 py-1 rotate-45 shadow-sm">
            VERIFIED
          </div>
        )}
        <div className="w-20 h-20 bg-orange-100 text-orange-700 rounded-full overflow-hidden border-2 border-orange-200 shrink-0">
          <img src={profilePreview} alt={user.full_name} className="w-full h-full object-cover" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {user.full_name}
            {user.is_verified && <BadgeCheck className="w-5 h-5 text-blue-500" />}
          </h2>
          <p className="text-xs text-gray-500">{user.email}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Link
              href="/dashboard/seller"
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold shadow transition hover:bg-gray-800"
            >
              My Dashboard
            </Link>
            <Link
              href={`/shop/${user.id}`}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-800 rounded-lg text-xs font-bold shadow-sm transition hover:bg-gray-50"
            >
              View My Shop
            </Link>
          </div>
        </div>
      </div>

      {/* Profile & Shop Settings Form */}
      <form
        onSubmit={handleProfileUpdate}
        className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-6"
      >
        <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">
          Shop Presentation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">
              Update Profile Photo
            </label>
            <img
              src={profilePreview}
              alt="Profile Preview"
              className="w-16 h-16 rounded-full object-cover mb-2 border border-gray-200"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, 'profile')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-brand-orange"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">
              Update Shop Banner Image
            </label>
            <img
              src={bannerPreview}
              alt="Banner Preview"
              className="w-full h-16 rounded-lg object-cover mb-2 border border-gray-200"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, 'banner')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-brand-orange"
            />
          </div>
        </div>

        <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 pt-4">
          Profile Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-orange"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">
              Shop Name (Optional)
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-orange"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">
              Email (Read Only)
            </label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-orange"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">
              Shop Address / Location
            </label>
            <input
              type="text"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-orange"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">
              Shop Description
            </label>
            <textarea
              rows={3}
              value={shopDescription}
              onChange={(e) => setShopDescription(e.target.value)}
              placeholder="Tell buyers what you sell..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-orange"
            ></textarea>
          </div>
        </div>

        <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 pt-4">
          Social Media Handles (Optional)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Facebook URL"
            value={socials.facebook}
            onChange={(e) => setSocials({ ...socials, facebook: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
          />
          <input
            type="text"
            placeholder="X (Twitter) URL"
            value={socials.twitter}
            onChange={(e) => setSocials({ ...socials, twitter: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
          />
          <input
            type="text"
            placeholder="Instagram URL"
            value={socials.instagram}
            onChange={(e) => setSocials({ ...socials, instagram: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
          />
          <input
            type="text"
            placeholder="TikTok URL"
            value={socials.tiktok}
            onChange={(e) => setSocials({ ...socials, tiktok: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
          />
          <input
            type="text"
            placeholder="YouTube Channel URL"
            value={socials.youtube}
            onChange={(e) => setSocials({ ...socials, youtube: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
          />
          <input
            type="text"
            placeholder="WhatsApp Link (wa.me/)"
            value={socials.whatsapp}
            onChange={(e) => setSocials({ ...socials, whatsapp: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md transition flex items-center gap-2 disabled:opacity-70"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>

      {/* Adjust Image Cropper Modal (1:1 for Profile, 4:1 for Banner) */}
      {cropModalOpen && (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm z-[60] flex flex-col items-center justify-center p-4">
          <div className="bg-gray-950 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 text-white">
              <h3 className="font-bold">
                Adjust Image ({cropTarget === 'profile' ? '1:1 Square' : '4:1 Banner'})
              </h3>
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 bg-black flex flex-col items-center justify-center gap-4 select-none">
              <p className="text-[11px] text-gray-400">
                Drag image to reposition • Use slider to zoom
              </p>

              {/* Crop Frame */}
              <div
                onMouseDown={(e) => {
                  setDragging(true);
                  dragStartRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
                }}
                onMouseMove={(e) => {
                  if (!dragging) return;
                  setOffset({
                    x: e.clientX - dragStartRef.current.x,
                    y: e.clientY - dragStartRef.current.y,
                  });
                }}
                onMouseUp={() => setDragging(false)}
                onMouseLeave={() => setDragging(false)}
                style={{
                  width: cropTarget === 'profile' ? 280 : '100%',
                  maxWidth: cropTarget === 'profile' ? 280 : 560,
                  height: cropTarget === 'profile' ? 280 : 140,
                }}
                className="relative overflow-hidden border-2 border-brand-orange bg-gray-900 cursor-move flex items-center justify-center rounded-lg"
              >
                <img
                  ref={cropImgRef}
                  src={rawCropUrl}
                  alt="Crop target"
                  draggable={false}
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  }}
                  className="max-w-none max-h-none object-cover pointer-events-none"
                />
              </div>

              {/* Zoom Slider */}
              <div className="flex items-center gap-3 w-full max-w-xs text-white">
                <ZoomOut className="w-4 h-4 text-gray-400" />
                <input
                  type="range"
                  min={0.5}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-brand-orange"
                />
                <ZoomIn className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-900 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                className="px-5 py-2.5 rounded-lg text-sm font-bold text-gray-300 hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmCrop}
                className="px-5 py-2.5 rounded-lg text-sm font-bold bg-brand-orange hover:bg-orange-700 text-white shadow-sm transition"
              >
                Crop &amp; Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}