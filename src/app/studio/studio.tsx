"use client";
import Link from "next/link";
import { SiteFooter } from "@/components/site-chrome";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Bookmark,
  Clapperboard,
  FileImage,
  Trash2,
  Upload,
} from "lucide-react";
import { SiteHeader } from "@/components/site";
import { starterMemes, type MemeTemplate } from "@/data/memes";
type Draft = {
  id: string;
  templateId: string;
  name: string;
  url: string;
  updatedAt: string;
  source?: string;
};
type VideoTemplate = { id: string; name: string; posterUrl: string };
type Removed = { key: string; draft: Draft };
function readArray<T>(key: string, valid: (value: unknown) => value is T): T[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value.filter(valid) : [];
  } catch {
    return [];
  }
}
function isDraft(value: unknown): value is Draft {
  return (
    !!value &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "string" &&
    "templateId" in value &&
    typeof value.templateId === "string" &&
    "name" in value &&
    typeof value.name === "string"
  );
}
function isString(value: unknown): value is string {
  return typeof value === "string";
}
function isTemplate(value: unknown): value is MemeTemplate {
  return (
    !!value &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "url" in value &&
    typeof value.url === "string"
  );
}
export default function StudioPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]),
    [videoDrafts, setVideoDrafts] = useState<Draft[]>([]),
    [savedIds, setSavedIds] = useState<string[]>([]),
    [memes, setMemes] = useState<MemeTemplate[]>(starterMemes),
    [videos, setVideos] = useState<VideoTemplate[]>([]),
    [removed, setRemoved] = useState<Removed | null>(null),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const refresh = () => {
      setDrafts(readArray("mim-drafts", isDraft));
      setVideoDrafts(readArray("mim-video-drafts", isDraft));
      setSavedIds(readArray("mim-bookmarks", isString));
    };
    refresh();
    fetch("/api/memes?limit=100")
      .then((r) => r.json())
      .then((data) => {
        const base = Array.isArray(data.memes)
          ? data.memes.filter(isTemplate)
          : starterMemes;
        setMemes(
          Array.from(
            new Map(
              [...base, ...readArray("mim-bookmark-templates", isTemplate)].map(
                (m) => [m.id, m],
              ),
            ).values(),
          ),
        );
      })
      .catch(() =>
        setMemes([
          ...starterMemes,
          ...readArray("mim-bookmark-templates", isTemplate),
        ]),
      );
    fetch("/api/video-templates?limit=100&sort=popular")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.templates)) setVideos(data.templates);
      })
      .catch(() => undefined);
    window.addEventListener("storage", refresh);
    window.addEventListener("mim-bookmarks-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("mim-bookmarks-updated", refresh);
    };
  }, []);
  function removeDraft(key: string, draft: Draft) {
    try {
      const list = readArray(key, isDraft).filter((d) => d.id !== draft.id);
      localStorage.setItem(key, JSON.stringify(list));
      (key === "mim-drafts" ? setDrafts : setVideoDrafts)(list);
      setRemoved({ key, draft });
      setNotice("Draft removed.");
    } catch {
      setNotice(
        "This browser could not update your drafts. Check site storage and try again.",
      );
    }
  }
  function undo() {
    if (!removed) return;
    try {
      const list = [
        removed.draft,
        ...readArray(removed.key, isDraft).filter(
          (d) => d.id !== removed.draft.id,
        ),
      ];
      localStorage.setItem(removed.key, JSON.stringify(list));
      (removed.key === "mim-drafts" ? setDrafts : setVideoDrafts)(list);
      setRemoved(null);
      setNotice("Draft restored.");
    } catch {
      setNotice(
        "Could not restore the draft. Free some site storage and try Undo again.",
      );
    }
  }
  function unsave(id: string) {
    try {
      const next = savedIds.filter((item) => item !== id);
      localStorage.setItem("mim-bookmarks", JSON.stringify(next));
      setSavedIds(next);
      window.dispatchEvent(new Event("mim-bookmarks-updated"));
    } catch {
      setNotice(
        "Could not update bookmarks. Check site storage and try again.",
      );
    }
  }
  const savedMemes = memes.filter((m) => savedIds.includes(m.id));
  const date = (raw: string) => {
    const value = new Date(raw);
    return Number.isNaN(value.getTime())
      ? "Saved on this device"
      : new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(value);
  };
  return (
    <main id="main-content" tabIndex={-1} className="paper-noise">
      <SiteHeader />
      <section className="page-hero">
        <div className="container studio-header">
          <div>
            <h1>
              Your <span>studio.</span>
            </h1>
            <p>
              Half-finished punchlines. Favourite formats. All right here on
              this device.
            </p>
          </div>
          <Link href="/explore" className="button button-dark">
            Make something new <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
      <div className="container studio-local-banner">
        <Bookmark size={18} />
        <p>
          Saved in this browser. Your drafts do not sync across devices.
          Clearing site data removes them.
        </p>
        <Link href="/create/upload" className="text-link">
          <Upload size={16} /> Start with an image
        </Link>
      </div>
      {[
        {
          title: "Image drafts",
          items: drafts,
          key: "mim-drafts",
          route: "/create/",
          href: "/explore",
          icon: FileImage,
        },
        {
          title: "Video drafts",
          items: videoDrafts,
          key: "mim-video-drafts",
          route: "/video-editor/",
          href: "/video-templates",
          icon: Clapperboard,
        },
      ].map((group) => (
        <section className="section" key={group.key}>
          <div className="container">
            <div className="section-head">
              <h2 className="section-title">{group.title}</h2>
              <p className="section-note">
                {group.items.length} saved on this device
              </p>
            </div>
            {group.items.length ? (
              <div className="template-grid">
                {group.items.map((d) => (
                  <article className="draft-card" key={d.id}>
                    <div className="draft-preview">
                      {d.url ? (
                        <Image width={600} height={400} src={d.url} alt={d.name} loading="lazy" />
                      ) : (
                        <group.icon size={32} />
                      )}
                    </div>
                    <h3 className="draft-title">{d.name}</h3>
                    <p className="draft-date">{date(d.updatedAt)}</p>
                    <div className="draft-actions">
                      <Link
                        href={
                          group.route +
                          encodeURIComponent(d.templateId) +
                          "?draft=" +
                          encodeURIComponent(d.id) +
                          (d.source === "indian" ? "&source=indian" : "")
                        }
                        className="button button-dark button-small"
                      >
                        Continue editing <ArrowUpRight size={15} />
                      </Link>
                      <button
                        className="button button-paper button-small"
                        onClick={() => removeDraft(group.key, d)}
                        aria-label={"Delete " + d.name + " draft"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <group.icon size={30} />
                <h3>No {group.title.toLowerCase()} yet.</h3>
                <p>
                  Open an editor and choose Save to studio. Your next idea will
                  be waiting here.
                </p>
                <Link href={group.href} className="text-link">
                  Find a format <ArrowUpRight size={17} />
                </Link>
              </div>
            )}
          </div>
        </section>
      ))}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">Saved formats</h2>
            <p className="section-note">
              The bookmark button keeps the good ones close.
            </p>
          </div>
          {savedIds.length ? (
            <div className="template-grid">
              {savedMemes.map((m) => (
                <article className="draft-card" key={m.id}>
                  <div className="draft-preview">
                    <Image width={600} height={400} src={m.url} alt={m.name} loading="lazy" />
                  </div>
                  <h3 className="draft-title">{m.name}</h3>
                  <div className="draft-actions">
                    <Link
                      className="button button-dark button-small"
                      href={
                        "/create/" +
                        encodeURIComponent(m.id) +
                        (m.source === "indian" ||
                        m.source === "indianmemetemplates"
                          ? "?source=indian"
                          : "")
                      }
                    >
                      Use template <ArrowUpRight size={15} />
                    </Link>
                    <button
                      className="button button-paper button-small"
                      onClick={() => unsave(m.id)}
                      aria-label={"Remove " + m.name + " bookmark"}
                    >
                      <Bookmark size={16} />
                    </button>
                  </div>
                </article>
              ))}
              {savedIds
                .filter((id) => id.startsWith("video:"))
                .map((id) => {
                  const v = videos.find((v) => v.id === id.slice(6));
                  return (
                    <article key={id} className="draft-card">
                      <div className="draft-preview">
                        {v?.posterUrl ? (
                          <Image width={600} height={400} src={v.posterUrl} alt={v.name} loading="lazy" />
                        ) : (
                          <Clapperboard size={32} />
                        )}
                      </div>
                      <h3 className="draft-title">
                        {v?.name ?? "Saved video template"}
                      </h3>
                      <div className="draft-actions">
                        <Link
                          href={
                            "/video-editor/" + encodeURIComponent(id.slice(6))
                          }
                          className="button button-dark button-small"
                        >
                          Use template <ArrowUpRight size={15} />
                        </Link>
                        <button
                          className="button button-paper button-small"
                          onClick={() => unsave(id)}
                          aria-label="Remove video bookmark"
                        >
                          <Bookmark size={16} />
                        </button>
                      </div>
                    </article>
                  );
                })}
            </div>
          ) : (
            <div className="empty-state">
              <Bookmark size={30} />
              <h3>Your next favourite is out there.</h3>
              <p>Bookmark an image or video template to bring it here.</p>
              <Link href="/explore" className="text-link">
                Browse templates <ArrowUpRight size={17} />
              </Link>
            </div>
          )}
        </div>
      </section>
      {notice && (
        <div className="storage-notice" role="status">
          <span>{notice}</span>
          {removed && <button onClick={undo}>Undo</button>}
          <button
            aria-label="Dismiss notification"
            onClick={() => {
              setNotice("");
              setRemoved(null);
            }}
          >
            Close
          </button>
        </div>
      )}
      <SiteFooter />
    </main>
  );
}
