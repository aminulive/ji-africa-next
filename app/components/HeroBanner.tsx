"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  X,
  Lock,
  Clock,
  Banknote,
  PlusCircle,
  Megaphone,
  Sparkles,
} from 'lucide-react';

export default function HeroBanner() {
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showTrustExplainer, setShowTrustExplainer] = useState(false);

  return (
    <>
      {/* Slim High-Conversion Hero Strip */}
      <div className="bg-gradient-to-r from-brand-orange to-amber-500 rounded-xl px-4 py-3.5 md:px-6 md:py-4 text-white mb-3.5 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="z-10 max-w-2xl text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mb-1.5">
            <span className="inline-flex items-center gap-1 bg-emerald-950/80 border border-emerald-300/40 text-emerald-200 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full tracking-wider">
              <ShieldCheck className="w-3 h-3 text-emerald-300" /> JI Trust Escrow Protected
            </span>
            <span className="inline-block bg-white/20 text-white text-[9px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wider">
              72h Inspection Guarantee
            </span>
          </div>

          <h1 className="text-lg md:text-xl font-extrabold tracking-tight leading-snug">
            Buy &amp; Sell New &amp; Used Items Anywhere in Nigeria
          </h1>

          <p className="text-[11px] md:text-xs text-white/95 leading-relaxed mt-0.5 max-w-xl">
            Pay safely with <strong>JI Trust</strong> — funds stay in escrow until you receive and inspect your item.
          </p>
        </div>

        <div className="z-10 flex flex-wrap items-center justify-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowSafetyModal(true)}
            className="bg-white/20 hover:bg-white/30 text-white px-3.5 py-2 rounded-full text-xs font-bold transition"
          >
            Safety Tips
          </button>
        </div>
      </div>

      {/* 4 Visual Quick-Action Shortcut Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <Link
          href="/sell"
          className="group bg-white dark:bg-neutral-900 hover:bg-orange-50/70 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-800 hover:border-brand-orange rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs transition"
        >
          <div className="w-9 h-9 rounded-lg bg-orange-100 text-brand-orange flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-gray-900 dark:text-neutral-100 truncate">Post Ad Free</p>
            <p className="text-[10px] text-gray-500 truncate">Reach buyers fast</p>
          </div>
        </Link>

        <Link
          href="/request"
          className="group bg-white dark:bg-neutral-900 hover:bg-amber-50/70 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-800 hover:border-amber-500 rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs transition"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Megaphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-gray-900 dark:text-neutral-100 truncate">Request Item</p>
            <p className="text-[10px] text-gray-500 truncate">Get seller quotes</p>
          </div>
        </Link>

        <Link
          href="/flyer"
          className="group bg-white dark:bg-neutral-900 hover:bg-emerald-50/70 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-800 hover:border-emerald-500 rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs transition"
        >
          <div className="w-9 h-9 rounded-lg bg-[#25D366]/15 text-[#128C7E] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-gray-900 dark:text-neutral-100 truncate">WhatsApp Flyer</p>
            <p className="text-[10px] text-gray-500 truncate">Free status card</p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setShowTrustExplainer(true)}
          className="group text-left bg-white dark:bg-neutral-900 hover:bg-emerald-50/70 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-800 hover:border-emerald-600 rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs transition cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-gray-900 dark:text-neutral-100 truncate">JI Trust Escrow</p>
            <p className="text-[10px] text-emerald-700 font-semibold truncate">How protection works</p>
          </div>
        </button>
      </div>

      {/* JI Trust Explainer Modal */}
      {showTrustExplainer && (
        <div className="fixed inset-0 bg-gray-900/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-gray-900 border border-emerald-100">
            <button
              type="button"
              onClick={() => setShowTrustExplainer(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">What is JI Trust Escrow?</h3>
                <p className="text-[11px] text-emerald-700 font-bold">100% Payment Protection for Nigerian Buyers &amp; Sellers</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
              <div className="flex items-start gap-2.5 bg-emerald-50/70 p-3 rounded-xl">
                <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span><strong>1. Funds Held Safely:</strong> When you click <em>Buy Safely with JI Trust</em>, ji.africa holds your payment in escrow—the seller does not receive cash before shipping.</span>
              </div>
              <div className="flex items-start gap-2.5 bg-gray-50 p-3 rounded-xl">
                <Clock className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                <span><strong>2. 72-Hour Inspection Window:</strong> Once the seller marks your order dispatched, you have 72 hours to inspect the item and confirm receipt—or freeze payout by raising a dispute.</span>
              </div>
              <div className="flex items-start gap-2.5 bg-gray-50 p-3 rounded-xl">
                <Banknote className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span><strong>3. Guaranteed Seller Settlement:</strong> Once confirmed, ji.africa releases funds directly to the seller&apos;s bank account (minus a 3% JI Trust service fee).</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowTrustExplainer(false)}
              className="w-full mt-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Safety Tips Modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-gray-900">
            <button
              type="button"
              onClick={() => setShowSafetyModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Safety Tips for Buyers</h3>
            </div>
            <ul className="space-y-3 text-xs text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Use JI Trust Escrow:</strong> Look for the green <em>JI Trust</em> badge so your money is held safely until delivery.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Meet in a public place:</strong> Never meet in private or secluded areas. Busy shopping plazas or police station surrounds are recommended.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Inspect before paying:</strong> Check items thoroughly to ensure condition matches descriptions before releasing funds.</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => setShowSafetyModal(false)}
              className="w-full mt-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs rounded-lg transition"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </>
  );
}
