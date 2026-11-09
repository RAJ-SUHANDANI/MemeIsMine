import Link from "next/link";
import { SiteHeader } from "@/components/site";
import { SiteFooter } from "@/components/site-chrome";
import { requireAccount } from "@/lib/require-account";
import { signOut } from "./actions";

export const metadata = { title: "Account" };

export default async function Account() {
  const { user } = await requireAccount("/account");
  return (
    <main id="main-content" className="membership-page">
      <SiteHeader />
      <section className="container membership-panel">
        <p className="eyebrow">Your account</p>
        <h1>You’re in.</h1>
        <p>{user.email}</p>
        <p>
          Make image and video memes for free. Your saved drafts and bookmarks
          live in Studio on this device.
        </p>
        <div className="membership-actions">
          <Link className="button button-dark" href="/studio">
            Open Studio
          </Link>
          <Link className="button button-paper" href="/account/password">
            Change password
          </Link>
          <form action={signOut}>
            <button className="button button-paper">Sign out</button>
          </form>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
