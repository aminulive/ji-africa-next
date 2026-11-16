import type { Metadata } from "next";
import ShopClient from "./ShopClient";

const API_URL = "https://ji-africa-backend.onrender.com/api";
const SITE_URL = "https://www.ji.africa";

type Props = {
  params: Promise<{ id: string }>;
};

function optimizeOgImage(rawImg: string | null | undefined): string | undefined {
  if (!rawImg) return undefined;
  const full = rawImg.startsWith("http")
    ? rawImg
    : `https://ji-africa-backend.onrender.com${rawImg}`;
  if (full.includes("res.cloudinary.com/") && full.includes("/upload/") && !full.includes("/upload/w_")) {
    return full.replace("/upload/", "/upload/w_800,c_limit,q_auto:good,f_jpg/");
  }
  return full;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const identifier = decodeURIComponent(id || "");

  try {
    const res = await fetch(`${API_URL}/users/${encodeURIComponent(identifier)}/shop`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const user = data?.user;
      if (user) {
        const displayName = user.shop_name || user.full_name || "Seller Storefront";
        const verifiedTag = user.is_verified ? " ✓ Verified Seller" : "";
        const title = `${displayName}${user.username ? ` (@${user.username})` : ""}${verifiedTag} | ji.africa`;
        const description =
          user.shop_description ||
          `Browse listings from ${displayName} in ${user.shop_address || "Nigeria"} on ji.africa.`;
        const ogImage = optimizeOgImage(user.shop_image || user.profile_image);

        return {
          title,
          description,
          openGraph: {
            title,
            description,
            url: `${SITE_URL}/shop/${encodeURIComponent(identifier)}`,
            siteName: "ji.africa",
            type: "profile",
            images: ogImage ? [{ url: ogImage, width: 800, height: 400, alt: displayName }] : [],
          },
          twitter: {
            card: "summary_large_image",
            title,
            description,
            images: ogImage ? [ogImage] : [],
          },
        };
      }
    }
  } catch {}

  return {
    title: "Storefront | ji.africa",
    description: "Shop directly with verified sellers on ji.africa.",
  };
}

export default function ShopPage() {
  return <ShopClient />;
}
