"use server";
import { accountSession } from "@/lib/auth";
import { canonicalReactionKey } from "@/lib/template-reactions";
import type { LikeState } from "@/components/use-template-likes";

export async function setTemplateLike(
  key: string,
  liked: boolean,
): Promise<LikeState | null> {
  const canonical = canonicalReactionKey(key);
  if (!canonical || typeof liked !== "boolean") return null;
  const session = await accountSession();
  if (!session) return null;
  const { data, error } = await session.client.rpc("set_template_like", {
    p_key: canonical,
    p_liked: liked,
  });
  return error || !data ? null : { ...data, key: canonical };
}
