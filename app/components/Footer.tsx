import Link from 'next/link';
import { Globe, Share2, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-1.5 mb-4">
              <span className="text-2xl font-black tracking-tight text-brand-orange">
                ji<span className="text-white">.africa</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Nigeria's simplest, fastest, and most direct classified ads platform. Buy & sell directly via WhatsApp with zero hassle.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-orange hover:text-white transition"><Globe className="w-5 h-5" /></Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-orange hover:text-white transition"><Share2 className="w-5 h-5" /></Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-orange hover:text-white transition"><MessageCircle className="w-5 h-5" /></Link>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Top Categories</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-brand-orange transition">Cars & Vehicles</Link></li>
              <li><Link href="#" className="hover:text-brand-orange transition">Phones & Tablets</Link></li>
              <li><Link href="#" className="hover:text-brand-orange transition">Property & Real Estate</Link></li>
              <li><Link href="#" className="hover:text-brand-orange transition">Fashion & Wear</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Popular Locations</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-brand-orange transition">Lagos State</Link></li>
              <li><Link href="#" className="hover:text-brand-orange transition">Abuja (FCT)</Link></li>
              <li><Link href="#" className="hover:text-brand-orange transition">Port Harcourt (Rivers)</Link></li>
              <li><Link href="#" className="hover:text-brand-orange transition">Ibadan (Oyo)</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Safety & Support</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-brand-orange transition">Safety Tips for Buyers</Link></li>
              <li><Link href="#" className="hover:text-brand-orange transition">Help & Support</Link></li>
              <li><Link href="#" className="hover:text-brand-orange transition">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-brand-orange transition">Terms of Service</Link></li>
            </ul>
          </div>

        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p>&copy; 2026 ji.africa Marketplace. Built for Nigeria. 🇳🇬</p>
          <p className="text-gray-500">Lightweight • Ultra-Fast • WhatsApp Direct</p>
        </div>
      </div>
    </footer>
  );
}