"use client";

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Search,
  MapPin,
  Moon,
  Sun,
  BookOpen,
  Heart,
  MessageSquare,
  Bell,
  User,
  LayoutDashboard,
  Shield,
  LogOut,
  X,
  CheckCheck,
} from 'lucide-react';
import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import LocationModal from './LocationModal';

const API_URL = 'https://ji-africa-backend.onrender.com/api';

function NavbarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<any>(null);
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [locationLabel, setLocationLabel] = useState(
    searchParams.get('location') || 'All Nigeria'
  );
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Saved Wishlist Badge State
  const [wishlistCount, setWishlistCount] = useState(0);

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Profile Dropdown State
  const [menuOpen, setMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

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

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
    setLocationLabel(searchParams.get('location') || 'All Nigeria');
  }, [searchParams]);

  const syncWishlistState = useCallback(async (fetchRemote = false) => {
    try {
      const localList = JSON.parse(localStorage.getItem("ji_wishlist") || "[]");
      setWishlistCount(Array.isArray(localList) ? localList.length : 0);
    } catch {
      setWishlistCount(0);
    }

    const token = localStorage.getItem("ji_token");
    if (!token || !fetchRemote) return;
    try {
      const res = await fetch(`${API_URL}/users/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const ads = await res.json();
        if (Array.isArray(ads)) {
          const ids = ads.map((a: any) => String(a.id));
          localStorage.setItem("ji_wishlist", JSON.stringify(ids));
          setWishlistCount(ids.length);
          window.dispatchEvent(new Event("ji_wishlist_updated"));
        }
      }
    } catch {}
  }, []);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('ji_token');
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/users/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(Number(data.unreadCount) || 0);
      }
    } catch {
      // Silent fallback if backend is cold-starting
    }
  }, []);

  useEffect(() => {
    const syncUser = () => {
      const storedUser = localStorage.getItem('ji_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          fetchNotifications();
          syncWishlistState(true);
        } catch {
          console.error('Failed to parse user session');
        }
      } else {
        setUser(null);
        setNotifications([]);
        setUnreadCount(0);
        syncWishlistState(false);
      }
    };

    const onWishlistUpdated = () => syncWishlistState(false);

    syncUser();
    window.addEventListener('ji_user_updated', syncUser);
    window.addEventListener('ji_wishlist_updated', onWishlistUpdated);
    window.addEventListener('ji_notifications_updated', fetchNotifications);
    return () => {
      window.removeEventListener('ji_user_updated', syncUser);
      window.removeEventListener('ji_wishlist_updated', onWishlistUpdated);
      window.removeEventListener('ji_notifications_updated', fetchNotifications);
    };
  }, [fetchNotifications, syncWishlistState]);

  const handleMarkNotificationsRead = async (notifId?: number) => {
    const token = localStorage.getItem('ji_token');
    if (!token) return;
    try {
      await fetch(`${API_URL}/users/notifications/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notifId ? { id: notifId } : {}),
      });
      if (notifId) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch {
      // Ignore transient network errors
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ji_user');
    localStorage.removeItem('ji_token');
    setUser(null);
    window.location.href = '/';
  };

  const applyFilterNavigation = useCallback(
    (
      updates: {
        search?: string;
        regionId?: string;
        subRegionId?: string;
        location?: string;
      },
      useReplace = false
    ) => {
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
          params.delete('region_id');
          params.delete('sub_region_id');
        }
      }

      const qs = params.toString();
      const target = qs ? `/?${qs}` : '/';
      if (useReplace) router.replace(target);
      else router.push(target);
    },
    [router, searchParams]
  );

  // Instant Live Search-As-You-Type (250ms debounce on Marketplace homepage)
  useEffect(() => {
    if (pathname !== '/') return;
    const currentUrlSearch = searchParams.get('search') || '';
    if (searchQuery.trim() === currentUrlSearch) return;

    const timer = setTimeout(() => {
      applyFilterNavigation({ search: searchQuery }, true);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, pathname, searchParams, applyFilterNavigation]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilterNavigation({ search: searchQuery }, false);
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
                className="flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-2.5 rounded-lg transition whitespace-nowrap max-w-[155px]"
              >
                <MapPin className="w-4 h-4 text-brand-orange shrink-0" />
                <span className="truncate">{locationLabel}</span>
              </button>

              <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search ads instantly..."
                  className="w-full pl-10 pr-28 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-orange transition"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      applyFilterNavigation({ search: '' }, true);
                    }}
                    aria-label="Clear search"
                    className="absolute right-20 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
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
                href="/blog"
                className="text-gray-500 hover:text-brand-orange transition flex items-center gap-1 text-xs font-bold"
                title="ji.africa Blog"
              >
                <BookOpen className="w-[1.15rem] h-[1.15rem]" />
                <span className="hidden lg:inline">Blog</span>
              </Link>

              <Link
                href="/wishlist"
                className="text-gray-500 hover:text-brand-orange transition relative flex items-center"
                title="Saved Ads"
              >
                <Heart className="w-[1.15rem] h-[1.15rem]" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-brand-orange text-white text-[8px] font-bold min-w-[14px] h-3.5 px-1 rounded-full flex items-center justify-center border border-white">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                href="/dashboard/seller"
                className="text-gray-500 hover:text-brand-orange transition hidden sm:block"
                title="Seller Inquiries & Ads"
              >
                <MessageSquare className="w-[1.15rem] h-[1.15rem]" />
              </Link>

              {/* Live Notifications Bell & Popover */}
              <div ref={notifMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      router.push('/login');
                      return;
                    }
                    setNotifOpen((prev) => {
                      const next = !prev;
                      if (next) fetchNotifications();
                      return next;
                    });
                    setMenuOpen(false);
                  }}
                  className="text-gray-500 hover:text-brand-orange transition relative flex items-center"
                  title="Notifications"
                >
                  <Bell className="w-[1.15rem] h-[1.15rem]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold min-w-[14px] h-3.5 px-1 rounded-full flex items-center justify-center border border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && user && (
                  <div className="fixed left-3 right-3 top-[64px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 z-50 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden text-gray-900">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                      <span className="font-bold text-xs text-gray-900">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMarkNotificationsRead()}
                          className="text-[11px] font-bold text-brand-orange hover:underline inline-flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                      {notifications.length > 0 ? (
                        notifications.map((n: any) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (!n.is_read) handleMarkNotificationsRead(n.id);
                              setNotifOpen(false);
                              if (n.link) router.push(n.link);
                            }}
                            className={`px-4 py-3 text-xs cursor-pointer transition hover:bg-orange-50/60 ${
                              !n.is_read ? 'bg-orange-50/40' : 'bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-bold text-gray-900">{n.title}</p>
                              {!n.is_read && (
                                <span className="w-2 h-2 rounded-full bg-brand-orange shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-gray-600 mt-0.5 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-xs text-gray-400">
                          No notifications yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tap & Click Profile Dropdown */}
              <div ref={profileMenuRef} className="relative pl-1 border-l border-gray-200">
                {user ? (
                  <div className="ml-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen((prev) => !prev);
                        setNotifOpen(false);
                      }}
                      aria-expanded={menuOpen}
                      className="flex items-center gap-2 transition cursor-pointer py-1 focus:outline-none"
                    >
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
                      <span className="text-xs font-bold hidden md:block text-gray-700 hover:text-brand-orange transition-colors">
                        {user.full_name.split(' ')[0]}
                      </span>
                    </button>

                    {menuOpen && (
                      <div className="fixed left-3 right-3 top-[64px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-56 z-50">
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
                              onClick={() => setMenuOpen(false)}
                              className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-brand-orange flex items-center gap-2 transition"
                            >
                              <User className="w-4 h-4 text-gray-400" /> My Profile &amp; Shop
                            </Link>
                            <Link
                              href="/dashboard/seller"
                              onClick={() => setMenuOpen(false)}
                              className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-brand-orange flex items-center gap-2 transition"
                            >
                              <LayoutDashboard className="w-4 h-4 text-gray-400" /> Seller Dashboard
                            </Link>
                            {isAdmin && (
                              <Link
                                href="/dashboard/admin"
                                onClick={() => setMenuOpen(false)}
                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-900 bg-gray-100 hover:bg-gray-200 flex items-center gap-2 transition"
                              >
                                <Shield className="w-4 h-4 text-brand-orange" /> Admin Center
                              </Link>
                            )}
                          </div>

                          <div className="border-t border-gray-100 py-1 bg-white">
                            <button
                              type="button"
                              onClick={() => {
                                setMenuOpen(false);
                                handleLogout();
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                            >
                              <LogOut className="w-4 h-4" /> Log Out
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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
