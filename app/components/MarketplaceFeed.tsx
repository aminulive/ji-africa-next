"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
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
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ShieldCheck,
  BellPlus,
  CheckCircle2,
} from 'lucide-react';
import HeroBanner from './HeroBanner';
import RecentlyViewedStrip from './RecentlyViewedStrip';
import ProductCard from './ProductCard';
import LocationModal from './LocationModal';
import { CategoryIcon } from '../lib/categoryIcons';
import { getCategoryVisualMeta } from '../lib/categoryThumbs';
import { getCategorySpecConfig } from '../lib/categorySpecs';

const API_URL = 'https://ji-africa-backend.onrender.com/api';

interface CategoryNode {
  name: string;
  children: CategoryNode[];
}

interface MarketplaceFeedProps {
  initialCategories: any[];
  initialAds: any[];
}

const PRICE_RANGE_PRESETS = [
  { id: 'all', label: 'All Prices', min: '', max: '' },
  { id: 'under50k', label: '< ₦50K', min: '', max: '50000' },
  { id: '50k_150k', label: '₦50K – ₦150K', min: '50000', max: '150000' },
  { id: '150k_500k', label: '₦150K – ₦500K', min: '150000', max: '500000' },
  { id: '500k_2m', label: '₦500K – ₦2M', min: '500000', max: '2000000' },
  { id: 'above2m', label: '> ₦2M', min: '2000000', max: '' },
];

