import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import MarketplaceFeed from './components/MarketplaceFeed';
import LatestGuidesStrip from './components/LatestGuidesStrip';

async function getCategories() {
  try {
    const res = await fetch('https://ji-africa-backend.onrender.com/api/categories', {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getAds() {
  try {
    const res = await fetch('https://ji-africa-backend.onrender.com/api/ads?page=1&limit=20', {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.ads || [];
  } catch {
    return [];
  }
}

async function getLatestBlogPosts() {
  try {
    const res = await fetch('https://ji-africa-backend.onrender.com/api/blog', {
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.slice(0, 4) : [];
  } catch {
    return [];
  }
}

async function HomeFeedLoader() {
  const [categories, ads, latestPosts] = await Promise.all([
    getCategories(),
    getAds(),
    getLatestBlogPosts(),
  ]);
  return (
    <>
      <MarketplaceFeed initialCategories={categories} initialAds={ads} />
      <LatestGuidesStrip posts={latestPosts} />
    </>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        </div>
      }
    >
      <HomeFeedLoader />
    </Suspense>
  );
}
