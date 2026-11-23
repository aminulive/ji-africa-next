"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  User,
  Share2,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Search,
  ShieldCheck,
} from "lucide-react";

const API_URL = "https://ji-africa-backend.onrender.com/api";

type BlogArticleClientProps = {
  initialPost?: any;
  relatedPosts?: any[];
};

function getContextualCta(post: any) {
  const haystack = `${post?.slug || ""} ${post?.title || ""} ${post?.seo_keywords || ""}`.toLowerCase();

  if (haystack.includes("fan")) {
    return {
      query: "rechargeable fan",
      buttonLabel: "Compare Live Rechargeable Fan Prices on ji.africa",
      subtext: "Browse verified Nigerian sellers for Binatone, Qasa, Lontor, Duravolt & itel fans.",
      categoryHref: "/category/home-furniture-and-appliances",
      categoryLabel: "Home & Appliances",
    };
  }
  if (haystack.includes("samsung") || haystack.includes("a57")) {
    return {
      query: "samsung a57",
      buttonLabel: "Compare Live Samsung Galaxy A57 Deals on ji.africa",
      subtext: "Filter by city and storage variant from verified Nigerian phone vendors.",
      categoryHref: "/category/phones-and-tablets",
      categoryLabel: "Phones & Tablets",
    };
  }
  if (haystack.includes("tecno") || haystack.includes("spark 50")) {
    return {
      query: "tecno spark 50",
      buttonLabel: "Browse Live Tecno Spark 50 Listings on ji.africa",
      subtext: "Compare brand-new and UK-used Tecno phones across Lagos, Abuja & nationwide.",
      categoryHref: "/category/phones-and-tablets",
      categoryLabel: "Phones & Tablets",
    };
  }
  if (haystack.includes("gta") || haystack.includes("ps5") || haystack.includes("xbox")) {
    return {
      query: "ps5",
      buttonLabel: "Shop PS5, Xbox & Gaming Deals on ji.africa",
      subtext: "Find consoles, controllers, and verified gaming accessories near you.",
      categoryHref: "/category/electronics",
      categoryLabel: "Electronics & Gaming",
    };
  }

  const firstKeyword = String(post?.seo_keywords || "")
    .split(",")[0]
    ?.trim();
  const fallbackQuery =
    firstKeyword ||
    String(post?.title || "")
      .replace(/price in nigeria|\(202[567]\)|202[567]|best|how to|what is/gi, "")
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join(" ");

  return {
    query: fallbackQuery || "",
    buttonLabel: fallbackQuery
      ? `Browse Live "${fallbackQuery}" Deals on ji.africa`
      : "Browse Verified Marketplace Deals on ji.africa",
    subtext: "Connect directly with verified Nigerian sellers via WhatsApp or JI Trust escrow.",
    categoryHref: "/",
    categoryLabel: "All Marketplace Categories",
  };
}

