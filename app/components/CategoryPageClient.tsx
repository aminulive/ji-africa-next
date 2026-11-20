"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  MapPin,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  X,
  ShieldCheck,
  Loader2,
  BellPlus,
  CheckCircle2,
  ArrowLeft,
  Heart,
  BadgeCheck,
} from "lucide-react";
import ProductCard from "./ProductCard";
import LocationModal from "./LocationModal";
import { getAdPath } from "../lib/adUrl";
import {
  extractCategoryTree,
  getCategoryPath,
  slugifyCategoryName,
} from "../lib/categoryUrl";
import { getCategorySpecConfig } from "../lib/categorySpecs";
import { getCategoryVisualMeta } from "../lib/categoryThumbs";

const API_URL = "https://ji-africa-backend.onrender.com/api";

const SIDEBAR_PRICE_PRESETS = [
  { id: "under50k", label: "Under ₦50K", min: "", max: "50000" },
  { id: "50k_150k", label: "₦50K – ₦150K", min: "50000", max: "150000" },
  { id: "150k_500k", label: "₦150K – ₦500K", min: "150000", max: "500000" },
  { id: "500k_2m", label: "₦500K – ₦2M", min: "500000", max: "2000000" },
  { id: "above2m", label: "More than ₦2M", min: "2000000", max: "" },
];

interface CategoryPageClientProps {
  categories: any[];
  activeCategory: any;
  activeSubcategory?: string;
  initialAds: any[];
  initialTotal: number;
}

function getAdImage(ad: any) {
  if (!ad?.image) return "https://placehold.co/400x300/f8fafc/94a3b8?text=Ad";
  try {
    const parsed = JSON.parse(ad.image);
    const first = Array.isArray(parsed) ? parsed[0] : ad.image;
    if (first) {
      return first.startsWith("http") || first.startsWith("data:")
        ? first
        : "https://ji-africa-backend.onrender.com" + first;
    }
  } catch {
    if (typeof ad.image === "string" && ad.image.startsWith("http")) return ad.image;
  }
  return "https://placehold.co/400x300/f8fafc/94a3b8?text=Ad";
}

