"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowUpRight, Star } from "lucide-react";
import { SiteHeader } from "@/components/site";

const REVIEW_KEY = "mim-user-reviews";
type UserReview = { id: string; name: string; review: string; createdAt: string };
export default function AddReviewPage() {
  const [name, setName] = useState("");
  const [review, setReview] = useState("");
  const [error, setError] = useState("");
  function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanReview = review.trim();
    if (!cleanName || !cleanReview) { setError("Add your name and a review before submitting."); return; }
    if (cleanName.length > 60 || cleanReview.length > 500) { setError("Please keep your name under 60 characters and your review under 500."); return; }
    try {
      const existing = JSON.parse(localStorage.getItem(REVIEW_KEY) ?? "[]");
      const previous: UserReview[] = Array.isArray(existing) ? existing.filter((item) => item && typeof item.name === "string" && typeof item.review === "string") : [];
      const next = [{ id: "review-" + Date.now(), name: cleanName, review: cleanReview, createdAt: new Date().toISOString() }, ...previous].slice(0, 100);
      localStorage.setItem(REVIEW_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("mim-reviews-updated"));
      // Return home after the saved review is stored; the home page reads it on mount.
      window.location.href = "/#reviews";
    } catch { setError("Your browser could not save this review. Check available site storage and try again."); }
  }
  return <main className="paper-noise"><SiteHeader/><section className="page-hero"><div className="container"><span className="eyebrow">Your words, your way</span><h1>Leave a <span>review.</span></h1><p>Tell us what you think of Meme Is Mine. Keep it kind, honest, and helpful for the next meme maker.</p></div></section>
    <section className="section add-review-section"><div className="container add-review-layout"><div><span className="eyebrow">Community notes / 01</span><h2 className="section-title">Your take.<br/><span className="serif-italic">In your words.</span></h2><p className="section-note">Reviews help other people see what it’s like to create here.</p><div className="review-form-note"><Star size={18} fill="currentColor"/><span>Reviews are saved in this browser. Shared, site-wide reviews need a connected database.</span></div><Link href="/#reviews" className="text-link"><ArrowLeft size={14}/> Back to reviews</Link></div>
      <form className="review-form" onSubmit={submitReview}><label htmlFor="review-name">Your name</label><input id="review-name" value={name} onChange={(event)=>setName(event.target.value)} maxLength={60} placeholder="What should we call you?" required/><label htmlFor="review-text">Your review</label><textarea id="review-text" value={review} onChange={(event)=>setReview(event.target.value)} maxLength={500} rows={6} placeholder="What did you enjoy? What could be better?" required/><div className="review-form-foot"><span>{review.length}/500 characters</span><button type="submit" className="button button-dark">Publish review <ArrowUpRight size={15}/></button></div>{error && <p className="review-form-error" role="alert">{error}</p>}</form>
    </div></section><footer className="site-footer"><div className="container footer-inner"><div className="footer-copy">Meme Is Mine · Add a review</div><div className="footer-links"><Link href="/">Home</Link><Link href="/templates">Templates</Link><Link href="/studio">Studio</Link></div><span className="footer-copy">Made for the group chat © 2026</span></div></footer></main>;
}