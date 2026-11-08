"use client";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Download,
  Film,
  ImagePlus,
  Layers,
  Bookmark,
  Type,
  SlidersHorizontal,
  Play,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SiteHeader, MemeCard, BrandLogo } from "@/components/site";
import { starterMemes } from "@/data/memes";
type VideoTemplate = {
  id: string;
  name: string;
  posterUrl: string;
  mediaType: "gif" | "video";
};
type Review = { id: string; name: string; review: string };
const examples = [
  { top: "ME: JUST ONE MORE TAB", bottom: "ALSO ME: 47 TABS LATER" },
  { top: "THE DEADLINE IS TOMORROW", bottom: "TIME TO MAKE A MEME" },
  { top: "IT WORKS ON MY MACHINE", bottom: "SHIP THE MACHINE" },
];
const questions = [
  [
    "Is it really free?",
    "Yes. Browse templates, edit images and videos, and download your work without creating an account.",
  ],
  [
    "What can I download?",
    "Images export as PNG or JPG at your chosen canvas dimensions. The video editor exports WebM and can convert to MP4. Video rendering depends on your browser and the source clip being available.",
  ],
  [
    "Can I start with my own image?",
    "Absolutely. Upload a JPG, PNG or WebP, add your captions and make it yours. Your image is edited in this browser.",
  ],
  [
    "Where do my drafts go?",
    "Into your Studio on this device. Drafts and bookmarks are saved in this browser, without an account. They do not sync across devices and clearing site data removes them.",
  ],
];
function CaptionDemo() {
  const [top, setTop] = useState(examples[0].top);
  const [bottom, setBottom] = useState(examples[0].bottom);
  const [example, setExample] = useState(0);
  return (
    <div className="caption-demo">
      <div className="demo-topline">
        <span>
          <span className="live-dot" /> Your first punchline
        </span>
        <span>Try it here</span>
      </div>
      <div className="demo-artifact">
        <Image
          src="/templates/distracted-boyfriend.jpg"
          alt="Distracted Boyfriend meme template"
          width="1200"
          height="800"
          fetchPriority="high"
        />
        <div className="demo-caption demo-caption-top">{top}</div>
        <div className="demo-caption demo-caption-bottom">{bottom}</div>
        <span className="demo-selection" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
      </div>
      <div className="demo-controls">
        <label htmlFor="demo-top">
          The setup
          <input
            id="demo-top"
            value={top}
            maxLength={70}
            onChange={(e) => setTop(e.target.value)}
          />
        </label>
        <label htmlFor="demo-bottom">
          The punchline
          <input
            id="demo-bottom"
            value={bottom}
            maxLength={70}
            onChange={(e) => setBottom(e.target.value)}
          />
        </label>
      </div>
      <div className="demo-bottomline">
        <button
          type="button"
          onClick={() => {
            const next = (example + 1) % examples.length;
            setExample(next);
            setTop(examples[next].top);
            setBottom(examples[next].bottom);
          }}
        >
          Try another joke <ArrowRight size={15} />
        </button>
        <Link
          href={
            "/create/112126428?top=" +
            encodeURIComponent(top) +
            "&bottom=" +
            encodeURIComponent(bottom)
          }
        >
          Open full editor <ArrowUpRight size={15} />
        </Link>
      </div>
    </div>
  );
}
export default function HomePage() {
  const [videos, setVideos] = useState<VideoTemplate[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [videoError, setVideoError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/video-templates?limit=3&sort=popular", {
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        if (!data.success || !Array.isArray(data.templates)) throw new Error();
        setVideos(data.templates);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setVideoError(true);
      });
    try {
      const stored = JSON.parse(
        localStorage.getItem("mim-user-reviews") ?? "[]",
      );
      if (Array.isArray(stored))
        setReviews(
          stored
            .filter(
              (r) =>
                r && typeof r.name === "string" && typeof r.review === "string",
            )
            .slice(0, 3),
        );
    } catch {
      /* Local feedback is optional. */
    }
    return () => controller.abort();
  }, []);
  return (
    <main id="main-content" tabIndex={-1} className="home-redesign">
      <SiteHeader />
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <h1>
              Make the
              <br />
              group chat
              <br />
              <em>less boring.</em>
            </h1>
            <p>
              Turn a familiar face into your next inside joke. Make image and
              video memes, right in your browser.
            </p>
            <div className="home-actions">
              <Link href="/explore" className="button button-dark">
                Make a meme <ArrowUpRight size={18} />
              </Link>
              <Link href="/create/upload" className="home-upload">
                <ImagePlus size={18} /> Use your own image
              </Link>
            </div>
            <p className="home-promise">
              <Check size={15} /> Free to create <span /> No account needed
            </p>
          </div>
          <CaptionDemo />
        </div>
        <div className="container hero-bottom">
          <span>Your humour. Your words. Your meme.</span>
          <a href="#formats">
            Find your format <ArrowRight size={15} />
          </a>
        </div>
      </section>
      <section className="home-formats home-section" id="formats">
        <div className="container">
          <div className="home-section-head">
            <h2>
              A format for
              <br />
              <em>that exact feeling.</em>
            </h2>
            <div>
              <p>
                The classics, the reactions, the suspiciously specific. Find the
                face that says it for you.
              </p>
              <Link href="/templates" className="text-link">
                The whole collection <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
          <div className="template-grid home-curated">
            {[
              starterMemes[0],
              starterMemes[1],
              starterMemes[4],
              starterMemes[6],
            ].map((m, i) => (
              <MemeCard
                key={m.id}
                meme={{
                  ...m,
                  url:
                    "/templates/" +
                    {
                      "181913649": "drake.jpg",
                      "87743020": "two-buttons.jpg",
                      "188390779": "woman-cat.jpg",
                      "129242436": "change-my-mind.jpg",
                    }[m.id],
                }}
                index={i}
              />
            ))}
          </div>
          <div className="home-collection-links">
            <Link href="/explore?source=mine&category=Reaction">
              Reaction images <ArrowUpRight size={16} />
            </Link>
            <Link href="/explore?source=mine&category=Work">
              Work & study <ArrowUpRight size={16} />
            </Link>
            <Link href="/explore?source=indian">
              Indian meme archive <ArrowUpRight size={16} />
            </Link>
            <Link href="/explore?source=mine&category=Absurd">
              Pure nonsense <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      <section className="home-tools home-section" id="how-it-works">
        <div className="container home-tools-grid">
          <div className="home-tools-copy">
            <h2>
              The punchline is yours.
              <br />
              <em>So are the details.</em>
            </h2>
            <p>
              A template is just the starting point. Move your words, layer on
              the chaos, and get it looking exactly how you pictured it.
            </p>
            <Link href="/create/112126428" className="button button-paper">
              Meet your editor <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="home-tool-ledger">
            <article>
              <Type size={22} />
              <div>
                <h3>Put the words where they belong.</h3>
                <p>
                  Add and position text layers. Adjust the type, colour and
                  outline until the joke lands.
                </p>
              </div>
            </article>
            <article>
              <Layers size={22} />
              <div>
                <h3>A little more you. A lot more layers.</h3>
                <p>
                  Add stickers or your own image overlays. Resize, rotate,
                  reorder and undo.
                </p>
              </div>
            </article>
            <article>
              <SlidersHorizontal size={22} />
              <div>
                <h3>Make it fit the moment.</h3>
                <p>
                  Choose your canvas shape and tune the image effects. Export a
                  PNG or JPG at your chosen size.
                </p>
              </div>
            </article>
            <article>
              <Download size={22} />
              <div>
                <h3>Download it. The chat is waiting.</h3>
                <p>
                  Create and export in your browser. Save a local draft if the
                  punchline needs another pass.
                </p>
              </div>
            </article>
          </div>
        </div>
        <figure className="container home-editor-proof">
          <Link
            href="/create/112126428"
            aria-label="Open the image editor shown in this preview"
          >
            <Image
              src="/editor-preview.jpg"
              alt="The actual Meme Is Mine editor with text layers, canvas, font controls and PNG export"
              width="1395"
              height="790"
              loading="lazy"
            />
          </Link>
          <figcaption>
            The actual editor. Your captions, layers and export settings in one
            place.
          </figcaption>
        </figure>
      </section>
      <section className="home-video home-section">
        <div className="container">
          <div className="home-section-head">
            <h2>
              Some jokes need
              <br />
              <em>a moving picture.</em>
            </h2>
            <div>
              <p>
                Video clips and animated reactions, with your captions on top.
                Same sense of humour. More motion.
              </p>
              <Link href="/video-templates" className="text-link">
                Explore video templates <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
          <div className="home-video-grid-v2">
            {videos.length ? (
              videos.map((v) => (
                <Link
                  className="home-motion-card"
                  key={v.id}
                  href={"/video-editor/" + encodeURIComponent(v.id)}
                >
                  <div className="home-motion-image">
                    {v.posterUrl ? (
                      <Image
                        src={v.posterUrl}
                        alt={v.name}
                        width="640"
                        height="400"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.hidden = true;
                        }}
                      />
                    ) : null}
                    <Film size={36} className="motion-fallback" />
                    <span className="home-play">
                      <Play size={20} fill="currentColor" />
                    </span>
                    <span className="home-media-kind">
                      {v.mediaType === "gif" ? "GIF" : "Video"}
                    </span>
                  </div>
                  <div>
                    <h3>{v.name}</h3>
                    <ArrowUpRight size={20} />
                  </div>
                </Link>
              ))
            ) : (
              <div className="home-video-empty">
                <Film size={30} />
                <p>
                  {videoError
                    ? "The motion collection could not load. Open the library to try again."
                    : "Finding the next reaction…"}
                </p>
                <Link href="/video-templates" className="text-link">
                  Open the video library <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
          <p className="home-format-note">
            Caption, layer, preview. Export WebM or convert to MP4 in a
            supported browser.
          </p>
        </div>
      </section>
      <section className="home-studio home-section">
        <div className="container home-studio-grid">
          <div className="studio-artifact">
            <Bookmark size={28} />
            <p>
              For the idea
              <br />
              you’ll have <em>later.</em>
            </p>
            <div>
              <span>
                <Check size={15} /> Drafts
              </span>
              <span>
                <Check size={15} /> Saved formats
              </span>
            </div>
            <Link href="/studio">
              Open your studio <ArrowUpRight size={19} />
            </Link>
          </div>
          <div className="home-studio-copy">
            <h2>
              Good ideas deserve
              <br />
              <em>a second draft.</em>
            </h2>
            <p>
              Bookmark a format when you find it. Save your edit when you need a
              minute. Your Studio keeps them together for the next time
              inspiration hits.
            </p>
            <p className="home-local-note">
              Saved on this browser and device. No account, no cross-device
              sync. Clearing site data clears your drafts.
            </p>
            <Link href="/studio" className="text-link">
              Find your saved ideas <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
      <section className="home-faq home-section">
        <div className="container home-faq-grid">
          <div>
            <h2>
              Before the
              <br />
              <em>punchline.</em>
            </h2>
            <Link href="/faq" className="text-link">
              All your questions <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="home-questions">
            {questions.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <section className="home-maker">
        <div className="container">
          <Image
            src="/raj-suhandani-portrait.webp"
            alt="Raj Suhandani"
            width="64"
            height="64"
            loading="lazy"
          />
          <p>
            An independent project by <Link href="/about">Raj Suhandani.</Link>
            <br />
            <span>Made for people with a good joke and a tab to spare.</span>
          </p>
          <a
            href="https://github.com/RAJ-SUHANDANI/MemeIsMine"
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            See the source <ArrowUpRight size={16} />
          </a>
        </div>
      </section>
      <section className="home-close">
        <div className="container">
          <h2>
            The next one
            <br />
            is <em>yours.</em>
          </h2>
          <Link href="/explore" className="button button-paper">
            Let’s make a meme <ArrowUpRight size={21} />
          </Link>
        </div>
      </section>
      <section className="home-feedback" id="reviews">
        <div className="container">
          <div>
            <h2>Your take belongs here.</h2>
            <p>Feedback saved on this browser, visible only to you.</p>
          </div>
          <Link href="/add-review" className="text-link">
            Save a note <ArrowUpRight size={16} />
          </Link>
          {reviews.map((r) => (
            <blockquote key={r.id}>
              <p>{r.review}</p>
              <cite>{r.name} · Saved on this device</cite>
            </blockquote>
          ))}
        </div>
      </section>
      <footer className="site-footer home-footer">
        <div className="container">
          <div className="home-footer-top">
            <div>
              <BrandLogo />
              <p>Good memes. Better conversations.</p>
            </div>
            <nav aria-label="Footer navigation">
              <div>
                <Link href="/explore">Image templates</Link>
                <Link href="/video-templates">Video templates</Link>
                <Link href="/create/upload">Upload an image</Link>
                <Link href="/studio">Your studio</Link>
              </div>
              <div>
                <Link href="/how-it-works">How it works</Link>
                <Link href="/about">About Raj</Link>
                <Link href="/contact">Contact</Link>
                <Link href="/privacy">Privacy</Link>
              </div>
            </nav>
          </div>
          <div className="home-footer-bottom">
            <span>Made for the group chat.</span>
            <span>© {new Date().getFullYear()} Meme Is Mine</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
