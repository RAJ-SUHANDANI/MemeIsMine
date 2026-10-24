"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowLeft, ArrowUpRight, BringToFront, Check, Copy, Download, Eye, EyeOff, FlipHorizontal,
  ImagePlus, Layers, Move, Palette, Redo2, RotateCcw, Save, Shapes, SlidersHorizontal,
  Sparkles, Trash2, Type, Undo2, Upload, X, ZoomIn
} from "lucide-react";
import { SiteHeader } from "@/components/site";
import { starterMemes, type MemeTemplate } from "@/data/memes";

type TextObject = {
  id: string; kind: "text"; name: string; text: string; x: number; y: number; w: number; h: number;
  rotation: number; fontSize: number; fontFamily: string; color: string; outline: boolean;
  outlineColor: string; outlineWidth: number; shadow: boolean; align: "left" | "center" | "right";
  opacity: number; uppercase: boolean;
};
type ImageObject = {
  id: string; kind: "image"; name: string; src: string; x: number; y: number; w: number; h: number;
  rotation: number; opacity: number; fit: "contain" | "cover";
};
type EditorObject = TextObject | ImageObject;
type Draft = {
  id: string; templateId: string; name: string; url: string; topText: string; bottomText: string;
  fontSize: number; outline: boolean; updatedAt: string; objects?: EditorObject[];
  canvasWidth?: number; canvasHeight?: number; backgroundColor?: string; imageFit?: "cover" | "contain";
};
type PanelId = "templates" | "text" | "overlay" | "background" | "canvas" | "layers";
type DragState = { id: string; mode: "move" | "resize"; startClientX: number; startClientY: number; x: number; y: number; w: number; h: number } | null;

const DRAFTS_KEY = "mim-drafts";
const RATIO_PRESETS = [
  { label: "1:1", name: "Square", width: 1080, height: 1080 },
  { label: "9:16", name: "Story", width: 1080, height: 1920 },
  { label: "16:9", name: "Landscape", width: 1920, height: 1080 },
  { label: "4:5", name: "Portrait", width: 1080, height: 1350 },
  { label: "4:3", name: "Classic", width: 1440, height: 1080 },
  { label: "3:2", name: "Photo", width: 1500, height: 1000 },
];
const BACKGROUNDS = ["#F5F0E7", "#151515", "#F0442E", "#FFFFFF", "#E8DFC9", "#CCD9B9", "#D9D2E8"];
const DEFAULT_OBJECTS: EditorObject[] = [
  { id: "caption-top", kind: "text", name: "Top caption", text: "WHEN THE MEME HITS", x: 50, y: 15, w: 88, h: 19, rotation: 0, fontSize: 48, fontFamily: "Impact", color: "#FFFFFF", outline: true, outlineColor: "#000000", outlineWidth: 4, shadow: true, align: "center", opacity: 1, uppercase: true },
  { id: "caption-bottom", kind: "text", name: "Bottom caption", text: "JUST RIGHT", x: 50, y: 85, w: 88, h: 19, rotation: 0, fontSize: 48, fontFamily: "Impact", color: "#FFFFFF", outline: true, outlineColor: "#000000", outlineWidth: 4, shadow: true, align: "center", opacity: 1, uppercase: true },
];
const PANEL_ITEMS: { id: PanelId; label: string; icon: typeof Layers }[] = [
  { id: "templates", label: "Templates", icon: Layers },
  { id: "text", label: "Text", icon: Type },
  { id: "overlay", label: "Overlay", icon: ImagePlus },
  { id: "background", label: "Background", icon: Palette },
  { id: "canvas", label: "Dimensions", icon: SlidersHorizontal },
  { id: "layers", label: "Layers", icon: BringToFront },
];

