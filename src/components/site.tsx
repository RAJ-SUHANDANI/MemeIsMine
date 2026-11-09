"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Bookmark, Maximize2, Menu, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import type { MemeTemplate } from "@/data/memes";

import { TemplatePreview } from "./template-preview";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className={compact ? "brand-lockup brand-lockup-compact" : "brand-lockup"}
      aria-label="Meme Is Mine home"
    >
      <Image
        width={218}
        height={54}
        src={compact ? "/mim-mark.svg" : "/meme-is-mine-logo.svg"}
        alt=""
        className={compact ? "brand-mark" : "brand-full-logo"}
      />
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const currentNavPath = pathname === "/templates" ? "/explore" : pathname;
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/account", { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => setSignedIn(data.signedIn === true))
      .catch(() => undefined);
    return () => controller.abort();
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuRef.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  const links = [
    { href: "/explore", label: "Image templates" },
    { href: "/video-templates", label: "Video templates" },
    { href: "/studio", label: "Studio" },
    { href: "/how-it-works", label: "How it works" },
  ];
  return (
    <header className="site-header">
      <div className="header-inner">
        <BrandLogo />
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={currentNavPath === link.href ? "page" : undefined}
              className={
                currentNavPath === link.href ? "nav-link active" : "nav-link"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link
            className="header-quiet header-account"
            href={signedIn ? "/account" : "/login"}
          >
            {signedIn ? "Account" : "Sign in"}
          </Link>
          <Link className="button button-dark header-cta" href="/explore">
            Browse memes <ArrowUpRight size={15} />
          </Link>
        </div>
        <button
          ref={menuRef}
          className="mobile-menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          className="mobile-nav"
          aria-label="Mobile navigation"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={currentNavPath === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/create/upload" onClick={() => setOpen(false)}>
            Upload your own
          </Link>
          <div className="mobile-nav-account">
            <Link
              href={signedIn ? "/account" : "/login"}
              onClick={() => setOpen(false)}
            >
              {signedIn ? "Your account" : "Sign in"}
            </Link>
            {!signedIn && (
              <Link href="/signup" onClick={() => setOpen(false)}>
                Create an account
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

const BOOKMARKS_KEY = "mim-bookmarks";
const CARD_IMAGE_SIZES =
  "(max-width: 369px) 90vw, (max-width: 739px) 45vw, (max-width: 1099px) 30vw, 23vw";

export function MemeCard({
  meme,
  index = 0,
}: {
  meme: MemeTemplate;
  index?: number;
}) {
  const reduce = useReducedMotion();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  useEffect(() => {
    try {
      const ids: string[] = JSON.parse(
        localStorage.getItem(BOOKMARKS_KEY) ?? "[]",
      );
      setSaved(ids.includes(meme.id));
    } catch {
      /* Ignore malformed local data. */
    }
  }, [meme.id]);
  function toggleSaved(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    try {
      const ids: string[] = JSON.parse(
        localStorage.getItem(BOOKMARKS_KEY) ?? "[]",
      );
      const next = ids.includes(meme.id)
        ? ids.filter((id) => id !== meme.id)
        : [...ids, meme.id];
      const raw = JSON.parse(
        localStorage.getItem("mim-bookmark-templates") ?? "[]",
      );
      const metadata = Array.isArray(raw)
        ? raw.filter((item) => item && item.id !== meme.id)
        : [];
      localStorage.setItem(
        "mim-bookmark-templates",
        JSON.stringify(next.includes(meme.id) ? [...metadata, meme] : metadata),
      );
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
      setSaved(next.includes(meme.id));
      setSaveError("");
      window.dispatchEvent(new Event("mim-bookmarks-updated"));
    } catch {
      setSaveError("Could not save. Check browser storage and try again.");
    }
  }
  const editorHref =
    meme.source === "indian" || meme.source === "indianmemetemplates"
      ? "/create/" + encodeURIComponent(meme.id) + "?source=indian"
      : "/create/" + meme.id;
  const hasDrakePanels = meme.id === "181913649";
  const linksToImgflip = (() => {
    try {
      return (
        meme.url.startsWith("/templates/") ||
        new URL(meme.url).hostname === "i.imgflip.com"
      );
    } catch {
      return false;
    }
  })();
  return (
    <motion.article
      className="format-card"
      initial={false}
      layout={reduce ? false : "position"}
      transition={{ layout: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } }}
    >
      <div
        className="format-card-art"
        style={
          {
            "--art-ratio": hasDrakePanels
              ? 2
              : Math.min(2, Math.max(0.6, meme.width / meme.height || 1)),
          } as CSSProperties
        }
      >
        <button
          type="button"
          className="format-preview-trigger"
          aria-haspopup="dialog"
          aria-label={`Preview ${meme.name}`}
          onClick={() => setPreviewOpen(true)}
        >
          <span className="format-card-frame" aria-hidden="true">
            {hasDrakePanels ? (
              <span className="format-card-diptych">
                {["top", "bottom"].map((panel) => (
                  <span
                    className="format-card-panel"
                    data-panel={panel}
                    key={panel}
                  >
                    <Image
                      src={meme.url}
                      alt=""
                      fill
                      sizes={CARD_IMAGE_SIZES}
                      loading={index < 3 ? "eager" : "lazy"}
                    />
                  </span>
                ))}
              </span>
            ) : (
              <Image
                className="format-card-image"
                src={meme.url}
                alt=""
                fill
                sizes={CARD_IMAGE_SIZES}
                loading={index < 3 ? "eager" : "lazy"}
              />
            )}
          </span>
          <span className="object-spec" aria-hidden="true">
            <span>{meme.category}</span>
            <span>
              {meme.width} × {meme.height}
            </span>
          </span>
          <span className="format-preview-label format-card-preview-label">
            <Maximize2 size={14} /> Preview
          </span>
        </button>
      </div>
      <div className="format-card-body">
        <div className="format-card-heading">
          <span>{meme.category ?? "Meme format"}</span>
          <h3>
            <Link href={editorHref}>{meme.name}</Link>
          </h3>
        </div>
        <div className="format-card-actions">
          <Link
            href={editorHref}
            className="format-card-edit"
            aria-label={`Edit template: ${meme.name}`}
          >
            Edit template <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="format-bookmark template-icon-button"
            onClick={toggleSaved}
            aria-label={saved ? "Remove from saved templates" : "Save template"}
            aria-pressed={saved}
          >
            <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      {saveError && (
        <p className="control-help" role="alert">
          {saveError}
        </p>
      )}
      {previewOpen && (
        <TemplatePreview
          title={meme.name}
          reactionKey={"image:" + (meme.likeId ?? meme.id)}
          editorHref={editorHref}
          sourceHref={linksToImgflip ? "https://imgflip.com" : meme.originalUrl}
          onClose={() => setPreviewOpen(false)}
        >
          <Image
            className="template-preview-image"
            src={meme.url}
            alt={meme.name}
            width={meme.width}
            height={meme.height}
          />
        </TemplatePreview>
      )}
    </motion.article>
  );
}
