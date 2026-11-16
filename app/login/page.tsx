"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldCheck,
  KeyRound,
  MailCheck,
  RefreshCw,
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const API_URL = 'https://ji-africa-backend.onrender.com/api';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'verify'>('login');
  const [loading, setLoading] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login / Shared States
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Extended Registration States
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [socials, setSocials] = useState({
    facebook: '',
    twitter: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    whatsapp: '',
  });

  // Compliance & Newsletter States
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [jiTrustEnrolled, setJiTrustEnrolled] = useState(false);
  const [jiTrustTermsAccepted, setJiTrustTermsAccepted] = useState(false);
  const [showJiTrustModal, setShowJiTrustModal] = useState(false);
  const [payoutBankName, setPayoutBankName] = useState('');
  const [payoutAccountNumber, setPayoutAccountNumber] = useState('');
  const [payoutAccountName, setPayoutAccountName] = useState('');

  // Verification & Password Reset States
  const [otpCode, setOtpCode] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [newPassword, setNewPassword] = useState('');

  const hasGoogleClient = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const completeSession = (data: any) => {
    localStorage.setItem('ji_user', JSON.stringify(data.user));
    localStorage.setItem('ji_token', data.token);
    window.dispatchEvent(new Event('ji_user_updated'));
    router.push('/');
    router.refresh();
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (res.ok) {
        completeSession(data);
      } else {
        setError(data.error || 'Google sign-in failed.');
      }
    } catch {
      setError('Network error during Google sign-in.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email || resendCooldown > 0 || resendingCode) return;
    setResendingCode(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || `A new 6-digit code was sent to ${email}.`);
        setResendCooldown(30);
      } else {
        setError(data.error || 'Could not resend verification code.');
      }
    } catch {
      setError('Network error while resending code.');
    } finally {
      setResendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'login') {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        });
        const data = await res.json();
        if (res.ok) {
          completeSession(data);
        } else {
          setError(data.error || 'Invalid credentials. Please try again.');
        }
        return;
      }

      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Passwords do not match. Please enter the exact same password in both fields.');
          setLoading(false);
          return;
        }
        if (!acceptedTerms) {
          setError('Please read and accept the Terms & Conditions and Privacy Policy.');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('full_name', fullName);
        if (username.trim()) formData.append('username', username.trim().toLowerCase());
        formData.append('email', email);
        formData.append('phone', phone);
        formData.append('password', password);
        formData.append('accepted_terms', 'true');
        formData.append('newsletter_subscribed', newsletterSubscribed ? 'true' : 'false');
        if (jiTrustEnrolled) {
          if (!jiTrustTermsAccepted) {
            setError('Please read and accept the JI Trust Seller Terms & Conditions.');
            setLoading(false);
            return;
          }
          if (!payoutBankName.trim() || payoutAccountNumber.trim().length < 10 || !payoutAccountName.trim()) {
            setError('Please enter your Bank Name, 10-digit Account Number, and Account Name for JI Trust payouts.');
            setLoading(false);
            return;
          }
          formData.append('ji_trust_enrolled', 'true');
          formData.append('ji_trust_terms_accepted', 'true');
          formData.append('payout_bank_name', payoutBankName.trim());
          formData.append('payout_account_number', payoutAccountNumber.trim());
          formData.append('payout_account_name', payoutAccountName.trim());
        }

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

        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();

        if (res.ok) {
          localStorage.setItem('ji_user', JSON.stringify(data.user));
          localStorage.setItem('ji_token', data.token);
          window.dispatchEvent(new Event('ji_user_updated'));
          setOtpCode('');
          setResendCooldown(30);
          setSuccessMsg(
            `Account created! We sent a 6-digit verification code to ${email}. Enter it below or continue to your shop.`
          );
          setMode('verify');
        } else {
          setError(data.error || 'Registration failed. Please check your details.');
        }
        return;
      }

      if (mode === 'verify') {
        const res = await fetch(`${API_URL}/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: otpCode }),
        });
        const data = await res.json();
        if (res.ok) {
          if (data.user) {
            localStorage.setItem('ji_user', JSON.stringify(data.user));
            window.dispatchEvent(new Event('ji_user_updated'));
          }
          router.push('/');
          router.refresh();
        } else {
          setError(data.error || 'Invalid verification code.');
        }
        return;
      }

      if (mode === 'forgot') {
        if (resetStep === 'request') {
          const res = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const data = await res.json();
          if (res.ok) {
            setSuccessMsg(data.message || 'Reset code sent! Check your email inbox.');
            setResetStep('confirm');
          } else {
            setError(data.error || 'Could not send reset code.');
          }
        } else {
          const res = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code: otpCode, new_password: newPassword }),
          });
          const data = await res.json();
          if (res.ok) {
            setSuccessMsg(data.message || 'Password updated! Please log in.');
            setMode('login');
            setResetStep('request');
            setPassword('');
          } else {
            setError(data.error || 'Could not reset password.');
          }
        }
      }
    } catch {
      setError('Network error. Is the server waking up? Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordsEntered = password.length > 0 || confirmPassword.length > 0;
  const passwordsMatch = password.length >= 6 && password === confirmPassword;

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-brand-orange mb-6 transition"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
        {(mode === 'login' || mode === 'register') && (
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
              type="button"
              className={`flex-1 pb-3 font-semibold text-center transition ${
                mode === 'login'
                  ? 'text-brand-orange border-b-2 border-brand-orange'
                  : 'text-gray-400 border-b-2 border-transparent hover:text-gray-600'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError('');
                setSuccessMsg('');
              }}
              type="button"
              className={`flex-1 pb-3 font-semibold text-center transition ${
                mode === 'register'
                  ? 'text-brand-orange border-b-2 border-brand-orange'
                  : 'text-gray-400 border-b-2 border-transparent hover:text-gray-600'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {(mode === 'login' || mode === 'register') && hasGoogleClient && (
          <div className="mb-5">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Sign-In was cancelled or failed.')}
                shape="rectangular"
                size="large"
                width="100%"
                text={mode === 'login' ? 'signin_with' : 'signup_with'}
              />
            </div>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400 font-semibold">or continue with</span>
              </div>
            </div>
          </div>
        )}

        {/* --- MODE 1: LOGIN --- */}
        {mode === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                Email, Phone Number, or Username
              </label>
              <input
                type="text"
                placeholder="e.g. aminulive, 08012345678, or email@domain.com"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-gray-500 uppercase">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setResetStep('request');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-xs font-semibold text-brand-orange hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center items-center py-3.5 bg-brand-orange hover:bg-orange-700 text-white font-bold rounded-lg shadow-sm transition disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
            </button>
          </form>
        )}

        {/* --- MODE 2: CREATE ACCOUNT --- */}
        {mode === 'register' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Profile Photo (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-brand-orange hover:file:bg-orange-100"
              />
            </div>

            <input
              type="text"
              placeholder="Full Name *"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition"
            />

            <div>
              <input
                type="text"
                placeholder="Shop Username (e.g. aminulive)"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Your custom shop link: <span className="font-semibold text-gray-600">ji.africa/shop/{username || 'yourname'}</span>
              </p>
            </div>

            <input
              type="text"
              placeholder="Shop Name / Brand Name (Optional)"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition"
            />

            <input
              type="tel"
              placeholder="Phone Number (e.g. 08012345678) *"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition"
            />

            <input
              type="email"
              placeholder="Email Address *"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition"
            />

            <input
              type="text"
              placeholder="Shop Address / Location (e.g. Wuse 2, Abuja)"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition"
            />

            <textarea
              placeholder="Short description of your shop/business..."
              rows={2}
              value={shopDescription}
              onChange={(e) => setShopDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition"
            />

            {/* Dual Password Confirmation Fields */}
            <div className="space-y-2.5">
              <input
                type="password"
                placeholder="Create Password (min 6 characters) *"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition"
              />

              <input
                type="password"
                placeholder="Confirm Password *"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none transition ${
                  confirmPassword.length > 0
                    ? passwordsMatch
                      ? 'border-emerald-400 focus:border-emerald-500'
                      : 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-brand-orange'
                }`}
              />

              {passwordsEntered && confirmPassword.length > 0 && (
                <p
                  className={`text-[11px] font-bold flex items-center gap-1 ${
                    passwordsMatch ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {passwordsMatch ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
                    </>
                  )}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-800 mb-3">
                Add Social Media Handles (Optional)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Facebook URL"
                  value={socials.facebook}
                  onChange={(e) => setSocials({ ...socials, facebook: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition"
                />
                <input
                  type="text"
                  placeholder="X (Twitter) URL"
                  value={socials.twitter}
                  onChange={(e) => setSocials({ ...socials, twitter: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition"
                />
                <input
                  type="text"
                  placeholder="Instagram URL"
                  value={socials.instagram}
                  onChange={(e) => setSocials({ ...socials, instagram: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition"
                />
                <input
                  type="text"
                  placeholder="TikTok URL"
                  value={socials.tiktok}
                  onChange={(e) => setSocials({ ...socials, tiktok: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition"
                />
                <input
                  type="text"
                  placeholder="YouTube Channel URL"
                  value={socials.youtube}
                  onChange={(e) => setSocials({ ...socials, youtube: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition"
                />
                <input
                  type="text"
                  placeholder="WhatsApp Link (wa.me/)"
                  value={socials.whatsapp}
                  onChange={(e) => setSocials({ ...socials, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-brand-orange transition"
                />
              </div>
            </div>

            {/* Optional Seller Enrollment in JI Trust Escrow Protection */}
            <div className="pt-3 border-t border-gray-100">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      🛡️ Join JI Trust Escrow Protection (For Sellers)
                    </p>
                    <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                      Receive secure escrow payments from buyers across Nigeria. Funds are held by ji.africa and disbursed to your bank after buyer confirmation or 72h inspection (3% fee on completed sales).
                    </p>
                  </div>
                  <input
                    id="enroll-ji-trust"
                    type="checkbox"
                    checked={jiTrustEnrolled}
                    onChange={(e) => setJiTrustEnrolled(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-emerald-600 cursor-pointer shrink-0"
                  />
                </div>

                {jiTrustEnrolled && (
                  <div className="space-y-2.5 pt-2 border-t border-emerald-200/80">
                    <p className="text-[11px] font-bold text-emerald-900 uppercase">
                      Seller Settlement Bank Account Details
                    </p>
                    <input
                      type="text"
                      placeholder="Bank Name (e.g. GTBank, Zenith, Access, OPay) *"
                      value={payoutBankName}
                      onChange={(e) => setPayoutBankName(e.target.value)}
                      className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-xs bg-white focus:outline-none focus:border-emerald-600"
                    />
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="10-Digit Account Number *"
                      value={payoutAccountNumber}
                      onChange={(e) => setPayoutAccountNumber(e.target.value.replace(/D/g, ''))}
                      className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-xs bg-white focus:outline-none focus:border-emerald-600"
                    />
                    <input
                      type="text"
                      placeholder="Account Holder Full Name *"
                      value={payoutAccountName}
                      onChange={(e) => setPayoutAccountName(e.target.value)}
                      className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-xs bg-white focus:outline-none focus:border-emerald-600"
                    />

                    <div className="flex items-start gap-2 pt-1">
                      <input
                        id="accept-ji-trust-terms"
                        type="checkbox"
                        checked={jiTrustTermsAccepted}
                        onChange={(e) => setJiTrustTermsAccepted(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-emerald-600 cursor-pointer shrink-0"
                      />
                      <div className="text-[11px] text-emerald-950 leading-relaxed">
                        <label htmlFor="accept-ji-trust-terms" className="cursor-pointer">
                          I have read and agree to the <strong>JI Trust Escrow Seller Terms &amp; Conditions</strong> (3% escrow fee &amp; 72-hour buyer inspection policy).
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowJiTrustModal(true)}
                          className="ml-1.5 inline-flex items-center text-[10px] font-black text-emerald-800 bg-white border border-emerald-300 px-2 py-0.5 rounded hover:bg-emerald-100 transition"
                        >
                          Read JI Trust Terms
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-3">
              <div className="flex items-start gap-2.5 bg-orange-50/70 p-3 rounded-xl border border-orange-100">
                <input
                  id="accept-terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-brand-orange cursor-pointer shrink-0"
                />
                <div className="text-xs text-gray-700 leading-relaxed">
                  <label htmlFor="accept-terms" className="cursor-pointer">
                    I agree to the{' '}
                    <Link href="/terms" className="text-brand-orange font-bold hover:underline">
                      Terms &amp; Conditions
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-brand-orange font-bold hover:underline">
                      Privacy Policy
                    </Link>
                    , and confirm I will not list prohibited items.
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="ml-2 inline-flex items-center gap-1 text-[11px] font-bold text-gray-900 bg-white border border-gray-200 px-2 py-0.5 rounded hover:border-brand-orange transition"
                  >
                    Read Terms
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-xs text-gray-600 cursor-pointer px-1">
                <input
                  type="checkbox"
                  checked={newsletterSubscribed}
                  onChange={(e) => setNewsletterSubscribed(e.target.checked)}
                  className="w-4 h-4 accent-brand-orange cursor-pointer shrink-0"
                />
                <span>Send me weekly Hot Deals &amp; top marketplace offers via email.</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || (confirmPassword.length > 0 && !passwordsMatch)}
              className="w-full mt-2 flex justify-center items-center py-3.5 bg-brand-orange hover:bg-orange-700 text-white font-bold rounded-lg shadow-sm transition disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
          </form>
        )}

        {/* --- MODE 3: EMAIL VERIFICATION + RESEND CODE --- */}
        {mode === 'verify' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-brand-orange font-bold text-base">
              <MailCheck className="w-5 h-5" />
              <h2>Verify Your Email</h2>
            </div>
            <p className="text-xs text-gray-500">
              Enter the 6-digit code sent to <strong>{email}</strong>. Check your Spam/Junk folder if you do not see it in your inbox.
            </p>
            <input
              type="text"
              maxLength={6}
              required
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-center text-xl font-black tracking-[0.4em] bg-gray-50 focus:bg-white focus:border-brand-orange outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-orange hover:bg-orange-700 text-white font-bold rounded-lg transition flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Email'}
            </button>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                disabled={resendCooldown > 0 || resendingCode}
                onClick={handleResendVerification}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:underline disabled:text-gray-400 disabled:no-underline"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resendingCode ? 'animate-spin' : ''}`} />
                {resendCooldown > 0
                  ? `Resend Code in ${resendCooldown}s`
                  : resendingCode
                  ? 'Sending Code...'
                  : 'Resend Verification Code'}
              </button>

              <button
                type="button"
                onClick={() => {
                  router.push('/');
                  router.refresh();
                }}
                className="text-xs font-semibold text-gray-500 hover:text-gray-800"
              >
                Skip for now →
              </button>
            </div>
          </form>
        )}

        {/* --- MODE 4: FORGOT / RESET PASSWORD --- */}
        {mode === 'forgot' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
              <KeyRound className="w-5 h-5 text-brand-orange" />
              <h2>Reset Password</h2>
            </div>

            {resetStep === 'request' ? (
              <>
                <p className="text-xs text-gray-500">
                  Enter the email address linked to your account and we will send you a 6-digit recovery code.
                </p>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Registered Email Address"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-brand-orange outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-brand-orange hover:bg-orange-700 text-white font-bold rounded-lg transition flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Recovery Code'}
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-Digit Reset Code"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-center text-lg font-bold tracking-widest bg-gray-50 focus:bg-white focus:border-brand-orange outline-none"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password (min 6 characters)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-brand-orange outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-brand-orange hover:bg-orange-700 text-white font-bold rounded-lg transition flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setResetStep('request');
                setError('');
                setSuccessMsg('');
              }}
              className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-brand-orange"
            >
              Back to Log In
            </button>
          </form>
        )}
      </div>

      {/* JI Trust Seller Terms & Conditions Modal */}
      {showJiTrustModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-emerald-200 overflow-hidden text-gray-900">
            <div className="px-5 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
                <span>JI Trust Escrow Protection — Seller Terms</span>
              </div>
              <button
                type="button"
                onClick={() => setShowJiTrustModal(false)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-80 overflow-y-auto text-xs text-gray-700 space-y-3 leading-relaxed">
              <p>
                <strong>1. Escrow Holding:</strong> When a buyer pays via JI Trust, ji.africa holds 100% of the item price in escrow until delivery is completed. Never release goods before seeing "Funded" in your Seller Dashboard.
              </p>
              <p>
                <strong>2. Dispatch &amp; 72-Hour Inspection Window:</strong> Once funded, dispatch the item promptly and click <em>Mark Dispatched</em> with waybill/courier details. The buyer has 72 hours after dispatch to inspect and confirm receipt.
              </p>
              <p>
                <strong>3. Automatic Release &amp; 3% Commission:</strong> Upon buyer confirmation—or automatically after 72 hours without an active dispute—ji.africa deducts a <strong>3% JI Trust escrow commission</strong> and disburses the remaining 97% to your registered Nigerian bank account.
              </p>
              <p>
                <strong>4. Dispute Mediation:</strong> If a buyer opens a dispute within the 72-hour window due to non-delivery or material misrepresentation, payout is paused while JI Trust Admins review waybill and listing evidence.
              </p>
            </div>

            <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowJiTrustModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setJiTrustEnrolled(true);
                  setJiTrustTermsAccepted(true);
                  setShowJiTrustModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition"
              >
                Accept JI Trust Terms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick-Read Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden text-gray-900">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-brand-orange" />
                <span>ji.africa Terms &amp; Marketplace Rules</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-80 overflow-y-auto text-xs text-gray-600 space-y-3 leading-relaxed">
              <p>
                <strong>1. Venue Role:</strong> ji.africa provides an online classifieds venue connecting buyers and sellers across Nigeria. Always inspect items in a safe, public place before making payment.
              </p>
              <p>
                <strong>2. Strictly Prohibited Items:</strong> Sellers are strictly forbidden from listing firearms, ammunition, explosives, illicit narcotics, stolen property, counterfeit currency/documents, or hazardous materials. Violations result in immediate account termination and reporting to authorities.
              </p>
              <p>
                <strong>3. Accurate Listings:</strong> All photos, prices, and condition grades (Brand New, Foreign Used/Tokunbo, Nigerian Used) must accurately represent the item.
              </p>
              <p>
                <strong>4. Data &amp; Security (NDPA 2023):</strong> Your contact details are used to display your public shop and send security alerts when new devices access your account.
              </p>
            </div>

            <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setAcceptedTerms(true);
                  setShowTermsModal(false);
                }}
                className="px-4 py-2 bg-brand-orange text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition"
              >
                Accept &amp; Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
