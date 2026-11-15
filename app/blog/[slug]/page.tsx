import type { Metadata } from 'next';
import BlogArticleClient from './BlogArticleClient';

const API_URL = 'https://ji-africa-backend.onrender.com/api';
const SITE_URL = 'https://www.ji.africa';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_URL}/blog/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const post = await res.json();
      const title = post.seo_title || `${post.title} | ji.africa Blog`;
      const description = post.seo_description || post.excerpt || 'Marketplace guide on ji.africa';
      const images = post.cover_image ? [post.cover_image] : [];

      return {
        title,
        description,
        keywords: post.seo_keywords || undefined,
        openGraph: {
          title,
          description,
          url: `${SITE_URL}/blog/${slug}`,
          siteName: 'ji.africa',
          type: 'article',
          images,
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images,
        },
      };
    }
  } catch {}

  return {
    title: 'Article | ji.africa Blog',
    description: 'Marketplace guides, safety tips, and insights on ji.africa.',
  };
}

export default function BlogArticlePage() {
  return <BlogArticleClient />;
}
