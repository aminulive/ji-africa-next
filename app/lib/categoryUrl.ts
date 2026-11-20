export function slugifyCategoryName(text: string): string {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function getCategoryPath(
  category: { id?: number | string; name?: string } | string | null | undefined,
  subcategory?: string | null,
  extraParams?: Record<string, string | undefined | null>
): string {
  if (!category) return '/';
  const catName = typeof category === 'string' ? category : category.name || '';
  const catSlug = slugifyCategoryName(catName) || (typeof category === 'object' && category.id ? String(category.id) : '');
  if (!catSlug) return '/';

  let base = '/category/' + encodeURIComponent(catSlug);
  if (subcategory && String(subcategory).trim()) {
    const subSlug = slugifyCategoryName(String(subcategory));
    if (subSlug) {
      base += '/' + encodeURIComponent(subSlug);
    }
  }

  if (extraParams) {
    const sp = new URLSearchParams();
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v && String(v).trim() && v !== 'all' && v !== 'All Nigeria') {
        sp.set(k, String(v).trim());
      }
    });
    const qs = sp.toString();
    if (qs) base += '?' + qs;
  }

  return base;
}

export function resolveCategoryFromSlug(categories: any[], slug: string): any | null {
  const clean = slugifyCategoryName(decodeURIComponent(String(slug || '')));
  if (!clean) return null;
  return (
    (categories || []).find(
      (c: any) =>
        slugifyCategoryName(c.name) === clean ||
        String(c.id) === String(slug)
    ) || null
  );
}

export function extractCategoryTree(cat: any): { name: string; children: any[] }[] {
  if (Array.isArray(cat?.category_tree) && cat.category_tree.length > 0) {
    return cat.category_tree;
  }
  const raw = cat?.subcategories;
  if (Array.isArray(raw)) {
    return raw
      .map((item: any) =>
        typeof item === 'string'
          ? { name: item, children: [] }
          : item?.name
          ? { name: item.name, children: Array.isArray(item.children) ? item.children : [] }
          : null
      )
      .filter(Boolean) as { name: string; children: any[] }[];
  }
  return [];
}

export function resolveSubcategoryFromSlug(category: any, subslug?: string | null): string {
  if (!category || !subslug) return '';
  const clean = slugifyCategoryName(decodeURIComponent(String(subslug)));
  if (!clean) return '';
  const tree = extractCategoryTree(category);
  const found = tree.find((node) => slugifyCategoryName(node.name) === clean);
  return found ? found.name : decodeURIComponent(String(subslug));
}
