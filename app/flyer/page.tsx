"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  MessageCircle,
  Upload,
  Check,
  Copy,
  Sparkles,
  ShieldCheck,
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
  Phone,
  PlusCircle,
} from "lucide-react";

const API_URL = "https://ji-africa-backend.onrender.com/api";
const API_BASE = "https://ji-africa-backend.onrender.com";

function resolveImg(pathStr: string) {
  if (!pathStr) return "";
  return pathStr.startsWith("http") || pathStr.startsWith("data:")
    ? pathStr
    : `${API_BASE}${pathStr}`;
}

function getFirstImage(imageField: any): string {
  if (!imageField) return "";
  if (Array.isArray(imageField)) return resolveImg(imageField[0] || "");
  try {
    const parsed = JSON.parse(String(imageField));
    if (Array.isArray(parsed) && parsed[0]) return resolveImg(parsed[0]);
  } catch {}
  return resolveImg(String(imageField));
}

export default function FreeWhatsAppFlyerPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [user, setUser] = useState<any>(null);
  const [myAds, setMyAds] = useState<any[]>([]);
  const [loadingMyAds, setLoadingMyAds] = useState(false);

  // Mode: 'new' (works without registration) vs 'existing' (pick from seller's existing ads)
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [selectedExistingAdId, setSelectedExistingAdId] = useState<number | null>(null);

  // Flyer Form State
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [location, setLocation] = useState("");
  const [condition, setCondition] = useState("Brand New");
  const [phoneOnFlyer, setPhoneOnFlyer] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [jiTrustBadge, setJiTrustBadge] = useState(false);
  const [linkedAdId, setLinkedAdId] = useState<number | null>(null);

  // Publish & Download state (for logged-in users creating a new ad)
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [publishingAndDownloading, setPublishingAndDownloading] = useState(false);

  // Rendered PNG + Share feedback
  const [flyerPngUrl, setFlyerPngUrl] = useState<string>("");
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("ji_token");
    const storedUser = localStorage.getItem("ji_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        if (parsed?.phone) setPhoneOnFlyer(String(parsed.phone));
        if (parsed?.ji_trust_enrolled) setJiTrustBadge(true);
      } catch {}
    }

    // Fetch categories for optional 1-click publish
    fetch(`${API_URL}/categories`)
      .then((r) => r.json())
      .then((cats) => {
        if (Array.isArray(cats) && cats.length > 0) {
          setCategories(cats);
          setSelectedCategoryId(String(cats[0].id));
        }
      })
      .catch(() => {});

    // If logged in, fetch user's existing ads so they can pick one in 1 click
    if (token) {
      setLoadingMyAds(true);
      fetch(`${API_URL}/dashboard/my-ads`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((ads) => {
          if (Array.isArray(ads)) setMyAds(ads);
        })
        .catch(() => {})
        .finally(() => setLoadingMyAds(false));
    }
  }, []);

  const handleSelectExistingAd = (ad: any) => {
    setSelectedExistingAdId(Number(ad.id));
    setLinkedAdId(Number(ad.id));
    setTitle(ad.title || "");
    setPrice(String(ad.price || ""));
    setIsNegotiable(Boolean(ad.is_negotiable));
    setLocation(ad.shop_address || "Nigeria");
    setCondition(ad.condition || "Available");
    setImageDataUrl(getFirstImage(ad.image));
    setJiTrustBadge(Boolean(ad.ji_trust_enabled));
    if (!phoneOnFlyer && (ad.seller_phone || user?.phone)) {
      setPhoneOnFlyer(String(ad.seller_phone || user?.phone || ""));
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageDataUrl(reader.result);
        setLinkedAdId(null);
        setSelectedExistingAdId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const numericPrice = Number(String(price).replace(/[^0-9.]/g, "")) || 0;
  const formattedPrice = numericPrice > 0 ? `₦${numericPrice.toLocaleString("en-NG")}` : "₦0";
  const displayTitle = title.trim() || "Your Product Title Here";
  const displayLocation = location.trim() || "Nigeria";
  const displayPhone = phoneOnFlyer.trim();
  const displayLinkText = linkedAdId ? `ji.africa/ad/${linkedAdId}` : "ji.africa";
  const fullShareUrl = linkedAdId ? `https://www.ji.africa/ad/${linkedAdId}` : "https://www.ji.africa";

  const whatsappCaption = [
    `🔥 *${displayTitle}*`,
    numericPrice > 0
      ? `💰 *Price:* ${formattedPrice}${isNegotiable ? " (Negotiable)" : ""}`
      : "",
    `📍 *Location:* ${displayLocation}`,
    displayPhone ? `📞 *Call / WhatsApp:* ${displayPhone}` : "",
    jiTrustBadge ? "🛡️ *JI Trust Escrow Protected*" : "",
    linkedAdId
      ? `🔗 *View Photos & Order Safely:* ${fullShareUrl}`
      : `✨ *Created free on ji.africa* — Buy & Sell Safely in Nigeria`,
  ]
    .filter(Boolean)
    .join("\n");

  const renderFlyerCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // Dark Charcoal Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "#111827");
    bgGrad.addColorStop(0.55, "#1F2937");
    bgGrad.addColorStop(1, "#0B0F19");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Top Brand Header (Brand Orange #EA580C)
    ctx.fillStyle = "#EA580C";
    ctx.beginPath();
    ctx.roundRect(70, 72, 108, 108, 24);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 64px sans-serif";
    ctx.fillText("ji", 96, 148);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 54px sans-serif";
    ctx.fillText(".africa", 196, 146);

    // Top Right Pill
    if (jiTrustBadge) {
      ctx.fillStyle = "#059669";
      ctx.beginPath();
      ctx.roundRect(620, 88, 390, 76, 38);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "800 28px sans-serif";
      ctx.fillText("🛡️ JI TRUST PROTECTED", 655, 136);
    } else {
      ctx.fillStyle = "#1E293B";
      ctx.beginPath();
      ctx.roundRect(685, 92, 325, 68, 34);
      ctx.fill();
      ctx.fillStyle = "#FB923C";
      ctx.font = "800 26px sans-serif";
      ctx.fillText("VERIFIED LISTING", 725, 135);
    }

    // Product Photo Frame
    const imgX = 70;
    const imgY = 220;
    const imgW = 940;
    const imgH = 880;

    ctx.fillStyle = "#1E293B";
    ctx.beginPath();
    ctx.roundRect(imgX, imgY, imgW, imgH, 36);
    ctx.fill();

    if (imageDataUrl) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject();
          img.src = imageDataUrl;
        });
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(imgX, imgY, imgW, imgH, 36);
        ctx.clip();
        const scale = Math.max(imgW / img.width, imgH / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        ctx.drawImage(
          img,
          imgX + (imgW - drawW) / 2,
          imgY + (imgH - drawH) / 2,
          drawW,
          drawH
        );
        ctx.restore();
      } catch {}
    } else {
      ctx.strokeStyle = "#4B5563";
      ctx.lineWidth = 4;
      ctx.setLineDash([16, 16]);
      ctx.beginPath();
      ctx.roundRect(imgX + 24, imgY + 24, imgW - 48, imgH - 48, 28);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#9CA3AF";
      ctx.font = "700 38px sans-serif";
      ctx.fillText("Upload Product Photo to Preview", 255, imgY + imgH / 2);
    }

    // Price Badge Overlay (Brand Orange #EA580C)
    ctx.fillStyle = "#EA580C";
    ctx.beginPath();
    ctx.roundRect(70, 1140, 940, 136, 28);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 70px sans-serif";
    ctx.fillText(formattedPrice, 110, 1230);

    if (isNegotiable) {
      ctx.fillStyle = "#FEF08A";
      ctx.font = "800 28px sans-serif";
      ctx.fillText("NEGOTIABLE", 765, 1220);
    }

    // Title (up to 2 lines)
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 48px sans-serif";
    const words = displayTitle.split(" ");
    let line1 = "";
    let line2 = "";
    for (const w of words) {
      if ((line1 + " " + w).trim().length <= 32) {
        line1 = (line1 + " " + w).trim();
      } else if ((line2 + " " + w).trim().length <= 32) {
        line2 = (line2 + " " + w).trim();
      }
    }
    ctx.fillText(line1, 75, 1352);
    if (line2) ctx.fillText(line2, 75, 1412);

    // Location & Condition
    ctx.fillStyle = "#D1D5DB";
    ctx.font = "700 32px sans-serif";
    ctx.fillText(`📍 ${displayLocation}   •   ${condition || "Available"}`, 75, 1482);

    // Bold Phone Callout Box
    if (displayPhone) {
      ctx.fillStyle = "#1E293B";
      ctx.strokeStyle = "#EA580C";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(70, 1525, 940, 108, 24);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FB923C";
      ctx.font = "800 26px sans-serif";
      ctx.fillText("CALL / WHATSAPP SELLER:", 110, 1570);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 44px sans-serif";
      ctx.fillText(`📞 ${displayPhone}`, 110, 1616);
    }

    // Bottom Call-To-Action Strip
    ctx.fillStyle = "#25D366";
    ctx.beginPath();
    ctx.roundRect(70, 1670, 940, 145, 28);
    ctx.fill();

    ctx.fillStyle = "#052E16";
    ctx.font = "900 32px sans-serif";
    ctx.fillText(
      linkedAdId ? "ORDER SAFELY ON JI.AFRICA:" : "BUY & SELL SAFELY IN NIGERIA:",
      110,
      1732
    );
    ctx.font = "900 34px sans-serif";
    ctx.fillText(displayLinkText, 110, 1784);

    try {
      setFlyerPngUrl(canvas.toDataURL("image/png"));
    } catch {}
  }, [
    imageDataUrl,
    formattedPrice,
    isNegotiable,
    displayTitle,
    displayLocation,
    condition,
    displayPhone,
    jiTrustBadge,
    linkedAdId,
    displayLinkText,
  ]);

  useEffect(() => {
    renderFlyerCanvas();
  }, [renderFlyerCanvas]);

  const triggerDownload = (urlOverride?: string) => {
    const targetUrl = urlOverride || flyerPngUrl;
    if (!targetUrl) return;
    const a = document.createElement("a");
    a.href = targetUrl;
    a.download = linkedAdId
      ? `ji-africa-flyer-${linkedAdId}.png`
      : `ji-africa-whatsapp-flyer.png`;
    a.click();
  };

  const handlePublishAndDownload = async () => {
    const token = localStorage.getItem("ji_token");
    if (!token || !user) {
      // Save draft in sessionStorage and guide guest to quick login/register or /sell
      try {
        sessionStorage.setItem(
          "ji_flyer_draft",
          JSON.stringify({
            title: title.trim(),
            price: numericPrice,
            location: location.trim(),
            condition,
            phone: phoneOnFlyer.trim(),
            is_negotiable: isNegotiable,
          })
        );
      } catch {}
      router.push("/sell");
      return;
    }

    if (!title.trim() || numericPrice <= 0) {
      setStatusMsg("Please enter a product title and valid price first.");
      return;
    }

    setPublishingAndDownloading(true);
    setStatusMsg("");
    try {
      const res = await fetch(`${API_URL}/ads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          price: numericPrice,
          category_id: Number(selectedCategoryId || categories[0]?.id || 1),
          condition,
          description: `${title.trim()} available in ${displayLocation}. Contact ${displayPhone || user.phone || "seller"} via ji.africa.`,
          shop_address: displayLocation,
          is_negotiable: isNegotiable,
          ji_trust_enabled: jiTrustBadge,
          images: imageDataUrl ? [imageDataUrl] : [],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.adId) {
        const newId = Number(data.adId);
        setLinkedAdId(newId);
        setStatusMsg(`Published live to ji.africa/ad/${newId} & downloading flyer!`);
        setTimeout(() => {
          triggerDownload();
        }, 350);
      } else {
        setStatusMsg(data.error || "Could not publish ad—downloading flyer instead.");
        triggerDownload();
      }
    } catch {
      setStatusMsg("Network error publishing ad—downloading flyer instead.");
      triggerDownload();
    } finally {
      setPublishingAndDownloading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-brand-orange transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>
        <span className="inline-flex items-center gap-1.5 bg-orange-50 text-brand-orange border border-orange-200 px-3 py-1 rounded-full text-[11px] font-black">
          <Sparkles className="w-3.5 h-3.5" /> 100% Free • No Registration Needed
        </span>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-[#25D366]" /> Free WhatsApp Status Flyer Maker
          </h1>
          <p className="text-xs text-gray-300 mt-1 max-w-xl leading-relaxed">
            Design a sharp 1080×1920 WhatsApp Status &amp; Group product flyer in seconds. Choose an existing advert or create a new product flyer with any phone number—completely free.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-gray-950/70 p-1 rounded-xl border border-gray-700 shrink-0">
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`px-3.5 py-2 rounded-lg text-xs font-black transition ${
              mode === "new"
                ? "bg-brand-orange text-white shadow"
                : "text-gray-300 hover:text-white"
            }`}
          >
            New Product Flyer
          </button>
          <button
            type="button"
            onClick={() => setMode("existing")}
            className={`px-3.5 py-2 rounded-lg text-xs font-black transition ${
              mode === "existing"
                ? "bg-brand-orange text-white shadow"
                : "text-gray-300 hover:text-white"
            }`}
          >
            My Existing Ads {myAds.length > 0 ? `(${myAds.length})` : ""}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Existing Ad Selector OR Instant New Flyer Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm space-y-5">
          {mode === "existing" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-gray-900">
                  Select One of Your Existing Adverts
                </h2>
                <button
                  type="button"
                  onClick={() => setMode("new")}
                  className="text-xs font-bold text-brand-orange hover:underline inline-flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Create New Instead
                </button>
              </div>

              {!user ? (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 text-center space-y-3">
                  <p className="text-xs font-bold text-gray-800">
                    Log in to load your existing ji.africa adverts, or create a brand-new flyer right now without an account!
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Link
                      href="/login"
                      className="px-4 py-2 bg-brand-orange text-white rounded-lg text-xs font-black"
                    >
                      Log In to Load My Ads
                    </Link>
                    <button
                      type="button"
                      onClick={() => setMode("new")}
                      className="px-4 py-2 bg-white border border-gray-200 text-gray-800 rounded-lg text-xs font-bold"
                    >
                      Make Free Flyer Without Login
                    </button>
                  </div>
                </div>
              ) : loadingMyAds ? (
                <div className="py-10 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
                </div>
              ) : myAds.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center space-y-2">
                  <p className="text-xs font-bold text-gray-700">
                    You haven&apos;t posted any adverts yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMode("new")}
                    className="px-4 py-2 bg-brand-orange text-white rounded-lg text-xs font-black"
                  >
                    Create New Product Flyer
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                  {myAds.map((ad) => (
                    <button
                      key={ad.id}
                      type="button"
                      onClick={() => handleSelectExistingAd(ad)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition ${
                        selectedExistingAdId === Number(ad.id)
                          ? "border-brand-orange bg-orange-50/70 ring-2 ring-brand-orange/20"
                          : "border-gray-200 hover:border-brand-orange"
                      }`}
                    >
                      <img
                        src={getFirstImage(ad.image) || "https://placehold.co/100x100?text=Ad"}
                        alt={ad.title}
                        className="w-14 h-14 rounded-lg object-cover shrink-0 bg-gray-100"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-gray-900 truncate">{ad.title}</p>
                        <p className="text-xs font-extrabold text-brand-orange mt-0.5">
                          ₦{Number(ad.price || 0).toLocaleString("en-NG")}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {ad.shop_address || "Nigeria"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Product Details & Custom Phone Number (Editable in Both Modes!) */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-2">
              {mode === "existing" ? "Customize Flyer Details & Phone Number" : "Enter Product Details"}
            </h2>

            {/* Photo Upload */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1.5">
                Product Photo *
              </label>
              <label className="flex items-center justify-center gap-2 w-full py-3.5 px-4 border-2 border-dashed border-orange-300 hover:border-brand-orange bg-orange-50/40 rounded-xl cursor-pointer transition">
                <Upload className="w-4 h-4 text-brand-orange" />
                <span className="text-xs font-bold text-gray-800">
                  {imageDataUrl ? "Change Product Photo" : "Tap to Upload Product Photo"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. iPhone 15 Pro Max 256GB"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                  Price (₦) *
                </label>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 1450000"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-brand-orange"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                  Phone / WhatsApp on Flyer *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-brand-orange absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phoneOnFlyer}
                    onChange={(e) => setPhoneOnFlyer(e.target.value)}
                    placeholder="e.g. 08012345678"
                    className="w-full pl-8 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Wuse 2, Abuja"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-brand-orange"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold bg-white outline-none focus:border-brand-orange"
                >
                  <option value="Brand New">Brand New</option>
                  <option value="Foreign Used (Tokunbo)">Foreign Used (Tokunbo)</option>
                  <option value="Nigerian Used">Nigerian Used</option>
                  <option value="Refurbished">Refurbished</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNegotiable}
                    onChange={(e) => setIsNegotiable(e.target.checked)}
                    className="w-4 h-4 accent-brand-orange rounded"
                  />
                  Negotiable
                </label>

                <label className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jiTrustBadge}
                    onChange={(e) => setJiTrustBadge(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  <ShieldCheck className="w-3.5 h-3.5" /> JI Trust Badge
                </label>
              </div>
            </div>

            {statusMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs font-bold">
                {statusMsg}
              </div>
            )}

            {/* Primary & Simultaneous Publish/Download Actions */}
            <div className="pt-2 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => triggerDownload()}
                  disabled={!flyerPngUrl}
                  className="w-full py-3 px-4 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> Download Flyer (Free)
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(whatsappCaption)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle className="w-4 h-4" /> Share to WhatsApp
                </a>
              </div>

              {mode === "new" && !linkedAdId && (
                <button
                  type="button"
                  onClick={handlePublishAndDownload}
                  disabled={publishingAndDownloading}
                  className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition disabled:opacity-60"
                >
                  {publishingAndDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-brand-orange" /> Publishing Ad &amp; Preparing Flyer...
                    </>
                  ) : user ? (
                    <>
                      <Sparkles className="w-4 h-4 text-brand-orange" /> Publish Free Ad on ji.africa &amp; Download Flyer
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-brand-orange" /> Also Post This Ad Free on ji.africa
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Live 1080x1920 WhatsApp Status Flyer Preview */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col items-center space-y-4">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-brand-orange" /> Live Status Preview (1080×1920)
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(whatsappCaption);
                setCopiedCaption(true);
                setTimeout(() => setCopiedCaption(false), 2500);
              }}
              className="text-[11px] font-bold text-brand-orange hover:underline inline-flex items-center gap-1"
            >
              {copiedCaption ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCaption ? "Caption Copied!" : "Copy Caption"}
            </button>
          </div>

          <canvas ref={canvasRef} className="hidden" />
          <div className="w-60 sm:w-64 aspect-[9/16] rounded-2xl overflow-hidden border-2 border-gray-200 shadow-xl bg-gray-900 flex items-center justify-center">
            {flyerPngUrl ? (
              <img
                src={flyerPngUrl}
                alt="Live WhatsApp Status Flyer Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-gray-400 font-bold">Rendering Preview...</span>
            )}
          </div>

          <p className="text-[11px] text-center text-gray-500 leading-relaxed max-w-xs">
            Optimized for <strong>WhatsApp Status</strong>, <strong>WhatsApp Groups</strong>, and <strong>Instagram Stories</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
