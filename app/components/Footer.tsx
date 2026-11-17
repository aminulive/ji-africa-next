"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Globe, Share2, MessageCircle, Mail, CheckCircle2, Loader2 } from 'lucide-react';

const API_URL = 'https://ji-africa-backend.onrender.com/api';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim();
    if (!clean) return;
    setStatus('loading');
    setFeedback('');

    try {
      const res = await fetch(`${API_URL}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean, source: 'footer' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus('success');
        setFeedback(data.message || 'Subscribed to weekly Hot Deals!');
        setEmail('');
      } else {
        setStatus('error');
        setFeedback(data.error || 'Please enter a valid email.');
      }
    } catch {
      setStatus('error');
      setFeedback('Network error. Please try again.');
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-12">
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-1.5 mb-3">
              <span className="text-2xl font-black tracking-tight text-brand-orange">
                ji<span className="text-white">.africa</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-gray-300 mb-4 leading-relaxed max-w-md">
              Nigeria&apos;s simplest, fastest, and most direct classified ads platform. Buy &amp; sell directly via WhatsApp with zero hassle.
            </p>

            {/* Weekly Hot Deals Email Capture */}
            <div className="mb-5 max-w-md bg-gray-800/80 border border-gray-700/80 rounded-2xl p-3.5">
              <p className="text-xs font-black text-white flex items-center gap-1.5 mb-1">
                <Mail className="w-3.5 h-3.5 text-brand-orange" /> Get Weekly Hot Deals &amp; Price Drops
              </p>
              <p className="text-[11px] text-gray-400 mb-2.5">
                Join verified Nigerian buyers &amp; sellers receiving Friday deal alerts.
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  aria-label="Email address for weekly Hot Deals"
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white placeholder-gray-400 outline-none focus:border-brand-orange"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-4 py-2 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-xs font-black transition shrink-0 flex items-center gap-1.5 disabled:opacity-60"
                >
                  {status === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Join Free'}
                </button>
              </form>
              {feedback && (
                <p
                  className={`mt-2 text-[11px] font-bold flex items-center gap-1 ${
                    status === 'success' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  <span>{feedback}</span>
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Link
                href="/about"
                aria-label="About ji.africa"
                className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-orange hover:text-white transition"
              >
                <Globe className="w-4 h-4" />
              </Link>
              <Link
                href="/blog"
                aria-label="ji.africa Blog"
                className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-orange hover:text-white transition"
              >
                <Share2 className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                aria-label="Contact Support"
                className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-orange hover:text-white transition"
              >
                <MessageCircle className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-bold text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4">
              Marketplace
            </h4>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/" className="hover:text-brand-orange transition">
                  Browse All Adverts
                </Link>
              </li>
              <li>
                <Link href="/sell" className="hover:text-brand-orange transition">
                  Post a Free Advert
                </Link>
              </li>
              <li>
                <Link href="/request" className="hover:text-brand-orange transition">
                  Submit a Buyer Request
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-brand-orange transition">
                  Buying Guides &amp; Blog
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-brand-orange transition">
                  About JI AFRICA LIMITED
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-bold text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4">
              Safety &amp; Support
            </h4>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/terms" className="hover:text-brand-orange transition">
                  Safety Tips for Buyers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brand-orange transition">
                  Help &amp; Support
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-brand-orange transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-brand-orange transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <p>&copy; 2026 JI AFRICA LIMITED. Built for Nigeria. 🇳🇬</p>
          <p className="text-gray-300">Lightweight • Ultra-Fast • WhatsApp Direct</p>
        </div>
      </div>
    </footer>
  );
}
