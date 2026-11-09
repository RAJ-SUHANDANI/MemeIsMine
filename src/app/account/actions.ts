"use server";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth";
import { returnPath } from "@/lib/return-path";

export async function authenticate(form: FormData) {
  const signingUp = form.get("mode") === "signup";
  const route = signingUp ? "/signup" : "/login";
  const next = returnPath(form.get("next"));
  const fail = (status: string): never =>
    redirect(route + "?" + new URLSearchParams({ next, status }));
  const client = await authClient();
  if (!client) return fail("unavailable");
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (
    !email ||
    email.length > 254 ||
    password.length > 128 ||
    password.length < (signingUp ? 8 : 1)
  ) {
    return fail("invalid");
  }
  if (signingUp) {
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) return fail("signup-error");
    if (!data.session) return fail("check-email");
  } else {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) return fail("login-error");
  }
  redirect(next);
}

export async function requestPasswordReset(form: FormData) {
  const client = await authClient();
  const email = String(form.get("email") ?? "").trim();
  if (client && email && email.length <= 254)
    await client.auth.resetPasswordForEmail(email);
  redirect("/account/recover?sent=1");
}

export async function updatePassword(form: FormData) {
  const client = await authClient();
  if (!client) redirect("/login");
  const password = String(form.get("password") ?? "");
  if (password.length < 8 || password.length > 128)
    redirect("/account/password?error=1");
  const { data } = await client.auth.getUser();
  if (!data.user) redirect("/login");
  const { error } = await client.auth.updateUser({ password });
  if (error) redirect("/account/password?error=1");
  redirect("/account");
}

export async function signOut() {
  const client = await authClient();
  if (client) await client.auth.signOut({ scope: "local" });
  redirect("/login");
}