function buildCategoryTree(cat: any): CategoryNode[] {
  if (Array.isArray(cat?.category_tree) && cat.category_tree.length > 0) {
    return cat.category_tree;
  }
  const raw = cat?.subcategories;
  if (Array.isArray(raw)) {
    return raw
      .map((item: any) =>
        typeof item === 'string'
          ? { name: item, children: [] }
          : item?.name
          ? { name: item.name, children: Array.isArray(item.children) ? item.children : [] }
          : null
      )
      .filter(Boolean) as CategoryNode[];
  }
  return [];
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

  // 4-Level Category Drilldown Params
  const selectedCategory = searchParams.get('category') || 'all';
  const selectedSubcategory = searchParams.get('subcategory') || '';
  const selectedSubSubcategory = searchParams.get('sub_subcategory') || '';
  const selectedLevel4 = searchParams.get('sub_sub_subcategory') || '';

  // Refinement, Brand, Type, Model & Price Range States
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [jiTrustOnly, setJiTrustOnly] = useState(false);
  const [brandFilter, setBrandFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [inlineSearch, setInlineSearch] = useState(searchQuery);

  useEffect(() => {
    setInlineSearch(searchQuery);
  }, [searchQuery]);

  // Reset industry-specific brand/type/model when switching main category
  useEffect(() => {
    setBrandFilter('all');
    setTypeFilter('all');
    setModelFilter('');
  }, [selectedCategory]);

  const hasLocationFilter = Boolean(
    regionId || subRegionId || (locationLabel && locationLabel !== 'All Nigeria')
  );

  const hasActiveFilters = Boolean(
    searchQuery ||
      hasLocationFilter ||
      (selectedCategory && selectedCategory !== 'all') ||
      selectedSubcategory ||
      selectedSubSubcategory ||
      selectedLevel4 ||
      minPrice ||
      maxPrice ||
      conditionFilter !== 'all' ||
      jiTrustOnly ||
      brandFilter !== 'all' ||
      typeFilter !== 'all' ||
      modelFilter.trim()
  );

  const sortedCategories = useMemo(() => {
    return [...initialCategories]
      .sort((a, b) => (Number(a.display_order) || 99) - (Number(b.display_order) || 99))
      .map((cat) => ({
        ...cat,
        tree: buildCategoryTree(cat),
      }));
  }, [initialCategories]);

  // Active Category Tree Nodes across Levels 1 -> 2 -> 3 -> 4
  const activeCatObj = useMemo(
    () => sortedCategories.find((c) => String(c.id) === String(selectedCategory)) || null,
    [sortedCategories, selectedCategory]
  );

  const activeSpecConfig = useMemo(
    () => getCategorySpecConfig(activeCatObj?.name),
    [activeCatObj]
  );

  const availableModelsForFilter = useMemo(() => {
    if (!brandFilter || brandFilter === 'all') return [];
    const found = activeSpecConfig.brands.find(
      (b) => b.name.toLowerCase() === brandFilter.toLowerCase()
    );
    return found ? found.models : [];
  }, [activeSpecConfig, brandFilter]);

  const activeLevel2Node = useMemo(
    () =>
      activeCatObj?.tree.find(
        (n: CategoryNode) => n.name.toLowerCase() === selectedSubcategory.toLowerCase()
      ) || null,
    [activeCatObj, selectedSubcategory]
  );

  const activeLevel3Node = useMemo(
    () =>
      activeLevel2Node?.children?.find(
        (n: CategoryNode) => n.name.toLowerCase() === selectedSubSubcategory.toLowerCase()
      ) || null,
    [activeLevel2Node, selectedSubSubcategory]
  );

  const currentDrillOptions: {
    level: 2 | 3 | 4;
    parentLabel: string;
    nodes: CategoryNode[];
  } | null = useMemo(() => {
    if (!activeCatObj) return null;
    if (activeLevel3Node && activeLevel3Node.children?.length > 0) {
      return {
        level: 4,
        parentLabel: activeLevel3Node.name,
        nodes: activeLevel3Node.children,
      };
    }
    if (activeLevel2Node && activeLevel2Node.children?.length > 0 && !selectedSubSubcategory) {
      return {
        level: 3,
        parentLabel: activeLevel2Node.name,
        nodes: activeLevel2Node.children,
      };
    }
    if (activeCatObj.tree.length > 0 && !selectedSubcategory) {
      return {
        level: 2,
        parentLabel: activeCatObj.name,
        nodes: activeCatObj.tree,
      };
    }
    return null;
  }, [activeCatObj, activeLevel2Node, activeLevel3Node, selectedSubcategory, selectedSubSubcategory]);

  const [ads, setAds] = useState<any[]>(initialAds);
  const [page, setPage] = useState(2);
  const [hasMoreAds, setHasMoreAds] = useState(initialAds.length >= 20);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  useEffect(() => {
    const syncListWishlist = () => {
      try {
        setWishlistIds(JSON.parse(localStorage.getItem("ji_wishlist") || "[]").map(String));
      } catch {
        setWishlistIds([]);
      }
    };
    syncListWishlist();
    window.addEventListener("ji_wishlist_updated", syncListWishlist);
    return () => window.removeEventListener("ji_wishlist_updated", syncListWishlist);
  }, []);

  const handleToggleListWishlist = (e: React.MouseEvent, adId: number | string) => {
    e.preventDefault();
    e.stopPropagation();
    const user = localStorage.getItem("ji_user");
    const token = localStorage.getItem("ji_token");
    if (!user) {
      router.push("/login");
      return;
    }
    const strId = String(adId);
    const exists = wishlistIds.includes(strId);
    const next = exists ? wishlistIds.filter((id) => id !== strId) : [...wishlistIds, strId];
    setWishlistIds(next);
    localStorage.setItem("ji_wishlist", JSON.stringify(next));
    window.dispatchEvent(new Event("ji_wishlist_updated"));

    if (token) {
      fetch("https://ji-africa-backend.onrender.com/api/users/wishlist/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ad_id: Number(adId) }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (Array.isArray(data?.wishlistIds)) {
            setWishlistIds(data.wishlistIds);
            localStorage.setItem("ji_wishlist", JSON.stringify(data.wishlistIds));
            window.dispatchEvent(new Event("ji_wishlist_updated"));
          }
        })
        .catch(() => {});
    }
  };
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [savingAlert, setSavingAlert] = useState(false);
  const [alertSavedToast, setAlertSavedToast] = useState('');

  const handleSaveSearchAlert = async () => {
    const token = localStorage.getItem('ji_token');
    if (!token) {
      router.push('/login');
      return;
    }
    setSavingAlert(true);
    try {
      const res = await fetch(`${API_URL}/users/saved-searches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: searchQuery,
          category_id: selectedCategory !== 'all' ? selectedCategory : null,
          subcategory: selectedSubcategory || null,
          location: locationLabel !== 'All Nigeria' ? locationLabel : null,
          max_price: maxPrice || null,
          email_enabled: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAlertSavedToast(data.message || 'Search alert saved! We will notify you when matching items drop.');
        setTimeout(() => setAlertSavedToast(''), 4500);
      } else {
        setAlertSavedToast(data.error || 'Could not save search alert');
        setTimeout(() => setAlertSavedToast(''), 4000);
      }
    } catch {
      setAlertSavedToast('Network error saving search alert');
      setTimeout(() => setAlertSavedToast(''), 4000);
    } finally {
      setSavingAlert(false);
    }
  };
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ji_recently_viewed");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRecentlyViewed(parsed.slice(0, 6));
      }
    } catch {}
  }, []);

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
        if (selectedSubcategory) url.searchParams.append('subcategory', selectedSubcategory);
        if (selectedSubSubcategory) {
          url.searchParams.append('sub_subcategory', selectedSubSubcategory);
        }
        if (selectedLevel4) {
          url.searchParams.append('sub_sub_subcategory', selectedLevel4);
        }
        if (brandFilter !== 'all') url.searchParams.append('brand', brandFilter);
        if (typeFilter !== 'all') url.searchParams.append('type', typeFilter);
        if (modelFilter.trim()) url.searchParams.append('model', modelFilter.trim());
        if (subRegionId) url.searchParams.append('sub_region_id', subRegionId);
        else if (regionId) url.searchParams.append('region_id', regionId);
        if (locationLabel && locationLabel !== 'All Nigeria') {
          url.searchParams.append('location', locationLabel);
        }
        if (minPrice) url.searchParams.append('min_price', minPrice);
        if (maxPrice) url.searchParams.append('max_price', maxPrice);
        if (conditionFilter !== 'all') url.searchParams.append('condition', conditionFilter);
        if (jiTrustOnly) url.searchParams.append('ji_trust', '1');
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
      selectedSubcategory,
      selectedSubSubcategory,
      selectedLevel4,
      brandFilter,
      typeFilter,
      modelFilter,
      regionId,
      subRegionId,
      locationLabel,
      minPrice,
      maxPrice,
      conditionFilter,
      jiTrustOnly,
      sortBy,
    ]
  );

  useEffect(() => {
    if (!hasActiveFilters && sortBy === 'newest') {
      setAds(initialAds);
      setPage(2);
      setHasMoreAds(initialAds.length >= 20);
      return;
    }
    fetchFilteredAds(1, true);
  }, [hasActiveFilters, sortBy, initialAds, fetchFilteredAds]);

  const activeCategoryHeading =
    selectedLevel4 ||
    selectedSubSubcategory ||
    selectedSubcategory ||
    (selectedCategory === 'all' ? 'Trending Ads' : activeCatObj?.name || 'Ads');

  const visibleAds = useMemo(() => {
    const filtered = ads.filter((a) => {
      if (a.status === 'Unavailable' || a.status === 'unavailable') return false;
      const numericPrice = Number(a.price) || 0;
      if (minPrice && numericPrice < Number(minPrice)) return false;
      if (maxPrice && numericPrice > Number(maxPrice)) return false;
      if (jiTrustOnly && !a.ji_trust_enabled) return false;
      if (conditionFilter !== 'all') {
        const adCond = (a.condition || '').toLowerCase();
        if (!adCond.includes(conditionFilter.toLowerCase())) return false;
      }
      if (brandFilter !== 'all') {
        const adBrand = (a.brand || '').toLowerCase();
        const titleLow = (a.title || '').toLowerCase();
        if (!adBrand.includes(brandFilter.toLowerCase()) && !titleLow.includes(brandFilter.toLowerCase())) {
          return false;
        }
      }
      if (typeFilter !== 'all') {
        const adType = (a.type || '').toLowerCase();
        const titleLow = (a.title || '').toLowerCase();
        if (!adType.includes(typeFilter.toLowerCase()) && !titleLow.includes(typeFilter.toLowerCase())) {
          return false;
        }
      }
      if (modelFilter.trim()) {
        const qModel = modelFilter.trim().toLowerCase();
        const adModel = (a.attributes?.model || '').toLowerCase();
        const titleLow = (a.title || '').toLowerCase();
        if (!adModel.includes(qModel) && !titleLow.includes(qModel)) return false;
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
  }, [ads, minPrice, maxPrice, conditionFilter, jiTrustOnly, brandFilter, typeFilter, modelFilter, sortBy]);

  // Hover-to-Reveal Desktop Category Flyout + Mobile Subcategory Sheet
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(null);
  const [mobileSheetCat, setMobileSheetCat] = useState<any | null>(null);
  const hoverCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openCategoryFlyout = (catId: string) => {
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
    setHoveredCatId(catId);
  };

  const scheduleCloseCategoryFlyout = () => {
    if (hoverCloseTimerRef.current) clearTimeout(hoverCloseTimerRef.current);
    hoverCloseTimerRef.current = setTimeout(() => {
      setHoveredCatId(null);
    }, 150);
  };

  const hoveredCatObj = useMemo(
    () => sortedCategories.find((c) => String(c.id) === String(hoveredCatId)) || null,
    [sortedCategories, hoveredCatId]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Desktop Categories Sidebar with Mini Thumbnails & Hover-to-Reveal Subcategory Flyout */}
      <aside
        className="hidden lg:block w-72 shrink-0"
        onMouseLeave={scheduleCloseCategoryFlyout}
      >
        <div className="relative sticky top-20">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="bg-gray-50 dark:bg-neutral-950 px-4 py-3 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-gray-900 dark:text-neutral-100 text-sm">Categories</h3>
                <p className="text-[10px] text-gray-400">Hover any category to explore</p>
              </div>
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() =>
                    updateUrlParams({
                      category: 'all',
                      subcategory: '',
                      sub_subcategory: '',
                      sub_sub_subcategory: '',
                    })
                  }
                  className="text-[11px] font-bold text-brand-orange hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <ul className="py-1.5 max-h-[calc(100vh-7.5rem)] overflow-y-auto divide-y divide-gray-50 dark:divide-neutral-800/60">
              <li onMouseEnter={() => scheduleCloseCategoryFlyout()}>
                <button
                  type="button"
                  onClick={() =>
                    updateUrlParams({
                      category: 'all',
                      subcategory: '',
                      sub_subcategory: '',
                      sub_sub_subcategory: '',
                    })
                  }
                  className={`w-full flex items-center gap-3 text-left px-3.5 py-2.5 text-xs transition ${
                    selectedCategory === 'all'
                      ? 'text-brand-orange font-extrabold bg-orange-50/90 dark:bg-brand-orange/15'
                      : 'text-gray-700 dark:text-neutral-200 hover:text-brand-orange hover:bg-orange-50/60 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-brand-orange flex items-center justify-center shrink-0 shadow-2xs">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate font-bold">All Ads</span>
                    <span className="block text-[10px] text-gray-400">Browse entire marketplace</span>
                  </div>
                </button>
              </li>

              {sortedCategories.map((c: any) => {
                const isSelected = String(selectedCategory) === String(c.id);
                const isHovered = String(hoveredCatId) === String(c.id);
                const hasChildren = c.tree && c.tree.length > 0;
                const visual = getCategoryVisualMeta(c.name);
                const subCount = c.tree?.length || 0;

                return (
                  <li
                    key={c.id}
                    onMouseEnter={() => openCategoryFlyout(String(c.id))}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setHoveredCatId(null);
                        updateUrlParams({
                          category: String(c.id),
                          subcategory: '',
                          sub_subcategory: '',
                          sub_sub_subcategory: '',
                        });
                      }}
                      className={`w-full flex items-center justify-between gap-2.5 text-left px-3.5 py-2 text-xs transition group ${
                        isSelected || isHovered
                          ? 'text-brand-orange font-extrabold bg-orange-50/90 dark:bg-brand-orange/15'
                          : 'text-gray-700 dark:text-neutral-200 hover:text-brand-orange hover:bg-orange-50/60 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-lg ${visual.accentBg} overflow-hidden shrink-0 border border-gray-200/80 dark:border-neutral-700 flex items-center justify-center shadow-2xs`}
                        >
                          <img
                            src={visual.image}
                            alt={c.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-bold leading-tight">{c.name}</span>
                          {subCount > 0 && (
                            <span className="block text-[10px] font-medium text-gray-400 leading-tight mt-0.5">
                              {subCount} subcategories
                            </span>
                          )}
                        </span>
                      </span>

                      {hasChildren && (
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                            isHovered
                              ? 'text-brand-orange translate-x-0.5'
                              : isSelected
                              ? 'text-brand-orange'
                              : 'text-gray-400 group-hover:text-brand-orange group-hover:translate-x-0.5'
                          }`}
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Floating Hover-to-Reveal Subcategory Flyout Panel (Jiji-Style with Diagonal Safe-Zone) */}
          {hoveredCatObj && hoveredCatObj.tree && hoveredCatObj.tree.length > 0 && (
            <div
              onMouseEnter={() => openCategoryFlyout(String(hoveredCatObj.id))}
              onMouseLeave={scheduleCloseCategoryFlyout}
              className="absolute left-[calc(100%+6px)] top-0 w-[520px] xl:w-[620px] max-h-[calc(100vh-6rem)] overflow-y-auto bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-2xl z-40 p-4 before:content-[''] before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-4"
            >
              {/* Flyout Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <img
                    src={getCategoryVisualMeta(hoveredCatObj.name).image}
                    alt={hoveredCatObj.name}
                    className="w-9 h-9 rounded-lg object-cover border border-gray-200"
                  />
                  <div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-neutral-100">
                      {hoveredCatObj.name}
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      Select a subcategory or view all listings
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const targetId = String(hoveredCatObj.id);
                    setHoveredCatId(null);
                    updateUrlParams({
                      category: targetId,
                      subcategory: '',
                      sub_subcategory: '',
                      sub_sub_subcategory: '',
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-brand-orange hover:bg-orange-700 text-white text-xs font-bold transition shrink-0"
                >
                  View All &rarr;
                </button>
              </div>

              {/* 2-Column Subcategory & Level-3 Grid */}
              <div className="grid grid-cols-2 gap-3">
                {hoveredCatObj.tree.map((l2: CategoryNode) => (
                  <div
                    key={l2.name}
                    className="p-2.5 rounded-lg bg-gray-50/80 dark:bg-neutral-800/60 hover:bg-orange-50/60 dark:hover:bg-neutral-800 border border-transparent hover:border-orange-200 transition"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const targetId = String(hoveredCatObj.id);
                        setHoveredCatId(null);
                        updateUrlParams({
                          category: targetId,
                          subcategory: l2.name,
                          sub_subcategory: '',
                          sub_sub_subcategory: '',
                        });
                      }}
                      className="w-full flex items-center justify-between text-left text-xs font-extrabold text-gray-900 dark:text-neutral-100 hover:text-brand-orange transition"
                    >
                      <span className="truncate">{l2.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                    </button>

                    {l2.children && l2.children.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {l2.children.slice(0, 6).map((l3: CategoryNode) => (
                          <button
                            key={l3.name}
                            type="button"
                            onClick={() => {
                              const targetId = String(hoveredCatObj.id);
                              setHoveredCatId(null);
                              updateUrlParams({
                                category: targetId,
                                subcategory: l2.name,
                                sub_subcategory: l3.name,
                                sub_sub_subcategory: '',
                              });
                            }}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white dark:bg-neutral-900 text-gray-600 dark:text-neutral-300 hover:bg-brand-orange hover:text-white border border-gray-200/80 dark:border-neutral-700 transition"
                          >
                            {l3.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Feed Column */}
      <div className="flex-1 min-w-0">
        <HeroBanner />
        <RecentlyViewedStrip />

        {/* Visual Popular Categories Strip (Photo Cards) */}
        {selectedCategory === 'all' && !searchQuery && sortedCategories.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-gray-600 dark:text-neutral-300">
                Browse Popular Categories
              </h2>
              <span className="text-[11px] font-semibold text-gray-400 hidden sm:inline">
                Tap any category to filter instantly
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
              {sortedCategories.slice(0, 8).map((c: any) => {
                const visual = getCategoryVisualMeta(c.name);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      updateUrlParams({
                        category: String(c.id),
                        subcategory: '',
                        sub_subcategory: '',
                        sub_sub_subcategory: '',
                      })
                    }
                    className="group bg-white dark:bg-neutral-900 hover:bg-orange-50/70 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-800 hover:border-brand-orange rounded-xl p-2 flex flex-col items-center text-center shadow-2xs transition"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-gray-100 mb-1.5 border border-gray-100 dark:border-neutral-800">
                      <img
                        src={visual.image}
                        alt={c.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <span className="text-[10px] font-extrabold text-gray-800 dark:text-neutral-200 group-hover:text-brand-orange line-clamp-1 leading-tight">
                      {c.name.split(',')[0].split('&')[0].trim()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Trust & Escrow Filter Strip */}
        <div className="mb-4 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 px-3.5 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setJiTrustOnly(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                !jiTrustOnly
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Listings
            </button>
            <button
              type="button"
              onClick={() => setJiTrustOnly((v) => !v)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition inline-flex items-center gap-1.5 border ${
                jiTrustOnly
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> JI Trust Protected Only
            </button>
          </div>
          <span className="text-[11px] font-semibold text-gray-500">
            {jiTrustOnly
              ? `Showing ${visibleAds.length} escrow-protected item(s)`
              : 'Filter by JI Trust for 100% escrow payment safety'}
          </span>
        </div>

        {/* Mobile Horizontal Category Photo Circles */}
        <div className="block lg:hidden mb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              type="button"
              onClick={() =>
                updateUrlParams({
                  category: 'all',
                  subcategory: '',
                  sub_subcategory: '',
                  sub_sub_subcategory: '',
                })
              }
              className="flex flex-col items-center gap-1.5 shrink-0 snap-start w-[70px]"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition ${
                  selectedCategory === 'all'
                    ? 'bg-orange-50 text-brand-orange border-2 border-brand-orange'
                    : 'bg-white text-gray-500 border border-gray-200'
                }`}
              >
                <LayoutGrid className="w-6 h-6" />
              </div>
              <span
                className={`text-[10px] font-bold text-center leading-tight ${
                  selectedCategory === 'all' ? 'text-brand-orange' : 'text-gray-600'
                }`}
              >
                All
              </span>
            </button>

            {sortedCategories.map((c: any) => {
              const isSelected = String(selectedCategory) === String(c.id);
              const visual = getCategoryVisualMeta(c.name);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    if (c.tree && c.tree.length > 0) {
                      setMobileSheetCat(c);
                    } else {
                      updateUrlParams({
                        category: String(c.id),
                        subcategory: '',
                        sub_subcategory: '',
                        sub_sub_subcategory: '',
                      });
                    }
                  }}
                  className="flex flex-col items-center gap-1.5 shrink-0 snap-start w-[70px]"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl overflow-hidden shadow-sm transition ${
                      isSelected
                        ? 'border-2 border-brand-orange ring-2 ring-brand-orange/20'
                        : 'border border-gray-200 bg-white'
                    }`}
                  >
                    <img
                      src={visual.image}
                      alt={c.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span
                    className={`text-[10px] font-bold text-center leading-tight line-clamp-2 ${
                      isSelected ? 'text-brand-orange' : 'text-gray-600'
                    }`}
                  >
                    {c.name.split(',')[0].split('&')[0].trim()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Subcategory Bottom Sheet (Touch Equivalent of Desktop Hover Flyout) */}
        {mobileSheetCat && (
          <div
            className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-xs flex items-end"
            onClick={() => setMobileSheetCat(null)}
          >
            <div
              className="bg-white dark:bg-neutral-900 w-full rounded-t-2xl p-4 max-h-[78vh] overflow-y-auto shadow-2xl border-t border-gray-200 dark:border-neutral-800 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <img
                    src={getCategoryVisualMeta(mobileSheetCat.name).image}
                    alt={mobileSheetCat.name}
                    className="w-9 h-9 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-neutral-100">
                      {mobileSheetCat.name}
                    </h3>
                    <p className="text-[11px] text-gray-400">Choose a subcategory</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSheetCat(null)}
                  className="p-1.5 rounded-full bg-gray-100 text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const targetId = String(mobileSheetCat.id);
                  setMobileSheetCat(null);
                  updateUrlParams({
                    category: targetId,
                    subcategory: '',
                    sub_subcategory: '',
                    sub_sub_subcategory: '',
                  });
                }}
                className="w-full py-2.5 px-3.5 rounded-xl bg-brand-orange text-white text-xs font-extrabold flex items-center justify-between"
              >
                <span>View All in {mobileSheetCat.name}</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 gap-1.5">
                {(mobileSheetCat.tree || []).map((l2: CategoryNode) => (
                  <button
                    key={l2.name}
                    type="button"
                    onClick={() => {
                      const targetId = String(mobileSheetCat.id);
                      setMobileSheetCat(null);
                      updateUrlParams({
                        category: targetId,
                        subcategory: l2.name,
                        sub_subcategory: '',
                        sub_sub_subcategory: '',
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-neutral-800 hover:bg-orange-50 text-left text-xs font-bold text-gray-800 dark:text-neutral-200 flex items-center justify-between"
                  >
                    <span>{l2.name}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Interactive 4-Level Subcategory Drilldown Strip + Top Brand Icon Cards */}
        {activeCatObj && (
          <div className="mb-4 bg-white rounded-xl border border-gray-200 p-3 shadow-xs space-y-3">
            {/* Clickable Category Breadcrumb Trail */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-gray-500">
              <button
                type="button"
                onClick={() =>
                  updateUrlParams({
                    category: 'all',
                    subcategory: '',
                    sub_subcategory: '',
                    sub_sub_subcategory: '',
                  })
                }
                className="inline-flex items-center gap-1 text-gray-600 hover:text-brand-orange"
              >
                <ArrowLeft className="w-3 h-3" /> All Categories
              </button>
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <button
                type="button"
                onClick={() =>
                  updateUrlParams({
                    category: String(activeCatObj.id),
                    subcategory: '',
                    sub_subcategory: '',
                    sub_sub_subcategory: '',
                  })
                }
                className={
                  !selectedSubcategory
                    ? 'text-brand-orange font-black'
                    : 'hover:text-brand-orange'
                }
              >
                {activeCatObj.name}
              </button>

              {selectedSubcategory && (
                <>
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                  <button
                    type="button"
                    onClick={() =>
                      updateUrlParams({
                        category: String(activeCatObj.id),
                        subcategory: selectedSubcategory,
                        sub_subcategory: '',
                        sub_sub_subcategory: '',
                      })
                    }
                    className={
                      !selectedSubSubcategory
                        ? 'text-brand-orange font-black'
                        : 'hover:text-brand-orange'
                    }
                  >
                    {selectedSubcategory}
                  </button>
                </>
              )}

              {selectedSubSubcategory && (
                <>
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                  <button
                    type="button"
                    onClick={() =>
                      updateUrlParams({
                        category: String(activeCatObj.id),
                        subcategory: selectedSubcategory,
                        sub_subcategory: selectedSubSubcategory,
                        sub_sub_subcategory: '',
                      })
                    }
                    className={
                      !selectedLevel4
                        ? 'text-brand-orange font-black'
                        : 'hover:text-brand-orange'
                    }
                  >
                    {selectedSubSubcategory}
                  </button>
                </>
              )}

              {selectedLevel4 && (
                <>
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                  <span className="text-brand-orange font-black">{selectedLevel4}</span>
                </>
              )}
            </div>

            {/* Next-Level Subcategory Pills */}
            {currentDrillOptions && currentDrillOptions.nodes.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <span className="text-[10px] font-extrabold uppercase text-gray-600 shrink-0">
                  {currentDrillOptions.parentLabel}:
                </span>
                {currentDrillOptions.nodes.map((node) => {
                  const hasDeeper = node.children && node.children.length > 0;
                  return (
                    <button
                      key={node.name}
                      type="button"
                      onClick={() => {
                        if (currentDrillOptions.level === 2) {
                          updateUrlParams({
                            category: String(activeCatObj.id),
                            subcategory: node.name,
                            sub_subcategory: '',
                            sub_sub_subcategory: '',
                          });
                        } else if (currentDrillOptions.level === 3) {
                          updateUrlParams({
                            category: String(activeCatObj.id),
                            subcategory: selectedSubcategory,
                            sub_subcategory: node.name,
                            sub_sub_subcategory: '',
                          });
                        } else {
                          updateUrlParams({
                            category: String(activeCatObj.id),
                            subcategory: selectedSubcategory,
                            sub_subcategory: selectedSubSubcategory,
                            sub_sub_subcategory: node.name,
                          });
                        }
                      }}
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 hover:bg-brand-orange dark:hover:bg-brand-orange text-gray-800 dark:text-gray-100 hover:text-white border border-gray-200 dark:border-gray-700 transition shrink-0 inline-flex items-center gap-1"
                    >
                      <span>{node.name}</span>
                      {hasDeeper && <ChevronRight className="w-3.5 h-3.5 opacity-75" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Clickable Top Brand Icon Cards */}
            {activeSpecConfig.brands.length > 0 && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400">
                    Top Brands in {activeCatObj.name}
                  </span>
                  {brandFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => {
                        setBrandFilter('all');
                        setModelFilter('');
                      }}
                      className="text-[10px] font-bold text-brand-orange hover:underline"
                    >
                      Clear Brand
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {activeSpecConfig.brands.map((b) => {
                    const isBrandActive = brandFilter.toLowerCase() === b.name.toLowerCase();
                    return (
                      <button
                        key={b.name}
                        type="button"
                        onClick={() => {
                          if (isBrandActive) {
                            setBrandFilter('all');
                            setModelFilter('');
                          } else {
                            setBrandFilter(b.name);
                            setModelFilter('');
                          }
                        }}
                        className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl border transition shrink-0 min-w-[74px] ${
                          isBrandActive
                            ? 'border-brand-orange bg-orange-50 dark:bg-brand-orange/15 shadow-xs'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 hover:border-brand-orange'
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-full ${b.bg} ${b.text} flex items-center justify-center font-black text-[10px] tracking-tight shadow-xs`}
                        >
                          {b.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold truncate max-w-[68px] ${
                            isBrandActive
                              ? 'text-brand-orange'
                              : 'text-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {b.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Always-Visible Quick Price Range Pills */}
        <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <span className="text-[10px] font-extrabold uppercase text-gray-700 dark:text-gray-300 shrink-0">
            Budget:
          </span>
          {PRICE_RANGE_PRESETS.map((preset) => {
            const isPresetActive = minPrice === preset.min && maxPrice === preset.max;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setMinPrice(preset.min);
                  setMaxPrice(preset.max);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition shrink-0 ${
                  isPresetActive
                    ? 'bg-brand-orange text-white border-brand-orange shadow-xs'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-brand-orange'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
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
                {activeCategoryHeading}
                <button
                  type="button"
                  onClick={() =>
                    updateUrlParams({
                      category: 'all',
                      subcategory: '',
                      sub_subcategory: '',
                      sub_sub_subcategory: '',
                    })
                  }
                  className="hover:text-orange-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {brandFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 bg-orange-50 text-brand-orange border border-orange-200 px-3 py-1 rounded-full text-xs font-bold">
                Brand: {brandFilter}
                <button
                  type="button"
                  onClick={() => {
                    setBrandFilter('all');
                    setModelFilter('');
                  }}
                  className="hover:text-orange-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {typeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 bg-orange-50 text-brand-orange border border-orange-200 px-3 py-1 rounded-full text-xs font-bold">
                Type: {typeFilter}
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className="hover:text-orange-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {modelFilter.trim() && (
              <span className="inline-flex items-center gap-1.5 bg-orange-50 text-brand-orange border border-orange-200 px-3 py-1 rounded-full text-xs font-bold">
                Model: {modelFilter.trim()}
                <button
                  type="button"
                  onClick={() => setModelFilter('')}
                  className="hover:text-orange-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="inline-flex items-center gap-1.5 bg-orange-50 text-brand-orange border border-orange-200 px-3 py-1 rounded-full text-xs font-bold">
                Price: ₦{minPrice ? Number(minPrice).toLocaleString('en-NG') : '0'} –{' '}
                {maxPrice ? `₦${Number(maxPrice).toLocaleString('en-NG')}` : 'Any'}
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

        {/* Feed Header */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
          <h2 className="text-base font-bold text-gray-900 shrink-0">
            {searchQuery
              ? `Results for "${searchQuery}"`
              : hasLocationFilter
              ? `${activeCategoryHeading} in ${locationLabel}`
              : activeCategoryHeading}
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
                showFilters ||
                minPrice ||
                maxPrice ||
                conditionFilter !== 'all' ||
                brandFilter !== 'all' ||
                typeFilter !== 'all' ||
                modelFilter.trim()
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

        {/* Collapsible Industry-Specific Type, Brand, Model, Condition & Price Bar */}
        {showFilters && (
          <div className="mb-4 bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
              >
                <option value="all">All Types</option>
                {activeSpecConfig.types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                Brand
              </label>
              <select
                value={brandFilter}
                onChange={(e) => {
                  setBrandFilter(e.target.value);
                  setModelFilter('');
                }}
                className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
              >
                <option value="all">All Brands</option>
                {activeSpecConfig.brands.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                Model
              </label>
              <input
                list="ji-filter-models"
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                placeholder="Any model..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-orange"
              />
              <datalist id="ji-filter-models">
                {availableModelsForFilter.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
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
                {activeSpecConfig.conditions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

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

            <div className="col-span-2">
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
                      onClick={(e) => handleToggleListWishlist(e, ad.id)}
                      className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur rounded-full shadow-sm hover:text-brand-orange transition z-10"
                      title={wishlistIds.includes(String(ad.id)) ? "Remove from Saved Ads" : "Save Ad"}
                    >
                      <Heart
                        className={`w-4 h-4 transition ${
                          wishlistIds.includes(String(ad.id))
                            ? "fill-brand-orange text-brand-orange"
                            : "text-gray-500"
                        }`}
                      />
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
                          {ad.ji_trust_enabled && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase px-1.5 py-0.5 rounded shrink-0">
                              JI TRUST
                            </span>
                          )}
                        </h3>
                        <div className="text-right shrink-0">
                          <p className="text-brand-orange font-black text-base md:text-lg">
                            ₦{Number(ad.price).toLocaleString('en-NG')}
                          </p>
                          {Number(ad.previous_price || 0) > Number(ad.price || 0) && (
                            <p className="text-[10px] text-gray-400 line-through">
                              ₦{Number(ad.previous_price).toLocaleString('en-NG')}
                            </p>
                          )}
                        </div>
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

        {/* Buyer Request Discovery CTA */}
      <div className="mt-8 bg-gradient-to-r from-orange-50 via-amber-50/70 to-orange-50 border border-orange-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-orange text-white">
            Verified Merchant Sourcing
          </span>
          <h3 className="text-base sm:text-lg font-black text-gray-900">
            Didn&apos;t find what you&apos;re looking for?
          </h3>
          <p className="text-xs text-gray-600 max-w-xl leading-relaxed">
            Submit a specific <strong>Buyer Request</strong> for All of Nigeria, your State, or your exact LGA — verified merchants with stock will reach out to you directly.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href={searchQuery ? `/request?q=${encodeURIComponent(searchQuery)}` : "/request"}
            className="px-5 py-3 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-xs font-black transition shadow-sm whitespace-nowrap"
          >
            Submit a Buyer Request
          </Link>
        </div>
      </div>
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