function makeId() {
  return "obj-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}
function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read file"));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
function svgData(svg: string) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
const BUILTIN_OVERLAYS = [
  { name: "Impact burst", kind: "burst", src: svgData('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><path d="M120 4 145 49 194 20 184 76 236 82 198 119 233 158 177 163 184 220 138 190 110 236 93 183 39 204 58 151 5 131 52 102 22 58 81 65Z" fill="#F0442E" stroke="#151515" stroke-width="8" stroke-linejoin="round"/><path d="M80 88 104 105 145 73M95 142 143 154 166 130" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/></svg>') },
  { name: "Red arrow", kind: "arrow", src: svgData('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 150"><path d="M10 113 Q104 6 211 54" fill="none" stroke="#151515" stroke-width="26" stroke-linecap="round"/><path d="M10 113 Q104 6 211 54" fill="none" stroke="#F0442E" stroke-width="17" stroke-linecap="round"/><path d="M176 12 244 60 171 82Z" fill="#F0442E" stroke="#151515" stroke-width="8" stroke-linejoin="round"/></svg>') },
  { name: "Crown", kind: "crown", src: svgData('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 170"><path d="M20 47 69 87 119 18 170 87 220 47 202 142 39 142Z" fill="#F0442E" stroke="#151515" stroke-width="10" stroke-linejoin="round"/><path d="M44 119H198" stroke="#F5F0E7" stroke-width="8" stroke-linecap="round"/><circle cx="20" cy="39" r="12" fill="#F5F0E7" stroke="#151515" stroke-width="7"/><circle cx="119" cy="18" r="12" fill="#F5F0E7" stroke="#151515" stroke-width="7"/><circle cx="220" cy="39" r="12" fill="#F5F0E7" stroke="#151515" stroke-width="7"/></svg>') },
  { name: "LOL stamp", kind: "stamp", src: svgData('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 130"><g transform="rotate(-8 150 65)"><rect x="10" y="13" width="280" height="104" rx="12" fill="#F0442E" stroke="#151515" stroke-width="9"/><rect x="22" y="24" width="256" height="82" rx="7" fill="none" stroke="#F5F0E7" stroke-width="4" stroke-dasharray="8 7"/><text x="150" y="83" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="55" font-weight="900" fill="#fff" stroke="#151515" stroke-width="2" paint-order="stroke">LOL</text></g></svg>') },
];

export default function EditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [draftId, setDraftId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<MemeTemplate[]>(starterMemes);
  const [template, setTemplate] = useState<MemeTemplate | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [objects, setObjects] = useState<EditorObject[]>(DEFAULT_OBJECTS);
  const objectsRef = useRef<EditorObject[]>(DEFAULT_OBJECTS);
  const [selectedId, setSelectedId] = useState<string | null>("caption-top");
  const [activePanel, setActivePanel] = useState<PanelId>("templates");
  const [canvasWidth, setCanvasWidth] = useState(1080);
  const [canvasHeight, setCanvasHeight] = useState(1080);
  const [customWidth, setCustomWidth] = useState("1080");
  const [customHeight, setCustomHeight] = useState("1080");
  const [backgroundColor, setBackgroundColor] = useState("#E6DED1");
  const [imageFit, setImageFit] = useState<"cover" | "contain">("cover");
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<EditorObject[][]>([DEFAULT_OBJECTS]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [stagePixels, setStagePixels] = useState(600);
  const [drag, setDrag] = useState<DragState>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const baseFileInput = useRef<HTMLInputElement>(null);
  const overlayFileInput = useRef<HTMLInputElement>(null);
  const templateInitialized = useRef(false);
  const selected = objects.find((item) => item.id === selectedId) ?? null;
  const currentUrl = uploadedUrl ?? template?.url ?? null;
  const safeBaseUrl = useMemo(() => currentUrl && !uploadedUrl ? "/api/image?url=" + encodeURIComponent(currentUrl) : currentUrl, [currentUrl, uploadedUrl]);
  const textObjects = objects.filter((item): item is TextObject => item.kind === "text");
  const imageObjects = objects.filter((item): item is ImageObject => item.kind === "image");
  const activePreset = RATIO_PRESETS.find((item) => item.width === canvasWidth && item.height === canvasHeight)?.label ?? "custom";

  useEffect(() => {
    setDraftId(new URLSearchParams(window.location.search).get("draft"));
    if (!stageRef.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) setStagePixels(entries[0].contentRect.width);
    });
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let alive = true;
    fetch("/api/memes?limit=100").then((response) => response.json()).then((data) => {
      if (alive && data.success && data.memes?.length) setCatalog(data.memes);
    }).catch(() => undefined);
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (id === "upload") { setTemplate(null); return; }
    const found = catalog.find((item) => item.id === id) ?? starterMemes.find((item) => item.id === id) ?? null;
    if (found) {
      setTemplate(found);
      if (!draftId && !templateInitialized.current) {
        setObjects(DEFAULT_OBJECTS.map((item) => item.kind === "text" && item.id === "caption-top" ? { ...item, text: found.name.toUpperCase() } : item));
        objectsRef.current = DEFAULT_OBJECTS.map((item) => item.kind === "text" && item.id === "caption-top" ? { ...item, text: found.name.toUpperCase() } : item);
        templateInitialized.current = true;
      }
    }
  }, [id, catalog, draftId]);
  useEffect(() => {
    if (!draftId) return;
    try {
      const stored: Draft[] = JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? "[]");
      const draft = stored.find((item) => item.id === draftId);
      if (!draft) return;
      if (draft.templateId === "upload" && draft.url.startsWith("data:")) setUploadedUrl(draft.url);
      const fallbackTextObjects: EditorObject[] = DEFAULT_OBJECTS
        .filter((item): item is TextObject => item.kind === "text")
        .map((item, index) => ({
          ...item,
          text: index === 0 ? draft.topText : draft.bottomText,
          fontSize: draft.fontSize,
          outline: draft.outline,
        }));
      const restoredObjects: EditorObject[] = draft.objects?.length ? draft.objects : fallbackTextObjects;
      setObjects(restoredObjects);
      objectsRef.current = restoredObjects;
      setHistory([restoredObjects]);
      setHistoryIndex(0);
      if (draft.canvasWidth) setCanvasWidth(draft.canvasWidth);
      if (draft.canvasHeight) setCanvasHeight(draft.canvasHeight);
      if (draft.backgroundColor) setBackgroundColor(draft.backgroundColor);
      if (draft.imageFit) setImageFit(draft.imageFit);
      setCustomWidth(String(draft.canvasWidth ?? 1080));
      setCustomHeight(String(draft.canvasHeight ?? 1080));
      setSaved(true);
    } catch { showNotice("That draft could not be opened."); }
  }, [draftId]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  }
  const rememberObjects = useCallback((next: EditorObject[]) => {
    setObjects(next);
    objectsRef.current = next;
    const base = historyIndex >= 0 ? history.slice(0, historyIndex + 1) : history;
    const updated = [...base, next.map((item) => ({ ...item }))].slice(-60);
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
    setSaved(false);
  }, [historyIndex]);
  function patchObject(objectId: string, patch: Partial<EditorObject>) {
    const next = objectsRef.current.map((item) => item.id === objectId ? { ...item, ...patch } as EditorObject : item);
    rememberObjects(next);
  }
  function undo() {
    if (historyIndex <= 0) return;
    const next = history[historyIndex - 1];
    setHistoryIndex(historyIndex - 1); setObjects(next); objectsRef.current = next; setSaved(false);
  }
  function redo() {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    setHistoryIndex(historyIndex + 1); setObjects(next); objectsRef.current = next; setSaved(false);
  }
  function addText() {
    const count = textObjects.length + 1;
    const item: TextObject = { id: makeId(), kind: "text", name: "Text " + count, text: "YOUR TEXT HERE", x: 50, y: 50, w: 72, h: 17, rotation: 0, fontSize: 52, fontFamily: "Impact", color: "#FFFFFF", outline: true, outlineColor: "#000000", outlineWidth: 4, shadow: true, align: "center", opacity: 1, uppercase: true };
    rememberObjects([...objectsRef.current, item]); setSelectedId(item.id); setActivePanel("text");
  }
  function addSticker(sticker: typeof BUILTIN_OVERLAYS[number]) {
    const index = imageObjects.length;
    const item: ImageObject = { id: makeId(), kind: "image", name: sticker.name, src: sticker.src, x: 50 + ((index % 3) - 1) * 9, y: 43 + (index % 2) * 16, w: 23, h: 23, rotation: index % 2 ? 7 : -7, opacity: 1, fit: "contain" };
    rememberObjects([...objectsRef.current, item]); setSelectedId(item.id);
  }
  function duplicateSelected() {
    if (!selected) return;
    const copy = { ...selected, id: makeId(), name: selected.name + " copy", x: Math.min(92, selected.x + 5), y: Math.min(92, selected.y + 5) } as EditorObject;
    rememberObjects([...objectsRef.current, copy]); setSelectedId(copy.id);
  }
  function deleteSelected() {
    if (!selectedId) return;
    const next = objectsRef.current.filter((item) => item.id !== selectedId);
    rememberObjects(next); setSelectedId(next[next.length - 1]?.id ?? null);
  }
  function moveLayer(objectId: string, direction: -1 | 1) {
    const next = [...objectsRef.current]; const index = next.findIndex((item) => item.id === objectId); const target = index + direction;
    if (index < 0 || target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    rememberObjects(next);
  }
  function applyPreset(preset: typeof RATIO_PRESETS[number]) {
    setCanvasWidth(preset.width); setCanvasHeight(preset.height); setCustomWidth(String(preset.width)); setCustomHeight(String(preset.height)); setSaved(false);
  }
  function applyCustomDimensions() {
    const width = Math.round(Number(customWidth)); const height = Math.round(Number(customHeight));
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 200 || height < 200 || width > 4000 || height > 4000) {
      showNotice("Choose dimensions between 200 and 4000 pixels."); return;
    }
    setCanvasWidth(width); setCanvasHeight(height); setCustomWidth(String(width)); setCustomHeight(String(height)); setSaved(false);
  }
  async function readImages(files: FileList | null, asOverlay: boolean) {
    if (!files?.length) return;
    const chosen = Array.from(files).slice(0, asOverlay ? Math.max(0, 8 - imageObjects.length) : 1);
    if (!chosen.length && asOverlay) { showNotice("You can add up to eight overlay images."); return; }
    for (const file of chosen) {
      if (!file.type.startsWith("image/")) { showNotice("Please choose an image file."); continue; }
      if (file.size > 2.5 * 1024 * 1024) { showNotice("Each image must be smaller than 2.5 MB."); continue; }
      try {
        const src = await readFileAsDataUrl(file);
        if (!asOverlay) { setUploadedUrl(src); setTemplate(null); setSaved(false); showNotice("Your image is on the canvas."); continue; }
        const overlay: ImageObject = { id: makeId(), kind: "image", name: file.name.replace(/\.[^.]+$/, ""), src, x: 50, y: 50, w: 28, h: 28, rotation: 0, opacity: 1, fit: "contain" };
        const next = [...objectsRef.current, overlay]; rememberObjects(next); setSelectedId(overlay.id);
      } catch { showNotice("One of those images could not be read."); }
    }
  }
  function onFileInput(event: ChangeEvent<HTMLInputElement>, overlay: boolean) {
    void readImages(event.target.files, overlay);
    event.target.value = "";
  }
  function startDrag(event: ReactPointerEvent<HTMLElement>, object: EditorObject, mode: "move" | "resize" = "move") {
    event.preventDefault(); event.stopPropagation(); setSelectedId(object.id);
    stageRef.current?.setPointerCapture(event.pointerId);
    setDrag({ id: object.id, mode, startClientX: event.clientX, startClientY: event.clientY, x: object.x, y: object.y, w: object.w, h: object.h });
  }
  function movePointer(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dx = (event.clientX - drag.startClientX) / rect.width * 100;
    const dy = (event.clientY - drag.startClientY) / rect.height * 100;
    const next = objectsRef.current.map((item) => {
      if (item.id !== drag.id) return item;
      if (drag.mode === "resize") return { ...item, w: Math.max(6, Math.min(100, drag.w + dx)), h: Math.max(6, Math.min(100, drag.h + dy)) } as EditorObject;
      return { ...item, x: Math.max(0, Math.min(100, drag.x + dx)), y: Math.max(0, Math.min(100, drag.y + dy)) } as EditorObject;
    });
    setObjects(next); objectsRef.current = next; setSaved(false);
  }
  function stopDrag() {
    if (!drag) return;
    const finalObjects = objectsRef.current.map((item) => ({ ...item }));
    const base = historyIndex >= 0 ? history.slice(0, historyIndex + 1) : history;
    const updated = [...base, finalObjects].slice(-60);
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
    setDrag(null);
  }
  function renderTextPreview(item: TextObject) {
    const size = Math.max(8, item.fontSize * stagePixels / 1080);
    return <div className="editor-object-text" style={{
      fontFamily: item.fontFamily === "Impact" ? "Impact, Arial Black, sans-serif" : item.fontFamily,
      fontSize: size + "px", fontWeight: 900, color: item.color, textAlign: item.align,
      textTransform: item.uppercase ? "uppercase" : "none", opacity: item.opacity,
      WebkitTextStroke: item.outline ? Math.max(0, item.outlineWidth * stagePixels / 1080) + "px " + item.outlineColor : "0 transparent",
      textShadow: item.shadow ? "2px 2px 0 rgba(0,0,0,.45)" : "none",
    }}>{item.text}</div>;
  }

  async function downloadMeme() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) { showNotice("Canvas export is not supported in this browser."); return; }
    canvas.width = canvasWidth; canvas.height = canvasHeight;
    ctx.fillStyle = backgroundColor; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Image could not be loaded"));
      image.src = src;
    });
    const drawFit = (image: HTMLImageElement, x: number, y: number, width: number, height: number, fit: "cover" | "contain") => {
      const scale = fit === "cover" ? Math.max(width / image.naturalWidth, height / image.naturalHeight) : Math.min(width / image.naturalWidth, height / image.naturalHeight);
      const drawW = image.naturalWidth * scale; const drawH = image.naturalHeight * scale;
      ctx.drawImage(image, x + (width - drawW) / 2, y + (height - drawH) / 2, drawW, drawH);
    };
    if (safeBaseUrl) {
      try {
        const image = await loadImage(safeBaseUrl);
        drawFit(image, 0, 0, canvas.width, canvas.height, imageFit);
      } catch { showNotice("The template image could not load. Your captions and overlays can still be exported."); }
    }
    for (const item of objectsRef.current) {
      const x = item.x / 100 * canvas.width; const y = item.y / 100 * canvas.height;
      const width = item.w / 100 * canvas.width; const height = item.h / 100 * canvas.height;
      ctx.save(); ctx.globalAlpha = item.opacity; ctx.translate(x, y); ctx.rotate(item.rotation * Math.PI / 180);
      if (item.kind === "image") {
        try {
          const image = await loadImage(item.src);
          drawFit(image, -width / 2, -height / 2, width, height, item.fit);
        } catch { /* A missing overlay is skipped without cancelling the export. */ }
      } else {
        const scale = canvas.width / 1080;
        const size = item.fontSize * scale;
        ctx.font = "900 " + size + "px " + (item.fontFamily === "Impact" ? "Impact, Arial Black, sans-serif" : "Arial Black, Arial, sans-serif");
        ctx.textAlign = item.align; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
        ctx.shadowColor = item.shadow ? "rgba(0,0,0,.48)" : "transparent"; ctx.shadowBlur = item.shadow ? 3 * scale : 0; ctx.shadowOffsetX = item.shadow ? 2 * scale : 0; ctx.shadowOffsetY = item.shadow ? 2 * scale : 0;
        const maxWidth = width; const sourceText = item.uppercase ? item.text.toUpperCase() : item.text;
        const lines: string[] = []; let line = "";
        sourceText.split(/\s+/).filter(Boolean).forEach((word) => {
          const candidate = line ? line + " " + word : word;
          if (ctx.measureText(candidate).width > maxWidth && line) { lines.push(line); line = word; } else line = candidate;
        });
        if (line) lines.push(line);
        const lineHeight = size * 1.04; const shownLines = lines.slice(0, Math.max(1, Math.floor(height / lineHeight)));
        const lineX = item.align === "left" ? -width / 2 : item.align === "right" ? width / 2 : 0;
        shownLines.forEach((text, index) => {
          const lineY = (index - (shownLines.length - 1) / 2) * lineHeight;
          if (item.outline) { ctx.lineWidth = item.outlineWidth * scale; ctx.strokeStyle = item.outlineColor; ctx.strokeText(text, lineX, lineY, maxWidth); }
          ctx.fillStyle = item.color; ctx.fillText(text, lineX, lineY, maxWidth);
        });
      }
      ctx.restore();
    }
    const link = document.createElement("a");
    link.download = "meme-is-mine-" + canvasWidth + "x" + canvasHeight + ".png";
    link.href = canvas.toDataURL("image/png"); link.click();
    showNotice("Your meme was exported at " + canvasWidth + " by " + canvasHeight + " pixels.");
  }
  function saveDraft() {
    const textItems = objectsRef.current.filter((item): item is TextObject => item.kind === "text");
    const draft: Draft = {
      id: "draft-" + Date.now(), templateId: uploadedUrl ? "upload" : template?.id ?? "upload", name: template?.name ?? "My meme",
      url: currentUrl ?? "", topText: textItems[0]?.text ?? "", bottomText: textItems[1]?.text ?? "", fontSize: textItems[0]?.fontSize ?? 48,
      outline: textItems[0]?.outline ?? true, objects: objectsRef.current, canvasWidth, canvasHeight, backgroundColor, imageFit, updatedAt: new Date().toISOString(),
    };
    try {
      const existing: Draft[] = JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? "[]");
      localStorage.setItem(DRAFTS_KEY, JSON.stringify([draft, ...existing].slice(0, 30)));
      setSaved(true); showNotice("Draft saved in this browser.");
    } catch { showNotice("This draft is too large for browser storage. Try a smaller image or export it instead."); }
  }

  function selectTemplate(item: MemeTemplate) {
    setTemplate(item); setUploadedUrl(null); setSaved(false);
    const nextObjects = DEFAULT_OBJECTS.map((object) => object.kind === "text" && object.id === "caption-top" ? { ...object, text: item.name.toUpperCase() } : object);
    setObjects(nextObjects); objectsRef.current = nextObjects;
    setHistory([nextObjects]); setHistoryIndex(0);
    setSelectedId("caption-top"); templateInitialized.current = true;
  }
  function setSelectedPatch(patch: Partial<EditorObject>) {
    if (selected) patchObject(selected.id, patch);
  }
  const textSelected = selected?.kind === "text" ? selected : null;
  const imageSelected = selected?.kind === "image" ? selected : null;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); }
      else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") { event.preventDefault(); duplicateSelected(); }
      else if ((event.key === "Delete" || event.key === "Backspace") && selectedId) { event.preventDefault(); deleteSelected(); }
      else if (event.key === "Escape") setSelectedId(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return <main className="paper-noise editor-page">
    <SiteHeader/>
    <div className="editor-topbar">
      <div className="editor-crumb"><Link href="/explore" aria-label="Back to explore"><ArrowLeft size={16}/></Link><span>/</span><Link href="/explore">Explore</Link><span>/</span><strong>{template?.name ?? "Your image"}</strong></div>
      <div className="saved-indicator">{saved ? "Draft saved locally" : "Changes stay in your browser"}</div>
      <div className="editor-top-actions">
        <button className="button button-paper button-small" onClick={undo} disabled={historyIndex <= 0} title="Undo (Ctrl Z)"><Undo2 size={14}/><span>Undo</span></button>
        <button className="button button-paper button-small" onClick={redo} disabled={historyIndex < 0 || historyIndex >= history.length - 1} title="Redo (Ctrl Shift Z)"><Redo2 size={14}/><span>Redo</span></button>
        <button className="button button-paper button-small" onClick={saveDraft}><Save size={14}/><span>Save</span></button>
        <button className="button button-dark button-small" onClick={downloadMeme}><Download size={14}/> Download PNG</button>
      </div>
    </div>
    <div className="editor-workspace editor-workspace-upgraded">
      <aside className="editor-sidebar editor-sidebar-tools">
        <div className="panel-label">Studio tools</div>
        <div className="tool-list editor-tool-list">
          {PANEL_ITEMS.map((panel) => { const Icon = panel.icon; return <button key={panel.id} className={activePanel === panel.id ? "tool-button active" : "tool-button"} onClick={() => setActivePanel(panel.id)} aria-pressed={activePanel === panel.id}><Icon size={18}/><span>{panel.label}</span></button>; })}
        </div>
        <div className="sidebar-divider"/>
        {activePanel === "templates" && <div className="editor-tool-panel">
          <div className="panel-label">Choose a template <span>{catalog.length}</span></div>
          <div className="template-picker-list">{catalog.slice(0, 100).map((item) => <button type="button" key={item.id} className={template?.id === item.id ? "template-picker-item active" : "template-picker-item"} onClick={() => selectTemplate(item)}><img src={item.url} alt="" loading="lazy"/><span>{item.name}</span><ArrowUpRight size={13}/></button>)}</div>
          <button className="button button-paper button-small editor-full-button" onClick={() => baseFileInput.current?.click()}><Upload size={14}/> Use your own image</button>
        </div>}
        {activePanel === "text" && <div className="editor-tool-panel">
          <div className="panel-label">Add typography</div>
          <button className="editor-add-tile" onClick={addText}><Type size={21}/><span><strong>Add text</strong><small>Place a movable text layer anywhere</small></span><span>＋</span></button>
          <div className="control-help">Select any text on the canvas to edit its wording and style. Drag it to place it anywhere.</div>
          <div className="sidebar-divider"/>
          <div className="panel-label">Quick styles</div>
          <button className="quick-style" onClick={() => { if (textSelected) patchObject(textSelected.id, { fontFamily: "Impact", fontSize: 56, outline: true, shadow: true, uppercase: true }); else addText(); }}>Classic meme caption <span>Aa</span></button>
          <button className="quick-style" onClick={() => { if (textSelected) patchObject(textSelected.id, { fontFamily: "Arial Black", fontSize: 36, outline: false, shadow: false, uppercase: false, color: "#151515" }); else addText(); }}>Clean label <span>Aa</span></button>
        </div>}
        {activePanel === "overlay" && <div className="editor-tool-panel">
          <div className="panel-label">Add image overlay</div>
          <button className="overlay-upload-tile" onClick={() => overlayFileInput.current?.click()}><ImagePlus size={23}/><strong>Upload an overlay</strong><small>Transparent PNG, JPG, WebP</small></button>
          <div className="control-help">Add stickers, a logo, a reaction image, or any picture on top of the selected meme. Drag and resize each overlay.</div>
          <div className="sidebar-divider"/><div className="panel-label">Built in stickers</div>
          <div className="sticker-grid">{BUILTIN_OVERLAYS.map((sticker) => <button type="button" key={sticker.kind} onClick={() => addSticker(sticker)} title={"Add " + sticker.name}><img src={sticker.src} alt=""/><span>{sticker.name}</span></button>)}</div>
          <div className="control-help">{imageObjects.length} image overlays on canvas. Limit: 8 uploaded or sticker layers.</div>
        </div>}
        {activePanel === "background" && <div className="editor-tool-panel">
          <div className="panel-label">Canvas background</div><div className="background-swatches">{BACKGROUNDS.map((color) => <button key={color} className={backgroundColor.toLowerCase() === color.toLowerCase() ? "background-swatch active" : "background-swatch"} style={{ background: color }} onClick={() => { setBackgroundColor(color); setSaved(false); }} aria-label={"Set background " + color}/>)}</div>
          <label className="control-label" htmlFor="background-custom">Custom colour</label><input id="background-custom" className="editor-color-input" type="color" value={backgroundColor} onChange={(event) => { setBackgroundColor(event.target.value); setSaved(false); }}/>
          <div className="sidebar-divider"/><div className="panel-label">Image fitting</div><div className="editor-field-grid"><button className={imageFit === "cover" ? "filter-pill active" : "filter-pill"} onClick={() => setImageFit("cover")}>Fill canvas</button><button className={imageFit === "contain" ? "filter-pill active" : "filter-pill"} onClick={() => setImageFit("contain")}>Fit image</button></div>
        </div>}
        {activePanel === "canvas" && <div className="editor-tool-panel">
          <div className="panel-label">Canvas dimensions</div><div className="ratio-grid">{RATIO_PRESETS.map((preset) => <button type="button" key={preset.label} onClick={() => applyPreset(preset)} className={activePreset === preset.label ? "ratio-button active" : "ratio-button"}><span>{preset.label}</span><small>{preset.name}</small><i style={{ aspectRatio: preset.width + " / " + preset.height }}/></button>)}</div>
          <div className="sidebar-divider"/><div className="panel-label">Custom pixel size</div>
          <div className="dimension-inputs"><label>Width<input type="number" min="200" max="4000" value={customWidth} onChange={(event) => setCustomWidth(event.target.value)}/></label><span>×</span><label>Height<input type="number" min="200" max="4000" value={customHeight} onChange={(event) => setCustomHeight(event.target.value)}/></label></div>
          <button className="button button-dark button-small editor-full-button" onClick={applyCustomDimensions}>Apply dimensions</button>
          <div className="control-help">Current export: {canvasWidth} × {canvasHeight} pixels.</div>
        </div>}
        {activePanel === "layers" && <div className="editor-tool-panel">
          <div className="panel-label">Object layers <span>{objects.length}</span></div>
          <div className="editor-layer-list">{objects.map((item,index) => <div key={item.id} className={selectedId === item.id ? "editor-layer-row active" : "editor-layer-row"}><button className="layer-select" onClick={() => { setSelectedId(item.id); setActivePanel(item.kind === "text" ? "text" : "overlay"); }}>{item.kind === "text" ? <Type size={15}/> : <ImagePlus size={15}/>}<span>{item.name || (item.kind === "text" ? "Text" : "Overlay")}</span></button><button className="layer-icon-button" aria-label="Move layer forward" disabled={index === objects.length - 1} onClick={() => moveLayer(item.id, 1)}><BringToFront size={14}/></button><button className="layer-icon-button" aria-label="Move layer backward" disabled={index === 0} onClick={() => moveLayer(item.id, -1)}><FlipHorizontal size={14}/></button><button className="layer-icon-button" aria-label="Hide or show layer" onClick={() => patchObject(item.id, { opacity: item.opacity === 0 ? 1 : 0 })}>{item.opacity === 0 ? <EyeOff size={14}/> : <Eye size={14}/>}</button></div>)}</div>
          <button className="button button-paper button-small editor-full-button" onClick={duplicateSelected} disabled={!selected}>Duplicate selected</button>
          <button className="button button-plain button-small editor-full-button" onClick={deleteSelected} disabled={!selected}>Delete selected</button>
        </div>}
        <input ref={baseFileInput} type="file" accept="image/*" hidden onChange={(event) => onFileInput(event, false)}/>
        <input ref={overlayFileInput} type="file" accept="image/*" multiple hidden onChange={(event) => onFileInput(event, true)}/>
      </aside>

      <section className="editor-center editor-center-upgraded" aria-label="Meme canvas workspace">
        <div className="canvas-workspace-meta"><span><span className="canvas-live-dot"/> Live canvas</span><span>{canvasWidth} × {canvasHeight}</span><span>{objects.length} layers</span></div>
        <div className="canvas-stage-shell">
          <div ref={stageRef} className="editor-canvas-stage" style={{ aspectRatio: canvasWidth + " / " + canvasHeight, background: backgroundColor }} onPointerMove={movePointer} onPointerUp={stopDrag} onPointerCancel={stopDrag} onPointerDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}>
            {safeBaseUrl ? <img className="editor-base-image" src={safeBaseUrl} alt={template?.name ?? "Your image"} draggable={false} style={{ objectFit: imageFit }}/> : <div className="canvas-placeholder editor-no-image"><ImagePlus size={38}/><strong>Start with your own image</strong><span>Upload an image or choose a template</span><button className="button button-dark button-small" onClick={() => setActivePanel("templates")}>Browse templates</button><button className="button button-paper button-small" onClick={() => baseFileInput.current?.click()}>Upload image</button></div>}
            {objects.map((item,index) => <div key={item.id} className={selectedId === item.id ? "editor-object selected" : "editor-object"} style={{ left: item.x + "%", top: item.y + "%", width: item.w + "%", height: item.h + "%", zIndex: index + 2, transform: "translate(-50%, -50%) rotate(" + item.rotation + "deg)", opacity: item.opacity }} onPointerDown={(event) => startDrag(event, item)} onClick={() => setSelectedId(item.id)} role="button" tabIndex={0} aria-label={"Select " + item.name} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedId(item.id); }}>
              {item.kind === "text" ? renderTextPreview(item) : <img className="editor-overlay-image" src={item.src} alt={item.name} draggable={false} style={{ objectFit: item.fit }}/>}
              {selectedId === item.id && <><span className="object-handle object-handle-top"/><span className="object-handle object-handle-left"/><button type="button" className="object-resize-handle" aria-label="Resize selected layer" onPointerDown={(event) => startDrag(event, item, "resize")}/></>}
            </div>)}
          </div>
        </div>
        <div className="canvas-controls canvas-controls-upgraded"><span className="canvas-chip"><Move size={13}/> Drag objects anywhere</span><span className="canvas-chip"><ZoomIn size={13}/> Resize from corner</span><span className="canvas-chip"><Check size={13}/> Browser export</span></div>
        <p className="editor-hint">Tip: select a layer, drag it into place, then fine tune it from the right hand panel.</p>
      </section>

      <aside className="editor-sidebar right editor-inspector">
        <div className="panel-label">Properties <span>{selected ? selected.kind === "text" ? "TEXT" : "IMAGE" : "CANVAS"}</span></div>
        {!selected && <div className="inspector-empty"><Move size={25}/><strong>Nothing selected</strong><p>Pick an object on the canvas or add a text or image layer.</p><button className="button button-paper button-small" onClick={addText}>Add text</button></div>}
        {textSelected && <>
          <div className="control-group"><label className="control-label" htmlFor="object-name">Layer name</label><input id="object-name" className="editor-input" value={textSelected.name} onChange={(event) => patchObject(textSelected.id, { name: event.target.value })}/></div>
          <div className="control-group"><label className="control-label" htmlFor="object-text">Your text</label><textarea id="object-text" className="editor-input" rows={4} maxLength={500} value={textSelected.text} onChange={(event) => patchObject(textSelected.id, { text: event.target.value })} placeholder="Write your caption..."/></div>
          <div className="control-group"><label className="control-label" htmlFor="object-font">Typeface</label><select id="object-font" className="editor-select" value={textSelected.fontFamily} onChange={(event) => patchObject(textSelected.id, { fontFamily: event.target.value })}><option>Impact</option><option>Arial Black</option><option>Arial</option><option>Georgia</option></select></div>
          <div className="control-group"><label className="control-label" htmlFor="object-size">Font size <span>{textSelected.fontSize}px</span></label><input id="object-size" className="editor-range" type="range" min="12" max="180" value={textSelected.fontSize} onChange={(event) => patchObject(textSelected.id, { fontSize: Number(event.target.value) })}/></div>
          <div className="control-group"><label className="control-label" htmlFor="object-colour">Text colour</label><input id="object-colour" className="editor-color-input" type="color" value={textSelected.color} onChange={(event) => patchObject(textSelected.id, { color: event.target.value })}/></div>
          <div className="control-group"><label className="control-label">Alignment</label><div className="editor-field-grid">{(["left","center","right"] as const).map((value) => <button key={value} className={textSelected.align === value ? "filter-pill active" : "filter-pill"} onClick={() => patchObject(textSelected.id, { align: value })}>{value[0].toUpperCase() + value.slice(1)}</button>)}</div></div>
          <div className="inspector-toggle-row"><label htmlFor="object-uppercase">Uppercase</label><input id="object-uppercase" type="checkbox" checked={textSelected.uppercase} onChange={(event) => patchObject(textSelected.id, { uppercase: event.target.checked })}/></div>
          <div className="inspector-toggle-row"><label htmlFor="object-outline">Text outline</label><input id="object-outline" type="checkbox" checked={textSelected.outline} onChange={(event) => patchObject(textSelected.id, { outline: event.target.checked })}/></div>
          {textSelected.outline && <><div className="control-group"><label className="control-label" htmlFor="outline-color">Outline colour</label><input id="outline-color" className="editor-color-input" type="color" value={textSelected.outlineColor} onChange={(event) => patchObject(textSelected.id, { outlineColor: event.target.value })}/></div><div className="control-group"><label className="control-label" htmlFor="outline-width">Outline thickness <span>{textSelected.outlineWidth}</span></label><input id="outline-width" className="editor-range" type="range" min="0" max="12" value={textSelected.outlineWidth} onChange={(event) => patchObject(textSelected.id, { outlineWidth: Number(event.target.value) })}/></div></>}
          <div className="inspector-toggle-row"><label htmlFor="object-shadow">Drop shadow</label><input id="object-shadow" type="checkbox" checked={textSelected.shadow} onChange={(event) => patchObject(textSelected.id, { shadow: event.target.checked })}/></div>
        </>}
        {imageSelected && <>
          <div className="control-group"><label className="control-label" htmlFor="image-layer-name">Layer name</label><input id="image-layer-name" className="editor-input" value={imageSelected.name} onChange={(event) => patchObject(imageSelected.id, { name: event.target.value })}/></div>
          <div className="control-group"><label className="control-label" htmlFor="image-fit">Image fit</label><select id="image-fit" className="editor-select" value={imageSelected.fit} onChange={(event) => patchObject(imageSelected.id, { fit: event.target.value as "cover" | "contain" })}><option value="contain">Fit inside frame</option><option value="cover">Fill frame</option></select></div>
          <div className="control-group"><label className="control-label" htmlFor="overlay-opacity">Opacity <span>{Math.round(imageSelected.opacity * 100)}%</span></label><input id="overlay-opacity" className="editor-range" type="range" min="0" max="1" step=".05" value={imageSelected.opacity} onChange={(event) => patchObject(imageSelected.id, { opacity: Number(event.target.value) })}/></div>
        </>}
        {selected && <>
          <div className="sidebar-divider"/><div className="panel-label">Transform</div>
          <div className="control-group"><label className="control-label" htmlFor="layer-rotation">Rotation <span>{selected.rotation}°</span></label><input id="layer-rotation" className="editor-range" type="range" min="-180" max="180" value={selected.rotation} onChange={(event) => patchObject(selected.id, { rotation: Number(event.target.value) })}/></div>
          <div className="dimension-inputs inspector-dimensions"><label>X position<input type="number" min="0" max="100" value={Math.round(selected.x)} onChange={(event) => patchObject(selected.id, { x: Math.max(0, Math.min(100, Number(event.target.value))) })}/></label><label>Y position<input type="number" min="0" max="100" value={Math.round(selected.y)} onChange={(event) => patchObject(selected.id, { y: Math.max(0, Math.min(100, Number(event.target.value))) })}/></label></div>
          <div className="control-group"><label className="control-label" htmlFor="layer-width">Width <span>{Math.round(selected.w)}%</span></label><input id="layer-width" className="editor-range" type="range" min="6" max="100" value={selected.w} onChange={(event) => patchObject(selected.id, { w: Number(event.target.value) })}/></div>
          <div className="control-group"><label className="control-label" htmlFor="layer-height">Height <span>{Math.round(selected.h)}%</span></label><input id="layer-height" className="editor-range" type="range" min="6" max="100" value={selected.h} onChange={(event) => patchObject(selected.id, { h: Number(event.target.value) })}/></div>
          <div className="inspector-toggle-row"><label htmlFor="layer-visible">Visible</label><input id="layer-visible" type="checkbox" checked={selected.opacity > 0} onChange={(event) => patchObject(selected.id, { opacity: event.target.checked ? 1 : 0 })}/></div>
          <div className="editor-object-actions"><button className="button button-paper button-small" onClick={duplicateSelected}><Copy size={14}/> Duplicate</button><button className="button button-paper button-small" onClick={deleteSelected}><Trash2 size={14}/> Delete</button></div>
        </>}
        <div className="sidebar-divider"/>
        <button className="button button-dark editor-full-button" onClick={downloadMeme}><Download size={15}/> Export {canvasWidth} × {canvasHeight}</button>
        <button className="button button-paper button-small editor-full-button" onClick={saveDraft}><Save size={14}/> Save to studio</button>
      </aside>
    </div>
    {notice && <div className="editor-toast"><div className="toast">{notice}</div></div>}
  </main>;
}
