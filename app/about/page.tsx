import Link from 'next/link';
import { ShieldCheck, MessageCircle, MapPin, Sparkles } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-8">
      <div className="bg-gray-900 text-white rounded-2xl p-8 md:p-12 space-y-3">
        <span className="inline-block bg-brand-orange/20 text-brand-orange px-3 py-1 rounded-full text-xs font-bold">
          About JI AFRICA LIMITED
        </span>
        <h1 className="text-3xl md:text-4xl font-black">
          Nigeria&apos;s Fastest Direct Classifieds &amp; Storefront Marketplace
        </h1>
        <p className="text-sm text-gray-300 leading-relaxed max-w-2xl">
          Built to remove friction from local and regional commerce, ji.africa connects verified merchants and everyday sellers directly with buyers across all 36 states and 774 Local Government Areas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <MessageCircle className="w-6 h-6 text-[#25D366]" />
          <h2 className="font-black text-gray-900 text-base">Zero-Commission Direct Deals</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Buyers connect straight with sellers via WhatsApp or phone call—negotiate prices, inspect items in person, and close deals with zero middleman fees.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
          <h2 className="font-black text-gray-900 text-base">Verified Seller Storefronts</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Every merchant receives a custom shareable shop link (e.g. ji.africa/shop/username), buyer review ratings, and KYC verification badges.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <MapPin className="w-6 h-6 text-brand-orange" />
          <h2 className="font-black text-gray-900 text-base">Hyper-Local 774 LGA Search</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Filter listings down to your exact city or Local Government Area across Abuja, Lagos, Kaduna, Kano, Rivers, and beyond.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <Sparkles className="w-6 h-6 text-amber-500" />
          <h2 className="font-black text-gray-900 text-base">Flexible VIP Promotions</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Sellers can boost high-priority inventory using Naira (Paystack) or Cryptocurrency (NowPayments) for immediate top-of-feed visibility.
          </p>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-gray-900 text-base">Ready to start buying or selling?</h3>
          <p className="text-xs text-gray-600">Create your free shop in under 60 seconds.</p>
        </div>
        <div className="flex gap-2.5">
          <Link
            href="/sell"
            className="px-5 py-2.5 bg-brand-orange text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition"
          >
            Post an Advert
          </Link>
          <Link
            href="/contact"
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl text-xs font-bold hover:bg-gray-50 transition"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
