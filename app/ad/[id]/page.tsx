import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import AdDetailsClient from "../../components/AdDetailsClient";

const API_URL = "https://ji-africa-backend.onrender.com/api";

function resolvePrimaryImage(rawImg: any): string {
  const fallback = "https://www.ji.africa/icon?v=3";
  if (!rawImg) return fallback;
  try {
    const parsed = JSON.parse(rawImg);
    const first = Array.isArray(parsed) ? parsed[0] : rawImg;
    if (!first) return fallback;
    const full = first.startsWith("http") ? first : `https://ji-africa-backend.onrender.com${first}`;
    if (full.includes("res.cloudinary.com/") && full.includes("/upload/") && !full.includes("/upload/w_")) {
      return full.replace("/upload/", "/upload/w_800,c_limit,q_auto:good,f_jpg/");
    }
    return full;
  } catch {
    if (typeof rawImg === "string" && rawImg.startsWith("http")) return rawImg;
    return fallback;
  }
}

async function fetchSingleAd(id: string) {
  try {
    const singleRes = await fetch(`${API_URL}/ads/${id}`, {
      next: { revalidate: 60 },
    }).catch(() => null);

    if (singleRes && singleRes.ok) {
      const singleData = await singleRes.json();
      if (singleData?.ad || singleData?.id) {
        return singleData.ad || singleData;
      }
    }

    const listRes = await fetch(`${API_URL}/ads?page=1&limit=50`, {
      next: { revalidate: 60 },
    }).catch(() => null);
    if (listRes && listRes.ok) {
      const listData = await listRes.json();
      return (listData.ads || []).find((a: any) => String(a.id) === String(id)) || null;
    }
  } catch (err) {
    console.error("fetchSingleAd error:", err);
  }
  return null;
}

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_URL}/ads?page=1&limit=30`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [{ id: "1" }];
    const data = await res.json();
    const list = Array.isArray(data?.ads) ? data.ads : [];
    if (list.length === 0) return [{ id: "1" }];
    return list.map((ad: any) => ({ id: String(ad.id) }));
  } catch {
    return [{ id: "1" }];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const ad = await fetchSingleAd(id);

  if (!ad) {
    return {
      title: "Listing Not Found | ji.africa",
      description: "Buy & Sell Clean Used Items Anywhere in Nigeria on ji.africa",
    };
  }

  const formattedPrice = `₦${Number(ad.price || 0).toLocaleString("en-NG")}`;
  const location = ad.shop_address || "Nigeria";
  const title = `${ad.title} — ${formattedPrice} in ${location} | ji.africa`;
  const specSummary = [ad.condition, ad.brand, ad.attributes?.model, ad.type]
    .filter(Boolean)
    .join(" • ");
  const description = [specSummary, ad.description]
    .filter(Boolean)
    .join(" — ")
    .slice(0, 180);
  const imageUrl = resolvePrimaryImage(ad.image);
  const canonicalUrl = `https://www.ji.africa/ad/${ad.id}`;

  return {
    title,
    description: description || `Buy ${ad.title} for ${formattedPrice} on ji.africa`,
    openGraph: {
      title,
      description: description || `Available in ${location} on ji.africa`,
      siteName: "ji.africa",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: ad.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description || `Available in ${location} on ji.africa`,
      images: [imageUrl],
    },
  };
}

async function getAdAndSimilar(id: string) {
  try {
    const ad = await fetchSingleAd(id);
    if (!ad) return { ad: null, similarAds: [] };

    const catQuery = ad.category_id ? `&category=${ad.category_id}` : "";
    const similarRes = await fetch(`${API_URL}/ads?page=1&limit=20${catQuery}`, {
      next: { revalidate: 60 },
    }).catch(() => null);

    const similarJson = similarRes && similarRes.ok ? await similarRes.json() : { ads: [] };
    const candidates: any[] = similarJson.ads || [];

    const similarAds = candidates
      .filter(
        (a: any) =>
          String(a.id) !== String(ad.id) &&
          a.status !== "Unavailable" &&
          a.status !== "unavailable"
      )
      .map((a: any) => {
        let score = 1;
        if (String(a.category_id) === String(ad.category_id)) score += 10;
        if (a.subcategory && ad.subcategory && a.subcategory === ad.subcategory) score += 5;
        if (a.brand && ad.brand && a.brand.toLowerCase() === ad.brand.toLowerCase()) score += 4;
        if (String(a.region_id) === String(ad.region_id)) score += 4;
        return { ...a, score };
      })
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 4);

    return { ad, similarAds };
  } catch (error) {
    console.error("Failed to fetch ad details", error);
    return { ad: null, similarAds: [] };
  }
}

async function AdLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ad, similarAds } = await getAdAndSimilar(id);

  if (!ad) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500 font-bold">
          Ad not found or temporarily unavailable.
        </p>
      </div>
    );
  }

  return <AdDetailsClient ad={ad} similarAds={similarAds} />;
}

export default function AdDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        </div>
      }
    >
      <AdLoader params={params} />
    </Suspense>
  );
}
