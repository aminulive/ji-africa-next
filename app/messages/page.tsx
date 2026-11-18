"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  ShieldCheck,
  FileEdit,
  ArrowLeft,
  CheckCircle2,
  Package,
  Clock,
  X,
  Loader2,
  ExternalLink,
  Search,
} from "lucide-react";

const API_URL = "https://ji-africa-backend.onrender.com/api";

function getThumb(imgField: any) {
  if (!imgField) return "https://placehold.co/120x120/fff7ed/c2410c?text=ji";
  try {
    const parsed = JSON.parse(imgField);
    const first = Array.isArray(parsed) ? parsed[0] : imgField;
    if (first) return first.startsWith("http") ? first : `https://ji-africa-backend.onrender.com${first}`;
  } catch {
    if (typeof imgField === "string") {
      return imgField.startsWith("http") ? imgField : `https://ji-africa-backend.onrender.com${imgField}`;
    }
  }
  return "https://placehold.co/120x120/fff7ed/c2410c?text=ji";
}

function MessagesWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialThreadId = searchParams.get("thread");

  const [user, setUser] = useState<any>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [threadFilter, setThreadFilter] = useState("");
  const [activeThreadId, setActiveThreadId] = useState<number | null>(
    initialThreadId ? Number(initialThreadId) : null
  );
  const [activeThread, setActiveThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [msgInput, setMsgInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [toast, setToast] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Per-Buyer Custom Quote Builder Modal (Seller Only)
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteUnitPrice, setQuoteUnitPrice] = useState("");
  const [quoteQuantity, setQuoteQuantity] = useState("1");
  const [quoteSpecs, setQuoteSpecs] = useState("");
  const [quoteDescription, setQuoteDescription] = useState("");
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // JI Trust Escrow Checkout Modal for Custom Quote (Buyer Only)
  const [checkoutQuote, setCheckoutQuote] = useState<any>(null);
  const [trustBuyerName, setTrustBuyerName] = useState("");
  const [trustBuyerPhone, setTrustBuyerPhone] = useState("");
  const [trustDeliveryAddr, setTrustDeliveryAddr] = useState("");
  const [startingTrust, setStartingTrust] = useState(false);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4200);
  };

  const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("ji_token") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const stored = localStorage.getItem("ji_user");
    const token = localStorage.getItem("ji_token");
    if (!stored || !token) {
      localStorage.setItem("ji_redirect_after_login", "/messages");
      router.push("/login");
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      setTrustBuyerName(parsed.full_name || "");
      setTrustBuyerPhone(parsed.phone || "");
    } catch {
      router.push("/login");
    }
  }, [router]);

  const loadThreads = useCallback(async () => {
    const token = localStorage.getItem("ji_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/chat/threads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.threads || [];
        setThreads(list);
        window.dispatchEvent(new Event("ji_chat_updated"));
        if (!activeThreadId && list.length > 0 && typeof window !== "undefined" && window.innerWidth >= 1024) {
          setActiveThreadId(Number(list[0].id));
        }
      }
    } catch {}
    setLoadingThreads(false);
  }, [activeThreadId]);

  const loadThreadDetails = useCallback(async (tId: number, silent = false) => {
    const token = localStorage.getItem("ji_token");
    if (!token || !tId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(`${API_URL}/chat/threads/${tId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveThread(data.thread || null);
        setMessages(data.messages || []);
        setQuotes(data.quotes || []);
        window.dispatchEvent(new Event("ji_chat_updated"));
      }
    } catch {}
    if (!silent) setLoadingMessages(false);
  }, []);

  useEffect(() => {
    if (user) loadThreads();
  }, [user, loadThreads]);

  useEffect(() => {
    if (user && activeThreadId) {
      loadThreadDetails(activeThreadId, false);
      const interval = setInterval(() => {
        loadThreadDetails(activeThreadId, true);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [user, activeThreadId, loadThreadDetails]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Verify Paystack JI Trust callback when returning from custom quote payment
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const trustRef = params.get("trust_ref") || params.get("reference");
    const isDemo = params.get("demo") === "1";
    if (!trustRef || !trustRef.startsWith("JITRUST_")) return;

    const token = localStorage.getItem("ji_token");
    fetch(
      `${API_URL}/trust/verify/${encodeURIComponent(trustRef)}${isDemo ? "?demo=1" : ""}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.status === "funded") {
          notify("JI Trust Escrow Funded! Seller has been notified to ship your custom order.");
          window.dispatchEvent(new Event("ji_notifications_updated"));
          if (activeThreadId) loadThreadDetails(activeThreadId, true);
        }
        const cleanUrl = activeThreadId ? `/messages?thread=${activeThreadId}` : "/messages";
        window.history.replaceState({}, "", cleanUrl);
      })
      .catch(() => {});
  }, [activeThreadId, loadThreadDetails]);

  const myId = Number(user?.id || user?.userId || 0);
  const isSeller = activeThread && Number(activeThread.seller_id) === myId;
  const isBuyer = activeThread && Number(activeThread.buyer_id) === myId;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || !activeThreadId || sendingMsg) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`${API_URL}/chat/threads/${activeThreadId}/messages`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ body: msgInput.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setMsgInput("");
        loadThreads();
      } else {
        notify(data.error || "Failed to send message");
      }
    } catch {
      notify("Network error sending message");
    } finally {
      setSendingMsg(false);
    }
  };

  const openQuoteModal = () => {
    if (!activeThread) return;
    const latestQuote = quotes[0];
    setQuoteUnitPrice(
      String(latestQuote ? latestQuote.unit_price : activeThread.ad_price || "")
    );
    setQuoteQuantity(String(latestQuote ? latestQuote.quantity || 1 : 1));
    setQuoteSpecs(
      latestQuote?.specifications ||
        [activeThread.ad_brand, activeThread.ad_condition].filter(Boolean).join(" • ")
    );
    setQuoteDescription(latestQuote?.description || "");
    setShowQuoteModal(true);
  };

  const handleCreateCustomQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    const unit = Number(quoteUnitPrice);
    const qty = Math.max(1, Math.round(Number(quoteQuantity || 1)));
    if (!unit || unit <= 0) {
      notify("Please enter a valid unit price in Naira");
      return;
    }
    setSubmittingQuote(true);
    try {
      const res = await fetch(`${API_URL}/chat/threads/${activeThreadId}/quote`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          unit_price: unit,
          quantity: qty,
          specifications: quoteSpecs.trim(),
          description: quoteDescription.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        notify("Custom order quote sent to buyer & logged for JI Trust!");
        setShowQuoteModal(false);
        await loadThreadDetails(Number(activeThreadId), true);
        loadThreads();
      } else {
        notify(data.error || "Failed to create custom quote");
      }
    } catch {
      notify("Network error creating custom quote");
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handlePayCustomQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutQuote || !activeThread) return;
    if (!trustBuyerName.trim() || !trustBuyerPhone.trim()) {
      notify("Your full name and phone number are required");
      return;
    }
    setStartingTrust(true);
    try {
      const res = await fetch(`${API_URL}/trust/initialize`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          ad_id: activeThread.ad_id,
          quote_id: checkoutQuote.id,
          buyer_name: trustBuyerName.trim(),
          buyer_phone: trustBuyerPhone.trim(),
          delivery_address: trustDeliveryAddr.trim(),
          return_path: "messages",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        notify(data.error || "Could not initialize JI Trust payment");
      }
    } catch {
      notify("Network error initializing JI Trust payment");
    } finally {
      setStartingTrust(false);
    }
  };

  const filteredThreads = threads.filter((t) => {
    if (!threadFilter.trim()) return true;
    const q = threadFilter.toLowerCase();
    return (
      String(t.ad_title || "").toLowerCase().includes(q) ||
      String(t.buyer_name || "").toLowerCase().includes(q) ||
      String(t.seller_name || "").toLowerCase().includes(q) ||
      String(t.seller_shop_name || "").toLowerCase().includes(q)
    );
  });

  const quotesById = new Map<number, any>(quotes.map((q) => [Number(q.id), q]));
  const calculatedQuoteTotal =
    Math.max(0, Number(quoteUnitPrice || 0)) * Math.max(1, Math.round(Number(quoteQuantity || 1)));

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-brand-orange shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-brand-orange" /> Messages &amp; Custom Order Quotes
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Negotiate directly, issue per-buyer order quotes without changing public ads, and pay safely with JI Trust Escrow.
          </p>
        </div>
        <Link
          href="/dashboard/seller?tab=messages"
          className="text-xs font-black text-brand-orange hover:underline"
        >
          View Full Quote Ledger in Dashboard &rarr;
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[70vh]">
        {/* LEFT PANE: CONVERSATIONS LIST */}
        <div
          className={`lg:col-span-4 border-r border-gray-200 flex flex-col ${
            activeThreadId ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="p-3.5 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={threadFilter}
                onChange={(e) => setThreadFilter(e.target.value)}
                placeholder="Search chats by item or person..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loadingThreads ? (
              <div className="p-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand-orange" /> Loading conversations...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-xs font-bold text-gray-700">No conversations yet</p>
                <p className="text-[11px] text-gray-500">
                  Open any listing on ji.africa and tap <strong>Chat with Seller</strong> to start negotiating.
                </p>
                <Link
                  href="/"
                  className="inline-block mt-2 px-4 py-2 bg-brand-orange text-white rounded-xl text-xs font-black"
                >
                  Browse Marketplace
                </Link>
              </div>
            ) : (
              filteredThreads.map((t) => {
                const amSeller = Number(t.seller_id) === myId;
                const partnerName = amSeller
                  ? t.buyer_name || "Buyer"
                  : t.seller_shop_name || t.seller_name || "Seller";
                const isSelected = Number(t.id) === Number(activeThreadId);

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveThreadId(Number(t.id))}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition hover:bg-orange-50/50 ${
                      isSelected ? "bg-orange-50/80 border-l-4 border-brand-orange" : ""
                    }`}
                  >
                    <img
                      src={getThumb(t.ad_image)}
                      alt={t.ad_title || "Listing"}
                      className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-black text-gray-900 truncate">{partnerName}</p>
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">
                          {amSeller ? "Buyer" : "Seller"}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-brand-orange truncate mt-0.5">
                        {t.ad_title} • ₦{Number(t.ad_price || 0).toLocaleString("en-NG")}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-[11px] text-gray-500 truncate">
                          {t.last_message || "Open conversation"}
                        </p>
                        {Number(t.unread_count) > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-brand-orange text-white text-[10px] font-black shrink-0">
                            {t.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: ACTIVE CHAT & PER-BUYER QUOTE WORKSPACE */}
        <div
          className={`lg:col-span-8 flex flex-col ${
            !activeThreadId ? "hidden lg:flex" : "flex"
          }`}
        >
          {!activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <MessageSquare className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-600">Select a conversation to view messages</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                Sellers can issue customized per-buyer order quotes right inside any chat without changing the public listing price.
              </p>
            </div>
          ) : (
            <>
              {/* Thread Top Header */}
              <div className="p-3.5 sm:p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setActiveThreadId(null)}
                    className="lg:hidden p-1.5 rounded-lg bg-white border border-gray-200 text-gray-700"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <img
                    src={getThumb(activeThread.ad_image)}
                    alt={activeThread.ad_title}
                    className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-black text-gray-900 truncate">
                        {isSeller
                          ? `Buyer: ${activeThread.buyer_name}`
                          : `Seller: ${activeThread.seller_shop_name || activeThread.seller_name}`}
                      </p>
                      <Link
                        href={`/ad/${activeThread.ad_id}`}
                        className="text-[11px] font-bold text-brand-orange hover:underline inline-flex items-center gap-0.5 shrink-0"
                      >
                        Ad <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">
                      {activeThread.ad_title} (Public Price: ₦{Number(activeThread.ad_price || 0).toLocaleString("en-NG")})
                    </p>
                  </div>
                </div>

                {/* Seller-Only Custom Order / Quote Update Button */}
                {isSeller && (
                  <button
                    type="button"
                    onClick={openQuoteModal}
                    className="px-3.5 py-2 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs shrink-0"
                  >
                    <FileEdit className="w-3.5 h-3.5" /> Update Order / Quote
                  </button>
                )}
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/40 max-h-[54vh]">
                {loadingMessages ? (
                  <div className="py-12 text-center text-xs text-gray-400">Loading messages...</div>
                ) : (
                  messages.map((m) => {
                    const isMine = Number(m.sender_id) === myId;
                    const linkedQuote = m.quote_id ? quotesById.get(Number(m.quote_id)) : null;

                    if (m.message_type === "escrow_funded") {
                      return (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>{m.body}</span>
                        </div>
                      );
                    }

                    if (m.message_type === "quote" && linkedQuote) {
                      const isPending = linkedQuote.status === "pending";
                      const isPaid = linkedQuote.status === "paid_in_escrow";
                      return (
                        <div
                          key={m.id}
                          className="my-2 p-4 rounded-2xl bg-white border-2 border-brand-orange/40 shadow-sm space-y-2.5 max-w-lg mx-auto"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-brand-orange">
                              <Package className="w-3.5 h-3.5" /> Custom Order Quote #{linkedQuote.id}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                isPaid
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isPending
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {isPaid
                                ? "Paid in JI Trust Escrow"
                                : isPending
                                ? "Active Quote"
                                : "Superseded"}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-orange-50/60 border border-orange-100 text-xs">
                            <div>
                              <p className="text-[10px] text-gray-500 font-bold uppercase">Unit Price</p>
                              <p className="font-black text-gray-900">
                                ₦{Number(linkedQuote.unit_price || 0).toLocaleString("en-NG")}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 font-bold uppercase">Quantity</p>
                              <p className="font-black text-gray-900">{linkedQuote.quantity || 1} item(s)</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 font-bold uppercase">Order Total</p>
                              <p className="font-black text-brand-orange text-sm">
                                ₦{Number(linkedQuote.total_amount || 0).toLocaleString("en-NG")}
                              </p>
                            </div>
                          </div>

                          {linkedQuote.specifications && (
                            <div className="text-xs">
                              <span className="font-black text-gray-700">Agreed Specifications: </span>
                              <span className="text-gray-600">{linkedQuote.specifications}</span>
                            </div>
                          )}

                          {linkedQuote.description && (
                            <div className="text-xs">
                              <span className="font-black text-gray-700">Order Terms &amp; Notes: </span>
                              <span className="text-gray-600 whitespace-pre-line">{linkedQuote.description}</span>
                            </div>
                          )}

                          <p className="text-[10px] text-gray-400">
                            Private buyer quote • Public listing price remains ₦
                            {Number(activeThread.ad_price || 0).toLocaleString("en-NG")}
                          </p>

                          {/* Buyer Pay via JI Trust Escrow Button */}
                          {isBuyer && isPending && (
                            <div className="pt-1">
                              {activeThread.ji_trust_enabled ? (
                                <button
                                  type="button"
                                  onClick={() => setCheckoutQuote(linkedQuote)}
                                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
                                >
                                  <ShieldCheck className="w-4 h-4" /> Pay ₦
                                  {Number(linkedQuote.total_amount || 0).toLocaleString("en-NG")} Safely with JI Trust Escrow
                                </button>
                              ) : (
                                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-semibold">
                                  Ask the seller to enable JI Trust Escrow in their Seller Profile to pay this quote via escrow.
                                </div>
                              )}
                            </div>
                          )}

                          {linkedQuote.escrow_reference && (
                            <div className="text-[11px] font-bold text-emerald-700">
                              Escrow Ref: {linkedQuote.escrow_reference}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[82%] sm:max-w-[70%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                            isMine
                              ? "bg-brand-orange text-white rounded-br-sm"
                              : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                          }`}
                        >
                          <p className="whitespace-pre-line">{m.body}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 px-1 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-gray-200 bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  placeholder="Write a message to negotiate price, quantity, or delivery..."
                  className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-orange"
                />
                <button
                  type="submit"
                  disabled={sendingMsg || !msgInput.trim()}
                  className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 disabled:opacity-50"
                >
                  {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-brand-orange" />}
                  <span>Send</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* SELLER MODAL: PER-BUYER ORDER / QUOTE UPDATE */}
      {showQuoteModal && activeThread && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCustomQuote}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900">
                Update Order Quote for {activeThread.buyer_name}
              </h3>
              <button
                type="button"
                onClick={() => setShowQuoteModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-[11px] text-orange-950 leading-relaxed">
              <strong>Buyer-Specific Quote:</strong> Adjusting price, quantity, or specifications here applies <strong>only to {activeThread.buyer_name}</strong> for JI Trust Escrow payment and will <strong>not</strong> modify your public listing.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Unit Price (₦) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quoteUnitPrice}
                  onChange={(e) => setQuoteUnitPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-black outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  No. of Items (Qty) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quoteQuantity}
                  onChange={(e) => setQuoteQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-black outline-none focus:border-brand-orange"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gray-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300">Total Escrow Quote Amount</span>
              <span className="text-lg font-black text-amber-400">
                ₦{calculatedQuoteTotal.toLocaleString("en-NG")}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Agreed Item Specifications
              </label>
              <input
                type="text"
                value={quoteSpecs}
                onChange={(e) => setQuoteSpecs(e.target.value)}
                placeholder="e.g. Black, 16GB RAM / 512GB SSD, Brand New Sealed"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Order Description / Delivery &amp; Warranty Terms
              </label>
              <textarea
                rows={3}
                value={quoteDescription}
                onChange={(e) => setQuoteDescription(e.target.value)}
                placeholder="e.g. Includes free waybill delivery to Abuja within 24 hours + 7-day replacement warranty."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:border-brand-orange"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowQuoteModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingQuote}
                className="px-5 py-2.5 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5"
              >
                {submittingQuote ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Send Custom Quote to Buyer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BUYER MODAL: PAY CUSTOM QUOTE VIA JI TRUST ESCROW */}
      {checkoutQuote && activeThread && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form
            onSubmit={handlePayCustomQuote}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> JI Trust Escrow Checkout
              </h3>
              <button
                type="button"
                onClick={() => setCheckoutQuote(null)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1 text-xs">
              <p className="font-black text-emerald-950">
                Custom Quote #{checkoutQuote.id}: {activeThread.ad_title}
              </p>
              <p className="text-emerald-800">
                {checkoutQuote.quantity} × ₦{Number(checkoutQuote.unit_price).toLocaleString("en-NG")} ={" "}
                <strong className="text-sm">
                  ₦{Number(checkoutQuote.total_amount).toLocaleString("en-NG")}
                </strong>
              </p>
              {checkoutQuote.specifications && (
                <p className="text-[11px] text-emerald-900">Specs: {checkoutQuote.specifications}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Your Full Name *</label>
              <input
                type="text"
                required
                value={trustBuyerName}
                onChange={(e) => setTrustBuyerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Your Phone Number *</label>
              <input
                type="tel"
                required
                value={trustBuyerPhone}
                onChange={(e) => setTrustBuyerPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Delivery Address / Pickup Waybill Location
              </label>
              <input
                type="text"
                value={trustDeliveryAddr}
                onChange={(e) => setTrustDeliveryAddr(e.target.value)}
                placeholder="e.g. Wuse 2, Abuja"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={startingTrust}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm"
            >
              {startingTrust ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Proceed to Paystack Escrow (₦{Number(checkoutQuote.total_amount).toLocaleString("en-NG")})
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-xs text-gray-400">Loading chat workspace...</div>}>
      <MessagesWorkspace />
    </Suspense>
  );
}
