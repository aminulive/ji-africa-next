"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Core Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Extended Registration States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [socials, setSocials] = useState({ facebook: '', twitter: '', instagram: '', tiktok: '', youtube: '', whatsapp: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let res;

      if (isLogin) {
        // LOGIN: Standard JSON Payload
        res = await fetch('https://ji-africa-backend.onrender.com/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
      } else {
        // REGISTRATION: FormData Payload (Required for Image Uploads)
        const formData = new FormData();
        formData.append('full_name', fullName);
        formData.append('email', email);
        formData.append('phone', phone);
        formData.append('password', password);
        
        if (shopName) formData.append('shop_name', shopName);
        if (shopAddress) formData.append('shop_address', shopAddress);
        if (shopDescription) formData.append('shop_description', shopDescription);
        if (profileImage) formData.append('profile_image', profileImage);
        
        if (socials.facebook) formData.append('facebook', socials.facebook);
        if (socials.twitter) formData.append('twitter', socials.twitter);
        if (socials.instagram) formData.append('instagram', socials.instagram);
        if (socials.tiktok) formData.append('tiktok', socials.tiktok);
        if (socials.youtube) formData.append('youtube', socials.youtube);
        if (socials.whatsapp) formData.append('whatsapp', socials.whatsapp);

        res = await fetch('https://ji-africa-backend.onrender.com/api/auth/register', {
          method: 'POST',
          body: formData // Note: No Content-Type header when sending FormData
        });
      }
      
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('ji_user', JSON.stringify(data.user));
        localStorage.setItem('ji_token', data.token);
        
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Is the server waking up? Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-brand-orange mb-6 transition">
        <ChevronLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button 
            onClick={() => { setIsLogin(true); setError(''); }}
            type="button"
            className={`flex-1 pb-3 font-semibold text-center transition ${isLogin ? 'text-brand-orange border-b-2 border-brand-orange' : 'text-gray-400 border-b-2 border-transparent hover:text-gray-600'}`}
          >
            Log In
          </button>
          <button 
            onClick={() => { setIsLogin(false); setError(''); }}
            type="button"
            className={`flex-1 pb-3 font-semibold text-center transition ${!isLogin ? 'text-brand-orange border-b-2 border-brand-orange' : 'text-gray-400 border-b-2 border-transparent hover:text-gray-600'}`}
          >
            Create Account
          </button>
        </div>

        {/* Error Message Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Profile Photo (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-brand-orange hover:file:bg-orange-100"
                />
              </div>

              <input type="text" placeholder="Full Name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition" />
              <input type="text" placeholder="Shop Name / Brand Name (Optional)" value={shopName} onChange={(e) => setShopName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition" />
              <input type="tel" placeholder="Phone Number (e.g. 08012345678)" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition" />
            </>
          )}

          <input type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition" />
          
          {!isLogin && (
            <>
              <input type="text" placeholder="Shop Address / Location (e.g. Wuse 2, Abuja)" value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition" />
              <textarea placeholder="Short description of your shop/business..." rows={2} value={shopDescription} onChange={(e) => setShopDescription(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition"></textarea>
            </>
          )}

          <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition" />

          {!isLogin && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-800 mb-3">Add Social Media Handles (Optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Facebook URL" value={socials.facebook} onChange={(e) => setSocials({...socials, facebook: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition" />
                <input type="text" placeholder="X (Twitter) URL" value={socials.twitter} onChange={(e) => setSocials({...socials, twitter: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition" />
                <input type="text" placeholder="Instagram URL" value={socials.instagram} onChange={(e) => setSocials({...socials, instagram: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition" />
                <input type="text" placeholder="TikTok URL" value={socials.tiktok} onChange={(e) => setSocials({...socials, tiktok: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition" />
                <input type="text" placeholder="YouTube Channel URL" value={socials.youtube} onChange={(e) => setSocials({...socials, youtube: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition" />
                <input type="text" placeholder="WhatsApp Link (wa.me/)" value={socials.whatsapp} onChange={(e) => setSocials({...socials, whatsapp: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition" />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 flex justify-center items-center py-3.5 bg-brand-orange hover:bg-orange-700 text-white font-bold rounded-lg shadow-sm transition disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Log In' : 'Create Account')}
          </button>
        </form>

      </div>
    </div>
  );
}