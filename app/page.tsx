import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import MarketplaceFeed from './components/MarketplaceFeed';

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

async function HomeFeedLoader() {
  const [categories, ads] = await Promise.all([getCategories(), getAds()]);
  return <MarketplaceFeed initialCategories={categories} initialAds={ads} />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        </div>
      }
    >
      <HomeFeedLoader />
    </Suspense>
  );
}