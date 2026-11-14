"use client";

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, ShieldAlert, CheckCircle2, X } from 'lucide-react';

export default function HeroBanner() {
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-r from-brand-orange to-amber-500 rounded-xl p-5 md:py-6 md:px-8 text-white mb-5 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="z-10 max-w-xl text-center md:text-left">
          <span className="inline-block bg-white/20 backdrop-blur-md text-white text-[9px] uppercase font-bold px-2.5 py-1 rounded-full mb-2 tracking-wider">
            Direct WhatsApp Deals
          </span>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight mb-1">
            Buy & Sell Clean Used Items Anywhere in Nigeria
          </h1>
          <div className="flex flex-wrap gap-3 justify-center md:justify-start mt-3">
            <Link 
              href="/sell" 
              className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-full text-xs font-bold transition shadow-md"
            >
              Post Ad Free
            </Link>
            <button 
              type="button"
              onClick={() => setShowSafetyModal(true)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur text-white px-5 py-2.5 rounded-full text-xs font-bold transition"
            >
              Safety Rules
            </button>
          </div>
        </div>
        <div className="z-10 hidden md:flex items-center justify-center shrink-0 opacity-20 hover:opacity-40 transition duration-500 transform hover:scale-110">
          <MessageCircle size={160} strokeWidth={1.5} />
        </div>
      </div>

      {/* Safety Tips Modal (Replicated from index.html) */}
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
                <span><strong>Meet in a public place:</strong> Never meet in private or secluded areas. Busy shopping plazas or police station surrounds are recommended.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Inspect before paying:</strong> Check items thoroughly to ensure condition matches descriptions before sending funds.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Never pay upfront fees:</strong> Beware of sellers asking for &quot;delivery fees&quot; or &quot;reservations&quot; before you see the physical item.</span>
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