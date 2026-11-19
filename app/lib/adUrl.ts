export function slugifyAdTitle(text: string): string {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 95);
}

export function getAdSlugOrId(ad: { id?: string | number; slug?: string | null; title?: string | null } | null | undefined): string {
  if (!ad) return '';
  if (ad.slug && String(ad.slug).trim()) {
    return String(ad.slug).trim();
  }
  const idStr = ad.id !== undefined && ad.id !== null ? String(ad.id).trim() : '';
  if (!idStr) return '';
  if (ad.title && String(ad.title).trim()) {
    const base = slugifyAdTitle(String(ad.title));
    if (base) return `${base}-${idStr}`;
  }
  return idStr;
}

export function getAdPath(ad: { id?: string | number; slug?: string | null; title?: string | null } | null | undefined): string {
  const key = getAdSlugOrId(ad);
  return key ? `/ad/${key}` : '/';
}

export function getAdUrl(ad: { id?: string | number; slug?: string | null; title?: string | null } | null | undefined): string {
  const key = getAdSlugOrId(ad);
  return key ? `https://www.ji.africa/ad/${key}` : 'https://www.ji.africa';
}
