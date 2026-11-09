"use client";
import Link from "next/link";
import { SiteFooter } from "@/components/site-chrome";
import { useState } from "react";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SiteHeader } from "@/components/site";
const questions = [
  {
    q: "Can I create video memes?",
    a: "Yes. Choose a video or GIF in Video templates, add captions and overlays, then export WebM or convert to MP4. The source media must be available, and rendering depends on your browser capabilities.",
  },
  {
    q: "Is Meme Is Mine free to use?",
    a: "Browsing and previews are free. Sign in with a free account to use both editors and Studio.",
  },
  {
    q: "Do I need to sign up or verify my email?",
    a: "Sign in to use the image or video editor. You can browse and preview templates without an account. Drafts stay in the browser where you saved them.",
  },
  {
    q: "Can I upload my own image?",
    a: "Yes. Open Create from your image or choose Upload image in the editor. JPG, PNG, and WebP images are supported, with a size limit shown in the editor so uploads can be kept locally in your browser.",
  },
  {
    q: "How do I download the meme?",
    a: "Use Download PNG in the editor. The app draws the selected image and your captions to a canvas in the browser and exports PNG or JPG at the canvas dimensions you choose.",
  },
  {
    q: "Where are saved drafts stored?",
    a: "Drafts and bookmarks are stored in localStorage in your browser. They are not uploaded to a database, do not sync across devices, and may be removed if you clear browser site data.",
  },
  {
    q: "Why does a template image sometimes fail to load?",
    a: "The template library uses publicly available remote image URLs when the upstream feed is reachable. Availability can change if a remote image is moved or removed. You can upload an image you have permission to use instead.",
  },
  {
    q: "Can I use a downloaded meme anywhere?",
    a: "That depends on the image and its rights. Only upload or use images you have permission to edit and share, and check any applicable rights or terms before using a meme commercially.",
  },
  {
    q: "Does the editor work on mobile?",
    a: "The pages are responsive and you can browse and create on mobile. The editor layout stacks its tool and settings panels around the canvas on smaller screens.",
  },
  {
    q: "Does the site use AI to write memes?",
    a: "No AI writing feature is part of this version. You choose the format and write your own captions.",
  },
];
export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <main id="main-content" tabIndex={-1} className="paper-noise rf-support-page">
      <SiteHeader />
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">The obvious questions</span>
          <h1>
            Good to <span>know.</span>
          </h1>
          <p>
            Everything you need to know before you make the group chat’s day.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container faq-layout">
          <div className="faq-intro">
            <span className="eyebrow">FAQ / 001</span>
            <h2 className="page-display">
              NO MYSTERY.
              <br />
              <em>JUST MEMES.</em>
            </h2>
            <p>
              If something isn’t answered here, send a note and tell us what
              you’re trying to do.
            </p>
            <Link href="/contact" className="button button-dark">
              Get in touch <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="faq-list">
            {questions.map((item, index) => (
              <div
                className={open === index ? "faq-item is-open" : "faq-item"}
                key={item.q}
              >
                <button
                  type="button"
                  className="faq-question"
                  aria-expanded={open === index}
                  onClick={() => setOpen(open === index ? null : index)}
                >
                  <span>
                    <small>{String(index + 1).padStart(2, "0")}</small>
                    {item.q}
                  </span>
                  <ChevronDown size={19} />
                </button>
                <AnimatePresence initial={false}>
                  {open === index && (
                    <motion.div
                      className="faq-answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                    >
                      <p>{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
