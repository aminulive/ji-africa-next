"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, X } from "lucide-react";

const API_BASE = "https://ji-africa-backend.onrender.com";

export function recordRecentlyViewedAd(ad: any) {
  if (typeof window === "undefined" || !ad?.id) return;
  try {
    const existing = JSON.parse(localStorage.getItem("ji_recently_viewed") || "[]");
    const filtered = Array.isArray(existing)
      ? existing.filter((item: any) => String(item.id) !== String(ad.id))
      : [];
    let img = "";
    if (Array.isArray(ad.image) && ad.image[0]) img = ad.image[0];
    else if (typeof ad.image === "string") {
      try {
        const p = JSON.parse(ad.image);
        img = Array.isArray(p) && p[0] ? p[0] : ad.image;
      } catch {
        img = ad.image;
      }
    }
    if (img && !img.startsWith("http") && !img.startsWith("data:")) {
      img = `${API_BASE}${img}`;
    }
    const next = [
      {
        id: ad.id,
        title: ad.title,
        price: ad.price,
        image: img,
        location: ad.shop_address || "",
      },
      ...filtered,
    ].slice(0, 6);
    localStorage.setItem("ji_recently_viewed", JSON.stringify(next));
  } catch {}
}

export default function RecentlyViewedStrip() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ji_recently_viewed") || "[]");
      if (Array.isArray(saved) && saved.length > 0) {
        setItems(saved);
      }
    } catch {}
  }, []);

  if (items.length === 0) return null;

  const clearHistory = () => {
    localStorage.removeItem("ji_recently_viewed");
    setItems([]);
  };

  return (
    <section className="mb-5 bg-white rounded-xl border border-gray-200 p-3.5 shadow-2xs">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-brand-orange" /> Continue Where You Left Off
        </h2>
        <button
          type="button"
          onClick={clearHistory}
          className="text-[11px] font-semibold text-gray-500 hover:text-brand-orange inline-flex items-center gap-1"
        >
          <X className="w-3 h-3" /> Clear
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/ad/${item.id}`}
            className="w-44 shrink-0 rounded-lg border border-gray-200 hover:border-brand-orange p-2 flex items-center gap-2.5 transition bg-gray-50/50 hover:bg-orange-50/30"
          >
            <img
              src={item.image || "https://placehold.co/80x80?text=Ad"}
              alt={item.title}
              loading="lazy"
              className="w-11 h-11 rounded-md object-cover shrink-0 bg-gray-100"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-gray-900 truncate">{item.title}</p>
              <p className="text-[11px] font-black text-brand-orange">
                ₦{Number(item.price || 0).toLocaleString("en-NG")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