export default function CategoryPageClient({
  categories,
  activeCategory,
  activeSubcategory = "",
  initialAds,
  initialTotal,
}: CategoryPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchQuery = searchParams.get("search") || "";
  const selectedSubSubcategory = searchParams.get("sub_subcategory") || "";
  const regionId = searchParams.get("region_id") || "";
  const subRegionId = searchParams.get("sub_region_id") || "";
  const locationLabel = searchParams.get("location") || "All Nigeria";

  // Jiji-style Left Sidebar Filter States
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [draftMinPrice, setDraftMinPrice] = useState(searchParams.get("min_price") || "");
  const [draftMaxPrice, setDraftMaxPrice] = useState(searchParams.get("max_price") || "");

  const [brandFilter, setBrandFilter] = useState(searchParams.get("brand") || "all");
  const [brandSearch, setBrandSearch] = useState("");
  const [modelFilter, setModelFilter] = useState(searchParams.get("model") || "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "all");
  const [conditionFilter, setConditionFilter] = useState(searchParams.get("condition") || "all");
  const [jiTrustOnly, setJiTrustOnly] = useState(searchParams.get("ji_trust") === "1");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [inlineSearch, setInlineSearch] = useState(searchQuery);
  const [showAllSubs, setShowAllSubs] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const [ads, setAds] = useState<any[]>(initialAds);
  const [totalCount, setTotalCount] = useState<number>(initialTotal);
  const [page, setPage] = useState(2);
  const [hasMoreAds, setHasMoreAds] = useState(initialAds.length >= 20);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [savingAlert, setSavingAlert] = useState(false);
  const [alertSavedToast, setAlertSavedToast] = useState("");
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  const abortRef = useRef<AbortController | null>(null);
  const seqRef = useRef<number>(0);

  useEffect(() => {
    setInlineSearch(searchQuery);
  }, [searchQuery]);

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

  const categoryTree = useMemo(() => extractCategoryTree(activeCategory), [activeCategory]);
  const specConfig = useMemo(() => getCategorySpecConfig(activeCategory?.name), [activeCategory]);
  const categoryVisual = useMemo(() => getCategoryVisualMeta(activeCategory?.name), [activeCategory]);

  const activeSubNode = useMemo(
    () =>
      categoryTree.find(
        (n) => slugifyCategoryName(n.name) === slugifyCategoryName(activeSubcategory)
      ) || null,
    [categoryTree, activeSubcategory]
  );

  const hasLocationFilter = Boolean(
    regionId || subRegionId || (locationLabel && locationLabel !== "All Nigeria")
  );

  const updateCurrentRouteParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v && v !== "all" && v !== "All Nigeria") params.set(k, v);
        else params.delete(k);
      });
      const qs = params.toString();
      const base = getCategoryPath(activeCategory, activeSubcategory);
      router.replace(qs ? base + "?" + qs : base);
    },
    [router, searchParams, activeCategory, activeSubcategory]
  );

  const fetchCategoryAds = useCallback(
    async (pageNum: number, reset: boolean) => {
      if (reset) {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const currentSeq = ++seqRef.current;
        setLoadingFeed(true);

        try {
          const url = new URL(API_URL + "/ads");
          url.searchParams.set("page", "1");
          url.searchParams.set("limit", "24");
          url.searchParams.set("category", String(activeCategory.id));
          if (activeSubcategory) url.searchParams.set("subcategory", activeSubcategory);
          if (selectedSubSubcategory) url.searchParams.set("sub_subcategory", selectedSubSubcategory);
          if (searchQuery) url.searchParams.set("search", searchQuery);
          if (brandFilter !== "all") url.searchParams.set("brand", brandFilter);
          if (typeFilter !== "all") url.searchParams.set("type", typeFilter);
          if (modelFilter.trim()) url.searchParams.set("model", modelFilter.trim());
          if (subRegionId) url.searchParams.set("sub_region_id", subRegionId);
          else if (regionId) url.searchParams.set("region_id", regionId);
          if (locationLabel && locationLabel !== "All Nigeria") url.searchParams.set("location", locationLabel);
          if (minPrice) url.searchParams.set("min_price", minPrice);
          if (maxPrice) url.searchParams.set("max_price", maxPrice);
          if (conditionFilter !== "all") url.searchParams.set("condition", conditionFilter);
          if (jiTrustOnly) url.searchParams.set("ji_trust", "1");
          if (sortBy !== "newest") url.searchParams.set("sort", sortBy);

          const res = await fetch(url.toString(), { signal: controller.signal });
          if (!res.ok || currentSeq !== seqRef.current) return;
          const data = await res.json();
          if (currentSeq !== seqRef.current) return;
          const fetched = data.ads || [];
          setAds(fetched);
          setTotalCount(typeof data.total === "number" ? data.total : fetched.length);
          setPage(2);
          setHasMoreAds(fetched.length >= 24);
        } catch (err: any) {
          if (err?.name !== "AbortError") {
            console.error("Category feed error:", err);
          }
        } finally {
          if (currentSeq === seqRef.current) {
            setLoadingFeed(false);
          }
        }
      } else {
        setLoadingMore(true);
        try {
          const url = new URL(API_URL + "/ads");
          url.searchParams.set("page", String(pageNum));
          url.searchParams.set("limit", "24");
          url.searchParams.set("category", String(activeCategory.id));
          if (activeSubcategory) url.searchParams.set("subcategory", activeSubcategory);
          if (selectedSubSubcategory) url.searchParams.set("sub_subcategory", selectedSubSubcategory);
          if (searchQuery) url.searchParams.set("search", searchQuery);
          if (brandFilter !== "all") url.searchParams.set("brand", brandFilter);
          if (typeFilter !== "all") url.searchParams.set("type", typeFilter);
          if (modelFilter.trim()) url.searchParams.set("model", modelFilter.trim());
          if (subRegionId) url.searchParams.set("sub_region_id", subRegionId);
          else if (regionId) url.searchParams.set("region_id", regionId);
          if (locationLabel && locationLabel !== "All Nigeria") url.searchParams.set("location", locationLabel);
          if (minPrice) url.searchParams.set("min_price", minPrice);
          if (maxPrice) url.searchParams.set("max_price", maxPrice);
          if (conditionFilter !== "all") url.searchParams.set("condition", conditionFilter);
          if (jiTrustOnly) url.searchParams.set("ji_trust", "1");
          if (sortBy !== "newest") url.searchParams.set("sort", sortBy);

          const res = await fetch(url.toString());
          if (res.ok) {
            const data = await res.json();
            const fetched = data.ads || [];
            setAds((prev) => [...prev, ...fetched]);
            setPage(pageNum + 1);
            setHasMoreAds(fetched.length >= 24);
          }
        } finally {
          setLoadingMore(false);
        }
      }
    },
    [
      activeCategory.id,
      activeSubcategory,
      selectedSubSubcategory,
      searchQuery,
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

  const hasRefinedFilters = Boolean(
    searchQuery ||
      selectedSubSubcategory ||
      hasLocationFilter ||
      minPrice ||
      maxPrice ||
      brandFilter !== "all" ||
      typeFilter !== "all" ||
      modelFilter.trim() ||
      conditionFilter !== "all" ||
      jiTrustOnly ||
      sortBy !== "newest"
  );

  useEffect(() => {
    if (!hasRefinedFilters) {
      setAds(initialAds);
      setTotalCount(initialTotal);
      setPage(2);
      setHasMoreAds(initialAds.length >= 24);
      return;
    }
    fetchCategoryAds(1, true);
  }, [hasRefinedFilters, initialAds, initialTotal, fetchCategoryAds]);

  // Compute live facet counts from loaded ads for Jiji-style sidebar numbers
  const facetStats = useMemo(() => {
    const subCounts: Record<string, number> = {};
    const brandCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    const conditionCounts: Record<string, number> = {};
    const priceCounts: Record<string, number> = {};
    let trustCount = 0;

    for (const ad of ads) {
      if (ad.ji_trust_enabled) trustCount++;
      if (ad.subcategory) {
        const k = String(ad.subcategory).toLowerCase();
        subCounts[k] = (subCounts[k] || 0) + 1;
      }
      const adBrand = String(ad.brand || "").toLowerCase();
      const adTitle = String(ad.title || "").toLowerCase();
      for (const b of specConfig.brands) {
        const bLow = b.name.toLowerCase();
        if (adBrand.includes(bLow) || adTitle.includes(bLow)) {
          brandCounts[b.name] = (brandCounts[b.name] || 0) + 1;
        }
      }
      const adType = String(ad.type || "").toLowerCase();
      for (const t of specConfig.types) {
        const tLow = t.toLowerCase();
        if (adType.includes(tLow) || adTitle.includes(tLow)) {
          typeCounts[t] = (typeCounts[t] || 0) + 1;
        }
      }
      const adCond = String(ad.condition || "").toLowerCase();
      for (const c of specConfig.conditions) {
        if (adCond.includes(c.toLowerCase())) {
          conditionCounts[c] = (conditionCounts[c] || 0) + 1;
        }
      }
      const p = Number(ad.price) || 0;
      for (const pr of SIDEBAR_PRICE_PRESETS) {
        const minOk = !pr.min || p >= Number(pr.min);
        const maxOk = !pr.max || p <= Number(pr.max);
        if (minOk && maxOk) {
          priceCounts[pr.id] = (priceCounts[pr.id] || 0) + 1;
        }
      }
    }

    return { subCounts, brandCounts, typeCounts, conditionCounts, priceCounts, trustCount };
  }, [ads, specConfig]);

  const visibleAds = useMemo(() => {
    const filtered = ads.filter((a) => {
      if (a.status === "Unavailable" || a.status === "unavailable") return false;
      const numericPrice = Number(a.price) || 0;
      if (minPrice && numericPrice < Number(minPrice)) return false;
      if (maxPrice && numericPrice > Number(maxPrice)) return false;
      if (jiTrustOnly && !a.ji_trust_enabled) return false;
      if (conditionFilter !== "all") {
        const adCond = (a.condition || "").toLowerCase();
        if (!adCond.includes(conditionFilter.toLowerCase())) return false;
      }
      if (brandFilter !== "all") {
        const adBrand = (a.brand || "").toLowerCase();
        const titleLow = (a.title || "").toLowerCase();
        if (!adBrand.includes(brandFilter.toLowerCase()) && !titleLow.includes(brandFilter.toLowerCase())) {
          return false;
        }
      }
      if (typeFilter !== "all") {
        const adType = (a.type || "").toLowerCase();
        const titleLow = (a.title || "").toLowerCase();
        if (!adType.includes(typeFilter.toLowerCase()) && !titleLow.includes(typeFilter.toLowerCase())) {
          return false;
        }
      }
      if (modelFilter.trim()) {
        const qModel = modelFilter.trim().toLowerCase();
        const adModel = (a.attributes?.model || "").toLowerCase();
        const titleLow = (a.title || "").toLowerCase();
        if (!adModel.includes(qModel) && !titleLow.includes(qModel)) return false;
      }
      return true;
    });

    if (sortBy === "price_asc") {
      return [...filtered].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    }
    if (sortBy === "price_desc") {
      return [...filtered].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }
    return filtered;
  }, [ads, minPrice, maxPrice, conditionFilter, jiTrustOnly, brandFilter, typeFilter, modelFilter, sortBy]);

  const selectedBrandObj = useMemo(
    () => specConfig.brands.find((b) => b.name.toLowerCase() === brandFilter.toLowerCase()) || null,
    [specConfig, brandFilter]
  );

  const filteredSidebarBrands = useMemo(() => {
    const q = brandSearch.trim().toLowerCase();
    if (!q) return specConfig.brands;
    return specConfig.brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [specConfig.brands, brandSearch]);

  const resetAllFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setDraftMinPrice("");
    setDraftMaxPrice("");
    setBrandFilter("all");
    setModelFilter("");
    setTypeFilter("all");
    setConditionFilter("all");
    setJiTrustOnly(false);
    setSortBy("newest");
    setInlineSearch("");
    router.replace(getCategoryPath(activeCategory, activeSubcategory));
  };

  const handleSaveSearchAlert = async () => {
    const token = localStorage.getItem("ji_token");
    if (!token) {
      router.push("/login");
      return;
    }
    setSavingAlert(true);
    try {
      const res = await fetch(API_URL + "/users/saved-searches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          query: searchQuery || activeSubcategory || activeCategory.name,
          category_id: activeCategory.id,
          subcategory: activeSubcategory || null,
          location: locationLabel !== "All Nigeria" ? locationLabel : null,
          max_price: maxPrice || null,
          email_enabled: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAlertSavedToast(data.message || "Alert saved! We will notify you when new matching ads drop.");
        setTimeout(() => setAlertSavedToast(""), 4500);
      }
    } finally {
      setSavingAlert(false);
    }
  };

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
      fetch(API_URL + "/users/wishlist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ ad_id: Number(adId) }),
      }).catch(() => {});
    }
  };

  const visibleSubList = showAllSubs ? categoryTree : categoryTree.slice(0, 7);
  const pageHeadingTitle = searchQuery
    ? 'Search results for "' + searchQuery + '" in ' + (activeSubcategory || activeCategory.name)
    : (activeSubcategory || activeCategory.name) + " in " + locationLabel;

  const renderLeftSidebarPanels = () => (
    <div className="space-y-3.5">
      {/* 1. Categories & Subcategories Panel (Jiji-Style) */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
        <div className="bg-brand-orange text-white px-4 py-2.5 flex items-center justify-between">
          <span className="font-black text-xs uppercase tracking-wider">Categories</span>
          <Link href="/" className="text-[11px] font-bold text-white/90 hover:text-white underline">
            All Categories
          </Link>
        </div>
        <div className="p-3.5 space-y-2">
          <Link
            href={getCategoryPath(activeCategory)}
            className={
              "flex items-center gap-2 text-xs font-black transition " +
              (!activeSubcategory
                ? "text-brand-orange"
                : "text-gray-900 dark:text-neutral-100 hover:text-brand-orange")
            }
          >
            <img
              src={categoryVisual.image}
              alt={activeCategory.name}
              className="w-6 h-6 rounded object-cover border border-gray-200"
            />
            <span className="truncate">{activeCategory.name}</span>
          </Link>

          {categoryTree.length > 0 && (
            <ul className="pl-3 border-l-2 border-orange-100 dark:border-neutral-800 space-y-1.5 pt-1">
              {visibleSubList.map((node) => {
                const isCurrentSub =
                  slugifyCategoryName(node.name) === slugifyCategoryName(activeSubcategory);
                const count = facetStats.subCounts[node.name.toLowerCase()];
                return (
                  <li key={node.name}>
                    <Link
                      href={getCategoryPath(activeCategory, node.name)}
                      className={
                        "flex items-center justify-between text-xs py-0.5 transition " +
                        (isCurrentSub
                          ? "font-black text-brand-orange"
                          : "font-medium text-gray-600 dark:text-neutral-300 hover:text-brand-orange")
                      }
                    >
                      <span className="truncate pr-2">{node.name}</span>
                      {typeof count === "number" && count > 0 && (
                        <span className="text-[11px] text-gray-400 font-semibold shrink-0">
                          {count}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {categoryTree.length > 7 && (
            <button
              type="button"
              onClick={() => setShowAllSubs((v) => !v)}
              className="text-[11px] font-bold text-brand-orange hover:underline pt-1"
            >
              {showAllSubs ? "Show less" : "Show all " + categoryTree.length}
            </button>
          )}
        </div>
      </div>

      {/* 2. Location Panel */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-3.5 shadow-2xs">
        <button
          type="button"
          onClick={() => setShowLocationModal(true)}
          className="w-full flex items-center justify-between text-left group"
        >
          <div>
            <span className="block text-xs font-black text-gray-900 dark:text-neutral-100">
              Location
            </span>
            <span className="block text-xs font-semibold text-gray-500 group-hover:text-brand-orange mt-0.5 truncate max-w-[200px]">
              {locationLabel}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-orange" />
        </button>
        {hasLocationFilter && (
          <button
            type="button"
            onClick={() => updateCurrentRouteParams({ region_id: "", sub_region_id: "", location: "" })}
            className="mt-2 text-[11px] font-bold text-brand-orange hover:underline"
          >
            Reset to All Nigeria
          </button>
        )}
      </div>

      {/* 3. Price, ₦ Panel (Min/Max Inputs + Radio Presets with Live Counts) */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-3.5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-gray-900 dark:text-neutral-100">Price, ₦</span>
          {(minPrice || maxPrice) && (
            <button
              type="button"
              onClick={() => {
                setMinPrice("");
                setMaxPrice("");
                setDraftMinPrice("");
                setDraftMaxPrice("");
              }}
              className="text-[10px] font-extrabold uppercase text-gray-400 hover:text-brand-orange"
            >
              CLEAR
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            value={draftMinPrice}
            onChange={(e) => setDraftMinPrice(e.target.value)}
            placeholder="min"
            className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-xs outline-none focus:border-brand-orange"
          />
          <span className="text-gray-400 text-xs">–</span>
          <input
            type="number"
            value={draftMaxPrice}
            onChange={(e) => setDraftMaxPrice(e.target.value)}
            placeholder="max"
            className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-xs outline-none focus:border-brand-orange"
          />
        </div>

        <div className="space-y-1.5 pt-0.5">
          {SIDEBAR_PRICE_PRESETS.map((pr) => {
            const checked = minPrice === pr.min && maxPrice === pr.max;
            const count = facetStats.priceCounts[pr.id] || 0;
            return (
              <label
                key={pr.id}
                onClick={() => {
                  if (checked) {
                    setMinPrice("");
                    setMaxPrice("");
                    setDraftMinPrice("");
                    setDraftMaxPrice("");
                  } else {
                    setMinPrice(pr.min);
                    setMaxPrice(pr.max);
                    setDraftMinPrice(pr.min);
                    setDraftMaxPrice(pr.max);
                  }
                }}
                className="flex items-center justify-between text-xs cursor-pointer py-0.5 group"
              >
                <span className="flex items-center gap-2 text-gray-700 dark:text-neutral-200 group-hover:text-brand-orange">
                  <span
                    className={
                      "w-3.5 h-3.5 rounded-full border flex items-center justify-center " +
                      (checked ? "border-brand-orange" : "border-gray-300")
                    }
                  >
                    {checked && <span className="w-2 h-2 rounded-full bg-brand-orange" />}
                  </span>
                  <span className={checked ? "font-bold text-brand-orange" : ""}>{pr.label}</span>
                </span>
                <span className="text-[11px] text-gray-400">• {count} ads</span>
              </label>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => {
              setMinPrice("");
              setMaxPrice("");
              setDraftMinPrice("");
              setDraftMaxPrice("");
            }}
            className="text-[11px] font-bold text-gray-400 hover:text-gray-700 uppercase"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              setMinPrice(draftMinPrice);
              setMaxPrice(draftMaxPrice);
            }}
            className="text-[11px] font-black text-brand-orange hover:underline uppercase"
          >
            Apply
          </button>
        </div>
      </div>

      {/* 4. JI Trust Escrow Filter Panel */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-3.5 shadow-2xs space-y-2">
        <span className="block text-xs font-black text-gray-900 dark:text-neutral-100">
          Buyer Protection
        </span>
        <label className="flex items-center justify-between text-xs cursor-pointer py-0.5">
          <span className="flex items-center gap-2 font-semibold text-gray-700 dark:text-neutral-200">
            <input
              type="checkbox"
              checked={jiTrustOnly}
              onChange={(e) => setJiTrustOnly(e.target.checked)}
              className="accent-emerald-600 rounded"
            />
            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> JI Trust Escrow
            </span>
          </span>
          <span className="text-[11px] text-gray-400">• {facetStats.trustCount}</span>
        </label>
      </div>

      {/* 5. Brand / Make Panel (Jiji-Style Search + Radio List) */}
      {specConfig.brands.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-3.5 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-900 dark:text-neutral-100">
              {activeCategory.name.toLowerCase().includes("vehicle") ? "Make / Brand" : "Brand"}
            </span>
            {brandFilter !== "all" && (
              <button
                type="button"
                onClick={() => {
                  setBrandFilter("all");
                  setModelFilter("");
                }}
                className="text-[10px] font-bold text-brand-orange hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              placeholder="Find Brand"
              className="w-full pl-8 pr-2.5 py-1.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-xs outline-none focus:border-brand-orange"
            />
          </div>

          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            <label
              onClick={() => {
                setBrandFilter("all");
                setModelFilter("");
              }}
              className="flex items-center gap-2 text-xs cursor-pointer py-0.5"
            >
              <span
                className={
                  "w-3.5 h-3.5 rounded-full border flex items-center justify-center " +
                  (brandFilter === "all" ? "border-brand-orange" : "border-gray-300")
                }
              >
                {brandFilter === "all" && <span className="w-2 h-2 rounded-full bg-brand-orange" />}
              </span>
              <span className={brandFilter === "all" ? "font-bold text-gray-900 dark:text-white" : "text-gray-600"}>
                Show all
              </span>
            </label>

            {filteredSidebarBrands.map((b) => {
              const isSelected = brandFilter.toLowerCase() === b.name.toLowerCase();
              const count = facetStats.brandCounts[b.name] || 0;
              return (
                <label
                  key={b.name}
                  onClick={() => {
                    setBrandFilter(isSelected ? "all" : b.name);
                    setModelFilter("");
                  }}
                  className="flex items-center justify-between text-xs cursor-pointer py-0.5 group"
                >
                  <span className="flex items-center gap-2 text-gray-700 dark:text-neutral-200 group-hover:text-brand-orange">
                    <span
                      className={
                        "w-3.5 h-3.5 rounded-full border flex items-center justify-center " +
                        (isSelected ? "border-brand-orange" : "border-gray-300")
                      }
                    >
                      {isSelected && <span className="w-2 h-2 rounded-full bg-brand-orange" />}
                    </span>
                    <span className={isSelected ? "font-bold text-brand-orange" : ""}>{b.name}</span>
                  </span>
                  <span className="text-[11px] text-gray-400">• {count}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Model Panel (appears when a Brand is selected) */}
      {selectedBrandObj && selectedBrandObj.models.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-900 dark:text-neutral-100">
              {selectedBrandObj.name} Model
            </span>
            {modelFilter && (
              <button
                type="button"
                onClick={() => setModelFilter("")}
                className="text-[10px] font-bold text-brand-orange hover:underline"
              >
                All Models
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-44 overflow-y-auto">
            {selectedBrandObj.models.map((m) => {
              const active = modelFilter.toLowerCase() === m.toLowerCase();
              return (
                <label
                  key={m}
                  onClick={() => setModelFilter(active ? "" : m)}
                  className="flex items-center gap-2 text-xs cursor-pointer py-0.5 text-gray-700 dark:text-neutral-200 hover:text-brand-orange"
                >
                  <span
                    className={
                      "w-3.5 h-3.5 rounded-full border flex items-center justify-center " +
                      (active ? "border-brand-orange" : "border-gray-300")
                    }
                  >
                    {active && <span className="w-2 h-2 rounded-full bg-brand-orange" />}
                  </span>
                  <span className={active ? "font-bold text-brand-orange" : ""}>{m}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Type / Style Panel */}
      {specConfig.types.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-900 dark:text-neutral-100">Type</span>
            {typeFilter !== "all" && (
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className="text-[10px] font-bold text-brand-orange hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {specConfig.types.map((t) => {
              const checked = typeFilter.toLowerCase() === t.toLowerCase();
              const count = facetStats.typeCounts[t] || 0;
              return (
                <label
                  key={t}
                  className="flex items-center justify-between text-xs cursor-pointer py-0.5 text-gray-700 dark:text-neutral-200 hover:text-brand-orange"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setTypeFilter(checked ? "all" : t)}
                      className="accent-brand-orange rounded"
                    />
                    <span className={checked ? "font-bold text-brand-orange" : ""}>{t}</span>
                  </span>
                  <span className="text-[11px] text-gray-400">• {count}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. Condition Panel */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-3.5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-gray-900 dark:text-neutral-100">Condition</span>
          {conditionFilter !== "all" && (
            <button
              type="button"
              onClick={() => setConditionFilter("all")}
              className="text-[10px] font-bold text-brand-orange hover:underline"
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1.5">
          {specConfig.conditions.map((c) => {
            const checked = conditionFilter.toLowerCase() === c.toLowerCase();
            const count = facetStats.conditionCounts[c] || 0;
            return (
              <label
                key={c}
                className="flex items-center justify-between text-xs cursor-pointer py-0.5 text-gray-700 dark:text-neutral-200 hover:text-brand-orange"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => setConditionFilter(checked ? "all" : c)}
                    className="accent-brand-orange rounded"
                  />
                  <span className={checked ? "font-bold text-brand-orange" : ""}>{c}</span>
                </span>
                <span className="text-[11px] text-gray-400">• {count}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pb-12">
      {/* Breadcrumbs Bar (Jiji-Style) */}
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
        <Link href="/" className="font-bold text-gray-600 hover:text-brand-orange">
          ji.africa
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <Link
          href={getCategoryPath(activeCategory)}
          className={
            !activeSubcategory
              ? "font-black text-gray-900 dark:text-white"
              : "font-bold text-gray-600 hover:text-brand-orange"
          }
        >
          {activeCategory.name}
        </Link>
        {activeSubcategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-black text-gray-900 dark:text-white">{activeSubcategory}</span>
          </>
        )}
        <span className="ml-2 px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-[11px] font-bold text-gray-600">
          {visibleAds.length} {visibleAds.length === 1 ? "result" : "results"} in {locationLabel}
        </span>
      </nav>

      {alertSavedToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{alertSavedToast}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Desktop Left Filter Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 sticky top-20">
          {renderLeftSidebarPanels()}
        </aside>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0 space-y-4 w-full">
          {/* Category H1 Header + Quick Price Chips + Visual Brand Cards */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {pageHeadingTitle}
              </h1>
              <button
                type="button"
                disabled={savingAlert}
                onClick={handleSaveSearchAlert}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-brand-orange border border-orange-200 text-xs font-extrabold transition"
              >
                <BellPlus className="w-3.5 h-3.5" />
                <span>{savingAlert ? "Saving..." : "Save Search Alert"}</span>
              </button>
            </div>

            {/* Jiji-Style Horizontal Price Range Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {SIDEBAR_PRICE_PRESETS.map((pr) => {
                const active = minPrice === pr.min && maxPrice === pr.max;
                return (
                  <button
                    key={pr.id}
                    type="button"
                    onClick={() => {
                      if (active) {
                        setMinPrice("");
                        setMaxPrice("");
                        setDraftMinPrice("");
                        setDraftMaxPrice("");
                      } else {
                        setMinPrice(pr.min);
                        setMaxPrice(pr.max);
                        setDraftMinPrice(pr.min);
                        setDraftMaxPrice(pr.max);
                      }
                    }}
                    className={
                      "px-4 py-2 rounded-xl text-xs font-extrabold border transition shrink-0 " +
                      (active
                        ? "bg-brand-orange text-white border-brand-orange shadow-xs"
                        : "bg-gray-50 dark:bg-neutral-800 text-gray-800 dark:text-neutral-200 border-gray-200 dark:border-neutral-700 hover:border-brand-orange")
                    }
                  >
                    {pr.label}
                  </button>
                );
              })}
            </div>

            {/* Visual Brand Cards Strip */}
            {specConfig.brands.length > 0 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {specConfig.brands.map((b) => {
                  const isBrandActive = brandFilter.toLowerCase() === b.name.toLowerCase();
                  return (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => {
                        setBrandFilter(isBrandActive ? "all" : b.name);
                        setModelFilter("");
                      }}
                      className={
                        "flex flex-col items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border transition shrink-0 min-w-[82px] " +
                        (isBrandActive
                          ? "border-brand-orange bg-orange-50 dark:bg-brand-orange/15 shadow-xs"
                          : "border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-brand-orange")
                      }
                    >
                      <span
                        className={
                          "w-8 h-8 rounded-full " +
                          b.bg +
                          " " +
                          b.text +
                          " flex items-center justify-center font-black text-[10px] tracking-tight shadow-xs"
                        }
                      >
                        {b.code}
                      </span>
                      <span
                        className={
                          "text-[11px] font-bold truncate max-w-[74px] " +
                          (isBrandActive ? "text-brand-orange" : "text-gray-700 dark:text-neutral-200")
                        }
                      >
                        {b.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Deeper Level-3 Subcategory Pills if inside a Subcategory */}
            {activeSubNode && activeSubNode.children && activeSubNode.children.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-1 border-t border-gray-100 dark:border-neutral-800 [&::-webkit-scrollbar]:hidden">
                <span className="text-[10px] font-black uppercase text-gray-400 shrink-0">
                  Refine:
                </span>
                {activeSubNode.children.map((l3: any) => {
                  const active = selectedSubSubcategory.toLowerCase() === l3.name.toLowerCase();
                  return (
                    <button
                      key={l3.name}
                      type="button"
                      onClick={() =>
                        updateCurrentRouteParams({
                          sub_subcategory: active ? "" : l3.name,
                        })
                      }
                      className={
                        "px-3 py-1 rounded-full text-xs font-bold border transition shrink-0 " +
                        (active
                          ? "bg-brand-orange text-white border-brand-orange"
                          : "bg-gray-100 text-gray-700 border-gray-200 hover:border-brand-orange")
                      }
                    >
                      {l3.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* In-Category Search, Sort & Mobile Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white dark:bg-neutral-900 p-3 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-2xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateCurrentRouteParams({ search: inlineSearch.trim() });
              }}
              className="flex-1 min-w-[200px] relative"
            >
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inlineSearch}
                onChange={(e) => setInlineSearch(e.target.value)}
                placeholder={"Search in " + (activeSubcategory || activeCategory.name) + "..."}
                className="w-full pl-8 pr-16 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-xs outline-none focus:border-brand-orange"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-2.5 bg-brand-orange text-white rounded text-[11px] font-bold"
              >
                Go
              </button>
            </form>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 text-brand-orange border border-orange-200 text-xs font-extrabold"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-xs font-bold text-gray-700 dark:text-neutral-200 outline-none focus:border-brand-orange"
              >
                <option value="newest">Sort: Recommended</option>
                <option value="price_asc">Price: Lowest First</option>
                <option value="price_desc">Price: Highest First</option>
              </select>

              <button
                type="button"
                onClick={() => setViewMode((m) => (m === "grid" ? "list" : "grid"))}
                className="p-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-gray-600 hover:text-brand-orange"
                title="Switch Grid / List View"
              >
                {viewMode === "grid" ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Active Filter Pills */}
          {hasRefinedFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {searchQuery && (
                <span className="inline-flex items-center gap-1 bg-orange-50 text-brand-orange border border-orange-200 px-2.5 py-1 rounded-full text-xs font-bold">
                  &ldquo;{searchQuery}&rdquo;
                  <button type="button" onClick={() => updateCurrentRouteParams({ search: "" })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {brandFilter !== "all" && (
                <span className="inline-flex items-center gap-1 bg-orange-50 text-brand-orange border border-orange-200 px-2.5 py-1 rounded-full text-xs font-bold">
                  Brand: {brandFilter}
                  <button
                    type="button"
                    onClick={() => {
                      setBrandFilter("all");
                      setModelFilter("");
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {modelFilter && (
                <span className="inline-flex items-center gap-1 bg-orange-50 text-brand-orange border border-orange-200 px-2.5 py-1 rounded-full text-xs font-bold">
                  Model: {modelFilter}
                  <button type="button" onClick={() => setModelFilter("")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-1 bg-orange-50 text-brand-orange border border-orange-200 px-2.5 py-1 rounded-full text-xs font-bold">
                  ₦{minPrice ? Number(minPrice).toLocaleString("en-NG") : "0"} –{" "}
                  {maxPrice ? "₦" + Number(maxPrice).toLocaleString("en-NG") : "Any"}
                  <button
                    type="button"
                    onClick={() => {
                      setMinPrice("");
                      setMaxPrice("");
                      setDraftMinPrice("");
                      setDraftMaxPrice("");
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs font-bold text-gray-500 hover:text-brand-orange underline"
              >
                Reset all filters
              </button>
            </div>
          )}

          {/* Listings Grid / List */}
          {loadingFeed ? (
            <div className="bg-white p-14 rounded-2xl border border-gray-200 flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-brand-orange" />
            </div>
          ) : visibleAds.length > 0 ? (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {visibleAds.map((ad: any) => (
                    <ProductCard key={ad.id} ad={ad} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {visibleAds.map((ad: any) => (
                    <Link
                      key={ad.id}
                      href={getAdPath(ad)}
                      className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg hover:border-brand-orange transition flex flex-row group relative h-32 md:h-40"
                    >
                      <button
                        type="button"
                        onClick={(e) => handleToggleListWishlist(e, ad.id)}
                        className="absolute top-3 right-3 p-1.5 bg-white/80 rounded-full shadow-sm z-10"
                      >
                        <Heart
                          className={
                            "w-4 h-4 " +
                            (wishlistIds.includes(String(ad.id))
                              ? "fill-brand-orange text-brand-orange"
                              : "text-gray-500")
                          }
                        />
                      </button>
                      <div className="w-32 md:w-48 bg-gray-100 overflow-hidden shrink-0">
                        <img
                          src={getAdImage(ad)}
                          alt={ad.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      </div>
                      <div className="p-3 md:p-4 flex flex-col flex-1 min-w-0 pr-10">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                          <h3 className="font-bold text-gray-800 text-sm md:text-base line-clamp-1 flex items-center gap-1.5">
                            {ad.title}
                            {ad.seller_verified && <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />}
                          </h3>
                          <p className="text-brand-orange font-black text-base md:text-lg shrink-0">
                            ₦{Number(ad.price).toLocaleString("en-NG")}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1 hidden md:block mb-auto">
                          {ad.description}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-100">
                          <span className="flex items-center gap-1 font-semibold">
                            <MapPin className="w-3.5 h-3.5 text-brand-orange" /> {ad.shop_address || "Nigeria"}
                          </span>
                          <span className="bg-gray-100 px-2 py-0.5 rounded">{ad.condition || "Used"}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {hasMoreAds && (
                <div className="pt-4 text-center">
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={() => fetchCategoryAds(page, false)}
                    className="bg-white border border-gray-200 hover:border-brand-orange text-brand-orange font-bold px-8 py-3 rounded-full text-sm shadow-xs transition inline-flex items-center gap-2"
                  >
                    {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loadingMore ? "Loading..." : "Load More Ads"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3">
              <p className="font-bold text-gray-800 text-sm">
                No adverts found in {activeSubcategory || activeCategory.name} with the selected filters.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {hasRefinedFilters && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800"
                  >
                    Reset Filters
                  </button>
                )}
                <Link
                  href="/sell"
                  className="px-4 py-2 rounded-xl bg-brand-orange text-white text-xs font-black"
                >
                  + Post First Ad Here
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-black/60 flex justify-end"
          onClick={() => setMobileFiltersOpen(false)}
        >
          <div
            className="w-full max-w-xs bg-gray-50 h-full overflow-y-auto p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <span className="font-black text-sm text-gray-900">Filter Listings</span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1.5 rounded-full bg-gray-200 text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderLeftSidebarPanels()}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full py-3 rounded-xl bg-brand-orange text-white text-xs font-black"
            >
              Show {visibleAds.length} Results
            </button>
          </div>
        </div>
      )}

      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelectLocation={({ regionId: rId, subRegionId: srId, label }) => {
          updateCurrentRouteParams({
            region_id: rId,
            sub_region_id: srId,
            location: label,
          });
        }}
      />
    </div>
  );
}
