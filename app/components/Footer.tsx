import Link from 'next/link';
import { Globe, Share2, MessageCircle } from 'lucide-react';

export default function Footer() {
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
