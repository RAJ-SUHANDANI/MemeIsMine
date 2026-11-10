import "server-only";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { accountSession } from "./auth";
import { editorTarget, returnPath } from "./return-path";
import { hasEditorTemplate } from "./editor-catalog";

export async function requireAccount(path: string) {
  // Auth pages must never be static when the server DB is unconfigured at build time.
  await connection();
  const session = await accountSession();
  if (!session) redirect("/login?next=" + encodeURIComponent(returnPath(path)));
  return session;
}

export async function requireEditorAccess(path: string) {
  const target = editorTarget(path);
  if (!target) notFound();
  await requireAccount(target.path);
  if (!hasEditorTemplate(target)) notFound();
}
