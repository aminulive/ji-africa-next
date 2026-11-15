"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutGrid,
  List,
  MapPin,
  Heart,
  BadgeCheck,
  Loader2,
  X,
  SlidersHorizontal,
  Search,
} from 'lucide-react';
import HeroBanner from './HeroBanner';
import ProductCard from './ProductCard';
import LocationModal from './LocationModal';
import { CategoryIcon } from '../lib/categoryIcons';

const API_URL = 'https://ji-africa-backend.onrender.com/api';

interface MarketplaceFeedProps {
  initialCategories: any[];
  initialAds: any[];
}

function getAdImage(ad: any) {
  if (!ad?.image) return 'https://placehold.co/400x300/f8fafc/94a3b8?text=Ad';
  try {
    const parsed = JSON.parse(ad.image);
    const first = Array.isArray(parsed) ? parsed[0] : ad.image;
    if (first) {
      return first.startsWith('http') || first.startsWith('data:')
        ? first
        : `https://ji-africa-backend.onrender.com${first}`;
    }
  } catch {
    if (typeof ad.image === 'string' && ad.image.startsWith('http')) return ad.image;
  }
  return 'https://placehold.co/400x300/f8fafc/94a3b8?text=Ad';
}

function FeedContent({ initialCategories, initialAds }: MarketplaceFeedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchQuery = searchParams.get('search') || '';
  const regionId = searchParams.get('region_id') || '';
  const subRegionId = searchParams.get('sub_region_id') || '';
  const locationLabel = searchParams.get('location') || 'All Nigeria';
  const selectedCategory = searchParams.get('category') || 'all';

  // Refinement & Collapsible Inline Search States
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [inlineSearch, setInlineSearch] = useState(searchQuery);

  // Sync inline filter search box when URL search changes
  useEffect(() => {
    setInlineSearch(searchQuery);
  }, [searchQuery]);

  const hasLocationFilter = Boolean(
    regionId || subRegionId || (locationLabel && locationLabel !== 'All Nigeria')
  );

  const hasActiveFilters = Boolean(
    searchQuery ||
      hasLocationFilter ||
      (selectedCategory && selectedCategory !== 'all') ||
      minPrice ||
      maxPrice ||
      conditionFilter !== 'all'
  );

  const sortedCategories = useMemo(() => {
    return [...initialCategories].sort(
      (a, b) => (Number(a.display_order) || 99) - (Number(b.display_order) || 99)
    );
  }, [initialCategories]);

  const [ads, setAds] = useState<any[]>(initialAds);
  const [page, setPage] = useState(2);
  const [hasMoreAds, setHasMoreAds] = useState(initialAds.length >= 20);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showLocationModal, setShowLocationModal] = useState(false);

  const updateUrlParams = useCallback(
    (updates: Record<string, string>, useReplace = false) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v && v !== 'all' && v !== 'All Nigeria') params.set(k, v);
        else params.delete(k);
      });
      const qs = params.toString();
      const target = qs ? `/?${qs}` : '/';
      if (useReplace) router.replace(target);
      else router.push(target);
    },
    [router, searchParams]
  );

  // Debounced live typing inside the collapsible Filter header search box
  useEffect(() => {
    if (!showFilters) return;
    if (inlineSearch.trim() === searchQuery) return;

    const timer = setTimeout(() => {
      updateUrlParams({ search: inlineSearch.trim() }, true);
    }, 250);

    return () => clearTimeout(timer);
  }, [inlineSearch, showFilters, searchQuery, updateUrlParams]);

  const fetchFilteredAds = useCallback(
    async (pageNum: number, reset: boolean) => {
      if (reset) setLoadingFeed(true);
      else setLoadingMore(true);

      try {
        const url = new URL(`${API_URL}/ads`);
        url.searchParams.append('page', String(pageNum));
        url.searchParams.append('limit', '20');

        if (searchQuery) url.searchParams.append('search', searchQuery);
        if (selectedCategory && selectedCategory !== 'all') {
          url.searchParams.append('category', selectedCategory);
        }
        if (subRegionId) url.searchParams.append('sub_region_id', subRegionId);
        else if (regionId) url.searchParams.append('region_id', regionId);
        if (locationLabel && locationLabel !== 'All Nigeria') {
          url.searchParams.append('location', locationLabel);
        }
        if (minPrice) url.searchParams.append('min_price', minPrice);
        if (maxPrice) url.searchParams.append('max_price', maxPrice);
        if (conditionFilter !== 'all') url.searchParams.append('condition', conditionFilter);
        if (sortBy !== 'newest') url.searchParams.append('sort', sortBy);

        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          const fetched = data.ads || [];
          if (reset) {
            setAds(fetched);
            setPage(2);
          } else {
            setAds((prev) => [...prev, ...fetched]);
            setPage(pageNum + 1);
          }
          setHasMoreAds(fetched.length >= 20);
        }
      } catch (err) {
        console.error('Error loading filtered ads', err);
      } finally {
        setLoadingFeed(false);
        setLoadingMore(false);
      }
    },
    [
      searchQuery,
      selectedCategory,
      regionId,
      subRegionId,
      locationLabel,
      minPrice,
      maxPrice,
      conditionFilter,
      sortBy,
    ]
  );

  // Re-fetch whenever URL search, location, category, or refinement filters change
  useEffect(() => {
    if (!hasActiveFilters && sortBy === 'newest') {
      setAds(initialAds);
      setPage(2);
      setHasMoreAds(initialAds.length >= 20);
      return;
    }
    fetchFilteredAds(1, true);
  }, [hasActiveFilters, sortBy, initialAds, fetchFilteredAds]);

  const activeCategoryName =
    selectedCategory === 'all'
      ? 'Trending Ads'
      : sortedCategories.find((c) => String(c.id) === String(selectedCategory))?.name || 'Ads';

  const visibleAds = useMemo(() => {
    const filtered = ads.filter((a) => {
      if (a.status === 'Unavailable' || a.status === 'unavailable') return false;
      const numericPrice = Number(a.price) || 0;
      if (minPrice && numericPrice < Number(minPrice)) return false;
      if (maxPrice && numericPrice > Number(maxPrice)) return false;
      if (conditionFilter !== 'all') {
        const adCond = (a.condition || '').toLowerCase();
        if (!adCond.includes(conditionFilter.toLowerCase())) return false;
      }
      return true;
    });

    if (sortBy === 'price_asc') {
      return [...filtered].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    }
    if (sortBy === 'price_desc') {
      return [...filtered].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }
    return filtered;
  }, [ads, minPrice, maxPrice, conditionFilter, sortBy]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Desktop Categories Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden sticky top-20">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="font-bold text-gray-800 text-sm">Categories</h3>
          </div>
          <ul className="py-1.5 max-h-[calc(100vh-7rem)] overflow-y-auto">
            <li>
              <button
                type="button"
                onClick={() => updateUrlParams({ category: 'all' })}
                className={`w-full flex items-center gap-3 text-left px-4 py-2.5 text-xs transition ${
                  selectedCategory === 'all'
                    ? 'text-brand-orange font-bold bg-orange-50'
                    : 'text-gray-600 hover:text-brand-orange hover:bg-orange-50'
                }`}
              >
                <LayoutGrid className="w-4 h-4 shrink-0 text-brand-orange" />
                <span>All Ads</span>
              </button>
            </li>
            {sortedCategories.map((c: any) => {
              const isSelected = String(selectedCategory) === String(c.id);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => updateUrlParams({ category: String(c.id) })}
                    className={`w-full flex items-center gap-3 text-left px-4 py-2.5 text-xs transition ${
                      isSelected
                        ? 'text-brand-orange font-bold bg-orange-50'
                        : 'text-gray-600 hover:text-brand-orange hover:bg-orange-50'
                    }`}
                  >
                    <CategoryIcon
                      iconName={c.icon}
                      categoryName={c.name}
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-brand-orange' : 'text-gray-500'
                      }`}
                    />
                    <span className="truncate">{c.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {/* Main Feed Column */}
      <div className="flex-1 min-w-0">
        <HeroBanner />

        {/* Mobile Horizontal Category Circles */}
        <div className="block lg:hidden mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex overflow-x-auto gap-3.5 pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => updateUrlParams({ category: 'all' })}
              className="flex flex-col items-center gap-1.5 shrink-0 snap-start w-[72px]"
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm transition ${
                  selectedCategory === 'all'
                    ? 'bg-orange-50 text-brand-orange border-2 border-brand-orange'
                    : 'bg-white text-gray-500 border border-gray-100'
                }`}
              >
                <LayoutGrid className="w-6 h-6" />
              </div>
              <span
                className={`text-[10px] font-semibold text-center leading-tight ${
                  selectedCategory === 'all' ? 'text-brand-orange' : 'text-gray-500'
                }`}
              >
                All
              </span>
            </button>

            {sortedCategories.map((c: any) => {
              const isSelected = String(selectedCategory) === String(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => updateUrlParams({ category: String(c.id) })}
                  className="flex flex-col items-center gap-1.5 shrink-0 snap-start w-[72px]"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm transition ${
                      isSelected
                        ? 'bg-orange-50 text-brand-orange border-2 border-brand-orange'
                        : 'bg-white text-gray-600 border border-gray-100'
                    }`}
                  >
                    <CategoryIcon
                      iconName={c.icon}
                      categoryName={c.name}
                      className="w-6 h-6"
                    />
                  </div>
                  <span
                    className={`text-[10px] font-semibold text-center leading-tight line-clamp-2 ${
                      isSelected ? 'text-brand-orange' : 'text-gray-500'
                    }`}
                  >
                    {c.name.split(',')[0].split('&')[0].trim()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Search / Filter Badges */}
        {hasActiveFilters && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 bg-orange-50 text-brand-orange border border-orange-200 px-3 py-1 rounded-full text-xs font-bold">
                Search: &ldquo;{searchQuery}&rdquo;
                <button
                  type="button"
                  onClick={() => {
                    setInlineSearch('');
                    updateUrlParams({ search: '' });
                  }}
                  className="hover:text-orange-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {hasLocationFilter && (
              <span className="inline-flex items-center gap-1.5 bg-orange-50 text-brand-orange border border-orange-200 px-3 py-1 rounded-full text-xs font-bold">
                Location: {locationLabel}
                <button
                  type="button"
                  onClick={() =>
                    updateUrlParams({ region_id: '', sub_region_id: '', location: '' })
                  }
                  className="hover:text-orange-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1.5 bg-orange-50 text-brand-orange border border-orange-200 px-3 py-1 rounded-full text-xs font-bold">
                Category: {activeCategoryName}
                <button
                  type="button"
                  onClick={() => updateUrlParams({ category: 'all' })}
                  className="hover:text-orange-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="inline-flex items-center gap-1.5 bg-orange-50 text-brand-orange border border-orange-200 px-3 py-1 rounded-full text-xs font-bold">
                Price: ₦{minPrice || '0'} – ₦{maxPrice || 'Any'}
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice('');
                    setMaxPrice('');
                  }}
                  className="hover:text-orange-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {conditionFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 bg-orange-50 text-brand-orange border border-orange-200 px-3 py-1 rounded-full text-xs font-bold">
                Condition: {conditionFilter}
                <button
                  type="button"
                  onClick={() => setConditionFilter('all')}
                  className="hover:text-orange-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Feed Header with Collapsible Inline Search Between "Trending Ads" and "Filter & Sort" */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
          <h2 className="text-base font-bold text-gray-900 shrink-0">
            {searchQuery
              ? `Results for "${searchQuery}"`
              : hasLocationFilter
              ? `${activeCategoryName} in ${locationLabel}`
              : activeCategoryName}
          </h2>

          {showFilters && (
            <div className="order-3 sm:order-2 w-full sm:w-auto sm:flex-1 sm:max-w-md relative">
              <Search className="w-3.5 h-3.5 text-brand-orange absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={inlineSearch}
                onChange={(e) => setInlineSearch(e.target.value)}
                placeholder={`Search ${hasLocationFilter ? `in ${locationLabel}` : 'ads'}...`}
                className="w-full pl-8 pr-8 py-1.5 bg-white border border-brand-orange/60 rounded-lg text-xs text-gray-800 shadow-xs focus:outline-none focus:border-brand-orange transition"
              />
              {inlineSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setInlineSearch('');
                    updateUrlParams({ search: '' }, true);
                  }}
                  aria-label="Clear filter search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <div className="order-2 sm:order-3 flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowFilters((f) => !f)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border shadow-sm transition ${
                showFilters || minPrice || maxPrice || conditionFilter !== 'all'
                  ? 'bg-orange-50 border-brand-orange text-brand-orange'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-brand-orange'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter &amp; Sort</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode((m) => (m === 'grid' ? 'list' : 'grid'))}
              className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 text-gray-600 hover:text-brand-orange rounded-md shadow-sm transition"
              title="Toggle View"
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              className="flex items-center gap-1.5 text-xs text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-md shadow-sm hover:border-brand-orange transition"
            >
              <MapPin className="w-3.5 h-3.5 text-brand-orange" />
              <span className="font-medium max-w-[130px] truncate">{locationLabel}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Price, Condition & Sort Bar */}
        {showFilters && (
          <div className="mb-4 bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                Min Price (₦)
              </label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                Max Price (₦)
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="e.g. 500000"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                Condition
              </label>
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
              >
                <option value="all">All Conditions</option>
                <option value="Brand New">Brand New</option>
                <option value="Foreign Used">Foreign Used (Tokunbo)</option>
                <option value="Nigerian Used">Nigerian Used</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Lowest Price</option>
                <option value="price_desc">Highest Price</option>
              </select>
            </div>
          </div>
        )}

        {/* Feed Results */}
        {loadingFeed ? (
          <div className="bg-white p-12 rounded-xl border border-gray-200 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-brand-orange" />
          </div>
        ) : visibleAds.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-4">
                {visibleAds.map((ad: any) => (
                  <ProductCard key={ad.id} ad={ad} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3 pb-4">
                {visibleAds.map((ad: any) => (
                  <Link
                    key={ad.id}
                    href={`/ad/${ad.id}`}
                    className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg hover:scale-[1.01] hover:border-brand-orange transition-all duration-300 flex flex-row group relative h-32 md:h-40"
                  >
                    <button
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur rounded-full shadow-sm hover:text-brand-orange transition z-10"
                      title="Save Ad"
                    >
                      <Heart className="w-4 h-4 text-gray-500" />
                    </button>

                    <div className="relative w-32 md:w-48 bg-gray-100 overflow-hidden shrink-0">
                      <img
                        src={getAdImage(ad)}
                        alt={ad.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      {ad.is_vip && (
                        <span className="absolute top-2 left-2 bg-amber-400 text-gray-950 font-black text-[9px] uppercase px-2 py-0.5 rounded shadow-sm z-10">
                          {ad.vip_type}
                        </span>
                      )}
                    </div>

                    <div className="p-3 md:p-5 flex flex-col flex-1 min-w-0 pr-12">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                        <h3 className="font-bold text-gray-800 text-sm md:text-base line-clamp-1 mb-1 pr-2 flex items-center gap-1.5">
                          {ad.title}
                          {ad.seller_verified && (
                            <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                          )}
                        </h3>
                        <p className="text-brand-orange font-black text-base md:text-lg shrink-0">
                          ₦{Number(ad.price).toLocaleString('en-NG')}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1 hidden md:block mb-auto">
                        {ad.description}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-100">
                        <span className="flex items-center gap-1 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-brand-orange" />{' '}
                          {ad.shop_address || 'Nigeria'}
                        </span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded">
                          {ad.condition || 'Used'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {hasMoreAds && (
              <div className="mt-6 mb-8 text-center">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => fetchFilteredAds(page, false)}
                  className="bg-white border border-gray-200 hover:bg-orange-50 hover:border-orange-200 text-brand-orange font-bold px-8 py-3 rounded-full text-sm shadow-sm transition inline-flex items-center gap-2 disabled:opacity-60"
                >
                  {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loadingMore ? 'Loading...' : 'Load More Ads'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-200 text-center space-y-2">
            <p className="text-gray-700 font-bold text-sm">
              {hasLocationFilter
                ? `No adverts found in ${locationLabel}${searchQuery ? ` matching "${searchQuery}"` : ''}.`
                : 'No adverts found matching your search or filter criteria.'}
            </p>
            {hasLocationFilter && (
              <button
                type="button"
                onClick={() =>
                  updateUrlParams({ region_id: '', sub_region_id: '', location: '' })
                }
                className="text-xs font-bold text-brand-orange hover:underline"
              >
                Show adverts across All Nigeria
              </button>
            )}
          </div>
        )}
      </div>

      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelectLocation={({ regionId: rId, subRegionId: srId, label }) => {
          updateUrlParams({
            region_id: rId,
            sub_region_id: srId,
            location: label,
          });
        }}
      />
    </div>
  );
}

export default function MarketplaceFeed(props: MarketplaceFeedProps) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        </div>
      }
    >
      <FeedContent {...props} />
    </Suspense>
  );
}
