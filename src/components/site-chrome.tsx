import Link from "next/link";
import {
  ArrowUpRight,
  Clapperboard,
  Images,
  LayoutGrid,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "./site";

const footerGroups = [
  {
    name: "Create",
    links: [
      ["Image templates", "/explore"],
      ["Video templates", "/video-templates"],
      ["Your studio", "/studio"],
    ],
  },
  {
    name: "Account",
    links: [
      ["Your account", "/account"],
      ["Create an account", "/signup"],
    ],
  },
  {
    name: "Help",
    links: [
      ["How it works", "/how-it-works"],
      ["FAQ", "/faq"],
      ["Contact", "/contact"],
      ["Privacy", "/privacy"],
      ["About", "/about"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer shared-footer">
      <div className="container shared-footer-grid">
        <div className="shared-footer-brand">
          <BrandLogo />
          <p>Find the format. Make it yours.</p>
        </div>
        {footerGroups.map((group) => (
          <nav key={group.name} aria-label={group.name + " footer links"}>
            <h2>{group.name}</h2>
            {group.links.map(([label, href]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className="container shared-footer-bottom">
        <span>Meme Is Mine</span>
        <Link href="/explore">
          Find a template <ArrowUpRight size={14} />
        </Link>
      </div>
    </footer>
  );
}

export function LibraryNav({
  kind,
  newOnly,
  onNewChange,
}: {
  kind: "image" | "video";
  newOnly: boolean;
  onNewChange: (active: boolean) => void;
}) {
  return (
    <aside className="library-side">
      <nav aria-label="Template library">
        <p className="eyebrow">The library</p>
        {kind === "image" ? (
          <button
            type="button"
            aria-pressed={!newOnly}
            onClick={() => onNewChange(false)}
          >
            <Images size={17} /> Images
          </button>
        ) : (
          <Link href="/explore">
            <Images size={17} /> Images
          </Link>
        )}
        {kind === "video" ? (
          <button
            type="button"
            aria-pressed={!newOnly}
            onClick={() => onNewChange(false)}
          >
            <Clapperboard size={17} /> Videos
          </button>
        ) : (
          <Link href="/video-templates">
            <Clapperboard size={17} /> Videos
          </Link>
        )}
        <button
          type="button"
          aria-pressed={newOnly}
          onClick={() => onNewChange(true)}
        >
          <Sparkles size={17} /> New memes
        </button>
        <Link href="/studio">
          <LayoutGrid size={17} /> Your studio
        </Link>
      </nav>
      <div className="library-side-note">
        <strong>Ready to edit?</strong>
        <p>Sign in to edit any format or pick up a draft.</p>
        <Link className="text-link" href="/studio">
          Open Studio <ArrowUpRight size={14} />
        </Link>
      </div>
    </aside>
  );
}
