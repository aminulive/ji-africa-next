import type { MetadataRoute } from 'next';

const SITE_URL = 'https://www.ji.africa';
const API_URL = 'https://ji-africa-backend.onrender.com/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
  ];

  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/blog`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const posts = await res.json();
      if (Array.isArray(posts)) {
        blogRoutes = posts.map((post: any) => ({
          url: `${SITE_URL}/blog/${post.slug}`,
          lastModified: new Date(post.updated_at || post.created_at || Date.now()),
          changeFrequency: 'weekly',
          priority: 0.8,
        }));
      }
    }
  } catch {}

  let adRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/ads?limit=500`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const ads = Array.isArray(data) ? data : Array.isArray(data?.ads) ? data.ads : [];
      adRoutes = ads
        .filter((ad: any) => ad.status === 'Available')
        .map((ad: any) => ({
          url: `${SITE_URL}/ad/${ad.id}`,
          lastModified: new Date(ad.created_at || Date.now()),
          changeFrequency: 'daily',
          priority: 0.85,
        }));
    }
  } catch {}

  return [...staticRoutes, ...blogRoutes, ...adRoutes];
}
