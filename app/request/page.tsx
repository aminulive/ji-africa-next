"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Megaphone,
  ShieldCheck,
  MapPin,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

const API_URL = "https://ji-africa-backend.onrender.com/api";

function BuyerRequestFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") || "";

  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [quota, setQuota] = useState<any>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [subRegions, setSubRegions] = useState<any[]>([]);
  const [loadingLgas, setLoadingLgas] = useState(false);

  // Form Fields
  const [title, setTitle] = useState(initialQuery);
  const [categoryId, setCategoryId] = useState("");
  const [conditionPref, setConditionPref] = useState("Any");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [urgency, setUrgency] = useState("This Week");
  const [locationScope, setLocationScope] = useState<"nigeria" | "state" | "lga">("nigeria");
  const [regionId, setRegionId] = useState("");
  const [subRegionId, setSubRegionId] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedRequest, setSubmittedRequest] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("ji_token");
    const rawUser = localStorage.getItem("ji_user");
    if (token && rawUser) {
      try {
        setUser(JSON.parse(rawUser));
      } catch {}
    }
    setAuthChecked(true);

    Promise.all([
      fetch(`${API_URL}/categories`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_URL}/locations/countries/1/regions`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([cats, regs]) => {
        if (Array.isArray(cats)) {
          cats.sort((a: any, b: any) => (Number(a.display_order) || 99) - (Number(b.display_order) || 99));
          setCategories(cats);
        }
        if (Array.isArray(regs)) {
          regs.sort((a: any, b: any) => a.name.localeCompare(b.name));
          setRegions(regs);
        }
      })
      .catch(() => {});

    if (token) {
      fetch(`${API_URL}/buyer-requests/quota`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((q) => {
          if (q) setQuota(q);
        })
        .catch(() => {});
    }
  }, []);

  const handleRegionChange = async (nextRegionId: string) => {
    setRegionId(nextRegionId);
    setSubRegionId("");
    setSubRegions([]);
    if (!nextRegionId) return;
    setLoadingLgas(true);
    try {
      const res = await fetch(`${API_URL}/locations/regions/${nextRegionId}/sub-regions`);
      const list = res.ok ? await res.json() : [];
      if (Array.isArray(list)) {
        list.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setSubRegions(list);
      }
    } catch {
      setSubRegions([]);
    } finally {
      setLoadingLgas(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleLoginRedirect = () => {
    localStorage.setItem("ji_redirect_after_login", "/request");
    router.push("/login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("ji_token");
    if (!token) {
      handleLoginRedirect();
      return;
    }

    if (title.trim().length < 4) {
      setError("Please enter the exact item or product you are looking for (at least 4 characters).");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (description.trim().length < 15) {
      setError("Please add detailed specifications (at least 15 characters) so verified sellers can quote accurately.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (locationScope === "state" && !regionId) {
      setError("Please select the State where you need this item.");
      return;
    }
    if (locationScope === "lga" && (!regionId || !subRegionId)) {
      setError("Please select both the State and specific LGA.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      if (categoryId) fd.append("category_id", categoryId);
      fd.append("condition_pref", conditionPref);
      if (budgetMin) fd.append("budget_min", budgetMin);
      if (budgetMax) fd.append("budget_max", budgetMax);
      fd.append("urgency", urgency);
      fd.append("location_scope", locationScope);
      if (locationScope !== "nigeria" && regionId) fd.append("region_id", regionId);
      if (locationScope === "lga" && subRegionId) fd.append("sub_region_id", subRegionId);
      fd.append("description", description.trim());
      if (imageFile) fd.append("image", imageFile);

      const res = await fetch(`${API_URL}/buyer-requests`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSubmittedRequest(data.request || { title });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(data.error || "Could not submit your Buyer Request.");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setError("Network error submitting your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (submittedRequest) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <div className="bg-white rounded-2xl border border-emerald-200 p-8 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Buyer Request Sent to Verified Merchants!</h1>
          <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
            Your request for <strong className="text-gray-900">&ldquo;{submittedRequest.title}&rdquo;</strong> has been broadcast to matching <strong>Verified Merchants</strong>. You will receive an alert the moment a seller sends a quote.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-3">
            <Link
              href="/dashboard/seller?tab=my-requests"
              className="px-5 py-3 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-xs font-black transition shadow-sm"
            >
              Track Quotes in My Requests
            </Link>
            <Link
              href="/"
              className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-16 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-brand-orange"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>
        {user && (
          <Link
            href="/dashboard/seller?tab=my-requests"
            className="text-xs font-black text-brand-orange hover:underline"
          >
            View My Requests &rarr;
          </Link>
        )}
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-[11px] font-black uppercase tracking-wider mb-3">
          <Megaphone className="w-3.5 h-3.5" /> Verified Merchant Sourcing
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Submit a Buyer Request
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 mt-2 max-w-2xl leading-relaxed">
          Tell us the exact item you need and choose whether to reach verified merchants across <strong>All of Nigeria</strong>, a <strong>Specific State</strong>, or a <strong>Single LGA</strong>. Only verified sellers can respond with quotes.
        </p>

        {quota && (
          <div className="mt-4 inline-flex flex-wrap items-center gap-3 bg-white/10 px-3.5 py-2 rounded-xl text-xs">
            <span className="font-bold text-orange-200">
              Daily Quota: <strong>{quota.dailyRemaining} of {quota.dailyLimit}</strong> remaining today
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-200">
              Active Open Requests: <strong>{quota.activeOpen}/{quota.maxOpen}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Anti-Spam Gate: Not Logged In */}
      {!user ? (
        <div className="bg-white rounded-2xl border border-orange-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-gray-900">Sign In to Submit a Buyer Request</h2>
          <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
            To protect verified merchants from spam and fake leads, only registered and email-verified buyers can submit sourcing requests.
          </p>
          <button
            type="button"
            onClick={handleLoginRedirect}
            className="px-6 py-3 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-xs font-black transition shadow-sm"
          >
            Sign In / Create Free Account
          </button>
        </div>
      ) : quota && !quota.isEmailVerified ? (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-sm font-black text-amber-950">Email Verification Required</h2>
              <p className="text-xs text-amber-900 leading-relaxed">
                Your account must have a verified email address before submitting Buyer Requests. Verify your email in 30 seconds on your Profile page, then return here.
              </p>
              <div className="pt-2">
                <Link
                  href="/profile"
                  className="inline-block px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-black"
                >
                  Verify Email in Profile &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Exact Item / Product */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-2">
              1. Exact Item &amp; Specifications
            </h2>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                What exact item/product are you looking for? *
              </label>
              <input
                type="text"
                required
                maxLength={140}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Clean Foreign Used Toyota Camry 2018 XLE or iPhone 15 Pro Max 256GB"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium outline-none focus:border-brand-orange"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Product Category *
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-3 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:border-brand-orange"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Preferred Condition
                </label>
                <select
                  value={conditionPref}
                  onChange={(e) => setConditionPref(e.target.value)}
                  className="w-full px-3.5 py-3 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:border-brand-orange"
                >
                  <option value="Any">Any Condition</option>
                  <option value="Brand New">Brand New (Sealed)</option>
                  <option value="Foreign Used (Tokunbo)">Foreign Used (Tokunbo)</option>
                  <option value="Nigerian Used">Nigerian Used</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Min Budget (₦ Optional)
                </label>
                <input
                  type="number"
                  min={0}
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  placeholder="e.g. 500000"
                  className="w-full px-3.5 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Max Budget (₦ Optional)
                </label>
                <input
                  type="number"
                  min={0}
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  placeholder="e.g. 850000"
                  className="w-full px-3.5 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  How Soon Do You Need It?
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full px-3.5 py-3 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:border-brand-orange"
                >
                  <option value="Urgent (Within 48h)">Urgent (Within 48h)</option>
                  <option value="This Week">This Week</option>
                  <option value="Within 2 Weeks">Within 2 Weeks</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Detailed Requirements &amp; Specs *
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specify exact model, year, storage/RAM, color, quantity, or inspection/delivery expectations (minimum 15 characters)..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          {/* 2. Target Region Scope */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-orange" /> 2. Merchant Broadcast Location
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "nigeria",
                  title: "All of Nigeria",
                  desc: "Reach verified sellers nationwide",
                },
                {
                  id: "state",
                  title: "All of State",
                  desc: "Target sellers in a specific State",
                },
                {
                  id: "lga",
                  title: "Particular LGA",
                  desc: "Pinpoint a single local council",
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLocationScope(opt.id as any)}
                  className={`p-3.5 rounded-xl border-2 text-left transition ${
                    locationScope === opt.id
                      ? "border-brand-orange bg-orange-50/50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="text-xs font-black text-gray-900">{opt.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            {(locationScope === "state" || locationScope === "lga") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Select State *
                  </label>
                  <select
                    required
                    value={regionId}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    className="w-full px-3.5 py-3 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:border-brand-orange"
                  >
                    <option value="">Choose State</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {locationScope === "lga" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Select Local Government Area (LGA) *
                    </label>
                    <select
                      required
                      disabled={!regionId || loadingLgas}
                      value={subRegionId}
                      onChange={(e) => setSubRegionId(e.target.value)}
                      className="w-full px-3.5 py-3 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:border-brand-orange disabled:opacity-50"
                    >
                      <option value="">
                        {loadingLgas ? "Loading LGAs..." : "Choose LGA"}
                      </option>
                      {subRegions.map((sr) => (
                        <option key={sr.id} value={sr.id}>
                          {sr.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Optional Reference Image */}
          <div className="space-y-3">
            <h2 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-2">
              3. Reference Sample Photo (Optional)
            </h2>
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Reference preview"
                  className="w-32 h-32 object-cover rounded-xl border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview("");
                  }}
                  className="absolute -top-2 -right-2 p-1 bg-gray-900 text-white rounded-full shadow"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 hover:border-brand-orange rounded-xl cursor-pointer text-xs font-bold text-gray-600 hover:text-brand-orange transition">
                <Upload className="w-4 h-4" />
                <span>Attach a photo of the exact item/model you want (Optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Anti-Spam & Privacy Assurance */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-[11px] text-emerald-950 space-y-1 leading-relaxed">
              <p className="font-black">Anti-Spam &amp; Phone Privacy Protection Active</p>
              <p>
                Your phone number stays hidden until a <strong>Verified Merchant</strong> submits a genuine quote. Maximum <strong>8 merchant quotes</strong> per request, and requests auto-expire after <strong>14 days</strong>.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || (quota && quota.dailyRemaining <= 0)}
            className="w-full py-3.5 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Broadcasting to Verified Merchants...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Submit Buyer Request
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function BuyerRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        </div>
      }
    >
      <BuyerRequestFormContent />
    </Suspense>
  );
}
