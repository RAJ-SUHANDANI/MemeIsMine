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
            <p>Updated November 13, 2026</p>
          </aside>
          <article className="privacy-copy">
            <p className="privacy-lede">
              Meme Is Mine is an independent website created by Raj Suhandani. Appwrite Cloud handles accounts and likes, Vercel hosts the service, and drafts, bookmarks and uploads stay in your browser.
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
                Account signup and login involve your email and password handled by Appwrite Cloud. The account service manages account identifiers, email verification and recovery codes, and sessions. A necessary HttpOnly cookie holds your session, with a temporary signed verification cookie for confirmation and recovery. A private Appwrite database stores which templates an account likes; the gallery displays aggregate counts, not public lists of individuals. We use these details to provide sign-in, editor access and likes. Vercel and Appwrite process network requests and operational logs needed to deliver and secure the service. Third-party media hosts may receive normal network information when their files load. We use Vercel Web Analytics to understand aggregate page visits, popular public pages, referring sources, and general browser, device and approximate location information. Vercel Web Analytics does not use analytics cookies. We exclude account and editing routes and strip URL search parameters before sending pageview events, and we do not intentionally send personal meme captions, uploads, or account details as analytics events. We do not use advertising pixels or custom marketing analytics events. Providers may process information outside your country.
              </p>
            </section>
            <section><h3>Retention, requests and contact</h3>
              <p>Local drafts, bookmarks and notes remain on this device until you remove them or clear browser data. Account data and likes are retained as needed to operate your account, respond to legitimate requests, and meet applicable obligations. Hosting and authentication providers may retain operational logs under their policies and relevant law.</p>
              <p>For access, correction, deletion requests or privacy concerns, email <a href="mailto:rajsuhandani11@gmail.com?subject=Meme%20Is%20Mine%20privacy%20request">rajsuhandani11@gmail.com</a>. We may verify account ownership before responding. Account deletion is not currently self-service, and removing the account will not automatically clear browser drafts. Applicable rights vary by jurisdiction.</p>
            </section>
            <section><h3>Children, support and changes</h3>
              <p>The account service is not specifically directed to children. If you believe a child has provided account data, contact us to review the issue. Contact emails are used to respond to questions, feedback and rights or privacy requests, not to enroll you in an email marketing list. This notice may be updated as the site changes.</p>
            </section>
            <section>
              <h3>Limits to keep in mind</h3>
              <p>
                This page describes the current implementation, not a legal
                guarantee. Hosting, access logs, external image providers, and
                browser storage each have their own behavior and policies. Avoid
                storing sensitive information in drafts. Please also read our <Link href="/terms">Terms of Use</Link>, <Link href="/cookies">Cookies &amp; Storage</Link>, and <Link href="/content-rights">Content &amp; Copyright</Link> pages.
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
