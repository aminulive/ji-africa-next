"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Link2,
  Unlink,
  ImagePlus,
  List,
  ListOrdered,
  Quote,
  Code2,
  Eye,
  Upload,
  Loader2,
  ExternalLink,
  X,
  Check,
} from "lucide-react";

interface RichBlogEditorProps {
  value: string;
  onChange: (html: string) => void;
  apiUrl: string;
  getAuthHeaders: () => Record<string, string>;
}

function normalizeInitialHtml(raw: string): string {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return "";
  const hasBlockHtml = /<(h2|h3|p|div|ul|ol|blockquote|figure|img)\b/i.test(trimmed);
  if (hasBlockHtml) return trimmed;
  return trimmed
    .split(/\n{2,}/)
    .map((block) => "<p>" + block.replace(/\n/g, "<br />") + "</p>")
    .join("");
}

function escapeHtmlAttr(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default function RichBlogEditor({
  value,
  onChange,
  apiUrl,
  getAuthHeaders,
}: RichBlogEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const lastEmittedRef = useRef<string>("");

  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [showLinkBar, setShowLinkBar] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkNewTab, setLinkNewTab] = useState(true);

  const [showImageBar, setShowImageBar] = useState(false);
  const [imgUrl, setImgUrl] = useState("");
  const [imgCaption, setImgCaption] = useState("");
  const [imgWidth, setImgWidth] = useState<"full" | "medium">("full");
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [showCtaBar, setShowCtaBar] = useState(false);
  const [ctaLabel, setCtaLabel] = useState("Browse Verified Deals on ji.africa");
  const [ctaUrl, setCtaUrl] = useState("https://www.ji.africa");

  useEffect(() => {
    const normalized = normalizeInitialHtml(value);
    if (editorRef.current && normalized !== lastEmittedRef.current) {
      if (editorRef.current.innerHTML !== normalized) {
        editorRef.current.innerHTML = normalized;
      }
      lastEmittedRef.current = normalized;
    }
  }, [value, mode]);

  const syncFromEditor = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    lastEmittedRef.current = html;
    onChange(html);
  };

  const saveSelection = () => {
    if (typeof window === "undefined") return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  };

  const restoreSelection = () => {
    if (typeof window === "undefined") return;
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  const runExec = (command: string, commandValue?: string) => {
    if (mode !== "visual") return;
    restoreSelection();
    document.execCommand(command, false, commandValue);
    syncFromEditor();
    saveSelection();
  };

  const applyHeadingTag = (tag: "H2" | "H3" | "P") => {
    if (mode !== "visual") return;
    restoreSelection();
    document.execCommand("formatBlock", false, "<" + tag + ">");
    syncFromEditor();
    saveSelection();
  };

  const openLinkPopover = () => {
    saveSelection();
    const sel = typeof window !== "undefined" ? window.getSelection() : null;
    const selectedStr = sel ? sel.toString().trim() : "";
    setLinkText(selectedStr);
    setLinkUrl("https://www.ji.africa/");
    setShowImageBar(false);
    setShowCtaBar(false);
    setShowLinkBar((prev) => !prev);
  };

  const handleApplyLink = () => {
    const cleanHref = linkUrl.trim();
    if (!cleanHref) return;
    const safeHref = /^(https?:\/\/|mailto:|tel:|\/)/i.test(cleanHref)
      ? cleanHref
      : "https://" + cleanHref;
    restoreSelection();
    const sel = typeof window !== "undefined" ? window.getSelection() : null;
    const hasRangeSelection = sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed;
    const targetAttr = linkNewTab ? ' target="_blank" rel="noopener noreferrer"' : "";

    if (hasRangeSelection && sel) {
      const selectedHtml = sel.toString();
      const anchorHtml =
        '<a href="' +
        escapeHtmlAttr(safeHref) +
        '"' +
        targetAttr +
        ">" +
        escapeHtmlAttr(linkText.trim() || selectedHtml) +
        "</a>";
      document.execCommand("insertHTML", false, anchorHtml);
    } else {
      const label = linkText.trim() || safeHref;
      const anchorHtml =
        '<a href="' +
        escapeHtmlAttr(safeHref) +
        '"' +
        targetAttr +
        ">" +
        escapeHtmlAttr(label) +
        "</a> ";
      document.execCommand("insertHTML", false, anchorHtml);
    }

    syncFromEditor();
    setShowLinkBar(false);
    setLinkUrl("");
    setLinkText("");
  };

  const handleUploadInlineImage = async (file: File) => {
    setUploadingImg(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(apiUrl + "/admin/blog/upload-image", {
        method: "POST",
        headers: getAuthHeaders(),
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        setImgUrl(data.url);
      } else {
        setUploadError(data.error || "Image upload failed. You can also paste an image URL.");
      }
    } catch {
      setUploadError("Network error uploading image.");
    } finally {
      setUploadingImg(false);
    }
  };

  const handleInsertImageBlock = () => {
    const cleanSrc = imgUrl.trim();
    if (!cleanSrc) return;
    const safeSrc = escapeHtmlAttr(cleanSrc);
    const safeCap = escapeHtmlAttr(imgCaption.trim());
    const widthClass = imgWidth === "medium" ? "max-w-md mx-auto" : "w-full";

    const figureHtml =
      '<figure class="ji-blog-figure ' +
      widthClass +
      '">' +
      '<img src="' +
      safeSrc +
      '" alt="' +
      (safeCap || "Article section image") +
      '" />' +
      (safeCap ? "<figcaption>" + safeCap + "</figcaption>" : "") +
      "</figure><p><br /></p>";

    if (mode === "html") {
      onChange((value || "") + "\n" + figureHtml);
    } else {
      restoreSelection();
      if (editorRef.current && !editorRef.current.innerHTML.trim()) {
        editorRef.current.innerHTML = figureHtml;
      } else {
        document.execCommand("insertHTML", false, figureHtml);
      }
      syncFromEditor();
    }

    setShowImageBar(false);
    setImgUrl("");
    setImgCaption("");
  };

  const handleInsertCtaButton = () => {
    const label = ctaLabel.trim();
    const href = ctaUrl.trim();
    if (!label || !href) return;
    const safeHref = /^(https?:\/\/|\/)/i.test(href) ? href : "https://" + href;
    const btnHtml =
      '<p><a class="ji-blog-cta" href="' +
      escapeHtmlAttr(safeHref) +
      '" target="_blank" rel="noopener noreferrer">' +
      escapeHtmlAttr(label) +
      "</a></p><p><br /></p>";

    if (mode === "html") {
      onChange((value || "") + "\n" + btnHtml);
    } else {
      restoreSelection();
      document.execCommand("insertHTML", false, btnHtml);
      syncFromEditor();
    }
    setShowCtaBar(false);
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
      {/* WordPress-Style Formatting Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            disabled={mode !== "visual"}
            onMouseDown={(e) => {
              e.preventDefault();
              applyHeadingTag("H2");
            }}
            title="Main Section Heading (H2)"
            className="px-2.5 py-1.5 rounded-lg text-xs font-black bg-white border border-gray-200 text-gray-800 hover:border-brand-orange hover:text-brand-orange disabled:opacity-40 transition"
          >
            H2
          </button>
          <button
            type="button"
            disabled={mode !== "visual"}
            onMouseDown={(e) => {
              e.preventDefault();
              applyHeadingTag("H3");
            }}
            title="Sub-Heading (H3)"
            className="px-2.5 py-1.5 rounded-lg text-xs font-extrabold bg-white border border-gray-200 text-gray-800 hover:border-brand-orange hover:text-brand-orange disabled:opacity-40 transition"
          >
            H3
          </button>
          <button
            type="button"
            disabled={mode !== "visual"}
            onMouseDown={(e) => {
              e.preventDefault();
              applyHeadingTag("P");
            }}
            title="Normal Paragraph Text"
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:border-brand-orange hover:text-brand-orange disabled:opacity-40 transition"
          >
            Paragraph
          </button>

          <span className="h-5 w-px bg-gray-200 mx-1" />

          <button
            type="button"
            disabled={mode !== "visual"}
            onMouseDown={(e) => {
              e.preventDefault();
              runExec("bold");
            }}
            title="Bold"
            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-brand-orange hover:text-brand-orange disabled:opacity-40 transition"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={mode !== "visual"}
            onMouseDown={(e) => {
              e.preventDefault();
              runExec("italic");
            }}
            title="Italic"
            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-brand-orange hover:text-brand-orange disabled:opacity-40 transition"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={mode !== "visual"}
            onMouseDown={(e) => {
              e.preventDefault();
              runExec("underline");
            }}
            title="Underline"
            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-brand-orange hover:text-brand-orange disabled:opacity-40 transition"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          <span className="h-5 w-px bg-gray-200 mx-1" />

          <button
            type="button"
            disabled={mode !== "visual"}
            onMouseDown={(e) => {
              e.preventDefault();
              openLinkPopover();
            }}
            title="Highlight text and click to add link"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white border border-gray-200 text-gray-700 hover:border-brand-orange hover:text-brand-orange disabled:opacity-40 transition"
          >
            <Link2 className="w-3.5 h-3.5 text-brand-orange" /> Link
          </button>
          <button
            type="button"
            disabled={mode !== "visual"}
            onMouseDown={(e) => {
              e.preventDefault();
              runExec("unlink");
            }}
            title="Remove Link"
            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600 disabled:opacity-40 transition"
          >
            <Unlink className="w-3.5 h-3.5" />
          </button>

          <span className="h-5 w-px bg-gray-200 mx-1" />

          <button
            type="button"
            disabled={mode !== "visual"}
            onMouseDown={(e) => {
              e.preventDefault();
              runExec("insertUnorderedList");
            }}
            title="Bullet List"
            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-brand-orange hover:text-brand-orange disabled:opacity-40 transition"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={mode !== "visual"}
            onMouseDown={(e) => {
              e.preventDefault();
              runExec("insertOrderedList");
            }}
            title="Numbered List"
            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-brand-orange hover:text-brand-orange disabled:opacity-40 transition"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={mode !== "visual"}
            onMouseDown={(e) => {
              e.preventDefault();
              runExec("formatBlock", "<BLOCKQUOTE>");
            }}
            title="Highlight Quote / Tip Box"
            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-brand-orange hover:text-brand-orange disabled:opacity-40 transition"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          <span className="h-5 w-px bg-gray-200 mx-1" />

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
              setShowLinkBar(false);
              setShowCtaBar(false);
              setUploadError("");
              setShowImageBar((prev) => !prev);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-black bg-orange-50 border border-orange-200 text-brand-orange hover:bg-orange-100 transition"
          >
            <ImagePlus className="w-3.5 h-3.5" /> Add Image
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
              setShowLinkBar(false);
              setShowImageBar(false);
              setShowCtaBar((prev) => !prev);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white border border-gray-200 text-gray-700 hover:border-brand-orange hover:text-brand-orange transition"
          >
            <ExternalLink className="w-3.5 h-3.5" /> CTA Button
          </button>
        </div>

        {/* Visual vs HTML Code Tab Switcher */}
        <div className="flex items-center bg-gray-200/80 p-0.5 rounded-lg text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setMode("visual")}
            className={
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition " +
              (mode === "visual"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900")
            }
          >
            <Eye className="w-3 h-3" /> Visual
          </button>
          <button
            type="button"
            onClick={() => setMode("html")}
            className={
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition " +
              (mode === "html"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900")
            }
          >
            <Code2 className="w-3 h-3" /> HTML
          </button>
        </div>
      </div>

      {/* Inline Link Insertion Drawer */}
      {showLinkBar && (
        <div className="bg-blue-50/70 border-b border-blue-200 p-3 flex flex-wrap items-end gap-2.5">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">
              Link Text / Selected Phrase
            </label>
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="e.g. Samsung Galaxy A57 listings"
              className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs outline-none focus:border-brand-orange"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">
              Destination URL *
            </label>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://www.ji.africa/..."
              className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-mono outline-none focus:border-brand-orange"
            />
          </div>
          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 pb-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={linkNewTab}
              onChange={(e) => setLinkNewTab(e.target.checked)}
              className="accent-brand-orange"
            />
            New tab
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleApplyLink}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-orange hover:bg-orange-700 text-white rounded-lg text-xs font-black transition"
            >
              <Check className="w-3.5 h-3.5" /> Apply Link
            </button>
            <button
              type="button"
              onClick={() => setShowLinkBar(false)}
              className="p-1.5 text-gray-500 hover:text-gray-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Inline Section Image Uploader Drawer */}
      {showImageBar && (
        <div className="bg-orange-50/80 border-b border-orange-200 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-brand-orange">
              Insert Image at Cursor Position
            </span>
            <button
              type="button"
              onClick={() => setShowImageBar(false)}
              className="text-gray-500 hover:text-gray-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">
                1. Upload Photo (Cloudinary)
              </label>
              <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-dashed border-orange-300 rounded-lg text-xs font-bold text-gray-700 hover:border-brand-orange cursor-pointer transition">
                {uploadingImg ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-orange" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-brand-orange" /> Choose Image File
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingImg}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadInlineImage(f);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">
                Or Paste Image URL
              </label>
              <input
                type="text"
                value={imgUrl}
                onChange={(e) => setImgUrl(e.target.value)}
                placeholder="https://res.cloudinary.com/..."
                className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg text-xs font-mono outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">
                Caption / Alt Text (SEO)
              </label>
              <input
                type="text"
                value={imgCaption}
                onChange={(e) => setImgCaption(e.target.value)}
                placeholder="e.g. Samsung Galaxy A57 camera comparison"
                className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg text-xs outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          {uploadError && <p className="text-[11px] font-bold text-red-600">{uploadError}</p>}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-gray-600">Size:</span>
              <button
                type="button"
                onClick={() => setImgWidth("full")}
                className={
                  "px-2.5 py-1 rounded-md font-bold border " +
                  (imgWidth === "full"
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-200")
                }
              >
                Full Width
              </button>
              <button
                type="button"
                onClick={() => setImgWidth("medium")}
                className={
                  "px-2.5 py-1 rounded-md font-bold border " +
                  (imgWidth === "medium"
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-200")
                }
              >
                Centered Medium
              </button>
            </div>

            <button
              type="button"
              disabled={!imgUrl.trim() || uploadingImg}
              onClick={handleInsertImageBlock}
              className="px-4 py-2 bg-brand-orange hover:bg-orange-700 disabled:opacity-40 text-white rounded-lg text-xs font-black transition"
            >
              Insert Image into Article
            </button>
          </div>
        </div>
      )}

      {/* Inline CTA Button Builder Drawer */}
      {showCtaBar && (
        <div className="bg-emerald-50/80 border-b border-emerald-200 p-3 flex flex-wrap items-end gap-2.5">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">
              Button Label
            </label>
            <input
              type="text"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs outline-none focus:border-brand-orange"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">
              Button Link URL
            </label>
            <input
              type="text"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-mono outline-none focus:border-brand-orange"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleInsertCtaButton}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition"
            >
              Insert CTA Button
            </button>
            <button
              type="button"
              onClick={() => setShowCtaBar(false)}
              className="p-1.5 text-gray-500 hover:text-gray-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Editable Area (Visual WYSIWYG or HTML Code) */}
      {mode === "visual" ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncFromEditor}
          onBlur={() => {
            saveSelection();
            syncFromEditor();
          }}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          data-placeholder="Write your article here... Highlight any text to format as H2, H3, Bold, or add a Link, or click Add Image to insert photos between sections."
          className="ji-blog-prose min-h-[340px] max-h-[650px] overflow-y-auto p-5 text-sm md:text-base text-gray-800 leading-relaxed outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none"
        />
      ) : (
        <textarea
          rows={15}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="<h2>Section Heading</h2><p>Paragraph with <a href='https://www.ji.africa'>linked text</a>...</p>"
          className="w-full p-4 font-mono text-xs text-gray-800 bg-gray-950/5 outline-none"
        />
      )}

      <div className="bg-gray-50 border-t border-gray-100 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
        <span>
          Tip: Highlight any heading and click <strong>H2</strong> or <strong>H3</strong>, highlight any word/phrase and click <strong>Link</strong>, or click <strong>Add Image</strong> anywhere.
        </span>
        <span className="font-semibold text-gray-600">
          {value.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length} words
        </span>
      </div>

      <style jsx global>{`
        .ji-blog-prose h2 {
          font-size: 1.5rem;
          font-weight: 900;
          color: #111827;
          margin-top: 1.75rem;
          margin-bottom: 0.75rem;
          line-height: 1.3;
        }
        .ji-blog-prose h3 {
          font-size: 1.2rem;
          font-weight: 800;
          color: #1f2937;
          margin-top: 1.35rem;
          margin-bottom: 0.5rem;
          line-height: 1.35;
        }
        .ji-blog-prose p {
          margin-bottom: 0.9rem;
          line-height: 1.75;
        }
        .ji-blog-prose a {
          color: #ea580c;
          font-weight: 700;
          text-decoration: underline;
        }
        .ji-blog-prose ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .ji-blog-prose ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .ji-blog-prose blockquote {
          border-left: 4px solid #ea580c;
          background: rgba(255, 237, 213, 0.45);
          padding: 0.75rem 1rem;
          margin: 1rem 0;
          border-radius: 0 0.75rem 0.75rem 0;
          font-style: italic;
        }
        .ji-blog-prose figure.ji-blog-figure {
          margin: 1.5rem 0;
          border-radius: 0.875rem;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        .ji-blog-prose figure.ji-blog-figure img {
          width: 100%;
          max-height: 460px;
          object-fit: cover;
          display: block;
        }
        .ji-blog-prose figure.ji-blog-figure figcaption {
          padding: 0.5rem 0.75rem;
          font-size: 0.75rem;
          color: #6b7280;
          text-align: center;
          font-style: italic;
        }
        .ji-blog-prose a.ji-blog-cta {
          display: inline-block;
          background: #ea580c;
          color: #ffffff !important;
          text-decoration: none !important;
          font-weight: 800;
          font-size: 0.85rem;
          padding: 0.65rem 1.25rem;
          border-radius: 0.75rem;
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  );
}
