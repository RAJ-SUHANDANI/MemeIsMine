"use client";
import Link from "next/link";
import { SiteFooter } from "@/components/site-chrome";
import {
  LockKeyhole,
  HardDrive,
  Image as ImageIcon,
  ShieldCheck,
} from "lucide-react";
import { SiteHeader } from "@/components/site";
export default function PrivacyPage() {
  return (
    <main id="main-content" tabIndex={-1} className="paper-noise rf-support-page">
      <SiteHeader />
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Plain language, please</span>
          <h1>
            Your memes.
            <br />
            <span>Your device.</span>
          </h1>
          <p>
            Browse and preview templates freely. An account unlocks Studio, both editors, and template likes.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container privacy-layout">
          <aside className="privacy-aside">
            <div className="privacy-icon">
              <LockKeyhole size={28} />
            </div>
            <span className="eyebrow">Privacy overview</span>
            <h2 className="page-display">
              LOCAL BY
              <br />
              <em>DEFAULT.</em>
            </h2>
            <p>Updated November 10, 2026</p>
          </aside>
          <article className="privacy-copy">
            <p className="privacy-lede">
              Your account and likes use the managed Appwrite account database. Drafts, bookmarks and uploads stay in your browser.
            </p>
            <section>
              <h3>
                <HardDrive size={19} /> Drafts and bookmarks
              </h3>
              <p>
                When you save a draft or bookmark a format, the information is
                stored in your browser’s localStorage. It stays in that browser
                profile on that device. Anyone with access to your browser
                profile may be able to see it, and clearing site data can remove
                it. There is no cross-device sync.
              </p>
            </section>
            <section>
              <h3>
                <ImageIcon size={19} /> Images and uploads
              </h3>
              <p>
                Images selected from your device are processed in the browser
                for preview and export. This version does not upload your
                personal image to a Meme Is Mine user account or remote
                database. The editor limits local uploads to 2.5 MB so an image
                can be stored with a draft where applicable.
              </p>
              <p>
                The template gallery may request image files from outside image
                hosts. Those providers can receive the usual connection
                information when your browser loads their content. Use images
                you have permission to edit or share.
              </p>
            </section>
            <section>
              <h3>
                <ShieldCheck size={19} /> APIs and services
              </h3>
              <p>
                The catalogues are maintained from public template collections. Some media may load from external hosts, which can receive standard connection information. The image proxy only allows configured image hostnames. An account email, salted password hash, email-verification state, hashed session tokens, and liked-template keys are kept in Appwrite Cloud’s managed authentication and database services. Email verification and recovery codes are delivered through Appwrite’s email service. The gallery exposes aggregate counts, not a public list of individual reactions.
              </p>
            </section>
            <section>
              <h3>Limits to keep in mind</h3>
              <p>
                This page describes the current implementation, not a legal
                guarantee. Hosting, access logs, external image providers, and
                browser storage each have their own behavior and policies. Avoid
                storing sensitive information in drafts.
              </p>
            </section>
            <div className="privacy-callout">
              Questions about how the current version handles data?{" "}
              <Link href="/contact">
                Contact Raj <span>↗</span>
              </Link>
            </div>
          </article>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
