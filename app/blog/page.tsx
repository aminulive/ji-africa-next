"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Calendar, ArrowRight, Loader2 } from 'lucide-react';

const API_URL = 'https://ji-africa-backend.onrender.com/api';

export default function BlogIndexPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/blog`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-8">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl p-8 md:p-12 shadow-sm">
        <span className="inline-flex items-center gap-1.5 bg-brand-orange/20 text-brand-orange px-3 py-1 rounded-full text-xs font-bold mb-3">
          <BookOpen className="w-3.5 h-3.5" /> ji.africa Editorial
        </span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
          Marketplace Guides, Safety Tips &amp; Insights
        </h1>
        <p className="text-sm text-gray-300 mt-2 max-w-2xl">
          Expert advice for buying and selling smarter across Nigeria—from verified vehicle checks to growing your online storefront.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-sm text-gray-500 font-medium">
          No articles published yet. Check back soon for marketplace guides and tips!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-brand-orange transition-all flex flex-col group"
            >
              <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
                {post.cover_image ? (
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center text-brand-orange font-black text-xl">
                    ji.africa
                  </div>
                )}
              </div>

              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-[11px] text-gray-400 font-semibold mb-2">
                  <Calendar className="w-3.5 h-3.5 text-brand-orange" />
                  <span>{new Date(post.created_at).toLocaleDateString('en-GB')}</span>
                  {post.author?.full_name && <span>• By {post.author.full_name}</span>}
                </div>

                <h2 className="font-black text-gray-900 text-lg leading-snug group-hover:text-brand-orange transition">
                  {post.title}
                </h2>

                <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed mb-4">
                  {post.excerpt}
                </p>

                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center gap-1 text-xs font-bold text-brand-orange">
                  Read Article <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
