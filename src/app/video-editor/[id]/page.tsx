"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowLeft, ArrowRight, BringToFront, Check, Clapperboard, Copy, Download, Eye, EyeOff, Save,
  ImagePlus, Move, SlidersHorizontal, Trash2, Type, Video, Volume2, VolumeX
} from "lucide-react";
import { SiteHeader } from "@/components/site";

type VideoTemplate = {
  id: string; name: string; url: string; posterUrl: string;
  mediaType: "gif" | "video"; publishedAt: string | null; trending: boolean;
  sourcePage?: string;
};
type TextLayer = {
  id: string; kind: "text"; name: string; text: string; x: number; y: number; w: number; h: number;
  rotation: number; fontSize: number; fontFamily: string; color: string; outline: boolean; outlineColor: string; outlineWidth: number;
  shadow: boolean; align: "left" | "center" | "right"; uppercase: boolean; opacity: number;
};
type ImageLayer = { id: string; kind: "image"; name: string; src: string; x: number; y: number; w: number; h: number; rotation: number; opacity: number };
type Layer = TextLayer | ImageLayer;
type Panel = "text" | "overlay" | "dimensions" | "effects" | "layers";
type DragInfo = { id: string; mode: "move" | "resize"; clientX: number; clientY: number; x: number; y: number; w: number; h: number } | null;
type Preset = { label: string; width: number; height: number; name: string };
const PRESETS: Preset[] = [
  { label: "1:1", width: 1080, height: 1080, name: "Square" },
  { label: "9:16", width: 1080, height: 1920, name: "Story" },
  { label: "16:9", width: 1920, height: 1080, name: "Landscape" },
  { label: "4:5", width: 1080, height: 1350, name: "Portrait" },
  { label: "4:3", width: 1440, height: 1080, name: "Classic" },
  { label: "3:2", width: 1500, height: 1000, name: "Photo" },
];
const INITIAL_LAYER: TextLayer = {
  id: "video-caption-1", kind: "text", name: "Caption", text: "YOUR TEXT HERE",
  x: 50, y: 20, w: 86, h: 18, rotation: 0, fontSize: 54, fontFamily: "Impact", color: "#FFFFFF",
  outline: true, outlineColor: "#000000", outlineWidth: 7, shadow: true, align: "center", uppercase: true, opacity: 1,
};
const PANEL_ITEMS: { id: Panel; label: string; icon: typeof Type }[] = [
  { id: "text", label: "Text", icon: Type }, { id: "overlay", label: "Overlay", icon: ImagePlus },
  { id: "dimensions", label: "Dimensions", icon: SlidersHorizontal }, { id: "effects", label: "Effects", icon: SlidersHorizontal },
  { id: "layers", label: "Layers", icon: BringToFront },
];
function objectId() { return "motion-" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36); }
function dataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Image could not be read."));
    reader.onerror = () => reject(new Error("Image could not be read."));
    reader.readAsDataURL(file);
  });
}
function mediaUrl(url: string, sourcePage?: string, fresh = false) {
  return "/api/video-source?url=" + encodeURIComponent(url)
    + (sourcePage ? "&referrer=" + encodeURIComponent(sourcePage) : "")
    + (fresh ? "&fresh=1" : "");
}


async function convertToMp4(blob: Blob, ffmpegRef: { current: import("@ffmpeg/ffmpeg").FFmpeg | null }): Promise<Blob> {
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { toBlobURL } = await import("@ffmpeg/util");
  const ffmpeg = ffmpegRef.current ?? new FFmpeg();
  ffmpegRef.current = ffmpeg;
  if (!ffmpeg.loaded) {
    const base = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
    const [coreURL, wasmURL] = await Promise.all([
      toBlobURL(base + "/ffmpeg-core.js", "text/javascript"),
      toBlobURL(base + "/ffmpeg-core.wasm", "application/wasm"),
    ]);
    await ffmpeg.load({ coreURL, wasmURL });
  }
  await ffmpeg.writeFile("meme-input.webm", new Uint8Array(await blob.arrayBuffer()));
  await ffmpeg.exec(["-y", "-i", "meme-input.webm", "-map", "0:v:0", "-map", "0:a?", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "24", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "meme-output.mp4"]);
  const output = await ffmpeg.readFile("meme-output.mp4");
  if (typeof output === "string") throw new Error("The MP4 encoder returned an invalid file.");
  const bytes = Uint8Array.from(output);
  const result = new Blob([bytes.buffer as ArrayBuffer], { type: "video/mp4" });
  await Promise.all([ffmpeg.deleteFile("meme-input.webm").catch(() => undefined), ffmpeg.deleteFile("meme-output.mp4").catch(() => undefined)]);
  if (!result.size) throw new Error("MP4 conversion produced an empty file.");
  return result;
}

