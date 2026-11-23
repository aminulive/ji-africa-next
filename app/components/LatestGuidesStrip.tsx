import Link from "next/link";
import { BookOpen, Calendar, ArrowRight } from "lucide-react";

export interface BlogGuideItem {
  id: number | string;
  title: string;
  slug: string;
  excerpt?: string;
  cover_image?: string;
  created_at?: string;
}

export default function LatestGuidesStrip({ posts = [] }: { posts: BlogGuideItem[] }) {
  if (!Array.isArray(posts) || posts.length === 0) return null;

  return (
    <section aria-labelledby="latest-buying-guides" className="mt-10 pt-8 border-t border-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-orange mb-1">
            <BookOpen className="w-3.5 h-3.5" /> ji.africa Editorial
          </span>
          <h2 id="latest-buying-guides" className="text-xl md:text-2xl font-black text-gray-900">
            Latest Buying Guides &amp; Price Reviews
          </h2>
        </div>

        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-50 hover:bg-brand-orange text-brand-orange hover:text-white text-xs font-black transition"
        >
          View All Guides <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {posts.slice(0, 4).map((post) => (
          <Link
            key={post.id || post.slug}
            href={`/blog/${post.slug}`}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-brand-orange transition-all flex flex-col group"
          >
            <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
              {post.cover_image ? (
                <img
                  src={post.cover_image}
                  alt={post.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center text-brand-orange font-black text-base">
                  ji.africa
                </div>
              )}
            </div>

            <div className="p-4 flex flex-col flex-1">
              {post.created_at && (
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-semibold mb-1.5">
                  <Calendar className="w-3 h-3 text-brand-orange" />
                  <time dateTime={post.created_at}>
                    {new Date(post.created_at).toLocaleDateString("en-GB")}
                  </time>
                </div>
              )}

              <h3 className="font-black text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-brand-orange transition">
                {post.title}
              </h3>

              {post.excerpt && (
                <p className="text-xs text-gray-600 mt-1.5 line-clamp-2 leading-relaxed mb-3">
                  {post.excerpt}
                </p>
              )}

              <div className="mt-auto pt-2.5 border-t border-gray-100 flex items-center gap-1 text-xs font-bold text-brand-orange">
                Read Guide <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