export default function BlogArticleClient({
  initialPost = null,
  relatedPosts = [],
}: BlogArticleClientProps) {
  const params = useParams();
  const slug = String(params?.slug || initialPost?.slug || "");
  const [post, setPost] = useState<any>(initialPost);
  const [loading, setLoading] = useState(!initialPost);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialPost && initialPost.slug === slug) {
      setPost(initialPost);
      setLoading(false);
      return;
    }
    if (!slug) return;
    setLoading(true);
    fetch(`${API_URL}/blog/${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setPost(data))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug, initialPost]);

  const handleShare = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20 space-y-4">
        <p className="font-bold text-gray-700">Article not found.</p>
        <Link href="/blog" className="text-xs font-bold text-brand-orange hover:underline">
          ← Back to all articles
        </Link>
      </div>
    );
  }

  const cta = getContextualCta(post);
  const searchHref = cta.query ? `/?q=${encodeURIComponent(cta.query)}` : "/";

  return (
    <article className="max-w-3xl mx-auto pb-16 space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <Link href="/" className="hover:text-brand-orange">Home</Link>
        <span>/</span>
        <Link href="/blog" className="inline-flex items-center gap-1 hover:text-brand-orange">
          <ArrowLeft className="w-3.5 h-3.5" /> Blog
        </Link>
      </nav>

      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 border-y border-gray-200 py-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-semibold text-gray-700">
              <User className="w-4 h-4 text-brand-orange" />
              {post.author?.full_name || "ji.africa Editorial"}
            </span>
            <time dateTime={post.created_at} className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-orange" />
              {new Date(post.created_at).toLocaleDateString("en-GB")}
            </time>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-gray-800 transition"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Link Copied
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" /> Share Article
              </>
            )}
          </button>
        </div>
      </header>

      {post.cover_image && (
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <img src={post.cover_image} alt={post.title} className="w-full max-h-[420px] object-cover" />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-10 shadow-sm space-y-8">
        <div
          className="ji-article-body text-sm md:text-base text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatArticleHtml(post.content) }}
        />

        {/* Contextual Marketplace Search CTA */}
        <div className="rounded-2xl bg-orange-50/80 border border-orange-200 p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-orange">
              <ShieldCheck className="w-3.5 h-3.5" /> Live Marketplace Prices
            </span>
            <p className="text-sm font-black text-gray-900">{cta.buttonLabel}</p>
            <p className="text-xs text-gray-600">{cta.subtext}</p>
          </div>

          <Link
            href={searchHref}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-orange hover:bg-orange-700 text-white text-xs font-black shadow-sm transition shrink-0"
          >
            <Search className="w-3.5 h-3.5" /> Compare Prices
          </Link>
        </div>
      </div>

      <style jsx global>{`
        .ji-article-body h2 {
          font-size: 1.5rem;
          font-weight: 900;
          color: #111827;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          padding-top: 0.5rem;
          border-top: 1px solid #f3f4f6;
          line-height: 1.3;
        }
        .ji-article-body h2:first-child {
          margin-top: 0;
          border-top: none;
          padding-top: 0;
        }
        .ji-article-body h3 {
          font-size: 1.2rem;
          font-weight: 800;
          color: #1f2937;
          margin-top: 1.5rem;
          margin-bottom: 0.6rem;
          line-height: 1.35;
        }
        .ji-article-body p {
          margin-bottom: 1rem;
          line-height: 1.8;
        }
        .ji-article-body a {
          color: #ea580c;
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .ji-article-body a:hover {
          color: #c2410c;
        }
        .ji-article-body ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1.1rem;
        }
        .ji-article-body ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 1.1rem;
        }
        .ji-article-body li {
          margin-bottom: 0.35rem;
          line-height: 1.7;
        }
        .ji-article-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          font-size: 0.875rem;
        }
        .ji-article-body td,
        .ji-article-body th {
          border: 1px solid #e5e7eb;
          padding: 0.6rem 0.85rem;
          text-align: left;
        }
        .ji-article-body thead td,
        .ji-article-body th {
          background: #f9fafb;
          font-weight: 800;
        }
        .ji-article-body blockquote {
          border-left: 4px solid #ea580c;
          background: rgba(255, 237, 213, 0.5);
          padding: 0.9rem 1.2rem;
          margin: 1.25rem 0;
          border-radius: 0 0.875rem 0.875rem 0;
          font-style: italic;
          color: #1f2937;
        }
        .ji-article-body figure {
          margin: 1.75rem 0;
          border-radius: 1rem;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        .ji-article-body figure img,
        .ji-article-body img {
          width: 100%;
          max-height: 480px;
          object-fit: cover;
          display: block;
        }
        .ji-article-body figcaption {
          padding: 0.6rem 1rem;
          font-size: 0.78rem;
          color: #6b7280;
          text-align: center;
          font-style: italic;
          border-top: 1px solid #f3f4f6;
        }
        .ji-article-body a.ji-blog-cta {
          display: inline-block;
          background: #ea580c;
          color: #ffffff !important;
          text-decoration: none !important;
          font-weight: 800;
          font-size: 0.9rem;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          margin: 0.5rem 0;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);
        }
        .ji-article-body a.ji-blog-cta:hover {
          background: #c2410c;
        }

        /* Dark Mode Support for Article Content & Tables */
        html.dark .ji-article-body {
          color: #d4d4d8;
        }
        html.dark .ji-article-body h2 {
          color: #f4f4f5;
          border-top-color: #27272a;
        }
        html.dark .ji-article-body h3,
        html.dark .ji-article-body strong,
        html.dark .ji-article-body b {
          color: #fafafa;
        }
        html.dark .ji-article-body td,
        html.dark .ji-article-body th {
          border-color: #3f3f46 !important;
        }
        html.dark .ji-article-body thead td,
        html.dark .ji-article-body th {
          background: #27272a;
          color: #fafafa;
        }
        html.dark .ji-article-body blockquote {
          background: rgba(234, 88, 12, 0.14);
          color: #f4f4f5;
        }
        html.dark .ji-article-body figure {
          background: #18181b;
          border-color: #27272a;
        }
        html.dark .ji-article-body figcaption {
          color: #a1a1aa;
          border-top-color: #27272a;
        }
      `}</style>

      {post.seo_keywords && (
        <div className="flex flex-wrap gap-2 pt-2">
          {post.seo_keywords.split(",").map((kw: string, i: number) => (
            <span
              key={i}
              className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold"
            >
              #{kw.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Internal Marketplace & Related Articles Links for SEO & Discovery */}
      <section className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-black text-gray-900">
            Shop Verified Deals on ji.africa
          </h2>
          <Link href="/sell" className="text-xs font-bold text-brand-orange hover:underline">
            Post a Free Ad →
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/category/electronics" className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 hover:border-brand-orange transition">
            Electronics &amp; Appliances
          </Link>
          <Link href="/category/phones-and-tablets" className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 hover:border-brand-orange transition">
            Phones &amp; Tablets
          </Link>
          <Link href="/category/vehicles" className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 hover:border-brand-orange transition">
            Vehicles &amp; Cars
          </Link>
          <Link href="/category/home-furniture-and-appliances" className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 hover:border-brand-orange transition">
            Home &amp; Appliances
          </Link>
        </div>
      </section>

      {relatedPosts.length > 0 && (
        <section className="pt-4 space-y-4">
          <h2 className="text-lg font-black text-gray-900">More Marketplace Guides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedPosts.map((rel: any) => (
              <Link
                key={rel.id || rel.slug}
                href={`/blog/${rel.slug}`}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-brand-orange transition flex flex-col justify-between gap-3"
              >
                <p className="font-bold text-sm text-gray-900 line-clamp-2">{rel.title}</p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange">
                  Read Guide <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function formatArticleHtml(raw: string): string {
  const text = String(raw || "").trim();
  if (!text) return "";
  const sanitized = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*(["']).*?\1/gi, "");
  const hasHtml = /<(h2|h3|p|div|ul|ol|blockquote|figure|img|a)\b/i.test(sanitized);
  if (hasHtml) return sanitized;
  return sanitized
    .split(/\n{2,}/)
    .map((block) => "<p>" + block.replace(/\n/g, "<br />") + "</p>")
    .join("");
}
