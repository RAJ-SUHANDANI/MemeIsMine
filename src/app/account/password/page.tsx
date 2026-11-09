import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site";
import { SiteFooter } from "@/components/site-chrome";
import { accountSession } from "@/lib/auth";
import { updatePassword } from "../actions";

export const metadata = { title: "Choose a new password" };

export default async function Password({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await accountSession())) redirect("/account/recover");
  const { error } = await searchParams;
  return (
    <main id="main-content" className="membership-page">
      <SiteHeader />
      <section className="container membership-panel">
        <h1>Choose a new password.</h1>
        {error && (
          <p className="membership-message" role="status">
            Use 8–128 characters and choose a password you haven’t used here
            before.
          </p>
        )}
        <form action={updatePassword} className="membership-form">
          <label>
            New password{" "}
            <input
              name="password"
              type="password"
              minLength={8}
              maxLength={128}
              required
              autoComplete="new-password"
            />
          </label>
          <button className="button button-dark">Save password</button>
        </form>
      </section>
      <SiteFooter />
    </main>
  );
}
