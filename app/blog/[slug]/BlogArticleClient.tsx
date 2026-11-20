"use client";

import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Share2, Loader2, CheckCircle2 } from 'lucide-react';

const API_URL = 'https://ji-africa-backend.onrender.com/api';

function BlogArticleContent() {
  const params = useParams();
  const slug = String(params?.slug || '');
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_URL}/blog/${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setPost(data))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleShare = () => {
    if (typeof navigator !== 'undefined') {
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

  return (
    <article className="max-w-3xl mx-auto pb-16 space-y-6">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-brand-orange"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Blog
      </Link>

      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 border-y border-gray-200 py-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-semibold text-gray-700">
              <User className="w-4 h-4 text-brand-orange" />
              {post.author?.full_name || 'ji.africa Editorial'}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-orange" />
              {new Date(post.created_at).toLocaleDateString('en-GB')}
            </span>
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

      <div
        className="ji-article-body bg-white rounded-2xl border border-gray-200 p-6 md:p-10 shadow-sm text-sm md:text-base text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formatArticleHtml(post.content) }}
      />

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
      `}</style>

      {post.seo_keywords && (
        <div className="flex flex-wrap gap-2 pt-2">
          {post.seo_keywords.split(',').map((kw: string, i: number) => (
            <span
              key={i}
              className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold"
            >
              #{kw.trim()}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

function formatArticleHtml(raw: string): string {
  const text = String(raw || '').trim();
  if (!text) return '';
  const sanitized = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*(["']).*?\1/gi, '');
  const hasHtml = /<(h2|h3|p|div|ul|ol|blockquote|figure|img|a)\b/i.test(sanitized);
  if (hasHtml) return sanitized;
  return sanitized
    .split(/\n{2,}/)
    .map((block) => '<p>' + block.replace(/\n/g, '<br />') + '</p>')
    .join('');
}

export default function BlogArticleClient() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        </div>
      }
    >
      <BlogArticleContent />
    </Suspense>
  );
}
