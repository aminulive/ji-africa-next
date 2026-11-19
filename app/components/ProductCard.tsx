"use client";
import { recordRecentlyViewedAd } from "./RecentlyViewedStrip";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, MapPin, BadgeCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";

const API_URL = "https://ji-africa-backend.onrender.com/api";

function optimizeCardImg(url: string): string {
  if (!url) return url;
  if (url.includes("res.cloudinary.com") && url.includes("/upload/") && !url.includes("/upload/w_")) {
    return url.replace("/upload/", "/upload/w_500,c_fill,q_auto,f_auto/");
  }
  return url;
}

export default function ProductCard({ ad }: { ad: any }) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const syncWishlist = () => {
      try {
        const list = JSON.parse(localStorage.getItem("ji_wishlist") || "[]").map(String);
        setIsSaved(list.includes(String(ad.id)));
      } catch {
        setIsSaved(false);
      }
    };

    syncWishlist();
    window.addEventListener("ji_wishlist_updated", syncWishlist);
    return () => window.removeEventListener("ji_wishlist_updated", syncWishlist);
  }, [ad.id]);

  let imageUrl = "https://placehold.co/400x300/f8fafc/94a3b8?text=Ad";
  try {
    const images = JSON.parse(ad.image);
    const first = Array.isArray(images) ? images[0] : ad.image;
    if (first) {
      imageUrl =
        first.startsWith("http") || first.startsWith("data:")
          ? first
          : `https://ji-africa-backend.onrender.com${first}`;
    }
  } catch {
    if (typeof ad.image === "string" && ad.image.length > 0) {
      imageUrl =
        ad.image.startsWith("http") || ad.image.startsWith("data:")
          ? ad.image
          : `https://ji-africa-backend.onrender.com${ad.image}`;
    }
  }

  if (ad.status === "Unavailable" || ad.status === "unavailable") return null;

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const user = localStorage.getItem("ji_user");
    const token = localStorage.getItem("ji_token");
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      const current: string[] = JSON.parse(localStorage.getItem("ji_wishlist") || "[]").map(String);
      const strId = String(ad.id);
      const idx = current.indexOf(strId);

      if (idx > -1) {
        current.splice(idx, 1);
      } else {
        current.push(strId);
      }

      localStorage.setItem("ji_wishlist", JSON.stringify(current));
      setIsSaved(idx === -1);
      window.dispatchEvent(new Event("ji_wishlist_updated"));

      if (token) {
        fetch(`${API_URL}/users/wishlist/toggle`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ad_id: Number(ad.id) }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (Array.isArray(data?.wishlistIds)) {
              localStorage.setItem("ji_wishlist", JSON.stringify(data.wishlistIds));
              window.dispatchEvent(new Event("ji_wishlist_updated"));
            }
          })
          .catch(() => {});
      }
    } catch (err) {
      console.error("Wishlist update failed", err);
    }
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-brand-orange transition-all duration-200 flex flex-col group relative">
      <button
        type="button"
        onClick={handleToggleWishlist}
        className="absolute top-2 right-2 p-1.5 bg-white/85 backdrop-blur rounded-full shadow-sm hover:text-brand-orange transition z-10"
        title={isSaved ? "Remove from Saved Ads" : "Save Ad"}
      >
        <Heart
          className={`w-4 h-4 transition ${
            isSaved ? "fill-brand-orange text-brand-orange" : "text-gray-600"
          }`}
        />
      </button>

      <Link href={`/ad/${ad.id}`} prefetch={false} onClick={() => recordRecentlyViewedAd(ad)} className="flex flex-col h-full">
        <div className="relative aspect-[4/3] sm:aspect-square bg-gray-100 overflow-hidden">
          <img
            src={optimizeCardImg(imageUrl)}
            alt={ad.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
          {ad.is_vip && (
            <span className="absolute top-1.5 left-1.5 bg-amber-400 text-gray-950 font-black text-[9px] uppercase px-1.5 py-0.5 rounded shadow-sm z-10">
              {ad.vip_type}
            </span>
          )}
          {ad.ji_trust_enabled && (
            <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 bg-emerald-950/85 backdrop-blur-xs text-emerald-200 border border-emerald-400/40 text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm z-10">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-300" /> JI Trust
            </span>
          )}
        </div>
        <div className="p-2.5 flex flex-col flex-1">
          <h3 className="font-semibold text-gray-800 text-xs line-clamp-2 leading-snug mb-1">
            {ad.title}
            {ad.seller_verified && (
              <BadgeCheck className="inline-block w-3.5 h-3.5 text-blue-500 ml-1 align-text-bottom" />
            )}
          </h3>
          <p className="font-black text-brand-orange text-sm mt-auto">
            ₦{Number(ad.price).toLocaleString("en-NG")}
          </p>
          <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5 leading-tight">
            {ad.description}
          </p>
          <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center text-[10px] text-gray-500 font-medium">
            <span className="flex items-center gap-0.5 truncate">
              <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
              <span className="truncate">{ad.shop_address || "Nigeria"}</span>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
