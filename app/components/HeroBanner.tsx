"use client";

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, ShieldAlert, ShieldCheck, CheckCircle2, X, Lock, Clock, Banknote } from 'lucide-react';

export default function HeroBanner() {
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showTrustExplainer, setShowTrustExplainer] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-r from-brand-orange to-amber-500 rounded-xl p-5 md:py-6 md:px-8 text-white mb-5 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="z-10 max-w-2xl text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
            <span className="inline-flex items-center gap-1 bg-emerald-950/75 border border-emerald-300/40 backdrop-blur-md text-emerald-200 text-[10px] uppercase font-black px-3 py-1 rounded-full tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> JI Trust Escrow Protected
            </span>
            <span className="inline-block bg-white/20 backdrop-blur-md text-white text-[9px] uppercase font-bold px-2.5 py-1 rounded-full tracking-wider">
              Direct WhatsApp Deals
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight mb-1.5">
            Buy &amp; Sell Clean Used Items Anywhere in Nigeria
          </h1>

          <p className="text-xs md:text-[13px] text-white/95 leading-relaxed max-w-xl">
            Shop worry-free with <strong>JI Trust</strong>: your payment is held securely in escrow by <strong>ji.africa</strong> and only released to the seller after you receive and inspect your item (with a 72-hour buyer protection window).
          </p>

          <div className="flex flex-wrap gap-2.5 justify-center md:justify-start mt-3.5">
            <Link
              href="/sell"
              className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-full text-xs font-bold transition shadow-md"
            >
              Post Ad Free
          </Link>
          <Link
            href="/flyer"
            className="bg-white hover:bg-orange-50 text-brand-orange px-4 py-2.5 rounded-full text-xs font-black transition shadow-md inline-flex items-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" /> Make Free WhatsApp Flyer
          </Link>
            <button
              type="button"
              onClick={() => setShowTrustExplainer(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-400/40 px-4 py-2.5 rounded-full text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> How JI Trust Works
            </button>
            <button
              type="button"
              onClick={() => setShowSafetyModal(true)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur text-white px-4 py-2.5 rounded-full text-xs font-bold transition"
            >
              Safety Rules
            </button>
          </div>
        </div>
        <div className="z-10 hidden md:flex items-center justify-center shrink-0 opacity-20 hover:opacity-40 transition duration-500 transform hover:scale-110">
          <MessageCircle size={160} strokeWidth={1.5} />
        </div>
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
