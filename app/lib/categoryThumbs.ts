export interface CategoryVisualMeta {
  image: string;
  accentBg: string;
  shortLabel: string;
}

const CATEGORY_VISUALS: { match: string[]; meta: CategoryVisualMeta }[] = [
  {
    match: ['vehicle', 'car', 'auto'],
    meta: {
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=160&q=75',
      accentBg: 'bg-amber-50',
      shortLabel: 'Cars & Vehicles',
    },
  },
  {
    match: ['property', 'real estate', 'house', 'land', 'apartment'],
    meta: {
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=160&q=75',
      accentBg: 'bg-emerald-50',
      shortLabel: 'Property',
    },
  },
  {
    match: ['phone', 'tablet', 'mobile'],
    meta: {
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=160&q=75',
      accentBg: 'bg-sky-50',
      shortLabel: 'Phones & Tablets',
    },
  },
  {
    match: ['electronic', 'laptop', 'computer', 'tv', 'audio'],
    meta: {
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=160&q=75',
      accentBg: 'bg-indigo-50',
      shortLabel: 'Electronics',
    },
  },
  {
    match: ['home', 'furniture', 'appliance', 'kitchen'],
    meta: {
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=160&q=75',
      accentBg: 'bg-orange-50',
      shortLabel: 'Home & Appliances',
    },
  },
  {
    match: ['fashion', 'cloth', 'shoe', 'watch', 'bag'],
    meta: {
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=160&q=75',
      accentBg: 'bg-pink-50',
      shortLabel: 'Fashion',
    },
  },
  {
    match: ['beauty', 'personal care', 'health', 'cosmetic'],
    meta: {
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=160&q=75',
      accentBg: 'bg-rose-50',
      shortLabel: 'Beauty & Care',
    },
  },
  {
    match: ['service'],
    meta: {
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=160&q=75',
      accentBg: 'bg-teal-50',
      shortLabel: 'Services',
    },
  },
  {
    match: ['repair', 'construction', 'solar', 'power', 'building'],
    meta: {
      image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=160&q=75',
      accentBg: 'bg-yellow-50',
      shortLabel: 'Solar & Construction',
    },
  },
  {
    match: ['commercial', 'equipment', 'tool', 'industrial', 'business'],
    meta: {
      image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=160&q=75',
      accentBg: 'bg-slate-100',
      shortLabel: 'Equipment & Tools',
    },
  },
  {
    match: ['leisure', 'sport', 'gym', 'musical', 'book'],
    meta: {
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=160&q=75',
      accentBg: 'bg-lime-50',
      shortLabel: 'Leisure & Sports',
    },
  },
  {
    match: ['bab', 'kid', 'toy', 'maternity'],
    meta: {
      image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=160&q=75',
      accentBg: 'bg-cyan-50',
      shortLabel: 'Babies & Kids',
    },
  },
  {
    match: ['food', 'agric', 'farm', 'grocery'],
    meta: {
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=160&q=75',
      accentBg: 'bg-green-50',
      shortLabel: 'Food & Agric',
    },
  },
  {
    match: ['animal', 'pet', 'livestock', 'dog'],
    meta: {
      image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=160&q=75',
      accentBg: 'bg-amber-50',
      shortLabel: 'Animals & Pets',
    },
  },
  {
    match: ['job', 'cv', 'seeking', 'work', 'career'],
    meta: {
      image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=160&q=75',
      accentBg: 'bg-blue-50',
      shortLabel: 'Jobs & CVs',
    },
  },
];

export function getCategoryVisualMeta(categoryName?: string): CategoryVisualMeta {
  const low = String(categoryName || '').toLowerCase();
  for (const entry of CATEGORY_VISUALS) {
    if (entry.match.some((kw) => low.includes(kw))) {
      return entry.meta;
    }
  }
  return {
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=160&q=75',
    accentBg: 'bg-orange-50',
    shortLabel: categoryName || 'Marketplace',
  };
}
