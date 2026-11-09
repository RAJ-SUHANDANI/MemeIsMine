import Link from "next/link";
import { SiteHeader } from "@/components/site";
import { SiteFooter } from "@/components/site-chrome";
import { authConfig } from "@/lib/auth-config";
import { requestPasswordReset } from "../actions";

export const metadata = { title: "Reset your password" };

export default async function Recover({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;
  return (
    <main id="main-content" className="membership-page">
      <SiteHeader />
      <section className="container membership-panel">
        <h1>Reset your password.</h1>
        {sent ? (
          <p role="status">
            If this email has an account, a password reset link will arrive
            shortly.
          </p>
        ) : (
          <form action={requestPasswordReset} className="membership-form">
            <label>
              Email{" "}
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
              />
            </label>
            <button className="button button-dark" disabled={!authConfig()}>
              Send reset link
            </button>
          </form>
        )}
        <p className="membership-switch">
          <Link href="/login">Back to sign in</Link>
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
