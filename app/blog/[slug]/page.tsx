import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import BlogArticleClient from "./BlogArticleClient";

const API_URL = "https://ji-africa-backend.onrender.com/api";
const SITE_URL = "https://www.ji.africa";

type Props = {
  params: Promise<{ slug: string }>;
};

async function fetchPostBySlug(slug: string) {
  try {
    const res = await fetch(`${API_URL}/blog/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchAllPosts() {
  try {
    const res = await fetch(`${API_URL}/blog`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  const posts = await fetchAllPosts();
  const slugs = posts
    .map((p: any) => ({ slug: String(p.slug || "").trim() }))
    .filter((item) => Boolean(item.slug));
  return slugs.length > 0 ? slugs : [{ slug: "rechargeable-fan-in-nigeria" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const canonical = `${SITE_URL}/blog/${slug}`;
  const post = await fetchPostBySlug(slug);

  if (post) {
    const title = post.seo_title || `${post.title} | ji.africa Blog`;
    const description =
      post.seo_description || post.excerpt || "Marketplace guides and buying tips on ji.africa.";
    const images = post.cover_image ? [post.cover_image] : [];

    return {
      title,
      description,
      keywords: post.seo_keywords || undefined,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: "ji.africa",
        type: "article",
        publishedTime: post.created_at || undefined,
        modifiedTime: post.updated_at || post.created_at || undefined,
        images,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images,
      },
    };
  }

  return {
    title: "Article | ji.africa Blog",
    description: "Marketplace guides, safety tips, and insights on ji.africa.",
    alternates: { canonical },
  };
}

async function BlogArticleServer({ params }: Props) {
  const { slug } = await params;
  const [post, allPosts] = await Promise.all([
    fetchPostBySlug(slug),
    fetchAllPosts(),
  ]);

  const relatedPosts = allPosts
    .filter((p: any) => p && p.slug && p.slug !== slug)
    .slice(0, 3);

  const canonical = `${SITE_URL}/blog/${slug}`;
  const jsonLd = post
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.seo_title || post.title,
        description: post.seo_description || post.excerpt || "",
        image: post.cover_image ? [post.cover_image] : undefined,
        datePublished: post.created_at || undefined,
        dateModified: post.updated_at || post.created_at || undefined,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": canonical,
        },
        author: {
          "@type": "Person",
          name: post.author?.full_name || "ji.africa Editorial",
        },
        publisher: {
          "@type": "Organization",
          name: "ji.africa",
          url: SITE_URL,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BlogArticleClient initialPost={post} relatedPosts={relatedPosts} />
    </>
  );
}

export default function BlogArticlePage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        </div>
      }
    >
      <BlogArticleServer params={params} />
    </Suspense>
  );
}
