/* The archive supplies native video and GIF files. */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { Film, Maximize2 } from "lucide-react";
import { TemplatePreview } from "./template-preview";

export type PreviewVideoTemplate = {
  id: string;
  name: string;
  url: string;
  posterUrl: string;
  mediaType: "gif" | "video";
  sourcePage?: string;
  likeId?: string;
  width?: number;
  height?: number;
};

function posterFor(template: PreviewVideoTemplate) {
  return /\.(gif|mp4|webm)(?:[?#]|$)/i.test(template.posterUrl)
    ? ""
    : template.posterUrl;
}

function VideoPreviewMedia({ template }: { template: PreviewVideoTemplate }) {
  const [failed, setFailed] = useState(false);
  const poster = posterFor(template);
  const params = new URLSearchParams({ url: template.url });
  if (template.sourcePage) params.set("referrer", template.sourcePage);
  const src = "/api/video-source?" + params.toString();

  if (failed) {
    return (
      <div className="video-preview-failed">
        {poster && <img src={poster} alt={template.name} />}
        <p role="status">
          The clip couldn’t load. You can still open the editor.
        </p>
      </div>
    );
  }

  return template.mediaType === "gif" ? (
    <img src={src} alt={template.name} onError={() => setFailed(true)} />
  ) : (
    <video
      src={src}
      aria-label={template.name}
      poster={poster || undefined}
      muted
      loop
      playsInline
      autoPlay
      disablePictureInPicture
      disableRemotePlayback
      onError={() => setFailed(true)}
    />
  );
}

export function VideoTemplatePoster({
  template,
  eager = false,
}: {
  template: PreviewVideoTemplate;
  eager?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const poster = posterFor(template);
  return (
    <>
      <button
        type="button"
        className="video-poster-trigger"
        aria-label={"Preview " + template.name}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Film size={36} aria-hidden="true" />
        {poster && (
          <img
            src={poster}
            alt=""
            loading={eager ? "eager" : "lazy"}
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        )}
        <span className="object-spec" aria-hidden="true">
          <span>
            {template.mediaType === "gif" ? "Animated GIF" : "Video clip"}
          </span>
          {Boolean(template.width && template.height) && (
            <span>
              {template.width} × {template.height}
            </span>
          )}
        </span>
        <span className="format-preview-label">
          <Maximize2 size={14} /> Preview
        </span>
      </button>
      {open && (
        <TemplatePreview
          title={template.name}
          reactionKey={"video:" + (template.likeId ?? template.id)}
          sourceHref={template.sourcePage}
          editorHref={"/video-editor/" + encodeURIComponent(template.id)}
          onClose={() => setOpen(false)}
        >
          <VideoPreviewMedia template={template} />
        </TemplatePreview>
      )}
    </>
  );
}
