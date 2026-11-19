"use client";

import { getAdUrl } from '../lib/adUrl';
import { useState, useEffect, useRef } from "react";
import { Download, Copy, MessageCircle, Check, X, ShieldCheck } from "lucide-react";

const API_BASE = "https://ji-africa-backend.onrender.com";

function resolveImg(path: string) {
  if (!path) return "";
  return path.startsWith("http") || path.startsWith("data:")
    ? path
    : `${API_BASE}${path}`;
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

export default function WhatsAppShareFlyerModal({
  ad,
  sellerPhoneFallback,
  onClose,
}: {
  ad: any;
  sellerPhoneFallback?: string;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [flyerDataUrl, setFlyerDataUrl] = useState<string>("");
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const adUrl = getAdUrl(ad);
  const formattedPrice = "₦" + Number(ad.price || 0).toLocaleString("en-NG");
  const locationText = ad.shop_address || "Nigeria";
  const sellerPhone = String(ad.seller_phone || sellerPhoneFallback || "").trim();

  const whatsappGroupCaption = [
    `🔥 *${ad.title}*`,
    `💰 *Price:* ${formattedPrice}${ad.is_negotiable ? " (Negotiable)" : ""}`,
    `📍 *Location:* ${locationText}`,
    sellerPhone ? `📞 *Call / WhatsApp:* ${sellerPhone}` : "",
    ad.ji_trust_enabled ? "🛡️ *JI Trust Escrow Protected* (Pay safely on delivery)" : "",
    `🔗 *View Photos & Order Here:* ${adUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappDirectShareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappGroupCaption)}`;

  useEffect(() => {
    let cancelled = false;

    async function renderFlyer() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = 1080;
      const H = 1920;
      canvas.width = W;
      canvas.height = H;

      // Crisp Dark Slate/Charcoal Background (Zero Brown Tones)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, "#111827");
      bgGrad.addColorStop(0.55, "#1F2937");
      bgGrad.addColorStop(1, "#0B0F19");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Top Brand Header Bar (Platform Brand Orange #EA580C)
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

      // JI Trust Badge Pill (Top Right)
      if (ad.ji_trust_enabled) {
        ctx.fillStyle = "#059669";
        ctx.beginPath();
        ctx.roundRect(620, 88, 390, 76, 38);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 28px sans-serif";
        ctx.fillText("🛡️ JI TRUST PROTECTED", 655, 136);
      }

      // Product Photo Frame
      const imgX = 70;
      const imgY = 220;
      const imgW = 940;
      const imgH = 880;

      ctx.fillStyle = "#374151";
      ctx.beginPath();
      ctx.roundRect(imgX, imgY, imgW, imgH, 36);
      ctx.fill();

      const imgSrc = getFirstImage(ad.image);
      if (imgSrc) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject();
            img.src = imgSrc;
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
      }

      // Price Badge Overlay (Platform Brand Orange #EA580C)
      ctx.fillStyle = "#EA580C";
      ctx.beginPath();
      ctx.roundRect(70, 1140, 940, 136, 28);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 70px sans-serif";
      ctx.fillText(formattedPrice, 110, 1230);

      if (ad.is_negotiable) {
        ctx.fillStyle = "#FEF08A";
        ctx.font = "800 28px sans-serif";
        ctx.fillText("NEGOTIABLE", 765, 1220);
      }

      // Advert Title (up to 2 lines)
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 48px sans-serif";
      const words = String(ad.title || "Item for Sale").split(" ");
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
      ctx.fillText(`📍 ${locationText}   •   ${ad.condition || "Available"}`, 75, 1482);

      // Bold Seller Phone Callout Banner
      if (sellerPhone) {
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
        ctx.fillText(`📞 ${sellerPhone}`, 110, 1616);
      }

      // Bottom Call-To-Action Strip
      ctx.fillStyle = "#25D366";
      ctx.beginPath();
      ctx.roundRect(70, 1670, 940, 145, 28);
      ctx.fill();

      ctx.fillStyle = "#052E16";
      ctx.font = "900 32px sans-serif";
      ctx.fillText("ORDER SAFELY ON JI.AFRICA:", 110, 1732);
      ctx.font = "900 34px sans-serif";
      ctx.fillText(adUrl.replace("https://www.", ""), 110, 1784);

      if (!cancelled) {
        try {
          setFlyerDataUrl(canvas.toDataURL("image/png"));
        } catch {}
      }
    }

    renderFlyer();
    return () => {
      cancelled = true;
    };
  }, [ad, adUrl, formattedPrice, locationText, sellerPhone]);

  const handleDownloadFlyer = () => {
    if (!flyerDataUrl) return;
    const a = document.createElement("a");
    a.href = flyerDataUrl;
    a.download = `ji-africa-status-${ad.id}.png`;
    a.click();
  };

  const handleCopyCaption = () => {
    navigator.clipboard?.writeText(whatsappGroupCaption);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(adUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-gray-200 text-gray-900">
        <div className="p-4 bg-[#075E54] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#25D366]" />
            <div>
              <h3 className="font-black text-sm">WhatsApp Status &amp; Group Kit</h3>
              <p className="text-[11px] text-emerald-100">
                Download your branded Status flyer or post directly to WhatsApp Groups
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-100 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 items-center max-h-[82vh] overflow-y-auto">
          <div className="flex flex-col items-center">
            <canvas ref={canvasRef} className="hidden" />
            <div className="w-48 aspect-[9/16] rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg bg-gray-900 flex items-center justify-center">
              {flyerDataUrl ? (
                <img
                  src={flyerDataUrl}
                  alt="WhatsApp Status Flyer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-orange-200 font-bold">Generating Flyer...</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleDownloadFlyer}
              disabled={!flyerDataUrl}
              className="mt-3 w-full max-w-[210px] py-2.5 px-3 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Download Status Flyer
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                Ready-to-Post WhatsApp Group / Status Caption
              </label>
              <textarea
                readOnly
                rows={7}
                value={whatsappGroupCaption}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-medium leading-relaxed outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyCaption}
                className="py-2.5 px-3 bg-orange-50 hover:bg-orange-100 text-brand-orange border border-orange-200 rounded-xl font-bold flex items-center justify-center gap-1.5 transition"
              >
                {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedText ? "Caption Copied!" : "Copy Caption"}
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold flex items-center justify-center gap-1.5 transition"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? "Link Copied!" : "Copy Ad Link"}
              </button>
            </div>

            <a
              href={whatsappDirectShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition"
            >
              <MessageCircle className="w-4 h-4" /> Send to WhatsApp Contacts / Groups
            </a>

            {ad.ji_trust_enabled && (
              <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-start gap-1.5">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Buyers clicking your link from WhatsApp can pay immediately via <strong>JI Trust Escrow</strong>.
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
