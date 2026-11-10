"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Heart, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useTemplateLikes } from "./use-template-likes";
import { ZoomablePreview } from "./zoomable-preview";

export function TemplatePreview({
  title,
  editorHref,
  reactionKey,
  onClose,
  children,
}: {
  title: string;
  editorHref: string;
  reactionKey: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const path = usePathname();
  const reduce = useReducedMotion();
  const likes = useTemplateLikes(reactionKey);
  const [guestHint, setGuestHint] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function doubleTap() {
    if (!likes.state?.signedIn) {
      setGuestHint(Boolean(likes.state));
      return false;
    }
    void likes.react(true);
    return true;
  }

  return (
    <dialog
      ref={ref}
      className="template-lightbox reaction-lightbox"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <motion.div
        className="template-lightbox-shell"
        initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="template-lightbox-header">
          <div>
            <p className="eyebrow">Template preview</p>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button
            type="button"
            className="template-icon-button"
            onClick={() => ref.current?.close()}
            aria-label="Close preview"
            autoFocus
          >
            <X size={20} />
          </button>
        </header>
        <ZoomablePreview onDoubleTap={doubleTap}>{children}</ZoomablePreview>
        <div className="preview-social">
          {likes.state?.signedIn ? (
            <button
              type="button"
              className="preview-like-button"
              aria-label={likes.liked ? "Remove like" : "Like template"}
              aria-pressed={likes.liked}
              disabled={likes.busy}
              onClick={() => void likes.react(!likes.liked)}
            >
              <Heart size={20} fill={likes.liked ? "currentColor" : "none"} />
            </button>
          ) : (
            likes.state && (
              <Link
                className="preview-like-button"
                href={"/login?next=" + encodeURIComponent(path)}
                aria-label="Sign in to like"
                onClick={() => ref.current?.close()}
              >
                <Heart size={20} />
              </Link>
            )
          )}
          <span className="preview-like-count" aria-live="polite">
            {likes.count === null
              ? likes.failed
                ? "Likes unavailable"
                : "Loading likes…"
              : new Intl.NumberFormat("en-IN").format(likes.count) +
                (likes.count === 1 ? " like" : " likes")}
          </span>
          {likes.failed && likes.state && (
            <span role="status">Couldn’t update likes. Try again.</span>
          )}
          {guestHint && <span role="status">Sign in to leave a like.</span>}
          {!guestHint && (
            <span className="preview-gesture-hint">
              {likes.state?.signedIn
                ? "Double-tap to like · Pinch to zoom"
                : "Pinch to zoom"}
            </span>
          )}
        </div>
        <footer className="template-lightbox-actions">
          <Link
            href={editorHref}
            className="button button-dark"
            onClick={() => ref.current?.close()}
          >
            Edit this template <ArrowUpRight size={17} />
          </Link>
        </footer>
      </motion.div>
    </dialog>
  );
}
