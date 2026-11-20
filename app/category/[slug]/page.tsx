import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import CategoryPageClient from "../../components/CategoryPageClient";
import {
  getCategoryPath,
  resolveCategoryFromSlug,
  slugifyCategoryName,
} from "../../lib/categoryUrl";

const API_URL = "https://ji-africa-backend.onrender.com/api";
const SITE_URL = "https://www.ji.africa";

type Props = {
  params: Promise<{ slug: string }>;
};

async function fetchCategories() {
  try {
    const res = await fetch(API_URL + "/categories", { next: { revalidate: 120 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  const categories = await fetchCategories();
  const list = Array.isArray(categories)
    ? categories
        .map((c: any) => ({ slug: slugifyCategoryName(c.name) }))
        .filter((item) => Boolean(item.slug))
    : [];
  return list.length > 0 ? list : [{ slug: "vehicles" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categories = await fetchCategories();
  const category = resolveCategoryFromSlug(categories, slug);
  if (!category) {
    return { title: "Category Not Found | ji.africa" };
  }
  const title = category.name + " for Sale in Nigeria — Best Prices & Deals | ji.africa";
  const description =
    "Buy and sell verified " +
    category.name +
    " across Lagos, Abuja, Port Harcourt, Kano, and all of Nigeria with JI Trust escrow protection.";
  const canonical = SITE_URL + getCategoryPath(category);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName: "ji.africa", type: "website" },
  };
}

async function CategoryContent({ params }: Props) {
  const { slug } = await params;
  const categories = await fetchCategories();
  const category = resolveCategoryFromSlug(categories, slug);
  if (!category) notFound();

  let initialAds: any[] = [];
  let initialTotal = 0;
  try {
    const res = await fetch(
      API_URL + "/ads?category=" + encodeURIComponent(String(category.id)) + "&page=1&limit=24",
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      const data = await res.json();
      initialAds = data.ads || [];
      initialTotal = typeof data.total === "number" ? data.total : initialAds.length;
    }
  } catch {}

  return (
    <CategoryPageClient
      categories={categories}
      activeCategory={category}
      initialAds={initialAds}
      initialTotal={initialTotal}
    />
  );
}

export default function CategoryPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        </div>
      }
    >
      <CategoryContent params={params} />
    </Suspense>
  );
}
