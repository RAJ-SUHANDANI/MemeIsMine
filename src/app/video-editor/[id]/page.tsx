import { requireEditorAccess } from "@/lib/require-account";
import Editor from "./editor";

type Query = Record<string, string | string[] | undefined>;
export default async function EditorPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Query>;
}) {
  const { id } = await params;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }
  const search = query.toString();
  await requireEditorAccess("/video-editor/" + encodeURIComponent(id) + (search ? "?" + search : ""));
  return <Editor />;
}
