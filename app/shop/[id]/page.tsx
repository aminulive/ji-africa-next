import type { Metadata } from 'next';
import ShopClient from './ShopClient';

const API_URL = 'https://ji-africa-backend.onrender.com/api';
const SITE_URL = 'https://www.ji.africa';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const identifier = decodeURIComponent(id || '');

  try {
    const res = await fetch(`${API_URL}/users/${encodeURIComponent(identifier)}/shop`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      const user = data?.user;
      if (user) {
        const displayName = user.shop_name || user.full_name || 'Seller Storefront';
        const title = `${displayName}${user.username ? ` (@${user.username})` : ''} | ji.africa Storefront`;
        const description =
          user.shop_description ||
          `Browse verified listings from ${displayName} in ${user.shop_address || 'Nigeria'} on ji.africa.`;
        const rawImg = user.shop_image || user.profile_image;
        const ogImage = rawImg
          ? rawImg.startsWith('http')
            ? rawImg
            : `https://ji-africa-backend.onrender.com${rawImg}`
          : undefined;

        return {
          title,
          description,
          openGraph: {
            title,
            description,
            url: `${SITE_URL}/shop/${encodeURIComponent(identifier)}`,
            siteName: 'ji.africa',
            type: 'profile',
            images: ogImage ? [ogImage] : [],
          },
          twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: ogImage ? [ogImage] : [],
          },
        };
      }
    }
  } catch {}

  return {
    title: 'Storefront | ji.africa',
    description: 'Shop directly with verified sellers on ji.africa.',
  };
}

export default function ShopPage() {
  return <ShopClient />;
}
