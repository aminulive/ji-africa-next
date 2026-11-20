import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import CategoryPageClient from "../../../components/CategoryPageClient";
import {
  extractCategoryTree,
  getCategoryPath,
  resolveCategoryFromSlug,
  resolveSubcategoryFromSlug,
  slugifyCategoryName,
} from "../../../lib/categoryUrl";

const API_URL = "https://ji-africa-backend.onrender.com/api";
const SITE_URL = "https://www.ji.africa";

type Props = {
  params: Promise<{ slug: string; subslug: string }>;
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
  const pairs: { slug: string; subslug: string }[] = [];
  if (Array.isArray(categories)) {
    for (const cat of categories) {
      const slug = slugifyCategoryName(cat.name);
      if (!slug) continue;
      for (const sub of extractCategoryTree(cat)) {
        const subslug = slugifyCategoryName(sub.name);
        if (subslug) pairs.push({ slug, subslug });
      }
    }
  }
  return pairs.length > 0 ? pairs : [{ slug: "vehicles", subslug: "cars" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, subslug } = await params;
  const categories = await fetchCategories();
  const category = resolveCategoryFromSlug(categories, slug);
  if (!category) {
    return { title: "Category Not Found | ji.africa" };
  }
  const subName = resolveSubcategoryFromSlug(category, subslug);
  const title = subName + " in Nigeria (" + category.name + ") — Latest Prices | ji.africa";
  const description =
    "Compare prices and buy verified " +
    subName +
    " in Nigeria on ji.africa. Safe escrow checkout with JI Trust.";
  const canonical = SITE_URL + getCategoryPath(category, subName);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName: "ji.africa", type: "website" },
  };
}

async function SubcategoryContent({ params }: Props) {
  const { slug, subslug } = await params;
  const categories = await fetchCategories();
  const category = resolveCategoryFromSlug(categories, slug);
  if (!category) notFound();
  const subName = resolveSubcategoryFromSlug(category, subslug);

  let initialAds: any[] = [];
  let initialTotal = 0;
  try {
    const url =
      API_URL +
      "/ads?category=" +
      encodeURIComponent(String(category.id)) +
      "&subcategory=" +
      encodeURIComponent(subName) +
      "&page=1&limit=24";
    const res = await fetch(url, { next: { revalidate: 60 } });
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
      activeSubcategory={subName}
      initialAds={initialAds}
      initialTotal={initialTotal}
    />
  );
}

export default function SubcategoryPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        </div>
      }
    >
      <SubcategoryContent params={params} />
    </Suspense>
  );
}
