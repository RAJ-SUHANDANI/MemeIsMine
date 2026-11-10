import { ReframeHome } from "@/components/reframe-home";
import { imageCatalog } from "@/lib/image-catalog";
import { publicVideo, videoCatalog } from "@/lib/video-catalog";

export default function HomePage() {
  // Serve enough real formats for an uninterrupted gallery on first paint.
  // The archive is refreshed by the existing scheduled catalogue workflows.
  const images = imageCatalog.slice(0, 24);
  const withPosters = videoCatalog.filter(item =>
    item.posterUrl && !/\.(gif|mp4|webm)(?:[?#]|$)/i.test(item.posterUrl)
  );
  const selected = withPosters.slice(0, 24);
  if (selected.length < 24) {
    const seen = new Set(selected.map(item => item.id));
    for (const item of videoCatalog) {
      if (selected.length >= 24) break;
      if (!seen.has(item.id)) { selected.push(item); seen.add(item.id); }
    }
  }
  return <ReframeHome initialImages={images} initialVideos={selected.map(publicVideo)} />;
}
