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

      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-10 shadow-sm space-y-4 text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-line">
        {post.content}
      </div>

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

export default function BlogArticlePage() {
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
