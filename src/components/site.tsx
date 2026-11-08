"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Bookmark, ExternalLink, Menu, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { MemeTemplate } from "@/data/memes";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className={compact ? "brand-lockup brand-lockup-compact" : "brand-lockup"}
      aria-label="Meme Is Mine home"
    >
      <Image width={218} height={54}
        src={compact ? "/mim-mark.svg" : "/meme-is-mine-logo.svg"}
        alt=""
        className={compact ? "brand-mark" : "brand-full-logo"}
      />
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
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
              aria-current={pathname === link.href ? "page" : undefined}
              className={
                pathname === link.href ? "nav-link active" : "nav-link"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="header-quiet" href="/studio">
            Studio
          </Link>
          <Link className="button button-dark header-cta" href="/explore">
            Make a meme <ArrowUpRight size={15} />
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
            >
              {link.label}
            </Link>
          ))}
          <Link href="/studio" onClick={() => setOpen(false)}>
            Your studio
          </Link>
          <Link href="/about" onClick={() => setOpen(false)}>
            About Raj
          </Link>
          <Link href="/faq" onClick={() => setOpen(false)}>
            FAQ
          </Link>
          <Link href="/contact" onClick={() => setOpen(false)}>
            Contact
          </Link>
          <Link href="/privacy" onClick={() => setOpen(false)}>
            Privacy
          </Link>
          <Link href="/create/upload" onClick={() => setOpen(false)}>
            Upload your own
          </Link>
        </nav>
      )}
    </header>
  );
}

const BOOKMARKS_KEY = "mim-bookmarks";
export function MemeCard({
  meme,
  index = 0,
  onSeen,
}: {
  meme: MemeTemplate;
  index?: number;
  onSeen?: (id: string) => void;
}) {
  const reduce = useReducedMotion();
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
      className="meme-card"
      initial={false}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      onViewportEnter={() => onSeen?.(meme.id)}
      transition={{
        duration: 0.42,
        delay: Math.min(index % 5, 4) * 0.045,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={reduce ? undefined : { opacity: 0.94 }}
    >
      <div className="meme-card-link">
        <Link
          href={editorHref}
          className="meme-card-image-link"
          aria-label={`Make a meme with ${meme.name}`}
        >
          <div className="meme-card-image">
            <Image
              src={meme.url}
              alt={meme.name}
              width={meme.width}
              height={meme.height}
              loading={index < 4 ? "eager" : "lazy"}
            />
            <span className="card-open">
              <ArrowUpRight size={15} />
            </span>
          </div>
        </Link>
        <div className="meme-card-meta">
          <div>
            <Link href={editorHref} className="meme-card-name-link">
              <p className="meme-card-name">{meme.name}</p>
            </Link>
            <span className="meme-card-category">
              {meme.category ?? "Meme format"}
            </span>
          </div>
          <div className="meme-card-actions">
            {linksToImgflip && (
              <a
                className="source-link-button"
                href="https://imgflip.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Open image source site"
                title="Open image source site"
              >
                <ExternalLink size={14} />
              </a>
            )}
            <button
              className={saved ? "save-button is-saved" : "save-button"}
              type="button"
              onClick={toggleSaved}
              aria-label={
                saved ? "Remove from saved templates" : "Save template"
              }
              aria-pressed={saved}
            >
              <Bookmark
                size={17}
                fill={saved ? "currentColor" : "none"}
                strokeWidth={1.8}
              />
            </button>
          </div>
        </div>
      </div>
      {saveError && <p className="control-help" role="alert">{saveError}</p>}
    </motion.article>
  );
}
