import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "./site";
import { SiteFooter } from "./site-chrome";
import { accountSession } from "@/lib/auth";
import { authConfig } from "@/lib/auth-config";
import { returnPath } from "@/lib/return-path";
import { authenticate } from "@/app/account/actions";
import { AuthPassword, AuthSubmit } from "./auth-fields";

const messages: Record<string, string> = {
  unavailable: "Account access is temporarily unavailable.",
  invalid:
    "Enter a valid email and password. New passwords need at least 8 characters.",
  "signup-error":
    "We couldn’t create the account. Check your details and try again.",
  "login-error":
    "We couldn’t sign you in. Check your details and confirm your email.",
  "check-email":
    "Check your inbox for a confirmation link, then return to sign in.",
  "confirmation-error":
    "This confirmation link is invalid or expired. Try signing up again.",
};

export async function AccountForm({
  mode,
  query,
}: {
  mode: "login" | "signup";
  query: { next?: string; status?: string };
}) {
  const next = returnPath(query.next);
  if (await accountSession()) redirect(next);
  const signup = mode === "signup";
  const enabled = Boolean(authConfig());
  const message = enabled ? messages[query.status ?? ""] : messages.unavailable;
  const suffix = "?next=" + encodeURIComponent(next);

  return (
    <main id="main-content" className="membership-page auth-page">
      <SiteHeader />
      <div className="container auth-spread">
        <div className="auth-comic">
          <div className="auth-comic-mast">
            <span>MEME IS MINE / THE STUDIO</span>
            <span>{signup ? "01 / FIRST EDIT" : "02 / THE COMEBACK"}</span>
          </div>
          {signup ? (
            <figure className="auth-comic-photo">
              <Image
                src="/templates/distracted-boyfriend.jpg"
                alt="Distracted Boyfriend meme"
                width={1200}
                height={800}
                priority
              />
              <figcaption>“I was only going to make one meme.”</figcaption>
            </figure>
          ) : (
            <div className="auth-comic-panels">
              {[
                ["top", "Explaining the joke"],
                ["bottom", "Sending the meme"],
              ].map(([panel, caption]) => (
                <figure key={panel}>
                  <span className="format-card-panel" data-panel={panel}>
                    <Image
                      src="/templates/drake.jpg"
                      alt=""
                      fill
                      sizes="(max-width: 720px) 42vw, 22vw"
                      priority
                    />
                  </span>
                  <figcaption>{caption}</figcaption>
                </figure>
              ))}
            </div>
          )}
          <div className="auth-comic-note">
            <span>
              {signup
                ? "The first one is never the last."
                : "Some things are better said in memes."}
            </span>
            <span aria-hidden="true">✳</span>
          </div>
        </div>
        <section className="auth-form-panel" aria-labelledby="auth-title">
          <nav className="auth-tabs" aria-label="Account options">
            <Link
              aria-current={!signup ? "page" : undefined}
              href={"/login" + suffix}
            >
              Sign in
            </Link>
            <Link
              aria-current={signup ? "page" : undefined}
              href={"/signup" + suffix}
            >
              Create account
            </Link>
          </nav>
          <h1 id="auth-title">
            {signup ? "Enter the group chat." : "Back for another take?"}
          </h1>
          <p>
            {signup
              ? "Get a free studio for your image and video memes."
              : "Sign in to pick up your drafts or make something new."}
          </p>
          {message && (
            <p className="membership-message" role="status">
              {message}
            </p>
          )}
          <form className="membership-form" action={authenticate}>
            <input type="hidden" name="mode" value={mode} />
            <input type="hidden" name="next" value={next} />
            <label>
              Email
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                maxLength={254}
                disabled={!enabled}
              />
            </label>
            <div className="auth-password">
              <label htmlFor="auth-password">Password</label>
              <AuthPassword signup={signup} disabled={!enabled} />
            </div>
            {signup ? (
              <p className="auth-form-hint">Use at least 8 characters.</p>
            ) : (
              <Link className="auth-form-hint" href="/account/recover">
                Forgot password?
              </Link>
            )}
            <AuthSubmit signup={signup} disabled={!enabled} />
          </form>
          <Link href="/explore" className="auth-browse">
            Just browsing? See the templates <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
