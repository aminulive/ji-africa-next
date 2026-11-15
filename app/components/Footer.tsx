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
              Nigeria&apos;s simplest, fastest, and most direct classified ads platform. Buy &amp; sell directly via WhatsApp with zero hassle.
            </p>
            <div className="flex gap-4">
              <Link href="/about" aria-label="About ji.africa" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-orange hover:text-white transition"><Globe className="w-5 h-5" /></Link>
              <Link href="/blog" aria-label="ji.africa Blog" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-orange hover:text-white transition"><Share2 className="w-5 h-5" /></Link>
              <Link href="/contact" aria-label="Contact Support" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-orange hover:text-white transition"><MessageCircle className="w-5 h-5" /></Link>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Marketplace</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/" className="hover:text-brand-orange transition">Browse All Adverts</Link></li>
              <li><Link href="/sell" className="hover:text-brand-orange transition">Post a Free Advert</Link></li>
              <li><Link href="/blog" className="hover:text-brand-orange transition">Buying Guides &amp; Blog</Link></li>
              <li><Link href="/about" className="hover:text-brand-orange transition">About JI AFRICA LIMITED</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Popular Locations</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/" className="hover:text-brand-orange transition">Lagos State</Link></li>
              <li><Link href="/" className="hover:text-brand-orange transition">Abuja (FCT)</Link></li>
              <li><Link href="/" className="hover:text-brand-orange transition">Port Harcourt (Rivers)</Link></li>
              <li><Link href="/" className="hover:text-brand-orange transition">Kaduna &amp; Kano</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Safety &amp; Support</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/terms" className="hover:text-brand-orange transition">Safety Tips for Buyers</Link></li>
              <li><Link href="/contact" className="hover:text-brand-orange transition">Help &amp; Support</Link></li>
              <li><Link href="/privacy" className="hover:text-brand-orange transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-brand-orange transition">Terms of Service</Link></li>
            </ul>
          </div>

        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p>&copy; 2026 JI AFRICA LIMITED. Built for Nigeria. 🇳🇬</p>
          <p className="text-gray-500">Lightweight • Ultra-Fast • WhatsApp Direct</p>
        </div>
      </div>
    </footer>
  );
}