export default function VideoEditorPage() {
  const params = useParams<{ id: string }>();
  const templateId = params.id;
  const [template, setTemplate] = useState<VideoTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [layers, setLayers] = useState<Layer[]>([INITIAL_LAYER]);
  const layersRef = useRef<Layer[]>([INITIAL_LAYER]);
  const [selectedId, setSelectedId] = useState<string | null>(INITIAL_LAYER.id);
  const [panel, setPanel] = useState<Panel>("text");
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1080);
  const [customWidth, setCustomWidth] = useState("1080");
  const [customHeight, setCustomHeight] = useState("1080");
  const background = "#151515";
  const [fit, setFit] = useState<"cover" | "contain">("cover");
  const [seconds, setSeconds] = useState(8);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [grayscale, setGrayscale] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const effectFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)${grayscale ? " grayscale(1)" : ""}`;
  const [busy, setBusy] = useState(false);
  const [videoAudioEnabled, setVideoAudioEnabled] = useState(false);
  const [videoRecoveryAttempted, setVideoRecoveryAttempted] = useState(false);
  const [videoRefreshNonce, setVideoRefreshNonce] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const ffmpegRef = useRef<import("@ffmpeg/ffmpeg").FFmpeg | null>(null);
  const [notice, setNotice] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(900);
  function saveVideoDraft() {
    if (!template) { setNotice("Wait for the video template to load before saving."); return; }
    try {
      const existing = JSON.parse(localStorage.getItem("mim-video-drafts") ?? "[]");
      const drafts = Array.isArray(existing) ? existing : [];
      const currentId = new URLSearchParams(window.location.search).get("draft");
      const draft = { id: currentId ?? "video-draft-" + Date.now(), templateId, name: template.name, url: template.posterUrl || template.url, mediaType: template.mediaType, layers: layersRef.current, width, height, fit, seconds, brightness, contrast, saturation, grayscale, playbackSpeed, updatedAt: new Date().toISOString() };
      localStorage.setItem("mim-video-drafts", JSON.stringify([draft, ...drafts.filter((item: {id?: string}) => item.id !== draft.id)].slice(0, 30)));
      setDraftSaved(true);
      setNotice("Video draft saved to your studio on this device.");
    } catch { setNotice("Could not save this draft. Try removing large image overlays and saving again."); }
  }
  const [drag, setDrag] = useState<DragInfo>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const gifRef = useRef<HTMLImageElement>(null);
  const overlayInput = useRef<HTMLInputElement>(null);
  const selected = layers.find((layer) => layer.id === selectedId) ?? null;
  const selectedText = selected?.kind === "text" ? selected : null;
  const selectedImage = selected?.kind === "image" ? selected : null;
  const currentPreset = PRESETS.find((preset) => preset.width === width && preset.height === height)?.label ?? "custom";
  const safeMediaUrl = useMemo(() => template ? mediaUrl(template.url, template.sourcePage, videoRefreshNonce > 0) : "", [template, videoRefreshNonce]);

  const setLayerList = useCallback((next: Layer[]) => { layersRef.current = next; setLayers(next); }, []);
  const updateLayer = useCallback((id: string, patch: Partial<Layer>) => {
    setLayerList(layersRef.current.map((item) => item.id === id ? { ...item, ...patch } as Layer : item));
  }, [setLayerList]);

  useEffect(() => {
    let alive = true;
    fetch("/api/video-templates?slug=" + encodeURIComponent(templateId))
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success || !data.template) throw new Error(data.error ?? "This video template is not available yet.");
        if (!alive) return;
        setTemplate(data.template);
        setVideoRecoveryAttempted(false);
      })
      .catch((reason: unknown) => { if (alive) setError(reason instanceof Error ? reason.message : "Could not load the video template."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [templateId]);
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed, template]);
  useEffect(() => {
    setViewportHeight(window.innerHeight);
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  function toast(message: string) { setNotice(message); window.setTimeout(() => setNotice(""), 3200); }
  function addText() {
    const item: TextLayer = { ...INITIAL_LAYER, id: objectId(), name: "Text " + (layersRef.current.filter((layer) => layer.kind === "text").length + 1), text: "YOUR TEXT HERE", x: 50, y: 50, w: 72, h: 16 };
    setLayerList([...layersRef.current, item]); setSelectedId(item.id); setPanel("text");
  }
  async function addOverlays(files: FileList | null) {
    if (!files?.length) return;
    const existing = layersRef.current.filter((layer) => layer.kind === "image").length;
    for (const file of Array.from(files).slice(0, Math.max(0, 8 - existing))) {
      if (!file.type.startsWith("image/")) { toast("Choose an image file."); continue; }
      if (file.size > 2.5 * 1024 * 1024) { toast("Each overlay must be smaller than 2.5 MB."); continue; }
      try {
        const src = await dataUrl(file);
        const layer: ImageLayer = { id: objectId(), kind: "image", name: file.name.replace(/\.[^.]+$/, ""), src, x: 50, y: 50, w: 28, h: 28, rotation: 0, opacity: 1 };
        setLayerList([...layersRef.current, layer]); setSelectedId(layer.id); setPanel("overlay");
      } catch { toast("The selected image could not be loaded."); }
    }
    if (existing >= 8) toast("You can add up to eight overlay images.");
  }
  function onDragStart(event: ReactPointerEvent<HTMLElement>, layer: Layer, mode: "move" | "resize" = "move") {
    event.preventDefault(); event.stopPropagation();
    stageRef.current?.setPointerCapture(event.pointerId);
    setSelectedId(layer.id);
    setDrag({ id: layer.id, mode, clientX: event.clientX, clientY: event.clientY, x: layer.x, y: layer.y, w: layer.w, h: layer.h });
  }
  function onStageMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dx = (event.clientX - drag.clientX) / rect.width * 100;
    const dy = (event.clientY - drag.clientY) / rect.height * 100;
    setLayerList(layersRef.current.map((layer) => {
      if (layer.id !== drag.id) return layer;
      if (drag.mode === "resize") return { ...layer, w: Math.max(6, Math.min(100, drag.w + dx)), h: Math.max(5, Math.min(100, drag.h + dy)) } as Layer;
      return { ...layer, x: Math.max(0, Math.min(100, drag.x + dx)), y: Math.max(0, Math.min(100, drag.y + dy)) } as Layer;
    }));
  }
  function onDragEnd() { setDrag(null); }
  function changeDimensions() {
    const w = Math.round(Number(customWidth)); const h = Math.round(Number(customHeight));
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 200 || h < 200 || w > 4000 || h > 4000) { toast("Use dimensions between 200 and 4000 pixels."); return; }
    setWidth(w); setHeight(h);
  }
  function applyPreset(preset: Preset) { setWidth(preset.width); setHeight(preset.height); setCustomWidth(String(preset.width)); setCustomHeight(String(preset.height)); }
  function duplicateLayer() {
    if (!selected) return;
    const item = { ...selected, id: objectId(), name: selected.name + " copy", x: Math.min(94, selected.x + 5), y: Math.min(94, selected.y + 5) } as Layer;
    setLayerList([...layersRef.current, item]); setSelectedId(item.id);
  }
  function deleteLayer() {
    if (!selectedId) return;
    const next = layersRef.current.filter((item) => item.id !== selectedId);
    setLayerList(next); setSelectedId(next[next.length - 1]?.id ?? null);
  }
  function moveLayer(id: string, direction: -1 | 1) {
    const next = [...layersRef.current]; const index = next.findIndex((item) => item.id === id); const target = index + direction;
    if (index < 0 || target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setLayerList(next);
  }

  function toggleVideoAudio() {
    const video = videoRef.current;
    if (!video || template?.mediaType !== "video") return;
    const enabled = !videoAudioEnabled;
    video.muted = !enabled;
    setVideoAudioEnabled(enabled);
    if (video.paused) void video.play().catch(() => undefined);
  }

  async function recoverEditorVideo() {
    if (!template || template.mediaType !== "video" || videoRecoveryAttempted) return;
    setVideoRecoveryAttempted(true);
    try {
      const response = await fetch("/api/video-templates?slug=" + encodeURIComponent(template.id) + "&refresh=1", { cache: "no-store" });
      const data = await response.json();
      const fresh = data?.template as VideoTemplate | undefined;
      if (response.ok && data?.success && fresh?.url) {
        // Force a fresh proxy request even when the archive still points to the
        // same file: the source may have transiently returned a cached error.
        setTemplate({ ...fresh, sourcePage: fresh.sourcePage ?? template.sourcePage });
        setVideoRefreshNonce((value) => value + 1);
        setVideoAudioEnabled(false);
        toast("Retried the latest source video.");
        return;
      }
    } catch {
      // Keep the editor usable and report the source problem without crashing.
    }
    toast("This source video could not be loaded. Try another video template.");
  }

  async function exportVideo(format: "webm" | "mp4" = "webm") {
    if (!template) { toast("Choose a video template first."); return; }
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) { toast("Video export is not supported in this browser."); return; }
    if (!("captureStream" in canvas) || typeof MediaRecorder === "undefined") { toast("WebM export is not supported in this browser. Try the latest Chrome or Edge."); return; }
    const source = template.mediaType === "gif" ? gifRef.current : videoRef.current;
    if (!source) { toast("The template is still loading."); return; }
    const nativeW = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
    const nativeH = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;
    if (!nativeW || !nativeH) { toast("Wait for the template preview to load, then export again."); return; }
    setBusy(true);
    let stream: MediaStream | null = null;
    let sourceCaptureStream: MediaStream | null = null;
    let audioDestination: MediaStreamAudioDestinationNode | null = null;
    let originalMuted: boolean | null = null;
    try {
      stream = canvas.captureStream(30);
      if (source instanceof HTMLVideoElement) {
        originalMuted = source.muted;
        source.playbackRate = playbackSpeed;
        // Capture the original audio track along with the caption-composited canvas frames.
        source.muted = false;
        source.currentTime = 0;
        await source.play().catch(() => undefined);
        const capturable = source as HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream };
        const capture = capturable.captureStream ?? capturable.mozCaptureStream;
        if (capture) {
          sourceCaptureStream = capture.call(source);
          sourceCaptureStream.getAudioTracks().forEach((track) => stream?.addTrack(track));
        }
        // Fall back to Web Audio in browsers without media-element capture.
        if (!sourceCaptureStream?.getAudioTracks().length && typeof window.AudioContext !== "undefined") {
          let audioContext = audioContextRef.current;
          if (!audioContext) {
            audioContext = new AudioContext();
            audioContextRef.current = audioContext;
            audioSourceNodeRef.current = audioContext.createMediaElementSource(source);
            audioSourceNodeRef.current.connect(audioContext.destination);
          }
          await audioContext.resume();
          audioDestination = audioContext.createMediaStreamDestination();
          audioSourceNodeRef.current?.connect(audioDestination);
          const audioTrack = audioDestination.stream.getAudioTracks()[0];
          if (audioTrack && stream) stream.addTrack(audioTrack);
        }
      }
      if (!stream) throw new Error("Could not capture the video canvas.");
      const mimeType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type));
      if (!mimeType) throw new Error("This browser cannot create a WebM file.");
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 7000000 });
      const chunks: BlobPart[] = [];
      const finished = new Promise<Blob>((resolve, reject) => {
        recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
        recorder.onerror = () => reject(new Error("Recording failed. Please try a shorter export."));
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      });
      const drawFit = (image: CanvasImageSource, imageW: number, imageH: number) => {
        const scale = fit === "cover" ? Math.max(width / imageW, height / imageH) : Math.min(width / imageW, height / imageH);
        const w = imageW * scale; const h = imageH * scale;
        ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
      };
      const paint = () => {
        ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
        const sourceW = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
        const sourceH = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;
        if (sourceW && sourceH) {
          ctx.filter = effectFilter;
          drawFit(source, sourceW, sourceH);
          ctx.filter = "none";
        }
        for (const layer of layersRef.current) {
          const x = layer.x / 100 * width; const y = layer.y / 100 * height;
          const w = layer.w / 100 * width; const h = layer.h / 100 * height;
          ctx.save(); ctx.globalAlpha = layer.opacity; ctx.translate(x, y); ctx.rotate(layer.rotation * Math.PI / 180);
          if (layer.kind === "image") {
            const cached = overlayCache.get(layer.src);
            if (cached && cached.complete && cached.naturalWidth) {
              const scale = Math.min(w / cached.naturalWidth, h / cached.naturalHeight);
              const drawW = cached.naturalWidth * scale; const drawH = cached.naturalHeight * scale;
              ctx.drawImage(cached, -drawW / 2, -drawH / 2, drawW, drawH);
            }
          } else {
            const fontPx = layer.fontSize * width / 1080;
            ctx.font = "900 " + fontPx + "px " + layer.fontFamily + ", Arial Black, sans-serif"; ctx.textAlign = layer.align; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
            ctx.shadowColor = layer.shadow ? "rgba(0,0,0,.5)" : "transparent"; ctx.shadowBlur = layer.shadow ? fontPx * .08 : 0;
            const text = layer.uppercase ? layer.text.toUpperCase() : layer.text;
            const lines: string[] = []; let line = "";
            text.split(/\s+/).filter(Boolean).forEach((word) => {
              const test = line ? line + " " + word : word;
              if (ctx.measureText(test).width > w && line) { lines.push(line); line = word; } else line = test;
            });
            if (line) lines.push(line);
            const shown = lines.slice(0, Math.max(1, Math.floor(h / (fontPx * 1.05))));
            const lineX = layer.align === "left" ? -w / 2 : layer.align === "right" ? w / 2 : 0;
            shown.forEach((value, index) => {
              const lineY = (index - (shown.length - 1) / 2) * fontPx * 1.05;
              if (layer.outline) { ctx.lineWidth = Math.max(1, layer.outlineWidth * width / 1080); ctx.strokeStyle = layer.outlineColor; ctx.strokeText(value, lineX, lineY, w); }
              ctx.fillStyle = layer.color; ctx.fillText(value, lineX, lineY, w);
            });
          }
          ctx.restore();
        }
      };
      const overlayCache = new Map<string, HTMLImageElement>();
      for (const layer of layersRef.current) if (layer.kind === "image") {
        const image = new Image(); image.src = layer.src; overlayCache.set(layer.src, image);
        await new Promise<void>((resolve) => { if (image.complete && image.naturalWidth) resolve(); else { image.onload = () => resolve(); image.onerror = () => resolve(); } });
      }
      const start = performance.now();
      recorder.start(250);
      const renderFrame = () => {
        paint();
        if (performance.now() - start >= seconds * 1000) { if (recorder.state === "recording") recorder.stop(); return; }
        requestAnimationFrame(renderFrame);
      };
      renderFrame();
      const recordedBlob = await finished;
      if (!recordedBlob.size) throw new Error("The exported file was empty. Please try again.");
      let finalBlob = recordedBlob;
      if (format === "mp4") {
        toast("Converting to MP4. The first conversion loads the encoder and can take a little longer.");
        finalBlob = await convertToMp4(recordedBlob, ffmpegRef);
      }
      const url = URL.createObjectURL(finalBlob);
      const link = document.createElement("a"); link.href = url; link.download = "meme-is-mine-video-" + width + "x" + height + "." + format; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      toast("Video exported as " + format.toUpperCase() + " at " + width + " by " + height + " pixels.");
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : "Could not export this video.");
    } finally {
      if (audioDestination) {
        audioSourceNodeRef.current?.disconnect(audioDestination);
        audioDestination.stream.getTracks().forEach((track) => track.stop());
      }
      sourceCaptureStream?.getTracks().forEach((track) => track.stop());
      stream?.getTracks().forEach((track) => track.stop());
      if (source instanceof HTMLVideoElement && originalMuted !== null) {
        source.muted = originalMuted;
        source.playbackRate = playbackSpeed;
      }
      setBusy(false);
    }
  }

  return <main className="paper-noise editor-page video-editor-page"><SiteHeader/>
    <div className="editor-topbar">
      <div className="editor-crumb"><Link href="/video-templates" aria-label="Back to video templates"><ArrowLeft size={16}/></Link><span>/</span><Link href="/video-templates">Video templates</Link><span>/</span><strong>{template?.name ?? "Video editor"}</strong></div>
      <div className="saved-indicator">{draftSaved ? "Draft saved locally" : template ? (template.mediaType === "gif" ? "Animated GIF source" : "Video source") : "Loading template"}</div>
      <div className="editor-top-actions"><label className="video-duration-control">Export length<select value={seconds} onChange={(event) => setSeconds(Number(event.target.value))}><option value={3}>3 sec</option><option value={5}>5 sec</option><option value={8}>8 sec</option><option value={12}>12 sec</option><option value={15}>15 sec</option></select></label>{template?.mediaType === "video" && <label className="video-duration-control">Speed<select value={playbackSpeed} onChange={(event) => setPlaybackSpeed(Number(event.target.value))}><option value={0.5}>0.5×</option><option value={0.75}>0.75×</option><option value={1}>1×</option><option value={1.25}>1.25×</option><option value={1.5}>1.5×</option><option value={2}>2×</option></select></label>}<button className="button button-paper button-small" onClick={saveVideoDraft} disabled={!template}><Save size={14}/> Save to studio</button><button className="button button-paper button-small" onClick={() => exportVideo("webm")} disabled={busy || !template}><Download size={14}/> {busy ? "Rendering…" : "Export WebM"}</button><button className="button button-dark button-small" onClick={() => exportVideo("mp4")} disabled={busy || !template}><Download size={14}/> Export MP4</button></div>
    </div>
    {error && <section className="container section"><div className="empty-state"><Clapperboard size={28}/><h2>That template is not ready.</h2><p>{error}</p><Link href="/video-templates" className="button button-dark button-small">Back to video templates <ArrowRight size={14}/></Link></div></section>}
    {!error && <div className="editor-workspace editor-workspace-upgraded video-editor-workspace">
      <aside className="editor-sidebar editor-sidebar-tools">
        <div className="panel-label">Video tools</div><div className="tool-list editor-tool-list">
          {PANEL_ITEMS.map((item) => { const Icon = item.icon; return <button type="button" key={item.id} className={panel === item.id ? "tool-button active" : "tool-button"} aria-pressed={panel === item.id} onClick={() => setPanel(item.id)}><Icon size={18}/><span>{item.label}</span></button>; })}
        </div>
        <div className="sidebar-divider"/>
        {panel === "text" && <div className="editor-tool-panel"><div className="panel-label">Captions</div><button className="editor-add-tile" onClick={addText}><Type size={21}/><span><strong>Add text</strong><small>Place a new caption anywhere</small></span><span>＋</span></button><p className="control-help">Select a caption on the canvas to edit it. Drag it anywhere and resize it using the corner handle.</p><div className="sidebar-divider"/><button className="quick-style" onClick={() => selectedText ? updateLayer(selectedText.id, { fontSize: 58, color: "#FFFFFF", outline: true, shadow: true, uppercase: true }) : addText()}>Classic caption <span>Aa</span></button><button className="quick-style" onClick={() => selectedText ? updateLayer(selectedText.id, { fontSize: 36, color: "#151515", outline: false, shadow: false, uppercase: false }) : addText()}>Clean label <span>Aa</span></button></div>}
        {panel === "overlay" && <div className="editor-tool-panel"><div className="panel-label">Image overlays</div><button className="overlay-upload-tile" onClick={() => overlayInput.current?.click()}><ImagePlus size={23}/><strong>Upload an overlay</strong><small>Transparent PNG, JPG or WebP</small></button><input ref={overlayInput} hidden type="file" multiple accept="image/*" onChange={(event) => { void addOverlays(event.target.files); event.target.value = ""; }}/><p className="control-help">Add a logo, sticker, or reaction image. Image layers are included in the rendered video.</p><div className="sidebar-divider"/><button className="button button-paper button-small editor-full-button" onClick={duplicateLayer} disabled={!selected}><Copy size={14}/> Duplicate selected</button><button className="button button-plain button-small editor-full-button" onClick={deleteLayer} disabled={!selected}><Trash2 size={14}/> Delete selected</button></div>}
        {panel === "dimensions" && <div className="editor-tool-panel"><div className="panel-label">Output shape</div><div className="ratio-grid">{PRESETS.map((preset) => <button key={preset.label} className={currentPreset === preset.label ? "ratio-button active" : "ratio-button"} onClick={() => applyPreset(preset)}><span>{preset.label}</span><small>{preset.name}</small><i style={{ aspectRatio: preset.width + " / " + preset.height }}/></button>)}</div><div className="sidebar-divider"/><div className="panel-label">Custom size</div><div className="dimension-inputs"><label>Width<input type="number" min="200" max="4000" value={customWidth} onChange={(event) => setCustomWidth(event.target.value)}/></label><span>×</span><label>Height<input type="number" min="200" max="4000" value={customHeight} onChange={(event) => setCustomHeight(event.target.value)}/></label></div><button className="button button-dark button-small editor-full-button" onClick={changeDimensions}>Apply size</button><p className="control-help">Export size: {width} × {height} pixels.</p><div className="sidebar-divider"/><div className="control-group"><label className="control-label" htmlFor="video-fit">Template fit</label><select id="video-fit" className="editor-select" value={fit} onChange={(event) => setFit(event.target.value as "cover" | "contain")}><option value="cover">Fill canvas</option><option value="contain">Fit whole frame</option></select></div></div>}
        {panel === "effects" && <div className="editor-tool-panel"><div className="panel-label">Video effects <span>Live preview</span></div><p className="control-help">Adjust the source clip; captions and stickers remain sharp. Effects are included in exports.</p><div className="control-group"><label className="control-label" htmlFor="video-brightness">Brightness <span>{brightness}%</span></label><input id="video-brightness" className="editor-range" type="range" min="50" max="160" value={brightness} onChange={(event) => setBrightness(Number(event.target.value))}/></div><div className="control-group"><label className="control-label" htmlFor="video-contrast">Contrast <span>{contrast}%</span></label><input id="video-contrast" className="editor-range" type="range" min="50" max="160" value={contrast} onChange={(event) => setContrast(Number(event.target.value))}/></div><div className="control-group"><label className="control-label" htmlFor="video-saturation">Saturation <span>{saturation}%</span></label><input id="video-saturation" className="editor-range" type="range" min="0" max="200" value={saturation} onChange={(event) => setSaturation(Number(event.target.value))}/></div><div className="inspector-toggle-row"><label htmlFor="video-grayscale">Black &amp; white</label><input id="video-grayscale" type="checkbox" checked={grayscale} onChange={(event) => setGrayscale(event.target.checked)}/></div><button className="button button-paper button-small editor-full-button" onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); setGrayscale(false); }}>Reset effects</button></div>}
        {panel === "layers" && <div className="editor-tool-panel"><div className="panel-label">Layers <span>{layers.length}</span></div><div className="editor-layer-list">{layers.map((layer,index) => <div key={layer.id} className={selectedId === layer.id ? "editor-layer-row active" : "editor-layer-row"}><button className="layer-select" onClick={() => { setSelectedId(layer.id); setPanel(layer.kind === "text" ? "text" : "overlay"); }}>{layer.kind === "text" ? <Type size={15}/> : <ImagePlus size={15}/>}<span>{layer.name}</span></button><button className="layer-icon-button" disabled={index === layers.length - 1} aria-label="Move forward" onClick={() => moveLayer(layer.id, 1)}><BringToFront size={14}/></button><button className="layer-icon-button" disabled={index === 0} aria-label="Move backward" onClick={() => moveLayer(layer.id, -1)} onPointerDown={(event) => event.stopPropagation()}><ArrowLeft size={14}/></button><button className="layer-icon-button" aria-label="Hide or show layer" onClick={() => updateLayer(layer.id, { opacity: layer.opacity === 0 ? 1 : 0 })}>{layer.opacity === 0 ? <EyeOff size={14}/> : <Eye size={14}/>}</button></div>)}</div><button className="button button-paper button-small editor-full-button" onClick={duplicateLayer} disabled={!selected}><Copy size={14}/> Duplicate selected</button><button className="button button-plain button-small editor-full-button" onClick={deleteLayer} disabled={!selected}><Trash2 size={14}/> Delete selected</button></div>}
      </aside>
      <section className="editor-center editor-center-upgraded video-center">
        <div className="canvas-workspace-meta"><span><span className="canvas-live-dot"/> Live motion preview</span><span>{width} × {height}</span><span>{layers.length} layers</span></div>
        {loading && <div className="empty-state"><Clapperboard size={26}/><h2>Loading the moving template…</h2></div>}
        {template && <div className="canvas-stage-shell"><div ref={stageRef} className="editor-canvas-stage video-canvas-stage" style={{ width: "min(100%, " + Math.min(680, Math.max(180, Math.floor(viewportHeight * .65 * width / height))) + "px)", aspectRatio: width + " / " + height, background }} onPointerMove={onStageMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd}>
          {template.mediaType === "gif" ? <img ref={gifRef} className="editor-base-image" src={safeMediaUrl} alt={template.name} draggable={false} style={{ objectFit: fit, filter: effectFilter }}/> : <video ref={videoRef} className="editor-base-image" src={safeMediaUrl} poster={template.posterUrl || undefined} muted={!videoAudioEnabled} loop autoPlay playsInline controls={false} preload="metadata" onError={() => { void recoverEditorVideo(); }} style={{ objectFit: fit, filter: effectFilter }} />}
          {layers.map((layer,index) => <div key={layer.id} className={selectedId === layer.id ? "editor-object selected" : "editor-object"} role="button" tabIndex={0} aria-label={"Select " + layer.name} style={{ left: layer.x + "%", top: layer.y + "%", width: layer.w + "%", height: layer.h + "%", zIndex: index + 2, opacity: layer.opacity, transform: "translate(-50%, -50%) rotate(" + layer.rotation + "deg)" }} onPointerDown={(event) => onDragStart(event,layer)} onClick={() => setSelectedId(layer.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedId(layer.id); }}>
            {layer.kind === "text" ? <div className="editor-object-text" style={{ fontFamily: layer.fontFamily + ", Arial Black, sans-serif", fontSize: "clamp(12px, " + (layer.fontSize / 1080 * 100) + "cqw, 80px)", color: layer.color, textAlign: layer.align, textTransform: layer.uppercase ? "uppercase" : "none", WebkitTextStroke: layer.outline ? (layer.outlineWidth / 1080 * 100) + "cqw " + layer.outlineColor : "0 transparent", textShadow: layer.shadow ? "2px 2px 0 rgba(0,0,0,.5)" : "none" }}>{layer.text}</div> : <img className="editor-overlay-image" src={layer.src} alt={layer.name} draggable={false}/>}
            {selectedId === layer.id && <button type="button" className="object-resize-handle" aria-label="Resize selected layer" onPointerDown={(event) => onDragStart(event,layer,"resize")}/>}
          </div>)}
        </div></div>}
        <div className="canvas-controls canvas-controls-upgraded"><span className="canvas-chip"><Move size={13}/> Drag captions and overlays</span><button type="button" className="canvas-chip audio-toggle-chip" onClick={toggleVideoAudio} disabled={!template || template.mediaType !== "video"} aria-pressed={videoAudioEnabled} title={template?.mediaType === "gif" ? "GIF templates do not have audio" : videoAudioEnabled ? "Mute preview audio" : "Enable preview audio"}>{videoAudioEnabled ? <Volume2 size={13}/> : <VolumeX size={13}/>} {template?.mediaType === "gif" ? "No audio (GIF)" : videoAudioEnabled ? "Audio on" : "Enable sound"}</button><span className="canvas-chip"><Video size={13}/> Export to WebM</span><span className="canvas-chip"><Check size={13}/> Rendered in browser</span></div>
        <p className="editor-hint">Choose a text layer, drag it into place, then export a fresh video with your own captions.</p>
      </section>
      <aside className="editor-sidebar right editor-inspector">
        <div className="panel-label">Properties <span>{selected ? selected.kind.toUpperCase() : "CANVAS"}</span></div>
        {!selected && <div className="inspector-empty"><Move size={24}/><strong>No layer selected</strong><p>Add text or an image overlay to start.</p><button className="button button-dark button-small" onClick={addText}>Add text</button></div>}
        {selectedText && <>
          <div className="control-group"><label className="control-label" htmlFor="video-layer-name">Layer name</label><input className="editor-input" id="video-layer-name" value={selectedText.name} onChange={(event) => updateLayer(selectedText.id,{name:event.target.value})}/></div>
          <div className="control-group"><label className="control-label" htmlFor="video-layer-text">Caption text</label><textarea className="editor-input" id="video-layer-text" rows={4} maxLength={400} value={selectedText.text} onChange={(event) => updateLayer(selectedText.id,{text:event.target.value})}/></div>
          <div className="control-group"><label className="control-label" htmlFor="video-layer-size">Font size <span>{selectedText.fontSize}</span></label><input className="editor-range" id="video-layer-size" type="range" min="12" max="180" value={selectedText.fontSize} onChange={(event) => updateLayer(selectedText.id,{fontSize:Number(event.target.value)})}/></div>
          <div className="control-group"><label className="control-label" htmlFor="video-layer-font">Typeface</label><select className="editor-select" id="video-layer-font" value={selectedText.fontFamily} onChange={(event) => updateLayer(selectedText.id,{fontFamily:event.target.value})}><option value="Impact">Impact</option><option value="Arial Black">Arial Black</option><option value="Arial">Arial</option><option value="Georgia">Georgia</option><option value="monospace">Monospace</option></select></div>
          <div className="control-group"><label className="control-label" htmlFor="video-layer-colour">Text colour</label><input className="editor-color-input" id="video-layer-colour" type="color" value={selectedText.color} onChange={(event) => updateLayer(selectedText.id,{color:event.target.value})}/></div>
          <div className="inspector-toggle-row"><label htmlFor="video-layer-uppercase">Uppercase</label><input id="video-layer-uppercase" type="checkbox" checked={selectedText.uppercase} onChange={(event) => updateLayer(selectedText.id,{uppercase:event.target.checked})}/></div>
          <div className="inspector-toggle-row"><label htmlFor="video-layer-outline">Text outline</label><input id="video-layer-outline" type="checkbox" checked={selectedText.outline} onChange={(event) => updateLayer(selectedText.id,{outline:event.target.checked})}/></div>
          {selectedText.outline && <><div className="control-group"><label className="control-label" htmlFor="video-layer-outline-colour">Outline colour</label><input className="editor-color-input" id="video-layer-outline-colour" type="color" value={selectedText.outlineColor} onChange={(event) => updateLayer(selectedText.id,{outlineColor:event.target.value})}/></div><div className="control-group"><label className="control-label" htmlFor="video-layer-outline-width">Outline thickness <span>{selectedText.outlineWidth}</span></label><input className="editor-range" id="video-layer-outline-width" type="range" min="1" max="18" value={selectedText.outlineWidth} onChange={(event) => updateLayer(selectedText.id,{outlineWidth:Number(event.target.value)})}/></div></>}
          <div className="inspector-toggle-row"><label htmlFor="video-layer-shadow">Drop shadow</label><input id="video-layer-shadow" type="checkbox" checked={selectedText.shadow} onChange={(event) => updateLayer(selectedText.id,{shadow:event.target.checked})}/></div>
          <div className="control-group"><label className="control-label">Text alignment</label><div className="editor-field-grid">{(["left","center","right"] as const).map((value) => <button className={selectedText.align === value ? "filter-pill active" : "filter-pill"} key={value} onClick={() => updateLayer(selectedText.id,{align:value})}>{value[0].toUpperCase()+value.slice(1)}</button>)}</div></div>
        </>}
        {selectedImage && <><div className="control-group"><label className="control-label" htmlFor="video-overlay-name">Layer name</label><input id="video-overlay-name" className="editor-input" value={selectedImage.name} onChange={(event) => updateLayer(selectedImage.id,{name:event.target.value})}/></div><div className="control-group"><label className="control-label" htmlFor="video-overlay-opacity">Opacity <span>{Math.round(selectedImage.opacity*100)}%</span></label><input id="video-overlay-opacity" className="editor-range" type="range" min="0" max="1" step=".05" value={selectedImage.opacity} onChange={(event) => updateLayer(selectedImage.id,{opacity:Number(event.target.value)})}/></div></>}
        {selected && <><div className="sidebar-divider"/><div className="panel-label">Transform</div><div className="control-group"><label className="control-label" htmlFor="video-layer-rotation">Rotation <span>{selected.rotation}°</span></label><input id="video-layer-rotation" className="editor-range" type="range" min="-180" max="180" value={selected.rotation} onChange={(event) => updateLayer(selected.id,{rotation:Number(event.target.value)})}/></div><div className="dimension-inputs"><label>X<input type="number" min="0" max="100" value={Math.round(selected.x)} onChange={(event) => updateLayer(selected.id,{x:Math.max(0,Math.min(100,Number(event.target.value)))})}/></label><label>Y<input type="number" min="0" max="100" value={Math.round(selected.y)} onChange={(event) => updateLayer(selected.id,{y:Math.max(0,Math.min(100,Number(event.target.value)))})}/></label></div><div className="control-group"><label className="control-label" htmlFor="video-layer-width">Width <span>{Math.round(selected.w)}%</span></label><input id="video-layer-width" className="editor-range" type="range" min="6" max="100" value={selected.w} onChange={(event) => updateLayer(selected.id,{w:Number(event.target.value)})}/></div><div className="inspector-toggle-row"><label htmlFor="video-layer-visible">Visible</label><input id="video-layer-visible" type="checkbox" checked={selected.opacity>0} onChange={(event) => updateLayer(selected.id,{opacity:event.target.checked?1:0})}/></div><div className="editor-object-actions"><button className="button button-paper button-small" onClick={duplicateLayer}><Copy size={14}/> Duplicate</button><button className="button button-paper button-small" onClick={deleteLayer}><Trash2 size={14}/> Delete</button></div></>}
        <div className="sidebar-divider"/><button className="button button-paper editor-full-button" onClick={saveVideoDraft} disabled={!template}><Save size={14}/> Save to studio</button><button className="button button-paper editor-full-button" onClick={() => exportVideo("webm")} disabled={busy || !template}><Download size={14}/> {busy ? "Rendering…" : "Export WebM"}</button><button className="button button-dark editor-full-button" onClick={() => exportVideo("mp4")} disabled={busy || !template}><Download size={14}/> {busy ? "Rendering…" : "Export MP4"}</button>
      </aside>
    </div>}
    {notice && <div className="editor-toast"><div className="toast">{notice}</div></div>}
  </main>;
}
