import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import AdDetailsClient from '../../components/AdDetailsClient';

async function getAdAndSimilar(id: string) {
  try {
    const [singleRes, listRes] = await Promise.all([
      fetch(`https://ji-africa-backend.onrender.com/api/ads/${id}`, {
        next: { revalidate: 0 },
      }).catch(() => null),
      fetch('https://ji-africa-backend.onrender.com/api/ads?page=1&limit=50', {
        next: { revalidate: 0 },
      }).catch(() => null),
    ]);

    const listData = listRes && listRes.ok ? await listRes.json() : { ads: [] };
    const allAds: any[] = listData.ads || [];

    let ad: any = null;
    if (singleRes && singleRes.ok) {
      const singleData = await singleRes.json();
      ad = singleData.ad || singleData;
    }
    if (!ad) {
      ad = allAds.find((a: any) => String(a.id) === String(id)) || null;
    }

    if (!ad) return { ad: null, similarAds: [] };

    const similarAds = allAds
      .filter(
        (a: any) =>
          String(a.id) !== String(ad.id) &&
          a.status !== 'Unavailable' &&
          a.status !== 'unavailable'
      )
      .map((a: any) => {
        let score = 0;
        if (String(a.category_id) === String(ad.category_id)) score += 10;
        if (a.subcategory && ad.subcategory && a.subcategory === ad.subcategory) score += 5;
        if (String(a.region_id) === String(ad.region_id)) score += 5;
        if (
          a.shop_address &&
          ad.shop_address &&
          a.shop_address.includes(ad.shop_address.split(',')[0])
        ) {
          score += 3;
        }
        return { ...a, score };
      })
      .filter((a: any) => a.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 4);

    return { ad, similarAds };
  } catch (error) {
    console.error('Failed to fetch ad details', error);
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