const origin = "https://return.invalid";

export function returnPath(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    /^\/[/\\]/.test(value)
  )
    return "/studio";
  try {
    const url = new URL(value, origin);
    if (
      url.origin !== origin ||
      !/^\/(?:(?:account|studio|explore|templates|video-templates|create\/[a-z0-9-]+|video-editor\/[a-z0-9-]+)\/?)?$/i.test(
        url.pathname,
      )
    )
      return "/studio";
    return url.pathname + url.search;
  } catch {
    return "/studio";
  }
}

export function editorTarget(value: unknown) {
  const path = returnPath(value);
  const url = new URL(path, origin);
  const match = url.pathname.match(
    /^\/(create|video-editor)\/([a-z0-9-]{1,120})$/,
  );
  if (!match) return null;
  const kind = match[1] === "create" ? "image" : "video";
  const indian =
    kind === "image" && url.searchParams.get("source") === "indian";
  return {
    path,
    kind,
    id: match[2],
    indian,
    upload: kind === "image" && match[2] === "upload",
  } as const;
}
