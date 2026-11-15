"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  Plus,
  X,
  ChevronRight,
  ArrowLeft,
  MapPin,
  Search,
  Check,
  AlertCircle,
} from 'lucide-react';
import { CategoryIcon } from '../lib/categoryIcons';

const API_URL = 'https://ji-africa-backend.onrender.com/api';

// 3rd-level item types matching our Neon "SubSubCategory" seed
const SUB_SUB_CATEGORIES: Record<string, string[]> = {
  Cars: ['Sedan', 'SUV & Crossover', 'Hatchback', 'Pickup Truck', 'Coupe & Convertible'],
  'Vehicle Parts & Accessories': [
    'Engine & Drivetrain',
    'Tyres, Rims & Wheels',
    'Car Electronics & Audio',
    'Body & Exterior Parts',
    'Interior Accessories',
  ],
  'Houses & Apartments For Rent': [
    'Duplex',
    'Block of Flats',
    'Bungalow',
    'Mini Flat (Room & Parlour)',
    'Self Contain',
  ],
  'Houses & Apartments For Sale': [
    'Detached Duplex',
    'Semi-Detached Duplex',
    'Terraced Duplex',
    'Bungalow',
    'Block of Flats',
  ],
  'Land & Plots For Sale': [
    'Residential Land',
    'Commercial Land',
    'Industrial Land',
    'Farmland',
  ],
  'Mobile Phones': [
    'iPhone (Apple)',
    'Samsung Galaxy',
    'Tecno',
    'Infinix',
    'Xiaomi / Redmi',
    'Google Pixel',
  ],
  'Accessories for Phones & Tablets': [
    'Chargers & Power Adapters',
    'Power Banks',
    'Cases & Covers',
    'Screen Protectors',
    'USB & Lightning Cables',
  ],
  'Laptops & Computers': [
    'Laptops',
    'Desktop Computers',
    'Servers & Workstations',
    'Computer Accessories',
  ],
  'Home Appliances': [
    'Generators & Solar Inverters',
    'Air Conditioners',
    'Refrigerators & Freezers',
    'Washing Machines',
    'Fans & Air Coolers',
  ],
  Furniture: [
    'Sofas & Living Room Chairs',
    'Beds & Mattresses',
    'Dining Sets',
    'Wardrobes & Cabinets',
    'Office Desks & Chairs',
  ],
  "Men's Fashion": [
    "Men's Clothing",
    "Men's Shoes",
    "Men's Watches",
    "Men's Bags",
    'Traditional & Senator Wear',
  ],
  "Women's Fashion": [
    "Women's Clothing",
    "Women's Shoes",
    'Handbags & Clutches',
    'Jewellery & Watches',
    'Aso-Ebi & Traditional Fabrics',
  ],
};

function SellFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEdit = !!editId;

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState('');

  // Reference Data
  const [categories, setCategories] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [subRegions, setSubRegions] = useState<any[]>([]);

  // Form States
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [subSubcategory, setSubSubcategory] = useState('');
  const [displayCategory, setDisplayCategory] = useState('Select Category');

  const [regionId, setRegionId] = useState('');
  const [subRegionId, setSubRegionId] = useState('');
  const [displayLocation, setDisplayLocation] = useState('Select State/LGA');

  const [status, setStatus] = useState('Available');
  const [externalLink, setExternalLink] = useState('');
  const [condition, setCondition] = useState('Brand New');
  const [delivery, setDelivery] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState('false');
  const [vipPlan, setVipPlan] = useState('');

  // Images State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Modal States
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [activePickerCategory, setActivePickerCategory] = useState<any>(null);
  const [activePickerSubcategory, setActivePickerSubcategory] = useState<string | null>(null);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [activeRegionForLga, setActiveRegionForLga] = useState<any>(null);
  const [loadingLgas, setLoadingLgas] = useState(false);

  // 1. Auth Guard + Load Categories, Regions & Existing Ad (if editing)
  useEffect(() => {
    const token = localStorage.getItem('ji_token');
    if (!token) {
      router.push('/login');
      return;
    }

    async function initData() {
      try {
        const [catRes, regRes] = await Promise.all([
          fetch(`${API_URL}/categories`),
          fetch(`${API_URL}/locations/countries/1/regions`),
        ]);

        const catData = catRes.ok ? await catRes.json() : [];
        const regData = regRes.ok ? await regRes.json() : [];

        catData.sort(
          (a: any, b: any) => (Number(a.display_order) || 99) - (Number(b.display_order) || 99)
        );
        regData.sort((a: any, b: any) => a.name.localeCompare(b.name));

        setCategories(catData);
        setRegions(regData);

        if (editId) {
          let adData: any = null;
          const singleRes = await fetch(`${API_URL}/ads/${editId}`);
          if (singleRes.ok) {
            const raw = await singleRes.json();
            adData = raw.ad || raw;
          } else {
            const listRes = await fetch(`${API_URL}/ads?page=1&limit=100`);
            if (listRes.ok) {
              const listJson = await listRes.json();
              adData = (listJson.ads || []).find((a: any) => String(a.id) === String(editId));
            }
          }

          if (adData) {
            setTitle(adData.title || '');
            setCategoryId(String(adData.category_id || ''));
            setSubcategory(adData.subcategory || '');
            setSubSubcategory(adData.sub_subcategory || '');

            const matchedCat = catData.find(
              (c: any) => String(c.id) === String(adData.category_id)
            );
            const labelParts = [adData.subcategory, adData.sub_subcategory].filter(Boolean);
            setDisplayCategory(
              labelParts.length > 0 ? labelParts.join(' • ') : matchedCat?.name || 'Select Category'
            );

            if (adData.region_id) {
              setRegionId(String(adData.region_id));
              const matchedReg = regData.find(
                (r: any) => String(r.id) === String(adData.region_id)
              );
              if (matchedReg) setDisplayLocation(matchedReg.name.replace(' State', ''));
            }
            if (adData.sub_region_id) setSubRegionId(String(adData.sub_region_id));

            setStatus(adData.status || 'Available');
            setExternalLink(adData.youtube_link || '');
            setCondition(adData.condition || 'Brand New');
            setDelivery(adData.delivery_option || '');
            setDescription(adData.description || '');
            setPrice(String(adData.price || ''));
            setIsNegotiable(adData.is_negotiable ? 'true' : 'false');
            setVipPlan(adData.is_vip ? adData.vip_type || 'top' : '');

            if (adData.image) {
              try {
                const parsed = JSON.parse(adData.image);
                const arr = Array.isArray(parsed) ? parsed : [adData.image];
                setExistingImages(
                  arr.map((img: string) =>
                    img.startsWith('http') || img.startsWith('data:')
                      ? img
                      : `https://ji-africa-backend.onrender.com${img}`
                  )
                );
              } catch {
                setExistingImages([adData.image]);
              }
            }
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setInitializing(false);
      }
    }

    initData();
  }, [editId, router]);

  // --- 3-LEVEL CATEGORY PICKER HANDLERS ---
  const handleSelectMainCategory = (cat: any) => {
    const subs = Array.isArray(cat.subcategories) ? cat.subcategories : [];
    if (subs.length === 0) {
      applyCategory(cat.id, cat.name, '', '');
    } else {
      setActivePickerCategory(cat);
      setActivePickerSubcategory(null);
    }
  };

  const handleSelectSubcategory = (cat: any, subName: string) => {
    const thirdLevel = SUB_SUB_CATEGORIES[subName] || [];
    if (thirdLevel.length === 0) {
      applyCategory(cat.id, cat.name, subName, '');
    } else {
      setActivePickerSubcategory(subName);
    }
  };

  const applyCategory = (
    catId: string | number,
    catName: string,
    subName: string,
    subSubName: string
  ) => {
    setCategoryId(String(catId));
    setSubcategory(subName);
    setSubSubcategory(subSubName);

    const parts = [subName, subSubName].filter(Boolean);
    setDisplayCategory(parts.length > 0 ? parts.join(' • ') : catName);

    setShowCategoryModal(false);
    setActivePickerCategory(null);
    setActivePickerSubcategory(null);
  };

  // --- LOCATION PICKER HANDLERS ---
  const handleLoadLgas = async (region: any) => {
    setActiveRegionForLga(region);
    setLocationSearch('');
    setLoadingLgas(true);
    try {
      const res = await fetch(`${API_URL}/locations/regions/${region.id}/sub-regions`);
      const data = res.ok ? await res.json() : [];
      data.sort((a: any, b: any) => a.name.localeCompare(b.name));
      setSubRegions(data);
    } catch {
      setSubRegions([]);
    } finally {
      setLoadingLgas(false);
    }
  };

  const handleSelectState = (region: any) => {
    setRegionId(String(region.id));
    setSubRegionId('');
    setDisplayLocation(region.name.replace(' State', ''));
    setShowLocationModal(false);
    setActiveRegionForLga(null);
  };

  const handleSelectLga = (sub: any, region: any) => {
    setRegionId(String(region.id));
    setSubRegionId(String(sub.id));
    setDisplayLocation(`${sub.name}, ${region.name.replace(' State', '')}`);
    setShowLocationModal(false);
    setActiveRegionForLga(null);
  };

  // --- IMAGE PREVIEW & REORDER HANDLERS ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files);
    const maxAllowed = 5 - existingImages.length;
    setSelectedFiles((prev) => [...prev, ...incoming].slice(0, Math.max(0, maxAllowed)));
    e.target.value = '';
  };

  const setPrimaryImage = (index: number) => {
    setSelectedFiles((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    });
  };

  const removePreviewImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  // --- SUBMIT AD ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!categoryId || !regionId) {
      setError('Category and Location are required!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!isEdit && selectedFiles.length === 0) {
      setError('Please add at least 1 photo of your item.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('ji_token');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category_id', categoryId);
    formData.append('subcategory', subcategory || '');
    formData.append('sub_subcategory', subSubcategory || '');
    formData.append('price', price);
    formData.append('condition', condition);
    formData.append('delivery_option', delivery);
    formData.append('description', description);
    formData.append('youtube_link', externalLink);
    formData.append('status', status);
    formData.append('is_negotiable', isNegotiable);

    formData.append('country_id', '1');
    formData.append('region_id', String(parseInt(regionId, 10)));
    if (subRegionId) {
      formData.append('sub_region_id', String(parseInt(subRegionId, 10)));
    }

    if (vipPlan) {
      formData.append('is_vip', 'true');
      formData.append('vip_type', vipPlan);
    }

    selectedFiles.forEach((file) => formData.append('images', file));

    const url = isEdit ? `${API_URL}/ads/${editId}` : `${API_URL}/ads`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        router.push(isEdit ? '/dashboard/seller' : '/');
        router.refresh();
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Failed to save ad. Please try again.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      setError('Server error. Please check your connection and try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  const filteredRegions = regions.filter((r) =>
    r.name.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const filteredSubRegions = subRegions.filter((sr) =>
    sr.name.toLowerCase().includes(locationSearch.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <h1 className="text-center font-black text-2xl text-gray-900">
        {isEdit ? 'Edit Listing' : 'Post ad'}
      </h1>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Title, Category, Location & Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 shadow-sm">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Oraimo Space Buds Bluetooth Earpiece"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:border-brand-orange outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Custom 3-Level Category Trigger */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">
                Category *
              </label>
              <div
                onClick={() => {
                  setActivePickerCategory(null);
                  setActivePickerSubcategory(null);
                  setShowCategoryModal(true);
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer flex justify-between items-center hover:border-brand-orange transition"
              >
                <span
                  className={
                    categoryId ? 'text-gray-900 font-semibold truncate' : 'text-gray-400'
                  }
                >
                  {displayCategory}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              </div>
            </div>

            {/* Custom Location Trigger (37 States & 774 LGAs) */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">
                Select Location *
              </label>
              <div
                onClick={() => {
                  setActiveRegionForLga(null);
                  setLocationSearch('');
                  setShowLocationModal(true);
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer flex justify-between items-center hover:border-brand-orange transition"
              >
                <span
                  className={
                    regionId ? 'text-gray-900 font-semibold truncate' : 'text-gray-400'
                  }
                >
                  {displayLocation}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">
              Ad Status (Visibility)
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-brand-orange transition"
            >
              <option value="Available">Available (Visible to public)</option>
              <option value="Unavailable">Temporarily Unavailable (Hidden)</option>
            </select>
          </div>
        </div>

        {/* Card 2: Photos & External Link */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-1">Add at least 1 photo</h3>
          <p className="text-[11px] text-brand-orange mb-4">
            First picture is the title picture. Max 5 photos.
          </p>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {existingImages.map((imgUrl, idx) => (
              <div
                key={`existing-${idx}`}
                className="w-24 h-24 border-2 border-gray-200 rounded-xl overflow-hidden relative group shrink-0"
              >
                <img src={imgUrl} alt="Existing" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center">
                  <span className="text-[8px] text-white font-bold">Existing</span>
                </div>
              </div>
            ))}

            {existingImages.length + selectedFiles.length < 5 && (
              <label className="w-24 h-24 bg-orange-50 border border-orange-200 text-brand-orange rounded-xl flex items-center justify-center cursor-pointer hover:bg-orange-100 transition shrink-0">
                <Plus className="w-8 h-8" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            )}

            {selectedFiles.map((file, index) => {
              const previewUrl = URL.createObjectURL(file);
              return (
                <div
                  key={`${file.name}-${index}`}
                  className={`w-24 h-24 border-2 ${
                    index === 0 && existingImages.length === 0
                      ? 'border-brand-orange scale-105'
                      : 'border-gray-200'
                  } rounded-xl overflow-hidden relative group shrink-0 transition`}
                >
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  {index === 0 && existingImages.length === 0 && (
                    <span className="absolute top-1 left-1 bg-brand-orange text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                      Title
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1.5">
                    {index !== 0 && (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(index)}
                        className="text-[9px] bg-white text-gray-800 px-2 py-1 rounded shadow font-bold hover:bg-orange-50"
                      >
                        Set Title
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removePreviewImage(index)}
                      className="text-[9px] bg-red-500 text-white px-2 py-1 rounded shadow font-bold hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">
              External Video/Product Link (Optional)
            </label>
            <input
              type="text"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              placeholder="Link to Instagram, YouTube, etc..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-orange transition"
            />
          </div>
        </div>

        {/* Card 3: Condition, Delivery, Description & Price */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">
                Condition *
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-brand-orange transition"
              >
                <option value="Brand New">Brand New</option>
                <option value="Foreign Used (Tokunbo)">Foreign Used (Tokunbo)</option>
                <option value="Nigerian Used">Nigerian Used</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">
                Delivery Option
              </label>
              <select
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-brand-orange transition"
              >
                <option value="">Select option</option>
                <option value="Pickup Only">Pickup Only</option>
                <option value="Nationwide Delivery">Nationwide Delivery</option>
                <option value="Pay on Delivery (Local)">Pay on Delivery (Local)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">
              Description *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe item..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-orange transition"
            ></textarea>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">
              Price (₦) *
            </label>
            <input
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 150000"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-lg font-black outline-none focus:border-brand-orange mb-3 text-brand-orange bg-white"
            />
            <p className="text-xs font-bold text-gray-700 mb-2">Are you open to negotiation?</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-700">
                <input
                  type="radio"
                  name="post-negotiable"
                  value="true"
                  checked={isNegotiable === 'true'}
                  onChange={(e) => setIsNegotiable(e.target.value)}
                  className="w-4 h-4 accent-brand-orange"
                />{' '}
                Yes
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-700">
                <input
                  type="radio"
                  name="post-negotiable"
                  value="false"
                  checked={isNegotiable === 'false'}
                  onChange={(e) => setIsNegotiable(e.target.value)}
                  className="w-4 h-4 accent-brand-orange"
                />{' '}
                No
              </label>
            </div>
          </div>
        </div>

        {/* Card 4: Promote your ad (Free Mode Active) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Promote your ad (Optional)</h3>
          <div className="space-y-3">
            <label
              onClick={() => setVipPlan('')}
              className={`block rounded-lg p-4 cursor-pointer flex justify-between items-center transition ${
                vipPlan === ''
                  ? 'border-2 border-brand-orange bg-orange-50'
                  : 'border border-gray-200 hover:border-orange-300'
              }`}
            >
              <div>
                <p
                  className={`font-bold text-sm ${
                    vipPlan === '' ? 'text-orange-800' : 'text-gray-800'
                  }`}
                >
                  Post for Free
                </p>
                <span className="text-[10px] bg-orange-200 text-orange-800 px-2 py-0.5 rounded font-bold">
                  Standard Visibility • ₦0
                </span>
              </div>
              <input
                type="radio"
                name="post-vip"
                value=""
                checked={vipPlan === ''}
                onChange={() => setVipPlan('')}
                className="w-5 h-5 accent-brand-orange"
              />
            </label>

            <label
              onClick={() => setVipPlan('top')}
              className={`block rounded-lg p-4 cursor-pointer flex justify-between items-center transition ${
                vipPlan === 'top'
                  ? 'border-2 border-amber-500 bg-amber-50'
                  : 'border border-gray-200 hover:border-amber-500'
              }`}
            >
              <div>
                <p className="font-bold text-gray-800 text-sm">
                  TOP Promo <span className="text-xs text-amber-600">₦3,499</span>
                </p>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                  7 Days Boost
                </span>
              </div>
              <input
                type="radio"
                name="post-vip"
                value="top"
                checked={vipPlan === 'top'}
                onChange={() => setVipPlan('top')}
                className="w-5 h-5 accent-brand-orange"
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#00b53f] hover:bg-[#009b36] text-white font-bold rounded-xl text-lg shadow-lg shadow-green-500/20 transition flex items-center justify-center disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Next / Save Ad'}
        </button>
      </form>

      {/* --- CUSTOM 3-LEVEL CATEGORY PICKER MODAL --- */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="bg-gray-50 px-4 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-gray-900">
                {activePickerSubcategory
                  ? activePickerSubcategory
                  : activePickerCategory
                  ? activePickerCategory.name
                  : 'Select Category (15 Categories)'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {!activePickerCategory ? (
                categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectMainCategory(c)}
                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-orange-50 border border-transparent hover:border-orange-100 rounded-xl transition text-left"
                  >
                    <span className="flex items-center gap-3 font-bold text-sm text-gray-800">
                      <CategoryIcon
                        iconName={c.icon}
                        categoryName={c.name}
                        className="w-5 h-5 text-brand-orange shrink-0"
                      />
                      <span>{c.name}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                ))
              ) : !activePickerSubcategory ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActivePickerCategory(null)}
                    className="w-full flex items-center gap-2 p-3 text-xs font-bold text-brand-orange bg-orange-50 rounded-lg mb-2 transition hover:bg-orange-100"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Categories
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyCategory(activePickerCategory.id, activePickerCategory.name, '', '')
                    }
                    className="w-full text-left p-4 bg-white hover:bg-gray-50 border-b border-gray-100 text-sm font-bold text-brand-orange transition"
                  >
                    All {activePickerCategory.name}
                  </button>
                  {(activePickerCategory.subcategories || []).map((sub: string, idx: number) => {
                    const hasItems = (SUB_SUB_CATEGORIES[sub] || []).length > 0;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSubcategory(activePickerCategory, sub)}
                        className="w-full flex items-center justify-between text-left p-4 bg-white hover:bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-700 transition"
                      >
                        <span>{sub}</span>
                        {hasItems && <ChevronRight className="w-4 h-4 text-gray-300" />}
                      </button>
                    );
                  })}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setActivePickerSubcategory(null)}
                    className="w-full flex items-center gap-2 p-3 text-xs font-bold text-brand-orange bg-orange-50 rounded-lg mb-2 transition hover:bg-orange-100"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to {activePickerCategory.name}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyCategory(
                        activePickerCategory.id,
                        activePickerCategory.name,
                        activePickerSubcategory,
                        ''
                      )
                    }
                    className="w-full text-left p-4 bg-white hover:bg-gray-50 border-b border-gray-100 text-sm font-bold text-brand-orange transition"
                  >
                    All {activePickerSubcategory}
                  </button>
                  {(SUB_SUB_CATEGORIES[activePickerSubcategory] || []).map((itemType, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        applyCategory(
                          activePickerCategory.id,
                          activePickerCategory.name,
                          activePickerSubcategory,
                          itemType
                        )
                      }
                      className="w-full text-left p-4 bg-white hover:bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-700 transition"
                    >
                      {itemType}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MASSIVE GRID LOCATION MODAL (37 STATES & 774 LGAs) --- */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-0 shadow-2xl relative flex flex-col max-h-[85vh] text-gray-900">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-3 sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="font-bold text-gray-900 flex items-center gap-2 px-2">
                <MapPin className="w-5 h-5 text-brand-orange shrink-0" />
                <span>
                  {activeRegionForLga
                    ? `${activeRegionForLga.name} LGAs`
                    : 'Select Ad Location (37 States • 774 LGAs)'}
                </span>
              </div>
              <div className="relative w-64 sm:w-72">
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  placeholder={
                    activeRegionForLga ? 'Filter LGAs...' : 'Find state (e.g. Kaduna, Lagos)...'
                  }
                  className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-sm outline-none"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-gray-50 rounded-b-2xl">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {!activeRegionForLga ? (
                  filteredRegions.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center bg-white border border-gray-200 hover:border-brand-orange rounded-xl overflow-hidden transition group"
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectState(r)}
                        className="flex-1 text-left px-4 py-3 text-sm font-semibold text-gray-700 group-hover:text-brand-orange truncate"
                      >
                        {r.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadLgas(r)}
                        className="px-3 py-3 text-gray-400 hover:text-brand-orange hover:bg-gray-50 border-l border-gray-100 transition"
                        title="View LGAs"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="col-span-full flex items-center justify-between mb-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRegionForLga(null);
                          setLocationSearch('');
                        }}
                        className="text-xs font-bold text-brand-orange flex items-center gap-1 hover:underline"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back to all states
                      </button>
                      <span className="text-xs font-bold text-gray-500 uppercase">
                        {activeRegionForLga.name} ({filteredSubRegions.length} LGAs)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectState(activeRegionForLga)}
                      className="col-span-full text-left px-4 py-3 text-sm font-bold text-gray-900 bg-orange-50 border border-orange-200 rounded-xl mb-2 flex items-center justify-between"
                    >
                      <span>All {activeRegionForLga.name}</span>
                      <Check className="w-4 h-4 text-brand-orange" />
                    </button>

                    {loadingLgas ? (
                      <div className="col-span-full py-8 text-center text-gray-400 font-medium">
                        Loading LGAs for {activeRegionForLga.name}...
                      </div>
                    ) : (
                      filteredSubRegions.map((sr) => (
                        <button
                          key={sr.id}
                          type="button"
                          onClick={() => handleSelectLga(sr, activeRegionForLga)}
                          className="text-left px-4 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:border-brand-orange hover:text-brand-orange rounded-xl transition flex justify-between items-center"
                        >
                          <span className="truncate">{sr.name}</span>
                          <MapPin className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        </button>
                      ))
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PostAdPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        </div>
      }
    >
      <SellFormContent />
    </Suspense>
  );
}