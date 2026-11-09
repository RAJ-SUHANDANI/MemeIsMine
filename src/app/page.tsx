"use client";
import Link from "next/link";
import { SiteFooter } from "@/components/site-chrome";
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
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { SiteHeader, MemeCard } from "@/components/site";
import { starterMemes, type MemeTemplate } from "@/data/memes";
import { GalleryShowcase } from "@/components/gallery-showcase";
import {
  VideoTemplatePoster,
  type PreviewVideoTemplate,
} from "@/components/video-template-poster";
type Review = { id: string; name: string; review: string };
const examples = [
  { top: "ME: JUST ONE MORE TAB", bottom: "ALSO ME: 47 TABS LATER" },
  { top: "THE DEADLINE IS TOMORROW", bottom: "TIME TO MAKE A MEME" },
  { top: "IT WORKS ON MY MACHINE", bottom: "SHIP THE MACHINE" },
];
const questions = [
  [
    "Is it really free?",
    "Yes. Browse and preview any template. Create a free account to edit, download, and use Studio.",
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
    "Into your Studio on this device. Drafts and bookmarks are saved in this browser. They do not sync across devices and clearing site data removes them.",
  ],
];
function CaptionDemo({ meme }: { meme: MemeTemplate }) {
  const [top, setTop] = useState(examples[0].top);
  const [bottom, setBottom] = useState(examples[0].bottom);
  const [example, setExample] = useState(0);
  const [replay, setReplay] = useState(0);
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
          src={meme.url}
          alt={meme.name + " meme template"}
          width={meme.width}
          height={meme.height}
          fetchPriority="high"
        />
        <div
          key={"top-" + replay}
          className="demo-caption demo-caption-top"
          data-caption-swap={replay > 0 || undefined}
        >
          {top}
        </div>
        <div
          key={"bottom-" + replay}
          className="demo-caption demo-caption-bottom"
          data-caption-swap={replay > 0 || undefined}
        >
          {bottom}
        </div>
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
            setReplay((value) => value + 1);
            setTop(examples[next].top);
            setBottom(examples[next].bottom);
          }}
        >
          Try another joke <ArrowRight size={15} />
        </button>
        <Link
          href={
            "/create/" +
            encodeURIComponent(meme.id) +
            "?top=" +
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
function EditorProof({ meme }: { meme: MemeTemplate }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });
  const clip = useTransform(
    scrollYProgress,
    [0, 1],
    ["inset(3% 8% 3% 8% round 16px)", "inset(0% 0% 0% 0% round 12px)"],
  );

  return (
    <figure ref={ref} className="container home-editor-proof">
      <div className="editor-proof-heading">
        <span>Inside the editor</span>
        <span>
          Format <ArrowRight size={14} /> Caption <ArrowRight size={14} />{" "}
          Export
        </span>
      </div>
      <div className="editor-proof-track" aria-hidden="true">
        <motion.span style={{ scaleX: reduce ? 1 : scrollYProgress }} />
      </div>
      <motion.div
        className="editor-proof-window"
        style={reduce ? undefined : { clipPath: clip }}
      >
        <Link
          href={"/create/" + encodeURIComponent(meme.id)}
          aria-label={"Open " + meme.name + " in the image editor"}
        >
          <div className="editor-proof-demo">
            <div className="editor-proof-tools" aria-hidden="true">
              <span>
                <Type size={18} /> Text
              </span>
              <span>
                <Layers size={18} /> Layers
              </span>
              <span>
                <SlidersHorizontal size={18} /> Effects
              </span>
            </div>
            <Image
              src={meme.url}
              alt={meme.name + " on the editor canvas"}
              width={meme.width}
              height={meme.height}
              loading="lazy"
            />
            <span className="editor-proof-export">
              <Download size={17} /> Export preview
            </span>
          </div>
        </Link>
      </motion.div>
      <figcaption>
        Your captions, layers and export settings in one place.
      </figcaption>
    </figure>
  );
}

