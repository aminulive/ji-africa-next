"use client";

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  MapPin,
  Moon,
  Sun,
  Heart,
  MessageSquare,
  Bell,
  User,
  LayoutDashboard,
  Shield,
  LogOut,
} from 'lucide-react';
import { useEffect, useState, Suspense } from 'react';
import LocationModal from './LocationModal';

function NavbarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<any>(null);
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [locationLabel, setLocationLabel] = useState(
    searchParams.get('location') || 'All Nigeria'
  );
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Sync theme state on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('ji_theme');
    const darkActive =
      savedTheme === 'dark' || document.documentElement.classList.contains('dark');
    setIsDark(darkActive);
    if (darkActive) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ji_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ji_theme', 'light');
    }
  };

  // Sync search input & location label when URL changes
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
    setLocationLabel(searchParams.get('location') || 'All Nigeria');
  }, [searchParams]);

  // Load user session and listen for profile updates
  useEffect(() => {
    const syncUser = () => {
      const storedUser = localStorage.getItem('ji_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          console.error('Failed to parse user session');
        }
      } else {
        setUser(null);
      }
    };

    syncUser();
    window.addEventListener('ji_user_updated', syncUser);
    return () => window.removeEventListener('ji_user_updated', syncUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('ji_user');
    localStorage.removeItem('ji_token');
    setUser(null);
    window.location.href = '/';
  };

  const applyFilterNavigation = (updates: {
    search?: string;
    regionId?: string;
    subRegionId?: string;
    location?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.search !== undefined) {
      if (updates.search.trim()) params.set('search', updates.search.trim());
      else params.delete('search');
    }

    if (updates.regionId !== undefined) {
      if (updates.regionId) params.set('region_id', updates.regionId);
      else params.delete('region_id');
    }

    if (updates.subRegionId !== undefined) {
      if (updates.subRegionId) params.set('sub_region_id', updates.subRegionId);
      else params.delete('sub_region_id');
    }

    if (updates.location !== undefined) {
      if (updates.location && updates.location !== 'All Nigeria') {
        params.set('location', updates.location);
      } else {
        params.delete('location');
      }
    }

    const qs = params.toString();
    router.push(qs ? `/?${qs}` : '/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilterNavigation({ search: searchQuery });
  };

  const avatarSrc = user?.profile_image
    ? user.profile_image.startsWith('http') || user.profile_image.startsWith('data:')
      ? user.profile_image
      : `https://ji-africa-backend.onrender.com${user.profile_image}`
    : null;

  const adminRoles = ['super_admin', 'admin', 'country_manager'];
  const isAdmin = user && adminRoles.includes(user.role);

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 text-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between py-3">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="text-xl font-black tracking-tight flex items-center gap-1">
                <span className="bg-brand-orange text-white px-2 py-0.5 rounded text-lg">ji</span>
                <span className="text-gray-900">.africa</span>
                <span className="bg-amber-400 text-gray-900 text-[8px] uppercase px-1.5 py-0.5 rounded ml-1 font-bold">
                  Pro
                </span>
              </Link>
            </div>

            {/* Live Search & Location Filter Box */}
            <div className="order-3 md:order-2 w-full md:w-auto flex-1 md:max-w-2xl mt-3 md:mt-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLocationModal(true)}
                className="flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-2.5 rounded-lg transition whitespace-nowrap max-w-[150px]"
              >
                <MapPin className="w-4 h-4 text-brand-orange shrink-0" />
                <span className="truncate">{locationLabel}</span>
              </button>

              <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What are you looking for today?"
                  className="w-full pl-10 pr-24 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-orange transition"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 bg-brand-orange hover:bg-orange-700 text-white px-4 rounded text-xs font-bold transition"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Icons & Actions */}
            <div className="order-2 md:order-3 flex items-center gap-3.5 md:gap-4 relative">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="text-gray-500 hover:text-brand-orange transition"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? (
                  <Sun className="w-[1.15rem] h-[1.15rem] text-amber-400" />
                ) : (
                  <Moon className="w-[1.15rem] h-[1.15rem]" />
                )}
              </button>
              <Link
                href="/wishlist"
                className="text-gray-500 hover:text-brand-orange transition"
                title="Saved Ads"
              >
                <Heart className="w-[1.15rem] h-[1.15rem]" />
              </Link>
              <button
                type="button"
                className="text-gray-500 hover:text-brand-orange transition hidden sm:block"
                title="Messages"
              >
                <MessageSquare className="w-[1.15rem] h-[1.15rem]" />
              </button>
              <button
                type="button"
                className="text-gray-500 hover:text-brand-orange transition relative"
                title="Notifications"
              >
                <Bell className="w-[1.15rem] h-[1.15rem]" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">
                  2
                </span>
              </button>

              {/* Profile Dropdown */}
              <div className="relative pl-1 border-l border-gray-200 group">
                {user ? (
                  <div className="flex items-center gap-2 transition ml-1 cursor-pointer py-1">
                    <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs overflow-hidden border border-orange-200">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={user.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user.full_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-xs font-bold hidden md:block text-gray-700 group-hover:text-brand-orange transition-colors">
                      {user.full_name.split(' ')[0]}
                    </span>

                    <div className="absolute top-full right-0 pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden text-gray-900">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 relative overflow-hidden">
                          {user.is_verified && (
                            <div className="absolute -right-6 top-2 bg-blue-500 text-white text-[8px] font-bold px-6 py-0.5 rotate-45 shadow-sm">
                              VERIFIED
                            </div>
                          )}
                          <p className="font-bold text-sm text-gray-900">{user.full_name}</p>
                          <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                        </div>

                        <div className="py-1 bg-white">
                          <Link
                            href="/profile"
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-brand-orange flex items-center gap-2 transition"
                          >
                            <User className="w-4 h-4 text-gray-400" /> My Profile &amp; Shop
                          </Link>
                          <Link
                            href="/dashboard/seller"
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-brand-orange flex items-center gap-2 transition"
                          >
                            <LayoutDashboard className="w-4 h-4 text-gray-400" /> Seller Dashboard
                          </Link>
                          {isAdmin && (
                            <Link
                              href="/dashboard/admin"
                              className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-900 bg-gray-100 hover:bg-gray-200 flex items-center gap-2 transition"
                            >
                              <Shield className="w-4 h-4 text-brand-orange" /> Admin Center
                            </Link>
                          )}
                        </div>

                        <div className="border-t border-gray-100 py-1 bg-white">
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                          >
                            <LogOut className="w-4 h-4" /> Log Out
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link href="/login" className="flex items-center gap-2 transition ml-1">
                    <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs overflow-hidden">
                      U
                    </div>
                    <span className="text-xs font-bold hidden md:block text-gray-700 hover:text-brand-orange transition-colors">
                      Log In
                    </span>
                  </Link>
                )}
              </div>

              <Link
                href="/sell"
                className="bg-amber-400 hover:bg-amber-500 text-gray-900 px-4 py-2 rounded-lg text-xs font-black tracking-wide shadow-sm transition ml-1"
              >
                SELL
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Location Filter Modal */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelectLocation={({ regionId, subRegionId, label }) => {
          setLocationLabel(label);
          applyFilterNavigation({ regionId, subRegionId, location: label });
        }}
      />
    </>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div className="h-16 bg-white border-b border-gray-200" />}>
      <NavbarContent />
    </Suspense>
  );
}