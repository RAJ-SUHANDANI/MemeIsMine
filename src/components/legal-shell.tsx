import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "./site";
import { SiteFooter } from "./site-chrome";
export function LegalShell({eyebrow,title,description,children}:{eyebrow:string;title:string;description:string;children:ReactNode}){
return <main id="main-content" tabIndex={-1} className="paper-noise rf-support-page">
  <SiteHeader/>
  <section className="page-hero"><div className="container">
    <span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p>
  </div></section>
  <section className="section"><div className="container privacy-layout">
    <aside className="privacy-aside"><span className="eyebrow">THE IMPORTANT BITS</span>
      <h2 className="page-display">NO FINE<br/><em>PRINT TRICKS.</em></h2>
      <p>Updated 13 November 2026</p>
      <nav aria-label="Policies" style={{display:"grid",gap:12,marginTop:24}}>
        <Link href="/privacy">Privacy notice</Link>
        <Link href="/terms">Terms of use</Link>
        <Link href="/cookies">Cookies &amp; storage</Link>
        <Link href="/content-rights">Content &amp; copyright</Link>
        <Link href="/contact">Contact</Link>
      </nav>
    </aside>
    <article className="privacy-copy">{children}</article>
  </div></section><SiteFooter/>
</main>;
}