export default function HomePage() {
  const homeRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const home = homeRef.current;
    if (!home || !("IntersectionObserver" in window)) return;
    home.dataset.motionReady = "true";
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.entered = "true";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );
    home
      .querySelectorAll("[data-scroll-reveal]")
      .forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      delete home.dataset.motionReady;
    };
  }, []);
  const [images, setImages] = useState(starterMemes.slice(0, 6));
  const [videos, setVideos] = useState<PreviewVideoTemplate[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [videoError, setVideoError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function refreshTemplates() {
      let previous = "";
      try {
        previous = sessionStorage.getItem("mim-home-templates") ?? "";
      } catch {
        /* Storage is optional. */
      }
      try {
        const response = await fetch(
          "/api/home-templates?previous=" + encodeURIComponent(previous),
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );
        const data = await response.json();
        if (!response.ok || !data.images?.length || !Array.isArray(data.videos))
          throw new Error("Could not load home templates");
        if (controller.signal.aborted) return;
        setImages(data.images);
        setVideos(data.videos);
        setVideoError(false);
        try {
          sessionStorage.setItem(
            "mim-home-templates",
            [
              ...data.images.map((item: MemeTemplate) => "image:" + item.id),
              ...data.videos.map(
                (item: PreviewVideoTemplate) => "video:" + item.id,
              ),
            ].join(","),
          );
        } catch {
          /* Storage is optional. */
        }
      } catch {
        if (!controller.signal.aborted) setVideoError(true);
      }
    }
    void refreshTemplates();
    function restore(event: PageTransitionEvent) {
      if (event.persisted) void refreshTemplates();
    }
    window.addEventListener("pageshow", restore);
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
    return () => {
      controller.abort();
      window.removeEventListener("pageshow", restore);
    };
  }, []);
  return (
    <main
      ref={homeRef}
      id="main-content"
      tabIndex={-1}
      className="home-redesign"
    >
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
              <Check size={15} /> Free to browse <span /> Free editing with an
              account
            </p>
          </div>
          <div className="home-demo-entrance">
            <CaptionDemo meme={images[0]} />
          </div>
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
          <div className="home-section-head" data-scroll-reveal>
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
          <GalleryShowcase
            label="Image template showcase"
            items={images.slice(2).map((meme, index) => ({
              id: meme.id,
              name: meme.name,
              card: <MemeCard meme={meme} index={index} />,
            }))}
          />
          <div className="home-collection-links">
            <Link href="/explore?source=mine&category=Reaction">
              Reaction images <ArrowUpRight size={16} />
            </Link>
            <Link href="/explore?source=mine&category=Work">
              Work & study <ArrowUpRight size={16} />
            </Link>
            <Link href="/explore?category=Animals">
              Animals <ArrowUpRight size={16} />
            </Link>
            <Link href="/explore?source=mine&category=Absurd">
              Pure nonsense <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      <section className="home-tools home-section" id="how-it-works">
        <div className="container home-tools-grid">
          <div className="home-tools-copy" data-scroll-reveal>
            <h2>
              The punchline is yours.
              <br />
              <em>So are the details.</em>
            </h2>
            <p>
              A template is just the starting point. Move your words, layer on
              the chaos, and get it looking exactly how you pictured it.
            </p>
            <Link
              href={"/create/" + encodeURIComponent(images[1].id)}
              className="button button-paper"
            >
              Meet your editor <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="home-tool-ledger">
            <article data-scroll-reveal>
              <Type size={22} />
              <div>
                <h3>Put the words where they belong.</h3>
                <p>
                  Add and position text layers. Adjust the type, colour and
                  outline until the joke lands.
                </p>
              </div>
            </article>
            <article data-scroll-reveal>
              <Layers size={22} />
              <div>
                <h3>A little more you. A lot more layers.</h3>
                <p>
                  Add stickers or your own image overlays. Resize, rotate,
                  reorder and undo.
                </p>
              </div>
            </article>
            <article data-scroll-reveal>
              <SlidersHorizontal size={22} />
              <div>
                <h3>Make it fit the moment.</h3>
                <p>
                  Choose your canvas shape and tune the image effects. Export a
                  PNG or JPG at your chosen size.
                </p>
              </div>
            </article>
            <article data-scroll-reveal>
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
        <EditorProof meme={images[1]} />
      </section>
      <section className="home-video home-section">
        <div className="container">
          <div className="home-section-head" data-scroll-reveal>
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
          <div data-scroll-reveal>
            {videos.length ? (
              <GalleryShowcase
                label="Video template showcase"
                items={videos.map((v) => ({
                  id: v.id,
                  name: v.name,
                  card: (
                    <article className="home-motion-card" key={v.id}>
                      <div className="home-motion-image">
                        <VideoTemplatePoster template={v} />
                        <span className="home-media-kind">
                          {v.mediaType === "gif" ? "GIF" : "Video"}
                        </span>
                      </div>
                      <Link
                        className="home-motion-title"
                        href={"/video-editor/" + encodeURIComponent(v.id)}
                      >
                        <h3>{v.name}</h3>
                        <ArrowUpRight size={20} />
                      </Link>
                    </article>
                  ),
                }))}
              />
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
          <div className="studio-artifact" data-scroll-reveal>
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
          <div className="home-studio-copy" data-scroll-reveal>
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
              Saved on this browser and device. No cross-device sync. Clearing
              site data clears your drafts.
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
      <section className="home-close" data-scroll-reveal>
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
      <SiteFooter />
    </main>
  );
}
