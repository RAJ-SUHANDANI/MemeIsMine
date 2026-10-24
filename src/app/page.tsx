"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Download, Layers3, MousePointer2, Sparkles, Star, WandSparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { SiteHeader, MemeCard, FloatingGallery } from "@/components/site";
import { starterMemes, type MemeTemplate } from "@/data/memes";

type HomeVideoTemplate = {
  id: string; name: string; url: string; posterUrl: string; mediaType: "gif" | "video";
  category?: string; trending?: boolean; sourcePage?: string;
};
function homeVideoSource(template: HomeVideoTemplate) {
  return "/api/video-source?url=" + encodeURIComponent(template.url)
    + (template.sourcePage ? "&referrer=" + encodeURIComponent(template.sourcePage) : "");
}
type UserReview = { id: string; name: string; review: string; createdAt: string };
const REVIEW_KEY = "mim-user-reviews";
const starterReviews: UserReview[] = [
  { id: "starter-1", name: "A meme enthusiast", review: "Finally, a quick way to turn the exact thought in my head into a meme. The editor is easy and fun.", createdAt: "" },
  { id: "starter-2", name: "A group-chat regular", review: "The video templates are such a good addition. I can add a caption and export without opening a heavy editor.", createdAt: "" },
  { id: "starter-3", name: "A casual creator", review: "Love the no-fuss workflow. Find a format, make it mine, and send it to friends.", createdAt: "" },
];
export default function HomePage() {
  const [memes, setMemes] = useState<MemeTemplate[]>(starterMemes.slice(0, 4));
  const [videoTemplates, setVideoTemplates] = useState<HomeVideoTemplate[]>([]);
  const [reviews, setReviews] = useState<UserReview[]>(starterReviews);
  const [reviewIndex, setReviewIndex] = useState(0);
  useEffect(() => {
    const loadReviews = () => {
      try {
        const stored = JSON.parse(localStorage.getItem(REVIEW_KEY) ?? "[]");
        if (Array.isArray(stored) && stored.length) setReviews(stored.filter((item) => item && typeof item.name === "string" && typeof item.review === "string"));
        else setReviews(starterReviews);
      } catch { setReviews(starterReviews); }
    };
    loadReviews();
    window.addEventListener("mim-reviews-updated", loadReviews);
    window.addEventListener("storage", loadReviews);
    return () => { window.removeEventListener("mim-reviews-updated", loadReviews); window.removeEventListener("storage", loadReviews); };
  }, []);
  const moveReview = (direction: number) => setReviewIndex((index) => (index + direction + reviews.length) % reviews.length);
  const reduce = useReducedMotion();
  useEffect(() => {
    let alive = true;
    const shuffle = <T,>(items: T[]) => {
      const result = [...items];
      for (let index = result.length - 1; index > 0; index--) {
        const target = Math.floor(Math.random() * (index + 1));
        [result[index], result[target]] = [result[target], result[index]];
      }
      return result;
    };
    fetch("/api/memes?limit=100", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data?.success || !Array.isArray(data.memes)) throw new Error("Image templates are unavailable.");
        return data.memes as MemeTemplate[];
      })
      .then((imgflipMemes) => {
        if (!alive) return;
        // Never mix the Indian archive into the image cards; they are Imgflip-only.
        const isImgflipImage = (item: MemeTemplate) => {
          try { return new URL(item.url).hostname === "i.imgflip.com"; } catch { return false; }
        };
        const source = imgflipMemes.filter(isImgflipImage);
        const unique = Array.from(new Map((source.length ? source : starterMemes).filter(isImgflipImage).map((item) => [item.id, item])).values());
        setMemes(shuffle(unique).slice(0, 4));
      })
      .catch(() => { if (alive) setMemes(shuffle(starterMemes.filter((item) => { try { return new URL(item.url).hostname === "i.imgflip.com"; } catch { return false; } })).slice(0, 4)); });
    fetch("/api/video-templates?limit=4&sort=popular")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data?.success || !Array.isArray(data.templates)) throw new Error("Video templates are unavailable.");
        return data.templates as HomeVideoTemplate[];
      })
      .then((items) => { if (alive) setVideoTemplates(items.slice(0, 4)); })
      .catch(() => { if (alive) setVideoTemplates([]); });
    return () => { alive = false; };
  }, []);
  return <main className="paper-noise">
    <SiteHeader/>
    <section className="hero-section"><div className="container hero-grid">
      <motion.div className="hero-copy" initial={reduce ? false : { opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, ease: [.2,.8,.2,1] }}>
        <div className="eyebrow hero-kicker">The internet is your canvas</div>
        <h1 className="display-title hero-title">Make a meme.<br/>Make it <span className="red-word">yours.</span></h1>
        <p className="hero-subtitle">Find the format. Make it yours. Get back to the group chat.</p>
        <div className="hero-actions"><Link href="/templates" className="button button-dark">Find your format <ArrowUpRight size={16}/></Link><Link href="/create/upload" className="button button-paper">Start with your image <ArrowRight size={15}/></Link></div>
        <div className="hero-footnote"><span>No account needed</span><span>Free to create</span><span>Download in a click</span></div>
      </motion.div>
      <FloatingGallery memes={memes}/>
    </div></section>
    <div className="marquee-band" aria-label="Find a format, make it yours, share the joke"><div className="marquee-track">{Array.from({ length: 2 }, (_, i) => <span key={i}>FIND THE FORMAT <b>✳</b> MAKE IT YOURS <b>✳</b> SEND IT TO THE GROUP CHAT <b>✳</b> NO BAD JOKES, JUST BAD TIMING <b>✳</b></span>)}</div></div>
    <section className="section" id="explore"><div className="container">
      <div className="section-head"><div><span className="eyebrow">Fresh from the internet</span><h2 className="section-title">Good formats.<br/><span className="serif-italic">Questionable decisions.</span></h2></div><p className="section-note">The classics, the reactions, the “you had to be there” moments. Pick a template and make it yours.</p></div>
      <div className="template-grid">{memes.map((meme, index) => <MemeCard key={meme.id} meme={meme} index={index}/>)}</div>
      <div className="section-footer"><Link href="/templates" className="text-link">Explore all templates <ArrowRight size={15}/></Link></div>
    </div></section>


    <section className="section home-video-section" id="video-templates"><div className="container">
      <div className="section-head"><div><span className="eyebrow">Video templates / the memes that move</span><h2 className="section-title">Bring the joke<br/><span className="serif-italic">to life.</span></h2></div><p className="section-note">Real video clips and animated reactions, ready for your captions. Start with a moving template, then tweak it in the browser.</p></div>
      {videoTemplates.length > 0 ? <div className="video-template-grid home-video-grid">{videoTemplates.map((template, index) => <motion.article key={template.id} className="video-template-card" initial={reduce ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .12 }} transition={{ duration: .35, delay: index * .05 }} whileHover={reduce ? undefined : { y: -5 }}><div className="video-template-preview">
        <Link className="video-template-media-link" href={"/video-editor/" + encodeURIComponent(template.id)} aria-label={"Edit " + template.name}>
          {template.mediaType === "gif" ? <img src={homeVideoSource(template)} alt={template.name} loading="lazy"/> : <video src={homeVideoSource(template)} poster={template.posterUrl || undefined} muted autoPlay loop playsInline preload="metadata" aria-label={template.name}/>}
        </Link>
        <span className="video-kind-pill">{template.mediaType === "gif" ? "GIF" : "VIDEO"}</span><Link className="video-edit-cue video-edit-cue-video" href={"/video-editor/" + encodeURIComponent(template.id)}><Sparkles size={13}/> Edit this template <ArrowUpRight size={14}/></Link>
      </div><div className="video-template-meta"><div><Link href={"/video-editor/" + encodeURIComponent(template.id)} className="video-template-name">{template.name}</Link><span>{template.trending ? "Trending" : template.category ?? "Video Memes"}</span></div></div></motion.article>)}</div> : <p className="control-help">Browse the full motion collection to find a video template.</p>}
      <div className="section-footer"><Link href="/video-templates" className="text-link">Explore all video templates <ArrowRight size={15}/></Link></div>
    </div></section>

    <section className="section section-dark"><div className="container dark-layout">
      <motion.div initial={reduce ? false : { opacity: 0, x: -18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .55 }}>
        <span className="eyebrow">Your sense of humour, in full control</span><h2 className="section-title">A little chaos.<br/><span>A lot of control.</span></h2>
        <p className="dark-copy">No complicated software. Just a good format, the right words, and a download button.</p><Link href="/templates" className="button button-red">Make something funny <ArrowUpRight size={16}/></Link>
      </motion.div>
      <div className="feature-stack">
        <motion.div className="feature-row" whileHover={{ x: 6 }}><span className="feature-number">01 / FIND</span><div><h3>A format for every feeling</h3><p>Browse classics, reactions, office energy, and pure nonsense.</p></div><Layers3 className="feature-arrow" size={20}/></motion.div>
        <motion.div className="feature-row" whileHover={{ x: 6 }}><span className="feature-number">02 / TWEAK</span><div><h3>Make the punchline yours</h3><p>Change the copy, tune the text, and make the format fit the moment.</p></div><MousePointer2 className="feature-arrow" size={20}/></motion.div>
        <motion.div className="feature-row" whileHover={{ x: 6 }}><span className="feature-number">03 / SEND</span><div><h3>Take it and go</h3><p>Export a crisp PNG right in your browser. No account or email required.</p></div><Download className="feature-arrow" size={20}/></motion.div>
      </div>
    </div></section>
    <section className="section" id="how-it-works"><div className="container">
      <div className="section-head"><div><span className="eyebrow">Three steps. Zero overthinking.</span><h2 className="section-title">From “lol” to <span className="serif-italic">sent.</span></h2></div><p className="section-note">Your best work happens when you stop explaining the joke.</p></div>
      <div className="steps-grid">
        <motion.article className="step-card" whileInView={{ opacity: 1, y: 0 }} initial={reduce ? false : { opacity: 0, y: 18 }} viewport={{ once: true }} transition={{ duration: .4 }}><span className="step-index">STEP 01</span><span className="step-graphic"><Sparkles size={21}/></span><h3>Pick the format</h3><p>Start with a classic template or bring your own image.</p></motion.article>
        <motion.article className="step-card" whileInView={{ opacity: 1, y: 0 }} initial={reduce ? false : { opacity: 0, y: 18 }} viewport={{ once: true }} transition={{ duration: .4, delay: .08 }}><span className="step-index">STEP 02</span><span className="step-graphic"><WandSparkles size={21}/></span><h3>Put your spin on it</h3><p>Write your captions, adjust the look, and preview the punchline.</p></motion.article>
        <motion.article className="step-card" whileInView={{ opacity: 1, y: 0 }} initial={reduce ? false : { opacity: 0, y: 18 }} viewport={{ once: true }} transition={{ duration: .4, delay: .16 }}><span className="step-index">STEP 03</span><span className="step-graphic"><Download size={21}/></span><h3>Download. Deploy. Done.</h3><p>Save a clean PNG and send it wherever the joke belongs.</p></motion.article>
      </div>
    </div></section>
    <section className="section reviews-section" id="reviews"><div className="container reviews-layout">
      <div className="reviews-intro"><span className="eyebrow">The people have the floor</span><h2 className="section-title">Made for memes.<br/><span className="serif-italic">Rated by humans.</span></h2><p className="section-note">A little love from the people making the internet more entertaining, one punchline at a time.</p><Link href="/add-review" className="button button-paper">Leave a review <ArrowUpRight size={15}/></Link><div className="review-controls"><button type="button" onClick={() => moveReview(-1)} aria-label="Previous review"><ArrowLeft size={17}/></button><span>{reviews.length ? String(reviewIndex + 1).padStart(2, "0") : "00"} <i>/</i> {String(reviews.length).padStart(2, "0")}</span><button type="button" onClick={() => moveReview(1)} aria-label="Next review"><ArrowRight size={17}/></button></div></div>
      <div className="review-deck" aria-label="User reviews. Swipe the front card left or right to browse." onTouchStart={(event) => { event.currentTarget.dataset.touchX = String(event.touches[0]?.clientX ?? 0); }} onTouchEnd={(event) => { const start = Number(event.currentTarget.dataset.touchX ?? 0); const delta = (event.changedTouches[0]?.clientX ?? start) - start; if (Math.abs(delta) > 45) moveReview(delta < 0 ? 1 : -1); }}>
        {reviews.slice(0, Math.min(3, reviews.length)).map((_, stackIndex) => {
          const review = reviews[(reviewIndex + stackIndex) % reviews.length];
          return <motion.article key={review.id} className={"review-card review-card-stack-" + stackIndex} drag={stackIndex === 0 ? "x" : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.72} onDragEnd={(_, info) => { if (info.offset.x < -70) moveReview(1); else if (info.offset.x > 70) moveReview(-1); }} style={{ zIndex: 3 - stackIndex }} whileDrag={stackIndex === 0 ? { rotate: 4, cursor: "grabbing" } : undefined}>
            <div className="review-card-top"><span className="review-quote-mark">“</span><span className="review-rating" aria-label="5 out of 5 stars">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={13} fill="currentColor"/>)}</span></div>
            <p className="review-quote">{review.review}</p><div className="review-card-footer"><span className="review-avatar">{review.name.trim().charAt(0).toUpperCase() || "M"}</span><div><strong>{review.name}</strong><small>{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "Meme Is Mine community"}</small></div><span className="review-swipe-cue">SWIPE ↔</span></div>
          </motion.article>;
        })}
      </div>
    </div></section>
    <section className="cta-section"><div className="container"><div className="cta-panel"><div><span className="eyebrow">Your group chat is waiting</span><h2>The meme is yours.<br/>Make it official.</h2></div><Link href="/templates" className="button button-dark">Let’s make one <ArrowUpRight size={16}/></Link></div></div></section>
    <section className="section about-teaser" id="about">
      <div className="container about-teaser-grid">
        <motion.div className="teaser-photo-wrap" initial={reduce ? false : { opacity: 0, x: -20, rotate: -2 }} whileInView={{ opacity: 1, x: 0, rotate: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .5 }}>
          <div className="teaser-photo-label"><span>THE MAKER / 001</span><span>WEB DEVELOPER</span></div>
          <img src="/raj-suhandani-portrait.webp" alt="Raj Suhandani, creator of Meme Is Mine" width="800" height="1000" loading="lazy"/>
          <div className="teaser-photo-foot"><span>MADE WITH INTENT.</span><span>✳</span></div>
        </motion.div>
        <motion.div className="teaser-copy" initial={reduce ? false : { opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .5 }}>
          <span className="eyebrow">Independent project / made by Raj</span>
          <h2 className="section-title">THE PERSON<br/>BEHIND THE<br/><span className="serif-italic">PIXELS.</span></h2>
          <p>I’m <strong>Raj Suhandani</strong>, a web developer who enjoys turning ideas into thoughtful, useful digital experiences. I like building products with a clear purpose, distinctive visual identity, and small details that make them enjoyable to use.</p>
          <p>Meme Is Mine brings that approach to meme creation: find a template, make the punchline your own, and download it without unnecessary steps. I built it to make the process playful and straightforward, with a focused editor and a little personality throughout the experience.</p>
          <div className="teaser-actions"><Link href="/about" className="button button-dark">More about me <ArrowUpRight size={16}/></Link><a href="https://rajsuhandani.vercel.app/" target="_blank" rel="noreferrer" className="text-link">Visit my portfolio <ArrowRight size={15}/></a></div>
        </motion.div>
      </div>
    </section>
    <footer className="site-footer"><div className="container footer-inner"><div><Link href="/" className="brand-lockup" aria-label="Meme Is Mine home"><img src="/meme-is-mine-logo.svg" alt="Meme Is Mine" className="brand-full-logo"/></Link><p className="footer-copy">Good memes. Better conversations.</p></div><div className="footer-links"><Link href="/templates">Explore templates</Link><Link href="/studio">Your studio</Link><Link href="/add-review">Add a review</Link><Link href="/about">About Raj</Link><Link href="/faq">FAQ</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link></div><span className="footer-copy">Made for the group chat © 2026</span></div></footer>
  </main>;
}
