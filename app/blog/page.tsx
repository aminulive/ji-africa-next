import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import BlogIndexClient from "./BlogIndexClient";

const API_URL = "https://ji-africa-backend.onrender.com/api";

export const metadata: Metadata = {
  title: "Marketplace Guides, Buying Tips & Insights in Nigeria | ji.africa Blog",
  description:
    "Read verified price guides, product reviews, safety tips, and seller growth advice across Nigeria on the official ji.africa blog.",
  alternates: {
    canonical: "https://www.ji.africa/blog",
  },
};

async function BlogIndexServer() {
  let posts: any[] = [];
  try {
    const res = await fetch(`${API_URL}/blog`, { next: { revalidate: 120 } });
    if (res.ok) {
      const data = await res.json();
      posts = Array.isArray(data) ? data : [];
    }
  } catch {}

  return <BlogIndexClient initialPosts={posts} />;
}

export default function BlogIndexPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        </div>
      }
    >
      <BlogIndexServer />
    </Suspense>
  );
}
